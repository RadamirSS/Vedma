/**
 * VK Services & Products Console Exporter
 *
 * Usage (Cursor internal browser DevTools on https://vk.com/bazhena13witch):
 * 1. Log in to VK in the browser
 * 2. Open DevTools → Console
 * 3. Paste this entire script and press Enter
 * 4. Follow prompts; JSON downloads as vk_services_export.json
 */
(async function vkExportBazhena() {
  const PAGE_SLUG = "bazhena13witch";
  const BASE = `https://vk.com/${PAGE_SLUG}`;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function absUrl(href) {
    if (!href) return null;
    try {
      return new URL(href, location.origin).href.split("#")[0];
    } catch {
      return null;
    }
  }

  function normalizeText(s) {
    return (s || "").replace(/\s+/g, " ").trim();
  }

  function bestImageUrl(url) {
    if (!url) return null;
    return url
      .replace(/&amp;/g, "&")
      .replace(/([?&])cs=\d+x\d+/, "$1cs=0x0")
      .replace(/([?&])w=\d+/, "$1w=2560")
      .replace(/([?&])h=\d+/, "$1h=2560");
  }

  function collectImageUrls(root) {
    const urls = new Set();
    root.querySelectorAll("img[src], img[data-src], [style*='background-image']").forEach((el) => {
      const src = el.getAttribute("src") || el.getAttribute("data-src");
      if (src && /userapi|vk\.com|vk\.me|mycdn/i.test(src)) {
        urls.add(bestImageUrl(src));
      }
      const bg = el.style?.backgroundImage || "";
      const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (m && /userapi|vk\.com|vk\.me|mycdn/i.test(m[1])) {
        urls.add(bestImageUrl(m[1]));
      }
    });
    return [...urls].filter(Boolean);
  }

  async function scrollToBottom(container, maxRounds = 30) {
    let prev = 0;
    for (let i = 0; i < maxRounds; i++) {
      const el = container || document.scrollingElement;
      el.scrollTop = el.scrollHeight;
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(800);
      const h = document.body.scrollHeight;
      if (h === prev) break;
      prev = h;
    }
  }

  function findSectionLinks() {
    const links = [];
    document.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      const text = normalizeText(a.textContent).toLowerCase();
      if (
        /услуг|товар|market|uslugi|product/i.test(href) ||
        /услуг|товар/i.test(text)
      ) {
        const url = absUrl(href);
        if (url && url.includes("vk.com")) links.push({ url, text });
      }
    });
    return links;
  }

  function extractCardsFromPage(section) {
    const cards = new Map();
    const selectors = [
      "a[href*='w=product']",
      "a[href*='market']",
      "a[href*='uslugi']",
      ".market_row",
      ".MarketItem",
      ".services_catalog_item",
      "[class*='ServiceCard']",
      "[class*='MarketCard']",
    ];

    selectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((node) => {
        const linkEl = node.closest("a") || node.querySelector("a") || (node.tagName === "A" ? node : null);
        const cardUrl = absUrl(linkEl?.getAttribute("href"));
        if (!cardUrl || !/vk\.com/.test(cardUrl)) return;

        const titleEl =
          node.querySelector("[class*='title'], [class*='Title'], .market_row_name, h3, h4") ||
          linkEl;
        const title = normalizeText(titleEl?.textContent);
        if (!title || title.length < 2) return;

        const priceEl = node.querySelector("[class*='price'], [class*='Price'], .market_row_price");
        const priceText = normalizeText(priceEl?.textContent);
        const img = node.querySelector("img");
        const imageUrls = img?.src ? [bestImageUrl(img.src)] : [];
        const categoryEl = node.querySelector("[class*='category'], [class*='subtitle']");
        const category = normalizeText(categoryEl?.textContent);
        const shortText = normalizeText(
          node.querySelector("[class*='description'], [class*='text'], p")?.textContent
        );

        const key = cardUrl.split("?")[0] + "|" + title.toLowerCase();
        if (!cards.has(key)) {
          cards.set(key, {
            sourceSection: section,
            cardUrl,
            title,
            priceText,
            category,
            shortText,
            fullText: shortText,
            imageUrls: imageUrls.filter(Boolean),
            scrapedAt: new Date().toISOString(),
          });
        }
      });
    });

    return [...cards.values()];
  }

  async function enrichFromDetail(card) {
    try {
      const resp = await fetch(card.cardUrl, { credentials: "include" });
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const title =
        normalizeText(
          doc.querySelector("h1, .market_item_title, [class*='ServiceTitle'], [class*='market_title']")
            ?.textContent
        ) || card.title;

      const priceText =
        normalizeText(
          doc.querySelector("[class*='price'], [class*='Price'], .market_item_price")?.textContent
        ) || card.priceText;

      const fullText = normalizeText(
        doc.querySelector(
          ".market_item_description, [class*='description'], [class*='Description'], .service_description"
        )?.textContent
      );

      const imageUrls = collectImageUrls(doc.body);
      const category =
        normalizeText(doc.querySelector("[class*='category'], [class*='breadcrumb']")?.textContent) ||
        card.category;

      return {
        ...card,
        title,
        priceText,
        category,
        fullText: fullText || card.shortText,
        imageUrls: [...new Set([...(card.imageUrls || []), ...imageUrls])],
        scrapedAt: new Date().toISOString(),
      };
    } catch (e) {
      console.warn("Detail fetch failed:", card.cardUrl, e);
      return card;
    }
  }

  function downloadJson(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  console.log("VK Export: scrolling page to load cards...");
  await scrollToBottom();

  const sectionLinks = findSectionLinks();
  console.log("Found section links:", sectionLinks);

  let allCards = extractCardsFromPage("unknown");
  console.log(`Found ${allCards.length} cards on current page`);

  const sections = [
    { name: "services", patterns: [/услуг/i, /uslugi/i] },
    { name: "products", patterns: [/товар/i, /market/i] },
  ];

  for (const sec of sections) {
    const link = sectionLinks.find((l) => sec.patterns.some((p) => p.test(l.url) || p.test(l.text)));
    if (link) {
      console.log(`Navigate manually to ${sec.name}: ${link.url}`);
      console.log("Re-run vkExportBazhena() after navigation, or cards from current view are included.");
    }
  }

  const unique = new Map();
  allCards.forEach((c) => {
    const key = (c.cardUrl || "") + "|" + c.title.toLowerCase();
    if (!unique.has(key)) unique.set(key, c);
  });
  allCards = [...unique.values()];

  console.log(`Enriching ${allCards.length} cards from detail pages (may take a while)...`);
  const enriched = [];
  for (let i = 0; i < allCards.length; i++) {
    console.log(`[${i + 1}/${allCards.length}] ${allCards[i].title}`);
    enriched.push(await enrichFromDetail(allCards[i]));
    await sleep(400);
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    sourcePage: BASE,
    sections: ["services", "products"],
    totalCards: enriched.length,
    items: enriched,
  };

  console.log("Export complete:", exportData);
  downloadJson(exportData, "vk_services_export.json");
  return exportData;
})();
