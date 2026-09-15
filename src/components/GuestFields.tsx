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
        Room rate covers 1 adult at no extra charge. The 2nd person adds $3 USD + tax per night,
        and the 3rd adds $28 USD + tax per night. Max room occupancy is 3 people. By adding a
        guest here, you&apos;re confirming you&apos;ll be responsible for these charges.
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

      {fields.length >= 1 && (
        <p className="text-sm text-muted">
          Any additional costs for these guests are your responsibility to pay the hotel directly.
        </p>
      )}
    </div>
  );
}
