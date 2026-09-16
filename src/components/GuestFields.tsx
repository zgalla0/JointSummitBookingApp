"use client";

import { useFieldArray, type UseFormReturn } from "react-hook-form";
import type { BookingFormInput } from "@/lib/booking-schema";
import Button from "./ui/Button";
import Checkbox from "./ui/Checkbox";
import DietaryChecklist from "./DietaryChecklist";

export default function GuestFields({
  mainForm,
  attendingHappyHour,
  attendingDinner,
}: {
  mainForm: UseFormReturn<BookingFormInput>;
  attendingHappyHour: boolean;
  attendingDinner: boolean;
}) {
  const { control, register, watch, setValue } = mainForm;
  const { fields, append, remove } = useFieldArray({ control, name: "guests" });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Room rate covers 1 adult at no extra charge. The 2nd person adds $3 USD + tax per night,
        and the 3rd adds $28 USD + tax per night. Max room occupancy is 3 people. By adding a
        guest here, you&apos;re confirming you&apos;ll be responsible for these charges.
      </p>

      {fields.map((field, index) => {
        const guestType = watch(`guests.${index}.type`);
        const showEventQuestions = (attendingHappyHour || attendingDinner) && guestType !== "CHILD";
        const guestHappyHour = watch(`guests.${index}.attendingHappyHour`);
        const guestDinner = watch(`guests.${index}.attendingDinner`);
        const guestDietary = watch(`guests.${index}.dietaryOptions`);
        const guestDietaryOther = watch(`guests.${index}.dietaryOther`);
        const showDietary = guestHappyHour || guestDinner;

        return (
          <div key={field.id} className="space-y-3 rounded-xl border border-hairline p-3">
            <div className="flex flex-wrap items-end gap-2">
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
                <select
                  className="field"
                  {...register(`guests.${index}.type` as const, {
                    onChange: (e) => {
                      // Children don't attend Happy Hour/Dinner - clear any
                      // stale flags so the (now hidden) box's old answer
                      // doesn't get submitted along with it.
                      if (e.target.value === "CHILD") {
                        setValue(`guests.${index}.attendingHappyHour`, false);
                        setValue(`guests.${index}.attendingDinner`, false);
                      }
                    },
                  })}
                >
                  <option value="ADULT">Adult</option>
                  <option value="CHILD">Child</option>
                </select>
              </label>
              <Button type="button" variant="ghost" onClick={() => remove(index)} className="ml-auto">
                Remove
              </Button>
            </div>

            {showEventQuestions && (
              <div className="space-y-3 rounded-xl bg-background p-3">
                <p className="field-label">Will this guest be joining you at any events?</p>
                {attendingHappyHour && (
                  <Checkbox
                    label="Joining Happy Hour"
                    {...register(`guests.${index}.attendingHappyHour` as const)}
                  />
                )}
                {attendingDinner && (
                  <Checkbox
                    label="Joining Dinner"
                    {...register(`guests.${index}.attendingDinner` as const)}
                  />
                )}
                {showDietary && (
                  <div className="pt-1">
                    <p className="field-label mb-2">Dietary restrictions for this guest</p>
                    <DietaryChecklist
                      selected={guestDietary}
                      other={guestDietaryOther}
                      onChange={(next) => setValue(`guests.${index}.dietaryOptions`, next)}
                      onOtherChange={(val) => setValue(`guests.${index}.dietaryOther`, val)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {fields.length < 2 && (
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            append({
              firstName: "",
              lastName: "",
              type: "ADULT",
              attendingHappyHour: false,
              attendingDinner: false,
              dietaryOptions: [],
              dietaryOther: "",
            })
          }
        >
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
