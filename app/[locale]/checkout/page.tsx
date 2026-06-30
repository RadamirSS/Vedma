import { CheckoutView } from "@/components/checkout-view";
import { SectionHeading } from "@/components/section-heading";
import { getCurrentCustomerSession } from "@/lib/auth/session";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CheckoutPage({ params, searchParams }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  const routeParams = await searchParams;
  const loginError = typeof routeParams.error === "string" ? routeParams.error : undefined;
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
          eyebrow={dict.cart.title}
          title={dict.checkout.title}
          text={dict.checkout.description}
        />
        <CheckoutView
          locale={locale}
          dict={dict}
          loginError={loginError}
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
