import { PrismaClient } from "@prisma/client";
import { apartmentTypes, blockedDateRanges, ratePlans, seededBookings, units } from "@/lib/data/camob";

const prisma = new PrismaClient();

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
    await prisma.ratePlan.create({
      data: {
        apartmentTypeId: rate.apartmentTypeId,
        nightlyRate: rate.nightlyRate,
        serviceCharge: rate.serviceCharge,
        currency: rate.currency
      }
    });
  }

  for (const block of blockedDateRanges) {
    await prisma.blockedDateRange.create({
      data: {
        apartmentTypeId: block.apartmentTypeId,
        startDate: new Date(block.startDate),
        endDate: new Date(block.endDate),
        reason: block.reason
      }
    });
  }

  for (const booking of seededBookings) {
    await prisma.booking.create({
      data: {
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
        status: booking.status.toUpperCase() as never,
        subtotal: booking.subtotal,
        serviceCharge: booking.serviceCharge,
        total: booking.total,
        createdAt: new Date(booking.createdAt),
        expiresAt: booking.expiresAt ? new Date(booking.expiresAt) : null,
        payments: booking.paymentReference
          ? {
              create: {
                method: booking.paymentMethod?.toUpperCase() as never,
                status: booking.paymentStatus?.toUpperCase() as never,
                reference: booking.paymentReference,
                amount: booking.total
              }
            }
          : undefined
      }
    });
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
