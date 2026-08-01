/*
  Warnings:

  - A unique constraint covering the columns `[user_id,category_id,month,year,currency]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.
  - Made the column `currency` on table `Budget` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Budget_user_id_category_id_month_year_key";

-- AlterTable
ALTER TABLE "Budget" ALTER COLUMN "currency" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Budget_user_id_category_id_month_year_currency_key" ON "Budget"("user_id", "category_id", "month", "year", "currency");
