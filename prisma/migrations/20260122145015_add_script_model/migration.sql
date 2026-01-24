/*
  Warnings:

  - You are about to drop the column `customScript` on the `Setting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Setting" DROP COLUMN "customScript";

-- CreateTable
CREATE TABLE "Script" (
    "id" TEXT NOT NULL,
    "itemId" TEXT,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Script_itemId_idx" ON "Script"("itemId");

-- CreateIndex
CREATE INDEX "Script_itemId_order_idx" ON "Script"("itemId", "order");

-- AddForeignKey
ALTER TABLE "Script" ADD CONSTRAINT "Script_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
