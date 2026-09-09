import { z } from "zod";
import { DIETARY_OPTION_KEYS } from "./dietary-options";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const guestSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  type: z.enum(["ADULT", "CHILD"]),
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
    reservationName: z.string().trim().min(1, "Reservation name is required"),
    hotelEmail: z.string().trim().email("Enter a valid email"),
    detailsEmail: z.string().trim().email("Enter a valid email"),

    attendingHappyHour: z.boolean(),
    happyHourPlusOne: z.boolean(),
    attendingAllHands: z.boolean(),
    allHandsPlusOne: z.boolean(),
    attendingDinner: z.boolean(),

    stayStart: isoDate,
    stayEnd: isoDate,
    companyPaidNights: z.array(isoDate).max(31),

    needsExtraNights: z.boolean(),
    extraNights: z.array(isoDate).max(10),

    guests: z.array(guestSchema).max(3, "Up to 3 additional guests"),

    dietaryOptions: z.array(z.enum(DIETARY_OPTION_KEYS)).max(DIETARY_OPTION_KEYS.length),
    dietaryOther: z.string().trim().max(500),

    flightAirline: z.string().trim().max(200),
    flightNumber: z.string().trim().max(50),
    flightArrival: z.string().trim(), // datetime-local string, may be empty
    flightDeparture: z.string().trim(),
    flightNotes: z.string().trim().max(2000),
  })
  .refine((data) => data.stayEnd > data.stayStart, {
    message: "Stay end date must be after the start date",
    path: ["stayEnd"],
  })
  .refine((data) => !data.needsExtraNights || data.extraNights.length > 0, {
    message: "Add at least one date for the extra self-paid night(s)",
    path: ["extraNights"],
  });

export type BookingFormInput = z.infer<typeof bookingFormSchema>;
export type GuestInput = z.infer<typeof guestSchema>;
export type IdentityInput = z.infer<typeof identitySchema>;
