import { createHash, randomBytes } from "node:crypto";

import { Role, type Session, type User } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

export const ADMIN_SESSION_COOKIE = "vedma_admin_session";
export const CUSTOMER_SESSION_COOKIE = "vedma_customer_session";
const SESSION_TTL_DAYS = 14;

type SessionWithUser = Session & { user: User };

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildAdminLoginRedirect(nextPath?: string) {
  const value = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  return `/admin/login${value}`;
}

function buildCustomerLoginRedirect(nextPath?: string) {
  const value = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  return `/account/login${value}`;
}

function buildAdminForbiddenRedirect() {
  return `/admin/dashboard?error=${encodeURIComponent("Недостаточно прав")}`;
}

async function createScopedSession(userId: string, cookieName: string) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      expiresAt,
      userId
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

async function clearScopedSession(cookieName: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) }
    });
  }

  cookieStore.delete(cookieName);
}

async function readScopedSession(
  cookieName: string,
  allowedRoles: Role[]
): Promise<SessionWithUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: true
    }
  });

  if (!session) {
    cookieStore.delete(cookieName);
    return null;
  }

  if (
    session.expiresAt <= new Date() ||
    !session.user.isActive ||
    !allowedRoles.includes(session.user.role)
  ) {
    await prisma.session.delete({ where: { id: session.id } });
    cookieStore.delete(cookieName);
    return null;
  }

  return session;
}

export async function createAdminSession(userId: string) {
  await createScopedSession(userId, ADMIN_SESSION_COOKIE);
}

export async function createCustomerSession(userId: string) {
  await createScopedSession(userId, CUSTOMER_SESSION_COOKIE);
}

export async function clearAdminSession() {
  await clearScopedSession(ADMIN_SESSION_COOKIE);
}

export async function clearCustomerSession() {
  await clearScopedSession(CUSTOMER_SESSION_COOKIE);
}

export async function getCurrentAdminSession() {
  return readScopedSession(ADMIN_SESSION_COOKIE, [Role.ADMIN, Role.MANAGER]);
}

export async function getCurrentCustomerSession() {
  return readScopedSession(CUSTOMER_SESSION_COOKIE, [Role.CUSTOMER]);
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return user;
}

export async function requireAdminSession(nextPath?: string) {
  const session = await getCurrentAdminSession();
  if (!session) {
    redirect(buildAdminLoginRedirect(nextPath));
  }
  return session;
}

export async function requireRole(roles: Role[], nextPath?: string) {
  const session = await requireAdminSession(nextPath);
  if (!roles.includes(session.user.role)) {
    redirect(buildAdminForbiddenRedirect());
  }
  return session;
}

export async function requireAdmin(nextPath?: string) {
  return requireRole([Role.ADMIN], nextPath);
}

export async function requireManagerOrAdmin(nextPath?: string) {
  return requireRole([Role.ADMIN, Role.MANAGER], nextPath);
}

export async function requireCustomerSession(nextPath?: string) {
  const session = await getCurrentCustomerSession();
  if (!session) {
    redirect(buildCustomerLoginRedirect(nextPath));
  }
  return session;
}
