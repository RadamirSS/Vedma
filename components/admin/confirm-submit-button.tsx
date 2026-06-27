"use client";

import { MouseEvent } from "react";

import { SubmitButton } from "@/components/admin/submit-button";

export function ConfirmSubmitButton({
  children,
  message,
  className,
  pendingLabel
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
  pendingLabel?: string;
}) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  }

  return (
    <span onClickCapture={handleClick}>
      <SubmitButton className={className} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
    </span>
  );
}
