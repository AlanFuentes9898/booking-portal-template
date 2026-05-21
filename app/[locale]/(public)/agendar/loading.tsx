export default function Loading() {
  return (
    <div className="bg-[color:var(--color-brand-green-soft)]/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="mb-8 lg:mb-10 text-center lg:text-left">
          <div className="h-3 w-32 rounded-full bg-[color:var(--color-brand-ink)]/10 animate-pulse" />
          <div className="mt-3 h-10 w-2/3 rounded-2xl bg-[color:var(--color-brand-ink)]/10 animate-pulse" />
        </div>

        {/* Stepper placeholder */}
        <div className="flex items-center gap-3 mb-10">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-1 h-2 rounded-full bg-[color:var(--color-brand-ink)]/10 animate-pulse"
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-10">
          <div className="space-y-4">
            <div className="h-48 rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/8 animate-pulse" />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="h-36 rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/8 animate-pulse" />
              <div className="h-36 rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/8 animate-pulse" />
            </div>
          </div>
          <div className="h-72 rounded-3xl bg-white border border-[color:var(--color-brand-ink)]/8 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
