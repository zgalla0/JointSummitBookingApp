import { z } from "zod";
import { DIETARY_OPTION_KEYS } from "./dietary-options";
import { ROOM_TYPE_KEYS } from "./room-types";
import { LOCATION_KEYS } from "./location-options";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

// No min-length here: a fully blank row (added via "+ Add guest" then left
// untouched) is filtered out by the guests array transform below rather than
// blocking submission. A partially filled row still needs both names, which
// the array-level refine enforces after filtering.
export const guestSchema = z.object({
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  type: z.enum(["ADULT", "CHILD"]),
  attendingHappyHour: z.boolean(),
  attendingDinner: z.boolean(),
  dietaryOptions: z.array(z.enum(DIETARY_OPTION_KEYS)).max(DIETARY_OPTION_KEYS.length),
  dietaryOther: z.string().trim().max(500),
});

// Step 0: duplicate check, collected before the rest of the form.
export const identitySchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Enter a valid email"),
});

export const bookingFormSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),

    // False skips every requirement below (stay dates, etc.) - the form
    // greys those sections out and lets a non-attendee submit right away.
    isAttending: z.boolean(),

    reservationFirstName: z.string().trim().min(1, "First name for the reservation is required"),
    reservationLastName: z.string().trim().min(1, "Last name for the reservation is required"),
    hotelEmail: z.string().trim().email("Enter a valid email"),
    detailsEmail: z.string().trim().email("Enter a valid email"),

    // "" is only a valid form-default (nothing chosen yet); the refine
    // below rejects it at submit time so this is effectively mandatory.
    // The explicit `: boolean` return type matters: without it, TS 5.5+
    // infers this as a type predicate and zod narrows "" out of the
    // schema's output type, which then breaks the form's own type (it
    // legitimately holds "" before the user picks one).
    location: z
      .enum([...LOCATION_KEYS, ""])
      .refine((v): boolean => v !== "", { message: "Please select your location" }),

    attendingHappyHour: z.boolean(),
    attendingAllHands: z.boolean(),
    attendingDinner: z.boolean(),

    // "" when not attending (or not yet chosen); enforced as a real
    // YYYY-MM-DD pair only when isAttending is true, in the superRefine
    // below, since a non-attendee never needs to pick stay dates at all.
    stayStart: z.string().trim(),
    stayEnd: z.string().trim(),
    companyPaidNights: z.array(isoDate).max(31),

    // "" when the stay never leaves the standard block; required (checked
    // server-side, where the block config lives) whenever it does.
    extraNightsRoomType: z.enum([...ROOM_TYPE_KEYS, ""]),

    ptoDates: z.array(isoDate).max(31),

    guests: z
      .array(guestSchema)
      .transform((guests) => guests.filter((g) => g.firstName !== "" || g.lastName !== ""))
      .refine((guests) => guests.length <= 2, {
        message: "Up to 2 additional guests (max room occupancy is 3)",
      })
      .refine((guests) => guests.every((g) => g.firstName !== "" && g.lastName !== ""), {
        message: "Please fill in both first and last name for each additional guest",
      }),

    dietaryOptions: z.array(z.enum(DIETARY_OPTION_KEYS)).max(DIETARY_OPTION_KEYS.length),
    dietaryOther: z.string().trim().max(500),

    flightArrivalAirline: z.string().trim().max(200),
    flightArrivalNumber: z.string().trim().max(50),
    flightArrival: z.string().trim(), // datetime-local string, may be empty
    flightDepartureAirline: z.string().trim().max(200),
    flightDepartureNumber: z.string().trim().max(50),
    flightDeparture: z.string().trim(),
    flightNotes: z.string().trim().max(2000),

    additionalNotes: z.string().trim().max(2000),
  })
  .superRefine((data, ctx) => {
    // Not attending: none of the stay-date requirements below apply.
    if (!data.isAttending) return;

    if (!isoDate.safeParse(data.stayStart).success || !isoDate.safeParse(data.stayEnd).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select your stay nights",
        path: ["stayEnd"],
      });
      return;
    }
    if (data.stayEnd <= data.stayStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stay end date must be after the start date",
        path: ["stayEnd"],
      });
    }
  });

export type BookingFormInput = z.infer<typeof bookingFormSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
export type IdentityInput = z.infer<typeof identitySchema>;
