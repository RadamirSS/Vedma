import Link from "next/link";

import { ServiceDirectionsGrid } from "@/components/service-directions-grid";
import { SectionHeading } from "@/components/section-heading";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/ru";
import { localizeHref } from "@/lib/i18n/routing";

export function HomeDirections({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow={dict.home.directionsEyebrow}
          title={dict.home.directionsTitle}
          text={dict.home.directionsText}
        />
        <ServiceDirectionsGrid locale={locale} dict={dict} />
        <div className="section-link-row">
          <Link className="btn btn-ghost" href={localizeHref(locale, "/services")}>
            {dict.home.allDirections}
          </Link>
        </div>
      </div>
    </section>
  );
}
