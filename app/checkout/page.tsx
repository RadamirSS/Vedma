import { CheckoutView } from "@/components/checkout-view";
import { SectionHeading } from "@/components/section-heading";
import { getCurrentCustomerSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function CheckoutPage() {
  const session = await getCurrentCustomerSession();
  const profile =
    session
      ? await prisma.customerProfile.findUnique({
          where: { userId: session.user.id }
        })
      : null;

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Корзина и заказ"
          title="Оформление заказа"
          text="На первом этапе заказ уходит администратору. Бажена подтверждает возможность работы, наличие товара и отправляет реквизиты."
        />
        <CheckoutView
          currentUser={
            session
              ? {
                  email: session.user.email,
                  name: session.user.name,
                  phone: session.user.phone,
                  telegram: session.user.telegram,
                  city: profile?.city,
                  country: profile?.country,
                  addressLine1: profile?.addressLine1,
                  addressLine2: profile?.addressLine2,
                  postalCode: profile?.postalCode
                }
              : null
          }
        />
      </div>
    </section>
  );
}
