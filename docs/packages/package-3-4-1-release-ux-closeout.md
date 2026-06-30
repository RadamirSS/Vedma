# Package 3.4.1 — Release UX Closeout

Date: 2026-06-29  
Branch: `cursor/package-3-4-production-ordering-polish`  
Status: `IN_REVIEW`

## Summary

Package 3.4.1 closes release-blocking customer UX issues after Package 3.4: fixes customer login/register, removes confusing header CTA and scary disclaimers, improves checkout copy and validation messaging, adds a manual payment placeholder (“Я оплатил”), and polishes the customer cabinet.

## Customer auth fixes

- `customerRegisterAction`: successful `redirect()` moved outside `try/catch` so Next.js `NEXT_REDIRECT` is not swallowed
- `/account` redirects anonymous users to login and blocks admin/manager/demo sessions
- Customer login rejects non-`CUSTOMER` roles with a friendly message
- Registration creates `CUSTOMER`, `CustomerProfile`, session, and redirects to `/account`
- Internal admin emails blocked at registration with a safe friendly error

## Header cleanup

- Removed duplicate header button “Оформить”
- Kept “Кабинет” → `/account` and cart drawer with count
- Checkout still reachable from cart drawer and `/cart`

## Disclaimer removal

- Replaced scary medical/professional-help warnings with soft 18+ trust copy
- Footer block renamed from “Дисклеймер” to “О сервисе”
- `LegalNotice` softened; product/service/checkout use `SoftTrustNotice`
- Legal page keeps privacy/offer without medical warnings

## Checkout copy and validation

- Product checkout info text only appears in the form (not before validation)
- Wording: reservation after successful order, admin confirms stock and sends requisites
- Success panel appears only after real order creation
- Server errors shown without success-like messaging

## Manual payment placeholder

Flow:

1. Checkout creates order
2. `CheckoutSuccessPanel` shows order number and “Я оплатил”
3. `customerMarkOrderPaidAction` / `customerMarkOrderPaidFormAction`:
   - requires customer session and order ownership
   - sets `Order.paymentStatus` and related `Payment.status` to `PENDING`
   - adds `StatusHistory` comment: “Клиент отметил оплату через временную заглушку.”
   - does **not** mark as `PAID`
4. Account order detail shows `OrderPaymentBlock` with status and button
5. Admin order detail highlights customer payment mark in history

## Customer cabinet polish

- Dashboard: profile card, order summary stats, quick CTAs (магазин, услуги, связаться)
- Friendly empty state when no orders
- Order detail: items, delivery, service request, payment block, history

## Test/demo order separation (re-verified)

Unchanged from Package 3.4:

| Role | Default | Tabs |
|------|---------|------|
| ADMIN | Production | Рабочие / Тестовые / Все |
| MANAGER | Production only | — |
| DEMO | Test only | — |

## Media slots (regression check)

No slot rebuild. Existing `/admin/media/site` slots and `lib/site-media.ts` fallbacks unchanged.

## Local verification

| Check | Result |
|-------|--------|
| `pnpm lint` | Passed (2026-06-29) |
| `pnpm build` | Passed (2026-06-29, Next.js 15.3.4, 110 routes) |
| `pnpm db:verify:catalog` | Passed (0 errors; 2 warnings for missing service images locally) |
| Public grep: medical/professional disclaimer strings | None in app/components |
| Header “Оформить” | Removed |

## Remaining limitations

- Real online payment not connected (Lava / card provider out of scope)
- Email sending not connected
- “Я оплатил” is a temporary manual placeholder, not proof of payment
- Checkout UX further finalized in [package-3-4-2-checkout-ux-finalization.md](package-3-4-2-checkout-ux-finalization.md)
