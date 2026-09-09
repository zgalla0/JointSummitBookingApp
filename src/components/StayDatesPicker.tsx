"use client";

import { useMemo, useState } from "react";
import {
  addIsoDays,
  buildCalendarGrid,
  isoDateRange,
  isoMonthDay,
  isoWeekdayLabel,
  isTueOrWedIso,
  isToggleableIso,
  WEEKDAY_HEADER_MON_FIRST,
} from "@/lib/stay-tiles-client";

const CUESTA_APPROVAL_NOTE =
  "Only check this if arriving early has been approved by a partner or principal, this stay will be paid for by Cuesta.";

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

  const calendarRows = useMemo(
    () => buildCalendarGrid(bookableStart, bookableEnd),
    [bookableStart, bookableEnd],
  );
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

      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_HEADER_MON_FIRST.map((label) => (
            <div key={label} className="text-center text-[10px] font-semibold tracking-wide text-muted uppercase">
              {label}
            </div>
          ))}
        </div>
        {calendarRows.map((row, i) => {
          const rowNeedsApprovalNote = row.some(
            (day) => day && isTueOrWedIso(day) && companyPaidSet.has(day),
          );
          return (
            <div key={i}>
              <div className="grid grid-cols-7 gap-2">
                {row.map((day, j) =>
                  day ? (
                    <DayTile
                      key={day}
                      day={day}
                      selected={selectedSet.has(day)}
                      companyPaid={companyPaidSet.has(day)}
                      toggleable={isToggleableIso(day)}
                      isTueWed={isTueOrWedIso(day)}
                      onClick={() => toggleNight(day)}
                      onToggleClick={(e) => toggleCompanyPaid(day, e)}
                    />
                  ) : (
                    <div key={j} />
                  ),
                )}
              </div>
              {rowNeedsApprovalNote && (
                <p className="mt-2 rounded-xl bg-accent-soft p-3 text-xs font-medium text-accent-dark">
                  {CUESTA_APPROVAL_NOTE}
                </p>
              )}
            </div>
          );
        })}
      </div>

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
              <FlowGrid
                days={preBufferDays}
                selectedSet={extraSet}
                onTileClick={toggleExtraNight}
                showMonth
              />
            )}
            {postBufferDays.length > 0 && (
              <FlowGrid
                days={postBufferDays}
                selectedSet={extraSet}
                onTileClick={toggleExtraNight}
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

function FlowGrid({
  days,
  selectedSet,
  onTileClick,
  showMonth = false,
}: {
  days: string[];
  selectedSet: Set<string>;
  onTileClick: (day: string) => void;
  showMonth?: boolean;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
      {days.map((day) => (
        <DayTile
          key={day}
          day={day}
          selected={selectedSet.has(day)}
          companyPaid={false}
          toggleable={false}
          onClick={() => onTileClick(day)}
          onToggleClick={() => {}}
          showMonth={showMonth}
        />
      ))}
    </div>
  );
}

function DayTile({
  day,
  selected,
  companyPaid,
  toggleable,
  isTueWed = false,
  onClick,
  onToggleClick,
  showMonth = false,
}: {
  day: string;
  selected: boolean;
  companyPaid: boolean;
  toggleable: boolean;
  isTueWed?: boolean;
  onClick: () => void;
  onToggleClick: (e: React.MouseEvent) => void;
  showMonth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      <span className="font-mono text-base font-semibold">{showMonth ? isoMonthDay(day) : day.slice(-2)}</span>
      {selected && toggleable && (
        <span
          role="button"
          tabIndex={0}
          onClick={onToggleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggleClick(e as unknown as React.MouseEvent);
            }
          }}
          className={`mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
            companyPaid ? "bg-accent text-white" : "bg-foreground/15 text-foreground"
          }`}
        >
          {companyPaid ? (isTueWed ? "PAID BY CUESTA" : "CO. PAYS") : "I PAY"}
        </span>
      )}
    </button>
  );
}
