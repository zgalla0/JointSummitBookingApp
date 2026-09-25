import { z } from "zod";
import { DIETARY_OPTION_KEYS } from "./dietary-options";
import { ACTIVITY_OPTION_KEYS } from "./activity-options";
import { ROOM_TYPE_KEYS } from "./room-types";
import { LOCATION_KEYS } from "./location-options";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

// Shared by identitySchema and bookingFormSchema, which both require a real
// Cuesta email, so the domain check and its message can't drift apart.
const cuestaEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email")
  .refine((v) => v.toLowerCase().endsWith("@cuestapartners.com"), {
    message: "Cuesta email must be a @cuestapartners.com address",
  });

// A row added via "+ Add guest" (blank or partially filled) is required to
// be completed, not silently dropped - the array-level refine below rejects
// it, telling the attendee to fill it in or remove that guest.
const guestSchema = z
  .object({
    firstName: z.string().trim(),
    lastName: z.string().trim(),
    type: z.enum(["ADULT", "CHILD"]),
    attendingHappyHour: z.boolean(),
    attendingDinner: z.boolean(),
    dietaryOptions: z.array(z.enum(DIETARY_OPTION_KEYS)).max(DIETARY_OPTION_KEYS.length),
    dietaryOther: z.string().trim().max(500),
  })
  .superRefine((guest, ctx) => {
    if ((guest.attendingHappyHour || guest.attendingDinner) && guest.dietaryOptions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select at least one option (choose "None" if there are no restrictions)',
        path: ["dietaryOptions"],
      });
    }
  });

// Step 0: duplicate check, collected before the rest of the form. This
// email carries through as the one Cuesta email used for the whole
// booking (see BookingFields.tsx) - hence the same domain requirement.
export const identitySchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: cuestaEmailSchema,
});

// "Resend my link" lookup - everyone is unique by email, so this is the
// only input the lookup needs (no name).
export const emailLookupSchema = z.object({
  email: cuestaEmailSchema,
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
    // Optional: only needed if the attendee wants something other than their
    // legal name printed on their summit name tag.
    nameTag: z.string().trim().max(200),
    hotelEmail: z.string().trim().email("Enter a valid email"),
    detailsEmail: z.string().trim().email("Enter a valid email"),
    cuestaEmail: cuestaEmailSchema,

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
    // Optional (arrive-early) nights the attendee has explicitly confirmed
    // as self-pay - tracked separately from "absent from companyPaidNights"
    // so that state can mean "hasn't chosen yet" instead of silently
    // defaulting to self-pay. Not persisted; checked at submit time only
    // (see hasUndecidedNights in BookingFields.tsx).
    selfPayNights: z.array(isoDate).max(31),

    // "" when the stay never leaves the standard block; required (checked
    // server-side, where the block config lives) whenever it does.
    extraNightsRoomType: z.enum([...ROOM_TYPE_KEYS, ""]),

    ptoDates: z.array(isoDate).max(31),

    guests: z
      .array(guestSchema)
      .refine((guests) => guests.length <= 2, {
        message: "Up to 2 additional guests (max room occupancy is 3)",
      })
      .refine((guests) => guests.every((g) => g.firstName !== "" && g.lastName !== ""), {
        message: "Please fill in both first and last name for each additional guest, or remove them",
      }),

    dietaryOptions: z.array(z.enum(DIETARY_OPTION_KEYS)).max(DIETARY_OPTION_KEYS.length),
    dietaryOther: z.string().trim().max(500),

    // Interest poll, not a commitment - optional, no minimum-selection
    // requirement like dietaryOptions has.
    activityOptions: z.array(z.enum(ACTIVITY_OPTION_KEYS)).max(ACTIVITY_OPTION_KEYS.length),
    activityOther: z.string().trim().max(500),

    flightArrivalAirline: z.string().trim().max(200),
    flightArrivalNumber: z.string().trim().max(50),
    flightArrival: z.string().trim(), // datetime-local string, may be empty
    flightDepartureAirline: z.string().trim().max(200),
    flightDepartureNumber: z.string().trim().max(50),
    flightDeparture: z.string().trim(),

    additionalNotes: z.string().trim().max(2000),
  })
  .superRefine((data, ctx) => {
    // Applies regardless of attendance - if both legs are filled in, the
    // return leg can't be scheduled before the outbound one.
    if (data.flightArrival && data.flightDeparture && data.flightDeparture < data.flightArrival) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Departure can't be before arrival",
        path: ["flightDeparture"],
      });
    }

    // Not attending: none of the requirements below apply.
    if (!data.isAttending) return;

    if (!data.attendingHappyHour && !data.attendingAllHands && !data.attendingDinner) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select at least one event you're attending",
        path: ["attendingHappyHour"],
      });
    }

    if (data.dietaryOptions.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Please select at least one option (choose "None" if there are no restrictions)',
        path: ["dietaryOptions"],
      });
    }

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
export type EmailLookupInput = z.infer<typeof emailLookupSchema>;
