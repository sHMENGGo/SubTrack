/*
  Warnings:

  - The values [ON_BILLING_DATE] on the enum `AlertTrigger` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[user_id,category_id,month,year]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AlertTrigger_new" AS ENUM ('THREE_DAYS_BEFORE', 'ONE_DAY_BEFORE', 'DUE_TODAY');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "AlertTrigger_new" USING ("type"::text::"AlertTrigger_new");
ALTER TYPE "AlertTrigger" RENAME TO "AlertTrigger_old";
ALTER TYPE "AlertTrigger_new" RENAME TO "AlertTrigger";
DROP TYPE "public"."AlertTrigger_old";
COMMIT;

-- DropIndex
DROP INDEX "Budget_category_id_key";

-- DropIndex
DROP INDEX "Budget_user_id_key";

-- DropIndex
DROP INDEX "Category_name_key";

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "updated_at" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Budget_user_id_category_id_month_year_key" ON "Budget"("user_id", "category_id", "month", "year");
