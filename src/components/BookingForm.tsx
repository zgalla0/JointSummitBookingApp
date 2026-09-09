"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  bookingFormSchema,
  identitySchema,
  type BookingFormInput,
  type IdentityInput,
} from "@/lib/booking-schema";
import { formatShortDate } from "@/lib/format";
import { NoticeBannerFull, NoticeBannerShort } from "./ui/NoticeBanner";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Checkbox from "./ui/Checkbox";
import GuestFields from "./GuestFields";
import DietaryChecklist from "./DietaryChecklist";
import StayDatesPicker from "./StayDatesPicker";

export type FormConfig = {
  bookableStart: string;
  bookableEnd: string;
  extendedStart: string;
  extendedEnd: string;
  discountStart: string;
  discountEnd: string;
  discountRateUsd: number;
  happyHourDate: string;
  allHandsDate: string;
  dinnerDate: string;
  defaultCompanyPaidNights: string[];
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
  happyHourPlusOne: false,
  attendingAllHands: false,
  allHandsPlusOne: false,
  attendingDinner: false,
  stayStart: "",
  stayEnd: "",
  companyPaidNights: [],
  needsExtraNights: false,
  extraNights: [],
  guests: [],
  dietaryOptions: [],
  dietaryOther: "",
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
  const companyPaidNights = mainForm.watch("companyPaidNights");
  const needsExtraNights = mainForm.watch("needsExtraNights");
  const extraNights = mainForm.watch("extraNights");
  const hotelEmail = mainForm.watch("hotelEmail");
  const attendingHappyHour = mainForm.watch("attendingHappyHour");
  const attendingAllHands = mainForm.watch("attendingAllHands");
  const dietaryOptions = mainForm.watch("dietaryOptions");
  const dietaryOther = mainForm.watch("dietaryOther");

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

  return (
    <div className="space-y-6">
      <div className="animate-in space-y-1">
        <p className="eyebrow">Hotel Booking</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Q1 Joint All Hands Summit Hotel Booking
        </h1>
      </div>

      <NoticeBannerFull />

      {submitError && (
        <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm text-red-700">{submitError}</div>
      )}

      {step === "identity" && (
        <Card eyebrow="Get started" title="Let's find your name and email">
          <form onSubmit={identityForm.handleSubmit(onIdentitySubmit)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First name" error={identityForm.formState.errors.firstName?.message}>
                <input className="field" {...identityForm.register("firstName")} />
              </Field>
              <Field label="Last name" error={identityForm.formState.errors.lastName?.message}>
                <input className="field" {...identityForm.register("lastName")} />
              </Field>
            </div>
            <Field label="Email" error={identityForm.formState.errors.email?.message}>
              <input className="field" {...identityForm.register("email")} />
            </Field>
            <Button type="submit" disabled={checking}>
              {checking ? "Checking..." : "Continue"}
            </Button>
          </form>
        </Card>
      )}

      {step === "duplicate" && (
        <Card>
          <div className="space-y-3">
            <p>
              Looks like you&apos;ve already submitted a booking. We&apos;ve emailed a link to
              manage your existing booking. If you don&apos;t see it, use &quot;Resend my link&quot;
              on the lookup page.
            </p>
            <NoticeBannerShort />
            <a href="/my-booking" className="font-semibold text-accent-dark hover:underline">
              Go to my booking lookup page →
            </a>
          </div>
        </Card>
      )}

      {step === "form" && (
        <form onSubmit={mainForm.handleSubmit(onMainSubmit)} className="space-y-5">
          <Card eyebrow="About you" title="Your details">
            <div className="space-y-4">
              <Field label="Full name for hotel reservation" error={mainForm.formState.errors.reservationName?.message}>
                <input className="field" {...mainForm.register("reservationName")} />
              </Field>
              <Field label="Email for hotel booking" error={mainForm.formState.errors.hotelEmail?.message}>
                <input className="field" {...mainForm.register("hotelEmail")} />
              </Field>
              <Field label="Email for summit details" error={mainForm.formState.errors.detailsEmail?.message}>
                <input
                  className="field"
                  disabled={sameEmail}
                  {...mainForm.register("detailsEmail")}
                />
              </Field>
              <Checkbox
                label="Use the same email for summit details"
                checked={sameEmail}
                onChange={(e) => {
                  setSameEmail(e.target.checked);
                  if (e.target.checked) mainForm.setValue("detailsEmail", hotelEmail);
                }}
              />
            </div>
          </Card>

          <Card eyebrow="Events" title="Which events are you attending?">
            <div className="space-y-3">
              <Checkbox label={`Happy Hour (${formatShortDate(formConfig.happyHourDate)})`} {...mainForm.register("attendingHappyHour")} />
              {attendingHappyHour && (
                <div className="ml-7">
                  <Checkbox label="Will your plus one join Happy Hour too?" {...mainForm.register("happyHourPlusOne")} />
                </div>
              )}
              <Checkbox label={`All Hands (${formatShortDate(formConfig.allHandsDate)})`} {...mainForm.register("attendingAllHands")} />
              {attendingAllHands && (
                <div className="ml-7">
                  <Checkbox label="Will your plus one join All Hands too?" {...mainForm.register("allHandsPlusOne")} />
                </div>
              )}
              <Checkbox label={`Dinner (${formatShortDate(formConfig.dinnerDate)})`} {...mainForm.register("attendingDinner")} />
            </div>
          </Card>

          <Card eyebrow="Lodging" title="Stay dates">
            <StayDatesPicker
              bookableStart={formConfig.bookableStart}
              bookableEnd={formConfig.bookableEnd}
              extendedStart={formConfig.extendedStart}
              extendedEnd={formConfig.extendedEnd}
              discountStart={formConfig.discountStart}
              discountEnd={formConfig.discountEnd}
              discountRateUsd={formConfig.discountRateUsd}
              defaultCompanyPaidNights={formConfig.defaultCompanyPaidNights}
              value={{ stayStart, stayEnd, companyPaidNights, needsExtraNights, extraNights }}
              onChange={(patch) => {
                for (const [key, val] of Object.entries(patch)) {
                  mainForm.setValue(key as keyof BookingFormInput, val as never, { shouldValidate: false });
                }
              }}
            />
            {(mainForm.formState.errors.stayStart || mainForm.formState.errors.stayEnd) && (
              <p className="mt-2 text-sm text-red-600">Please select your stay nights.</p>
            )}
          </Card>

          <Card eyebrow="Plus ones" title="Additional guests">
            <GuestFields control={mainForm.control} register={mainForm.register} />
          </Card>

          <Card eyebrow="Food" title="Dietary restrictions">
            <DietaryChecklist
              selected={dietaryOptions}
              other={dietaryOther}
              onChange={(next) => mainForm.setValue("dietaryOptions", next)}
              onOtherChange={(val) => mainForm.setValue("dietaryOther", val)}
            />
          </Card>

          <Card eyebrow="Travel" title="Flight details">
            <div className="space-y-4">
              <p className="text-sm text-muted">
                This helps us group people with similar arrival times into carpools to and from
                the hotel.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Airline">
                  <input className="field" {...mainForm.register("flightAirline")} />
                </Field>
                <Field label="Flight #">
                  <input className="field" {...mainForm.register("flightNumber")} />
                </Field>
                <Field label="Arrival date/time">
                  <input type="datetime-local" className="field" {...mainForm.register("flightArrival")} />
                </Field>
                <Field label="Departure date/time">
                  <input type="datetime-local" className="field" {...mainForm.register("flightDeparture")} />
                </Field>
              </div>
              <Field label="Other flight notes">
                <textarea className="field" rows={2} {...mainForm.register("flightNotes")} />
              </Field>
            </div>
          </Card>

          {staticContent.length > 0 && (
            <Card eyebrow="Reference" title="Event info, Q&A, and timing">
              <div className="space-y-3">
                {staticContent.map((item) => (
                  <div key={item.key}>
                    {item.title && <h3 className="font-semibold">{item.title}</h3>}
                    {item.body && <p className="whitespace-pre-wrap text-sm text-muted">{item.body}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          <NoticeBannerShort />

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit booking"}
          </Button>
        </form>
      )}

      {step === "success" && (
        <Card title="You're all set!">
          <div className="space-y-3">
            <p className="text-muted">
              We&apos;ve saved your booking. A confirmation email is on its way with your details
              and your personal link.
            </p>
            {successLink && (
              <p className="break-all">
                Your personal link (save this to make future changes):{" "}
                <a href={successLink} className="font-semibold text-accent-dark hover:underline">
                  {successLink}
                </a>
              </p>
            )}
            <NoticeBannerShort />
          </div>
        </Card>
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
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}
