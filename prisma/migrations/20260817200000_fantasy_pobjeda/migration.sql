-- AlterTable
ALTER TABLE "MatchPlayer" ADD COLUMN "saves" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "MatchPlayer" ADD COLUMN "penaltySaves" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MatchGoal" ADD COLUMN "ownGoal" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MatchPenaltyMiss" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,

    CONSTRAINT "MatchPenaltyMiss_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchConcededGoal" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,

    CONSTRAINT "MatchConcededGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyScoringRule" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FantasyScoringRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FantasyMatchPoints" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FantasyMatchPoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchPenaltyMiss_matchId_idx" ON "MatchPenaltyMiss"("matchId");

-- CreateIndex
CREATE INDEX "MatchPenaltyMiss_playerId_idx" ON "MatchPenaltyMiss"("playerId");

-- CreateIndex
CREATE INDEX "MatchConcededGoal_matchId_idx" ON "MatchConcededGoal"("matchId");

-- CreateIndex
CREATE INDEX "FantasyScoringRule_seasonId_active_idx" ON "FantasyScoringRule"("seasonId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyScoringRule_seasonId_key_key" ON "FantasyScoringRule"("seasonId", "key");

-- CreateIndex
CREATE INDEX "FantasyMatchPoints_playerId_idx" ON "FantasyMatchPoints"("playerId");

-- CreateIndex
CREATE INDEX "FantasyMatchPoints_matchId_idx" ON "FantasyMatchPoints"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "FantasyMatchPoints_matchId_playerId_key" ON "FantasyMatchPoints"("matchId", "playerId");

-- AddForeignKey
ALTER TABLE "MatchPenaltyMiss" ADD CONSTRAINT "MatchPenaltyMiss_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPenaltyMiss" ADD CONSTRAINT "MatchPenaltyMiss_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchConcededGoal" ADD CONSTRAINT "MatchConcededGoal_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyScoringRule" ADD CONSTRAINT "FantasyScoringRule_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyMatchPoints" ADD CONSTRAINT "FantasyMatchPoints_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FantasyMatchPoints" ADD CONSTRAINT "FantasyMatchPoints_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
