export type CartEntry = {
  type: "product" | "service";
  slug: string;
  qty: number;
};

export const CART_STORAGE_KEY = "bazhena-cart";

function isValidType(value: unknown): value is CartEntry["type"] {
  return value === "product" || value === "service";
}

function normalizeEntry(raw: unknown): CartEntry | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;
  if (!isValidType(record.type)) {
    return null;
  }

  const slug = typeof record.slug === "string" ? record.slug.trim() : "";
  if (!slug) {
    return null;
  }

  const qtyRaw = Number(record.qty);
  if (!Number.isFinite(qtyRaw) || qtyRaw <= 0) {
    return null;
  }

  const qty = record.type === "service" ? 1 : Math.floor(qtyRaw);
  return { type: record.type, slug, qty };
}

export function safeReadCartFromStorage(): CartEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      console.warn("[cart] Invalid cart storage shape; resetting cart.");
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }

    const entries = parsed.map(normalizeEntry).filter((entry): entry is CartEntry => entry !== null);
    if (entries.length !== parsed.length) {
      console.warn("[cart] Invalid cart entries removed from storage.");
      safeWriteCartToStorage(entries);
    }

    return entries;
  } catch {
    console.warn("[cart] Failed to parse cart storage; resetting cart.");
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // ignore
    }
    return [];
  }
}

export function safeWriteCartToStorage(entries: CartEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.warn("[cart] Failed to persist cart storage.", error);
  }
}

export function sumCartQuantity(entries: CartEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.qty, 0);
}
