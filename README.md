# Gaming Club Booking System

Online seat booking system for a gaming club (MVP). Clients book seats and rooms by date and time and pay from their account balance. The administrator manages the entire schedule through the admin panel.

**Current status:** admin panel and client-facing site are done. Online payments are the next phase (balance top-up is manual for now).

---

## How the client site works

- **Home page (`/`)**: club categories with prices; pick one and hit Book
- **Sign up (`/register`)**: full name + phone number + password (email optional). Phone is the sign-in ID
- **Book (`/book`)**: choose category, date, time, and hours; see every free place with the total price; confirm to pay from your balance
- **My account (`/account`)**: profile, balance with transaction history, and your bookings. Cancel an upcoming booking and the full amount returns to your balance instantly
- **Balance**: bookings are paid from the account balance. Top up at the club desk (staff adds it in the admin panel); online payment with Uzcard / Humo / Visa / Mastercard is coming later
- Booking rules: up to 30 days ahead, 1-12 hours, max 3 upcoming bookings per account

---

## How to use the admin panel

Open `/admin` and sign in (default MVP credentials: `admin` / `admin`. Change these before real use, see [Environment variables](#environment-variables)).

### Calendar

The main screen. Shows all bookings for one day: **columns are places** (seats and VIP rooms), **rows are hours** (00:00-24:00, Tashkent time).

- Switch days with the **← / →** buttons, the date picker, or **Today**
- **Click an empty cell** to create a booking. The place and time are pre-filled
- **Click a booking block** to see its details or cancel it

### Bookings

Full list of all bookings, newest first.

- **Filters**: by date, place, room, and status (Active / Cancelled)
- **+ New booking**: pick a client, place, date, start time, and duration. The total price is calculated automatically from the place's hourly rate
- **Cancel**: click Cancel on a row, optionally enter a reason
- A place cannot be double-booked: if the time overlaps an existing active booking, the system rejects it with "This time slot is already booked". This is enforced by the database itself, so it holds even if two people click at the same moment
- Cancelled bookings free up the slot immediately

### Places

Every bookable unit in the club: regular seats and whole VIP rooms.

- Each place has a **name**, **type** (Seat / Whole room), **category** (pricing tier), optional **room** (physical zone), **price per hour**, and **status**
- **Disable** a place to remove it from the calendar and stop new bookings (e.g. broken PC). This is the recommended way to take a place out of rotation
- **Delete** only works for places that have never been booked; otherwise disable instead

### Categories

Pricing tiers (Standard / Premium / VIP by default). Each has a default hourly price used as a starting point when creating new places. Categories with places in them cannot be deleted.

### Rooms

Physical zones of the club (e.g. Main Hall, VIP Zone) used to group places and filter bookings. Rooms with places in them cannot be deleted.

### Clients

All club clients with search by name or phone.

- **+ New client**: name + phone number (phone must be unique). You can also add a client on the fly from inside the new-booking form
- Click a client's name to see their profile and full **booking history**

---

## Technologies used

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript | The web app itself, server-rendered pages |
| Styling | Tailwind CSS 4 | All UI is hand-rolled components, no UI library |
| Database | PostgreSQL on Neon (serverless, free tier) | All data: places, bookings, clients |
| ORM | Prisma 7 (`@prisma/adapter-pg`) | Type-safe database access and migrations |
| Validation | Zod | Validates every form input on the server |
| Auth | jose (JWT) + bcryptjs, httpOnly signed cookies | Separate admin and client sessions, route protection via Next.js proxy |
| Dates | date-fns + date-fns-tz | All times stored in UTC, displayed in Asia/Tashkent |
| Hosting | Vercel | Every push to `main` deploys automatically |
| Integrity | Postgres `btree_gist` exclusion constraint | Makes double-booking physically impossible in the DB |

## Technologies planned (next phases)

| Phase | Technology / Feature |
|---|---|
| Payments (next) | Uzcard, Humo, Visa, Mastercard online balance top-up |
| Notifications (post-MVP) | SMS notifications (booking confirmation, reminders) |
| Later | Staff roles and permissions, loyalty program and promo codes, analytics and reports, mobile app |

## Local setup

```bash
npm install
cp .env.example .env   # fill in the variables (see below)
npx prisma migrate deploy
npm run db:seed        # demo data: 10 places, 5 clients, 8 bookings
npm run dev
```

Admin panel: `http://localhost:3000/admin`

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `ADMIN_USERNAME` | Admin login |
| `ADMIN_PASSWORD` | Admin password |
| `SESSION_SECRET` | Random 32+ char string used to sign the session cookie |

Set the same four variables in Vercel > Project > Settings > Environment Variables when deploying.

## Double-booking protection

Overlapping active bookings for the same place are impossible at the database level: a Postgres exclusion constraint (`no_overlapping_active_bookings`, `btree_gist` extension) rejects them even under concurrent requests. The app also pre-checks availability to show a friendly error before the constraint is ever hit.
