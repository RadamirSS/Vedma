import type {
  AvailabilityStatus,
  ContactMethod,
  OrderStatus,
  PaymentStatus,
  PublicationStatus,
  RequestStatus,
  Role
} from "@prisma/client";

import type { CommerceScope } from "@/lib/admin/commerce-filters";
import type { AdminDictionary } from "@/lib/i18n/admin/dictionaries/ru";

export function getPublicationOptions(
  dict: AdminDictionary
): Array<{ value: PublicationStatus; label: string }> {
  return [
    { value: "DRAFT", label: dict.enums.publication.DRAFT },
    { value: "PUBLISHED", label: dict.enums.publication.PUBLISHED },
    { value: "ARCHIVED", label: dict.enums.publication.ARCHIVED }
  ];
}

export function getAvailabilityOptions(
  dict: AdminDictionary
): Array<{ value: AvailabilityStatus; label: string }> {
  return [
    { value: "IN_STOCK", label: dict.enums.availability.IN_STOCK },
    { value: "ON_REQUEST", label: dict.enums.availability.ON_REQUEST },
    { value: "OUT_OF_STOCK", label: dict.enums.availability.OUT_OF_STOCK },
    { value: "UNKNOWN", label: dict.enums.availability.UNKNOWN }
  ];
}

export function getOrderStatusLabels(dict: AdminDictionary): Record<OrderStatus, string> {
  return { ...dict.enums.orderStatus };
}

export function getPaymentStatusLabels(dict: AdminDictionary): Record<PaymentStatus, string> {
  return { ...dict.enums.paymentStatus };
}

export function getRequestStatusLabels(dict: AdminDictionary): Record<RequestStatus, string> {
  return { ...dict.enums.requestStatus };
}

export function getContactMethodLabels(dict: AdminDictionary): Record<ContactMethod, string> {
  return { ...dict.enums.contactMethod };
}

export function getUserRoleOptions(
  dict: AdminDictionary
): Array<{ value: Extract<Role, "ADMIN" | "MANAGER" | "DEMO">; label: string }> {
  return [
    { value: "ADMIN", label: dict.enums.userRoles.ADMIN },
    { value: "MANAGER", label: dict.enums.userRoles.MANAGER },
    { value: "DEMO", label: dict.enums.userRoles.DEMO }
  ];
}

export function getCommerceScopeTabs(
  dict: AdminDictionary
): Array<{ value: CommerceScope; label: string }> {
  return [
    { value: "production", label: dict.filters.commerceScope.production },
    { value: "test", label: dict.filters.commerceScope.test },
    { value: "all", label: dict.filters.commerceScope.all }
  ];
}

export function getProductCategoryOptions(
  dict: AdminDictionary
): Array<{ value: string; label: string }> {
  return Object.entries(dict.enums.productCategories).map(([value, label]) => ({
    value,
    label
  }));
}

export function getServiceCategoryOptions(
  dict: AdminDictionary
): Array<{ value: string; label: string }> {
  return Object.entries(dict.enums.serviceCategories).map(([value, label]) => ({
    value,
    label
  }));
}

export function getOrderStatusOptions(
  dict: AdminDictionary
): Array<{ value: OrderStatus; label: string }> {
  return Object.entries(dict.enums.orderStatus).map(([value, label]) => ({
    value: value as OrderStatus,
    label
  }));
}

export function getPaymentStatusOptions(
  dict: AdminDictionary
): Array<{ value: PaymentStatus; label: string }> {
  return Object.entries(dict.enums.paymentStatus).map(([value, label]) => ({
    value: value as PaymentStatus,
    label
  }));
}

export function getRequestStatusOptions(
  dict: AdminDictionary
): Array<{ value: RequestStatus; label: string }> {
  return Object.entries(dict.enums.requestStatus).map(([value, label]) => ({
    value: value as RequestStatus,
    label
  }));
}

export function getCategoryDisplayLabel(
  categoryValue: string | null | undefined,
  dict: AdminDictionary
): string {
  if (!categoryValue) {
    return dict.common.emDash;
  }

  const productLabel =
    dict.enums.productCategories[categoryValue as keyof typeof dict.enums.productCategories];
  if (productLabel) {
    return productLabel;
  }

  const serviceLabel =
    dict.enums.serviceCategories[categoryValue as keyof typeof dict.enums.serviceCategories];
  if (serviceLabel) {
    return serviceLabel;
  }

  return categoryValue;
}
