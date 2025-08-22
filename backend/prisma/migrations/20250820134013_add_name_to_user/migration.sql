-- Pridaj stĺpec s default hodnotou
ALTER TABLE "public"."User" ADD COLUMN "name" TEXT DEFAULT 'unknown';

-- Vyplň existujúce riadky
UPDATE "public"."User" SET "name" = 'unknown' WHERE "name" IS NULL;

-- Nastav stĺpec ako NOT NULL a odstráň default
ALTER TABLE "public"."User" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "public"."User" ALTER COLUMN "name" DROP DEFAULT;