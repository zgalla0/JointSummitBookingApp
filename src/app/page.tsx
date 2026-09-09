import { config, companyPaidNights } from "@/lib/config";
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
    discountStart: toISODate(config.discountStart),
    discountEnd: toISODate(config.discountEnd),
    discountRateUsd: config.discountRateUsd,
    happyHourDate: toISODate(config.happyHourDate),
    allHandsDate: toISODate(config.allHandsDate),
    dinnerDate: toISODate(config.dinnerDate),
    companyPaidAlways: companyPaidNights(false).map(toISODate),
    companyPaidSelect: companyPaidNights(true)
      .map(toISODate)
      .filter((d) => !companyPaidNights(false).map(toISODate).includes(d)),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <BookingForm
        formConfig={formConfig}
        staticContent={staticContent.map((s) => ({ key: s.key, title: s.title, body: s.body }))}
      />
    </main>
  );
}
