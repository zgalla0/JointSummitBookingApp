"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BookingFormInput } from "@/lib/booking-schema";
import { formatShortDate } from "@/lib/format";
import { needsRoomTypeChoice as nightsNeedRoomTypeChoice } from "@/lib/stay-tiles-client";
import { LOCATION_OPTIONS } from "@/lib/location-options";
import { AIRLINE_OPTIONS } from "@/lib/airline-options";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Checkbox from "./ui/Checkbox";
import GuestFields from "./GuestFields";
import DietaryChecklist from "./DietaryChecklist";
import ActivityChecklist from "./ActivityChecklist";
import StayDatesPicker from "./StayDatesPicker";

export type FormConfig = {
  bookableStart: string;
  bookableEnd: string;
  discountStart: string;
  discountEnd: string;
  happyHourDate: string;
  allHandsDate: string;
  dinnerDate: string;
  defaultCompanyPaidNights: string[];
  optionalCompanyPaidNights: string[];
};

export type StaticContentItem = { key: string; title: string | null; body: string | null };

/** True when at least one selected night isn't already covered by Cuesta -
 *  meaning a room type choice is required, since that choice only affects
 *  what the attendee themselves pays. This doesn't depend on the block/
 *  discount window at all: most self-paid nights fall inside it too (only
 *  the two forced and two optional company-paid nights are ever exempt).
 *  Stay dates need to be picked first, so this can't be a plain zod refine
 *  on the schema - both the new-booking and edit-booking forms call this
 *  after the rest of the form has already validated, right before the
 *  request goes out. */
export function needsRoomTypeChoice(values: BookingFormInput): boolean {
  return values.isAttending && nightsNeedRoomTypeChoice(values.stayStart, values.stayEnd, values.companyPaidNights);
}

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
  gateEvents = false,
  onGateDoneChange,
}: {
  mainForm: UseFormReturn<BookingFormInput>;
  formConfig: FormConfig;
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
  const [miniStep, setMiniStepState] = useState<MiniStep>(gateEvents ? "about" : "done");

  function setMiniStep(next: MiniStep) {
    setMiniStepState(next);
    onGateDoneChange?.(next === "done");
  }

  // Scrolls the newly-revealed section into view after each "Next" click -
  // otherwise it renders below the fold and reads as if nothing happened
  // until the attendee manually scrolls down to find it. Skipped on mount
  // (the ref effect below only reacts to later miniStep changes).
  const eventsSectionRef = useRef<HTMLElement>(null);
  const doneSectionRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const ref = miniStep === "events" ? eventsSectionRef : miniStep === "done" ? doneSectionRef : null;
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [miniStep]);

  const isAttending = mainForm.watch("isAttending");

  async function advanceFromAbout() {
    const valid = await mainForm.trigger([
      "reservationFirstName",
      "reservationLastName",
      "cuestaEmail",
      "location",
    ]);
    if (!valid) return;
    // Not attending: Events and everything else that depends on attending
    // don't apply, so skip straight past them - only Comments still shows.
    setMiniStep(isAttending ? "events" : "done");
  }

  const stayStart = mainForm.watch("stayStart");
  const stayEnd = mainForm.watch("stayEnd");
  const companyPaidNights = mainForm.watch("companyPaidNights");
  const ptoDates = mainForm.watch("ptoDates");
  const extraNightsRoomType = mainForm.watch("extraNightsRoomType");
  const cuestaEmail = mainForm.watch("cuestaEmail");
  const attendingHappyHour = mainForm.watch("attendingHappyHour");
  const attendingDinner = mainForm.watch("attendingDinner");
  const dietaryOptions = mainForm.watch("dietaryOptions");
  const dietaryOther = mainForm.watch("dietaryOther");
  const activityOptions = mainForm.watch("activityOptions");
  const activityOther = mainForm.watch("activityOther");
  const flightArrivalAirline = mainForm.watch("flightArrivalAirline");
  const flightDepartureAirline = mainForm.watch("flightDepartureAirline");

  // react-hook-form nests an array-level zod issue under `.root` once any
  // per-item field (e.g. "guests.0.firstName") is also registered, rather
  // than leaving it at `errors.guests.message` directly.
  const guestsListError =
    mainForm.formState.errors.guests?.root?.message ?? mainForm.formState.errors.guests?.message;

  // There's only one email on this form now (the Cuesta email) - it's
  // written into hotelEmail/detailsEmail too so the rest of the app (which
  // still has separate columns for "email used for the hotel booking" and
  // "email for transportation/schedule details") keeps working unchanged.
  function setCuestaEmail(value: string) {
    mainForm.setValue("cuestaEmail", value, { shouldValidate: true, shouldDirty: true });
    mainForm.setValue("hotelEmail", value, { shouldValidate: true, shouldDirty: true });
    mainForm.setValue("detailsEmail", value, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <>
      <Card eyebrow="About you" title="Your details">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label={
                <>
                  First name{" "}
                  <span className="rounded bg-warning-soft px-1 font-bold text-warning">
                    for hotel reservation
                  </span>
                </>
              }
              error={mainForm.formState.errors.reservationFirstName?.message}
            >
              <input className="field" {...mainForm.register("reservationFirstName")} />
            </Field>
            <Field
              label={
                <>
                  Last name{" "}
                  <span className="rounded bg-warning-soft px-1 font-bold text-warning">
                    for hotel reservation
                  </span>
                </>
              }
              error={mainForm.formState.errors.reservationLastName?.message}
            >
              <input className="field" {...mainForm.register("reservationLastName")} />
            </Field>
          </div>
          <Field
            label="Name for name tag"
            error={mainForm.formState.errors.nameTag?.message}
          >
            <input
              className="field"
              placeholder="Optional - only if different from the name above"
              {...mainForm.register("nameTag")}
            />
          </Field>
          <Field label="Cuesta email" error={mainForm.formState.errors.cuestaEmail?.message}>
            <input
              className="field"
              placeholder="you@cuestapartners.com"
              value={cuestaEmail}
              onChange={(e) => setCuestaEmail(e.target.value)}
            />
          </Field>
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
      ) : (
        <>
          {isAttending && (
            <div className="space-y-5">
              <Card
                eyebrow="Events"
                title="Which events are you attending?"
                className={mainForm.formState.errors.attendingHappyHour ? "border-2 border-red-500" : ""}
                containerRef={eventsSectionRef}
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

              <Card
                eyebrow="Activity"
                title="Which activities would you be interested in?"
              >
                <p className="text-sm text-muted">
                  Select all that apply -{" "}
                  <strong className="font-bold text-foreground">
                    this is just to help us gauge interest, not a final decision
                  </strong>{" "}
                  on what we&apos;ll do.
                </p>
                <p className="mb-3 text-sm text-muted">
                  Approximate driving/walking times from the hotel are shown
                </p>
                <ActivityChecklist
                  selected={activityOptions}
                  other={activityOther}
                  onChange={(next) => mainForm.setValue("activityOptions", next)}
                  onOtherChange={(val) => mainForm.setValue("activityOther", val)}
                />
              </Card>

              {miniStep !== "events" && (
                <>
                  <Card
                    eyebrow="Food"
                    title="Dietary restrictions"
                    className={mainForm.formState.errors.dietaryOptions ? "border-2 border-red-500" : ""}
                    containerRef={doneSectionRef}
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
                          <Field
                            label="Departure date/time"
                            error={mainForm.formState.errors.flightDeparture?.message}
                          >
                            <input
                              type="datetime-local"
                              className="field"
                              {...mainForm.register("flightDeparture")}
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </Card>
                </>
              )}
            </div>
          )}

          {(!isAttending || miniStep !== "events") && (
            <Card
              eyebrow="Comments"
              title="Anything else we should know? Note that this gets sent straight to our inbox, so please keep it relevant."
            >
              <textarea
                className="field"
                rows={3}
                placeholder="Optional"
                {...mainForm.register("additionalNotes")}
              />
            </Card>
          )}

          {isAttending && miniStep === "events" && (
            <div className="flex justify-end">
              <Button type="button" onClick={() => setMiniStep("done")}>
                Next
              </Button>
            </div>
          )}
        </>
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
  label: ReactNode;
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
