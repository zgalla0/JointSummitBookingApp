import { companyPaidNights, isWithinDiscountWindow } from "./config";

export type NightPayer = "company" | "self";

export type NightBreakdown = {
  date: Date; // night start date, e.g. Jan 21 = the night of the 21st into the 22nd
  payer: NightPayer;
  inDiscountWindow: boolean;
};

function sameDay(a: Date, b: Date): boolean {
  return a.getTime() === b.getTime();
}

/**
 * Expands a [stayStart, stayEnd) date range into one entry per night, tagging
 * each as company-paid or self-paid based on the select-eligible checkbox,
 * and flagging nights that fall outside the $105 discount window.
 */
export function nightsInRange(
  stayStart: Date,
  stayEnd: Date,
  selectEligible: boolean,
): NightBreakdown[] {
  const paidNights = companyPaidNights(selectEligible);
  const nights: NightBreakdown[] = [];
  const cursor = new Date(stayStart);
  while (cursor < stayEnd) {
    const date = new Date(cursor);
    const payer: NightPayer = paidNights.some((n) => sameDay(n, date)) ? "company" : "self";
    nights.push({ date, payer, inDiscountWindow: isWithinDiscountWindow(date) });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}

/** Extra self-paid nights outside the standard block, e.g. ["2026-01-13"]. */
export function extraNightsBreakdown(isoDates: string[]): NightBreakdown[] {
  return isoDates
    .map((iso) => new Date(`${iso}T00:00:00.000Z`))
    .sort((a, b) => a.getTime() - b.getTime())
    .map((date) => ({ date, payer: "self" as const, inDiscountWindow: isWithinDiscountWindow(date) }));
}
