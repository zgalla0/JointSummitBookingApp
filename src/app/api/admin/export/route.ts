import { prisma } from "@/lib/prisma";
import { toISODate } from "@/lib/format";
import { toCsv } from "@/lib/csv";
import { parseJsonArray, bookingNights } from "@/lib/admin-stats";

export async function GET() {
  const bookings = await prisma.booking.findMany({
    include: { guests: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = bookings.map((b) => {
    const companyPaid = new Set(parseJsonArray(b.companyPaidNights));
    const nights = bookingNights(b);
    return {
      id: b.id,
      status: b.status,
      isAttending: b.isAttending,
      firstName: b.firstName,
      lastName: b.lastName,
      location: b.location,
      reservationFirstName: b.reservationFirstName,
      reservationLastName: b.reservationLastName,
      hotelEmail: b.hotelEmail,
      detailsEmail: b.detailsEmail,
      attendingHappyHour: b.attendingHappyHour,
      attendingAllHands: b.attendingAllHands,
      attendingDinner: b.attendingDinner,
      stayStart: toISODate(b.stayStart),
      stayEnd: toISODate(b.stayEnd),
      nightsTotal: nights.length,
      nightsCompanyPaid: nights.filter((n) => companyPaid.has(n)).length,
      nightsSelfPaid: nights.filter((n) => !companyPaid.has(n)).length,
      nightsCompanyPaidDates: nights.filter((n) => companyPaid.has(n)).join("; "),
      nightsSelfPaidDates: nights.filter((n) => !companyPaid.has(n)).join("; "),
      extraNightsRoomType: b.extraNightsRoomType ?? "",
      ptoDates: parseJsonArray(b.ptoDates).join("; "),
      additionalGuests: b.guests
        .map((g) => {
          const events = [g.attendingHappyHour && "HH", g.attendingDinner && "Dinner"]
            .filter(Boolean)
            .join("+");
          const diet = parseJsonArray(g.dietaryOptions).join("/");
          return `${g.firstName} ${g.lastName} (${g.type}${events ? `, ${events}` : ""}${diet ? `, diet: ${diet}` : ""})`;
        })
        .join("; "),
      dietaryOptions: parseJsonArray(b.dietaryOptions).join("; "),
      dietaryOther: b.dietaryOther ?? "",
      flightArrivalAirline: b.flightArrivalAirline ?? "",
      flightArrivalNumber: b.flightArrivalNumber ?? "",
      flightArrival: b.flightArrival ? b.flightArrival.toISOString() : "",
      flightDepartureAirline: b.flightDepartureAirline ?? "",
      flightDepartureNumber: b.flightDepartureNumber ?? "",
      flightDeparture: b.flightDeparture ? b.flightDeparture.toISOString() : "",
      flightNotes: b.flightNotes ?? "",
      additionalNotes: b.additionalNotes ?? "",
      flaggedForReview: b.flaggedForReview,
      flagReason: b.flagReason ?? "",
      cancelledAt: b.cancelledAt ? b.cancelledAt.toISOString() : "",
      cancelledByAdmin: b.cancelledByAdmin,
      magicLinkToken: b.magicLinkToken,
      createdAt: b.createdAt.toISOString(),
    };
  });

  const csv = toCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-export-${toISODate(new Date())}.csv"`,
    },
  });
}
