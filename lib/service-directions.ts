export type ServiceDirection = {
  id: string;
  title: string;
  description: string;
  accent: "tarot" | "candle" | "amulet" | "game" | "rod" | "stone";
  image: string;
  href: string;
  linkLabel: string;
  external?: boolean;
};

const TELEGRAM = "https://t.me/Bazhena13witch";

function leadUrl(topic: string) {
  return `${TELEGRAM}?text=${encodeURIComponent(`Здравствуйте! Интересует: ${topic}`)}`;
}

export const serviceDirections: ServiceDirection[] = [
  {
    id: "tarot",
    title: "Таро и расклады",
    description:
      "Расклады на отношения, судьбу, выбор и ситуацию. Точная диагностика через символы и интуицию.",
    accent: "tarot",
    image: "/uploads/vk/services/diagnostika-negativa/cover.jpg",
    href: leadUrl("Таро и расклады"),
    linkLabel: "Записаться",
    external: true
  },
  {
    id: "diagnostics",
    title: "Диагностика",
    description:
      "Диагностика негатива, состояния поля и скрытых причин. Понять, что происходит и с чего начать.",
    accent: "tarot",
    image: "/uploads/vk/services/diagnostika-negativa/cover.jpg",
    href: "/services/diagnostika-negativa",
    linkLabel: "Подробнее"
  },
  {
    id: "protection",
    title: "Защита",
    description:
      "Работа с негативом, утечками энергии и защитой пространства. Мягкие и глубокие форматы поддержки.",
    accent: "amulet",
    image: "/uploads/vk/products/braslet-iz-ametista/cover.jpg",
    href: leadUrl("Защита"),
    linkLabel: "Записаться",
    external: true
  },
  {
    id: "relationships",
    title: "Отношения",
    description:
      "Разбор чувств, намерений, конфликтов и повторяющихся сценариев в паре и личной жизни.",
    accent: "tarot",
    image: "/uploads/vk/products/braslet-iz-lunnogo-kamnya-ocharovanie/cover.jpg",
    href: leadUrl("Отношения"),
    linkLabel: "Записаться",
    external: true
  },
  {
    id: "money",
    title: "Деньги",
    description:
      "Денежный поток, карьера, блоки и точки роста. Трансформационные игры и глубокая проработка ресурса.",
    accent: "game",
    image: "/uploads/vk/services/transformazionnaa-igra-denejnyy-magnit/cover.jpg",
    href: "/services/transformatsionnaya-igra-denezhnyy-magnit",
    linkLabel: "Подробнее"
  },
  {
    id: "rod",
    title: "Родовые практики",
    description:
      "Родовые сценарии, наследие рода и глубинные причины повторений. Работа с личным и родовым путём.",
    accent: "rod",
    image: "/uploads/vk/products/altarnoe-pokryvalo/cover.jpg",
    href: leadUrl("Родовые практики"),
    linkLabel: "Записаться",
    external: true
  },
  {
    id: "transformation",
    title: "Трансформация",
    description:
      "Трансформационные игры и практики для внутреннего сдвига, осознания и выхода на новый уровень.",
    accent: "game",
    image: "/uploads/vk/services/transformazionnaa-igra-denejnyy-magnit/cover.jpg",
    href: "/services/transformatsionnaya-igra-denezhnyy-magnit",
    linkLabel: "Подробнее"
  },
  {
    id: "consultations",
    title: "Консультации",
    description:
      "Индивидуальные консультации на стыке Таро, психологии и парапсихологии. Онлайн и в переписке.",
    accent: "candle",
    image: "/uploads/vk/products/bokal-drakon/cover.jpg",
    href: leadUrl("Консультация"),
    linkLabel: "Записаться",
    external: true
  }
];
