export function AdminEmptyState({
  title,
  text,
  href,
  cta
}: {
  title: string;
  text: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="admin-empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {href && cta ? (
        <a className="btn btn-primary btn-small" href={href}>
          {cta}
        </a>
      ) : null}
    </div>
  );
}
