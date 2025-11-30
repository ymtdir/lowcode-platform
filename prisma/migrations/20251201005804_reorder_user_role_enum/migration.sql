-- PostgreSQLのEnumの順番を変更するため、Enumを再作成
-- 1. 一時的なEnumを作成（正しい順番で）
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'DEVELOPER', 'MEMBER');

-- 2. デフォルト値を削除
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- 3. カラムの型を一時的なEnumに変更
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");

-- 4. デフォルト値を再設定
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER'::"UserRole_new";

-- 5. 古いEnumを削除
DROP TYPE "UserRole";

-- 6. 一時的なEnumを元の名前にリネーム
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

