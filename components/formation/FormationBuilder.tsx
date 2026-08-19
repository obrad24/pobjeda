"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { PlayerPhoto } from "@/components/players/PlayerCard";

type FormationPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  image: string | null;
  jerseyNumber: number | null;
  position: "GK" | "DF" | "MF" | "WG" | "FW";
};

type Slot = {
  id: string;
  role: string;
  x: number;
  y: number;
};

type Formation = {
  id: string;
  name: string;
  slots: Slot[];
};

const FORMATIONS: Formation[] = [
  {
    id: "4-4-2",
    name: "4-4-2",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("lb", "LB", 14, 70), slot("cb1", "CB", 38, 74), slot("cb2", "CB", 62, 74), slot("rb", "RB", 86, 70),
      slot("lm", "LM", 14, 47), slot("cm1", "CM", 38, 51), slot("cm2", "CM", 62, 51), slot("rm", "RM", 86, 47),
      slot("st1", "ST", 36, 22), slot("st2", "ST", 64, 22),
    ],
  },
  {
    id: "4-3-3",
    name: "4-3-3",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("lb", "LB", 14, 70), slot("cb1", "CB", 38, 74), slot("cb2", "CB", 62, 74), slot("rb", "RB", 86, 70),
      slot("cm1", "CM", 25, 49), slot("cm2", "CM", 50, 55), slot("cm3", "CM", 75, 49),
      slot("lw", "LW", 18, 23), slot("st", "ST", 50, 18), slot("rw", "RW", 82, 23),
    ],
  },
  {
    id: "4-2-3-1",
    name: "4-2-3-1",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("lb", "LB", 14, 71), slot("cb1", "CB", 38, 75), slot("cb2", "CB", 62, 75), slot("rb", "RB", 86, 71),
      slot("dm1", "DM", 36, 57), slot("dm2", "DM", 64, 57),
      slot("lw", "LW", 18, 38), slot("am", "AM", 50, 40), slot("rw", "RW", 82, 38),
      slot("st", "ST", 50, 17),
    ],
  },
  {
    id: "4-3-2-1",
    name: "4-3-2-1",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("lb", "LB", 14, 71), slot("cb1", "CB", 38, 75), slot("cb2", "CB", 62, 75), slot("rb", "RB", 86, 71),
      slot("cm1", "CM", 24, 54), slot("cm2", "CM", 50, 59), slot("cm3", "CM", 76, 54),
      slot("am1", "AM", 35, 35), slot("am2", "AM", 65, 35),
      slot("st", "ST", 50, 16),
    ],
  },
  {
    id: "4-1-4-1",
    name: "4-1-4-1",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("lb", "LB", 14, 71), slot("cb1", "CB", 38, 75), slot("cb2", "CB", 62, 75), slot("rb", "RB", 86, 71),
      slot("dm", "DM", 50, 59),
      slot("lm", "LM", 14, 40), slot("cm1", "CM", 38, 44), slot("cm2", "CM", 62, 44), slot("rm", "RM", 86, 40),
      slot("st", "ST", 50, 17),
    ],
  },
  {
    id: "4-4-1-1",
    name: "4-4-1-1",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("lb", "LB", 14, 71), slot("cb1", "CB", 38, 75), slot("cb2", "CB", 62, 75), slot("rb", "RB", 86, 71),
      slot("lm", "LM", 14, 49), slot("cm1", "CM", 38, 53), slot("cm2", "CM", 62, 53), slot("rm", "RM", 86, 49),
      slot("ss", "SS", 50, 33), slot("st", "ST", 50, 15),
    ],
  },
  {
    id: "3-5-2",
    name: "3-5-2",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("cb1", "CB", 24, 72), slot("cb2", "CB", 50, 76), slot("cb3", "CB", 76, 72),
      slot("lwb", "LWB", 10, 49), slot("cm1", "CM", 32, 53), slot("dm", "DM", 50, 61), slot("cm2", "CM", 68, 53), slot("rwb", "RWB", 90, 49),
      slot("st1", "ST", 36, 21), slot("st2", "ST", 64, 21),
    ],
  },
  {
    id: "3-4-3",
    name: "3-4-3",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("cb1", "CB", 24, 72), slot("cb2", "CB", 50, 76), slot("cb3", "CB", 76, 72),
      slot("lm", "LM", 13, 49), slot("cm1", "CM", 38, 54), slot("cm2", "CM", 62, 54), slot("rm", "RM", 87, 49),
      slot("lw", "LW", 18, 23), slot("st", "ST", 50, 17), slot("rw", "RW", 82, 23),
    ],
  },
  {
    id: "3-4-2-1",
    name: "3-4-2-1",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("cb1", "CB", 24, 72), slot("cb2", "CB", 50, 76), slot("cb3", "CB", 76, 72),
      slot("lm", "LM", 13, 51), slot("cm1", "CM", 38, 55), slot("cm2", "CM", 62, 55), slot("rm", "RM", 87, 51),
      slot("am1", "AM", 35, 34), slot("am2", "AM", 65, 34),
      slot("st", "ST", 50, 15),
    ],
  },
  {
    id: "5-3-2",
    name: "5-3-2",
    slots: [
      slot("gk", "GK", 50, 89),
      slot("lwb", "LWB", 9, 65), slot("cb1", "CB", 29, 73), slot("cb2", "CB", 50, 77), slot("cb3", "CB", 71, 73), slot("rwb", "RWB", 91, 65),
      slot("cm1", "CM", 25, 49), slot("cm2", "CM", 50, 55), slot("cm3", "CM", 75, 49),
      slot("st1", "ST", 36, 21), slot("st2", "ST", 64, 21),
    ],
  },
];

function slot(id: string, role: string, x: number, y: number): Slot {
  return { id, role, x, y };
}

function fullName(player: FormationPlayer): string {
  return `${player.firstName} ${player.lastName}`;
}

function expectedPosition(role: string): FormationPlayer["position"] {
  if (role === "GK") return "GK";
  if (/B$/.test(role) || role === "CB") return "DF";
  if (role === "ST" || role === "SS" || role === "LW" || role === "RW") return "FW";
  return "MF";
}

export function FormationBuilder({ players }: { players: FormationPlayer[] }) {
  const [formationId, setFormationId] = useState(FORMATIONS[1].id);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  const formation = FORMATIONS.find((item) => item.id === formationId) ?? FORMATIONS[1];
  const selectedIds = new Set(Object.values(assignments));
  const slotToEdit = formation.slots.find((item) => item.id === activeSlot);

  useEffect(() => {
    if (!activeSlot) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveSlot(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeSlot]);

  const availablePlayers = slotToEdit
    ? [...players]
      .filter((player) => !selectedIds.has(player.id) || assignments[slotToEdit.id] === player.id)
      .sort((a, b) => {
        const expected = expectedPosition(slotToEdit.role);
        const aMatch = a.position === expected || (expected === "FW" && a.position === "WG");
        const bMatch = b.position === expected || (expected === "FW" && b.position === "WG");
        if (aMatch !== bMatch) return aMatch ? -1 : 1;
        return fullName(a).localeCompare(fullName(b), "sr");
      })
    : [];

  function changeFormation(nextId: string) {
    setFormationId(nextId);
    setAssignments({});
    setActiveSlot(null);
  }

  function assignPlayer(playerId: string) {
    if (!activeSlot) return;
    setAssignments((current) => ({ ...current, [activeSlot]: playerId }));
    setActiveSlot(null);
  }

  function removePlayer() {
    if (!activeSlot) return;
    setAssignments((current) => {
      const next = { ...current };
      delete next[activeSlot];
      return next;
    });
    setActiveSlot(null);
  }

  return (
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,560px)_1fr]">
      <div className="min-w-0">
        <label className="mb-3 block sm:hidden">
          <span className="sr-only">Izaberi formaciju</span>
          <select
            value={formationId}
            onChange={(event) => changeFormation(event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#17123f] px-4 py-2.5 text-sm font-semibold text-white"
          >
            {FORMATIONS.map((item) => (
              <option key={item.id} value={item.id}>
                Formacija {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mb-3 hidden gap-2 overflow-x-auto pb-1 sm:flex">
          {FORMATIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => changeFormation(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                formationId === item.id
                  ? "bg-purple text-white shadow-[0_0_24px_rgba(124,58,237,.35)]"
                  : "border border-white/10 bg-white/5 text-white/60 hover:text-white"
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="relative mx-auto aspect-2/3 w-full max-w-130 overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(180deg,#79d3d8_0%,#61c2cb_100%)] shadow-2xl sm:rounded-4xl">
          <PitchMarkings />
          {formation.slots.map((fieldSlot) => {
            const player = players.find((item) => item.id === assignments[fieldSlot.id]);
            return (
              <button
                key={fieldSlot.id}
                type="button"
                onClick={() => setActiveSlot(fieldSlot.id)}
                aria-label={player ? `Promijeni ${fullName(player)}` : `Dodaj igrača na poziciju ${fieldSlot.role}`}
                className="absolute z-10 flex w-14 -translate-x-1/2 -translate-y-1/2 flex-col items-center min-[380px]:w-16 sm:w-24"
                style={{ left: `${fieldSlot.x}%`, top: `${fieldSlot.y}%` }}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 shadow-lg transition min-[380px]:h-12 min-[380px]:w-12 sm:h-14 sm:w-14 ${
                    player
                      ? "border-white bg-[#17123f]"
                      : "border-dashed border-white/70 bg-white/20 text-2xl text-white"
                  }`}
                >
                  {player ? <PlayerPhoto player={player} size="sm" /> : "+"}
                </span>
                <span className="mt-0.5 max-w-full truncate rounded-full bg-white/85 px-1.5 py-0.5 text-[8px] font-semibold leading-tight text-[#182c3b] shadow-sm min-[380px]:text-[9px] sm:mt-1 sm:px-2 sm:text-[11px]">
                  {player ? player.lastName : fieldSlot.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="glass-card rounded-2xl p-3 sm:p-4 lg:sticky lg:top-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-light">Tvoja ekipa</p>
            <h2 className="font-display text-2xl text-white">{formation.name}</h2>
          </div>
          <button
            type="button"
            onClick={() => setAssignments({})}
            disabled={selectedIds.size === 0}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:text-white disabled:opacity-30"
          >
            Očisti
          </button>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-purple transition-all"
            style={{ width: `${(selectedIds.size / 11) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/50">{selectedIds.size} od 11 igrača izabrano</p>
        <p className="mt-3 text-xs leading-5 text-white/60 sm:mt-4 sm:text-sm sm:leading-6">
          Dodirni praznu poziciju na terenu, zatim izaberi igrača. Dodirni popunjenu poziciju da ga zamijeniš ili ukloniš.
        </p>
      </aside>

      {activeSlot && slotToEdit
        ? createPortal(
            <div
              className="fixed inset-0 z-70 flex items-end justify-center bg-black/60 sm:items-center sm:p-3 sm:backdrop-blur-sm"
              onClick={() => setActiveSlot(null)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`Izbor igrača za ${slotToEdit.role}`}
                className="glass-dark max-h-[82dvh] w-full max-w-lg overflow-hidden rounded-t-3xl sm:max-h-[78vh] sm:rounded-3xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="text-xs text-white/40">Pozicija</p>
                    <h3 className="font-display text-xl text-white">{slotToEdit.role}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSlot(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-xl text-white/60"
                    aria-label="Zatvori"
                  >
                    ×
                  </button>
                </div>
                <div className="max-h-[68dvh] overflow-y-auto p-2 sm:max-h-[60vh]">
                  {assignments[activeSlot] ? (
                <button
                  type="button"
                  onClick={removePlayer}
                  className="mb-2 w-full rounded-xl border border-red/20 bg-red/10 px-4 py-3 text-left text-sm text-red"
                >
                  Ukloni igrača sa pozicije
                </button>
              ) : null}
                  {availablePlayers.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => assignPlayer(player.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/8"
                >
                  <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-navy-dark">
                    <PlayerPhoto player={player} size="sm" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{fullName(player)}</span>
                    <span className="text-xs text-white/40">
                      {player.position === "WG" ? "FW" : player.position}
                      {player.jerseyNumber != null ? ` · #${player.jerseyNumber}` : ""}
                    </span>
                  </span>
                  {player.position === expectedPosition(slotToEdit.role) ||
                  (expectedPosition(slotToEdit.role) === "FW" && player.position === "WG") ? (
                    <span className="rounded-full bg-purple/15 px-2 py-1 text-[10px] text-purple-light">Preporučeno</span>
                  ) : null}
                </button>
              ))}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function PitchMarkings() {
  return (
    <div className="pointer-events-none absolute inset-0 text-white/35" aria-hidden>
      <div className="absolute inset-4 rounded-2xl border border-current" />
      <div className="absolute left-4 right-4 top-1/2 border-t border-current" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-current" />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
      <div className="absolute left-1/2 top-4 h-[16%] w-[48%] -translate-x-1/2 border border-t-0 border-current" />
      <div className="absolute left-1/2 top-4 h-[7%] w-[23%] -translate-x-1/2 border border-t-0 border-current" />
      <div className="absolute bottom-4 left-1/2 h-[16%] w-[48%] -translate-x-1/2 border border-b-0 border-current" />
      <div className="absolute bottom-4 left-1/2 h-[7%] w-[23%] -translate-x-1/2 border border-b-0 border-current" />
    </div>
  );
}
