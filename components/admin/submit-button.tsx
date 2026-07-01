"use client";

import { useContext } from "react";
import { useFormStatus } from "react-dom";

import { AdminI18nContext } from "@/components/admin/admin-i18n-provider";

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
  const adminI18n = useContext(AdminI18nContext);
  const fallbackPending = pendingLabel ?? adminI18n?.dict.common.pendingDefault ?? "...";

  return (
    <button className={className} type="submit" disabled={pending}>
      {pending ? fallbackPending : children}
    </button>
  );
}
