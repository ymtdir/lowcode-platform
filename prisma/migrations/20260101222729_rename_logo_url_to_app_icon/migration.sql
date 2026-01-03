-- Rename logoUrl column to appIcon
ALTER TABLE "Setting" RENAME COLUMN "logoUrl" TO "appIcon";

-- Rename faviconUrl column to appFavicon
ALTER TABLE "Setting" RENAME COLUMN "faviconUrl" TO "appFavicon";
