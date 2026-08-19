import "dotenv/config";
import { hash } from "bcryptjs";
import { MatchStatus, Position, Role } from "../generated/prisma";
import { prisma } from "../lib/db/prisma";
import { ensureFantasyRules } from "../lib/fantasy";
import { sportdcClubLogoUrl } from "../lib/sportdc/teams";
import { slugifyName } from "../lib/utils/slug";

const LEAGUE_URL =
  process.env.SPORTDC_LEAGUE_URL ??
  "https://sportdc.net/league/6452-prva-opstinska-liga-bijeljina";
const LEAGUE_ID = Number(process.env.SPORTDC_LEAGUE_ID ?? "6452");
const OUR_CLUB_ID = Number(process.env.SPORTDC_CLUB_ID ?? "8448");

const TEAMS: Array<{
  sportdcTeamId: number;
  name: string;
  sportdcName: string;
  city: string;
  isOurTeam?: boolean;
}> = [
  {
    sportdcTeamId: OUR_CLUB_ID,
    name: "FK Pobjeda Triješnica",
    sportdcName: "Pobjeda",
    city: "Triješnica",
    isOurTeam: true,
  },
  { sportdcTeamId: 7391, name: "FK Majevica Donje Zabrđe", sportdcName: "Majevica", city: "Donje Zabrđe" },
  { sportdcTeamId: 7594, name: "FK Tavna Banjica", sportdcName: "Tavna", city: "Banjica" },
  { sportdcTeamId: 7610, name: "FK Nacional Bijeljina", sportdcName: "Nacional", city: "Bijeljina" },
  { sportdcTeamId: 8265, name: "FK Sinđelić Golo Brdo", sportdcName: "Sinđelić", city: "Golo Brdo" },
  { sportdcTeamId: 10247, name: "OFK Crnjelovo", sportdcName: "OFK Crnjelovo", city: "Gornje Crnjelovo" },
  { sportdcTeamId: 7421, name: "FK Borac Trnjaci", sportdcName: "Borac", city: "Trnjaci" },
  { sportdcTeamId: 7599, name: "FK Modran", sportdcName: "Modran", city: "Modran" },
  { sportdcTeamId: 11611, name: "FK Patkovača", sportdcName: "Patkovača", city: "Patkovača" },
  { sportdcTeamId: 7579, name: "FK Ljeljenča", sportdcName: "Ljeljenča", city: "Ljeljenča" },
  { sportdcTeamId: 7587, name: "FK Stević Jovan Vršani", sportdcName: "Stević Jovan", city: "Vršani" },
  { sportdcTeamId: 7802, name: "FK Borac Ugljevička Obrijež", sportdcName: "Borac", city: "Ugljevička Obrijež" },
  { sportdcTeamId: 7596, name: "FK Glogovac", sportdcName: "Glogovac", city: "Glogovac" },
  { sportdcTeamId: 7580, name: "FK Jedinstvo Donja Čađavica", sportdcName: "Jedinstvo", city: "Donja Čađavica" },
];

const ROSTER: Array<{ firstName: string; lastName: string; position: Position }> = [
  { firstName: "Jovica", lastName: "Jovanović", position: Position.GK },
  { firstName: "Dejan", lastName: "Stanković", position: Position.DF },
  { firstName: "Miloš", lastName: "Milković", position: Position.DF },
  { firstName: "Radomir", lastName: "Miličić", position: Position.DF },
  { firstName: "Damjan", lastName: "Koprivica", position: Position.DF },
  { firstName: "Bojan", lastName: "Đurić", position: Position.DF },
  { firstName: "Đorđe", lastName: "Dujković", position: Position.DF },
  { firstName: "Bogoljub", lastName: "Sando", position: Position.DF },
  { firstName: "Aleksandar", lastName: "Petrović", position: Position.DF },
  { firstName: "Miloš", lastName: "Magazin", position: Position.DF },
  { firstName: "Dimitrije", lastName: "Mrkajić", position: Position.MF },
  { firstName: "Velibor", lastName: "Vujić", position: Position.MF },
  { firstName: "Obrad", lastName: "Pejić", position: Position.MF },
  { firstName: "Željko", lastName: "Maksimović", position: Position.MF },
  { firstName: "Aranđel", lastName: "Lazarević", position: Position.MF },
  { firstName: "Stefan", lastName: "Jeftić", position: Position.MF },
  { firstName: "Nikša", lastName: "Gavranić", position: Position.MF },
  { firstName: "Đorđe", lastName: "Koprivica", position: Position.MF },
  { firstName: "Luka", lastName: "Jovanović", position: Position.MF },
  { firstName: "Milorad", lastName: "Živanović", position: Position.MF },
  { firstName: "Slaviša", lastName: "Kajtaz", position: Position.FW },
  { firstName: "Mile", lastName: "Petrović", position: Position.FW },
  { firstName: "Veljko", lastName: "Grabež", position: Position.FW },
  { firstName: "Spasoje", lastName: "Petrović", position: Position.FW },
  { firstName: "Željko", lastName: "Pejić", position: Position.FW },
];

async function upsertAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@pobjeda.local";
  const password = process.env.ADMIN_PASSWORD ?? "pobjeda-dev";
  const passwordHash = await hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN },
    create: { email, passwordHash, role: Role.ADMIN },
  });

  if (email !== "admin@pobjeda.local") {
    await prisma.user.deleteMany({
      where: { email: "admin@pobjeda.local" },
    });
  }

  return email;
}

async function main() {
  const season = await prisma.season.upsert({
    where: { name: "2026-2027" },
    update: {
      active: true,
      startDate: new Date("2026-08-23"),
      endDate: new Date("2027-06-30"),
    },
    create: {
      name: "2026-2027",
      active: true,
      startDate: new Date("2026-08-23"),
      endDate: new Date("2027-06-30"),
    },
  });

  await prisma.season.updateMany({
    where: { id: { not: season.id }, active: true },
    data: { active: false },
  });

  await ensureFantasyRules(season.id);

  const league = await prisma.league.upsert({
    where: {
      seasonId_sportdcLeagueId: {
        seasonId: season.id,
        sportdcLeagueId: LEAGUE_ID,
      },
    },
    update: {
      name: "Prva Opštinska liga Bijeljina",
      sportdcUrl: LEAGUE_URL,
    },
    create: {
      name: "Prva Opštinska liga Bijeljina",
      seasonId: season.id,
      sportdcLeagueId: LEAGUE_ID,
      sportdcUrl: LEAGUE_URL,
    },
  });

  const teams = [];
  for (const team of TEAMS) {
    teams.push(
      await prisma.team.upsert({
        where: { sportdcTeamId: team.sportdcTeamId },
        update: {
          name: team.name,
          sportdcName: team.sportdcName,
          city: team.city,
          logo: sportdcClubLogoUrl(team.sportdcTeamId),
          isOurTeam: team.isOurTeam ?? false,
        },
        create: {
          name: team.name,
          sportdcName: team.sportdcName,
          city: team.city,
          sportdcTeamId: team.sportdcTeamId,
          logo: sportdcClubLogoUrl(team.sportdcTeamId),
          isOurTeam: team.isOurTeam ?? false,
        },
      }),
    );
  }

  const roster = [];
  for (const player of ROSTER) {
    const existing = await prisma.player.findFirst({
      where: {
        firstName: player.firstName,
        lastName: player.lastName,
      },
    });

    roster.push(
      existing
        ? await prisma.player.update({
            where: { id: existing.id },
            data: {
              position: player.position,
              active: true,
            },
          })
        : await prisma.player.create({
            data: {
              firstName: player.firstName,
              lastName: player.lastName,
              position: player.position,
              slug: slugifyName(player.firstName, player.lastName),
              active: true,
            },
          }),
    );
  }

  const bySportDcId = new Map(teams.map((team) => [team.sportdcTeamId, team]));
  const pobjeda = bySportDcId.get(OUR_CLUB_ID);
  if (!pobjeda) {
    throw new Error("FK Pobjeda Triješnica was not seeded");
  }

  const kickoff = new Date("2026-08-23T17:30:00+02:00");

  const roundOne = [
    { sportdcMatchId: 604150, home: 7391, away: 7580, stadium: "Donje Zabrđe" },
    { sportdcMatchId: 604151, home: 7594, away: 7596, stadium: "Banjica" },
    { sportdcMatchId: 604152, home: OUR_CLUB_ID, away: 7802, stadium: "Triješnica" },
    { sportdcMatchId: 604153, home: 7610, away: 7587, stadium: "Bijeljina" },
    { sportdcMatchId: 604154, home: 8265, away: 7579, stadium: "Golo Brdo" },
    { sportdcMatchId: 604155, home: 10247, away: 11611, stadium: "Gornje Crnjelovo" },
    { sportdcMatchId: 604156, home: 7421, away: 7599, stadium: "Trnjaci" },
  ];

  for (const fixture of roundOne) {
    const homeTeam = bySportDcId.get(fixture.home);
    const awayTeam = bySportDcId.get(fixture.away);
    if (!homeTeam || !awayTeam) {
      throw new Error(`Missing team for match ${fixture.sportdcMatchId}`);
    }

    await prisma.match.upsert({
      where: { sportdcMatchId: fixture.sportdcMatchId },
      update: {
        seasonId: season.id,
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        date: kickoff,
        time: "17:30",
        stadium: fixture.stadium,
        round: 1,
        status: MatchStatus.SCHEDULED,
        homeScore: null,
        awayScore: null,
      },
      create: {
        seasonId: season.id,
        leagueId: league.id,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        sportdcMatchId: fixture.sportdcMatchId,
        date: kickoff,
        time: "17:30",
        stadium: fixture.stadium,
        round: 1,
        status: MatchStatus.SCHEDULED,
      },
    });
  }

  await prisma.clubHistory.upsert({
    where: { id: "seed-history-osnivanje" },
    update: {
      title: "Osnivanje kluba",
      body: "FK Pobjeda Triješnica osnovan je 1976. godine. Klub okuplja igrače i navijače iz Triješnice i okoline, i od tada nosi ime koje govori o karakteru mjesta iz kojeg dolazi.",
      year: 1976,
      sortOrder: 1,
      published: true,
    },
    create: {
      id: "seed-history-osnivanje",
      title: "Osnivanje kluba",
      body: "FK Pobjeda Triješnica osnovan je 1976. godine. Klub okuplja igrače i navijače iz Triješnice i okoline, i od tada nosi ime koje govori o karakteru mjesta iz kojeg dolazi.",
      year: 1976,
      sortOrder: 1,
      published: true,
    },
  });

  await prisma.clubHistory.upsert({
    where: { id: "seed-history-zajednica" },
    update: {
      title: "Klub kao okosnica sela",
      body: "Kroz decenije Pobjeda je ostala amaterski klub svog kraja: teren, svlačionica i utakmica vikendom. Generacije iz Triješnice i susjednih naselja prolazile su kroz isti dres — navy, gold i diskretni crveni trag.",
      year: 1990,
      sortOrder: 2,
      published: true,
    },
    create: {
      id: "seed-history-zajednica",
      title: "Klub kao okosnica sela",
      body: "Kroz decenije Pobjeda je ostala amaterski klub svog kraja: teren, svlačionica i utakmica vikendom. Generacije iz Triješnice i susjednih naselja prolazile su kroz isti dres — navy, gold i diskretni crveni trag.",
      year: 1990,
      sortOrder: 2,
      published: true,
    },
  });

  await prisma.clubHistory.upsert({
    where: { id: "seed-history-liga" },
    update: {
      title: "Prva opštinska liga Bijeljina",
      body: "Klub se takmiči u Prvoj opštinskoj ligi Bijeljina. Raspored, tabela i rezultati vode se preko SportDC evidencije, a sastavi i statistika igrača ostaju u klupskoj knjizi.",
      year: 2020,
      sortOrder: 3,
      published: true,
    },
    create: {
      id: "seed-history-liga",
      title: "Prva opštinska liga Bijeljina",
      body: "Klub se takmiči u Prvoj opštinskoj ligi Bijeljina. Raspored, tabela i rezultati vode se preko SportDC evidencije, a sastavi i statistika igrača ostaju u klupskoj knjizi.",
      year: 2020,
      sortOrder: 3,
      published: true,
    },
  });

  await prisma.clubHistory.upsert({
    where: { id: "seed-history-sezona" },
    update: {
      title: "Sezona 2026/27",
      body: "Aktuelna sezona počinje 23. avgusta 2026. u Triješnici, protiv Borca iz Ugljevičke Obriježi. Ovaj sajt prati taj put: utakmicu po utakmicu, igrača po igrača.",
      year: 2026,
      sortOrder: 4,
      published: true,
    },
    create: {
      id: "seed-history-sezona",
      title: "Sezona 2026/27",
      body: "Aktuelna sezona počinje 23. avgusta 2026. u Triješnici, protiv Borca iz Ugljevičke Obriježi. Ovaj sajt prati taj put: utakmicu po utakmicu, igrača po igrača.",
      year: 2026,
      sortOrder: 4,
      published: true,
    },
  });

  const adminEmail = await upsertAdmin();

  console.log("Seed complete");
  console.log(`  season: ${season.name}`);
  console.log(`  league: ${league.name} (${league.sportdcLeagueId})`);
  console.log(`  teams: ${teams.length}`);
  console.log(`  players: ${roster.length}`);
  console.log(`  our club: ${pobjeda.name} [${pobjeda.sportdcTeamId}]`);
  console.log(`  admin: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
