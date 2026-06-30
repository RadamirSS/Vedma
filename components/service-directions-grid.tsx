import { ServiceDirectionCard } from "@/components/service-direction-card";
import { getSiteSettings } from "@/lib/admin/settings";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { getLocalizedDirections } from "@/lib/i18n/localized-directions";

export async function ServiceDirectionsGrid({
  id,
  locale,
  dict
}: {
  id?: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const settings = await getSiteSettings();
  const directions = getLocalizedDirections(dict, locale).map((direction) => {
    const override = settings.mediaSlots.homeDirections.find((slot) => slot.id === direction.id);
    return {
      ...direction,
      image: override?.image?.trim() ? override.image : direction.image
    };
  });

  return (
    <div className="directions-grid" id={id}>
      {directions.map((direction) => (
        <ServiceDirectionCard key={direction.id} direction={direction} />
      ))}
    </div>
  );
}
