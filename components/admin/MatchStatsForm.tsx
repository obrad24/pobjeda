"use client";

import { useMemo, useState, useTransition } from "react";
import type { Player } from "@/generated/prisma";
import type { MatchDetail } from "@/lib/matches";
import { playerFullName, positionLabel } from "@/lib/format";
import { saveMatchStatisticsAction } from "@/app/admin/utakmice/actions";
import type { LineupRowInput, MatchStatisticsInput } from "@/lib/validation/match-stats";

type LineupDraft = LineupRowInput & { included: boolean };

function emptyGoal(playerId: string) {
  return {
    playerId,
    assistPlayerId: "",
    minute: null as number | null,
    ownGoal: false,
  };
}

export function MatchStatsForm({
  match,
  players,
  warning,
}: {
  match: MatchDetail;
  players: Player[];
  warning?: string | null;
}) {
  const initialLineup = useMemo(() => {
    const byId = new Map(match.lineups.map((row) => [row.playerId, row]));
    return players.map((player) => {
      const existing = byId.get(player.id);
      return {
        included: Boolean(existing),
        playerId: player.id,
        starter: existing?.starter ?? false,
        minutes: existing?.minutes ?? null,
        enteredAt: existing?.enteredAt ?? null,
        substitutedAt: existing?.substitutedAt ?? null,
        saves: existing?.saves ?? 0,
        penaltySaves: existing?.penaltySaves ?? 0,
      };
    });
  }, [match.lineups, players]);

  const [homeScore, setHomeScore] = useState(match.homeScore != null ? String(match.homeScore) : "");
  const [awayScore, setAwayScore] = useState(match.awayScore != null ? String(match.awayScore) : "");
  const [lineup, setLineup] = useState<LineupDraft[]>(initialLineup);
  const [substitutions, setSubstitutions] = useState(
    match.substitutions.map((sub) => ({
      playerOutId: sub.playerOutId,
      playerInId: sub.playerInId,
      minute: sub.minute,
    })),
  );
  const [goals, setGoals] = useState(
    match.goals.map((goal) => ({
      playerId: goal.playerId,
      assistPlayerId: goal.assistPlayerId ?? "",
      minute: goal.minute,
      ownGoal: goal.ownGoal,
    })),
  );
  const [cards, setCards] = useState(
    match.cards.map((card) => ({
      playerId: card.playerId,
      type: card.type as "YELLOW" | "RED" | "SECOND_YELLOW",
      minute: card.minute,
    })),
  );
  const [penaltyMisses, setPenaltyMisses] = useState(
    match.penaltyMisses.map((row) => ({
      playerId: row.playerId,
      minute: row.minute,
    })),
  );
  const [concededGoals, setConcededGoals] = useState(match.concededGoals.map((row) => ({ minute: row.minute })));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = lineup.filter((row) => row.included);
  const starters = selected.filter((row) => row.starter);
  const bench = selected.filter((row) => !row.starter);
  const keepers = selected.filter((row) => players.find((player) => player.id === row.playerId)?.position === "GK");
  const goalsAgainst =
    homeScore !== "" && awayScore !== ""
      ? match.homeTeam.isOurTeam
        ? Number(awayScore)
        : match.awayTeam.isOurTeam
          ? Number(homeScore)
          : null
      : match.homeScore != null && match.awayScore != null
        ? match.homeTeam.isOurTeam
          ? match.awayScore
          : match.awayTeam.isOurTeam
            ? match.homeScore
            : null
        : null;

  function defaultPlayerId() {
    return selected[0]?.playerId ?? players[0]?.id ?? "";
  }

  function parseOptionalInt(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;
    return Number(trimmed);
  }

  function togglePlayed(index: number) {
    const next = [...lineup];
    const row = next[index];
    const included = !row.included;
    next[index] = { ...row, included, starter: included ? row.starter : false };
    setLineup(next);
  }

  function toggleStarter(index: number, checked: boolean) {
    const row = lineup[index];
    if (checked && !row.starter && starters.length >= 11) {
      setMessage("Najviše 11 igrača u prvoj postavi.");
      return;
    }
    const next = [...lineup];
    next[index] = { ...row, starter: checked, included: checked || row.included };
    setLineup(next);
  }

  function submit() {
    const parsedHome = parseOptionalInt(homeScore);
    const parsedAway = parseOptionalInt(awayScore);
    const payload: MatchStatisticsInput = {
      homeScore: parsedHome,
      awayScore: parsedAway,
      lineups: selected.map((row) => ({
        playerId: row.playerId,
        starter: row.starter,
        minutes: row.minutes,
        enteredAt: row.enteredAt,
        substitutedAt: row.substitutedAt,
        saves: row.saves ?? 0,
        penaltySaves: row.penaltySaves ?? 0,
      })),
      substitutions: substitutions
        .filter((sub) => sub.playerOutId && sub.playerInId)
        .map((sub) => ({
          playerOutId: sub.playerOutId,
          playerInId: sub.playerInId,
          minute: sub.minute,
        })),
      goals: goals.map((goal) => ({
        playerId: goal.playerId,
        assistPlayerId: goal.ownGoal ? null : goal.assistPlayerId || null,
        minute: goal.minute,
        ownGoal: Boolean(goal.ownGoal),
      })),
      cards: cards.map((card) => ({
        playerId: card.playerId,
        type: card.type,
        minute: Number(card.minute),
      })),
      penaltyMisses: penaltyMisses.map((row) => ({
        playerId: row.playerId,
        minute: Number(row.minute),
      })),
      concededGoals: concededGoals.map((row) => ({ minute: Number(row.minute) })),
    };

    startTransition(async () => {
      const result = await saveMatchStatisticsAction(match.id, payload);
      setMessage(
        result.ok
          ? "Sačuvano. Fantasy bodovi su preračunati, a bodovi su primijenjeni na tabelu ako je rezultat unesen."
          : result.error,
      );
    });
  }

  return (
    <div className="space-y-8">
      {warning ? (
        <p role="status" className="rounded-md bg-gold/20 px-3 py-2 text-sm text-navy">
          {warning}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className={`rounded-md px-3 py-2 text-sm ${
            message.startsWith("Sačuvano") ? "bg-navy text-gold" : "bg-red/10 text-red"
          }`}
        >
          {message}
        </p>
      ) : null}

      <section className="rounded-xl border border-navy/10 bg-white p-4">
        <h2 className="mb-3 font-display text-xl">Rezultat</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <p className="min-w-0 flex-1 text-right font-display text-lg text-navy sm:text-xl">
            {match.homeTeam.name}
          </p>
          <input
            type="number"
            min={0}
            max={30}
            inputMode="numeric"
            aria-label={`Golovi ${match.homeTeam.name}`}
            className="h-14 w-16 rounded-lg border border-navy/20 bg-cream text-center font-display text-3xl text-navy"
            value={homeScore}
            onChange={(event) => setHomeScore(event.target.value)}
          />
          <span className="font-display text-2xl text-muted">:</span>
          <input
            type="number"
            min={0}
            max={30}
            inputMode="numeric"
            aria-label={`Golovi ${match.awayTeam.name}`}
            className="h-14 w-16 rounded-lg border border-navy/20 bg-cream text-center font-display text-3xl text-navy"
            value={awayScore}
            onChange={(event) => setAwayScore(event.target.value)}
          />
          <p className="min-w-0 flex-1 font-display text-lg text-navy sm:text-xl">{match.awayTeam.name}</p>
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          Unesite rezultat prije statistike. Nakon čuvanja bodovi idu na tabelu (3 za pobjedu, 1 za neriješeno).
        </p>
      </section>

      <section className="rounded-xl border border-navy/10 bg-white">
        <div className="border-b border-navy/10 px-4 py-3">
          <h2 className="font-display text-xl">Sastav</h2>
          <p className="mt-1 text-xs text-muted">
            Kliknite igrača ako je igrao. Desno veliki checkbox označava prvih 11. Označeno: {selected.length}, prva
            postava: {starters.length}/11.
          </p>
        </div>
        <ul className="divide-y divide-navy/10">
          {lineup.map((row, index) => {
            const player = players.find((item) => item.id === row.playerId);
            if (!player) return null;
            return (
              <li key={row.playerId}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => togglePlayed(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      togglePlayed(index);
                    }
                  }}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${
                    row.included
                      ? row.starter
                        ? "bg-navy text-white"
                        : "bg-gold/30 text-navy"
                      : "bg-white text-navy hover:bg-cream"
                  }`}
                >
                  <span className="w-8 shrink-0 font-display text-lg text-gold">
                    {player.jerseyNumber ?? ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{playerFullName(player)}</span>
                    <span className={`text-xs ${row.included && row.starter ? "text-white/70" : "text-muted"}`}>
                      {positionLabel(player.position)}
                      {row.included ? (row.starter ? " · prvih 11" : " · igrao") : ""}
                    </span>
                  </span>
                  <label
                    className="flex shrink-0 flex-col items-center gap-1"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={row.starter}
                      aria-label={`${playerFullName(player)} u prvih 11`}
                      className="h-7 w-7 accent-gold"
                      onChange={(event) => toggleStarter(index, event.target.checked)}
                    />
                    <span className={`text-[10px] uppercase tracking-wide ${row.starter ? "text-gold" : "text-muted"}`}>
                      XI
                    </span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="px-4 py-3 text-xs text-muted">
          Minute se računaju same: starter = 90 ili minuta izlaska; izmjena = 90 − ulazak. Fantasy bodove ne unosite
          ručno.
        </p>
      </section>

      <section className="rounded-xl border border-navy/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Zamjene</h2>
          <button
            type="button"
            className="text-sm text-navy hover:text-gold-dark"
            onClick={() => {
              const outId = starters[0]?.playerId ?? selected[0]?.playerId ?? "";
              const inId = bench[0]?.playerId ?? "";
              setSubstitutions([
                ...substitutions,
                { playerOutId: outId, playerInId: inId, minute: null },
              ]);
            }}
          >
            Dodaj zamjenu
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">Minut nije obavezan. Igrač koji ulazi biće označen da je igrao.</p>
        <div className="space-y-3">
          {substitutions.map((sub, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem_auto]">
              <select
                className="rounded border border-navy/20 px-2 py-2 text-sm"
                value={sub.playerOutId}
                onChange={(event) => {
                  const next = [...substitutions];
                  next[index] = { ...sub, playerOutId: event.target.value };
                  setSubstitutions(next);
                }}
              >
                <option value="">Izašao</option>
                {selected.map((row) => {
                  const player = players.find((item) => item.id === row.playerId);
                  return (
                    <option key={row.playerId} value={row.playerId}>
                      {player ? playerFullName(player) : row.playerId}
                    </option>
                  );
                })}
              </select>
              <select
                className="rounded border border-navy/20 px-2 py-2 text-sm"
                value={sub.playerInId}
                onChange={(event) => {
                  const playerId = event.target.value;
                  const nextSubs = [...substitutions];
                  nextSubs[index] = { ...sub, playerInId: playerId };
                  setSubstitutions(nextSubs);
                  setLineup(
                    lineup.map((row) =>
                      row.playerId === playerId ? { ...row, included: true, starter: false } : row,
                    ),
                  );
                }}
              >
                <option value="">Ušao</option>
                {lineup.map((row) => {
                  const player = players.find((item) => item.id === row.playerId);
                  return (
                    <option key={row.playerId} value={row.playerId}>
                      {player ? playerFullName(player) : row.playerId}
                    </option>
                  );
                })}
              </select>
              <input
                type="number"
                min={0}
                max={130}
                placeholder="min"
                className="rounded border border-navy/20 px-2 py-2 text-sm"
                value={sub.minute ?? ""}
                onChange={(event) => {
                  const next = [...substitutions];
                  next[index] = {
                    ...sub,
                    minute: event.target.value === "" ? null : Number(event.target.value),
                  };
                  setSubstitutions(next);
                }}
              />
              <button
                type="button"
                className="text-sm text-red"
                onClick={() => setSubstitutions(substitutions.filter((_, i) => i !== index))}
              >
                Ukloni
              </button>
            </div>
          ))}
        </div>
      </section>

      {keepers.length > 0 ? (
        <section className="rounded-xl border border-navy/10 bg-white p-4">
          <h2 className="mb-3 font-display text-xl">Golman — odbrane</h2>
          <p className="mb-3 text-xs text-muted">
            Unesite samo ako postoji evidencija. Prazno ostaje 0; sistem ne izmišlja odbrane.
          </p>
          <div className="space-y-3">
            {keepers.map((row) => {
              const player = players.find((item) => item.id === row.playerId);
              const index = lineup.findIndex((item) => item.playerId === row.playerId);
              return (
                <div key={row.playerId} className="grid gap-2 sm:grid-cols-[1fr_8rem_8rem]">
                  <p className="self-center text-sm">{player ? playerFullName(player) : row.playerId}</p>
                  <label className="text-xs text-muted">
                    Odbrane
                    <input
                      type="number"
                      min={0}
                      max={30}
                      className="mt-1 w-full rounded border border-navy/20 px-2 py-1 text-sm text-navy"
                      value={row.saves ?? 0}
                      onChange={(event) => {
                        const next = [...lineup];
                        next[index] = { ...row, saves: Number(event.target.value) };
                        setLineup(next);
                      }}
                    />
                  </label>
                  <label className="text-xs text-muted">
                    Odbranjeni penali
                    <input
                      type="number"
                      min={0}
                      max={10}
                      className="mt-1 w-full rounded border border-navy/20 px-2 py-1 text-sm text-navy"
                      value={row.penaltySaves ?? 0}
                      onChange={(event) => {
                        const next = [...lineup];
                        next[index] = { ...row, penaltySaves: Number(event.target.value) };
                        setLineup(next);
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-navy/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Golovi</h2>
          <button
            type="button"
            className="text-sm text-navy hover:text-gold-dark"
            onClick={() => setGoals([...goals, emptyGoal(defaultPlayerId())])}
          >
            Novi gol
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">Asistent i minut nisu obavezni.</p>
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem_auto_auto]">
              <select
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={goal.playerId}
                onChange={(event) => {
                  const next = [...goals];
                  next[index] = { ...goal, playerId: event.target.value };
                  setGoals(next);
                }}
              >
                {selected.map((row) => {
                  const player = players.find((item) => item.id === row.playerId);
                  return (
                    <option key={row.playerId} value={row.playerId}>
                      {player ? playerFullName(player) : row.playerId}
                    </option>
                  );
                })}
              </select>
              <select
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={goal.ownGoal ? "" : goal.assistPlayerId}
                disabled={goal.ownGoal}
                onChange={(event) => {
                  const next = [...goals];
                  next[index] = { ...goal, assistPlayerId: event.target.value };
                  setGoals(next);
                }}
              >
                <option value="">Bez asistencije</option>
                {selected.map((row) => {
                  const player = players.find((item) => item.id === row.playerId);
                  return (
                    <option key={row.playerId} value={row.playerId}>
                      {player ? playerFullName(player) : row.playerId}
                    </option>
                  );
                })}
              </select>
              <input
                type="number"
                min={0}
                max={130}
                placeholder="min"
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={goal.minute ?? ""}
                onChange={(event) => {
                  const next = [...goals];
                  next[index] = { ...goal, minute: event.target.value === "" ? null : Number(event.target.value) };
                  setGoals(next);
                }}
              />
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={goal.ownGoal}
                  onChange={(event) => {
                    const next = [...goals];
                    next[index] = { ...goal, ownGoal: event.target.checked, assistPlayerId: "" };
                    setGoals(next);
                  }}
                />
                Autogol
              </label>
              <button type="button" className="text-sm text-red" onClick={() => setGoals(goals.filter((_, i) => i !== index))}>
                Ukloni
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-navy/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Kartoni</h2>
          <button
            type="button"
            className="text-sm text-navy hover:text-gold-dark"
            onClick={() =>
              setCards([...cards, { playerId: defaultPlayerId(), type: "YELLOW", minute: 1 }])
            }
          >
            Dodaj karton
          </button>
        </div>
        <div className="space-y-3">
          {cards.map((card, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_10rem_6rem_auto]">
              <select
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={card.playerId}
                onChange={(event) => {
                  const next = [...cards];
                  next[index] = { ...card, playerId: event.target.value };
                  setCards(next);
                }}
              >
                {selected.map((row) => {
                  const player = players.find((item) => item.id === row.playerId);
                  return (
                    <option key={row.playerId} value={row.playerId}>
                      {player ? playerFullName(player) : row.playerId}
                    </option>
                  );
                })}
              </select>
              <select
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={card.type}
                onChange={(event) => {
                  const next = [...cards];
                  next[index] = { ...card, type: event.target.value as typeof card.type };
                  setCards(next);
                }}
              >
                <option value="YELLOW">Žuti</option>
                <option value="RED">Crveni</option>
                <option value="SECOND_YELLOW">Drugi žuti</option>
              </select>
              <input
                type="number"
                min={0}
                max={130}
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={card.minute}
                onChange={(event) => {
                  const next = [...cards];
                  next[index] = { ...card, minute: Number(event.target.value) };
                  setCards(next);
                }}
              />
              <button type="button" className="text-sm text-red" onClick={() => setCards(cards.filter((_, i) => i !== index))}>
                Ukloni
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-navy/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Promašeni penali</h2>
          <button
            type="button"
            className="text-sm text-navy hover:text-gold-dark"
            onClick={() =>
              setPenaltyMisses([...penaltyMisses, { playerId: defaultPlayerId(), minute: 1 }])
            }
          >
            Dodaj
          </button>
        </div>
        <div className="space-y-3">
          {penaltyMisses.map((row, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_6rem_auto]">
              <select
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={row.playerId}
                onChange={(event) => {
                  const next = [...penaltyMisses];
                  next[index] = { ...row, playerId: event.target.value };
                  setPenaltyMisses(next);
                }}
              >
                {selected.map((item) => {
                  const player = players.find((p) => p.id === item.playerId);
                  return (
                    <option key={item.playerId} value={item.playerId}>
                      {player ? playerFullName(player) : item.playerId}
                    </option>
                  );
                })}
              </select>
              <input
                type="number"
                min={0}
                max={130}
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={row.minute}
                onChange={(event) => {
                  const next = [...penaltyMisses];
                  next[index] = { ...row, minute: Number(event.target.value) };
                  setPenaltyMisses(next);
                }}
              />
              <button
                type="button"
                className="text-sm text-red"
                onClick={() => setPenaltyMisses(penaltyMisses.filter((_, i) => i !== index))}
              >
                Ukloni
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-navy/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Primljeni golovi (minute)</h2>
          <button
            type="button"
            className="text-sm text-navy hover:text-gold-dark"
            onClick={() => setConcededGoals([...concededGoals, { minute: 1 }])}
          >
            Dodaj minutu
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">
          Skor protivnika: {goalsAgainst == null || Number.isNaN(goalsAgainst) ? "još nije poznat" : goalsAgainst}.
          Unesite minutu svakog primljenog gola da bi clean sheet mogao da ostane igraču koji je izašao prije gola.
          Bez minuta, clean sheet se ne dodjeljuje ako je tim primio gol.
        </p>
        <div className="flex flex-wrap gap-3">
          {concededGoals.map((row, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={130}
                className="w-20 rounded border border-navy/20 px-2 py-1 text-sm"
                value={row.minute}
                onChange={(event) => {
                  const next = [...concededGoals];
                  next[index] = { minute: Number(event.target.value) };
                  setConcededGoals(next);
                }}
              />
              <button
                type="button"
                className="text-sm text-red"
                onClick={() => setConcededGoals(concededGoals.filter((_, i) => i !== index))}
              >
                Ukloni
              </button>
            </div>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="rounded-full bg-navy px-6 py-2.5 text-sm text-gold disabled:opacity-60"
      >
        {pending ? "Čuvam…" : "Sačuvaj statistiku"}
      </button>
    </div>
  );
}
