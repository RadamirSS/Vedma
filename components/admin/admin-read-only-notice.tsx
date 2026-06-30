"use client";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";

export function AdminReadOnlyNotice({
  title,
  text
}: {
  title?: string;
  text?: string;
}) {
  const { dict } = useAdminI18n();

  return (
    <div className="admin-notice">
      <strong>{title ?? dict.demoMode.title}</strong>
      <div>{text ?? dict.demoMode.defaultText}</div>
    </div>
  );
}
