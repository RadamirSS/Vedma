const CYRILLIC = /[\u0400-\u04FF]/;

const baseUrl = process.env.PKG357_BASE_URL ?? "http://127.0.0.1:3000";
const paths = ["/en/services", "/en/products"];

async function fetchPage(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status}`);
  }
  return response.text();
}

function extractProductCardTexts(html: string) {
  const cards: string[] = [];
  const cardRegex = /<article class="product-card">([\s\S]*?)<\/article>/g;
  let match: RegExpExecArray | null;

  while ((match = cardRegex.exec(html)) !== null) {
    const cardHtml = match[1];
    const text = cardHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    cards.push(text);
  }

  return cards;
}

async function main() {
  const failures: string[] = [];

  for (const path of paths) {
    const html = await fetchPage(path);
    const cards = extractProductCardTexts(html);

    if (cards.length === 0) {
      failures.push(`${path}: no .product-card elements found`);
      continue;
    }

    cards.forEach((text, index) => {
      if (CYRILLIC.test(text)) {
        failures.push(`${path} card #${index + 1}: ${text.slice(0, 120)}`);
      }
    });
  }

  if (failures.length > 0) {
    console.error("Cyrillic detected in EN catalog cards:\n" + failures.join("\n"));
    process.exitCode = 1;
    return;
  }

  console.log(`check-en-catalog-cyrillic: ok (${paths.join(", ")})`);
}

void main();
