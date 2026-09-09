import { config, extendedRange, defaultCompanyPaidNights } from "@/lib/config";
import { toISODate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import BookingForm from "@/components/BookingForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const staticContent = await prisma.staticContent.findMany({
    orderBy: { key: "asc" },
  });

  const formConfig = {
    bookableStart: toISODate(config.bookableStart),
    bookableEnd: toISODate(config.bookableEnd),
    extendedStart: toISODate(extendedRange.start),
    extendedEnd: toISODate(extendedRange.end),
    discountStart: toISODate(config.discountStart),
    discountEnd: toISODate(config.discountEnd),
    discountRateUsd: config.discountRateUsd,
    happyHourDate: toISODate(config.happyHourDate),
    allHandsDate: toISODate(config.allHandsDate),
    dinnerDate: toISODate(config.dinnerDate),
    defaultCompanyPaidNights: defaultCompanyPaidNights().map(toISODate),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <BookingForm
        formConfig={formConfig}
        staticContent={staticContent.map((s) => ({ key: s.key, title: s.title, body: s.body }))}
      />
    </main>
  );
}
