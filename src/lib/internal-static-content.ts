/** Keys in the shared StaticContent table used for internal bookkeeping
 *  rather than public-facing FAQ/event-info content. The public booking
 *  pages must exclude these when listing content to show attendees. */
// Legacy - the "View All Data" export no longer tracks a "since" baseline
// (it's a full, unfiltered dump now), so nothing writes this key going
// forward. Still excluded here in case an old row is still sitting in an
// existing database; removing it from this list would make that leftover
// row reappear as an untitled entry in the admin Static Content page.
export const LAST_EXPORT_PULLED_AT_KEY = "lastExportPulledAt";
export const LAST_HOTEL_EXPORT_PULLED_AT_KEY = "lastHotelExportPulledAt";

export const INTERNAL_STATIC_CONTENT_KEYS = [LAST_EXPORT_PULLED_AT_KEY, LAST_HOTEL_EXPORT_PULLED_AT_KEY];
