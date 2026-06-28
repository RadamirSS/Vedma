"use client";

import { useCart } from "@/components/cart-context";

export function AddToCartButton({
  itemType,
  slug,
  className,
  label
}: {
  itemType: "product" | "service";
  slug: string;
  className?: string;
  label?: string;
}) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      className={className}
      onClick={() => addItem({ type: itemType, slug })}
    >
      {label ?? "В корзину"}
    </button>
  );
}
