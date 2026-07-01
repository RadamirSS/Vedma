import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const candidates = JSON.parse(
  readFileSync(path.join(repoRoot, "data/vk-services/normalized/services.import-candidates.json"), "utf8")
).services;

/** Natural EN copy — soft tone, no medical/guaranteed-outcome claims. */
const EN = {
  "vk-service-001": {
    title: "Svarog Ritual «Forged Destiny»",
    shortDescription:
      "A ritual of turning to Svarog for a happier path, abundance and love — through the symbolism of the Heavenly Smith who forges life with inner fire.",
    description:
      "From ancient times Svarog was honored as the Heavenly Smith — creator of the sky vault, keeper of sacred fire and master who shapes order in the world. People turned to him when they wanted to strengthen their path, support their lineage, and invite abundance, love and blessing into everyday life. The ritual is a symbolic, energy-focused practice of creation: not a promise of instant change, but an invitation to work with intention, honor and your own inner fire. Conducted remotely; format and timing are agreed individually."
  },
  "vk-service-052": {
    title: "Negative Influence Reading",
    shortDescription:
      "Insight work to explore repeating losses, closed paths and heavy patterns — and to understand what may be blocking harmony in life.",
    description:
      "When life feels like a chain of losses, when stability slips away or difficulties follow one after another, this session helps explore what may be happening on an energetic and symbolic level. The reading looks at patterns that may block money, relationships or openness to good things — not as a medical diagnosis, but as a reflective, confidential format. Available by video call (by appointment) or as an audio recording. For details, message directly."
  },
  "vk-service-002": {
    title: "Sebek Protection",
    shortDescription:
      "A protective ritual through the image of Sebek — endurance, inner strength and symbolic guarding of home and close ones.",
    description:
      "In Egyptian tradition Sebek was associated with the waters of the Nile, fertility and the courage to endure hardship. In some lineages he was seen as a patron of those who carry sacred knowledge and as a guardian who can reflect hidden threat. The ritual is performed remotely using a photograph. It is a symbolic protective practice focused on resilience, clearing heavy experiences and restoring life force after difficult periods — without fear-based pressure."
  },
  "vk-service-053": {
    title: "One-Question Response",
    shortDescription:
      "One clear question — a focused written or audio response when you need a quick symbolic reading or recommendation.",
    description:
      "If a single question needs attention soon, you can ask in a short, precise form. The answer comes in writing or as an audio file. The format suits Tarot, symbolic insight and gentle orientation — not emergency or medical help."
  },
  "vk-service-054": {
    title: "Personal Consultation",
    shortDescription:
      "An individual session to explore a life situation — through Tarot, symbolic reading, transformational practices and gentle psychological support.",
    description:
      "A space to ask what matters, find the root of a situation or gain clarity before a decision. Work may include symbolic diagnosis, trance techniques, transformational games and discussion of ancestral or karmic themes, as well as guidance on a personal amulet if appropriate. This is supportive consultation at the intersection of Tarot, psychology and energy-focused practice — without medical diagnoses or prescribing treatment. Session format is agreed individually (online video)."
  },
  "vk-service-004": {
    title: "«Witch Circle» Protection",
    shortDescription:
      "An ancient-style protective invocation rooted in connection with nature, ancestors and inner light — not attack or revenge.",
    description:
      "In folk magical tradition, true protection grows from connection with the forces of nature, ancestors and one's own soul. The «Witch Circle» format is for those who honor tradition and respect natural powers. Words are spoken with clear intention — often by candlelight or at the hearth — to strengthen boundaries, preserve inner light and support a dignified path. For questions, message on Telegram or WhatsApp."
  },
  "vk-service-055": {
    title: "Metaphorical Card Session",
    shortDescription:
      "Exploring a situation through metaphorical cards — images and symbols that help see feelings, motives and new perspectives.",
    description:
      "Metaphorical cards use images to express thoughts, emotions and hidden layers of a situation. In session we discuss what arises around each card — a gentle way to understand needs, motives and possible next steps. The method works with subconscious symbolism rather than literal prediction. Conducted by video call (appointment required)."
  },
  "vk-service-006": {
    title: "Destiny Matrix Unpacking",
    shortDescription:
      "A personal Destiny Matrix reading based on your birth date — themes of strength, money, relationships and life tasks.",
    description:
      "An individual unpacking of the Destiny Matrix encoded in your birth date. The session explores personality themes, recurring life patterns, innate resources, money and work channels, relationship tendencies and areas for growth. Presented as symbolic self-knowledge work — not a guarantee of specific outcomes. Format and depth are agreed when booking."
  },
  "vk-service-012": {
    title: "Strengthening Ancestral Connection",
    shortDescription:
      "Rod (ancestral) practice to restore a sense of roots, inner support and living memory of lineage.",
    description:
      "There is a strength that cannot be bought — the strength of Rod, one’s lineage. In Slavic tradition a person was never seen as alone: generations stand behind as a living, invisible support. When connection with roots weakens, anxiety and emptiness may grow; when it is restored, clarity and grounding often return. The practice honors ancestors through fire, memory, gratitude and respect for the earth — even without a detailed family tree."
  },
  "vk-service-014": {
    title: "Entering the Money Flow",
    shortDescription:
      "Symbolic reading of your money channel by birth date — where the flow may be blocked and what actions can support change.",
    description:
      "When effort alone does not increase income and money comes but does not stay, the block may lie not only in actions but in the energetic «entry point» of the money channel in the Destiny Matrix. This session identifies what may limit your personal flow and offers simple, practical recommendations — a map for reflection, not a promise of instant wealth. Calculation is based on birth date."
  },
  "vk-service-017": {
    title: "Breaking Through Your Money Ceiling",
    shortDescription:
      "Exploring your symbolic money ceiling by birth date — with optional ritual support for the financial flow.",
    description:
      "The «money ceiling» in this approach is the potential income level encoded in the birth chart — and it can be worked with symbolically when you know what to address. Options include: full work with ceiling mapping, recommendations and a strengthening ritual; mapping and recommendations only; or related marathons listed separately. Message for current packages and pricing tiers."
  },
  "vk-service-020": {
    title: "Destiny Matrix for 2026",
    shortDescription:
      "A year-focused Matrix reading for 2026 — themes, openings and cautions for the coming cycle.",
    description:
      "A Destiny Matrix session oriented to the 2026 year: key themes, resource periods and areas that may need attention. Symbolic planning work for those who already use Matrix language — not fortune-telling with guaranteed events."
  },
  "vk-service-025": {
    title: "Planetary Human Marathon",
    shortDescription:
      "A transformational marathon: awakening and filling with planetary energies — a structured multi-day practice.",
    description:
      "The «Planetary Human» marathon is a guided cycle of practices for awakening and filling with planetary symbolism and inner strength. Format, dates and participation terms are confirmed when enrolling — seasonal marathon offering."
  },
  "vk-service-003": {
    title: "Awakening Witch Power",
    shortDescription:
      "Practice to awaken and strengthen one’s witch (vedma) power — inner authority, intuition and connection with tradition.",
    description:
      "A ritual-practice format focused on awakening and strengthening personal witch power — not as dominance over others, but as deep connection with tradition, intuition and one’s own path. Details and format agreed individually."
  },
  "vk-service-027": {
    title: "Power of Women\'s Hair",
    shortDescription:
      "Symbolic work with the power of women\'s hair — protection, identity and feminine energy in folk tradition.",
    description:
      "In many traditions a woman\'s hair was seen as a channel of power and protection. This session explores symbolic practices around hair as resource, boundary and feminine strength — gentle, non-medical energy-focused work."
  },
  "vk-service-029": {
    title: "Walpurgis Night",
    shortDescription:
      "Seasonal practice for Walpurgis Night — fire, power and the threshold of transition (owner review for dates).",
    description:
      "A seasonal offering tied to Walpurgis Night — time of fire, strength and passage between winter and spring. Imported as draft until the owner confirms dates and relevance for the current year."
  },
  "vk-service-030": {
    title: "Money Flow Restoration Marathon",
    shortDescription:
      "A money-flow marathon: restoration and strengthening of the financial channel through structured daily practices.",
    description:
      "A guided marathon focused on restoring and strengthening the money flow — daily practices, symbolic work and group energy. Enrollment and schedule confirmed directly."
  },
  "vk-service-007": {
    title: "Rest by Birth Date",
    shortDescription:
      "A short symbolic calculation: what kind of rest and recovery your birth date suggests you need.",
    description:
      "Based on birth date, this reading explores what type of rest, rhythm and recovery may support your energy — a small, accessible format from the Matrix toolkit."
  },
  "vk-service-031": {
    title: "Seven Days of Zhiva",
    shortDescription:
      "Seven-day marathon «Become a Bearer of Life» — embodiment of Zhiva\'s living force through daily practice.",
    description:
      "A seven-day marathon dedicated to Zhiva, the Slavic image of living, creating force. Daily practices for embodiment and renewal — marathon format with fixed structure; dates confirmed when enrolling."
  },
  "vk-service-008": {
    title: "Emotional Release",
    shortDescription:
      "A practice for symbolic release of stuck emotions — gentle clearing and return to inner balance.",
    description:
      "When emotions accumulate and weigh on daily life, this session offers a ritual-practice format for symbolic release and soft return to balance. Not psychotherapy or medical treatment — energy-focused supportive work."
  },
  "vk-service-009": {
    title: "Summer Nikola — Path Blessing",
    shortDescription:
      "Summer Nikola practice: protection and blessing of the path — seasonal ritual support.",
    description:
      "A seasonal ritual associated with Summer Nikola — protection and blessing of one\'s road and endeavors. Conducted in the appropriate seasonal window; symbolic, tradition-honoring format."
  },
  "vk-service-013": {
    title: "Destiny Number & Karmic Tasks",
    shortDescription:
      "Calculation of destiny-number energy and karmic task themes from your birth date.",
    description:
      "Explores the energy of your destiny number and karmic task themes as reflected in the birth chart — for self-understanding and direction, not as fixed fate."
  },
  "vk-service-016": {
    title: "Talent by Birth Date",
    shortDescription:
      "A calculation of innate talent and gift themes encoded in your birth date.",
    description:
      "A compact Matrix-based reading of talent and natural gift themes — what may be easiest to develop and share. Short format, ideal as an entry-level service."
  },
  "vk-service-040": {
    title: "Samhain",
    shortDescription:
      "Seasonal Samhain practice — threshold of autumn, ancestors and inner transition (draft until date confirmed).",
    description:
      "Samhain — the autumn threshold when the veil between worlds is honored in Celtic and folk magical tradition. Seasonal offering; published as draft until the owner sets dates for the current year."
  },
  "vk-service-047": {
    title: "Kupalo",
    shortDescription:
      "Kupalo — midsummer sun night: purification, fire and the great circle of life in Slavic tradition.",
    description:
      "Kupalo honors the night of the great sun — purification, fire, water and the living wheel of the year. A seasonal ritual-practice in the Slavic cycle; relevance depends on the calendar window."
  }
};

const bySourceId = {};
for (const candidate of candidates) {
  const entry = EN[candidate.sourceId];
  if (!entry) {
    throw new Error(`Missing EN translation for ${candidate.sourceId}`);
  }
  bySourceId[candidate.sourceId] = entry;
}

writeFileSync(
  path.join(repoRoot, "data/vk-services/normalized/services.import-translations.en.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), bySourceId }, null, 2),
  "utf8"
);

console.log(`Wrote ${Object.keys(bySourceId).length} EN translations`);
