import type { Metadata } from "next";
import { Container, EmptyState, PageHeader } from "@/components/ui/Section";
import { ClubLogo } from "@/components/ui/ClubLogo";
import { getCachedHistory } from "@/lib/site-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Istorija",
  description: "Istorija FK Pobjeda Triješnica — osnivanje, identitet i put kluba.",
};

export default async function HistoryPage() {
  const entries = await getCachedHistory();

  return (
    <div>
      <section className="hero-panel text-white">
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <ClubLogo size="lg" className="mb-6" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Klub od 1976.</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Istorija FK Pobjeda Triješnica
          </h1>
          <p className="mt-4 max-w-xl text-white/60">
            Priča kluba iz Triješnice. Sadržaj se vodi u bazi i uređuje iz admin panela.
          </p>
        </div>
      </section>

      <Container className="py-12 sm:py-16">
        <PageHeader
          eyebrow="Hronologija"
          title="Put kluba"
          description="Od osnivanja do aktuelne sezone u Prvoj opštinskoj ligi Bijeljina."
        />
        {entries.length === 0 ? (
          <EmptyState
            title="Istorija se priprema"
            body="Tekstovi će biti uneseni kroz admin. Do tada ostaje ova stranica kao okvir priče kluba."
          />
        ) : (
          <ol className="relative space-y-8 border-l-2 border-gold/40 pl-6 sm:pl-10">
            {entries.map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.85rem] top-1 h-4 w-4 rounded-full border-2 border-gold bg-navy-dark sm:-left-[2.35rem]" />
                <article className="glass-card rounded-2xl p-5 sm:p-7">
                  {entry.year ? (
                    <p className="font-display text-gold-dark">{entry.year}</p>
                  ) : null}
                  <h2 className="mt-1 font-display text-2xl text-white">{entry.title}</h2>
                  <p className="mt-3 whitespace-pre-line leading-7 text-white/70">{entry.body}</p>
                </article>
              </li>
            ))}
          </ol>
        )}
      </Container>
    </div>
  );
}
