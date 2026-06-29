import { prisma } from "@/lib/db/prisma";
import { mergeMediaSlots } from "@/lib/site-media";

export type SiteMediaSlotsShape = {
  logoImage: string | null;
  logoAlt: string;
  heroPortrait: string | null;
  heroPortraitAlt: string;
  homeGallery: Array<{ src: string; alt: string; label: string }>;
  homeDirections: Array<{ id: string; image: string; alt: string }>;
  footerBrandImage: string | null;
  aboutImage: string | null;
};

export type SiteSettingsShape = {
  contacts: {
    telegram: string;
    vk: string;
    phone: string;
    responseHours: string;
    workFormat: string;
    email: string;
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
    titleTemplate: string;
    keywords: string;
  };
  homepage: {
    eyebrow: string;
    title: string;
    lead: string;
    description: string;
    primaryLabel: string;
    secondaryLabel: string;
    telegramLabel: string;
  };
  footer: {
    description: string;
    disclaimer: string;
    copyright: string;
  };
  socialLinks: {
    telegram: string;
    vk: string;
    instagram: string;
    youtube: string;
  };
  legalPages: {
    privacyTitle: string;
    privacyText: string;
    offerTitle: string;
    offerText: string;
    disclaimerTitle: string;
    disclaimerText: string;
  };
  currencies: {
    primary: string;
    secondary: string;
  };
  mediaSlots: SiteMediaSlotsShape;
};

export const DEFAULT_SITE_SETTINGS: SiteSettingsShape = {
  contacts: {
    telegram: "@Bazhena13witch",
    vk: "vk.com/bazhena13witch",
    phone: "+995593341587",
    responseHours: "ежедневно, 11:00–21:00",
    workFormat: "онлайн по всему миру",
    email: "mail@example.com"
  },
  seo: {
    defaultTitle: "Бажена — Магия Жизни",
    defaultDescription:
      "Таро, диагностика, трансформационные практики и магические товары. Личный бренд Бажены — проводника в мире тонких практик.",
    titleTemplate: "%s | Бажена — Магия Жизни",
    keywords: "таро, магия жизни, бажена, амулеты, диагностика, услуги"
  },
  homepage: {
    eyebrow: "Таро · ритуальные практики · амулеты · 18+",
    title: "Бажена — Магия Жизни",
    lead: "Таро, ритуальные практики, трансформационные игры, свечи, амулеты и глубокая работа с жизненными ситуациями.",
    description:
      "Помогаю разобраться в отношениях, деньгах, защите, родовых сценариях и личном пути через Таро, психологические практики, шаманские и трансовые техники.",
    primaryLabel: "Выбрать услугу",
    secondaryLabel: "Перейти в магазин",
    telegramLabel: "Записаться в Telegram"
  },
  footer: {
    description:
      "Таро, диагностика, трансформационные практики и магические товары. Личный бренд Бажены — Магия Жизни.",
    disclaimer:
      "Работа ведётся бережно и конфиденциально. Товары и услуги доступны для клиентов 18+.",
    copyright: "© Бажена / Магия Жизни"
  },
  socialLinks: {
    telegram: "https://t.me/Bazhena13witch",
    vk: "https://vk.com/bazhena13witch",
    instagram: "",
    youtube: ""
  },
  legalPages: {
    privacyTitle: "Политика конфиденциальности",
    privacyText: "Сбор имени, телефона, Telegram, email, адреса доставки и комментария к запросу.",
    offerTitle: "Публичная оферта",
    offerText: "Блок о товарах, услугах, оплате, доставке, сроках и особенностях индивидуальных заказов.",
    disclaimerTitle: "Информация для клиентов",
    disclaimerText:
      "Работа ведётся бережно и конфиденциально. Товары и услуги доступны для клиентов 18+."
  },
  currencies: {
    primary: "RUB",
    secondary: "USD"
  },
  mediaSlots: mergeMediaSlots()
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge<T extends Record<string, unknown>>(base: T, value: unknown): T {
  if (!isObject(value)) {
    return base;
  }

  const result = { ...base } as Record<string, unknown>;

  for (const [key, baseValue] of Object.entries(base)) {
    const nextValue = value[key];
    if (isObject(baseValue)) {
      result[key] = deepMerge(baseValue as Record<string, unknown>, nextValue);
    } else if (typeof nextValue === typeof baseValue) {
      result[key] = nextValue;
    }
  }

  return result as T;
}

export async function getSiteSettings() {
  if (!process.env.DATABASE_URL) {
    return DEFAULT_SITE_SETTINGS;
  }

  try {
    const record = await prisma.siteSetting.findUnique({
      where: { key: "site_settings" }
    });

    return {
      ...deepMerge(DEFAULT_SITE_SETTINGS, record?.value),
      mediaSlots: mergeMediaSlots(
        isObject(record?.value) ? (record.value as { mediaSlots?: Partial<SiteMediaSlotsShape> }).mediaSlots : undefined
      )
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}
