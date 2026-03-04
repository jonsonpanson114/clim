-- CreateTable
CREATE TABLE "Favorite" (
    "videoId" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "History" (
    "videoId" TEXT NOT NULL PRIMARY KEY,
    "watchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "History_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_videoId_key" ON "Favorite"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "History_videoId_key" ON "History"("videoId");
