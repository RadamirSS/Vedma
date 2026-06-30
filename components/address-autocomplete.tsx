"use client";

import { useEffect, useMemo, useState } from "react";

import type { AddressProviderReason, AddressSuggestion } from "@/lib/address/dadata";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";

export type AddressFormValues = {
  addressFull: string;
  addressProvider: string;
  addressMeta: string;
  country: string;
  region: string;
  city: string;
  street: string;
  house: string;
  flat: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
};

const emptyValues: AddressFormValues = {
  addressFull: "",
  addressProvider: "",
  addressMeta: "",
  country: "",
  region: "",
  city: "",
  street: "",
  house: "",
  flat: "",
  postalCode: "",
  addressLine1: "",
  addressLine2: ""
};

type AddressAutocompleteProps = {
  disabled?: boolean;
  fieldErrors?: Record<string, string>;
  defaultValues?: Partial<AddressFormValues>;
  dict: Dictionary;
};

type SuggestResponse = {
  suggestions?: AddressSuggestion[];
  providerEnabled?: boolean;
  reason?: AddressProviderReason;
  message?: string;
};

function suggestionToValues(suggestion: AddressSuggestion): AddressFormValues {
  return {
    addressFull: suggestion.full,
    addressProvider: suggestion.provider,
    addressMeta: JSON.stringify(suggestion.meta),
    country: suggestion.country ?? "",
    region: suggestion.region ?? "",
    city: suggestion.city ?? "",
    street: suggestion.street ?? "",
    house: suggestion.house ?? "",
    flat: suggestion.flat ?? "",
    postalCode: suggestion.postalCode ?? "",
    addressLine1: suggestion.full,
    addressLine2: ""
  };
}

export function AddressAutocomplete({
  disabled = false,
  fieldErrors = {},
  defaultValues,
  dict
}: AddressAutocompleteProps) {
  const t = dict.address;
  const [query, setQuery] = useState(defaultValues?.addressFull ?? defaultValues?.addressLine1 ?? "");
  const [values, setValues] = useState<AddressFormValues>({
    ...emptyValues,
    country: defaultValues?.country ?? "",
    region: defaultValues?.region ?? "",
    city: defaultValues?.city ?? "",
    street: defaultValues?.street ?? "",
    house: defaultValues?.house ?? "",
    flat: defaultValues?.flat ?? "",
    postalCode: defaultValues?.postalCode ?? "",
    addressLine1: defaultValues?.addressLine1 ?? "",
    addressLine2: defaultValues?.addressLine2 ?? "",
    addressFull: defaultValues?.addressFull ?? "",
    addressProvider: defaultValues?.addressProvider ?? "",
    addressMeta: defaultValues?.addressMeta ?? ""
  });
  const [selectedLabel, setSelectedLabel] = useState<string | null>(
    defaultValues?.addressFull || defaultValues?.addressLine1 || null
  );
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [providerEnabled, setProviderEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(Boolean(defaultValues?.addressLine1 && !defaultValues?.addressFull));

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  const showManualFields = manualMode || !providerEnabled;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/address/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: "abc" })
        });
        const payload = (await response.json()) as SuggestResponse;
        if (!cancelled && payload.providerEnabled === false) {
          setProviderEnabled(false);
          setManualMode(true);
          setStatusMessage(t.providerUnavailable);
        }
      } catch {
        // ignore mount probe errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t.providerUnavailable]);

  useEffect(() => {
    if (!providerEnabled && !manualMode) {
      setManualMode(true);
    }
  }, [providerEnabled, manualMode]);

  useEffect(() => {
    if (disabled || debouncedQuery.length < 3 || selectedLabel || manualMode) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setStatusMessage(t.searching);
      try {
        const response = await fetch("/api/address/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: debouncedQuery }),
          signal: controller.signal
        });
        const payload = (await response.json()) as SuggestResponse;
        const nextSuggestions = payload.suggestions ?? [];
        setSuggestions(nextSuggestions);
        setProviderEnabled(payload.providerEnabled ?? false);

        if (payload.reason === "no_results") {
          setStatusMessage(t.addressNotFound);
        } else if (!payload.providerEnabled) {
          setStatusMessage(t.providerUnavailable);
        } else if (nextSuggestions.length > 0) {
          setStatusMessage(null);
        } else {
          setStatusMessage(null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setStatusMessage(t.providerUnavailable);
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
  }, [
    debouncedQuery,
    disabled,
    manualMode,
    selectedLabel,
    t.addressNotFound,
    t.providerUnavailable,
    t.searching
  ]);

  function applySuggestion(suggestion: AddressSuggestion) {
    const next = suggestionToValues(suggestion);
    setValues(next);
    setQuery(suggestion.full);
    setSelectedLabel(suggestion.full);
    setSuggestions([]);
    setStatusMessage(null);
    setManualMode(false);
  }

  function updateManualField(name: keyof AddressFormValues, value: string) {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      if (name !== "addressFull" && name !== "addressLine1") {
        const parts = [next.street, next.house, next.flat, next.city, next.country].filter(Boolean);
        if (parts.length > 0) {
          next.addressLine1 = parts.slice(0, 3).join(", ");
        }
      }
      if (name === "addressLine1") {
        next.addressFull = value;
      }
      return next;
    });
    setSelectedLabel(null);
  }

  function clearSelection() {
    setSelectedLabel(null);
    setQuery("");
    setValues(emptyValues);
    setManualMode(!providerEnabled);
  }

  const addressError =
    fieldErrors.addressFull ??
    fieldErrors.addressLine1 ??
    fieldErrors.country ??
    fieldErrors.city ??
    fieldErrors.street;

  return (
    <div className="address-autocomplete field full">
      <label htmlFor="addressSuggest">{t.deliveryAddress}</label>
      <input
        id="addressSuggest"
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedLabel(null);
          setValues((prev) => ({ ...prev, addressFull: event.target.value, addressLine1: event.target.value }));
        }}
        placeholder={t.placeholder}
        disabled={disabled || Boolean(selectedLabel && !manualMode)}
        autoComplete="off"
        aria-invalid={addressError ? true : undefined}
        className={addressError ? "input-error" : undefined}
      />
      {isLoading ? <p className="address-status muted">{t.searching}</p> : null}
      {!isLoading && statusMessage ? <p className="address-status muted">{statusMessage}</p> : null}
      {suggestions.length > 0 ? (
        <ul className="address-suggestions" role="listbox" aria-label={t.suggestionsAria}>
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.full}-${suggestion.postalCode ?? ""}`}>
              <button type="button" onClick={() => applySuggestion(suggestion)}>
                {suggestion.full}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {selectedLabel && !manualMode ? (
        <div className="address-selected-card">
          <p>
            {t.selectedPrefix} <strong>{selectedLabel}</strong>
          </p>
          <div className="address-selected-actions">
            <button type="button" className="text-link" onClick={() => setManualMode(true)}>
              {t.editManually}
            </button>
            <button type="button" className="text-link" onClick={clearSelection}>
              {t.change}
            </button>
          </div>
        </div>
      ) : null}
      {!selectedLabel && providerEnabled ? (
        <button type="button" className="text-link address-manual-toggle" onClick={() => setManualMode(true)}>
          {t.editManually}
        </button>
      ) : null}
      {showManualFields ? (
        <div className="address-manual-fields form-grid stack-top">
          <div className={`field ${fieldErrors.country ? "has-error" : ""}`}>
            <label htmlFor="country">{t.country}</label>
            <input
              id="country"
              value={values.country}
              onChange={(e) => updateManualField("country", e.target.value)}
              placeholder={t.countryPlaceholder}
              aria-invalid={fieldErrors.country ? true : undefined}
            />
            {fieldErrors.country ? <span className="field-error">{fieldErrors.country}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="region">{t.region}</label>
            <input
              id="region"
              value={values.region}
              onChange={(e) => updateManualField("region", e.target.value)}
              placeholder={t.regionPlaceholder}
            />
          </div>
          <div className={`field ${fieldErrors.city ? "has-error" : ""}`}>
            <label htmlFor="city">{t.city}</label>
            <input
              id="city"
              value={values.city}
              onChange={(e) => updateManualField("city", e.target.value)}
              placeholder={t.cityPlaceholder}
              aria-invalid={fieldErrors.city ? true : undefined}
            />
            {fieldErrors.city ? <span className="field-error">{fieldErrors.city}</span> : null}
          </div>
          <div className={`field ${fieldErrors.street ? "has-error" : ""}`}>
            <label htmlFor="street">{t.street}</label>
            <input
              id="street"
              value={values.street}
              onChange={(e) => updateManualField("street", e.target.value)}
              placeholder={t.streetPlaceholder}
              aria-invalid={fieldErrors.street ? true : undefined}
            />
            {fieldErrors.street ? <span className="field-error">{fieldErrors.street}</span> : null}
          </div>
          <div className="field">
            <label htmlFor="house">{t.house}</label>
            <input
              id="house"
              value={values.house}
              onChange={(e) => updateManualField("house", e.target.value)}
              placeholder={t.housePlaceholder}
            />
          </div>
          <div className="field">
            <label htmlFor="flat">{t.apartment}</label>
            <input
              id="flat"
              value={values.flat}
              onChange={(e) => updateManualField("flat", e.target.value)}
              placeholder={t.apartmentPlaceholder}
            />
          </div>
          <div className="field">
            <label htmlFor="postalCode">{t.postalCode}</label>
            <input
              id="postalCode"
              value={values.postalCode}
              onChange={(e) => updateManualField("postalCode", e.target.value)}
              placeholder="101000"
            />
          </div>
          <div className={`field full ${fieldErrors.addressLine1 ? "has-error" : ""}`}>
            <label htmlFor="addressLine2Manual">{t.addressDetails}</label>
            <input
              id="addressLine2Manual"
              value={values.addressLine2}
              onChange={(e) => updateManualField("addressLine2", e.target.value)}
              placeholder={t.entrancePlaceholder}
            />
          </div>
        </div>
      ) : null}
      {addressError ? <span className="field-error">{addressError}</span> : null}
      <input type="hidden" name="addressFull" value={values.addressFull} />
      <input type="hidden" name="addressProvider" value={values.addressProvider} />
      <input type="hidden" name="addressMeta" value={values.addressMeta} />
      <input type="hidden" name="country" value={values.country} />
      <input type="hidden" name="region" value={values.region} />
      <input type="hidden" name="city" value={values.city} />
      <input type="hidden" name="street" value={values.street} />
      <input type="hidden" name="house" value={values.house} />
      <input type="hidden" name="flat" value={values.flat} />
      <input type="hidden" name="postalCode" value={values.postalCode} />
      <input type="hidden" name="addressLine1" value={values.addressLine1 || values.addressFull} />
      <input type="hidden" name="addressLine2" value={values.addressLine2} />
    </div>
  );
}
