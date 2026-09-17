import { config, defaultCompanyPaidNights, optionalCompanyPaidNights } from "@/lib/config";
import { toISODate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { INTERNAL_STATIC_CONTENT_KEYS } from "@/lib/internal-static-content";
import BookingForm from "@/components/BookingForm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const staticContent = await prisma.staticContent.findMany({
    where: { key: { notIn: INTERNAL_STATIC_CONTENT_KEYS } },
    orderBy: { key: "asc" },
  });

  const formConfig = {
    bookableStart: toISODate(config.bookableStart),
    bookableEnd: toISODate(config.bookableEnd),
    blockStart: toISODate(config.blockStart),
    blockEnd: toISODate(config.blockEnd),
    discountStart: toISODate(config.discountStart),
    discountEnd: toISODate(config.discountEnd),
    discountRateUsd: config.discountRateUsd,
    happyHourDate: toISODate(config.happyHourDate),
    allHandsDate: toISODate(config.allHandsDate),
    dinnerDate: toISODate(config.dinnerDate),
    defaultCompanyPaidNights: defaultCompanyPaidNights().map(toISODate),
    optionalCompanyPaidNights: optionalCompanyPaidNights().map(toISODate),
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <BookingForm
        formConfig={formConfig}
        staticContent={staticContent.map((s) => ({ key: s.key, title: s.title, body: s.body }))}
      />
    </main>
  );
}
