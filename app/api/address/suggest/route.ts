import { NextResponse } from "next/server";

import { suggestAddresses } from "@/lib/address/dadata";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string };
    const query = typeof body.query === "string" ? body.query : "";
    const suggestions = await suggestAddresses(query);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
