"use client";

import { usePathname } from "next/navigation";

import { useCart } from "@/components/cart-context";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";
import { getLocaleFromPathname } from "@/lib/i18n/routing";

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
  const pathname = usePathname();
  const { addItem } = useCart();
  const dict = getDictionarySync(getLocaleFromPathname(pathname));

  return (
    <button
      type="button"
      className={className}
      onClick={() => addItem({ type: itemType, slug })}
    >
      {label ?? dict.catalog.addToCart}
    </button>
  );
}
