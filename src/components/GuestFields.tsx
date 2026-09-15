"use client";

import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import type { BookingFormInput } from "@/lib/booking-schema";
import Button from "./ui/Button";

export default function GuestFields({
  control,
  register,
}: {
  control: Control<BookingFormInput>;
  register: UseFormRegister<BookingFormInput>;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: "guests" });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Room rate covers 1 adult at no extra charge. The 2nd person adds $3 USD + tax per night.
        The 3rd person adds $28 USD + tax per night. Max room occupancy is 3 people.
      </p>

      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-wrap items-end gap-2 rounded-xl border border-hairline p-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="field-label">First name</span>
            <input className="field" {...register(`guests.${index}.firstName` as const)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="field-label">Last name</span>
            <input className="field" {...register(`guests.${index}.lastName` as const)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="field-label">Type</span>
            <select className="field" {...register(`guests.${index}.type` as const)}>
              <option value="ADULT">Adult</option>
              <option value="CHILD">Child</option>
            </select>
          </label>
          <Button type="button" variant="ghost" onClick={() => remove(index)} className="ml-auto">
            Remove
          </Button>
        </div>
      ))}

      {fields.length < 2 && (
        <Button type="button" variant="secondary" onClick={() => append({ firstName: "", lastName: "", type: "ADULT" })}>
          + Add guest
        </Button>
      )}

      {fields.length === 1 && (
        <p className="text-sm text-muted">
          Any additional costs for this guest are your responsibility to pay the hotel directly.
        </p>
      )}
      {fields.length > 1 && (
        <p className="rounded-xl bg-accent-soft p-2.5 text-sm font-medium text-accent-dark">
          Please confirm this is correct, bookings with more than 1 additional guest are flagged
          for admin review.
        </p>
      )}
    </div>
  );
}
