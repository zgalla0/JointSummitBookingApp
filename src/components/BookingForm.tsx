"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  bookingFormSchema,
  identitySchema,
  type BookingFormInput,
  type IdentityInput,
} from "@/lib/booking-schema";
import { NoticeBannerFull, NoticeBannerShort } from "./ui/NoticeBanner";
import { SUBMIT_REMINDER } from "@/lib/copy";
import Card from "./ui/Card";
import Button from "./ui/Button";
import BookingFields, { Field, type FormConfig, type StaticContentItem } from "./BookingFields";

export type { FormConfig };

type Step = "identity" | "duplicate" | "form" | "success";

const emptyDefaults: BookingFormInput = {
  firstName: "",
  lastName: "",
  reservationFirstName: "",
  reservationLastName: "",
  hotelEmail: "",
  detailsEmail: "",
  attendingHappyHour: false,
  happyHourPlusOne: false,
  attendingAllHands: false,
  attendingDinner: false,
  dinnerPlusOne: false,
  stayStart: "",
  stayEnd: "",
  companyPaidNights: [],
  extraNightsRoomType: "",
  ptoDates: [],
  guests: [],
  dietaryOptions: [],
  dietaryOther: "",
  flightArrivalAirline: "",
  flightArrivalNumber: "",
  flightArrival: "",
  flightDepartureAirline: "",
  flightDepartureNumber: "",
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

  const identityForm = useForm<IdentityInput>({
    resolver: zodResolver(identitySchema),
    defaultValues: { firstName: "", lastName: "", email: "" },
  });

  const mainForm = useForm<BookingFormInput>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: emptyDefaults,
  });

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
              Looks like you&apos;ve already submitted a booking. We&apos;ve emailed a link to the
              email associated with your original form (note this may not be your Cuesta email) to
              manage your existing booking. If you don&apos;t see it, use &quot;Resend my
              link&quot; on the lookup page.
            </p>
            <NoticeBannerShort />
            <Link href="/my-booking" className="font-semibold text-accent-dark hover:underline">
              Go to my booking lookup page →
            </Link>
          </div>
        </Card>
      )}

      {step === "form" && (
        <form onSubmit={mainForm.handleSubmit(onMainSubmit)} className="space-y-5">
          <BookingFields mainForm={mainForm} formConfig={formConfig} staticContent={staticContent} />

          <p className="text-sm text-muted">{SUBMIT_REMINDER}</p>

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
