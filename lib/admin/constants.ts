import type {
  AvailabilityStatus,
  ContactMethod,
  OrderStatus,
  PaymentStatus,
  PublicationStatus,
  RequestStatus,
  Role
} from "@prisma/client";

export const ADMIN_ROLES: Role[] = ["ADMIN", "MANAGER"];

export const PUBLICATION_OPTIONS: Array<{ value: PublicationStatus; label: string }> = [
  { value: "DRAFT", label: "Черновик" },
  { value: "PUBLISHED", label: "Опубликовано" },
  { value: "ARCHIVED", label: "Скрыто" }
];

export const AVAILABILITY_OPTIONS: Array<{ value: AvailabilityStatus; label: string }> = [
  { value: "IN_STOCK", label: "В наличии" },
  { value: "ON_REQUEST", label: "Под заказ" },
  { value: "OUT_OF_STOCK", label: "Нет в наличии" },
  { value: "UNKNOWN", label: "Не указано" }
];

export const PRODUCT_CATEGORY_OPTIONS = [
  "Браслеты",
  "Камни",
  "Алтарные товары",
  "Декор",
  "Свечи",
  "Обереги",
  "Подарки",
  "Прочее"
] as const;

export const SERVICE_CATEGORY_OPTIONS = [
  "Самопознание и практики",
  "Деньги и успех",
  "Диагностика",
  "Трансформационные игры",
  "Консультации",
  "Прочее"
] as const;

export const USER_ROLE_OPTIONS: Array<{ value: Extract<Role, "ADMIN" | "MANAGER">; label: string }> =
  [
    { value: "ADMIN", label: "Администратор" },
    { value: "MANAGER", label: "Менеджер" }
  ];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Новый",
  PENDING_CONFIRMATION: "Ожидает подтверждения",
  AWAITING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачен",
  IN_PROGRESS: "В работе",
  READY_TO_SHIP: "Готов к отправке",
  SHIPPED: "Отправлен",
  COMPLETED: "Завершен",
  CANCELLED: "Отменен",
  REFUNDED: "Возврат"
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  NOT_ISSUED: "Не выставлен",
  INVOICE_SENT: "Реквизиты отправлены",
  PENDING: "Ожидается платеж",
  PAID: "Оплачен",
  PARTIAL: "Частично оплачен",
  FAILED: "Ошибка платежа",
  EXPIRED: "Просрочен",
  REFUNDED: "Возврат",
  CANCELLED: "Отменен"
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  WAITING_FOR_CLIENT: "Ждем клиента",
  AWAITING_PAYMENT: "Ждет оплаты",
  PAID: "Оплачена",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
  SPAM: "Спам"
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  TELEGRAM: "Telegram",
  PHONE: "Телефон",
  EMAIL: "Email",
  VK: "VK",
  WHATSAPP: "WhatsApp"
};

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
  value: value as OrderStatus,
  label
}));

export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
  value: value as PaymentStatus,
  label
}));

export const REQUEST_STATUS_OPTIONS = Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({
  value: value as RequestStatus,
  label
}));
