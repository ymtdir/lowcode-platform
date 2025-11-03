-- DropForeignKey
ALTER TABLE "public"."Group" DROP CONSTRAINT "Group_parentId_fkey";

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
