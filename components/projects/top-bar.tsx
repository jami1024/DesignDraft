import Link from "next/link";

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 -mx-6 flex h-14 items-center border-b border-[#E7E5E4]/60 bg-[#FAFAF9]/80 px-6 backdrop-blur-xl transition-colors sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10 dark:border-[#44403C]/40 dark:bg-[#1C1917]/80">
      <Link
        href="/"
        aria-label="返回首页"
        className="font-serif text-lg font-bold tracking-tight text-[#1C1917] transition-colors hover:text-[#57534E] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 dark:text-[#FAFAF9] dark:hover:text-[#D6D3D1]"
      >
        DesignDraft
      </Link>
    </header>
  );
}
