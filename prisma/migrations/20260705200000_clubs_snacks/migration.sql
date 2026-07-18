-- CreateEnum
CREATE TYPE "ClubStatus" AS ENUM ('ACTIVE', 'COMING_SOON');

-- CreateTable
CREATE TABLE "clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Tashkent',
    "address" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "rating" DECIMAL(2,1),
    "status" "ClubStatus" NOT NULL DEFAULT 'COMING_SOON',
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snacks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "snacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking_snacks" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "snackId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceSnapshot" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "booking_snacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clubs_slug_key" ON "clubs"("slug");

-- CreateIndex
CREATE INDEX "booking_snacks_bookingId_idx" ON "booking_snacks"("bookingId");

-- AddForeignKey
ALTER TABLE "booking_snacks" ADD CONSTRAINT "booking_snacks_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_snacks" ADD CONSTRAINT "booking_snacks_snackId_fkey" FOREIGN KEY ("snackId") REFERENCES "snacks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

