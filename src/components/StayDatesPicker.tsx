"use client";

import { useMemo } from "react";
import {
  addIsoDays,
  buildCalendarGrid,
  isMonTueWedIso,
  isoDateRange,
  isoMonthDay,
  isoWeekdayLabel,
  isThuOrFriIso,
  isTueOrWedIso,
  isToggleableIso,
  WEEKDAY_HEADER_MON_FIRST,
} from "@/lib/stay-tiles-client";
import { ROOM_TYPES, type RoomTypeKey } from "@/lib/room-types";

const CUESTA_APPROVAL_NOTE =
  "* Tuesday and Wednesday nights can only be paid by the company if arriving early has been approved by a partner or principal.";

export type StayDatesValue = {
  stayStart: string;
  stayEnd: string; // checkout date, i.e. the day after the last selected night
  companyPaidNights: string[];
  ptoDates: string[];
  extraNightsRoomType: string; // "" | RoomTypeKey
};

export default function StayDatesPicker({
  bookableStart,
  bookableEnd,
  blockStart,
  blockEnd,
  defaultCompanyPaidNights,
  value,
  onChange,
}: {
  bookableStart: string;
  bookableEnd: string;
  blockStart: string;
  blockEnd: string;
  defaultCompanyPaidNights: string[];
  value: StayDatesValue;
  onChange: (patch: Partial<StayDatesValue>) => void;
}) {
  // Selected nights, e.g. ["2026-01-20", "2026-01-21"]. May extend before or
  // after the standard block, anywhere within the bookable range.
  const selectedNights = useMemo(() => {
    if (!value.stayStart || !value.stayEnd) return [] as string[];
    const lastNight = addIsoDays(value.stayEnd, -1);
    if (lastNight < value.stayStart) return [] as string[];
    return isoDateRange(value.stayStart, lastNight);
  }, [value.stayStart, value.stayEnd]);

  const selectedSet = useMemo(() => new Set(selectedNights), [selectedNights]);
  const companyPaidSet = useMemo(() => new Set(value.companyPaidNights), [value.companyPaidNights]);
  const ptoSet = useMemo(() => new Set(value.ptoDates), [value.ptoDates]);

  const calendarRows = useMemo(
    () => buildCalendarGrid(bookableStart, bookableEnd),
    [bookableStart, bookableEnd],
  );

  const hasNightsOutsideBlock = useMemo(
    () => selectedNights.some((d) => d < blockStart || d > blockEnd),
    [selectedNights, blockStart, blockEnd],
  );

  function isInBlock(day: string): boolean {
    return day >= blockStart && day <= blockEnd;
  }

  function isCompanyToggleable(day: string): boolean {
    return isToggleableIso(day) && isInBlock(day);
  }

  // PTO applies to any Mon/Tue/Wed, plus any Thu/Fri except the specific
  // Thu/Fri the event itself falls on (those are always paid, not PTO).
  function showsPtoCheckbox(day: string): boolean {
    if (isMonTueWedIso(day)) return true;
    if (isThuOrFriIso(day)) return !defaultCompanyPaidNights.includes(day);
    return false;
  }

  const hasTueWedCompanyPaid = useMemo(
    () =>
      selectedNights.some(
        (d) => d >= blockStart && d <= blockEnd && isTueOrWedIso(d) && companyPaidSet.has(d),
      ),
    [selectedNights, companyPaidSet, blockStart, blockEnd],
  );

  function togglePto(day: string) {
    const next = new Set(value.ptoDates);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange({ ptoDates: [...next] });
  }

  function toggleNight(day: string) {
    if (!selectedSet.has(day)) {
      // Extend the contiguous range to include this day, filling any gap.
      const allSelected = [...selectedNights, day].sort();
      const newMin = allSelected[0];
      const newMax = allSelected[allSelected.length - 1];
      const filled = isoDateRange(newMin, newMax);
      const seededCompanyPaid = new Set(value.companyPaidNights);
      for (const d of filled) {
        if (isCompanyToggleable(d) && !companyPaidSet.has(d) && defaultCompanyPaidNights.includes(d)) {
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
      onChange({
        stayStart: "",
        stayEnd: "",
        companyPaidNights: [],
        ptoDates: value.ptoDates.filter((d) => d !== day),
        extraNightsRoomType: "",
      });
    } else if (day === min) {
      const newMin = addIsoDays(day, 1);
      onChange({
        stayStart: newMin,
        companyPaidNights: value.companyPaidNights.filter((d) => d !== day),
        ptoDates: value.ptoDates.filter((d) => d !== day),
      });
    } else if (day === max) {
      const newMax = addIsoDays(day, -1);
      onChange({
        stayEnd: addIsoDays(newMax, 1),
        companyPaidNights: value.companyPaidNights.filter((d) => d !== day),
        ptoDates: value.ptoDates.filter((d) => d !== day),
      });
    } else {
      onChange({
        stayStart: day,
        stayEnd: addIsoDays(day, 1),
        companyPaidNights: isCompanyToggleable(day) ? [day] : [],
        ptoDates: value.ptoDates.filter((d) => d === day),
      });
    }
  }

  function toggleCompanyPaid(day: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = new Set(value.companyPaidNights);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange({ companyPaidNights: [...next] });
  }

  return (
    <div className="space-y-4">
      <p className="rounded-xl bg-background p-3 text-xs text-muted">
        Check &quot;PTO&quot; on any weekday tile below to mark the day as PTO. This just helps us
        track PTO across the company for coverage purposes.{" "}
        <strong className="font-bold text-warning">
          You still need to enter your PTO in Mavenlink separately, this does not submit it for you.
        </strong>
      </p>

      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_HEADER_MON_FIRST.map((label) => (
            <div key={label} className="text-center text-[10px] font-semibold tracking-wide text-muted uppercase">
              {label}
            </div>
          ))}
        </div>
        {calendarRows.map((row, i) => (
          <div key={i} className="grid grid-cols-7 gap-2">
            {row.map((day, j) =>
              day ? (
                <DayTile
                  key={day}
                  day={day}
                  selected={selectedSet.has(day)}
                  companyPaid={companyPaidSet.has(day)}
                  toggleable={isCompanyToggleable(day)}
                  isTueWed={isTueOrWedIso(day)}
                  showPto={showsPtoCheckbox(day)}
                  ptoChecked={ptoSet.has(day)}
                  onClick={() => toggleNight(day)}
                  onToggleClick={(e) => toggleCompanyPaid(day, e)}
                  onPtoToggle={() => togglePto(day)}
                />
              ) : (
                <div key={j} />
              ),
            )}
          </div>
        ))}
      </div>

      {hasTueWedCompanyPaid && (
        <p className="rounded-xl bg-warning-soft p-3 text-xs font-bold text-warning">
          {CUESTA_APPROVAL_NOTE}
        </p>
      )}

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

      {hasNightsOutsideBlock && (
        <div className="space-y-2 rounded-xl border border-hairline p-3">
          <p className="field-label">Room type for the night(s) outside the standard block</p>
          {ROOM_TYPES.map((rt) => (
            <label key={rt.key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="extraNightsRoomType"
                checked={value.extraNightsRoomType === rt.key}
                onChange={() => onChange({ extraNightsRoomType: rt.key as RoomTypeKey })}
                className="accent-accent-dark h-4 w-4"
              />
              {rt.label}, ${rt.priceUsd} per night
            </label>
          ))}
          <p className="text-xs text-muted">
            Room types are limited in availability. We&apos;ll do our best to match you with your
            selected room type, but it isn&apos;t guaranteed.
          </p>
        </div>
      )}
    </div>
  );
}

function DayTile({
  day,
  selected,
  companyPaid,
  toggleable,
  isTueWed = false,
  showPto,
  ptoChecked,
  onClick,
  onToggleClick,
  onPtoToggle,
}: {
  day: string;
  selected: boolean;
  companyPaid: boolean;
  toggleable: boolean;
  isTueWed?: boolean;
  showPto: boolean;
  ptoChecked: boolean;
  onClick: () => void;
  onToggleClick: (e: React.MouseEvent) => void;
  onPtoToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-date={day}
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
      <span className="font-mono text-base font-semibold">{day.slice(-2)}</span>
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
            companyPaid ? "bg-accent text-white" : "bg-warning text-white"
          }`}
        >
          {companyPaid ? (isTueWed ? "PAID BY CUESTA*" : "CO. PAYS") : "I PAY"}
        </span>
      )}
      {/* Weekends and nights outside the block are always self-paid, with
          no toggle to click - just a plain label so it's just as clear as
          the interactive tiles that the individual is paying. */}
      {selected && !toggleable && (
        <span className="mt-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-bold text-white">
          I PAY
        </span>
      )}
      {selected && showPto && (
        <label
          className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={ptoChecked}
            onChange={onPtoToggle}
            className="accent-accent-dark h-3 w-3"
          />
          PTO
        </label>
      )}
    </button>
  );
}
