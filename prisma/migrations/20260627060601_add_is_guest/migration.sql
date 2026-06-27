-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "passwordHash" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER NOT NULL DEFAULT 1200,
    "rd" REAL NOT NULL DEFAULT 350.0,
    "volatility" REAL NOT NULL DEFAULT 0.06,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "draws", "email", "emailVerified", "gamesPlayed", "id", "image", "losses", "name", "passwordHash", "rating", "rd", "updatedAt", "volatility", "wins") SELECT "createdAt", "draws", "email", "emailVerified", "gamesPlayed", "id", "image", "losses", "name", "passwordHash", "rating", "rd", "updatedAt", "volatility", "wins" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_rating_idx" ON "User"("rating");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
