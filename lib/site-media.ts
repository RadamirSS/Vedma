import { GALLERY_IMAGES, PORTRAIT_IMAGE } from "@/lib/site-images";
import { serviceDirections } from "@/lib/service-directions";
import type { SiteMediaSlotsShape } from "@/lib/admin/settings";

export const DEFAULT_MEDIA_SLOTS: SiteMediaSlotsShape = {
  logoImage: null,
  logoAlt: "Бажена — Магия жизни",
  heroPortrait: PORTRAIT_IMAGE,
  heroPortraitAlt: "Бажена — портрет",
  homeGallery: GALLERY_IMAGES.map((item, index) => ({
    src: item.src,
    alt: item.alt,
    label: `Галерея на главной — изображение ${index + 1}`
  })),
  homeDirections: serviceDirections.map((direction) => ({
    id: direction.id,
    image: direction.image,
    alt: direction.title
  })),
  footerBrandImage: null,
  aboutImage: PORTRAIT_IMAGE
};

export function resolveSiteImage(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

export function mergeMediaSlots(partial?: Partial<SiteMediaSlotsShape> | null): SiteMediaSlotsShape {
  const defaults = DEFAULT_MEDIA_SLOTS;

  return {
    logoImage: partial?.logoImage ?? defaults.logoImage,
    logoAlt: partial?.logoAlt ?? defaults.logoAlt,
    heroPortrait: partial?.heroPortrait ?? defaults.heroPortrait,
    heroPortraitAlt: partial?.heroPortraitAlt ?? defaults.heroPortraitAlt,
    homeGallery: defaults.homeGallery.map((slot, index) => ({
      ...slot,
      ...(partial?.homeGallery?.[index] ?? {})
    })),
    homeDirections: defaults.homeDirections.map((slot) => {
      const override = partial?.homeDirections?.find((item) => item.id === slot.id);
      return { ...slot, ...(override ?? {}) };
    }),
    footerBrandImage: partial?.footerBrandImage ?? defaults.footerBrandImage,
    aboutImage: partial?.aboutImage ?? defaults.aboutImage
  };
}

export function getResolvedMediaSlots(settings: { mediaSlots?: Partial<SiteMediaSlotsShape> }) {
  return mergeMediaSlots(settings.mediaSlots);
}
