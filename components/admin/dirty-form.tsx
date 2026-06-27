"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  children: React.ReactNode;
  className?: string;
};

export function DirtyForm({ action, children, className }: Props) {
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (isDirty && !isSubmitting) {
        event.preventDefault();
        event.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        setIsSubmitting(true);
        await action(formData);
      }}
      className={className}
      onChange={() => setIsDirty(true)}
      onSubmit={() => setIsSubmitting(true)}
    >
      {children}
      {isDirty ? <p className="admin-form-hint">Есть несохраненные изменения.</p> : null}
    </form>
  );
}
