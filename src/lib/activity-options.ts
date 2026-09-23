// drivingMin/walkingMin are approximate travel time *from the hotel*
// (Galeria Plaza Reforma), by car and on foot - rough estimates for
// planning purposes, not live routing, so actual time will vary with
// traffic/route.
export const ACTIVITY_OPTIONS = [
  {
    key: "FRIDA_KAHLO_HOUSE",
    label: "Frida Kahlo House tour",
    url: "https://www.museofridakahlo.org.mx/visit/?lang=en",
    drivingMin: 30,
    walkingMin: 105,
  },
  {
    key: "CHAPULTEPEC_CASTLE",
    label: "Chapultepec Castle - Guided or self-guided tour within the national park",
    url: "https://mnh.inah.gob.mx/",
    drivingMin: 10,
    walkingMin: 25,
  },
  {
    key: "LUCHA_LIBRE",
    label: "Lucha Libre show",
    url: "https://en.wikipedia.org/wiki/Lucha_libre",
    drivingMin: 10,
    walkingMin: 20,
  },
  {
    key: "TEQUILA_TOUR",
    label: "Tequila tour - Around town or at The Tequila and Mezcal Museum",
    url: "https://mutem.mx/",
    drivingMin: 10,
    walkingMin: 35,
  },
  {
    key: "SOCCER_MATCH",
    label: "US/Canada/Ireland vs. LATAM soccer/football match at local field",
    drivingMin: 12,
    walkingMin: 22,
  },
  { key: "FREE_TIME", label: "I would rather have free time" },
  { key: "OTHER", label: "Other" },
] as const;

export type ActivityOptionKey = (typeof ACTIVITY_OPTIONS)[number]["key"];

export const ACTIVITY_OPTION_KEYS = ACTIVITY_OPTIONS.map((o) => o.key) as [
  ActivityOptionKey,
  ...ActivityOptionKey[],
];
