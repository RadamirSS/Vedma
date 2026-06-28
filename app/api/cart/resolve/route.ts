import { NextResponse } from "next/server";

import { getCartTotals, resolveCartEntries, type CartEntry } from "@/lib/commerce/cart";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { entries?: CartEntry[] } | null;
  const entries = Array.isArray(body?.entries) ? body.entries : [];
  const resolvedItems = await resolveCartEntries(entries);
  const totals = getCartTotals(resolvedItems);

  return NextResponse.json({
    items: resolvedItems,
    totals
  });
}
