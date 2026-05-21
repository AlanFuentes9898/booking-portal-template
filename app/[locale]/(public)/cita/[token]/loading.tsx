export default function Loading() {
  return (
    <div className="bg-[color:var(--color-brand-green-soft)]/15">
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="h-3 w-20 rounded-full bg-[color:var(--color-brand-ink)]/10 animate-pulse" />
          <div className="h-10 w-2/3 rounded-2xl bg-[color:var(--color-brand-ink)]/10 animate-pulse" />
          <div className="h-7 w-32 rounded-full bg-[color:var(--color-brand-ink)]/10 animate-pulse" />
        </div>
        <div className="mt-10 h-72 rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/10 animate-pulse" />
        <div className="mt-5 h-16 rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/10 animate-pulse" />
      </section>
    </div>
  );
}
