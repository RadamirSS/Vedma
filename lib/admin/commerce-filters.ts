import type { Prisma, Role } from "@prisma/client";

export type CommerceScope = "production" | "test" | "all";

const SCOPE_VALUES: CommerceScope[] = ["production", "test", "all"];

export function parseCommerceScope(value?: string | null): CommerceScope | null {
  if (!value) {
    return null;
  }
  return SCOPE_VALUES.includes(value as CommerceScope) ? (value as CommerceScope) : null;
}

export function resolveCommerceScope(role: Role, scopeParam?: string | null): CommerceScope {
  const parsed = parseCommerceScope(scopeParam);

  if (role === "DEMO") {
    return "test";
  }

  if (role === "MANAGER") {
    return "production";
  }

  return parsed ?? "production";
}

function isTestWhere(scope: CommerceScope): Prisma.OrderWhereInput | undefined {
  if (scope === "production") {
    return { isTest: false };
  }
  if (scope === "test") {
    return { isTest: true };
  }
  return undefined;
}

export function orderListWhere(
  role: Role,
  scopeParam?: string | null,
  extra?: Prisma.OrderWhereInput
): Prisma.OrderWhereInput {
  const scope = resolveCommerceScope(role, scopeParam);
  const testFilter = isTestWhere(scope);

  if (!extra) {
    return testFilter ?? {};
  }

  if (!testFilter) {
    return extra;
  }

  return { AND: [testFilter, extra] };
}

export function requestListWhere(
  role: Role,
  scopeParam?: string | null,
  extra?: Prisma.RequestWhereInput
): Prisma.RequestWhereInput {
  const scope = resolveCommerceScope(role, scopeParam);
  const testFilter =
    scope === "production" ? { isTest: false } : scope === "test" ? { isTest: true } : undefined;

  if (!extra) {
    return testFilter ?? {};
  }

  if (!testFilter) {
    return extra;
  }

  return { AND: [testFilter, extra] };
}

export function paymentListWhere(
  role: Role,
  scopeParam?: string | null,
  extra?: Prisma.PaymentWhereInput
): Prisma.PaymentWhereInput {
  const scope = resolveCommerceScope(role, scopeParam);
  const testFilter =
    scope === "production" ? { isTest: false } : scope === "test" ? { isTest: true } : undefined;

  if (!extra) {
    return testFilter ?? {};
  }

  if (!testFilter) {
    return extra;
  }

  return { AND: [testFilter, extra] };
}

export function canAccessTestScope(role: Role) {
  return role === "ADMIN";
}

export function isTestOrderEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }
  return /^test\+pkg33/i.test(email) || process.env.CHECKOUT_TEST_MODE === "true";
}

export function resolveCheckoutTestFlags(email: string) {
  const isTest = isTestOrderEmail(email);
  return {
    isTest,
    testLabel: isTest ? "e2e-smoke" : null
  };
}
