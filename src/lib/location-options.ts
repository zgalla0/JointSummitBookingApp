export const LOCATION_OPTIONS = [
  { key: "US_CAN_IRE", label: "US + Canada + Ireland" },
  { key: "LATAM", label: "LATAM" },
] as const;

export type LocationKey = (typeof LOCATION_OPTIONS)[number]["key"];

export const LOCATION_KEYS = LOCATION_OPTIONS.map((o) => o.key) as [LocationKey, ...LocationKey[]];
