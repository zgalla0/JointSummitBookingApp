"use client";

import { DIETARY_OPTIONS, type DietaryOptionKey } from "@/lib/dietary-options";
import Checkbox from "./ui/Checkbox";

export default function DietaryChecklist({
  selected,
  other,
  onChange,
  onOtherChange,
}: {
  selected: DietaryOptionKey[];
  other: string;
  onChange: (next: DietaryOptionKey[]) => void;
  onOtherChange: (value: string) => void;
}) {
  function toggle(key: DietaryOptionKey) {
    if (key === "NONE") {
      onChange(selected.includes("NONE") ? [] : ["NONE"]);
      return;
    }
    const withoutNone = selected.filter((k) => k !== "NONE");
    if (withoutNone.includes(key)) {
      onChange(withoutNone.filter((k) => k !== key));
    } else {
      onChange([...withoutNone, key]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-y-2.5 sm:grid-cols-3">
        {DIETARY_OPTIONS.map((option) => (
          <Checkbox
            key={option.key}
            label={option.label}
            checked={selected.includes(option.key)}
            onChange={() => toggle(option.key)}
          />
        ))}
      </div>
      {selected.includes("OTHER") && (
        <input
          className="field"
          placeholder="Tell us more"
          value={other}
          onChange={(e) => onOtherChange(e.target.value)}
        />
      )}
    </div>
  );
}
