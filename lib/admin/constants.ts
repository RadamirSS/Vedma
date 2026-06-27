import type { AvailabilityStatus, PublicationStatus, Role } from "@prisma/client";

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
