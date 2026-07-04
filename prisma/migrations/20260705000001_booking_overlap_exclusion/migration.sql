-- Prevent two ACTIVE bookings of the same place from overlapping in time.
-- Enforced at the DB level so it holds even under concurrent requests.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT no_overlapping_active_bookings
  EXCLUDE USING gist (
    "placeId" WITH =,
    tsrange("startsAt", "endsAt") WITH &&
  )
  WHERE (status = 'ACTIVE');
