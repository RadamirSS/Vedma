import { createHash, randomBytes } from "node:crypto";

import { Role, type User } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE = "vedma_admin_session";
const SESSION_TTL_DAYS = 14;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildLoginRedirect(nextPath?: string) {
  const value = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  return `/admin/login${value}`;
}

function buildCustomerLoginRedirect(nextPath?: string) {
  const value = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
  return `/account/login${value}`;
}

export async function createUserSession(userId: string) {
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
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });
}

export async function clearCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) }
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

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
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  if (session.expiresAt <= new Date() || !session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } });
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  return session?.user ?? null;
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

export async function requireUserSession(nextPath?: string) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(buildCustomerLoginRedirect(nextPath));
  }
  return session;
}

export async function requireAdminSession(nextPath?: string) {
  const session = await getCurrentSession();
  if (!session) {
    redirect(buildLoginRedirect(nextPath));
  }
  return session;
}

export async function requireRole(roles: Role[], nextPath?: string) {
  const session = await requireAdminSession(nextPath);
  if (!roles.includes(session.user.role)) {
    redirect("/admin/dashboard?error=Недостаточно+прав");
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
  const session = await requireUserSession(nextPath);
  if (session.user.role !== "CUSTOMER") {
    redirect("/account?error=Недостаточно+прав");
  }
  return session;
}

export async function requireCustomerOrAdminSession(nextPath?: string) {
  const session = await requireUserSession(nextPath);
  if (!["CUSTOMER", "ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/account?error=Недостаточно+прав");
  }
  return session;
}
