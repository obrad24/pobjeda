import "dotenv/config";
import { MatchStatus, Position } from "../generated/prisma";
import { prisma } from "../lib/db/prisma";
import { slugifyName } from "../lib/utils/slug";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const pobjeda = await prisma.team.findUnique({
    where: { sportdcTeamId: 8448 },
  });
  assert(pobjeda?.isOurTeam, "FK Pobjeda Triješnica (8448) must exist and be our team");

  const boracTrnjaci = await prisma.team.findUnique({ where: { sportdcTeamId: 7421 } });
  const boracObrijez = await prisma.team.findUnique({ where: { sportdcTeamId: 7802 } });
  assert(boracTrnjaci && boracObrijez, "Both Borac clubs must be distinct rows");
  assert(boracTrnjaci.id !== boracObrijez.id, "Borac clubs must not share a primary key");

  const openingMatch = await prisma.match.findUnique({
    where: { sportdcMatchId: 604152 },
    include: { homeTeam: true, awayTeam: true, league: true, season: true },
  });
  assert(openingMatch, "Match 604152 must exist");
  assert(openingMatch.homeTeam.sportdcTeamId === 8448, "Pobjeda must be home in 604152");
  assert(openingMatch.awayTeam.sportdcTeamId === 7802, "Away team must be Borac 7802");
  assert(openingMatch.league.sportdcLeagueId === 6452, "League id must be 6452");
  assert(openingMatch.season.name === "2026-2027", "Season must be 2026-2027");
  assert(openingMatch.status === MatchStatus.SCHEDULED, "Opening fixture should be scheduled");

  const slug = slugifyName("Smoke", "Testović");
  const created = await prisma.player.create({
    data: {
      firstName: "Smoke",
      lastName: "Testović",
      position: Position.MF,
      slug: `${slug}-${Date.now()}`,
      active: true,
    },
  });

  const updated = await prisma.player.update({
    where: { id: created.id },
    data: { jerseyNumber: 99, active: false },
  });
  assert(updated.jerseyNumber === 99, "Player update failed");
  assert(updated.active === false, "Player deactivate failed");

  await prisma.player.delete({ where: { id: created.id } });
  const deleted = await prisma.player.findUnique({ where: { id: created.id } });
  assert(!deleted, "Player delete failed");

  try {
    await prisma.match.create({
      data: {
        seasonId: openingMatch.seasonId,
        leagueId: openingMatch.leagueId,
        homeTeamId: openingMatch.homeTeamId,
        awayTeamId: openingMatch.awayTeamId,
        sportdcMatchId: 604152,
        date: openingMatch.date,
        round: 1,
        status: MatchStatus.SCHEDULED,
      },
    });
    throw new Error("Duplicate sportdcMatchId should have been rejected");
  } catch (error) {
    assert(
      error instanceof Error && error.message !== "Duplicate sportdcMatchId should have been rejected",
      "Duplicate sportdcMatchId was not rejected",
    );
  }

  const playerCount = await prisma.player.count();
  console.log("CRUD and relation smoke tests passed");
  console.log(`  our team: ${pobjeda.name}`);
  console.log(`  players: ${playerCount}`);
  console.log(`  next match: ${openingMatch.homeTeam.sportdcName} vs ${openingMatch.awayTeam.sportdcName}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
