/** Keys in the shared StaticContent table used for internal bookkeeping
 *  rather than public-facing FAQ/event-info content. The public booking
 *  pages must exclude these when listing content to show attendees. */
export const LAST_EXPORT_PULLED_AT_KEY = "lastExportPulledAt";
export const LAST_HOTEL_EXPORT_PULLED_AT_KEY = "lastHotelExportPulledAt";

export const INTERNAL_STATIC_CONTENT_KEYS = [LAST_EXPORT_PULLED_AT_KEY, LAST_HOTEL_EXPORT_PULLED_AT_KEY];
