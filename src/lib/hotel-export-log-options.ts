// Shared between the "Send to Hotel" form and its API route so the two
// can't drift on what a valid selection looks like.

export const HOTEL_EXPORT_PULLER_OPTIONS = ["Dani V", "Tyler", "Zahra", "Other"] as const;

export const HOTEL_EXPORT_PURPOSE_DEFAULT = "Send the hotel an updated hotel roster.";

export const HOTEL_EXPORT_PURPOSE_OPTIONS = [HOTEL_EXPORT_PURPOSE_DEFAULT, "Other"] as const;
