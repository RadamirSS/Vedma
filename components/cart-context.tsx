"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { getAllItems } from "@/lib/mock-data";

type CartEntry = {
  id: string;
  qty: number;
};

type CartContextValue = {
  items: CartEntry[];
  count: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (id: string) => void;
  changeQty: (id: string, delta: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const allItems = getAllItems();

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("bazhena-cart");
    if (saved) {
      setItems(JSON.parse(saved) as CartEntry[]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("bazhena-cart", JSON.stringify(items));
  }, [items]);

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, entry) => {
    const item = allItems.find((value) => value.id === entry.id);
    return sum + (item?.price ?? 0) * entry.qty;
  }, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      total,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addToCart: (id) => {
        setItems((current) => {
          const existing = current.find((entry) => entry.id === id);
          if (existing) {
            return current.map((entry) =>
              entry.id === id ? { ...entry, qty: entry.qty + 1 } : entry
            );
          }
          return [...current, { id, qty: 1 }];
        });
        setIsOpen(true);
      },
      changeQty: (id, delta) => {
        setItems((current) =>
          current
            .map((entry) =>
              entry.id === id ? { ...entry, qty: entry.qty + delta } : entry
            )
            .filter((entry) => entry.qty > 0)
        );
      },
      clearCart: () => setItems([])
    }),
    [count, isOpen, items, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used within CartProvider");
  }
  return value;
}
