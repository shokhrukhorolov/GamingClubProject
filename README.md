# Gaming Club — Booking System

MVP of an online seat booking system for a gaming club. Admin panel: booking calendar, booking management, places, categories, rooms, and clients.

## Stack

- **Next.js 16** (App Router, TypeScript) + Tailwind CSS
- **PostgreSQL** (Neon) + Prisma 7
- Deployment: **Vercel**

## Local setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and the other variables
npx prisma migrate deploy
npm run db:seed        # demo data
npm run dev
```

Admin panel: `http://localhost:3000/admin` (credentials from `.env`).

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `ADMIN_USERNAME` | Admin login |
| `ADMIN_PASSWORD` | Admin password |
| `SESSION_SECRET` | Random 32+ char string used to sign the session cookie |

## Double-booking protection

Overlapping active bookings for the same place are impossible at the database level
(exclusion constraint `no_overlapping_active_bookings` using the `btree_gist` extension),
backed by a friendly application-level availability check.
