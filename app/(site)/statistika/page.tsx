import type { Metadata } from "next";
import { sortPlayerStats, STAT_SORTS, StatsTable, type StatSort } from "@/components/players/StatsTable";
import { Container, EmptyState, PageHeader } from "@/components/ui/Section";
import { getCachedSeasonStats } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Statistika",
  description: "Nastupi, minute, golovi, asistencije i kartoni igrača FK Pobjeda Triješnica.",
};

function parseSort(value: string | string[] | undefined): StatSort {
  const raw = Array.isArray(value) ? value[0] : value;
  return STAT_SORTS.some((item) => item.id === raw) ? (raw as StatSort) : "goals";
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const sort = parseSort(params.sort);
  const rows = sortPlayerStats(await getCachedSeasonStats(), sort);

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        eyebrow="Sezona"
        title="Statistika"
        description="Agregati se računaju iz sastava, golova i kartona. Kliknite naziv kolone za sortiranje."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="Statistika će biti dostupna nakon prvih utakmica"
          body="Dok admin ne unese sastav, ovdje ne prikazujemo nule kao da je sezona već odigrana."
        />
      ) : (
        <StatsTable rows={rows} sort={sort} />
      )}
    </Container>
  );
}
