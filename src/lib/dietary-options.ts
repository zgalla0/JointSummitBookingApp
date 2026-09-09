export const DIETARY_OPTIONS = [
  { key: "NONE", label: "None" },
  { key: "VEGETARIAN", label: "Vegetarian" },
  { key: "VEGAN", label: "Vegan" },
  { key: "GLUTEN_FREE", label: "Gluten Free" },
  { key: "SHELLFISH", label: "Shellfish" },
  { key: "KOSHER", label: "Kosher" },
  { key: "HALAL", label: "Halal" },
  { key: "NO_PEANUTS", label: "No Peanuts" },
  { key: "NO_NUTS", label: "No Nuts (Peanuts ok)" },
  { key: "PESCATARIAN", label: "Pescatarian" },
  { key: "OTHER", label: "Other" },
] as const;

export type DietaryOptionKey = (typeof DIETARY_OPTIONS)[number]["key"];

export const DIETARY_OPTION_KEYS = DIETARY_OPTIONS.map((o) => o.key) as [
  DietaryOptionKey,
  ...DietaryOptionKey[],
];
