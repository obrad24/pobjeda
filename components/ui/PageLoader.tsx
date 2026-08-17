export function PageLoader() {
  return (
    <div className="relative min-h-[50vh]" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Učitavanje stranice</span>
      <div className="page-loader-bar-track" aria-hidden>
        <div className="page-loader-bar" />
      </div>
      <div className="page-loader-body">
        <div className="page-loader-spinner" aria-hidden />
        <p className="page-loader-label">Učitavanje…</p>
      </div>
    </div>
  );
}
