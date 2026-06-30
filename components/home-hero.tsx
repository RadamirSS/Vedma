import Link from "next/link";

import type { SiteSettingsShape } from "@/lib/admin/settings";
import { resolveSiteImage } from "@/lib/site-media";
import { PORTRAIT_IMAGE } from "@/lib/site-images";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";

export async function HomeHero({
  locale,
  dict,
  settings
}: {
  locale: Locale;
  dict: Dictionary;
  settings: SiteSettingsShape;
}) {
  const heroImage = resolveSiteImage(settings.mediaSlots.heroPortrait, PORTRAIT_IMAGE);
  const heroAlt = settings.mediaSlots.heroPortraitAlt || dict.home.heroTitle;

  const useSettingsCopy = locale === "ru";
  const eyebrow = useSettingsCopy ? settings.homepage.eyebrow : dict.home.heroEyebrow;
  const titleTop = useSettingsCopy
    ? (settings.homepage.title.split("—")[0]?.trim() ?? dict.home.heroTitle)
    : dict.home.heroTitle;
  const titleAccent = useSettingsCopy
    ? (settings.homepage.title.split("—").slice(1).join("—").trim() || dict.home.heroTitleAccent)
    : dict.home.heroTitleAccent;
  const lead = useSettingsCopy ? settings.homepage.lead : dict.home.heroLead;
  const description = useSettingsCopy ? settings.homepage.description : dict.home.heroDescription;
  const primaryLabel = useSettingsCopy ? settings.homepage.primaryLabel : dict.home.chooseService;
  const secondaryLabel = useSettingsCopy ? settings.homepage.secondaryLabel : dict.home.goToShop;
  const telegramLabel = useSettingsCopy ? settings.homepage.telegramLabel : dict.home.bookTelegram;

  return (
    <section className="hero section">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h1>
            {titleTop}
            <br />
            <span className="gold">{titleAccent}</span>
          </h1>
          <p className="lead">{lead}</p>
          <p className="text">{description}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href={localizeHref(locale, "/services")}>
              {primaryLabel}
            </Link>
            <Link className="btn btn-ghost" href={localizeHref(locale, "/products")}>
              {secondaryLabel}
            </Link>
            <a
              className="btn btn-wine"
              href={settings.socialLinks.telegram}
              target="_blank"
              rel="noreferrer"
            >
              {telegramLabel}
            </a>
          </div>
          <div className="trust">
            <span className="pill">{dict.home.trustConfidential}</span>
            <span className="pill">{dict.home.trustOnline}</span>
            <span className="pill">{dict.home.trustAge}</span>
            <span className="pill">{dict.home.trustIndividual}</span>
          </div>
        </div>

        <div className="hero-card hero-card--image" aria-label={heroAlt}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-card__photo" src={heroImage} alt={heroAlt} />
          <div className="hero-card__glow" />
        </div>
      </div>
    </section>
  );
}
