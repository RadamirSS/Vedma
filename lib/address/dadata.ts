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

type DaDataSuggestion = {
  value?: string;
  unrestricted_value?: string;
  data?: {
    country?: string;
    region_with_type?: string;
    city_with_type?: string;
    city?: string;
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

function normalizeDaDataItem(item: DaDataSuggestion): AddressSuggestion {
  const data = item.data ?? {};
  const city = data.city_with_type ?? data.city ?? null;
  const street = data.street_with_type ?? data.street ?? null;

  return {
    country: data.country ?? "Россия",
    region: data.region_with_type ?? null,
    city,
    street,
    house: data.house ?? null,
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

export async function suggestAddresses(query: string): Promise<AddressSuggestion[]> {
  const apiKey = process.env.DADATA_API_KEY?.trim();
  if (!apiKey || query.trim().length < 3) {
    return [];
  }

  const provider = process.env.ADDRESS_SUGGEST_PROVIDER ?? "dadata";
  if (provider !== "dadata") {
    return [];
  }

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
      body: JSON.stringify({ query: query.trim(), count: 8 }),
      cache: "no-store"
    });

    if (!response.ok) {
      return [];
    }

    const payload = (await response.json()) as { suggestions?: DaDataSuggestion[] };
    return (payload.suggestions ?? []).map(normalizeDaDataItem).filter((item) => item.full);
  } catch {
    return [];
  }
}
