import { PlayerForm } from "@/components/admin/PlayerForm";
import { createPlayerAction } from "../actions";
import { isBlobConfigured } from "@/lib/uploads/player-photo";

export default async function NewPlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-navy">Novi igrač</h1>
      <PlayerForm action={createPlayerAction} error={error} blobConfigured={isBlobConfigured()} />
    </div>
  );
}
