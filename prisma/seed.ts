import { PrismaClient } from "@prisma/client";
import { apartmentTypes, blockedDateRanges, ratePlans, seededBookings, units } from "@/lib/data/camob";

const prisma = new PrismaClient();
const shouldSeedDemoData = process.env.SEED_DEMO_DATA === "true";

function toPrismaBookingStatus(status: string) {
  return status.toUpperCase() as never;
}

function toPrismaPaymentMethod(method?: string) {
  return method?.toUpperCase() as never;
}

function toPrismaPaymentStatus(status?: string) {
  return status?.toUpperCase() as never;
}

async function main() {
  for (const apartment of apartmentTypes) {
    await prisma.apartmentType.upsert({
      where: { id: apartment.id },
      update: {
        slug: apartment.slug,
        name: apartment.name,
        shortName: apartment.shortName,
        description: apartment.description,
        ratePerNight: apartment.ratePerNight,
        maxGuests: apartment.maxGuests,
        bedrooms: apartment.bedrooms,
        bathrooms: apartment.bathrooms,
        unitsCount: apartment.units,
        heroImage: apartment.heroImage,
        amenities: apartment.amenities
      },
      create: {
        id: apartment.id,
        slug: apartment.slug,
        name: apartment.name,
        shortName: apartment.shortName,
        description: apartment.description,
        ratePerNight: apartment.ratePerNight,
        maxGuests: apartment.maxGuests,
        bedrooms: apartment.bedrooms,
        bathrooms: apartment.bathrooms,
        unitsCount: apartment.units,
        heroImage: apartment.heroImage,
        amenities: apartment.amenities
      }
    });
  }

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { id: unit.id },
      update: unit,
      create: unit
    });
  }

  for (const rate of ratePlans) {
    await prisma.ratePlan.upsert({
      where: { id: rate.id },
      update: {
        apartmentTypeId: rate.apartmentTypeId,
        nightlyRate: rate.nightlyRate,
        serviceCharge: rate.serviceCharge,
        currency: rate.currency,
        startsAt: null,
        endsAt: null
      },
      create: {
        id: rate.id,
        apartmentTypeId: rate.apartmentTypeId,
        nightlyRate: rate.nightlyRate,
        serviceCharge: rate.serviceCharge,
        currency: rate.currency
      }
    });
  }

  for (const block of blockedDateRanges) {
    await prisma.blockedDateRange.upsert({
      where: { id: block.id },
      update: {
        apartmentTypeId: block.apartmentTypeId,
        startDate: new Date(block.startDate),
        endDate: new Date(block.endDate),
        reason: block.reason
      },
      create: {
        id: block.id,
        apartmentTypeId: block.apartmentTypeId,
        startDate: new Date(block.startDate),
        endDate: new Date(block.endDate),
        reason: block.reason
      }
    });
  }

  if (!shouldSeedDemoData) {
    console.info("Skipping demo bookings because SEED_DEMO_DATA is not set to true.");
    return;
  }

  for (const booking of seededBookings) {
    await prisma.booking.upsert({
      where: { id: booking.id },
      update: {
        apartmentTypeId: booking.apartmentTypeId,
        unitId: booking.unitId,
        guestFullName: booking.guest.fullName,
        guestEmail: booking.guest.email,
        guestPhone: booking.guest.phone,
        guestCount: booking.guest.guests,
        specialRequests: booking.guest.specialRequests,
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        status: toPrismaBookingStatus(booking.status),
        subtotal: booking.subtotal,
        serviceCharge: booking.serviceCharge,
        total: booking.total,
        createdAt: new Date(booking.createdAt),
        expiresAt: booking.expiresAt ? new Date(booking.expiresAt) : null
      },
      create: {
        id: booking.id,
        apartmentTypeId: booking.apartmentTypeId,
        unitId: booking.unitId,
        guestFullName: booking.guest.fullName,
        guestEmail: booking.guest.email,
        guestPhone: booking.guest.phone,
        guestCount: booking.guest.guests,
        specialRequests: booking.guest.specialRequests,
        checkIn: new Date(booking.checkIn),
        checkOut: new Date(booking.checkOut),
        status: toPrismaBookingStatus(booking.status),
        subtotal: booking.subtotal,
        serviceCharge: booking.serviceCharge,
        total: booking.total,
        createdAt: new Date(booking.createdAt),
        expiresAt: booking.expiresAt ? new Date(booking.expiresAt) : null
      }
    });

    if (booking.paymentReference && booking.paymentMethod && booking.paymentStatus) {
      await prisma.payment.upsert({
        where: { reference: booking.paymentReference },
        update: {
          bookingId: booking.id,
          method: toPrismaPaymentMethod(booking.paymentMethod),
          status: toPrismaPaymentStatus(booking.paymentStatus),
          amount: booking.total
        },
        create: {
          bookingId: booking.id,
          method: toPrismaPaymentMethod(booking.paymentMethod),
          status: toPrismaPaymentStatus(booking.paymentStatus),
          reference: booking.paymentReference,
          amount: booking.total
        }
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
