"use client";

import { useEffect, useMemo } from "react";
import {
  addIsoDays,
  buildCalendarGrid,
  isoDateRange,
  isoMonthDay,
  isoWeekdayLabel,
  isWeekdayIso,
  WEEKDAY_HEADER_SUN_FIRST,
} from "@/lib/stay-tiles-client";
import { ROOM_TYPES, type RoomTypeKey } from "@/lib/room-types";
import { HOTEL_NAME, HOTEL_URL, HOTEL_ROOMS_URL, HOTEL_ADDRESS } from "@/lib/hotel-info";

const CUESTA_APPROVAL_NOTE =
  "* These nights can only be paid by the company if arriving early and having the room paid for by Cuesta has been approved by a partner or principal.";

/** A single, non-overlapping set of border/background classes per tile
 *  state, rather than layering conflicting utility classes: outside the
 *  discount window the border is dashed - grey when unselected (subtle),
 *  orange once the night is actually selected (a real "heads up"). */
function tileBorderClasses(selected: boolean, companyPaid: boolean, outsideWindow: boolean): string {
  if (!selected) {
    return outsideWindow
      ? "border-dashed border-black/20 bg-surface hover:border-warning/50"
      : "border-hairline bg-surface hover:border-accent/40";
  }
  const bg = companyPaid ? "bg-accent-soft" : "bg-pay-self-soft";
  if (outsideWindow) return `border-dashed border-warning ${bg}`;
  return companyPaid ? `border-accent ${bg}` : `border-pay-self ${bg}`;
}

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
  discountStart,
  discountEnd,
  defaultCompanyPaidNights,
  optionalCompanyPaidNights,
  value,
  onChange,
}: {
  bookableStart: string;
  bookableEnd: string;
  discountStart: string;
  discountEnd: string;
  defaultCompanyPaidNights: string[];
  optionalCompanyPaidNights: string[];
  value: StayDatesValue;
  onChange: (patch: Partial<StayDatesValue>) => void;
}) {
  // Pre-select the official summit dates on first load (a blank form only -
  // an existing booking already has its own stayStart/stayEnd, so this
  // never overrides that). Attendees can still change or deselect them.
  useEffect(() => {
    if (!value.stayStart && defaultCompanyPaidNights.length > 0) {
      const sorted = [...defaultCompanyPaidNights].sort();
      onChange({
        stayStart: sorted[0],
        stayEnd: addIsoDays(sorted[sorted.length - 1], 1),
        companyPaidNights: [...defaultCompanyPaidNights],
      });
    }
    // Mount-only: this seeds the blank-form default once and must not re-run
    // as stayStart/onChange change afterward.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const hasNightsOutsideDiscountWindow = useMemo(
    () => selectedNights.some((d) => d < discountStart || d > discountEnd),
    [selectedNights, discountStart, discountEnd],
  );

  // The day before All Hands + All Hands day itself are always company-paid
  // - no toggle, just a fixed label - since attendees don't get a choice
  // about who covers those 2 nights.
  function isForcedCompanyPaid(day: string): boolean {
    return defaultCompanyPaidNights.includes(day);
  }

  // The 2 nights before that (arriving early) can optionally be toggled to
  // company-paid, with approval - no other night, in the block or out of
  // it, is ever eligible either way.
  function isOptionalCompanyPaid(day: string): boolean {
    return optionalCompanyPaidNights.includes(day);
  }

  function isCompanyToggleable(day: string): boolean {
    return isOptionalCompanyPaid(day) && !isForcedCompanyPaid(day);
  }

  function isOutsideDiscountWindow(day: string): boolean {
    return day < discountStart || day > discountEnd;
  }

  // PTO applies to any weekday except the specific dates that are forced
  // company-paid (those are mandatory attendance, not PTO-eligible).
  function showsPtoCheckbox(day: string): boolean {
    return isWeekdayIso(day) && !isForcedCompanyPaid(day);
  }

  const hasOptionalCompanyPaid = useMemo(
    () => selectedNights.some((d) => optionalCompanyPaidNights.includes(d) && companyPaidSet.has(d)),
    [selectedNights, companyPaidSet, optionalCompanyPaidNights],
  );

  // Shown as a standing price reference for any self-paid stay, not just
  // nights that actually require a room-type choice - hidden only when
  // nothing but the two locked, forced-company-paid nights is selected.
  const hasAnySelfPaidStay = useMemo(
    () => selectedNights.some((d) => !defaultCompanyPaidNights.includes(d)),
    [selectedNights, defaultCompanyPaidNights],
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
        if (isForcedCompanyPaid(d)) seededCompanyPaid.add(d);
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
        companyPaidNights: isForcedCompanyPaid(day) || isCompanyToggleable(day) ? [day] : [],
        ptoDates: value.ptoDates.filter((d) => d === day),
      });
    }
  }

  function setCompanyPaid(day: string, paid: boolean) {
    const next = new Set(value.companyPaidNights);
    if (paid) next.add(day);
    else next.delete(day);
    onChange({ companyPaidNights: [...next] });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        <a
          href={HOTEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-accent-dark hover:underline"
        >
          {HOTEL_NAME}
        </a>
        , {HOTEL_ADDRESS}
      </p>

      <p className="rounded-xl bg-accent-soft p-3 text-xs font-bold text-accent-dark">
        All bookings made through this page are for the {HOTEL_NAME} hotel block. Please
        don&apos;t use this page for bookings at outside hotels. For PTO coverage questions, talk
        to your manager or Dani V.
      </p>

      <p className="rounded-xl bg-background p-3 text-xs text-muted">
        Check &quot;PTO&quot; on any weekday tile below to mark the day as PTO. This just helps us
        track PTO across the company for coverage purposes.{" "}
        <strong className="font-bold text-warning">
          You still need to enter your PTO in Mavenlink separately,{" "}
          <u>this does not submit it for you</u>.
        </strong>
      </p>

      {selectedNights.length > 0 && (
        <p className="rounded-xl border border-hairline bg-surface p-3 text-center text-sm text-muted">
          Checking in <strong className="text-foreground">{isoMonthDay(value.stayStart)}</strong>,
          checking out <strong className="text-foreground">{isoMonthDay(value.stayEnd)}</strong> (
          {selectedNights.length} night{selectedNights.length === 1 ? "" : "s"})
        </p>
      )}

      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_HEADER_SUN_FIRST.map((label) => (
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
                  forcedCompanyPaid={isForcedCompanyPaid(day)}
                  showPto={showsPtoCheckbox(day)}
                  ptoChecked={ptoSet.has(day)}
                  outsideDiscountWindow={isOutsideDiscountWindow(day)}
                  onClick={() => toggleNight(day)}
                  onSetCompanyPaid={(paid) => setCompanyPaid(day, paid)}
                  onPtoToggle={() => togglePto(day)}
                />
              ) : (
                <div key={j} />
              ),
            )}
          </div>
        ))}
      </div>

      {hasOptionalCompanyPaid && (
        <p className="rounded-xl bg-warning-soft p-3 text-xs font-bold text-warning">
          {CUESTA_APPROVAL_NOTE}
        </p>
      )}

      <p className="rounded-xl bg-background p-3 text-xs text-muted">
        Your checkout date is the morning after your last night. For example, checking in Thursday and
        checking out Saturday means you&apos;re covering 2 nights: Thursday and Friday.
      </p>

      <p
        className={`rounded-xl p-3 text-xs ${
          hasNightsOutsideDiscountWindow ? "bg-warning-soft font-bold text-warning" : "bg-background text-muted"
        }`}
      >
        <span aria-hidden className="mr-1">
          ⚠️
        </span>
        Tiles with a dashed border are outside the discounted rate window; the dash turns orange
        once you select one of those nights. Hotel price may differ outside this window, check
        Google for the current rate.
      </p>

      {hasAnySelfPaidStay && (
        <div className="space-y-2 rounded-xl border-2 border-warning bg-warning-soft p-3">
          <p className="field-label text-warning">Room type for the night(s) outside the standard rate</p>
          {ROOM_TYPES.map((rt) => (
            <label key={rt.key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="extraNightsRoomType"
                checked={value.extraNightsRoomType === rt.key}
                onChange={() => onChange({ extraNightsRoomType: rt.key as RoomTypeKey })}
                className="accent-accent-dark h-4 w-4"
              />
              {rt.label}, ${rt.priceUsd} USD per night
            </label>
          ))}
          <a
            href={HOTEL_ROOMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-bold text-accent-dark hover:underline"
          >
            See what&apos;s different between these two rooms →
          </a>
          <p className="text-xs text-muted">
            Room types are limited in availability. We&apos;ll do our best to match you with your
            selected room type, but it isn&apos;t guaranteed. Ask questions on the above if you have
            any.
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
  forcedCompanyPaid,
  showPto,
  ptoChecked,
  outsideDiscountWindow,
  onClick,
  onSetCompanyPaid,
  onPtoToggle,
}: {
  day: string;
  selected: boolean;
  companyPaid: boolean;
  toggleable: boolean;
  forcedCompanyPaid: boolean;
  showPto: boolean;
  ptoChecked: boolean;
  outsideDiscountWindow: boolean;
  onClick: () => void;
  onSetCompanyPaid: (paid: boolean) => void;
  onPtoToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-date={day}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2 text-center transition-all duration-200 ease-out hover:scale-[1.04] ${tileBorderClasses(selected, companyPaid, outsideDiscountWindow)}`}
    >
      <span className="text-[10px] font-semibold tracking-wide text-muted uppercase">
        {isoWeekdayLabel(day)}
      </span>
      <span className="font-mono text-base font-semibold">{day.slice(-2)}</span>

      {selected && toggleable && (
        // Spans with role="button", not real <button>s: the whole tile is
        // already a <button>, and nested <button> elements are invalid HTML
        // (breaks hydration and click handling in the browser).
        <span
          className="mt-1 flex h-6 w-full overflow-hidden rounded-full border border-hairline text-[8px] font-bold normal-case"
          onClick={(e) => e.stopPropagation()}
        >
          <span
            role="button"
            tabIndex={0}
            onClick={() => onSetCompanyPaid(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSetCompanyPaid(false);
              }
            }}
            className={`grid flex-1 h-full place-items-center px-1 text-center leading-tight ${!companyPaid ? "bg-pay-self text-pay-self-text" : "bg-surface text-muted"}`}
          >
            I Pay
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={() => onSetCompanyPaid(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSetCompanyPaid(true);
              }
            }}
            className={`grid flex-1 h-full place-items-center px-1 text-center leading-tight ${companyPaid ? "bg-accent text-white" : "bg-surface text-muted"}`}
          >
            Paid by Cuesta*
          </span>
        </span>
      )}

      {/* Happy Hour / Summit nights are always company-paid - no toggle,
          just a fixed label (no lock icon, matching the plain "I PAY" badge
          below for the days that go the other way: always self-paid). */}
      {selected && !toggleable && forcedCompanyPaid && (
        <span className="mt-1 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white">
          Paid by Cuesta
        </span>
      )}

      {/* Weekends and nights outside the block are always self-paid, with
          no toggle to click - just a plain label so it's just as clear as
          the interactive tiles that the individual is paying. */}
      {selected && !toggleable && !forcedCompanyPaid && (
        <span className="mt-1 rounded-full bg-pay-self px-1.5 py-0.5 text-[9px] font-bold text-pay-self-text">
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
