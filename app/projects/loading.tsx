function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white p-5 shadow-warm-xs dark:border-[#44403C] dark:bg-[#292524]">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-r from-[#E7E5E4] via-[#F5F5F4] to-[#E7E5E4] bg-[length:200%_100%] animate-shimmer dark:from-[#44403C] dark:via-[#57534E] dark:to-[#44403C]" />
        <div className="flex-1">
          <div className="h-4 w-3/4 rounded bg-gradient-to-r from-[#E7E5E4] via-[#F5F5F4] to-[#E7E5E4] bg-[length:200%_100%] animate-shimmer dark:from-[#44403C] dark:via-[#57534E] dark:to-[#44403C]" />
          <div className="mt-2 h-3 w-1/2 rounded bg-gradient-to-r from-[#F5F5F4] via-[#FAFAF9] to-[#F5F5F4] bg-[length:200%_100%] animate-shimmer dark:from-[#3a3533] dark:via-[#44403C] dark:to-[#3a3533]" />
        </div>
      </div>
      <div className="mt-3 flex gap-3 border-t border-[#F5F5F4] pt-3 dark:border-[#44403C]">
        <div className="h-3 w-16 rounded bg-gradient-to-r from-[#F5F5F4] via-[#FAFAF9] to-[#F5F5F4] bg-[length:200%_100%] animate-shimmer dark:from-[#3a3533] dark:via-[#44403C] dark:to-[#3a3533]" />
        <div className="h-3 w-16 rounded bg-gradient-to-r from-[#F5F5F4] via-[#FAFAF9] to-[#F5F5F4] bg-[length:200%_100%] animate-shimmer dark:from-[#3a3533] dark:via-[#44403C] dark:to-[#3a3533]" />
      </div>
    </div>
  );
}

export default function ProjectsLoading() {
  return (
    <main className="relative min-h-screen px-6 sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[#FAFAF9] dark:bg-[#1C1917]" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* TopBar */}
        <header className="sticky top-0 z-20 -mx-6 flex h-14 items-center border-b border-[#E7E5E4]/60 bg-[#FAFAF9]/80 px-6 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10 dark:border-[#44403C]/40 dark:bg-[#1C1917]/80">
          <span className="font-serif text-lg font-bold tracking-tight text-[#1C1917] dark:text-[#FAFAF9]">
            DesignDraft
          </span>
        </header>

        {/* 紧凑 CommandZone 骨架 */}
        <div className="pb-4 pt-4">
          <div className="flex items-center gap-2.5 border-b border-[#E7E5E4] py-3 dark:border-[#44403C]">
            <div className="h-4 w-4 shrink-0 rounded bg-gradient-to-r from-[#E7E5E4] via-[#F5F5F4] to-[#E7E5E4] bg-[length:200%_100%] animate-shimmer dark:from-[#44403C] dark:via-[#57534E] dark:to-[#44403C]" />
            <div className="h-4 w-48 rounded bg-gradient-to-r from-[#F5F5F4] via-[#FAFAF9] to-[#F5F5F4] bg-[length:200%_100%] animate-shimmer dark:from-[#3a3533] dark:via-[#44403C] dark:to-[#3a3533]" />
          </div>
        </div>

        {/* Gallery 骨架 */}
        <section className="pb-10">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-24 rounded bg-gradient-to-r from-[#E7E5E4] via-[#F5F5F4] to-[#E7E5E4] bg-[length:200%_100%] animate-shimmer dark:from-[#44403C] dark:via-[#57534E] dark:to-[#44403C]" />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>
      </div>
    </main>
  );
}
