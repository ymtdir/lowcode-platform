/*
  Warnings:

  - You are about to drop the column `customBodyScript` on the `Setting` table. All the data in the column will be lost.
  - You are about to drop the column `customHeadScript` on the `Setting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Setting" DROP COLUMN "customBodyScript",
DROP COLUMN "customHeadScript",
ADD COLUMN     "customScript" TEXT;
