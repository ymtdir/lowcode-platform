-- Rename appTitle column to appName
ALTER TABLE "Setting" RENAME COLUMN "appTitle" TO "appName";

-- Rename showTitleInIcon column to hideAppName
ALTER TABLE "Setting" RENAME COLUMN "showTitleInIcon" TO "hideAppName";
