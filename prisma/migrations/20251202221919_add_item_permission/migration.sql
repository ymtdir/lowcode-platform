-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('NONE', 'READ', 'WRITE', 'ADMIN');

-- CreateTable
CREATE TABLE "ItemPermission" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT,
    "groupId" TEXT,
    "level" "Permission" NOT NULL DEFAULT 'READ',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemPermission_itemId_idx" ON "ItemPermission"("itemId");

-- CreateIndex
CREATE INDEX "ItemPermission_userId_idx" ON "ItemPermission"("userId");

-- CreateIndex
CREATE INDEX "ItemPermission_groupId_idx" ON "ItemPermission"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPermission_itemId_userId_key" ON "ItemPermission"("itemId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPermission_itemId_groupId_key" ON "ItemPermission"("itemId", "groupId");

-- AddForeignKey
ALTER TABLE "ItemPermission" ADD CONSTRAINT "ItemPermission_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPermission" ADD CONSTRAINT "ItemPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPermission" ADD CONSTRAINT "ItemPermission_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
