export const ru = {
  common: {
    emDash: "—",
    preview: "Preview",
    save: "Сохранить",
    cancel: "Отмена",
    backToList: "К списку",
    open: "Открыть",
    edit: "Редактировать",
    search: "Поиск",
    apply: "Применить",
    actions: "Действия",
    status: "Статус",
    updated: "Обновлено",
    image: "Изображение",
    name: "Название",
    category: "Категория",
    price: "Цена",
    fromPrice: "от",
    noName: "Без имени",
    test: "Тест",
    view: "Просмотр",
    openOnSite: "Открыть на сайте",
    dangerousZone: "Опасная зона",
    email: "Email",
    phone: "Телефон",
    telegram: "Telegram",
    comment: "Комментарий",
    client: "Клиент",
    created: "Создан",
    createdAt: "Создана",
    lastLogin: "Последний вход",
    active: "Активен",
    inactive: "Отключен",
    saving: "Сохранение...",
    deleting: "Удаление...",
    applying: "Применение...",
    filtering: "Фильтр...",
    uploading: "Загрузка...",
    pendingDefault: "Сохранение...",
    country: "Страна",
    address: "Адрес",
    responsible: "Ответственный",
    total: "Итого",
    item: "Позиция",
    type: "Тип",
    quantity: "Количество",
    contacts: "Контакты",
    note: "Заметка",
    password: "Пароль",
    sourceUrl: "Source URL",
    noComment: "Без комментария",
    notSelected: "Не выбран"
  },
  login: {
    eyebrow: "CMS доступ",
    title: "Вход в админ-панель",
    description: "Только для администраторов и менеджеров каталога.",
    password: "Пароль",
    submit: "Войти",
    pending: "Вход..."
  },
  shell: {
    brandName: "Vedma CMS",
    brandSub: "Production Admin",
    nav: {
      dashboard: "Дашборд",
      products: "Товары",
      services: "Услуги",
      orders: "Заказы",
      requests: "Заявки",
      payments: "Платежи",
      customers: "Клиенты",
      media: "Медиа",
      reviews: "Отзывы",
      settings: "Настройки",
      users: "Пользователи"
    },
    logout: "Выйти"
  },
  roles: {
    ADMIN: "Администратор",
    MANAGER: "Менеджер",
    DEMO: "Демо (только просмотр)"
  },
  demoMode: {
    title: "Демо-режим",
    defaultText:
      "Этот аккаунт работает только на просмотр. Изменение данных, загрузки и доступ к приватным PDF отключены.",
    payments:
      "Демо-аккаунт видит историю ручных платежей, но не может менять статусы или комментарии.",
    media:
      "Демо-аккаунт может просматривать медиатеку, но не может загружать, заменять или удалять файлы.",
    siteMedia:
      "Демо-аккаунт может просматривать слоты медиа сайта, но не может сохранять изменения.",
    reviews:
      "Демо-аккаунт может просматривать отзывы, но не может создавать, менять или удалять их.",
    products:
      "Демо-аккаунт может просматривать карточки товаров, но не может менять, публиковать или удалять их.",
    services:
      "Демо-аккаунт может просматривать карточки услуг, но не может менять, публиковать или удалять их.",
    orders:
      "Демо-аккаунт может просматривать заказ, но не может менять статусы, комментарии или открывать приватные PDF.",
    requests:
      "Демо-аккаунт может просматривать заявки, но не может менять статусы или внутренние комментарии.",
    customers:
      "Демо-аккаунт может просматривать клиентов, но не может менять заметки или открывать приватные PDF."
  },
  pagination: {
    back: "Назад",
    forward: "Вперед",
    pageOf: "Страница {page} из {totalPages}"
  },
  filters: {
    allStatuses: "Все статусы",
    searchByTitle: "Поиск по названию",
    searchOrder: "Номер, email или имя клиента",
    searchRequest: "Номер, email или имя",
    searchMedia: "Поиск по имени, alt или пути",
    searchReviews: "Поиск по автору, заголовку или тексту",
    sortUpdatedDesc: "Сначала обновленные",
    sortUpdatedAsc: "Сначала старые",
    sortTitleAsc: "Название А-Я",
    sortTitleDesc: "Название Я-А",
    sortPriceDesc: "Цена по убыванию",
    sortPriceAsc: "Цена по возрастанию",
    bulkPublish: "Опубликовать",
    bulkHide: "Скрыть",
    bulkDraft: "В черновик",
    applyToSelected: "Применить к выбранным",
    resetFilters: "Сбросить фильтры",
    resetSearch: "Сбросить поиск",
    commerceScope: {
      production: "Рабочие",
      test: "Тестовые",
      all: "Все"
    }
  },
  enums: {
    publication: {
      DRAFT: "Черновик",
      PUBLISHED: "Опубликовано",
      ARCHIVED: "Скрыто"
    },
    availability: {
      IN_STOCK: "В наличии",
      ON_REQUEST: "Под заказ",
      OUT_OF_STOCK: "Нет в наличии",
      UNKNOWN: "Не указано"
    },
    orderStatus: {
      NEW: "Новый",
      PENDING_CONFIRMATION: "Ожидает подтверждения",
      AWAITING_PAYMENT: "Ожидает оплаты",
      PAID: "Оплачен",
      IN_PROGRESS: "В работе",
      READY_TO_SHIP: "Готов к отправке",
      SHIPPED: "Отправлен",
      COMPLETED: "Завершен",
      CANCELLED: "Отменен",
      REFUNDED: "Возврат"
    },
    paymentStatus: {
      NOT_ISSUED: "Не выставлен",
      INVOICE_SENT: "Реквизиты отправлены",
      PENDING: "Ожидается платеж",
      PAID: "Оплачен",
      PARTIAL: "Частично оплачен",
      FAILED: "Ошибка платежа",
      EXPIRED: "Просрочен",
      REFUNDED: "Возврат",
      CANCELLED: "Отменен"
    },
    requestStatus: {
      NEW: "Новая",
      IN_PROGRESS: "В работе",
      WAITING_FOR_CLIENT: "Ждем клиента",
      AWAITING_PAYMENT: "Ждет оплаты",
      PAID: "Оплачена",
      COMPLETED: "Завершена",
      CANCELLED: "Отменена",
      SPAM: "Спам"
    },
    contactMethod: {
      TELEGRAM: "Telegram",
      PHONE: "Телефон",
      EMAIL: "Email",
      VK: "VK",
      WHATSAPP: "WhatsApp"
    },
    productCategories: {
      "Браслеты": "Браслеты",
      "Камни": "Камни",
      "Алтарные товары": "Алтарные товары",
      "Декор": "Декор",
      "Свечи": "Свечи",
      "Обереги": "Обереги",
      "Подарки": "Подарки",
      "Прочее": "Прочее"
    },
    serviceCategories: {
      "Самопознание и практики": "Самопознание и практики",
      "Деньги и успех": "Деньги и успех",
      "Диагностика": "Диагностика",
      "Трансформационные игры": "Трансформационные игры",
      "Консультации": "Консультации",
      "Прочее": "Прочее"
    },
    userRoles: {
      ADMIN: "Администратор",
      MANAGER: "Менеджер",
      DEMO: "Демо (только просмотр)"
    }
  },
  actions: {
    auth: {
      enterEmailPassword: "Введите email и пароль.",
      invalidCredentials: "Неверные учетные данные.",
      accessDenied: "Доступ запрещен.",
      loggedOut: "Вы вышли из системы.",
      passwordUpdatedLoginAgain: "Пароль обновлен. Войдите снова."
    },
    products: {
      slugInUse: "Slug уже используется.",
      saved: "Товар сохранен.",
      notSelected: "Не выбран товар.",
      notFound: "Товар не найден.",
      deleted: "Товар удален.",
      selectItemsAndAction: "Выберите элементы и действие.",
      bulkDone: "Массовое действие выполнено."
    },
    services: {
      slugInUse: "Slug уже используется.",
      saved: "Услуга сохранена.",
      notSelected: "Не выбрана услуга.",
      notFound: "Услуга не найдена.",
      deleted: "Услуга удалена.",
      selectItemsAndAction: "Выберите элементы и действие.",
      bulkDone: "Массовое действие выполнено."
    },
    orders: {
      notFound: "Заказ не найден.",
      updated: "Заказ обновлен."
    },
    requests: {
      notFound: "Заявка не найдена.",
      updated: "Заявка обновлена."
    },
    payments: {
      notFound: "Платеж не найден.",
      updated: "Статус платежа обновлен."
    },
    customers: {
      notFound: "Клиент не найден.",
      noteSaved: "Заметка сохранена."
    },
    reviews: {
      saved: "Отзыв сохранен.",
      notSelected: "Не выбран отзыв.",
      deleted: "Отзыв удален."
    },
    media: {
      selectFile: "Выберите файл для загрузки.",
      uploaded: "Изображение загружено.",
      notSelected: "Не выбран медиафайл.",
      notFound: "Файл не найден.",
      updated: "Файл обновлен.",
      deleted: "Файл удален.",
      deleteFailed: "Не удалось удалить файл.",
      siteUpdated: "Медиа сайта обновлены.",
      siteSaveFailed: "Не удалось сохранить медиа сайта."
    },
    settings: {
      saved: "Настройки сохранены.",
      seeded: "Базовые настройки инициализированы."
    },
    users: {
      emailInUse: "Email уже используется.",
      saved: "Пользователь сохранен.",
      notSelected: "Не выбран пользователь.",
      deactivated: "Пользователь деактивирован.",
      cannotDeleteSelf: "Нельзя удалить текущего администратора.",
      deleted: "Пользователь удален.",
      passwordRequired: "Новый пароль обязателен.",
      passwordUpdated: "Пароль обновлен."
    },
    generic: {
      saveFailed: "Не удалось сохранить."
    }
  },
  validation: {
    requiredField: "Поле «{field}» обязательно.",
    nonNegativeNumbers: "Числовые поля должны быть неотрицательными.",
    slugFailed: "Не удалось сформировать slug.",
    saveProductFailed: "Не удалось сохранить товар.",
    saveServiceFailed: "Не удалось сохранить услугу.",
    saveReviewFailed: "Не удалось сохранить отзыв.",
    saveUserFailed: "Не удалось сохранить пользователя.",
    fields: {
      title: "Название",
      text: "Текст",
      email: "Email"
    }
  },
  mediaErrors: {
    imageMime: "Допустимы только JPG, PNG и WEBP до 10 МБ.",
    storageWrite: "Не удалось записать файл на сервере. Проверьте storage/uploads.",
    maxSize: "Размер изображения не должен превышать 10 МБ.",
    notFound: "Файл не найден.",
    unlinkFirst: "Сначала отвяжите изображение от товара или услуги."
  },
  forms: {
    catalogEntity: {
      title: "Название",
      slug: "Slug",
      category: "Категория",
      selectCategory: "Выберите категорию",
      publicationStatus: "Статус публикации",
      availability: "Наличие",
      quantity: "Количество",
      format: "Формат",
      duration: "Длительность",
      executionTime: "Срок исполнения",
      purpose: "Назначение",
      priceRub: "Цена RUB",
      priceUsd: "Цена USD",
      priceLabel: "Подпись цены",
      currency: "Валюта",
      shortDescription: "Короткое описание",
      fullDescription: "Полное описание",
      uploadMainImage: "Загрузить новое главное изображение",
      uploadMainImageHint:
        "JPG, PNG или WEBP до 10 МБ. Если выбран и файл, и медиа из библиотеки, файл имеет приоритет.",
      selectFromLibrary: "Или выбрать из медиатеки",
      noImage: "Без изображения",
      mainImagePreviewAlt: "Превью главного изображения",
      gallery: "Галерея",
      galleryPlaceholder: "/uploads/... по одной строке",
      tags: "Теги",
      tagsPlaceholder: "по одному тегу на строку",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      save: "Сохранить",
      saving: "Сохранение...",
      cancel: "Отмена",
      backToList: "К списку",
      openOnSite: "Открыть на сайте"
    },
    dirtyForm: {
      unsavedChanges: "Есть несохраненные изменения."
    },
    siteMedia: {
      uploadNew: "Загрузить новое изображение",
      selectFromLibrary: "Или выбрать из медиатеки",
      keepCurrent: "Оставить текущее",
      altText: "Alt-текст",
      noImageSelected: "Изображение не выбрано — используется запасной вариант.",
      save: "Сохранить медиа сайта",
      saving: "Сохранение...",
      logo: {
        label: "Логотип в шапке",
        help: "Показывается вместо буквы «Б» в шапке сайта."
      },
      hero: {
        label: "Главное фото на первом экране",
        help: "Портрет/главный визуал в hero-блоке на главной странице."
      },
      gallery: {
        help: "Изображение в галерее на главной странице."
      },
      direction: {
        label: "Направление: {id}",
        help: "Карточка направления на главной странице."
      },
      footer: {
        label: "Изображение в подвале",
        help: "Необязательный брендовый визуал в footer."
      },
      about: {
        label: "Фото на странице «Обо мне»",
        help: "Портрет на странице /about."
      }
    }
  },
  dashboard: {
    eyebrow: "Панель управления",
    title: "Production CMS",
    description:
      "Каталог, медиа, отзывы, настройки и пользователи управляются из живой базы данных.",
    addProduct: "Добавить товар",
    addService: "Добавить услугу",
    stats: {
      products: "Товары",
      services: "Услуги",
      media: "Медиа",
      orders: "Заказы",
      requests: "Заявки",
      payments: "Платежи"
    },
    quickActions: {
      title: "Быстрые действия",
      description: "Переход к основным рабочим разделам каталога.",
      newProduct: {
        title: "Новый товар",
        description: "Добавить карточку товара и сразу опубликовать или сохранить как черновик."
      },
      newService: {
        title: "Новая услуга",
        description: "Создать новый формат работы, цену и SEO-данные."
      },
      media: {
        title: "Медиа",
        description: "Загрузить, переиспользовать или заменить изображения."
      },
      settings: {
        title: "Настройки",
        description: "Обновить контакты, SEO и юридические тексты сайта."
      }
    },
    recentUpdates: {
      title: "Последние обновления",
      description: "Свежие изменения в товарах и услугах."
    }
  },
  products: {
    eyebrow: "Товары",
    title: "Управление товарами",
    description: "Поиск, фильтрация, массовые действия и переход к редактированию существующего каталога.",
    new: "Новый товар",
    createTitle: "Создать товар",
    demoNew:
      "Демо-аккаунт не может создавать товары. Форма открыта только для просмотра структуры.",
    empty: {
      title: "Товары не найдены",
      text: "Измените фильтры или создайте новую карточку товара.",
      cta: "Добавить товар"
    },
    detail: {
      eyebrow: "Редактирование товара",
      updatedAt: "Обновлено {date}",
      dangerousZoneDescription:
        "Удаление не затрагивает саму базу Package 1 и отвязывает медиа от карточки.",
      delete: "Удалить товар",
      deleteConfirm: "Удалить товар? Это действие нельзя отменить.",
      deleting: "Удаление..."
    }
  },
  services: {
    eyebrow: "Услуги",
    title: "Управление услугами",
    description: "Редактирование всех текущих форматов работы с поиском, сортировкой и массовыми действиями.",
    new: "Новая услуга",
    createTitle: "Создать услугу",
    demoNew:
      "Демо-аккаунт не может создавать услуги. Форма открыта только для просмотра структуры.",
    empty: {
      title: "Услуги не найдены",
      text: "Измените фильтры или добавьте новую услугу.",
      cta: "Добавить услугу"
    },
    detail: {
      eyebrow: "Редактирование услуги",
      updatedAt: "Обновлено {date}",
      dangerousZoneDescription:
        "Удаление не затрагивает саму базу Package 1 и отвязывает медиа от карточки.",
      delete: "Удалить услугу",
      deleteConfirm: "Удалить услугу? Это действие нельзя отменить.",
      deleting: "Удаление..."
    }
  },
  orders: {
    eyebrow: "Заказы",
    title: "Commerce backlog",
    description: "Новые корзины, ручные статусы оплаты и состав заказа в одной таблице.",
    table: {
      order: "Заказ",
      client: "Клиент",
      items: "Позиции",
      total: "Сумма",
      statuses: "Статусы",
      created: "Создан"
    },
    detail: {
      eyebrow: "Заказ",
      clientLine: "Клиент: {name}",
      testOrder: "Тестовый заказ",
      backToList: "Назад к списку",
      paymentStubTitle: "Отметка клиента об оплате",
      paymentStubText:
        "Клиент нажал «Я оплатил» через временную заглушку. Это не подтверждение реального платежа — проверьте поступление и обновите статус платежа вручную.",
      delivery: "Доставка",
      items: "Состав заказа",
      files: "Файлы",
      statusHistory: "История статусов",
      updateStatus: "Обновить статус",
      adminComment: "Комментарий администратора",
      postalCode: "Индекс: {code}",
      privateFilesAdminOnly: "Приватные PDF доступны только администратору.",
      compositionTitle: "Состав",
      compositionDescription: "Снимок цен фиксируется в момент checkout.",
      product: "Товар",
      service: "Услуга",
      contactsTitle: "Контакты",
      phoneMissing: "Телефон не указан",
      telegramMissing: "Telegram не указан",
      contactMethod: "Способ связи",
      addressMissing: "Адрес не указан.",
      preferredTime: "Желаемое время",
      clientCommentTitle: "Комментарий клиента",
      filesNone: "Вложений нет.",
      updateStatusesTitle: "Обновить статусы",
      updateStatusesDescription: "Оплата и выполнение заказа меняются вручную.",
      orderStatus: "Статус заказа",
      paymentStatus: "Статус платежа",
      saveStatus: "Сохранить статус",
      historyTitle: "История",
      historyDescription: "Лента событий по заказу.",
      currentStatus: "Текущий статус",
      currentPayment: "Текущий платеж"
    }
  },
  requests: {
    eyebrow: "Заявки",
    title: "Intake requests",
    description: "Каждый checkout создает отдельную заявку для ручной работы менеджера.",
    table: {
      request: "Заявка",
      client: "Клиент",
      selected: "Выбрано",
      status: "Статус",
      responsible: "Ответственный",
      created: "Создана"
    },
    detail: {
      eyebrow: "Заявка",
      backToList: "Назад к списку",
      dataTitle: "Данные заявки",
      dataDescription: "Выбранная позиция, контакты и ручной комментарий.",
      selected: "Выбрано",
      statusHistory: "История статусов",
      updateStatus: "Обновить статус",
      internalComment: "Внутренний комментарий",
      updateStatusDescription: "Ответственный фиксируется автоматически текущим менеджером.",
      saveRequest: "Сохранить заявку",
      commentMissing: "Комментарий отсутствует.",
      historyDescription: "Хронология смены статусов.",
      historyTitle: "История"
    }
  },
  payments: {
    eyebrow: "Платежи",
    title: "Ручной контроль оплаты",
    description:
      "Онлайн-эквайринг не подключен: заказ создается сразу, а администратор вручную подтверждает оплату и отправляет реквизиты клиенту.",
    noOrder: "Без заказа",
    update: "Обновить платеж"
  },
  customers: {
    eyebrow: "Клиенты",
    title: "Customer accounts",
    description: "Аккаунты создаются в checkout или через регистрацию и используют ту же систему сессий.",
    table: {
      client: "Клиент",
      contacts: "Контакты",
      orders: "Заказы",
      requests: "Заявки",
      pdf: "PDF",
      lastLogin: "Последний вход"
    },
    detail: {
      eyebrow: "Клиент",
      backToList: "Назад к клиентам",
      contactsTitle: "Контакты и доставка",
      contactsDescription: "Данные из checkout и личного кабинета.",
      city: "Город",
      notesTitle: "Заметки менеджера",
      notesDescription: "Внутренние заметки видны только администраторам и менеджерам.",
      saveNotes: "Сохранить заметку",
      ordersTitle: "Заказы",
      requestsTitle: "Заявки",
      filesTitle: "Файлы",
      country: "Страна",
      address: "Адрес",
      note: "Заметка",
      notesDescriptionShort: "Внутренняя заметка по клиенту.",
      ordersDescription: "Последние заказы клиента.",
      requestsAndPdfTitle: "Заявки и PDF",
      requestsAndPdfDescription: "История обращений и приватных вложений."
    }
  },
  media: {
    eyebrow: "Медиатека",
    title: "Управление медиа",
    description: "Загруженные изображения, alt-тексты и замена файлов без потери публичных ссылок.",
    file: "Файл",
    altText: "Alt text",
    upload: "Загрузить",
    noAlt: "Без alt",
    siteMediaCard: {
      title: "Медиа сайта",
      description: "Логотип, hero-портрет, галерея главной и изображения направлений.",
      open: "Открыть медиа сайта"
    },
    site: {
      eyebrow: "Медиа сайта",
      title: "Медиа сайта",
      description:
        "Управляйте логотипом, hero-портретом, галереей и изображениями направлений на публичном сайте.",
      backToLibrary: "К медиатеке"
    },
    detail: {
      eyebrow: "Редактирование медиа",
      replaceFile: "Заменить файл",
      delete: "Удалить файл",
      deleteConfirm: "Удалить файл? Это действие нельзя отменить.",
      sourceUrl: "Source URL",
      openFile: "Открыть файл",
      deleteConfirmLinked:
        "Удалить файл из медиатеки? Если он привязан к товару или услуге, удаление будет остановлено.",
      demoMetadata:
        "Демо-аккаунт может просматривать метаданные медиа, но не может менять или удалять файлы."
    }
  },
  reviews: {
    eyebrow: "Отзывы",
    title: "Управление отзывами",
    description: "Отзывы публикуются на публичной странице и на главной без редизайна существующих блоков.",
    new: "Новый отзыв",
    createTitle: "Создать отзыв",
    demoNew: "Демо-аккаунт не может создавать отзывы. Форма открыта только для просмотра.",
    defaultAuthor: "Клиент",
    table: {
      author: "Автор",
      title: "Заголовок",
      status: "Статус",
      updated: "Обновлено",
      actions: "Действия"
    },
    empty: {
      title: "Отзывы не найдены",
      text: "Создайте первый отзыв или очистите строку поиска.",
      cta: "Добавить отзыв"
    },
    form: {
      authorName: "Автор",
      title: "Заголовок",
      text: "Текст",
      image: "Изображение",
      publicationStatus: "Статус публикации"
    },
    detail: {
      eyebrow: "Редактирование отзыва",
      noTitle: "Отзыв без заголовка",
      titleService: "Заголовок / услуга",
      delete: "Удалить отзыв",
      deleteConfirm: "Удалить отзыв? Это действие нельзя отменить."
    }
  },
  settings: {
    eyebrow: "Настройки сайта",
    title: "Управление текстами и SEO",
    description: "Все значения хранятся в `SiteSetting` и отражаются на публичных страницах без смены URL.",
    reseed: "Переинициализировать базу",
    save: "Сохранить настройки",
    fields: {
      telegram: "Telegram",
      vk: "VK",
      phone: "Телефон",
      email: "Email",
      responseHours: "График ответа",
      workFormat: "Формат работы",
      seoTitle: "SEO title",
      seoTemplate: "SEO template",
      seoDescription: "SEO description",
      seoKeywords: "SEO keywords",
      heroEyebrow: "Hero eyebrow",
      heroTitle: "Hero title",
      heroLead: "Hero lead",
      heroDescription: "Hero description",
      primaryCta: "Primary CTA",
      secondaryCta: "Secondary CTA",
      telegramCta: "Telegram CTA",
      footerDescription: "Footer description",
      footerDisclaimer: "Footer disclaimer",
      copyright: "Copyright",
      telegramUrl: "Telegram URL",
      vkUrl: "VK URL",
      instagramUrl: "Instagram URL",
      youtubeUrl: "YouTube URL",
      privacyTitle: "Privacy title",
      privacyText: "Privacy text",
      offerTitle: "Offer title",
      offerText: "Offer text",
      disclaimerTitle: "Disclaimer title",
      disclaimerText: "Disclaimer text",
      primaryCurrency: "Основная валюта",
      secondaryCurrency: "Доп. валюта"
    }
  },
  users: {
    eyebrow: "Пользователи",
    title: "Управление администраторами",
    description: "Только администратор может создавать менеджеров, редактировать роли и сбрасывать пароли.",
    new: "Новый пользователь",
    createTitle: "Создать менеджера или администратора",
    table: {
      name: "Имя",
      email: "Email",
      role: "Роль",
      status: "Статус",
      lastLogin: "Последний вход",
      actions: "Действия"
    },
    detail: {
      eyebrow: "Редактирование пользователя",
      name: "Имя",
      email: "Email",
      role: "Роль",
      newPassword: "Новый пароль",
      passwordPlaceholder: "Оставьте пустым, чтобы не менять",
      activeUser: "Активный пользователь",
      save: "Сохранить",
      resetPassword: "Сброс пароля",
      resetPasswordPlaceholder: "Новый пароль",
      updatePassword: "Обновить пароль",
      deactivate: "Деактивировать",
      deactivateConfirm: "Деактивировать пользователя и завершить его сессии?",
      delete: "Удалить пользователя",
      deleteConfirm: "Удалить пользователя полностью? Это действие нельзя отменить."
    }
  }
};

export type AdminDictionary = typeof ru;
