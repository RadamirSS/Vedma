import type { AdminDictionary } from "./ru";

export const en: AdminDictionary = {
  common: {
    emDash: "—",
    preview: "Preview",
    save: "Save",
    cancel: "Cancel",
    backToList: "Back to list",
    open: "Open",
    edit: "Edit",
    search: "Search",
    apply: "Apply",
    actions: "Actions",
    status: "Status",
    updated: "Updated",
    image: "Image",
    name: "Name",
    category: "Category",
    price: "Price",
    fromPrice: "from",
    noName: "No name",
    test: "Test",
    view: "View",
    openOnSite: "Open on site",
    dangerousZone: "Danger zone",
    email: "Email",
    phone: "Phone",
    telegram: "Telegram",
    comment: "Comment",
    client: "Client",
    created: "Created",
    createdAt: "Created",
    lastLogin: "Last login",
    active: "Active",
    inactive: "Disabled",
    saving: "Saving...",
    deleting: "Deleting...",
    applying: "Applying...",
    filtering: "Filtering...",
    uploading: "Uploading...",
    pendingDefault: "Saving...",
    country: "Country",
    address: "Address",
    responsible: "Owner",
    total: "Total",
    item: "Item",
    type: "Type",
    quantity: "Quantity",
    contacts: "Contacts",
    note: "Note",
    password: "Password",
    sourceUrl: "Source URL",
    noComment: "No comment",
    notSelected: "Not selected",
    localeSwitcherLabel: "Language"
  },
  login: {
    eyebrow: "CMS access",
    title: "Admin sign in",
    description: "For catalog administrators and managers only.",
    password: "Password",
    submit: "Sign in",
    pending: "Signing in..."
  },
  shell: {
    brandName: "Vedma CMS",
    brandSub: "Production Admin",
    nav: {
      dashboard: "Dashboard",
      products: "Products",
      services: "Services",
      orders: "Orders",
      requests: "Requests",
      payments: "Payments",
      customers: "Customers",
      media: "Media",
      reviews: "Reviews",
      settings: "Settings",
      users: "Users"
    },
    logout: "Sign out"
  },
  roles: {
    ADMIN: "Administrator",
    MANAGER: "Manager",
    DEMO: "Demo (read-only)"
  },
  demoMode: {
    title: "Demo mode",
    defaultText:
      "This account is read-only. Data changes, uploads, and access to private PDFs are disabled.",
    payments:
      "The demo account can view manual payment history but cannot change statuses or comments.",
    media:
      "The demo account can browse the media library but cannot upload, replace, or delete files.",
    siteMedia:
      "The demo account can view site media slots but cannot save changes.",
    reviews:
      "The demo account can view reviews but cannot create, edit, or delete them.",
    products:
      "The demo account can view product cards but cannot edit, publish, or delete them.",
    services:
      "The demo account can view service cards but cannot edit, publish, or delete them.",
    orders:
      "The demo account can view orders but cannot change statuses, comments, or open private PDFs.",
    requests:
      "The demo account can view requests but cannot change statuses or internal comments.",
    customers:
      "The demo account can view customers but cannot edit notes or open private PDFs."
  },
  pagination: {
    back: "Back",
    forward: "Next",
    pageOf: "Page {page} of {totalPages}"
  },
  filters: {
    allStatuses: "All statuses",
    searchByTitle: "Search by title",
    searchOrder: "Order number, email, or client name",
    searchRequest: "Number, email, or name",
    searchMedia: "Search by name, alt, or path",
    searchReviews: "Search by author, title, or text",
    sortUpdatedDesc: "Recently updated first",
    sortUpdatedAsc: "Oldest first",
    sortTitleAsc: "Title A–Z",
    sortTitleDesc: "Title Z–A",
    sortPriceDesc: "Price high to low",
    sortPriceAsc: "Price low to high",
    bulkPublish: "Publish",
    bulkHide: "Hide",
    bulkDraft: "Move to draft",
    applyToSelected: "Apply to selected",
    resetFilters: "Reset filters",
    resetSearch: "Clear search",
    commerceScope: {
      production: "Production",
      test: "Test",
      all: "All"
    }
  },
  enums: {
    publication: {
      DRAFT: "Draft",
      PUBLISHED: "Published",
      ARCHIVED: "Hidden"
    },
    availability: {
      IN_STOCK: "In stock",
      ON_REQUEST: "Made to order",
      OUT_OF_STOCK: "Out of stock",
      UNKNOWN: "Not specified"
    },
    orderStatus: {
      NEW: "New",
      PENDING_CONFIRMATION: "Pending confirmation",
      AWAITING_PAYMENT: "Awaiting payment",
      PAID: "Paid",
      IN_PROGRESS: "In progress",
      READY_TO_SHIP: "Ready to ship",
      SHIPPED: "Shipped",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      REFUNDED: "Refunded"
    },
    paymentStatus: {
      NOT_ISSUED: "Not issued",
      INVOICE_SENT: "Invoice sent",
      PENDING: "Payment pending",
      PAID: "Paid",
      PARTIAL: "Partially paid",
      FAILED: "Payment failed",
      EXPIRED: "Expired",
      REFUNDED: "Refunded",
      CANCELLED: "Cancelled"
    },
    requestStatus: {
      NEW: "New",
      IN_PROGRESS: "In progress",
      WAITING_FOR_CLIENT: "Waiting for client",
      AWAITING_PAYMENT: "Awaiting payment",
      PAID: "Paid",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
      SPAM: "Spam"
    },
    contactMethod: {
      TELEGRAM: "Telegram",
      PHONE: "Phone",
      EMAIL: "Email",
      VK: "VK",
      WHATSAPP: "WhatsApp"
    },
    productCategories: {
      "Браслеты": "Bracelets",
      "Камни": "Stones",
      "Алтарные товары": "Altar items",
      "Декор": "Decor",
      "Свечи": "Candles",
      "Обереги": "Amulets",
      "Подарки": "Gifts",
      "Прочее": "Other"
    },
    serviceCategories: {
      "Самопознание и практики": "Self-knowledge and practices",
      "Деньги и успех": "Money and success",
      "Диагностика": "Insight work",
      "Трансформационные игры": "Transformational games",
      "Консультации": "Consultations",
      "Прочее": "Other"
    },
    userRoles: {
      ADMIN: "Administrator",
      MANAGER: "Manager",
      DEMO: "Demo (read-only)"
    }
  },
  actions: {
    auth: {
      enterEmailPassword: "Enter email and password.",
      invalidCredentials: "Invalid credentials.",
      accessDenied: "Access denied.",
      loggedOut: "You have signed out.",
      passwordUpdatedLoginAgain: "Password updated. Please sign in again."
    },
    products: {
      slugInUse: "Slug is already in use.",
      saved: "Product saved.",
      notSelected: "No product selected.",
      notFound: "Product not found.",
      deleted: "Product deleted.",
      selectItemsAndAction: "Select items and an action.",
      bulkDone: "Bulk action completed."
    },
    services: {
      slugInUse: "Slug is already in use.",
      saved: "Service saved.",
      notSelected: "No service selected.",
      notFound: "Service not found.",
      deleted: "Service deleted.",
      selectItemsAndAction: "Select items and an action.",
      bulkDone: "Bulk action completed."
    },
    orders: {
      notFound: "Order not found.",
      updated: "Order updated."
    },
    requests: {
      notFound: "Request not found.",
      updated: "Request updated."
    },
    payments: {
      notFound: "Payment not found.",
      updated: "Payment status updated."
    },
    customers: {
      notFound: "Customer not found.",
      noteSaved: "Note saved."
    },
    reviews: {
      saved: "Review saved.",
      notSelected: "No review selected.",
      deleted: "Review deleted."
    },
    media: {
      selectFile: "Select a file to upload.",
      uploaded: "Image uploaded.",
      notSelected: "No media file selected.",
      notFound: "File not found.",
      updated: "File updated.",
      deleted: "File deleted.",
      deleteFailed: "Could not delete file.",
      siteUpdated: "Site media updated.",
      siteSaveFailed: "Could not save site media."
    },
    settings: {
      saved: "Settings saved.",
      seeded: "Default settings initialized."
    },
    users: {
      emailInUse: "Email is already in use.",
      saved: "User saved.",
      notSelected: "No user selected.",
      deactivated: "User deactivated.",
      cannotDeleteSelf: "You cannot delete the current administrator.",
      deleted: "User deleted.",
      passwordRequired: "New password is required.",
      passwordUpdated: "Password updated."
    },
    generic: {
      saveFailed: "Could not save."
    }
  },
  validation: {
    requiredField: "Field «{field}» is required.",
    nonNegativeNumbers: "Numeric fields must be non-negative.",
    slugFailed: "Could not generate slug.",
    saveProductFailed: "Could not save product.",
    saveServiceFailed: "Could not save service.",
    saveReviewFailed: "Could not save review.",
    saveUserFailed: "Could not save user.",
    fields: {
      title: "Title",
      text: "Text",
      email: "Email"
    }
  },
  mediaErrors: {
    imageMime: "Only JPG, PNG, and WEBP up to 10 MB are allowed.",
    storageWrite: "Could not write file on the server. Check storage/uploads.",
    maxSize: "Image size must not exceed 10 MB.",
    notFound: "File not found.",
    unlinkFirst: "Unlink the image from a product or service first."
  },
  forms: {
    catalogEntity: {
      title: "Title",
      slug: "Slug",
      category: "Category",
      selectCategory: "Select category",
      publicationStatus: "Publication status",
      availability: "Availability",
      quantity: "Quantity",
      format: "Format",
      duration: "Duration",
      executionTime: "Lead time",
      purpose: "Purpose",
      priceRub: "Price RUB",
      priceUsd: "Price USD",
      priceLabel: "Price label",
      currency: "Currency",
      shortDescription: "Short description",
      fullDescription: "Full description",
      uploadMainImage: "Upload new main image",
      uploadMainImageHint:
        "JPG, PNG, or WEBP up to 10 MB. If both a file and library media are selected, the file takes priority.",
      selectFromLibrary: "Or select from media library",
      noImage: "No image",
      mainImagePreviewAlt: "Main image preview",
      gallery: "Gallery",
      galleryPlaceholder: "/uploads/... one per line",
      tags: "Tags",
      tagsPlaceholder: "one tag per line",
      seoTitle: "SEO title",
      seoDescription: "SEO description",
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      backToList: "Back to list",
      openOnSite: "Open on site"
    },
    dirtyForm: {
      unsavedChanges: "You have unsaved changes."
    },
    siteMedia: {
      uploadNew: "Upload new image",
      selectFromLibrary: "Or select from media library",
      keepCurrent: "Keep current",
      altText: "Alt text",
      noImageSelected: "No image selected — fallback will be used.",
      save: "Save site media",
      saving: "Saving...",
      logo: {
        label: "Header logo",
        help: "Shown instead of the letter «Б» in the site header."
      },
      hero: {
        label: "Hero portrait",
        help: "Main portrait/visual in the homepage hero block."
      },
      gallery: {
        help: "Image in the homepage gallery."
      },
      direction: {
        label: "Direction: {id}",
        help: "Direction card on the homepage."
      },
      footer: {
        label: "Footer image",
        help: "Optional brand visual in the footer."
      },
      about: {
        label: "About page photo",
        help: "Portrait on the /about page."
      }
    }
  },
  dashboard: {
    eyebrow: "Control panel",
    title: "Production CMS",
    description:
      "Catalog, media, reviews, settings, and users are managed from the live database.",
    addProduct: "Add product",
    addService: "Add service",
    stats: {
      products: "Products",
      services: "Services",
      media: "Media",
      orders: "Orders",
      requests: "Requests",
      payments: "Payments"
    },
    quickActions: {
      title: "Quick actions",
      description: "Jump to the main catalog workflows.",
      newProduct: {
        title: "New product",
        description: "Add a product card and publish immediately or save as draft."
      },
      newService: {
        title: "New service",
        description: "Create a new format, price, and SEO data."
      },
      media: {
        title: "Media",
        description: "Upload, reuse, or replace images."
      },
      settings: {
        title: "Settings",
        description: "Update contacts, SEO, and legal site texts."
      }
    },
    recentUpdates: {
      title: "Recent updates",
      description: "Latest changes in products and services."
    }
  },
  products: {
    eyebrow: "Products",
    title: "Product management",
    description: "Search, filter, bulk actions, and editing for the existing catalog.",
    new: "New product",
    createTitle: "Create product",
    demoNew:
      "The demo account cannot create products. The form is open for structure preview only.",
    empty: {
      title: "No products found",
      text: "Change filters or create a new product card.",
      cta: "Add product"
    },
    detail: {
      eyebrow: "Edit product",
      updatedAt: "Updated {date}",
      dangerousZoneDescription:
        "Deletion does not affect the Package 1 database itself and unlinks media from the card.",
      delete: "Delete product",
      deleteConfirm: "Delete this product? This action cannot be undone.",
      deleting: "Deleting..."
    }
  },
  services: {
    eyebrow: "Services",
    title: "Service management",
    description: "Edit all current service formats with search, sorting, and bulk actions.",
    new: "New service",
    createTitle: "Create service",
    demoNew:
      "The demo account cannot create services. The form is open for structure preview only.",
    empty: {
      title: "No services found",
      text: "Change filters or add a new service.",
      cta: "Add service"
    },
    detail: {
      eyebrow: "Edit service",
      updatedAt: "Updated {date}",
      dangerousZoneDescription:
        "Deletion does not affect the Package 1 database itself and unlinks media from the card.",
      delete: "Delete service",
      deleteConfirm: "Delete this service? This action cannot be undone.",
      deleting: "Deleting..."
    }
  },
  orders: {
    eyebrow: "Orders",
    title: "Commerce backlog",
    description: "New carts, manual payment statuses, and order contents in one table.",
    table: {
      order: "Order",
      client: "Client",
      items: "Items",
      total: "Total",
      statuses: "Statuses",
      created: "Created"
    },
    detail: {
      eyebrow: "Order",
      clientLine: "Client: {name}",
      testOrder: "Test order",
      backToList: "Back to list",
      paymentStubTitle: "Client payment mark",
      paymentStubText:
        "The client clicked «I paid» via the temporary stub. This is not proof of a real payment — verify receipt and update the payment status manually.",
      delivery: "Delivery",
      items: "Order items",
      files: "Files",
      statusHistory: "Status history",
      updateStatus: "Update status",
      adminComment: "Admin comment",
      postalCode: "Postal code: {code}",
      privateFilesAdminOnly: "Private PDFs are available to administrators only.",
      compositionTitle: "Order items",
      compositionDescription: "Prices are snapshotted at checkout.",
      product: "Product",
      service: "Service",
      contactsTitle: "Contacts",
      phoneMissing: "Phone not provided",
      telegramMissing: "Telegram not provided",
      contactMethod: "Contact method",
      addressMissing: "Address not provided.",
      preferredTime: "Preferred time",
      clientCommentTitle: "Client comment",
      filesNone: "No attachments.",
      updateStatusesTitle: "Update statuses",
      updateStatusesDescription: "Payment and fulfillment are updated manually.",
      orderStatus: "Order status",
      paymentStatus: "Payment status",
      saveStatus: "Save status",
      historyTitle: "History",
      historyDescription: "Order event timeline.",
      currentStatus: "Current status",
      currentPayment: "Current payment"
    }
  },
  requests: {
    eyebrow: "Requests",
    title: "Intake requests",
    description: "Each checkout creates a separate request for manual manager handling.",
    table: {
      request: "Request",
      client: "Client",
      selected: "Selected",
      status: "Status",
      responsible: "Owner",
      created: "Created"
    },
    detail: {
      eyebrow: "Request",
      backToList: "Back to list",
      dataTitle: "Request data",
      dataDescription: "Selected item, contacts, and manual comment.",
      selected: "Selected",
      statusHistory: "Status history",
      updateStatus: "Update status",
      internalComment: "Internal comment",
      updateStatusDescription: "The owner is recorded automatically as the current manager.",
      saveRequest: "Save request",
      commentMissing: "No comment provided.",
      historyDescription: "Status change timeline.",
      historyTitle: "History"
    }
  },
  payments: {
    eyebrow: "Payments",
    title: "Manual payment control",
    description:
      "Online acquiring is not connected: the order is created immediately, and the administrator manually confirms payment and sends details to the client.",
    noOrder: "No order",
    update: "Update payment"
  },
  customers: {
    eyebrow: "Customers",
    title: "Customer accounts",
    description: "Accounts are created at checkout or registration and use the same session system.",
    table: {
      client: "Customer",
      contacts: "Contacts",
      orders: "Orders",
      requests: "Requests",
      pdf: "PDF",
      lastLogin: "Last login"
    },
    detail: {
      eyebrow: "Customer",
      backToList: "Back to customers",
      contactsTitle: "Contacts and delivery",
      contactsDescription: "Data from checkout and the customer account.",
      city: "City",
      notesTitle: "Manager notes",
      notesDescription: "Internal notes are visible to administrators and managers only.",
      saveNotes: "Save note",
      ordersTitle: "Orders",
      requestsTitle: "Requests",
      filesTitle: "Files",
      country: "Country",
      address: "Address",
      note: "Note",
      notesDescriptionShort: "Internal note about the customer.",
      ordersDescription: "Customer's recent orders.",
      requestsAndPdfTitle: "Requests and PDFs",
      requestsAndPdfDescription: "Request history and private attachments."
    }
  },
  media: {
    eyebrow: "Media library",
    title: "Media management",
    description: "Uploaded images, alt text, and file replacement without breaking public URLs.",
    file: "File",
    altText: "Alt text",
    upload: "Upload",
    noAlt: "No alt",
    siteMediaCard: {
      title: "Site media",
      description: "Logo, hero portrait, homepage gallery, and direction images.",
      open: "Open site media"
    },
    site: {
      eyebrow: "Site media",
      title: "Site media",
      description:
        "Manage the logo, hero portrait, gallery, and direction images on the public site.",
      backToLibrary: "Back to library"
    },
    detail: {
      eyebrow: "Edit media",
      replaceFile: "Replace file",
      delete: "Delete file",
      deleteConfirm: "Delete this file? This action cannot be undone.",
      sourceUrl: "Source URL",
      openFile: "Open file",
      deleteConfirmLinked:
        "Delete this file from the library? If it is linked to a product or service, deletion will be blocked.",
      demoMetadata:
        "The demo account can view media metadata but cannot edit or delete files."
    }
  },
  reviews: {
    eyebrow: "Reviews",
    title: "Review management",
    description: "Reviews are published on the public page and homepage without redesigning existing blocks.",
    new: "New review",
    createTitle: "Create review",
    demoNew: "The demo account cannot create reviews. The form is open for preview only.",
    defaultAuthor: "Client",
    table: {
      author: "Author",
      title: "Title",
      status: "Status",
      updated: "Updated",
      actions: "Actions"
    },
    empty: {
      title: "No reviews found",
      text: "Create the first review or clear the search.",
      cta: "Add review"
    },
    form: {
      authorName: "Author",
      title: "Title",
      text: "Text",
      image: "Image",
      publicationStatus: "Publication status"
    },
    detail: {
      eyebrow: "Edit review",
      noTitle: "Review without title",
      titleService: "Title / service",
      delete: "Delete review",
      deleteConfirm: "Delete this review? This action cannot be undone."
    }
  },
  settings: {
    eyebrow: "Site settings",
    title: "Texts and SEO management",
    description: "All values are stored in `SiteSetting` and appear on public pages without URL changes.",
    reseed: "Reinitialize defaults",
    save: "Save settings",
    fields: {
      telegram: "Telegram",
      vk: "VK",
      phone: "Phone",
      email: "Email",
      responseHours: "Response hours",
      workFormat: "Work format",
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
      primaryCurrency: "Primary currency",
      secondaryCurrency: "Secondary currency"
    }
  },
  users: {
    eyebrow: "Users",
    title: "Administrator management",
    description: "Only an administrator can create managers, edit roles, and reset passwords.",
    new: "New user",
    createTitle: "Create manager or administrator",
    table: {
      name: "Name",
      email: "Email",
      role: "Role",
      status: "Status",
      lastLogin: "Last login",
      actions: "Actions"
    },
    detail: {
      eyebrow: "Edit user",
      name: "Name",
      email: "Email",
      role: "Role",
      newPassword: "New password",
      passwordPlaceholder: "Leave blank to keep unchanged",
      activeUser: "Active user",
      save: "Save",
      resetPassword: "Reset password",
      resetPasswordPlaceholder: "New password",
      updatePassword: "Update password",
      deactivate: "Deactivate",
      deactivateConfirm: "Deactivate this user and end their sessions?",
      delete: "Delete user",
      deleteConfirm: "Delete this user permanently? This action cannot be undone."
    }
  }
};
