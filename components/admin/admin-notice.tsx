export function AdminNotice({
  success,
  error
}: {
  success?: string;
  error?: string;
}) {
  if (!success && !error) {
    return null;
  }

  return (
    <div className={`admin-notice ${error ? "admin-notice--error" : "admin-notice--success"}`}>
      {error ?? success}
    </div>
  );
}
