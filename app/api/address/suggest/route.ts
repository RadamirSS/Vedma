import { NextResponse } from "next/server";

import { suggestAddresses } from "@/lib/address/dadata";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { query?: string };
    const query = typeof body.query === "string" ? body.query : "";
    const result = await suggestAddresses(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[address-suggest] route error", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({
      suggestions: [],
      providerEnabled: false,
      reason: "provider_error",
      message: "Подсказки адреса временно недоступны. Заполните адрес вручную."
    });
  }
}
