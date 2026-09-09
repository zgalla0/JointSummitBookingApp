"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";

import { bookingFormSchema, identitySchema, type BookingFormInput, type IdentityInput } from "@/lib/booking-schema";
import { formatShortDate, formatDateRangeShort, isoToLocalDate, localDateToIso } from "@/lib/format";
import { PROCESS_NOTICE_FULL, PROCESS_NOTICE_SHORT } from "@/lib/copy";
import GuestFields from "./GuestFields";
import NightBreakdownTable from "./NightBreakdownTable";

export type FormConfig = {
  bookableStart: string;
  bookableEnd: string;
  discountStart: string;
  discountEnd: string;
  discountRateUsd: number;
  happyHourDate: string;
  allHandsDate: string;
  dinnerDate: string;
  companyPaidAlways: string[];
  companyPaidSelect: string[];
};

type StaticContentItem = { key: string; title: string | null; body: string | null };

type Step = "identity" | "duplicate" | "form" | "success";

const emptyDefaults: BookingFormInput = {
  firstName: "",
  lastName: "",
  reservationName: "",
  hotelEmail: "",
  detailsEmail: "",
  attendingHappyHour: false,
  attendingAllHands: false,
  attendingDinner: false,
  stayStart: "",
  stayEnd: "",
  selectEligible: false,
  needsExtraNights: false,
  extraNights: [],
  guests: [],
  dietaryRestrictions: "",
  flightAirline: "",
  flightNumber: "",
  flightArrival: "",
  flightDeparture: "",
  flightNotes: "",
};

export default function BookingForm({
  formConfig,
  staticContent,
}: {
  formConfig: FormConfig;
  staticContent: StaticContentItem[];
}) {
  const [step, setStep] = useState<Step>("identity");
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successLink, setSuccessLink] = useState<string | null>(null);
  const [sameEmail, setSameEmail] = useState(true);

  const identityForm = useForm<IdentityInput>({
    resolver: zodResolver(identitySchema),
    defaultValues: { firstName: "", lastName: "", email: "" },
  });

  const mainForm = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: emptyDefaults,
  });

  const stayStart = mainForm.watch("stayStart");
  const stayEnd = mainForm.watch("stayEnd");
  const selectEligible = mainForm.watch("selectEligible");
  const needsExtraNights = mainForm.watch("needsExtraNights");
  const extraNights = mainForm.watch("extraNights");
  const hotelEmail = mainForm.watch("hotelEmail");

  async function onIdentitySubmit(values: IdentityInput) {
    setChecking(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Something went wrong, please try again.");
      const data = await res.json();
      if (data.duplicate) {
        setStep("duplicate");
      } else {
        mainForm.setValue("firstName", values.firstName);
        mainForm.setValue("lastName", values.lastName);
        mainForm.setValue("hotelEmail", values.email);
        mainForm.setValue("detailsEmail", values.email);
        setStep("form");
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setChecking(false);
    }
  }

  async function onMainSubmit(values: BookingFormInput) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.formErrors?.[0] ?? "Something went wrong, please try again.");
      }
      setSuccessLink(data.magicLink);
      setStep("success");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const range: DateRange | undefined = stayStart
    ? { from: isoToLocalDate(stayStart), to: stayEnd ? isoToLocalDate(stayEnd) : undefined }
    : undefined;

  const extraNightDates = (extraNights ?? []).map(isoToLocalDate);

  const bookableStartDate = isoToLocalDate(formConfig.bookableStart);
  const bookableEndDate = isoToLocalDate(formConfig.bookableEnd);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Q1 Summit Hotel Block Booking</h1>

      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        {PROCESS_NOTICE_FULL}
      </div>

      {submitError && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{submitError}</div>
      )}

      {step === "identity" && (
        <form
          onSubmit={identityForm.handleSubmit(onIdentitySubmit)}
          className="space-y-4 rounded border p-4"
        >
          <h2 className="font-medium">Let&apos;s start with your name and email</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name" error={identityForm.formState.errors.firstName?.message}>
              <input className="w-full rounded border px-2 py-1" {...identityForm.register("firstName")} />
            </Field>
            <Field label="Last name" error={identityForm.formState.errors.lastName?.message}>
              <input className="w-full rounded border px-2 py-1" {...identityForm.register("lastName")} />
            </Field>
          </div>
          <Field label="Email" error={identityForm.formState.errors.email?.message}>
            <input className="w-full rounded border px-2 py-1" {...identityForm.register("email")} />
          </Field>
          <button
            type="submit"
            disabled={checking}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {checking ? "Checking..." : "Continue"}
          </button>
        </form>
      )}

      {step === "duplicate" && (
        <div className="space-y-3 rounded border p-4">
          <p>
            Looks like you&apos;ve already submitted a booking. We&apos;ve emailed a link to manage
            your existing booking to the email you entered. If you don&apos;t see it, use
            &quot;Resend my link&quot; on the lookup page.
          </p>
          <p className="text-sm text-gray-600">{PROCESS_NOTICE_SHORT}</p>
          <a href="/my-booking" className="text-blue-600 underline">
            Go to my booking lookup page
          </a>
        </div>
      )}

      {step === "form" && (
        <form onSubmit={mainForm.handleSubmit(onMainSubmit)} className="space-y-6">
          <section className="space-y-3 rounded border p-4">
            <h2 className="font-medium">Your details</h2>
            <Field label="Full name for hotel reservation" error={mainForm.formState.errors.reservationName?.message}>
              <input className="w-full rounded border px-2 py-1" {...mainForm.register("reservationName")} />
            </Field>
            <Field label="Email for hotel booking" error={mainForm.formState.errors.hotelEmail?.message}>
              <input className="w-full rounded border px-2 py-1" {...mainForm.register("hotelEmail")} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sameEmail}
                onChange={(e) => {
                  setSameEmail(e.target.checked);
                  if (e.target.checked) mainForm.setValue("detailsEmail", hotelEmail);
                }}
              />
              Use the same email for other details (transportation, schedule, etc.)
            </label>
            {!sameEmail && (
              <Field label="Email for other details" error={mainForm.formState.errors.detailsEmail?.message}>
                <input className="w-full rounded border px-2 py-1" {...mainForm.register("detailsEmail")} />
              </Field>
            )}
          </section>

          <section className="space-y-2 rounded border p-4">
            <h2 className="font-medium">Which events are you attending?</h2>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...mainForm.register("attendingHappyHour")} />
              Happy Hour ({formatShortDate(formConfig.happyHourDate)})
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...mainForm.register("attendingAllHands")} />
              All Hands ({formatShortDate(formConfig.allHandsDate)})
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...mainForm.register("attendingDinner")} />
              Dinner ({formatShortDate(formConfig.dinnerDate)})
            </label>
          </section>

          <section className="space-y-3 rounded border p-4">
            <h2 className="font-medium">Stay dates</h2>
            <p className="text-sm text-amber-800">
              Rooms booked outside {formatDateRangeShort(formConfig.discountStart, formConfig.discountEnd)}{" "}
              are not guaranteed the ${formConfig.discountRateUsd}/night group rate.
            </p>
            <DayPicker
              mode="range"
              selected={range}
              onSelect={(r) => {
                mainForm.setValue("stayStart", r?.from ? localDateToIso(r.from) : "");
                mainForm.setValue("stayEnd", r?.to ? localDateToIso(r.to) : "");
              }}
              disabled={{ before: bookableStartDate, after: bookableEndDate }}
              defaultMonth={bookableStartDate}
            />
            {(mainForm.formState.errors.stayStart || mainForm.formState.errors.stayEnd) && (
              <p className="text-sm text-red-600">Please select both a start and end date.</p>
            )}

            <label className="flex items-center gap-2">
              <input type="checkbox" {...mainForm.register("selectEligible")} />
              I am eligible for company-paid Tuesday/Wednesday nights
            </label>

            <label className="flex items-center gap-2">
              <input type="checkbox" {...mainForm.register("needsExtraNights")} />
              I need additional night(s) outside the standard block, paid by me
            </label>

            {needsExtraNights && (
              <div>
                <DayPicker
                  mode="multiple"
                  selected={extraNightDates}
                  onSelect={(dates) => mainForm.setValue("extraNights", (dates ?? []).map(localDateToIso))}
                  disabled={{ before: bookableStartDate, after: bookableEndDate }}
                  defaultMonth={bookableStartDate}
                />
                {mainForm.formState.errors.extraNights && (
                  <p className="text-sm text-red-600">{mainForm.formState.errors.extraNights.message as string}</p>
                )}
              </div>
            )}

            <NightBreakdownTable
              stayStart={stayStart}
              stayEnd={stayEnd}
              selectEligible={selectEligible}
              companyPaidAlways={formConfig.companyPaidAlways}
              companyPaidSelect={formConfig.companyPaidSelect}
              discountStart={formConfig.discountStart}
              discountEnd={formConfig.discountEnd}
              extraNights={needsExtraNights ? extraNights ?? [] : []}
            />
          </section>

          <section className="rounded border p-4">
            <GuestFields control={mainForm.control} register={mainForm.register} />
          </section>

          <section className="space-y-2 rounded border p-4">
            <h2 className="font-medium">Dietary restrictions / allergies</h2>
            <textarea className="w-full rounded border px-2 py-1" rows={3} {...mainForm.register("dietaryRestrictions")} />
          </section>

          <section className="space-y-3 rounded border p-4">
            <h2 className="font-medium">Flight details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Airline">
                <input className="w-full rounded border px-2 py-1" {...mainForm.register("flightAirline")} />
              </Field>
              <Field label="Flight #">
                <input className="w-full rounded border px-2 py-1" {...mainForm.register("flightNumber")} />
              </Field>
              <Field label="Arrival date/time">
                <input type="datetime-local" className="w-full rounded border px-2 py-1" {...mainForm.register("flightArrival")} />
              </Field>
              <Field label="Departure date/time">
                <input type="datetime-local" className="w-full rounded border px-2 py-1" {...mainForm.register("flightDeparture")} />
              </Field>
            </div>
            <Field label="Other flight notes">
              <textarea className="w-full rounded border px-2 py-1" rows={2} {...mainForm.register("flightNotes")} />
            </Field>
          </section>

          {staticContent.length > 0 && (
            <section className="space-y-2 rounded border p-4">
              <h2 className="font-medium">Event info, Q&amp;A, and timing</h2>
              {staticContent.map((item) => (
                <div key={item.key}>
                  {item.title && <h3 className="font-medium">{item.title}</h3>}
                  {item.body && <p className="whitespace-pre-wrap text-sm text-gray-700">{item.body}</p>}
                </div>
              ))}
            </section>
          )}

          <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            {PROCESS_NOTICE_SHORT}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit booking"}
          </button>
        </form>
      )}

      {step === "success" && (
        <div className="space-y-3 rounded border p-4">
          <h2 className="font-medium">You&apos;re all set!</h2>
          <p>We&apos;ve saved your booking. A confirmation email is on its way with your details and your personal link.</p>
          {successLink && (
            <p>
              Your personal link (save this to make future changes):{" "}
              <a href={successLink} className="text-blue-600 underline">
                {successLink}
              </a>
            </p>
          )}
          <p className="text-sm text-gray-600">{PROCESS_NOTICE_SHORT}</p>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span>{label}</span>
      {children}
      {error && <span className="block text-red-600">{error}</span>}
    </label>
  );
}
