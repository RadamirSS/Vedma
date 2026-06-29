"use client";

import { useEffect, useMemo, useState } from "react";

import type { AddressSuggestion } from "@/lib/address/dadata";

type AddressAutocompleteProps = {
  disabled?: boolean;
};

export function AddressAutocomplete({ disabled = false }: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [providerEnabled, setProviderEnabled] = useState(true);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (disabled || debouncedQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/address/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: debouncedQuery }),
          signal: controller.signal
        });
        const payload = (await response.json()) as { suggestions?: AddressSuggestion[] };
        const nextSuggestions = payload.suggestions ?? [];
        setSuggestions(nextSuggestions);
        if (debouncedQuery.length >= 3 && nextSuggestions.length === 0) {
          setProviderEnabled(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [debouncedQuery, disabled]);

  function applySuggestion(suggestion: AddressSuggestion) {
    const setValue = (name: string, value: string | null) => {
      const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
      if (input) {
        input.value = value ?? "";
      }
    };

    setValue("country", suggestion.country);
    setValue("region", suggestion.region);
    setValue("city", suggestion.city);
    setValue("street", suggestion.street);
    setValue("house", suggestion.house);
    setValue("flat", suggestion.flat);
    setValue("postalCode", suggestion.postalCode);
    setValue("addressLine1", suggestion.full);
    setValue("addressFull", suggestion.full);
    setValue("addressProvider", suggestion.provider);

    const metaInput = document.querySelector<HTMLInputElement>('input[name="addressMeta"]');
    if (metaInput) {
      metaInput.value = JSON.stringify(suggestion.meta);
    }

    setQuery(suggestion.full);
    setSuggestions([]);
  }

  return (
    <div className="address-autocomplete field full">
      <label htmlFor="addressSuggest">Начните вводить адрес доставки</label>
      <input
        id="addressSuggest"
        name="addressSuggest"
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Улица, дом, город"
        disabled={disabled}
        autoComplete="off"
      />
      <small className="muted">
        {providerEnabled
          ? "Выберите подсказку или заполните поля вручную ниже."
          : "Если нужного адреса нет в подсказках, заполните поля вручную."}
      </small>
      {isLoading ? <p className="muted">Ищем адрес...</p> : null}
      {suggestions.length > 0 ? (
        <ul className="address-suggestions" role="listbox">
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.full}-${suggestion.postalCode ?? ""}`}>
              <button type="button" onClick={() => applySuggestion(suggestion)}>
                {suggestion.full}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <input type="hidden" name="addressFull" defaultValue="" />
      <input type="hidden" name="addressProvider" defaultValue="" />
      <input type="hidden" name="addressMeta" defaultValue="" />
    </div>
  );
}
