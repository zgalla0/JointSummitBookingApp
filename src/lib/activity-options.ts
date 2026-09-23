export const ACTIVITY_OPTIONS = [
  { key: "FRIDA_KAHLO_HOUSE", label: "Frida Kahlo House tour" },
  {
    key: "CHAPULTEPEC_CASTLE",
    label: "Chapultepec Castle - Guided or self-guided tour within the national park",
  },
  { key: "LUCHA_LIBRE", label: "Lucha Libre show" },
  {
    key: "TEQUILA_TOUR",
    label: "Tequila tour - Around town or at The Tequila and Mezcal Museum",
  },
  { key: "FREE_TIME", label: "I would rather have free time" },
  { key: "OTHER", label: "Other" },
] as const;

export type ActivityOptionKey = (typeof ACTIVITY_OPTIONS)[number]["key"];

export const ACTIVITY_OPTION_KEYS = ACTIVITY_OPTIONS.map((o) => o.key) as [
  ActivityOptionKey,
  ...ActivityOptionKey[],
];
