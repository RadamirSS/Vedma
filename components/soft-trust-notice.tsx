export function SoftTrustNotice({ compact = false, text }: { compact?: boolean; text: string }) {
  if (compact) {
    return <p className="muted soft-trust-notice">{text}</p>;
  }

  return <div className="notice notice--soft">{text}</div>;
}
