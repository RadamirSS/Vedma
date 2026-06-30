"use client";

import Link from "next/link";

import { LocaleSwitcher } from "@/components/locale-switcher";
import type { SiteSettingsShape } from "@/lib/admin/settings";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";

export function Footer({
  settings,
  locale,
  dict
}: {
  settings: SiteSettingsShape;
  locale: Locale;
  dict: Dictionary;
}) {
  const homeHref = localizeHref(locale, "/");
  const disclaimer = locale === "en" ? dict.footer.disclaimer : settings.footer.disclaimer;
  const footerLead = locale === "en" ? dict.meta.defaultDescription : settings.footer.description;

  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link href={homeHref} className="brand">
            {settings.mediaSlots.footerBrandImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="brand-logo brand-logo--footer"
                src={settings.mediaSlots.footerBrandImage}
                alt={settings.mediaSlots.logoAlt}
              />
            ) : (
              <>
                <span className="sigil">Б</span>
                <span>
                  <span className="brand-name">{dict.header.brandName}</span>
                  <span className="brand-sub">{dict.header.brandSub}</span>
                </span>
              </>
            )}
          </Link>
          <p className="footer-lead">{footerLead}</p>
          <span className="age">18+</span>
        </div>
        <div>
          <h4>{dict.footer.navigation}</h4>
          <div className="footer-links">
            <Link href={localizeHref(locale, "/services")}>{dict.header.services}</Link>
            <Link href={localizeHref(locale, "/products")}>{dict.header.shop}</Link>
            <Link href={localizeHref(locale, "/about")}>{dict.header.about}</Link>
            <Link href={localizeHref(locale, "/reviews")}>{dict.header.reviews}</Link>
          </div>
        </div>
        <div>
          <h4>{dict.footer.contacts}</h4>
          <div className="footer-links">
            <a href={settings.socialLinks.telegram} target="_blank" rel="noreferrer">
              {dict.footer.telegram}
            </a>
            <Link href={localizeHref(locale, "/contacts")}>{dict.header.contacts}</Link>
            <Link href={localizeHref(locale, "/cart")}>{dict.footer.cart}</Link>
          </div>
        </div>
        <div>
          <h4>{dict.footer.aboutService}</h4>
          <p>{disclaimer}</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>{settings.footer.copyright}</p>
        <p>
          <Link href={localizeHref(locale, "/legal")}>{dict.footer.privacy}</Link> · {dict.footer.offer}
        </p>
        <LocaleSwitcher dict={dict} />
      </div>
    </footer>
  );
}
