-- AlterTable
ALTER TABLE "places" ADD COLUMN     "clubId" TEXT;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "paymentMethod" TEXT;

-- CreateIndex
CREATE INDEX "places_clubId_idx" ON "places"("clubId");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

