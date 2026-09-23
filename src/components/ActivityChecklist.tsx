"use client";

import { ACTIVITY_OPTIONS, type ActivityOptionKey } from "@/lib/activity-options";
import Checkbox from "./ui/Checkbox";

export default function ActivityChecklist({
  selected,
  other,
  onChange,
  onOtherChange,
}: {
  selected: ActivityOptionKey[];
  other: string;
  onChange: (next: ActivityOptionKey[]) => void;
  onOtherChange: (value: string) => void;
}) {
  function toggle(key: ActivityOptionKey) {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else {
      onChange([...selected, key]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {ACTIVITY_OPTIONS.map((option) => (
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
