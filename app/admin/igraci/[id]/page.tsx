import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { PlayerForm } from "@/components/admin/PlayerForm";
import { PlayerPhoto } from "@/components/players/PlayerCard";
import { playerFullName } from "@/lib/format";
import { orNotFound } from "@/lib/not-found";
import { getPlayer, getPlayerUsage } from "@/lib/players";
import { isBlobConfigured } from "@/lib/uploads/player-photo";
import { deactivatePlayerAction, deletePlayerAction, updatePlayerAction } from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> };

export default async function EditPlayerPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { error } = await searchParams;
  let player;
  try {
    player = await getPlayer(id);
  } catch (caught) {
    orNotFound(caught);
  }

  const usage = await getPlayerUsage(player.id);
  const update = updatePlayerAction.bind(null, player.id, player.slug);
  const deactivate = deactivatePlayerAction.bind(null, player.id);
  const remove = deletePlayerAction.bind(null, player.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-lg border border-navy/10">
          <PlayerPhoto player={player} size="sm" />
        </div>
        <div>
          <h1 className="font-display text-3xl text-navy">{playerFullName(player)}</h1>
          <p className="text-sm text-muted">{player.active ? "Aktivan" : "Neaktivan"} · /igraci/{player.slug}</p>
        </div>
      </div>
      <PlayerForm action={update} error={error} defaults={player} blobConfigured={isBlobConfigured()} />
      <div className="flex flex-wrap gap-4">
        {player.active ? (
          <ConfirmSubmit action={deactivate} message="Deaktivirati igrača? Nestat će sa javne liste.">
            <button type="submit" className="text-sm text-red hover:underline">
              Deaktiviraj igrača
            </button>
          </ConfirmSubmit>
        ) : null}
        {usage.canDelete ? (
          <ConfirmSubmit
            action={remove}
            message="Trajno obrisati igrača? Ovo se ne može poništiti."
          >
            <button type="submit" className="text-sm text-red hover:underline">
              Obriši igrača
            </button>
          </ConfirmSubmit>
        ) : (
          <p className="text-sm text-muted">
            Brisanje nije sigurno: ima {usage.appearances} nastupa, {usage.goals} golova, {usage.assists}{" "}
            asistencija, {usage.cards} kartona. Koristite deaktivaciju.
          </p>
        )}
      </div>
    </div>
  );
}
