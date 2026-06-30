"use client";

import { useFormStatus } from "react-dom";

import { useAdminI18n } from "@/components/admin/admin-i18n-provider";

export function SubmitButton({
  children,
  className,
  pendingLabel
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const { dict } = useAdminI18n();

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? pendingLabel ?? dict.common.pendingDefault : children}
    </button>
  );
}
