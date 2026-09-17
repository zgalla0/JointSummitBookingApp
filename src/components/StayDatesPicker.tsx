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
 *  orange once the night is actually selected (a real "heads up"). Only
 *  covers night tiles - the checkout tile has its own, much bolder look
 *  (see the isCheckOut branch in DayTile) since it needs to visually stand
 *  apart from every other tile, not blend in as a lighter variant. */
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

  // Hotel-style check-in/check-out picking: the first tile you click is
  // check-in, the next one you click is check-out - and check-out itself is
  // never a paid night, matching how every hotel site works. Re-clicking
  // either end shrinks the stay from that end; clicking an interior night
  // restarts the selection there; clicking outside the current range
  // extends whichever end is closer.
  function toggleNight(day: string) {
    const clearSelection = () =>
      onChange({
        stayStart: "",
        stayEnd: "",
        companyPaidNights: [],
        ptoDates: value.ptoDates.filter((d) => d !== day),
        extraNightsRoomType: "",
      });

    const startFreshNight = (newDay: string) =>
      onChange({
        stayStart: newDay,
        stayEnd: addIsoDays(newDay, 1),
        companyPaidNights: isForcedCompanyPaid(newDay) || isCompanyToggleable(newDay) ? [newDay] : [],
        ptoDates: value.ptoDates.filter((d) => d === newDay),
      });

    if (!value.stayStart || !value.stayEnd) {
      startFreshNight(day);
      return;
    }

    const checkIn = value.stayStart;
    const checkOut = value.stayEnd;
    const lastNight = addIsoDays(checkOut, -1);
    const onlyOneNight = checkIn === lastNight;

    if (day === checkIn) {
      // Re-clicking check-in: shrink the stay by one night from the start.
      if (onlyOneNight) {
        clearSelection();
      } else {
        const newCheckIn = addIsoDays(day, 1);
        onChange({
          stayStart: newCheckIn,
          companyPaidNights: value.companyPaidNights.filter((d) => d !== day),
          ptoDates: value.ptoDates.filter((d) => d !== day),
        });
      }
      return;
    }

    if (day === checkOut) {
      // Re-clicking check-out: pull it back by one night.
      if (onlyOneNight) {
        clearSelection();
      } else {
        onChange({
          stayEnd: lastNight,
          companyPaidNights: value.companyPaidNights.filter((d) => d !== lastNight),
          ptoDates: value.ptoDates.filter((d) => d !== lastNight),
        });
      }
      return;
    }

    if (day > checkIn && day < checkOut) {
      // Interior night: restart the selection at just that day.
      startFreshNight(day);
      return;
    }

    const seededCompanyPaid = new Set(value.companyPaidNights);
    if (day < checkIn) {
      // Extend check-in earlier; check-out is unaffected.
      const filled = isoDateRange(day, lastNight);
      for (const d of filled) {
        if (isForcedCompanyPaid(d)) seededCompanyPaid.add(d);
      }
      onChange({ stayStart: day, companyPaidNights: [...seededCompanyPaid].filter((d) => filled.includes(d)) });
    } else {
      // day > checkOut: extend check-out later - the clicked day itself
      // becomes the new check-out, excluded from nights.
      const filled = isoDateRange(checkIn, addIsoDays(day, -1));
      for (const d of filled) {
        if (isForcedCompanyPaid(d)) seededCompanyPaid.add(d);
      }
      onChange({ stayEnd: day, companyPaidNights: [...seededCompanyPaid].filter((d) => filled.includes(d)) });
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
                  isCheckIn={day === value.stayStart}
                  isCheckOut={day === value.stayEnd}
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
        Click your check-in date, then click your check-out date. For example, clicking Thursday then
        Saturday means you&apos;re covering 2 nights: Thursday and Friday - Saturday itself is your
        check-out day, not a paid night.
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
  isCheckIn,
  isCheckOut,
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
  isCheckIn: boolean;
  isCheckOut: boolean;
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
  // Check-out is never a paid night - no toggle, no price, no PTO. Styled as
  // a solid, high-contrast tile (not a lighter tint like the night states)
  // so it unmistakably reads as its own thing rather than a plain unselected
  // tile or a variant of a payment color.
  if (isCheckOut) {
    return (
      <button
        type="button"
        data-date={day}
        onClick={onClick}
        className="relative flex flex-col items-center gap-0.5 rounded-xl border-2 border-slate-700 bg-slate-700 px-1 py-2 text-center text-white shadow-md transition-all duration-200 ease-out hover:scale-[1.04]"
      >
        <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">
          {isoWeekdayLabel(day)}
        </span>
        <span className="font-mono text-base font-semibold">{day.slice(-2)}</span>
        <span className="mt-1 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-slate-700 uppercase">
          Check out
        </span>
      </button>
    );
  }

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
      {selected && isCheckIn && (
        <span className="rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-white uppercase">
          Check in
        </span>
      )}

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
