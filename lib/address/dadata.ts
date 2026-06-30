export type AddressSuggestion = {
  country: string | null;
  region: string | null;
  city: string | null;
  street: string | null;
  house: string | null;
  flat: string | null;
  postalCode: string | null;
  full: string;
  provider: string;
  meta: Record<string, unknown>;
};

export type AddressProviderReason =
  | "missing_key"
  | "disabled"
  | "no_results"
  | "provider_error"
  | "query_too_short"
  | null;

export type AddressSuggestResult = {
  suggestions: AddressSuggestion[];
  providerEnabled: boolean;
  reason: AddressProviderReason;
  message?: string;
};

type DaDataSuggestion = {
  value?: string;
  unrestricted_value?: string;
  data?: {
    country?: string;
    region_with_type?: string;
    city_with_type?: string;
    city?: string;
    settlement_with_type?: string;
    settlement?: string;
    block_type?: string;
    block?: string;
    street_with_type?: string;
    street?: string;
    house?: string;
    flat?: string;
    postal_code?: string;
    geo_lat?: string;
    geo_lon?: string;
    fias_id?: string;
  };
};

export function isAddressProviderConfigured(): boolean {
  const apiKey = process.env.DADATA_API_KEY?.trim();
  const provider = process.env.ADDRESS_SUGGEST_PROVIDER ?? "dadata";
  return Boolean(apiKey) && provider === "dadata";
}

function normalizeDaDataItem(item: DaDataSuggestion): AddressSuggestion {
  const data = item.data ?? {};
  const city = data.city_with_type ?? data.settlement_with_type ?? data.city ?? data.settlement ?? null;
  const street = data.street_with_type ?? data.street ?? null;
  const houseParts = [data.house, data.block_type && data.block ? `${data.block_type} ${data.block}` : data.block].filter(
    Boolean
  );

  return {
    country: data.country ?? "Россия",
    region: data.region_with_type ?? null,
    city,
    street,
    house: houseParts.length > 0 ? houseParts.join(" ") : null,
    flat: data.flat ?? null,
    postalCode: data.postal_code ?? null,
    full: item.unrestricted_value ?? item.value ?? "",
    provider: "dadata",
    meta: {
      fiasId: data.fias_id ?? null,
      geoLat: data.geo_lat ?? null,
      geoLon: data.geo_lon ?? null
    }
  };
}

export async function suggestAddresses(query: string): Promise<AddressSuggestResult> {
  const trimmed = query.trim();

  if (trimmed.length < 3) {
    return {
      suggestions: [],
      providerEnabled: isAddressProviderConfigured(),
      reason: "query_too_short"
    };
  }

  if (!isAddressProviderConfigured()) {
    return {
      suggestions: [],
      providerEnabled: false,
      reason: process.env.DADATA_API_KEY?.trim() ? "disabled" : "missing_key",
      message: "Подсказки адреса временно недоступны. Заполните адрес вручную."
    };
  }

  const apiKey = process.env.DADATA_API_KEY!.trim();
  const secret = process.env.DADATA_SECRET_KEY?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Token ${apiKey}`
  };

  if (secret) {
    headers["X-Secret"] = secret;
  }

  try {
    const response = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address", {
      method: "POST",
      headers,
      body: JSON.stringify({ query: trimmed, count: 8 }),
      cache: "no-store"
    });

    if (!response.ok) {
      console.error("[address-suggest] DaData HTTP", response.status);
      return {
        suggestions: [],
        providerEnabled: true,
        reason: "provider_error",
        message: "Подсказки адреса временно недоступны. Заполните адрес вручную."
      };
    }

    const payload = (await response.json()) as { suggestions?: DaDataSuggestion[] };
    const suggestions = (payload.suggestions ?? []).map(normalizeDaDataItem).filter((item) => item.full);

    if (suggestions.length === 0) {
      return {
        suggestions: [],
        providerEnabled: true,
        reason: "no_results",
        message: "Адрес не найден. Попробуйте уточнить запрос или заполните вручную."
      };
    }

    return {
      suggestions,
      providerEnabled: true,
      reason: null
    };
  } catch (error) {
    console.error("[address-suggest] DaData request failed", error instanceof Error ? error.message : "unknown");
    return {
      suggestions: [],
      providerEnabled: true,
      reason: "provider_error",
      message: "Подсказки адреса временно недоступны. Заполните адрес вручную."
    };
  }
}
