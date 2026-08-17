import "dotenv/config";
import { syncSportDCLeague } from "../lib/sportdc/sync";
import { prisma } from "../lib/db/prisma";

async function main() {
  const result = await syncSportDCLeague();
  console.log(JSON.stringify(result, null, 2));

  const teams = await prisma.team.count();
  const matches = await prisma.match.count();
  const standings = await prisma.leagueStanding.count();
  const pobjeda = await prisma.team.findUnique({ where: { sportdcTeamId: 8448 } });
  const nextHome = await prisma.match.findUnique({
    where: { sportdcMatchId: 604152 },
    include: { homeTeam: true, awayTeam: true },
  });
  const upcoming = await prisma.match.count({
    where: {
      status: "SCHEDULED",
      OR: [{ homeTeam: { sportdcTeamId: 8448 } }, { awayTeam: { sportdcTeamId: 8448 } }],
    },
  });

  console.log("db teams", teams);
  console.log("db matches", matches);
  console.log("db standings", standings);
  console.log("pobjeda", pobjeda?.name, pobjeda?.isOurTeam);
  console.log(
    "604152",
    nextHome?.homeTeam.sportdcTeamId,
    nextHome?.awayTeam.sportdcTeamId,
    nextHome?.status,
  );
  console.log("pobjeda upcoming", upcoming);

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
