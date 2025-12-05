-- 既存のADMIN権限をWRITEに変換
UPDATE "ItemPermission" SET "level" = 'WRITE' WHERE "level" = 'ADMIN';

-- Permission enumからADMINを削除
-- PostgreSQLではenum値の削除は直接できないため、enumを再作成
-- 1. 一時的な新しいenumを作成
CREATE TYPE "Permission_new" AS ENUM ('NONE', 'READ', 'WRITE');

-- 2. 既存のカラムを新しいenumに変換
ALTER TABLE "ItemPermission" ALTER COLUMN "level" TYPE "Permission_new" USING ("level"::text::"Permission_new");

-- 3. 古いenumを削除
DROP TYPE "Permission";

-- 4. 新しいenumを元の名前にリネーム
ALTER TYPE "Permission_new" RENAME TO "Permission";
