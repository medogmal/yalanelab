-- AlterTable
ALTER TABLE "User" ADD COLUMN "country" TEXT;

-- CreateTable
CREATE TABLE "UserAvatar" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "skinColor" TEXT NOT NULL DEFAULT '#F5C99A',
    "hairColor" TEXT NOT NULL DEFAULT '#2A1A05',
    "eyeColor" TEXT NOT NULL DEFAULT '#2672D9',
    "shirtColor" TEXT NOT NULL DEFAULT '#3B7FDB',
    "pantsColor" TEXT NOT NULL DEFAULT '#2E2E52',
    "shoeColor" TEXT NOT NULL DEFAULT '#1A1410',
    "mode" TEXT NOT NULL DEFAULT 'default',
    "hasHelmet" BOOLEAN NOT NULL DEFAULT false,
    "hasArmor" BOOLEAN NOT NULL DEFAULT false,
    "hasCape" BOOLEAN NOT NULL DEFAULT false,
    "helmetColor" TEXT NOT NULL DEFAULT '#666666',
    "armorColor" TEXT NOT NULL DEFAULT '#808099',
    "capeColor" TEXT NOT NULL DEFAULT '#B31A1A',
    "thumbnailUrl" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserAvatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "World" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "screenshotsJson" TEXT,
    "webglUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'social',
    "tags" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "playerCapacity" INTEGER NOT NULL DEFAULT 50,
    "configJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "World_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorldReview_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorldLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "worldId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorldLike_worldId_fkey" FOREIGN KEY ("worldId") REFERENCES "World" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorldLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoinTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "worldId" TEXT,
    "stripePaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CoinTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StripePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stripeId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "coinsGranted" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ParentalControl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "parentUserId" TEXT NOT NULL,
    "childUserId" TEXT NOT NULL,
    "maxDailyMinutes" INTEGER NOT NULL DEFAULT 120,
    "voiceChatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "privateMsgEnabled" BOOLEAN NOT NULL DEFAULT false,
    "storeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowedWorldIds" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParentalControl_parentUserId_fkey" FOREIGN KEY ("parentUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ParentalControl_childUserId_fkey" FOREIGN KEY ("childUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "ownerId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'platformer',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "engineData" TEXT NOT NULL DEFAULT '{}',
    "thumbnailUrl" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameProject_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameProjectLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameProjectLike_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "GameProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Profile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 1000,
    "gems" INTEGER NOT NULL DEFAULT 10,
    "bio" TEXT,
    "vip" BOOLEAN NOT NULL DEFAULT false,
    "vipExpires" DATETIME,
    "ludoRating" INTEGER NOT NULL DEFAULT 1200,
    "chessRating" INTEGER NOT NULL DEFAULT 1200,
    "balootRating" INTEGER NOT NULL DEFAULT 1200,
    "dominoRating" INTEGER NOT NULL DEFAULT 1200,
    "avatarSkin" TEXT NOT NULL DEFAULT 'default',
    "ludoSkin" TEXT NOT NULL DEFAULT 'skin_default',
    "chessSkin" TEXT NOT NULL DEFAULT 'skin_wood',
    "balootSkin" TEXT NOT NULL DEFAULT 'skin_classic',
    "dominoSkin" TEXT NOT NULL DEFAULT 'skin_ivory',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Profile" ("avatarSkin", "balootRating", "balootSkin", "bio", "chessRating", "chessSkin", "coins", "dominoRating", "dominoSkin", "gems", "id", "level", "ludoRating", "ludoSkin", "updatedAt", "userId", "vip", "vipExpires", "xp") SELECT "avatarSkin", "balootRating", "balootSkin", "bio", "chessRating", "chessSkin", "coins", "dominoRating", "dominoSkin", "gems", "id", "level", "ludoRating", "ludoSkin", "updatedAt", "userId", "vip", "vipExpires", "xp" FROM "Profile";
DROP TABLE "Profile";
ALTER TABLE "new_Profile" RENAME TO "Profile";
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
CREATE TABLE "new_DailyStreak" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "longest" INTEGER NOT NULL DEFAULT 0,
    "lastClaimedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyStreak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyStreak" ("current", "id", "lastClaimedAt", "longest", "updatedAt", "userId") SELECT "current", "id", "lastClaimedAt", "longest", "updatedAt", "userId" FROM "DailyStreak";
DROP TABLE "DailyStreak";
ALTER TABLE "new_DailyStreak" RENAME TO "DailyStreak";
CREATE UNIQUE INDEX "DailyStreak_userId_key" ON "DailyStreak"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "UserAvatar_userId_key" ON "UserAvatar"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorldReview_worldId_userId_key" ON "WorldReview"("worldId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorldLike_worldId_userId_key" ON "WorldLike"("worldId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripePayment_stripeId_key" ON "StripePayment"("stripeId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentalControl_parentUserId_key" ON "ParentalControl"("parentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ParentalControl_childUserId_key" ON "ParentalControl"("childUserId");

-- CreateIndex
CREATE INDEX "GameProject_ownerId_idx" ON "GameProject"("ownerId");

-- CreateIndex
CREATE INDEX "GameProject_status_idx" ON "GameProject"("status");

-- CreateIndex
CREATE INDEX "GameProject_category_idx" ON "GameProject"("category");

-- CreateIndex
CREATE UNIQUE INDEX "GameProjectLike_projectId_userId_key" ON "GameProjectLike"("projectId", "userId");
