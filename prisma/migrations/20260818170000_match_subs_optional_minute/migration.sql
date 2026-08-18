-- AlterTable
ALTER TABLE "MatchGoal" ALTER COLUMN "minute" DROP NOT NULL;

-- CreateTable
CREATE TABLE "MatchSubstitution" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerOutId" TEXT NOT NULL,
    "playerInId" TEXT NOT NULL,
    "minute" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MatchSubstitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchSubstitution_matchId_idx" ON "MatchSubstitution"("matchId");

-- CreateIndex
CREATE INDEX "MatchSubstitution_playerOutId_idx" ON "MatchSubstitution"("playerOutId");

-- CreateIndex
CREATE INDEX "MatchSubstitution_playerInId_idx" ON "MatchSubstitution"("playerInId");

-- AddForeignKey
ALTER TABLE "MatchSubstitution" ADD CONSTRAINT "MatchSubstitution_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubstitution" ADD CONSTRAINT "MatchSubstitution_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSubstitution" ADD CONSTRAINT "MatchSubstitution_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
