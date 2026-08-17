export function FantasyFormChart({
  values,
  labels,
}: {
  values: number[];
  labels?: string[];
}) {
  if (values.length === 0) {
    return <p className="text-sm text-muted">Još nema kola za prikaz forme.</p>;
  }

  const max = Math.max(1, ...values.map((value) => Math.abs(value)));

  return (
    <div className="flex items-end gap-2 sm:gap-3">
      {values.map((value, index) => {
        const height = Math.max(8, Math.round((Math.abs(value) / max) * 96));
        return (
          <div key={`${labels?.[index] ?? index}-${value}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <span className="font-display text-sm tabular-nums text-navy">{value}</span>
            <div
              className={`w-full max-w-10 rounded-t ${value < 0 ? "bg-red" : "bg-gold"}`}
              style={{ height }}
              title={labels?.[index] ? `${labels[index]}: ${value}` : String(value)}
            />
            {labels?.[index] ? <span className="text-[10px] uppercase tracking-wide text-muted">{labels[index]}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
