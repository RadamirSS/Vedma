import { getSiteSettings } from "@/lib/admin/settings";
import { GALLERY_IMAGES } from "@/lib/site-images";
import { resolveSiteImage } from "@/lib/site-media";

export async function VisualGallery() {
  const settings = await getSiteSettings();
  const gallery = settings.mediaSlots.homeGallery.map((slot, index) => ({
    src: resolveSiteImage(slot.src, GALLERY_IMAGES[index]?.src ?? slot.src),
    alt: slot.alt || GALLERY_IMAGES[index]?.alt || slot.label
  }));

  return (
    <section className="section section--tight">
      <div className="container">
        <div className="visual-gallery">
          {gallery.map((image) => (
            <figure key={`${image.src}-${image.alt}`} className="visual-gallery__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.alt} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
