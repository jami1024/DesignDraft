import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ReactWorkbench } from "@/components/workbench/react-workbench";
import { getProject } from "@/lib/storage";

type StudioPageProps = {
  params: {
    projectId: string;
  };
};

export default async function ProjectStudioPage({ params }: StudioPageProps) {
  const project = await getProject(params.projectId);

  if (!project) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col bg-warm-bg text-warm-text">
      <header className="sticky top-0 z-20 border-b border-[#E7E5E4]/60 bg-[#FAFAF9]/80 px-5 py-2.5 backdrop-blur-xl transition-colors sm:px-8 dark:border-[#44403C]/40 dark:bg-[#1C1917]/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link
            href={`/projects/${project.id}`}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#A8A29E] transition-colors duration-150 hover:bg-[#F5F5F4] hover:text-[#1C1917] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 dark:text-[#78716C] dark:hover:bg-[#292524] dark:hover:text-[#FAFAF9]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <h1 className="truncate font-serif text-sm font-bold tracking-tight text-[#1C1917] sm:text-base dark:text-[#FAFAF9]">
            {project.name}
          </h1>
          <span className="rounded-sm bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            React 多文件生成
          </span>
        </div>
      </header>

      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <ReactWorkbench projectId={project.id} initialText={project.textInput ?? null} />
        </div>
      </div>
    </main>
  );
}
