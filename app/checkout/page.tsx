import { CheckoutView } from "@/components/checkout-view";
import { SectionHeading } from "@/components/section-heading";

export default function CheckoutPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Корзина и заказ"
          title="Оформление заказа"
          text="На первом этапе заказ уходит администратору. Бажена подтверждает возможность работы, наличие товара и отправляет реквизиты."
        />
        <CheckoutView />
      </div>
    </section>
  );
}
