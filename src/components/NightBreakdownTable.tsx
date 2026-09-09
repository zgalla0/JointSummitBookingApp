"use client";

import { computeNightRows } from "@/lib/night-calc-client";
import { formatShortDate } from "@/lib/format";

export default function NightBreakdownTable(props: {
  stayStart: string;
  stayEnd: string;
  selectEligible: boolean;
  companyPaidAlways: string[];
  companyPaidSelect: string[];
  discountStart: string;
  discountEnd: string;
  extraNights: string[];
}) {
  const rows = computeNightRows(props);

  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-3 py-2">Night</th>
            <th className="px-3 py-2">Paid by</th>
            <th className="px-3 py-2">Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.iso} className="border-t">
              <td className="px-3 py-2">
                {formatShortDate(row.iso)}
                {row.source === "extra" && (
                  <span className="ml-2 text-xs text-gray-500">(extra night)</span>
                )}
              </td>
              <td className="px-3 py-2">{row.payer === "company" ? "Company" : "You"}</td>
              <td className="px-3 py-2">
                {row.inDiscountWindow ? (
                  "Group rate applies"
                ) : (
                  <span className="text-amber-700">Not guaranteed, confirm with hotel</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
