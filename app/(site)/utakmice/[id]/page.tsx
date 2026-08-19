import type { Metadata } from "next";
import { MatchEvents, MatchHero, MatchLineup } from "@/components/match/MatchDetail";
import { Container } from "@/components/ui/Section";
import { getOurTeam } from "@/lib/context";
import { isOurMatch } from "@/lib/format";
import { getMatch } from "@/lib/matches";
import { orNotFound } from "@/lib/not-found";

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const match = await getMatch(id);
    return {
      title: `${match.homeTeam.sportdcName} – ${match.awayTeam.sportdcName}`,
    };
  } catch (error) {
    orNotFound(error);
  }
}

export default async function MatchPage({ params }: Props) {
  const { id } = await params;
  let match;
  try {
    match = await getMatch(id);
  } catch (error) {
    orNotFound(error);
  }

  const ourTeam = await getOurTeam();
  const ours = isOurMatch(match, ourTeam.id);

  return (
    <>
      <MatchHero match={match} />
      <Container className="space-y-8 py-10 sm:py-14">
        {ours ? (
          <>
            <MatchEvents match={match} />
            <MatchLineup match={match} />
          </>
        ) : (
          <p className="glass-card rounded-2xl px-4 py-6 text-sm text-white/50">
            Za utakmice lige bez učešća FK Pobjeda prikazuju se par, kolo i rezultat sa SportDC-a. Sastav se vodi samo za naše mečeve.
          </p>
        )}
      </Container>
    </>
  );
}
