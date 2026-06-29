import { ServiceDirectionCard } from "@/components/service-direction-card";
import { getSiteSettings } from "@/lib/admin/settings";
import { getResolvedServiceDirections } from "@/lib/resolved-directions";

export async function ServiceDirectionsGrid({ id }: { id?: string }) {
  const settings = await getSiteSettings();
  const directions = getResolvedServiceDirections(settings.mediaSlots);

  return (
    <div className="directions-grid" id={id}>
      {directions.map((direction) => (
        <ServiceDirectionCard key={direction.id} direction={direction} />
      ))}
    </div>
  );
}
