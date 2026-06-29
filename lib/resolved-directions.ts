import { serviceDirections } from "@/lib/service-directions";
import type { SiteMediaSlotsShape } from "@/lib/admin/settings";

export function getResolvedServiceDirections(mediaSlots: SiteMediaSlotsShape) {
  return serviceDirections.map((direction) => {
    const override = mediaSlots.homeDirections.find((slot) => slot.id === direction.id);
    return {
      ...direction,
      image: override?.image?.trim() ? override.image : direction.image
    };
  });
}
