import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { fromZonedTime } from "date-fns-tz";

const TIMEZONE = "Asia/Tashkent";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function at(daysFromToday: number, hour: number, minute = 0): Date {
  const now = new Date();
  const local = new Date(now.getTime() + daysFromToday * 86_400_000);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const d = String(local.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return fromZonedTime(`${y}-${m}-${d}T${hh}:${mm}:00`, TIMEZONE);
}

async function main() {
  console.log("Seeding...");

  await prisma.booking.deleteMany();
  await prisma.place.deleteMany();
  await prisma.client.deleteMany();
  await prisma.category.deleteMany();
  await prisma.room.deleteMany();

  const [standard, premium, vip] = await Promise.all([
    prisma.category.create({
      data: { name: "Standard", defaultPricePerHour: 15000, sortOrder: 1 },
    }),
    prisma.category.create({
      data: { name: "Premium", defaultPricePerHour: 25000, sortOrder: 2 },
    }),
    prisma.category.create({
      data: { name: "VIP", defaultPricePerHour: 50000, sortOrder: 3 },
    }),
  ]);

  const mainHall = await prisma.room.create({
    data: { name: "Главный зал", description: "Общий зал со стандартными и премиум местами" },
  });
  const vipRoom = await prisma.room.create({
    data: { name: "VIP зона", description: "Отдельные VIP комнаты" },
  });

  const seatData = [
    ...Array.from({ length: 6 }, (_, i) => ({
      name: `Место ${i + 1}`,
      type: "SEAT" as const,
      pricePerHour: 15000,
      categoryId: standard.id,
      roomId: mainHall.id,
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      name: `Premium ${i + 1}`,
      type: "SEAT" as const,
      pricePerHour: 25000,
      categoryId: premium.id,
      roomId: mainHall.id,
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      name: `VIP Комната ${i + 1}`,
      type: "ROOM_UNIT" as const,
      pricePerHour: 50000,
      categoryId: vip.id,
      roomId: vipRoom.id,
    })),
  ];

  const places = [];
  for (const data of seatData) {
    places.push(await prisma.place.create({ data }));
  }

  const clients = [];
  for (const data of [
    { name: "Азиз Каримов", phone: "+998901234567" },
    { name: "Тимур Рахимов", phone: "+998907654321" },
    { name: "Джасур Юсупов", phone: "+998933217654" },
    { name: "Санжар Алимов", phone: "+998971112233" },
    { name: "Отабек Насыров", phone: "+998905556677" },
  ]) {
    clients.push(await prisma.client.create({ data }));
  }

  const bookingSpecs = [
    { place: 0, client: 0, day: 0, hour: 14, hours: 2 },
    { place: 1, client: 1, day: 0, hour: 15, hours: 3 },
    { place: 6, client: 2, day: 0, hour: 18, hours: 2 },
    { place: 8, client: 3, day: 0, hour: 19, hours: 4 },
    { place: 2, client: 4, day: 1, hour: 12, hours: 2 },
    { place: 8, client: 0, day: 1, hour: 16, hours: 3 },
    { place: 9, client: 1, day: 2, hour: 20, hours: 2 },
  ];

  for (const spec of bookingSpecs) {
    const place = places[spec.place];
    const startsAt = at(spec.day, spec.hour);
    const endsAt = at(spec.day, spec.hour + spec.hours);
    const pricePerHour = Number(place.pricePerHour);
    await prisma.booking.create({
      data: {
        placeId: place.id,
        clientId: clients[spec.client].id,
        startsAt,
        endsAt,
        pricePerHourSnapshot: pricePerHour,
        totalPrice: pricePerHour * spec.hours,
        status: "ACTIVE",
        source: "ADMIN",
      },
    });
  }

  // one cancelled booking for realistic data
  const cancelled = places[3];
  await prisma.booking.create({
    data: {
      placeId: cancelled.id,
      clientId: clients[2].id,
      startsAt: at(0, 10),
      endsAt: at(0, 12),
      pricePerHourSnapshot: Number(cancelled.pricePerHour),
      totalPrice: Number(cancelled.pricePerHour) * 2,
      status: "CANCELLED",
      source: "ADMIN",
      cancelledAt: new Date(),
      cancelReason: "Клиент не пришёл",
    },
  });

  console.log(
    `Done: ${places.length} мест, ${clients.length} клиентов, ${bookingSpecs.length + 1} броней`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
