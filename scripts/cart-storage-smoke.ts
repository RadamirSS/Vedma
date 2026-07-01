import {
  CART_STORAGE_KEY,
  safeReadCartFromStorage,
  safeWriteCartToStorage,
  sumCartQuantity,
  type CartEntry
} from "../lib/commerce/cart-storage";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function withMockStorage(initial: string | null, run: () => void) {
  const store = new Map<string, string>();
  if (initial !== null) {
    store.set(CART_STORAGE_KEY, initial);
  }

  const originalWindow = globalThis.window;
  const original = globalThis.localStorage;
  const mock = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    }
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { localStorage: mock }
  });
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: mock
  });

  try {
    run();
  } finally {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: original
    });
  }
}

function testValidCart() {
  withMockStorage(
    JSON.stringify([
      { type: "product", slug: "braslet", qty: 2 },
      { type: "service", slug: "diagnostika-negativa", qty: 3 }
    ]),
    () => {
      const entries = safeReadCartFromStorage();
      assert(entries.length === 2, "expected two valid entries");
      assert(entries[1].qty === 1, "service qty should normalize to 1");
      assert(sumCartQuantity(entries) === 3, "expected quantity sum of 3");
    }
  );
}

function testInvalidJson() {
  withMockStorage("{bad", () => {
    const entries = safeReadCartFromStorage();
    assert(entries.length === 0, "invalid JSON should reset cart");
    assert(globalThis.localStorage.getItem(CART_STORAGE_KEY) === null, "storage should be cleared");
  });
}

function testInvalidShape() {
  withMockStorage(JSON.stringify({ type: "product", slug: "x", qty: 1 }), () => {
    const entries = safeReadCartFromStorage();
    assert(entries.length === 0, "non-array payload should reset cart");
  });
}

function testWriteFailureSafe() {
  withMockStorage(null, () => {
    const entries: CartEntry[] = [{ type: "product", slug: "test", qty: 1 }];
    safeWriteCartToStorage(entries);
    assert(globalThis.localStorage.getItem(CART_STORAGE_KEY) !== null, "valid write should persist");
  });
}

function main() {
  testValidCart();
  testInvalidJson();
  testInvalidShape();
  testWriteFailureSafe();
  console.log("cart-storage-smoke: ok");
}

main();
