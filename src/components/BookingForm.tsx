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
import { formatShortDate, formatMonthDay } from "@/lib/format";
import { HOTEL_NAME, HOTEL_URL, HOTEL_ADDRESS } from "@/lib/hotel-info";
import { NoticeBannerFull, NoticeBannerShort } from "./ui/NoticeBanner";
import { SUBMIT_REMINDER, NO_ROOM_WARNING } from "@/lib/copy";
import Card from "./ui/Card";
import Button from "./ui/Button";
import FaqSection from "./FaqSection";
import BookingFields, {
  Field,
  needsRoomTypeChoice,
  type FormConfig,
  type StaticContentItem,
} from "./BookingFields";

export type { FormConfig };

type Step = "identity" | "duplicate" | "form" | "success";

const emptyDefaults: BookingFormInput = {
  firstName: "",
  lastName: "",
  isAttending: true,
  location: "",
  reservationFirstName: "",
  reservationLastName: "",
  nameTag: "",
  hotelEmail: "",
  detailsEmail: "",
  cuestaEmail: "",
  attendingHappyHour: false,
  attendingAllHands: false,
  attendingDinner: false,
  stayStart: "",
  stayEnd: "",
  companyPaidNights: [],
  extraNightsRoomType: "",
  ptoDates: [],
  guests: [],
  dietaryOptions: [],
  dietaryOther: "",
  activityOptions: [],
  activityOther: "",
  flightArrivalAirline: "",
  flightArrivalNumber: "",
  flightArrival: "",
  flightDepartureAirline: "",
  flightDepartureNumber: "",
  flightDeparture: "",
  additionalNotes: "",
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
  const [gateDone, setGateDone] = useState(false);

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
        mainForm.setValue("reservationFirstName", values.firstName);
        mainForm.setValue("reservationLastName", values.lastName);
        mainForm.setValue("hotelEmail", values.email);
        mainForm.setValue("detailsEmail", values.email);
        mainForm.setValue("cuestaEmail", values.email);
        setStep("form");
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setChecking(false);
    }
  }

  async function onMainSubmit(values: BookingFormInput) {
    if (values.extraNightsRoomType === "" && needsRoomTypeChoice(values)) {
      mainForm.setError("extraNightsRoomType", {
        type: "manual",
        message:
          "Please choose a room type for the night(s) outside the standard rate",
      });
      onMainInvalid();
      return;
    }
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
        throw new Error(
          data?.error?.formErrors?.[0] ??
            "Something went wrong, please try again.",
        );
      }
      setSuccessLink(data.magicLink);
      setStep("success");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function onMainInvalid() {
    setSubmitError(
      "You must fill in additional items above, see red highlights for items missed.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-in space-y-1">
        <div className="flex items-center justify-between gap-4">
          <p className="eyebrow">Hotel Booking</p>
          {/* Once past the identity step, this page's own Reference/FAQ
              cards are no longer shown (they're only part of the identity
              screen) - opens a fresh copy of this page in a new tab so
              looking something up doesn't lose progress on the form
              already filled out here. */}
          {step !== "identity" && (
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-accent-dark hover:underline"
            >
              Agenda &amp; FAQ →
            </Link>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Q1 Joint All Hands Summit Attendance and Hotel Booking
        </h1>
      </div>

      {step !== "duplicate" && (
        <>
          <p className="animate-in rounded-2xl bg-notice-bg px-5 py-4 text-lg font-bold text-foreground sm:text-xl">
            {NO_ROOM_WARNING}
          </p>

          <NoticeBannerFull />
        </>
      )}

      {step !== "form" && submitError && (
        <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {step === "identity" && (
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:items-stretch">
          <Card
            eyebrow="What this form is for"
            title="A few things to know"
            className="h-full"
          >
            <ul className="list-disc space-y-3 pl-5 text-sm text-muted">
              <li>
                This form lets the planning team know who&apos;s coming to each event, and helps us
                book the right hotel dates for you.
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>
                    <span className="rounded bg-warning-soft px-1.5 py-0.5 font-bold text-warning">
                      Complete this even if you can&apos;t come.
                    </span>
                  </li>
                </ul>
              </li>
              <li>
                Make sure to buy your flight as soon as you can
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>
                    The flight should be expensed however you expense your
                    expenses (differs by country and FTE/1099).
                  </li>
                  <li>
                    Contractors: invites will be directly emailed/messaged to
                    you.
                  </li>
                </ul>
              </li>
              <li>
                Hotel rooms will be booked and paid for, so you don&apos;t need
                to worry about them! The nights will be based on this form. If
                you&apos;re interested in additional nights{" "}
                <strong className="text-foreground">
                  at the hotel we&apos;ll be staying at
                </strong>
                , mark that on this form.
              </li>
              <li>
                Keep an eye out 1-2 weeks before the summit for specific details
                on the summit (location and times for happy hour, all hands,
                etc).
              </li>
              <li>
                Usual attire (once locations for happy hour and dinner are set
                we will let you know if there are any changes):
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  <li>Happy Hour - Casual</li>
                  <li>All Hands Summit - Business casual</li>
                  <li>
                    Dinner - A bit more than casual, a bit less than dressy
                  </li>
                </ul>
              </li>
            </ul>
          </Card>

          <div className="space-y-6">
            <Card eyebrow="TLDR" title="Summit info at a glance">
              <ul className="space-y-2 text-sm text-muted">
                <li>
                  <strong className="text-foreground">Dates:</strong>{" "}
                  {formatMonthDay(formConfig.happyHourDate)}–
                  {formatMonthDay(formConfig.allHandsDate)}, 2026
                </li>
                <li>
                  <strong className="text-foreground">Fly into:</strong> Mexico
                  City International Airport (MEX)
                </li>
                <li>
                  <strong className="text-foreground">Airport to hotel:</strong>{" "}
                  About 30-60 minutes by car, depending on traffic
                </li>
                <li>
                  <strong className="text-foreground">Hotel:</strong>{" "}
                  <a
                    href={HOTEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-accent-dark hover:underline"
                  >
                    {HOTEL_NAME}
                  </a>
                  , {HOTEL_ADDRESS}
                </li>
                <li>
                  <strong className="text-foreground">Schedule:</strong> Happy
                  Hour ({formatShortDate(formConfig.happyHourDate)}), All Hands
                  ({formatShortDate(formConfig.allHandsDate)}), Dinner (
                  {formatShortDate(formConfig.dinnerDate)})
                </li>
              </ul>
            </Card>

            <Card
              eyebrow="Get started"
              title="Start the form here, or get your magic link again to edit your form"
              className="border-2 border-accent-dark"
            >
              <form
                onSubmit={identityForm.handleSubmit(onIdentitySubmit)}
                className="space-y-4"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="First name"
                    error={identityForm.formState.errors.firstName?.message}
                  >
                    <input
                      className="field"
                      {...identityForm.register("firstName")}
                    />
                  </Field>
                  <Field
                    label="Last name"
                    error={identityForm.formState.errors.lastName?.message}
                  >
                    <input
                      className="field"
                      {...identityForm.register("lastName")}
                    />
                  </Field>
                </div>
                <Field
                  label="Cuesta email"
                  error={identityForm.formState.errors.email?.message}
                >
                  <input
                    className="field"
                    placeholder="you@cuestapartners.com"
                    {...identityForm.register("email")}
                  />
                </Field>
                <Button type="submit" disabled={checking}>
                  {checking ? "Checking..." : "Continue"}
                </Button>
              </form>
            </Card>
          </div>

          {staticContent.length > 0 && (
            <Card eyebrow="Reference" title="Event info, Q&A, and timing" className="lg:col-span-2">
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

          <div className="lg:col-span-2">
            <FaqSection />
          </div>
        </div>
      )}

      {step === "duplicate" && (
        <Card>
          <div className="space-y-3">
            <p>
              Looks like you&apos;ve already submitted a booking. We&apos;ve
              emailed a link to the email associated with your original form
              (note this may not be your Cuesta email) to manage your existing
              booking. If you don&apos;t see it, use &quot;Resend my link&quot;
              on the lookup page.
            </p>
            <NoticeBannerShort />
            <Link
              href="/my-booking"
              className="font-semibold text-accent-dark hover:underline"
            >
              Go to my booking lookup page →
            </Link>
          </div>
        </Card>
      )}

      {step === "form" && (
        <form
          onSubmit={mainForm.handleSubmit(onMainSubmit, onMainInvalid)}
          className="space-y-5"
        >
          <BookingFields
            mainForm={mainForm}
            formConfig={formConfig}
            gateEvents
            onGateDoneChange={setGateDone}
          />

          {gateDone && (
            <>
              <p className="text-sm text-muted">{SUBMIT_REMINDER}</p>

              {submitError && (
                <div className="animate-in rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {submitError}
                </div>
              )}

              <Button type="submit" variant="dark" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </>
          )}
        </form>
      )}

      {step === "success" && (
        <Card title="You're all set!">
          <div className="space-y-3">
            <p className="text-muted">
              We&apos;ve saved your booking. A confirmation email is on its way
              with your details and your personal link.
            </p>
            {successLink && (
              <p className="break-all">
                Your personal link (save this to make future changes):{" "}
                <a
                  href={successLink}
                  className="font-semibold text-accent-dark hover:underline"
                >
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
