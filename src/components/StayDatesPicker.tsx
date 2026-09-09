"use client";

import { useMemo, useState } from "react";
import {
  addIsoDays,
  isoDateRange,
  isoMonthDay,
  isoWeekdayLabel,
  isToggleableIso,
} from "@/lib/stay-tiles-client";

export type StayDatesValue = {
  stayStart: string;
  stayEnd: string; // checkout date, i.e. the day after the last selected night
  companyPaidNights: string[];
  needsExtraNights: boolean;
  extraNights: string[];
};

export default function StayDatesPicker({
  bookableStart,
  bookableEnd,
  extendedStart,
  extendedEnd,
  discountStart,
  discountEnd,
  discountRateUsd,
  defaultCompanyPaidNights,
  value,
  onChange,
}: {
  bookableStart: string;
  bookableEnd: string;
  extendedStart: string;
  extendedEnd: string;
  discountStart: string;
  discountEnd: string;
  discountRateUsd: number;
  defaultCompanyPaidNights: string[];
  value: StayDatesValue;
  onChange: (patch: Partial<StayDatesValue>) => void;
}) {
  // Selected "nights" within the standard block, e.g. ["2026-01-20", "2026-01-21"].
  const selectedNights = useMemo(() => {
    if (!value.stayStart || !value.stayEnd) return [] as string[];
    const lastNight = addIsoDays(value.stayEnd, -1);
    if (lastNight < value.stayStart) return [] as string[];
    return isoDateRange(value.stayStart, lastNight);
  }, [value.stayStart, value.stayEnd]);

  const selectedSet = useMemo(() => new Set(selectedNights), [selectedNights]);
  const companyPaidSet = useMemo(() => new Set(value.companyPaidNights), [value.companyPaidNights]);
  const extraSet = useMemo(() => new Set(value.extraNights), [value.extraNights]);

  const blockDays = useMemo(() => isoDateRange(bookableStart, bookableEnd), [bookableStart, bookableEnd]);
  const preBufferDays = useMemo(
    () => isoDateRange(extendedStart, addIsoDays(bookableStart, -1)),
    [extendedStart, bookableStart],
  );
  const postBufferDays = useMemo(
    () => isoDateRange(addIsoDays(bookableEnd, 1), extendedEnd),
    [bookableEnd, extendedEnd],
  );

  const [showExtraNights, setShowExtraNights] = useState(value.extraNights.length > 0);

  function toggleNight(day: string) {
    if (!selectedSet.has(day)) {
      // Extend the contiguous range to include this day, filling any gap.
      const allSelected = [...selectedNights, day].sort();
      const newMin = allSelected[0];
      const newMax = allSelected[allSelected.length - 1];
      const filled = isoDateRange(newMin, newMax);
      const seededCompanyPaid = new Set(value.companyPaidNights);
      for (const d of filled) {
        if (isToggleableIso(d) && !companyPaidSet.has(d) && defaultCompanyPaidNights.includes(d)) {
          seededCompanyPaid.add(d);
        }
      }
      onChange({
        stayStart: newMin,
        stayEnd: addIsoDays(newMax, 1),
        companyPaidNights: [...seededCompanyPaid].filter((d) => filled.includes(d)),
      });
      return;
    }

    // Already selected: shrink from whichever end was clicked, otherwise
    // (an interior day) restart the selection at just that day.
    const min = selectedNights[0];
    const max = selectedNights[selectedNights.length - 1];
    if (day === min && day === max) {
      onChange({ stayStart: "", stayEnd: "", companyPaidNights: [] });
    } else if (day === min) {
      const newMin = addIsoDays(day, 1);
      onChange({ stayStart: newMin, companyPaidNights: value.companyPaidNights.filter((d) => d !== day) });
    } else if (day === max) {
      const newMax = addIsoDays(day, -1);
      onChange({ stayEnd: addIsoDays(newMax, 1), companyPaidNights: value.companyPaidNights.filter((d) => d !== day) });
    } else {
      onChange({ stayStart: day, stayEnd: addIsoDays(day, 1), companyPaidNights: isToggleableIso(day) ? [day] : [] });
    }
  }

  function toggleCompanyPaid(day: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = new Set(value.companyPaidNights);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange({ companyPaidNights: [...next] });
  }

  function toggleExtraNight(day: string) {
    const next = new Set(value.extraNights);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange({ extraNights: [...next] });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Group rate of ${discountRateUsd}/night applies {isoMonthDay(discountStart)} to{" "}
        {isoMonthDay(discountEnd)} only.
      </p>

      <TileGrid
        days={blockDays}
        selectedSet={selectedSet}
        companyPaidSet={companyPaidSet}
        onTileClick={toggleNight}
        onToggleClick={toggleCompanyPaid}
      />

      {selectedNights.length > 0 && (
        <p className="text-sm text-muted">
          Checking in <strong className="text-foreground">{isoMonthDay(value.stayStart)}</strong>, checking
          out <strong className="text-foreground">{isoMonthDay(value.stayEnd)}</strong> ({selectedNights.length}{" "}
          night{selectedNights.length === 1 ? "" : "s"})
        </p>
      )}

      <p className="rounded-xl bg-background p-3 text-xs text-muted">
        Your checkout date is the morning after your last night. For example, checking in Thursday and
        checking out Saturday means you&apos;re covering 2 nights: Thursday and Friday.
      </p>

      <div>
        <button
          type="button"
          onClick={() => setShowExtraNights((v) => !v)}
          className="text-sm font-semibold text-accent-dark hover:underline"
        >
          {showExtraNights ? "− Hide extra nights outside the block" : "+ Add extra nights outside the block"}
        </button>

        {showExtraNights && (
          <div className="mt-3 space-y-3">
            {preBufferDays.length > 0 && (
              <TileGrid
                days={preBufferDays}
                selectedSet={extraSet}
                companyPaidSet={new Set()}
                onTileClick={toggleExtraNight}
                onToggleClick={() => {}}
                muted
                showMonth
              />
            )}
            {postBufferDays.length > 0 && (
              <TileGrid
                days={postBufferDays}
                selectedSet={extraSet}
                companyPaidSet={new Set()}
                onTileClick={toggleExtraNight}
                onToggleClick={() => {}}
                muted
                showMonth
              />
            )}
            <p className="text-xs text-muted">Extra nights outside the block are always paid by you.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TileGrid({
  days,
  selectedSet,
  companyPaidSet,
  onTileClick,
  onToggleClick,
  muted = false,
  showMonth = false,
}: {
  days: string[];
  selectedSet: Set<string>;
  companyPaidSet: Set<string>;
  onTileClick: (day: string) => void;
  onToggleClick: (day: string, e: React.MouseEvent) => void;
  muted?: boolean;
  showMonth?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {days.map((day) => {
        const selected = selectedSet.has(day);
        const companyPaid = companyPaidSet.has(day);
        const toggleable = isToggleableIso(day) && !muted;
        return (
          <button
            key={day}
            type="button"
            onClick={() => onTileClick(day)}
            className={`relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2 text-center transition-all duration-200 ease-out hover:scale-[1.04] ${
              selected
                ? companyPaid
                  ? "border-accent bg-accent-soft"
                  : "border-foreground/20 bg-foreground/10"
                : "border-hairline bg-surface hover:border-accent/40"
            }`}
          >
            <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
              {isoWeekdayLabel(day)}
            </span>
            <span className="font-mono text-base font-semibold">
              {showMonth ? isoMonthDay(day) : day.slice(-2)}
            </span>
            {selected && toggleable && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => onToggleClick(day, e)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleClick(day, e as unknown as React.MouseEvent);
                  }
                }}
                className={`mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  companyPaid ? "bg-accent text-white" : "bg-foreground/15 text-foreground"
                }`}
              >
                {companyPaid ? "CO. PAYS" : "I PAY"}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
