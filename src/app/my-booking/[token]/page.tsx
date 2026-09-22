import { notFound } from "next/navigation";
import { config, defaultCompanyPaidNights, optionalCompanyPaidNights, isLockedIn } from "@/lib/config";
import { toISODate } from "@/lib/format";
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

  const formConfig = {
    bookableStart: toISODate(config.bookableStart),
    bookableEnd: toISODate(config.bookableEnd),
    blockStart: toISODate(config.blockStart),
    blockEnd: toISODate(config.blockEnd),
    discountStart: toISODate(config.discountStart),
    discountEnd: toISODate(config.discountEnd),
    happyHourDate: toISODate(config.happyHourDate),
    allHandsDate: toISODate(config.allHandsDate),
    dinnerDate: toISODate(config.dinnerDate),
    defaultCompanyPaidNights: defaultCompanyPaidNights().map(toISODate),
    optionalCompanyPaidNights: optionalCompanyPaidNights().map(toISODate),
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <EditBookingForm
        token={token}
        defaultValues={bookingToFormInput(booking)}
        formConfig={formConfig}
        isCancelled={booking.status === "CANCELLED"}
        lockedIn={isLockedIn()}
      />
    </main>
  );
}
