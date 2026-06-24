import { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  text,
  children
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div>
        <p>{text}</p>
        {children}
      </div>
    </div>
  );
}
