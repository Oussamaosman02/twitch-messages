-- CreateTable
CREATE TABLE "TwitchMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channel" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
