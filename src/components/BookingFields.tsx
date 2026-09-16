"use client";

import { useState, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BookingFormInput } from "@/lib/booking-schema";
import { formatShortDate } from "@/lib/format";
import { LOCATION_OPTIONS } from "@/lib/location-options";
import { AIRLINE_OPTIONS } from "@/lib/airline-options";
import Card from "./ui/Card";
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
  happyHourDate: string;
  allHandsDate: string;
  dinnerDate: string;
  defaultCompanyPaidNights: string[];
};

export type StaticContentItem = { key: string; title: string | null; body: string | null };

/**
 * All the shared booking-form sections (details through flight), used by
 * both the first-time public form and the magic-link edit form. Everything
 * around it (identity/duplicate gating, submit button, success screen,
 * cancel flow) differs between those two and stays in the caller.
 */
export default function BookingFields({
  mainForm,
  formConfig,
  staticContent,
}: {
  mainForm: UseFormReturn<BookingFormInput>;
  formConfig: FormConfig;
  staticContent: StaticContentItem[];
}) {
  const [sameEmail, setSameEmail] = useState(
    mainForm.getValues("hotelEmail") === mainForm.getValues("detailsEmail"),
  );

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
            <div className="space-y-2 pt-1">
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

      <Card eyebrow="Events" title="Which events are you attending?">
        <div className="space-y-3">
          <Checkbox
            label={`Happy Hour (${formatShortDate(formConfig.happyHourDate)})`}
            {...mainForm.register("attendingHappyHour")}
          />
          {attendingHappyHour && (
            <div className="ml-7">
              <Checkbox
                label="Will your companion join Happy Hour too?"
                {...mainForm.register("happyHourPlusOne")}
              />
            </div>
          )}
          <Checkbox
            label={`All Hands (${formatShortDate(formConfig.allHandsDate)})`}
            {...mainForm.register("attendingAllHands")}
          />
          <Checkbox
            label={`Dinner (${formatShortDate(formConfig.dinnerDate)})`}
            {...mainForm.register("attendingDinner")}
          />
          {attendingDinner && (
            <div className="ml-7">
              <Checkbox
                label="Will your companion join Dinner too?"
                {...mainForm.register("dinnerPlusOne")}
              />
            </div>
          )}
        </div>
      </Card>

      <Card eyebrow="Hotel booking" title="Stay dates">
        <StayDatesPicker
          bookableStart={formConfig.bookableStart}
          bookableEnd={formConfig.bookableEnd}
          blockStart={formConfig.blockStart}
          blockEnd={formConfig.blockEnd}
          discountStart={formConfig.discountStart}
          discountEnd={formConfig.discountEnd}
          defaultCompanyPaidNights={formConfig.defaultCompanyPaidNights}
          value={{ stayStart, stayEnd, companyPaidNights, ptoDates, extraNightsRoomType }}
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

      <Card eyebrow="Companion" title="Additional guests">
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
        <div className="space-y-5">
          <p className="text-sm text-muted">
            This helps us group people with similar arrival times into carpools to and from the
            hotel. Arrival and departure may be different flights, so each gets its own airline
            and flight number.
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
                <input type="datetime-local" className="field" {...mainForm.register("flightArrival")} />
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
                <input type="datetime-local" className="field" {...mainForm.register("flightDeparture")} />
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
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
    </label>
  );
}
