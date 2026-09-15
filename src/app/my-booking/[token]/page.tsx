import { notFound } from "next/navigation";
import { config, defaultCompanyPaidNights, isLockedIn } from "@/lib/config";
import { toISODate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getBookingByToken } from "@/lib/get-booking-by-token";
import { bookingToFormInput } from "@/lib/booking-to-form";
import EditBookingForm from "@/components/EditBookingForm";

export const dynamic = "force-dynamic";

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  const staticContent = await prisma.staticContent.findMany({
    orderBy: { key: "asc" },
  });

  const formConfig = {
    bookableStart: toISODate(config.bookableStart),
    bookableEnd: toISODate(config.bookableEnd),
    blockStart: toISODate(config.blockStart),
    blockEnd: toISODate(config.blockEnd),
    happyHourDate: toISODate(config.happyHourDate),
    allHandsDate: toISODate(config.allHandsDate),
    dinnerDate: toISODate(config.dinnerDate),
    defaultCompanyPaidNights: defaultCompanyPaidNights().map(toISODate),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <EditBookingForm
        token={token}
        defaultValues={bookingToFormInput(booking)}
        formConfig={formConfig}
        staticContent={staticContent.map((s) => ({ key: s.key, title: s.title, body: s.body }))}
        isCancelled={booking.status === "CANCELLED"}
        lockedIn={isLockedIn()}
      />
    </main>
  );
}
