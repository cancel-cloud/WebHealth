export type QueryIntent = "informational" | "commercial" | "navigational";

// Navigational signals (brand/domain-like patterns)
const NAVIGATIONAL_PATTERNS = [
  /\b(login|sign in|sign up|register|account|dashboard|portal|my [\w]+)\b/i,
  /\b(contact|about us|homepage|home page|official site)\b/i,
];

// Commercial signals
const COMMERCIAL_PATTERNS = [
  /\b(buy|purchase|order|shop|store|price|cost|cheap|discount|deal|sale|offer)\b/i,
  /\b(best|top|review|reviews|vs|versus|compare|comparison|alternative)\b/i,
  /\b(kaufen|preis|günstig|bestellen|angebot|shop|rabatt|vergleich)\b/i,
];

export function classifyQueryIntent(query: string, domainName?: string): QueryIntent {
  const q = query.toLowerCase().trim();

  // Navigational: query includes domain name
  if (domainName) {
    const domain = domainName.replace(/^www\./, "").replace(/\.[^.]+$/, "").toLowerCase();
    if (domain.length > 2 && q.includes(domain)) return "navigational";
  }

  // Navigational: matches known navigational patterns
  for (const pattern of NAVIGATIONAL_PATTERNS) {
    if (pattern.test(q)) return "navigational";
  }

  // Commercial: matches commercial patterns
  for (const pattern of COMMERCIAL_PATTERNS) {
    if (pattern.test(q)) return "commercial";
  }

  // Default: informational
  return "informational";
}
