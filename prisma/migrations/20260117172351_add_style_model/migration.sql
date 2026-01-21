-- CreateTable
CREATE TABLE "Style" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Style_itemId_idx" ON "Style"("itemId");

-- CreateIndex
CREATE INDEX "Style_itemId_order_idx" ON "Style"("itemId", "order");

-- AddForeignKey
ALTER TABLE "Style" ADD CONSTRAINT "Style_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
