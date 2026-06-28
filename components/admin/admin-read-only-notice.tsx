export function AdminReadOnlyNotice({
  title = "Демо-режим",
  text = "Этот аккаунт работает только на просмотр. Изменение данных, загрузки и доступ к приватным PDF отключены."
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="admin-notice">
      <strong>{title}</strong>
      <div>{text}</div>
    </div>
  );
}
