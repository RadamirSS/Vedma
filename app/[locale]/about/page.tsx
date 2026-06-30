import Link from "next/link";
import type { Metadata } from "next";

import { SectionHeading } from "@/components/section-heading";
import { aboutDirections, benefits } from "@/lib/mock-data";
import { getSiteSettings } from "@/lib/admin/settings";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";
import { PORTRAIT_IMAGE } from "@/lib/site-images";
import { resolveSiteImage } from "@/lib/site-media";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return {
    title: dict.pages.about.metaTitle,
    description: dict.pages.about.metaDescription
  };
}

export default async function AboutPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings();
  const aboutImage = resolveSiteImage(settings.mediaSlots.aboutImage, PORTRAIT_IMAGE);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow={dict.pages.about.eyebrow}
          title={dict.pages.about.title}
          text={dict.pages.about.text}
        />
        <div className="about-block">
          <div className="portrait portrait--image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={aboutImage} alt={dict.meta.siteName} />
          </div>
          <div className="about-text">
            <h3>{dict.pages.about.heading}</h3>
            <p>{dict.pages.about.paragraph1}</p>
            <p>{dict.pages.about.paragraph2}</p>
            <div className="directions">
              {aboutDirections.map((direction) => (
                <div key={direction} className="direction">
                  {direction}
                </div>
              ))}
            </div>
            <div className="benefits-grid compact-grid">
              {benefits.slice(0, 3).map((benefit) => (
                <article key={benefit} className="benefit-card benefit-card--text">
                  <p>{benefit}</p>
                </article>
              ))}
            </div>
            <Link className="btn btn-primary" href={localizeHref(locale, "/contacts")}>
              {dict.pages.about.contact}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
