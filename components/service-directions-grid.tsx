import { ServiceDirectionCard } from "@/components/service-direction-card";
import { serviceDirections } from "@/lib/service-directions";

export function ServiceDirectionsGrid({ id }: { id?: string }) {
  return (
    <div className="directions-grid" id={id}>
      {serviceDirections.map((direction) => (
        <ServiceDirectionCard key={direction.id} direction={direction} />
      ))}
    </div>
  );
}
