"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  startTransition,
  type ReactNode
} from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname, localizeHref } from "@/lib/i18n/routing";

type CartEntry = {
  type: "product" | "service";
  slug: string;
  qty: number;
};

type ResolvedCartItem = {
  catalogId: string | null;
  slug: string;
  type: "product" | "service";
  title: string;
  image?: string;
  quantity: number;
  maxQuantity: number | null;
  unitAmount: number;
  currency: "RUB" | "USD";
  priceRub: number | null;
  priceUsd: number | null;
  detailHref: string;
  sourceId?: string;
};

type CartContextValue = {
  items: CartEntry[];
  resolvedItems: ResolvedCartItem[];
  count: number;
  total: number;
  totalRub: number;
  totalUsd: number;
  deliveryRequired: boolean;
  isPending: boolean;
  resolveError: string | null;
  cartUnavailable: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (entry: Omit<CartEntry, "qty">) => void;
  changeQty: (type: CartEntry["type"], slug: string, delta: number) => void;
  clearCart: () => void;
  setOpen: (value: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "bazhena-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const [items, setItems] = useState<CartEntry[]>([]);
  const [resolvedItems, setResolvedItems] = useState<ResolvedCartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalRub, setTotalRub] = useState(0);
  const [totalUsd, setTotalUsd] = useState(0);
  const [deliveryRequired, setDeliveryRequired] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setItems(JSON.parse(saved) as CartEntry[]);
    }
  }, [isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    let aborted = false;

    async function syncResolvedCart() {
      if (items.length === 0) {
        setResolvedItems([]);
        setTotal(0);
        setTotalRub(0);
        setTotalUsd(0);
        setDeliveryRequired(false);
        setResolveError(null);
        setIsPending(false);
        return;
      }

      setIsPending(true);
      setResolveError(null);

      try {
        const response = await fetch("/api/cart/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: items })
        });

        if (aborted) {
          return;
        }

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setResolvedItems([]);
          setTotal(0);
          setTotalRub(0);
          setTotalUsd(0);
          setDeliveryRequired(false);
          setResolveError(
            payload?.error ?? "Не удалось загрузить корзину. Обновите страницу и попробуйте снова."
          );
          setIsPending(false);
          return;
        }

        const data = (await response.json()) as {
          items: ResolvedCartItem[];
          totals: {
            totalAmount: number;
            totalAmountRub: number;
            totalAmountUsd: number;
            deliveryRequired: boolean;
          };
        };

        if (aborted) {
          return;
        }

        const locale = getLocaleFromPathname(pathname);
        setResolvedItems(
          data.items.map((item) => ({
            ...item,
            detailHref: localizeHref(locale, item.detailHref)
          }))
        );
        setTotal(data.totals.totalAmount);
        setTotalRub(data.totals.totalAmountRub);
        setTotalUsd(data.totals.totalAmountUsd);
        setDeliveryRequired(data.totals.deliveryRequired);
        setResolveError(null);
        setIsPending(false);
      } catch {
        if (aborted) {
          return;
        }
        setResolvedItems([]);
        setTotal(0);
        setTotalRub(0);
        setTotalUsd(0);
        setDeliveryRequired(false);
        setResolveError("Не удалось загрузить корзину. Проверьте соединение и обновите страницу.");
        setIsPending(false);
      }
    }

    startTransition(() => {
      void syncResolvedCart();
    });

    return () => {
      aborted = true;
    };
  }, [items, isAdminRoute, pathname]);

  const cartUnavailable =
    items.length > 0 && resolvedItems.length === 0 && !isPending && !resolveError;
  const count = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextValue = {
    items,
    resolvedItems,
    count,
    total,
    totalRub,
    totalUsd,
    deliveryRequired,
    isPending,
    resolveError,
    cartUnavailable,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem: (entry) => {
      setItems((current) => {
        const existing = current.find(
          (currentEntry) =>
            currentEntry.type === entry.type && currentEntry.slug === entry.slug
        );

        if (existing) {
          return current.map((currentEntry) =>
            currentEntry.type === entry.type && currentEntry.slug === entry.slug
              ? {
                  ...currentEntry,
                  qty: entry.type === "service" ? 1 : currentEntry.qty + 1
                }
              : currentEntry
          );
        }
        return [...current, { ...entry, qty: 1 }];
      });
      setIsOpen(true);
    },
    changeQty: (type, slug, delta) => {
      setItems((current) =>
        current
          .map((entry) =>
            entry.type === type && entry.slug === slug
              ? {
                  ...entry,
                  qty: type === "service" ? 1 : entry.qty + delta
                }
              : entry
          )
          .filter((entry) => entry.qty > 0)
      );
    },
    clearCart: () => setItems([]),
    setOpen: (value) => setIsOpen(value)
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }
  return value;
}
