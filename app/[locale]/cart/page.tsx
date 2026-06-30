import { CartPageView } from "@/components/commerce/cart-page-view";
import { SectionHeading } from "@/components/section-heading";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CartPage({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as Locale;
  const dict = await getDictionary(locale);

  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow={dict.cart.title}
          title={dict.cart.pageTitle}
          text={dict.cart.pageDescription}
        />
        <CartPageView locale={locale} dict={dict} />
      </div>
    </section>
  );
}
