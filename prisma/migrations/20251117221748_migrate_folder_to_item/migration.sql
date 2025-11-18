-- RenameTable: Folder -> Item
ALTER TABLE "Folder" RENAME TO "Item";

-- AddColumn: type (ItemType enum)
CREATE TYPE "ItemType" AS ENUM ('FOLDER', 'TABLE');
ALTER TABLE "Item" ADD COLUMN "type" "ItemType" NOT NULL DEFAULT 'FOLDER';

-- AddColumn: meta (JSON)
ALTER TABLE "Item" ADD COLUMN "meta" JSONB;

-- RenameForeignKey: Folder_parentId_fkey -> Item_parentId_fkey
ALTER TABLE "Item" RENAME CONSTRAINT "Folder_parentId_fkey" TO "Item_parentId_fkey";

-- RenameForeignKey: Folder_createdById_fkey -> Item_createdById_fkey
ALTER TABLE "Item" RENAME CONSTRAINT "Folder_createdById_fkey" TO "Item_createdById_fkey";

-- RenameIndex: Folder_parentId_idx -> Item_parentId_idx
ALTER INDEX "Folder_parentId_idx" RENAME TO "Item_parentId_idx";

-- RenameIndex: Folder_createdById_idx -> Item_createdById_idx
ALTER INDEX "Folder_createdById_idx" RENAME TO "Item_createdById_idx";

-- RenameIndex: Folder_parentId_order_idx -> Item_parentId_order_idx
ALTER INDEX "Folder_parentId_order_idx" RENAME TO "Item_parentId_order_idx";

-- CreateIndex: Item_type_idx
CREATE INDEX "Item_type_idx" ON "Item"("type");

-- UpdateForeignKey: Item_createdById_fkey (onDelete: RESTRICT -> no change, but ensure it's correct)
-- Note: The foreign key constraint should already be correct, but we verify it
ALTER TABLE "Item" DROP CONSTRAINT IF EXISTS "Item_createdById_fkey";
ALTER TABLE "Item" ADD CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

