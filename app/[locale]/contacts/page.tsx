import Link from "next/link";

import { SectionHeading } from "@/components/section-heading";
import { getSiteSettings } from "@/lib/admin/settings";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { localizeHref } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ContactsPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings();
  const responseHours =
    locale === "en" ? dict.pages.contacts.defaultResponseHours : settings.contacts.responseHours;
  const workFormat =
    locale === "en" ? dict.pages.contacts.defaultWorkFormat : settings.contacts.workFormat;

  const contacts = [
    { label: dict.pages.contacts.telegram, value: settings.contacts.telegram },
    { label: dict.pages.contacts.phone, value: settings.contacts.phone },
    { label: dict.pages.contacts.email, value: settings.contacts.email },
    { label: dict.pages.contacts.responseHours, value: responseHours },
    { label: dict.pages.contacts.workFormat, value: workFormat }
  ].filter((item) => item.value);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow={dict.pages.contacts.eyebrow}
          title={dict.pages.contacts.title}
          text={dict.pages.contacts.text}
        />
        <div className="detail-grid">
          <article className="form-card">
            <h3>{dict.pages.contacts.channelsTitle}</h3>
            <div className="contact-list">
              {contacts.map((item) => (
                <div key={item.label} className="summary-line">
                  <span>{item.label}</span>
                  <b>{item.value}</b>
                </div>
              ))}
            </div>
          </article>
          <article className="cart-summary">
            <h3>{dict.pages.contacts.quickNavTitle}</h3>
            <p className="muted">{dict.pages.contacts.quickNavText}</p>
            <div className="hero-actions stack-top">
              <Link className="btn btn-primary" href={localizeHref(locale, "/services")}>
                {dict.pages.contacts.servicesCatalog}
              </Link>
              <Link className="btn btn-ghost" href={localizeHref(locale, "/checkout")}>
                {dict.pages.contacts.orderForm}
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
