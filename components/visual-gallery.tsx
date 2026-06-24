import { GALLERY_IMAGES } from "@/lib/site-images";

export function VisualGallery() {
  return (
    <section className="section section--tight">
      <div className="container">
        <div className="visual-gallery">
          {GALLERY_IMAGES.map((image) => (
            <figure key={image.src} className="visual-gallery__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.src} alt={image.alt} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
