// Client-safe (no process.env access) night-breakdown math. The server
// resolves the actual config/env values and passes plain ISO-date strings
// and arrays down as props; this file just does date arithmetic on them.

export type NightRow = {
  iso: string;
  payer: "company" | "self";
  inDiscountWindow: boolean;
  source: "stay" | "extra";
};

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeNightRows(opts: {
  stayStart: string;
  stayEnd: string;
  selectEligible: boolean;
  companyPaidAlways: string[];
  companyPaidSelect: string[];
  discountStart: string;
  discountEnd: string;
  extraNights: string[];
}): NightRow[] {
  const {
    stayStart,
    stayEnd,
    selectEligible,
    companyPaidAlways,
    companyPaidSelect,
    discountStart,
    discountEnd,
    extraNights,
  } = opts;

  const paidSet = new Set([...companyPaidAlways, ...(selectEligible ? companyPaidSelect : [])]);

  const rows: NightRow[] = [];
  if (stayStart && stayEnd && stayEnd > stayStart) {
    let cursor = stayStart;
    while (cursor < stayEnd) {
      rows.push({
        iso: cursor,
        payer: paidSet.has(cursor) ? "company" : "self",
        inDiscountWindow: cursor >= discountStart && cursor <= discountEnd,
        source: "stay",
      });
      cursor = addDaysIso(cursor, 1);
    }
  }

  for (const iso of [...extraNights].sort()) {
    rows.push({
      iso,
      payer: "self",
      inDiscountWindow: iso >= discountStart && iso <= discountEnd,
      source: "extra",
    });
  }

  return rows;
}
