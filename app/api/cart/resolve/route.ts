import { NextResponse } from "next/server";

import { getCartTotals, resolveCartEntries, type CartEntry } from "@/lib/commerce/cart";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionarySync } from "@/lib/i18n/get-dictionary";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    entries?: CartEntry[];
    locale?: string;
  } | null;
  const locale: Locale = body?.locale && isLocale(body.locale) ? body.locale : defaultLocale;
  const dict = getDictionarySync(locale);
  const entries = Array.isArray(body?.entries) ? body.entries : [];

  try {
    const resolvedItems = await resolveCartEntries(entries, locale);
    const totals = getCartTotals(resolvedItems);

    return NextResponse.json({
      items: resolvedItems,
      totals
    });
  } catch (error) {
    console.error("[cart/resolve]", error);
    return NextResponse.json({ error: dict.cart.resolveServerFailed }, { status: 500 });
  }
}
