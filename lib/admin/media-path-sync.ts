import type { Prisma } from "@prisma/client";

import { getSiteSettings, type SiteMediaSlotsShape } from "@/lib/admin/settings";
import { prisma } from "@/lib/db/prisma";

function replaceInGallery(gallery: Prisma.JsonValue | null, oldPath: string, newPath: string) {
  if (!Array.isArray(gallery)) {
    return { gallery, changed: false };
  }

  let changed = false;
  const next = gallery.map((entry) => {
    if (typeof entry === "string" && entry === oldPath) {
      changed = true;
      return newPath;
    }
    return entry;
  });

  return { gallery: next, changed };
}

function replaceInMediaSlots(slots: SiteMediaSlotsShape, oldPath: string, newPath: string) {
  let changed = false;

  const replaceValue = (value: string | null | undefined) => {
    if (value === oldPath) {
      changed = true;
      return newPath;
    }
    return value ?? null;
  };

  const next: SiteMediaSlotsShape = {
    ...slots,
    logoImage: replaceValue(slots.logoImage),
    footerBrandImage: replaceValue(slots.footerBrandImage),
    aboutImage: replaceValue(slots.aboutImage),
    heroPortrait: replaceValue(slots.heroPortrait),
    homeGallery: slots.homeGallery.map((slot) => {
      const src = replaceValue(slot.src);
      return src === slot.src ? slot : { ...slot, src: src ?? slot.src };
    }),
    homeDirections: slots.homeDirections.map((slot) => {
      const image = replaceValue(slot.image);
      return image === slot.image ? slot : { ...slot, image: image ?? slot.image };
    })
  };

  if (
    next.logoImage !== slots.logoImage ||
    next.footerBrandImage !== slots.footerBrandImage ||
    next.aboutImage !== slots.aboutImage ||
    next.heroPortrait !== slots.heroPortrait ||
    JSON.stringify(next.homeGallery) !== JSON.stringify(slots.homeGallery) ||
    JSON.stringify(next.homeDirections) !== JSON.stringify(slots.homeDirections)
  ) {
    changed = true;
  }

  return { slots: next, changed };
}

export async function propagateMediaPathChange(oldPath: string, newPath: string) {
  if (oldPath === newPath) {
    return { productsUpdated: 0, servicesUpdated: 0, siteSettingsUpdated: false };
  }

  let productsUpdated = 0;
  let servicesUpdated = 0;

  for (const product of await prisma.product.findMany()) {
    let image = product.image;
    let gallery = product.gallery;
    let changed = false;

    if (image === oldPath) {
      image = newPath;
      changed = true;
    }

    const galleryResult = replaceInGallery(gallery, oldPath, newPath);
    if (galleryResult.changed) {
      gallery = galleryResult.gallery;
      changed = true;
    }

    if (changed) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          image,
          gallery: gallery as Prisma.InputJsonValue
        }
      });
      productsUpdated += 1;
    }
  }

  for (const service of await prisma.service.findMany()) {
    let image = service.image;
    let gallery = service.gallery;
    let changed = false;

    if (image === oldPath) {
      image = newPath;
      changed = true;
    }

    const galleryResult = replaceInGallery(gallery, oldPath, newPath);
    if (galleryResult.changed) {
      gallery = galleryResult.gallery;
      changed = true;
    }

    if (changed) {
      await prisma.service.update({
        where: { id: service.id },
        data: {
          image,
          gallery: gallery as Prisma.InputJsonValue
        }
      });
      servicesUpdated += 1;
    }
  }

  const current = await getSiteSettings();
  const { slots, changed: siteSettingsUpdated } = replaceInMediaSlots(
    current.mediaSlots,
    oldPath,
    newPath
  );

  if (siteSettingsUpdated) {
    await prisma.siteSetting.upsert({
      where: { key: "site_settings" },
      update: { value: { ...current, mediaSlots: slots } as Prisma.InputJsonValue },
      create: { key: "site_settings", value: { ...current, mediaSlots: slots } as Prisma.InputJsonValue }
    });
  }

  return { productsUpdated, servicesUpdated, siteSettingsUpdated };
}

export async function revalidateMediaPathChange(oldPath: string, newPath: string) {
  const { revalidatePath } = await import("next/cache");

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/products");
  revalidatePath("/services");
  revalidatePath("/admin/media");
  revalidatePath("/admin/media/site");

  const slugs = await Promise.all([
    prisma.product.findMany({
      where: { OR: [{ image: oldPath }, { image: newPath }] },
      select: { slug: true }
    }),
    prisma.service.findMany({
      where: { OR: [{ image: oldPath }, { image: newPath }] },
      select: { slug: true }
    })
  ]);

  for (const product of slugs[0]) {
    revalidatePath(`/products/${product.slug}`);
  }

  for (const service of slugs[1]) {
    revalidatePath(`/services/${service.slug}`);
  }
}
