export function SoftTrustNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="muted soft-trust-notice">
        Работа ведётся бережно и конфиденциально. Товары и услуги доступны для клиентов 18+.
      </p>
    );
  }

  return (
    <div className="notice notice--soft">
      Работа ведётся бережно и конфиденциально. Товары и услуги доступны для клиентов 18+.
    </div>
  );
}
