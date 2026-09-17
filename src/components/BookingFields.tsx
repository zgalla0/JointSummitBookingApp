"use client";

import { useState, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BookingFormInput } from "@/lib/booking-schema";
import { formatShortDate } from "@/lib/format";
import { LOCATION_OPTIONS } from "@/lib/location-options";
import { AIRLINE_OPTIONS } from "@/lib/airline-options";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Checkbox from "./ui/Checkbox";
import GuestFields from "./GuestFields";
import DietaryChecklist from "./DietaryChecklist";
import StayDatesPicker from "./StayDatesPicker";

export type FormConfig = {
  bookableStart: string;
  bookableEnd: string;
  blockStart: string;
  blockEnd: string;
  discountStart: string;
  discountEnd: string;
  discountRateUsd: number;
  happyHourDate: string;
  allHandsDate: string;
  dinnerDate: string;
  defaultCompanyPaidNights: string[];
  optionalCompanyPaidNights: string[];
};

export type StaticContentItem = { key: string; title: string | null; body: string | null };

/**
 * All the shared booking-form sections (details through flight), used by
 * both the first-time public form and the magic-link edit form. Everything
 * around it (identity/duplicate gating, submit button, success screen,
 * cancel flow) differs between those two and stays in the caller.
 */
type MiniStep = "about" | "events" | "done";

export default function BookingFields({
  mainForm,
  formConfig,
  staticContent,
  gateEvents = false,
  onGateDoneChange,
}: {
  mainForm: UseFormReturn<BookingFormInput>;
  formConfig: FormConfig;
  staticContent: StaticContentItem[];
  /** When true, About You + Attending? (shown together) then Events must
   *  be completed one page at a time, in order, before the rest of the
   *  form (which the Companion section depends on, via
   *  attendingHappyHour/attendingDinner) appears. Only used for the
   *  brand-new booking form - editing an existing booking always shows
   *  everything at once, since its data is already complete. */
  gateEvents?: boolean;
  /** Fires whenever the gate above opens/closes, so the caller can hide its
   *  own submit button until the gated sections are actually done - a
   *  submit button sitting below sections that haven't rendered yet would
   *  defeat the point of gating them. */
  onGateDoneChange?: (done: boolean) => void;
}) {
  const [sameEmail, setSameEmail] = useState(
    mainForm.getValues("hotelEmail") === mainForm.getValues("detailsEmail"),
  );
  const [miniStep, setMiniStepState] = useState<MiniStep>(gateEvents ? "about" : "done");

  function setMiniStep(next: MiniStep) {
    setMiniStepState(next);
    onGateDoneChange?.(next === "done");
  }

  const isAttending = mainForm.watch("isAttending");

  async function advanceFromAbout() {
    const valid = await mainForm.trigger([
      "reservationFirstName",
      "reservationLastName",
      "hotelEmail",
      "detailsEmail",
      "location",
    ]);
    if (!valid) return;
    // Not attending: nothing else on the form applies to them, so skip
    // Events and everything after it entirely and go straight to submit.
    setMiniStep(isAttending ? "events" : "done");
  }

  const stayStart = mainForm.watch("stayStart");
  const stayEnd = mainForm.watch("stayEnd");
  const companyPaidNights = mainForm.watch("companyPaidNights");
  const ptoDates = mainForm.watch("ptoDates");
  const extraNightsRoomType = mainForm.watch("extraNightsRoomType");
  const hotelEmail = mainForm.watch("hotelEmail");
  const attendingHappyHour = mainForm.watch("attendingHappyHour");
  const attendingDinner = mainForm.watch("attendingDinner");
  const dietaryOptions = mainForm.watch("dietaryOptions");
  const dietaryOther = mainForm.watch("dietaryOther");
  const flightArrivalAirline = mainForm.watch("flightArrivalAirline");
  const flightDepartureAirline = mainForm.watch("flightDepartureAirline");

  // react-hook-form nests an array-level zod issue under `.root` once any
  // per-item field (e.g. "guests.0.firstName") is also registered, rather
  // than leaving it at `errors.guests.message` directly.
  const guestsListError =
    mainForm.formState.errors.guests?.root?.message ?? mainForm.formState.errors.guests?.message;

  return (
    <>
      <Card eyebrow="About you" title="Your details">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="First name for hotel reservation"
              error={mainForm.formState.errors.reservationFirstName?.message}
            >
              <input className="field" {...mainForm.register("reservationFirstName")} />
            </Field>
            <Field
              label="Last name for hotel reservation"
              error={mainForm.formState.errors.reservationLastName?.message}
            >
              <input className="field" {...mainForm.register("reservationLastName")} />
            </Field>
          </div>
          <Field label="Email for hotel booking" error={mainForm.formState.errors.hotelEmail?.message}>
            <input className="field" {...mainForm.register("hotelEmail")} />
          </Field>
          <Field label="Email for summit details" error={mainForm.formState.errors.detailsEmail?.message}>
            <input className="field" disabled={sameEmail} {...mainForm.register("detailsEmail")} />
          </Field>
          <Checkbox
            label="Use the same email for summit details"
            checked={sameEmail}
            onChange={(e) => {
              setSameEmail(e.target.checked);
              if (e.target.checked) mainForm.setValue("detailsEmail", hotelEmail);
            }}
          />
          <Field label="Location" error={mainForm.formState.errors.location?.message}>
            <div
              className={`space-y-2 pt-1 ${
                mainForm.formState.errors.location ? "rounded-xl border-2 border-red-500 p-2" : ""
              }`}
            >
              {LOCATION_OPTIONS.map((option) => (
                <label key={option.key} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    value={option.key}
                    className="accent-accent-dark h-4 w-4"
                    {...mainForm.register("location")}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>
        </div>
      </Card>

      <Card eyebrow="Attending?" title="Are you attending the summit?">
        <div className="flex flex-wrap gap-3">
          <label
            className={`flex-1 cursor-pointer rounded-xl border-2 p-3 text-center text-sm font-semibold transition-colors ${
              isAttending
                ? "border-accent bg-accent-soft text-accent-dark"
                : "border-hairline text-muted hover:border-accent/40"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={isAttending}
              onChange={() => mainForm.setValue("isAttending", true)}
            />
            Yes, I&apos;m attending
          </label>
          <label
            className={`flex-1 cursor-pointer rounded-xl border-2 p-3 text-center text-sm font-semibold transition-colors ${
              !isAttending
                ? "border-pay-self bg-pay-self-soft text-pay-self-text"
                : "border-hairline text-muted hover:border-pay-self/40"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={!isAttending}
              onChange={() => mainForm.setValue("isAttending", false)}
            />
            No, I&apos;m not attending
          </label>
        </div>
        {!isAttending && (
          <p className="mt-3 text-sm text-muted">
            No problem - everything below is optional. Just submit the form to let the planning
            team know you won&apos;t be there.
          </p>
        )}
      </Card>

      {miniStep === "about" ? (
        <div className="flex justify-end">
          <Button type="button" onClick={advanceFromAbout}>
            Next
          </Button>
        </div>
      ) : isAttending ? (
        <>
          <div className="space-y-5">
                <Card
                  eyebrow="Events"
                  title="Which events are you attending?"
                  className={mainForm.formState.errors.attendingHappyHour ? "border-2 border-red-500" : ""}
                >
                  <div className="space-y-3">
                    <Checkbox
                      label={`Happy Hour (${formatShortDate(formConfig.happyHourDate)})`}
                      {...mainForm.register("attendingHappyHour")}
                    />
                    <Checkbox
                      label={`All Hands (${formatShortDate(formConfig.allHandsDate)})`}
                      {...mainForm.register("attendingAllHands")}
                    />
                    <Checkbox
                      label={`Dinner (${formatShortDate(formConfig.dinnerDate)})`}
                      {...mainForm.register("attendingDinner")}
                    />
                  </div>
                  {mainForm.formState.errors.attendingHappyHour?.message && (
                    <p className="mt-2 text-sm font-semibold text-red-600">
                      {mainForm.formState.errors.attendingHappyHour.message}
                    </p>
                  )}
                </Card>

                {miniStep !== "events" && (
                  <>
                    <Card
                      eyebrow="Food"
                      title="Dietary restrictions"
                      className={mainForm.formState.errors.dietaryOptions ? "border-2 border-red-500" : ""}
                    >
                      <DietaryChecklist
                        selected={dietaryOptions}
                        other={dietaryOther}
                        onChange={(next) => mainForm.setValue("dietaryOptions", next)}
                        onOtherChange={(val) => mainForm.setValue("dietaryOther", val)}
                      />
                      {mainForm.formState.errors.dietaryOptions?.message && (
                        <p className="mt-2 text-sm font-semibold text-red-600">
                          {mainForm.formState.errors.dietaryOptions.message}
                        </p>
                      )}
                    </Card>

                    <Card
                      eyebrow="Hotel booking"
                      title="Stay dates"
                      className={
                        mainForm.formState.errors.stayStart ||
                        mainForm.formState.errors.stayEnd ||
                        mainForm.formState.errors.extraNightsRoomType
                          ? "border-2 border-red-500"
                          : ""
                      }
                    >
                      <StayDatesPicker
                        bookableStart={formConfig.bookableStart}
                        bookableEnd={formConfig.bookableEnd}
                        discountStart={formConfig.discountStart}
                        discountEnd={formConfig.discountEnd}
                        defaultCompanyPaidNights={formConfig.defaultCompanyPaidNights}
                        optionalCompanyPaidNights={formConfig.optionalCompanyPaidNights}
                        value={{ stayStart, stayEnd, companyPaidNights, ptoDates, extraNightsRoomType }}
                        onChange={(patch) => {
                          for (const [key, val] of Object.entries(patch)) {
                            mainForm.setValue(key as keyof BookingFormInput, val as never, {
                              shouldValidate: false,
                            });
                          }
                          if (patch.extraNightsRoomType) {
                            mainForm.clearErrors("extraNightsRoomType");
                          }
                        }}
                      />
                      {(mainForm.formState.errors.stayStart || mainForm.formState.errors.stayEnd) && (
                        <p className="mt-2 text-sm font-semibold text-red-600">
                          Please select your stay nights.
                        </p>
                      )}
                      {mainForm.formState.errors.extraNightsRoomType?.message && (
                        <p className="mt-2 text-sm font-semibold text-red-600">
                          {mainForm.formState.errors.extraNightsRoomType.message}
                        </p>
                      )}
                    </Card>

                    <Card
                      eyebrow="Companion"
                      title="Additional guests"
                      className={mainForm.formState.errors.guests ? "border-2 border-red-500" : ""}
                    >
                      <GuestFields
                        mainForm={mainForm}
                        attendingHappyHour={attendingHappyHour}
                        attendingDinner={attendingDinner}
                      />
                      {guestsListError && (
                        <p className="mt-2 text-sm font-semibold text-red-600">{guestsListError}</p>
                      )}
                    </Card>

                    <Card eyebrow="Travel" title="Flight details">
                      <div className="space-y-5">
                        <p className="text-sm text-muted">
                          This helps us group people with similar arrival times into carpools to and
                          from the hotel.
                        </p>
                        <div className="space-y-3 rounded-xl border border-hairline p-3">
                          <p className="field-label">Arrival</p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <AirlineField
                              label="Airline"
                              value={flightArrivalAirline}
                              onChange={(v) => mainForm.setValue("flightArrivalAirline", v)}
                            />
                            <Field label="Flight #">
                              <input
                                className="field"
                                placeholder="e.g. AA2332"
                                {...mainForm.register("flightArrivalNumber")}
                              />
                            </Field>
                            <Field label="Arrival date/time">
                              <input
                                type="datetime-local"
                                className="field"
                                {...mainForm.register("flightArrival")}
                              />
                            </Field>
                          </div>
                        </div>
                        <div className="space-y-3 rounded-xl border border-hairline p-3">
                          <p className="field-label">Departure</p>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <AirlineField
                              label="Airline"
                              value={flightDepartureAirline}
                              onChange={(v) => mainForm.setValue("flightDepartureAirline", v)}
                            />
                            <Field label="Flight #">
                              <input
                                className="field"
                                placeholder="e.g. UA772"
                                {...mainForm.register("flightDepartureNumber")}
                              />
                            </Field>
                            <Field label="Departure date/time">
                              <input
                                type="datetime-local"
                                className="field"
                                {...mainForm.register("flightDeparture")}
                              />
                            </Field>
                          </div>
                        </div>
                        <Field label="Other flight notes">
                          <textarea className="field" rows={2} {...mainForm.register("flightNotes")} />
                        </Field>
                      </div>
                    </Card>

                    <Card eyebrow="Anything else" title="Anything else you'd like the planning team to know?">
                      <textarea
                        className="field"
                        rows={3}
                        placeholder="Optional"
                        {...mainForm.register("additionalNotes")}
                      />
                    </Card>
                  </>
                )}
              </div>

          {miniStep === "events" && (
            <div className="flex justify-end">
              <Button type="button" onClick={() => setMiniStep("done")}>
                Next
              </Button>
            </div>
          )}
        </>
      ) : null}

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
    </>
  );
}

/** A select of common airlines with a free-text "Other" fallback, both
 *  writing to the same underlying string field. */
function AirlineField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const isListed = (AIRLINE_OPTIONS as readonly string[]).includes(value);
  const [showOther, setShowOther] = useState(value !== "" && !isListed);

  return (
    <Field label={label}>
      <select
        className="field"
        value={showOther ? "Other" : value}
        onChange={(e) => {
          if (e.target.value === "Other") {
            setShowOther(true);
            onChange("");
          } else {
            setShowOther(false);
            onChange(e.target.value);
          }
        }}
      >
        <option value="">Select airline</option>
        {AIRLINE_OPTIONS.map((airline) => (
          <option key={airline} value={airline}>
            {airline}
          </option>
        ))}
        <option value="Other">Other</option>
      </select>
      {showOther && (
        <input
          className="field mt-2"
          placeholder="Enter airline name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Field>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block" data-error={error ? "true" : undefined}>
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm font-semibold text-red-600">{error}</span>}
    </label>
  );
}
