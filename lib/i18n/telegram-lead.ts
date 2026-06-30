const TELEGRAM = "https://t.me/Bazhena13witch";

export function buildTelegramLeadUrl(prefix: string, topic: string) {
  return `${TELEGRAM}?text=${encodeURIComponent(`${prefix}${topic}`)}`;
}
