/*
  Warnings:

  - You are about to drop the column `keyHash` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `keyPrefix` on the `ApiKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."ApiKey_keyHash_idx";

-- DropIndex
DROP INDEX "public"."ApiKey_keyHash_key";

-- DropIndex
DROP INDEX "public"."ApiKey_userId_idx";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "keyHash",
DROP COLUMN "keyPrefix",
ADD COLUMN     "key" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_userId_key" ON "ApiKey"("userId");
