"use client";

import { useState, type ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { BookingFormInput } from "@/lib/booking-schema";
import { formatShortDate } from "@/lib/format";
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
              <Checkbox label="Will your +1 join Happy Hour too?" {...mainForm.register("happyHourPlusOne")} />
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
              <Checkbox label="Will your +1 join Dinner too?" {...mainForm.register("dinnerPlusOne")} />
            </div>
          )}
        </div>
      </Card>

      <Card eyebrow="Lodging" title="Stay dates">
        <StayDatesPicker
          bookableStart={formConfig.bookableStart}
          bookableEnd={formConfig.bookableEnd}
          blockStart={formConfig.blockStart}
          blockEnd={formConfig.blockEnd}
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
        <div className="space-y-5">
          <p className="text-sm text-muted">
            This helps us group people with similar arrival times into carpools to and from the
            hotel. Arrival and departure may be different flights, so each gets its own airline
            and flight number.
          </p>
          <div className="space-y-3">
            <p className="field-label">Arrival</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Airline">
                <input className="field" {...mainForm.register("flightArrivalAirline")} />
              </Field>
              <Field label="Flight #">
                <input className="field" {...mainForm.register("flightArrivalNumber")} />
              </Field>
              <Field label="Arrival date/time">
                <input type="datetime-local" className="field" {...mainForm.register("flightArrival")} />
              </Field>
            </div>
          </div>
          <div className="space-y-3 border-t border-hairline pt-5">
            <p className="field-label">Departure</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Airline">
                <input className="field" {...mainForm.register("flightDepartureAirline")} />
              </Field>
              <Field label="Flight #">
                <input className="field" {...mainForm.register("flightDepartureNumber")} />
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
