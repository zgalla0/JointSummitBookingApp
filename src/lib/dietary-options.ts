export const DIETARY_OPTIONS = [
  { key: "VEGETARIAN", label: "Vegetarian" },
  { key: "VEGAN", label: "Vegan" },
  { key: "HALAL", label: "Halal" },
  { key: "KOSHER", label: "Kosher" },
  { key: "PEANUTS", label: "Peanuts" },
  { key: "TREE_NUTS", label: "Tree nuts" },
  { key: "DAIRY", label: "Milk and dairy" },
  { key: "EGGS", label: "Eggs" },
  { key: "GLUTEN_FREE", label: "Gluten Free" },
  { key: "SHELLFISH", label: "Shellfish" },
  { key: "SESAME", label: "Sesame" },
  { key: "OTHER", label: "Other" },
] as const;

export type DietaryOptionKey = (typeof DIETARY_OPTIONS)[number]["key"];

export const DIETARY_OPTION_KEYS = DIETARY_OPTIONS.map((o) => o.key) as [
  DietaryOptionKey,
  ...DietaryOptionKey[],
];
