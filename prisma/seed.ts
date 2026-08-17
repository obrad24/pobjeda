import "dotenv/config";
import { hash } from "bcryptjs";
import {
  CardType,
  MatchStatus,
  Position,
  Role,
} from "../generated/prisma";
import { prisma } from "../lib/db/prisma";
import { ensureFantasyRules, recalculateMatchFantasy } from "../lib/fantasy";
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

const PLAYERS: Array<{
  firstName: string;
  lastName: string;
  birthYear: number;
  jerseyNumber: number;
  position: Position;
  formerClubs?: string;
  active?: boolean;
}> = [
  { firstName: "Marko", lastName: "Petrović", birthYear: 1996, jerseyNumber: 1, position: Position.GK, formerClubs: "Radnik Bijeljina" },
  { firstName: "Nemanja", lastName: "Jovanović", birthYear: 2001, jerseyNumber: 12, position: Position.GK },
  { firstName: "Stefan", lastName: "Ilić", birthYear: 1995, jerseyNumber: 2, position: Position.DF, formerClubs: "Sloga Dazdarevo" },
  { firstName: "Bojan", lastName: "Simić", birthYear: 1998, jerseyNumber: 3, position: Position.DF },
  { firstName: "Aleksandar", lastName: "Nikolić", birthYear: 1994, jerseyNumber: 4, position: Position.DF, formerClubs: "Tavna Banjica" },
  { firstName: "Miloš", lastName: "Đorđević", birthYear: 1999, jerseyNumber: 5, position: Position.DF },
  { firstName: "Vladimir", lastName: "Stanković", birthYear: 1997, jerseyNumber: 6, position: Position.DF },
  { firstName: "Nikola", lastName: "Pavlović", birthYear: 2000, jerseyNumber: 8, position: Position.MF },
  { firstName: "Darko", lastName: "Lukić", birthYear: 1993, jerseyNumber: 10, position: Position.MF, formerClubs: "OFK Crnjelovo, Patkovača" },
  { firstName: "Filip", lastName: "Marinković", birthYear: 2002, jerseyNumber: 11, position: Position.WG },
  { firstName: "Dušan", lastName: "Kovačević", birthYear: 1998, jerseyNumber: 16, position: Position.MF },
  { firstName: "Goran", lastName: "Mitrović", birthYear: 1996, jerseyNumber: 18, position: Position.MF },
  { firstName: "Luka", lastName: "Popović", birthYear: 2001, jerseyNumber: 7, position: Position.FW },
  { firstName: "Ivan", lastName: "Tomić", birthYear: 1997, jerseyNumber: 9, position: Position.FW, formerClubs: "Jedinstvo Donja Čađavica" },
  { firstName: "Saša", lastName: "Vuković", birthYear: 1995, jerseyNumber: 14, position: Position.FW },
  { firstName: "Predrag", lastName: "Živanović", birthYear: 1990, jerseyNumber: 21, position: Position.FW, formerClubs: "Pobjeda Triješnica", active: false },
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
          isOurTeam: team.isOurTeam ?? false,
        },
        create: {
          name: team.name,
          sportdcName: team.sportdcName,
          city: team.city,
          sportdcTeamId: team.sportdcTeamId,
          isOurTeam: team.isOurTeam ?? false,
        },
      }),
    );
  }

  const bySportDcId = new Map(teams.map((team) => [team.sportdcTeamId, team]));
  const pobjeda = bySportDcId.get(OUR_CLUB_ID);
  if (!pobjeda) {
    throw new Error("FK Pobjeda Triješnica was not seeded");
  }

  const players = [];
  for (const player of PLAYERS) {
    const slug = slugifyName(player.firstName, player.lastName);
    players.push(
      await prisma.player.upsert({
        where: { slug },
        update: {
          firstName: player.firstName,
          lastName: player.lastName,
          birthYear: player.birthYear,
          jerseyNumber: player.jerseyNumber,
          position: player.position,
          formerClubs: player.formerClubs,
          active: player.active ?? true,
        },
        create: {
          firstName: player.firstName,
          lastName: player.lastName,
          birthYear: player.birthYear,
          jerseyNumber: player.jerseyNumber,
          position: player.position,
          formerClubs: player.formerClubs,
          slug,
          active: player.active ?? true,
        },
      }),
    );
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

  const friendlyDate = new Date("2026-08-10T17:00:00+02:00");
  const tavna = bySportDcId.get(7594);
  const nacional = bySportDcId.get(7610);
  if (!tavna || !nacional) {
    throw new Error("Opponent clubs missing for finished seed matches");
  }

  const finishedHome = await prisma.match.upsert({
    where: { sportdcMatchId: 800001 },
    update: {
      homeScore: 2,
      awayScore: 1,
      status: MatchStatus.FINISHED,
    },
    create: {
      seasonId: season.id,
      leagueId: league.id,
      homeTeamId: pobjeda.id,
      awayTeamId: tavna.id,
      sportdcMatchId: 800001,
      date: friendlyDate,
      time: "17:00",
      stadium: "Triješnica",
      round: 0,
      status: MatchStatus.FINISHED,
      homeScore: 2,
      awayScore: 1,
    },
  });

  await prisma.match.upsert({
    where: { sportdcMatchId: 800002 },
    update: {
      homeScore: 1,
      awayScore: 1,
      status: MatchStatus.FINISHED,
    },
    create: {
      seasonId: season.id,
      leagueId: league.id,
      homeTeamId: nacional.id,
      awayTeamId: pobjeda.id,
      sportdcMatchId: 800002,
      date: new Date("2026-08-16T17:00:00+02:00"),
      time: "17:00",
      stadium: "Bijeljina",
      round: 0,
      status: MatchStatus.FINISHED,
      homeScore: 1,
      awayScore: 1,
    },
  });

  const striker = players.find((player) => player.slug === "luka-popovic");
  const playmaker = players.find((player) => player.slug === "darko-lukic");
  const defender = players.find((player) => player.slug === "stefan-ilic");
  const activePlayers = players.filter((player) => player.active);

  if (!striker || !playmaker || !defender) {
    throw new Error("Expected seed players were not created");
  }

  const starters = [striker, playmaker, defender];
  for (const player of activePlayers) {
    if (starters.length >= 11) {
      break;
    }
    if (!starters.includes(player)) {
      starters.push(player);
    }
  }
  const sub = activePlayers.find((player) => !starters.includes(player));
  if (!sub) {
    throw new Error("Expected a substitute player for the seed lineup");
  }

  await prisma.matchPlayer.deleteMany({ where: { matchId: finishedHome.id } });
  await prisma.matchGoal.deleteMany({ where: { matchId: finishedHome.id } });
  await prisma.matchCard.deleteMany({ where: { matchId: finishedHome.id } });
  await prisma.matchPenaltyMiss.deleteMany({ where: { matchId: finishedHome.id } });
  await prisma.matchConcededGoal.deleteMany({ where: { matchId: finishedHome.id } });
  await prisma.fantasyMatchPoints.deleteMany({ where: { matchId: finishedHome.id } });

  for (const player of starters) {
    const isStriker = player.id === striker.id;
    const isPlaymaker = player.id === playmaker.id;
    const isDefender = player.id === defender.id;

    await prisma.matchPlayer.create({
      data: {
        matchId: finishedHome.id,
        playerId: player.id,
        starter: true,
        minutes: isDefender ? 70 : 90,
        substitutedAt: isDefender ? 70 : null,
        goals: isStriker ? 2 : 0,
        assists: isPlaymaker ? 1 : 0,
        yellowCards: isDefender ? 1 : 0,
        redCards: 0,
      },
    });
  }

  await prisma.matchPlayer.create({
    data: {
      matchId: finishedHome.id,
      playerId: sub.id,
      starter: false,
      minutes: 20,
      enteredAt: 70,
    },
  });

  await prisma.matchGoal.createMany({
    data: [
      { matchId: finishedHome.id, playerId: striker.id, assistPlayerId: playmaker.id, minute: 23 },
      { matchId: finishedHome.id, playerId: striker.id, assistPlayerId: null, minute: 81 },
    ],
  });

  await prisma.matchCard.create({
    data: {
      matchId: finishedHome.id,
      playerId: defender.id,
      type: CardType.YELLOW,
      minute: 64,
    },
  });

  await recalculateMatchFantasy(finishedHome.id);

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
  console.log(`  players: ${players.length}`);
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
