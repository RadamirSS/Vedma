import { CartPageView } from "@/components/commerce/cart-page-view";
import { SectionHeading } from "@/components/section-heading";

export default function CartPage() {
  return (
    <section className="section">
      <div className="container">
        <SectionHeading
          eyebrow="Корзина"
          title="Соберите заказ перед оформлением"
          text="Товары и услуги попадают в единый заказ. После отправки администратор подтверждает состав, наличие и ручной статус платежа."
        />
        <CartPageView />
      </div>
    </section>
  );
}
