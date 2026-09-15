export const ROOM_TYPES = [
  { key: "DELUXE", label: "Deluxe Room", priceUsd: 105 },
  { key: "BRISAS", label: "Brisas Business Club", priceUsd: 145 },
] as const;

export type RoomTypeKey = (typeof ROOM_TYPES)[number]["key"];

export const ROOM_TYPE_KEYS = ROOM_TYPES.map((o) => o.key) as [RoomTypeKey, ...RoomTypeKey[]];
