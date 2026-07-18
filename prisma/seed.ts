import "dotenv/config";
import bcrypt from "bcryptjs";
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

/** Real Tashkent gaming clubs aggregated by the gPoint platform. */
const CLUBS = [
  {
    name: "Gonzo Gaming",
    slug: "gonzo-gaming",
    address: "ул. Шахрисабз, 85",
    description: "Премиальный игровой клуб в центре Ташкента. RTX 4070 Ti, 240Hz.",
    rating: 4.8,
    sortOrder: 1,
    seats: { standard: 8, premium: 4, vip: 2 },
  },
  {
    name: "BeZone",
    slug: "bezone",
    address: "Мирзо-Улугбекский район",
    description: "Сеть киберспортивных клубов. Турнирная зона и PlayStation.",
    rating: 4.6,
    sortOrder: 2,
    seats: { standard: 10, premium: 4, vip: 2 },
  },
  {
    name: "Colizeum",
    slug: "colizeum",
    address: "Чиланзарский район",
    description: "Компьютерный клуб мирового уровня. Буткемп и VIP-румы.",
    rating: 4.7,
    sortOrder: 3,
    seats: { standard: 8, premium: 6, vip: 3 },
  },
];

async function main() {
  console.log("Seeding...");

  await prisma.bookingSnack.deleteMany();
  await prisma.balanceTransaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.place.deleteMany();
  await prisma.category.deleteMany();
  await prisma.room.deleteMany();
  await prisma.snack.deleteMany();
  await prisma.club.deleteMany();

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

  const tiers = [
    { cat: standard, label: "Standard", price: 15000, type: "SEAT" as const },
    { cat: premium, label: "Premium", price: 25000, type: "SEAT" as const },
    { cat: vip, label: "VIP", price: 50000, type: "ROOM_UNIT" as const },
  ];

  const placesByClub: Record<string, { id: string; price: number }[]> = {};

  for (const c of CLUBS) {
    const club = await prisma.club.create({
      data: {
        name: c.name,
        slug: c.slug,
        city: "Tashkent",
        address: c.address,
        description: c.description,
        rating: c.rating,
        status: "ACTIVE",
        isMain: c.sortOrder === 1,
        sortOrder: c.sortOrder,
      },
    });

    const counts = [c.seats.standard, c.seats.premium, c.seats.vip];
    const created: { id: string; price: number }[] = [];

    for (let ti = 0; ti < tiers.length; ti++) {
      const tier = tiers[ti];
      for (let i = 1; i <= counts[ti]; i++) {
        const place = await prisma.place.create({
          data: {
            name: `${tier.label} ${i}`,
            type: tier.type,
            pricePerHour: tier.price,
            categoryId: tier.cat.id,
            clubId: club.id,
          },
        });
        created.push({ id: place.id, price: tier.price });
      }
    }
    placesByClub[club.id] = created;
    console.log(`  ${c.name}: ${created.length} places`);
  }

  await prisma.snack.createMany({
    data: [
      { name: "Coca-Cola 0.5", price: 12000, sortOrder: 1 },
      { name: "Fanta 0.5", price: 12000, sortOrder: 2 },
      { name: "Вода 0.5", price: 6000, sortOrder: 3 },
      { name: "Red Bull", price: 20000, sortOrder: 4 },
      { name: "Snickers", price: 10000, sortOrder: 5 },
      { name: "Lay's чипсы", price: 15000, sortOrder: 6 },
      { name: "Печенье Oreo", price: 13000, sortOrder: 7 },
      { name: "Кофе", price: 15000, sortOrder: 8 },
    ],
  });

  // demo client logins (so the owner can browse the site as a user)
  const demoHash = await bcrypt.hash("demo1234", 10);
  const clients = [];
  for (const c of [
    { name: "Демо Юзер", phone: "+998901112233", passwordHash: demoHash },
    { name: "Шохрух (тест)", phone: "+998901234567", passwordHash: demoHash },
    { name: "Aziz Karimov", phone: "+998907654321" },
    { name: "Timur Rakhimov", phone: "+998933217654" },
    { name: "Jasur Yusupov", phone: "+998971112233" },
  ]) {
    clients.push(await prisma.client.upsert({
      where: { phone: c.phone },
      update: { name: c.name, ...(c.passwordHash ? { passwordHash: c.passwordHash } : {}) },
      create: c,
    }));
  }

  // a few bookings spread across clubs so the calendar isn't empty
  const specs = [
    { club: 0, place: 0, client: 0, day: 0, hour: 14, hours: 2 },
    { club: 0, place: 3, client: 2, day: 0, hour: 18, hours: 3 },
    { club: 0, place: 9, client: 3, day: 1, hour: 16, hours: 2 },
    { club: 1, place: 1, client: 1, day: 0, hour: 12, hours: 2 },
    { club: 1, place: 11, client: 4, day: 1, hour: 19, hours: 3 },
    { club: 2, place: 2, client: 2, day: 0, hour: 20, hours: 2 },
    { club: 2, place: 8, client: 0, day: 2, hour: 15, hours: 4 },
  ];

  const clubIds = Object.keys(placesByClub);
  let made = 0;
  for (const s of specs) {
    const clubId = clubIds[s.club];
    const place = placesByClub[clubId]?.[s.place];
    if (!place) continue;
    await prisma.booking.create({
      data: {
        placeId: place.id,
        clientId: clients[s.client].id,
        startsAt: at(s.day, s.hour),
        endsAt: at(s.day, s.hour + s.hours),
        pricePerHourSnapshot: place.price,
        totalPrice: place.price * s.hours,
        status: "ACTIVE",
        source: "ADMIN",
      },
    });
    made++;
  }

  console.log(
    `Done: ${CLUBS.length} clubs, ${clients.length} clients, ${made} bookings`
  );
  console.log("Demo login: +998901112233 / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
