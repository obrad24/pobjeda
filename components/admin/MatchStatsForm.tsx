"use client";

import { useMemo, useState, useTransition } from "react";
import type { Player } from "@/generated/prisma";
import type { MatchDetail } from "@/lib/matches";
import { playerFullName, positionLabel } from "@/lib/format";
import { saveMatchStatisticsAction } from "@/app/admin/utakmice/actions";
import type { LineupRowInput, MatchStatisticsInput } from "@/lib/validation/match-stats";

type LineupDraft = LineupRowInput & { included: boolean };

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

  const [lineup, setLineup] = useState<LineupDraft[]>(initialLineup);
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
  const keepers = selected.filter((row) => players.find((player) => player.id === row.playerId)?.position === "GK");
  const goalsAgainst =
    match.homeScore != null && match.awayScore != null
      ? match.homeTeam.isOurTeam
        ? match.awayScore
        : match.awayTeam.isOurTeam
          ? match.homeScore
          : null
      : null;

  function submit() {
    const payload: MatchStatisticsInput = {
      lineups: selected.map((row) => ({
        playerId: row.playerId,
        starter: row.starter,
        minutes: row.minutes,
        enteredAt: row.enteredAt,
        substitutedAt: row.substitutedAt,
        saves: row.saves ?? 0,
        penaltySaves: row.penaltySaves ?? 0,
      })),
      goals: goals.map((goal) => ({
        playerId: goal.playerId,
        assistPlayerId: goal.ownGoal ? null : goal.assistPlayerId || null,
        minute: Number(goal.minute),
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
          ? "Sačuvano. Fantasy bodovi su automatski preračunati iz statistike."
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

      <section className="overflow-x-auto rounded-xl border border-navy/10 bg-white">
        <h2 className="border-b border-navy/10 px-4 py-3 font-display text-xl">Sastav</h2>
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-cream text-left">
            <tr>
              <th className="px-3 py-2">U sastavu</th>
              <th className="px-3 py-2">Igrač</th>
              <th className="px-3 py-2">Starter</th>
              <th className="px-3 py-2">Ulazak</th>
              <th className="px-3 py-2">Izlazak</th>
              <th className="px-3 py-2">Minute</th>
            </tr>
          </thead>
          <tbody>
            {lineup.map((row, index) => {
              const player = players.find((item) => item.id === row.playerId);
              if (!player) return null;
              return (
                <tr key={row.playerId} className="border-t border-navy/10">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.included}
                      onChange={(event) => {
                        const next = [...lineup];
                        next[index] = { ...row, included: event.target.checked };
                        setLineup(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className="mr-2 font-display text-gold">{player.jerseyNumber ?? ""}</span>
                    {playerFullName(player)}
                    <span className="ml-2 text-xs text-muted">{positionLabel(player.position)}</span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.starter}
                      onChange={(event) => {
                        const next = [...lineup];
                        next[index] = { ...row, starter: event.target.checked, included: true };
                        setLineup(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={130}
                      className="w-20 rounded border border-navy/20 px-2 py-1"
                      value={row.enteredAt ?? ""}
                      onChange={(event) => {
                        const next = [...lineup];
                        next[index] = { ...row, enteredAt: event.target.value === "" ? null : Number(event.target.value) };
                        setLineup(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={130}
                      className="w-20 rounded border border-navy/20 px-2 py-1"
                      value={row.substitutedAt ?? ""}
                      onChange={(event) => {
                        const next = [...lineup];
                        next[index] = {
                          ...row,
                          substitutedAt: event.target.value === "" ? null : Number(event.target.value),
                        };
                        setLineup(next);
                      }}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={130}
                      className="w-20 rounded border border-navy/20 px-2 py-1"
                      value={row.minutes ?? ""}
                      placeholder="auto"
                      onChange={(event) => {
                        const next = [...lineup];
                        next[index] = { ...row, minutes: event.target.value === "" ? null : Number(event.target.value) };
                        setLineup(next);
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="px-4 py-3 text-xs text-muted">
          Ako minute ostavite prazne: starter = 90, ili minuta izlaska; izmjena = 90 − ulazak. Fantasy bodove ne unosite
          ručno — sistem ih računa nakon čuvanja.
        </p>
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
            onClick={() =>
              setGoals([
                ...goals,
                {
                  playerId: selected[0]?.playerId ?? players[0]?.id ?? "",
                  assistPlayerId: "",
                  minute: 1,
                  ownGoal: false,
                },
              ])
            }
          >
            Dodaj gol
          </button>
        </div>
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
                className="rounded border border-navy/20 px-2 py-1 text-sm"
                value={goal.minute}
                onChange={(event) => {
                  const next = [...goals];
                  next[index] = { ...goal, minute: Number(event.target.value) };
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
              setCards([...cards, { playerId: selected[0]?.playerId ?? players[0]?.id ?? "", type: "YELLOW", minute: 1 }])
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
              setPenaltyMisses([
                ...penaltyMisses,
                { playerId: selected[0]?.playerId ?? players[0]?.id ?? "", minute: 1 },
              ])
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
          SportDC skor protivnika: {goalsAgainst == null ? "još nije poznat" : goalsAgainst}. Unesite minutu svakog
          primljenog gola da bi clean sheet mogao da ostane igraču koji je izašao prije gola. Bez minuta, clean sheet se
          ne dodjeljuje ako je tim primio gol.
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
