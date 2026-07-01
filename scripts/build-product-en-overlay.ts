import { writeFile } from "node:fs/promises";
import path from "node:path";

import { products } from "../lib/catalog-data";

const WORD_MAP: Record<string, string> = {
  altarnaya: "Altar",
  altarnoe: "Altar",
  podstavka: "stand",
  pokryvalo: "cloth",
  braslet: "Bracelet",
  iz: "from",
  lunnogo: "moon",
  kamnya: "stone",
  kamen: "stone",
  kamni: "stones",
  ocharovanie: "Enchantment",
  arhangel: "Archangel",
  mihail: "Michael",
  gavriil: "Gabriel",
  rafail: "Raphael",
  anubis: "Anubis",
  chakrovaya: "Chakra",
  garmoniya: "Harmony",
  korobok: "Box",
  dlya: "for",
  spicek: "matches",
  svecha: "Candle",
  svechi: "Candles",
  obereg: "Amulet",
  talisman: "Talisman",
  amulet: "Amulet",
  koshachego: "cat's eye",
  glaza: "eye",
  flyuorita: "fluorite",
  ametista: "amethyst",
  kvarca: "quartz",
  agata: "agate",
  obsidian: "obsidian",
  lunniy: "moon",
  lunnyy: "moon",
  sergi: "Earrings",
  serga: "Earring",
  zakolka: "Hair clip",
  sumka: "Bag",
  chasy: "Clock",
  bokal: "Goblet",
  kovrik: "Mat",
  nabor: "Set",
  podarok: "Gift",
  dekor: "Decor",
  skatert: "Tablecloth",
  podnos: "Tray",
  figurka: "Figurine",
  statuetka: "Figurine",
  kristall: "Crystal",
  runa: "Rune",
  runy: "Runes",
  podveska: "Pendant",
  koltso: "Ring",
  kolco: "Ring",
  bukva: "Letter",
  simvol: "Symbol",
  miska: "Bowl",
  chasha: "Chalice",
  pachuli: "Patchouli",
  lavanda: "Lavender",
  sandal: "Sandalwood",
  mirra: "Myrrh",
  kedr: "Cedar",
  rozmarin: "Rosemary",
  yasmin: "Jasmine",
  vanil: "Vanilla",
  med: "Honey",
  mednyy: "Copper",
  chernyy: "Black",
  belyy: "White",
  krasnyy: "Red",
  zelenyy: "Green",
  siniy: "Blue",
  fioletovyy: "Purple",
  rozovyy: "Pink",
  zolotoy: "Golden",
  serebryanyy: "Silver",
  malenkiy: "Small",
  bolshoy: "Large",
  sredniy: "Medium",
  mini: "Mini",
  maxi: "Maxi",
  novyy: "New",
  staryy: "Vintage",
  ruchnaya: "Handmade",
  rabota: "work",
  magiya: "Magic",
  zhizni: "Life",
  zashchita: "Protection",
  sila: "Power",
  energiya: "Energy",
  garmoniya: "Harmony",
  balans: "Balance",
  udacha: "Luck",
  deneg: "Money",
  denezhnyy: "Money",
  magnit: "Magnet",
  transformatsionnaya: "Transformational",
  igra: "Game"
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  Bracelets: "Handmade bracelet for personal practice and everyday wear.",
  Stones: "Natural stone for meditation, altar work and personal energy practice.",
  "Altar items": "Altar item for ritual work and creating your sacred space.",
  Decor: "Decorative piece for altar, home or personal collection.",
  Candles: "Candle for ritual work, meditation and atmosphere.",
  Amulets: "Amulet or protective item for personal practice.",
  Gifts: "Thoughtful magical gift or souvenir.",
  Other: "Magical product for personal practice."
};

function titleCase(words: string[]) {
  return words
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function slugToTitle(slug: string) {
  const parts = slug.split("-").filter((part) => !/^\d+$/.test(part));
  const words = parts.map((part) => WORD_MAP[part] ?? part.replace(/yy$/, "y"));
  return titleCase(words);
}

function categoryHint(category: string | undefined) {
  if (!category) {
    return CATEGORY_DESCRIPTIONS.Other;
  }

  const englishPart = category.includes(" ")
    ? category.split(" ").slice(1).join(" ")
    : category;

  for (const [key, description] of Object.entries(CATEGORY_DESCRIPTIONS)) {
    if (englishPart.toLowerCase().includes(key.toLowerCase())) {
      return description;
    }
  }

  return CATEGORY_DESCRIPTIONS.Other;
}

async function main() {
  const bySlug: Record<
    string,
    { title: string; shortDescription: string; description: string; fullDescription?: string }
  > = {};

  for (const product of products) {
    const title = slugToTitle(product.slug);
    const shortDescription = categoryHint(product.category);
    bySlug[product.slug] = {
      title,
      shortDescription,
      description: shortDescription,
      fullDescription: shortDescription
    };
  }

  const outputPath = path.join(repoRoot, "data/catalog/product-translations.en.json");
  await writeFile(
    outputPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), bySlug }, null, 2)}\n`,
    "utf8"
  );

  console.log(`Wrote ${Object.keys(bySlug).length} product EN overlays to ${outputPath}`);
}

const repoRoot = process.cwd();

void main();
