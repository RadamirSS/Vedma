import Link from "next/link";
import type { Route } from "next";

import type { ServiceDirection } from "@/lib/service-directions";

export function ServiceDirectionCard({ direction }: { direction: ServiceDirection }) {
  const isExternal = direction.external || direction.href.startsWith("http");
  const className = `direction-card direction-card--${direction.accent}`;

  const content = (
    <>
      <div className="direction-card__visual">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={direction.image} alt="" loading="lazy" />
        <span className="direction-card__overlay" />
      </div>
      <div className="direction-card__body">
        <h3>{direction.title}</h3>
        <p>{direction.description}</p>
        <span className="btn btn-ghost btn-small direction-card__cta">{direction.linkLabel}</span>
      </div>
    </>
  );

  if (isExternal) {
    return (
      <a className={className} href={direction.href} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link className={className} href={direction.href as Route}>
      {content}
    </Link>
  );
}
