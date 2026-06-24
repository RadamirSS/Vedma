import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link href="/" className="brand">
            <span className="sigil">Б</span>
            <span>
              <span className="brand-name">Бажена</span>
              <span className="brand-sub">Магия жизни</span>
            </span>
          </Link>
          <p className="footer-lead">
            Таро, диагностика, трансформационные практики и магические товары. Личный бренд Бажены —
            Магия Жизни.
          </p>
          <span className="age">18+</span>
        </div>
        <div>
          <h4>Навигация</h4>
          <div className="footer-links">
            <Link href="/services">Услуги</Link>
            <Link href="/products">Товары</Link>
            <Link href="/about">Обо мне</Link>
            <Link href="/reviews">Отзывы</Link>
          </div>
        </div>
        <div>
          <h4>Контакты</h4>
          <div className="footer-links">
            <a href="https://t.me/Bazhena13witch" target="_blank" rel="noreferrer">
              Telegram
            </a>
            <Link href="/contacts">Контакты</Link>
            <Link href="/checkout">Форма заказа</Link>
          </div>
        </div>
        <div>
          <h4>Дисклеймер</h4>
          <p>
            Услуги и товары на сайте относятся к эзотерическим, консультационным и
            трансформационным практикам. Они не заменяют профессиональную помощь. 18+.
          </p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© Бажена / Магия Жизни</p>
        <p>Политика конфиденциальности · Публичная оферта · Дисклеймер</p>
      </div>
    </footer>
  );
}
