"use client";

import { useFieldArray, type Control, type UseFormRegister } from "react-hook-form";
import type { BookingFormInput } from "@/lib/booking-schema";

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
      <div>
        <h3 className="font-medium">Additional guests staying in your room</h3>
        <p className="text-sm text-gray-600">
          Room rate covers up to 2 adults (single/double occupancy) at no extra room charge,
          only a $3 USD bellman gratuity applies for the 2nd adult. A 3rd adult (triple
          occupancy) adds a $25 USD/night extra person fee plus 16% VAT and 3.5% ISH tax, plus
          another $3 USD bellman gratuity.
        </p>
      </div>

      {fields.map((field, index) => (
        <div key={field.id} className="flex flex-wrap items-end gap-2 rounded border p-3">
          <label className="flex flex-col text-sm">
            First name
            <input
              className="rounded border px-2 py-1"
              {...register(`guests.${index}.firstName` as const)}
            />
          </label>
          <label className="flex flex-col text-sm">
            Last name
            <input
              className="rounded border px-2 py-1"
              {...register(`guests.${index}.lastName` as const)}
            />
          </label>
          <label className="flex flex-col text-sm">
            Type
            <select className="rounded border px-2 py-1" {...register(`guests.${index}.type` as const)}>
              <option value="ADULT">Adult</option>
              <option value="CHILD">Child</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => remove(index)}
            className="ml-auto rounded border px-3 py-1 text-sm text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ))}

      {fields.length < 3 && (
        <button
          type="button"
          onClick={() => append({ firstName: "", lastName: "", type: "ADULT" })}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
        >
          + Add guest
        </button>
      )}

      {fields.length === 1 && (
        <p className="text-sm text-gray-600">
          Any additional costs for this guest (if applicable) are your responsibility to pay the
          hotel directly.
        </p>
      )}
      {fields.length > 1 && (
        <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">
          Please confirm this is correct. Bookings with more than 1 additional guest are flagged
          for admin review.
        </p>
      )}
    </div>
  );
}
