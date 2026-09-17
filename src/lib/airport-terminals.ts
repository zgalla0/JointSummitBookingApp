// Which terminal at Mexico City International Airport (MEX) each airline
// uses, so the admin flights page can group arrivals/departures by terminal
// as a starting point for building carpool groups.
export const TERMINAL_1_AIRLINES = [
  "Volaris",
  "Viva Aerobus",
  "Magnicharters",
  "American Airlines",
  "United Airlines",
  "Air Canada",
  "WestJet",
  "Air France",
  "British Airways",
  "KLM",
  "Lufthansa",
  "Emirates",
  "Iberia",
  "Turkish Airlines",
  "ANA",
  "Avianca",
  "Hainan Airlines",
  "China Southern Airlines",
] as const;

export const TERMINAL_2_AIRLINES = ["Aeroméxico", "Aeroméxico Connect", "Delta Air Lines"] as const;

// Reported inconsistently across sources (sometimes T1, sometimes T2,
// possibly seasonal/gate-dependent) - flagged separately rather than
// guessed, since carpool planning depends on getting this right.
export const AMBIGUOUS_TERMINAL_AIRLINES = ["Copa Airlines"] as const;

export type Terminal = "1" | "2" | "ambiguous" | "unknown";

function normalize(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // strip accents so "Aeromexico" matches "Aeroméxico"
}

const TERMINAL_1_SET = new Set(TERMINAL_1_AIRLINES.map(normalize));
const TERMINAL_2_SET = new Set(TERMINAL_2_AIRLINES.map(normalize));
const AMBIGUOUS_SET = new Set(AMBIGUOUS_TERMINAL_AIRLINES.map(normalize));

export function terminalForAirline(airline: string | null | undefined): Terminal {
  if (!airline) return "unknown";
  const key = normalize(airline);
  if (TERMINAL_1_SET.has(key)) return "1";
  if (TERMINAL_2_SET.has(key)) return "2";
  if (AMBIGUOUS_SET.has(key)) return "ambiguous";
  return "unknown";
}

export function terminalLabel(terminal: Terminal): string {
  switch (terminal) {
    case "1":
      return "Terminal 1";
    case "2":
      return "Terminal 2";
    case "ambiguous":
      return "Terminal uncertain (varies by flight)";
    case "unknown":
      return "Terminal unknown";
  }
}
