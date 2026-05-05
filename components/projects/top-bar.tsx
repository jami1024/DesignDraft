import Link from "next/link";

export function TopBar() {
  return (
    <header className="flex h-12 items-center">
      <Link
        href="/"
        className="font-serif text-lg font-bold text-[#1C1917] transition-colors hover:text-[#44403C] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 dark:text-[#FAFAF9] dark:hover:text-[#E7E5E4]"
      >
        DesignDraft
      </Link>
    </header>
  );
}
