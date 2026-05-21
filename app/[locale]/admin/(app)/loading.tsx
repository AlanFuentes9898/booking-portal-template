export default function Loading() {
  return (
    <main className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">
      <div className="h-8 w-64 rounded-2xl bg-[color:var(--color-brand-ink)]/10 animate-pulse" />
      <div className="mt-2 h-4 w-80 rounded-full bg-[color:var(--color-brand-ink)]/10 animate-pulse" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 animate-pulse"
          />
        ))}
      </div>

      <div className="space-y-2 mb-8">
        <div className="h-5 w-20 rounded-full bg-[color:var(--color-brand-ink)]/10 animate-pulse mb-3" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 animate-pulse"
          />
        ))}
      </div>
    </main>
  );
}
