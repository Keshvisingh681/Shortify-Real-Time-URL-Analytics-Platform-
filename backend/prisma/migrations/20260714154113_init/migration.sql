-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_urls" (
    "id" UUID NOT NULL,
    "longUrl" TEXT NOT NULL,
    "shortCode" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "short_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "click_events" (
    "id" UUID NOT NULL,
    "shortUrlId" UUID NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "country" TEXT,
    "city" TEXT,
    "browser" TEXT,
    "device" TEXT,
    "os" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "short_urls_shortCode_key" ON "short_urls"("shortCode");

-- CreateIndex
CREATE INDEX "short_urls_shortCode_idx" ON "short_urls"("shortCode");

-- CreateIndex
CREATE INDEX "short_urls_userId_idx" ON "short_urls"("userId");

-- CreateIndex
CREATE INDEX "short_urls_createdAt_idx" ON "short_urls"("createdAt");

-- CreateIndex
CREATE INDEX "click_events_shortUrlId_idx" ON "click_events"("shortUrlId");

-- CreateIndex
CREATE INDEX "click_events_createdAt_idx" ON "click_events"("createdAt");

-- AddForeignKey
ALTER TABLE "short_urls" ADD CONSTRAINT "short_urls_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "click_events" ADD CONSTRAINT "click_events_shortUrlId_fkey" FOREIGN KEY ("shortUrlId") REFERENCES "short_urls"("id") ON DELETE CASCADE ON UPDATE CASCADE;
