import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { WorkbenchLayout } from "@/components/workbench/workbench-layout";
import { getProject, listSourceDocuments } from "@/lib/storage";

type ProjectWorkbenchPageProps = {
  params: {
    projectId: string;
  };
};

export default async function ProjectWorkbenchPage({ params }: ProjectWorkbenchPageProps) {
  const project = await getProject(params.projectId);

  if (!project) {
    notFound();
  }

  const [documents] = await Promise.all([listSourceDocuments(project.id)]);
  const latestDocumentId = documents[0]?.id ?? null;

  return (
    <main className="flex min-h-screen flex-col bg-warm-bg text-warm-text">
      <header className="sticky top-0 z-20 border-b border-[#E7E5E4]/60 bg-[#FAFAF9]/80 px-5 py-2.5 backdrop-blur-xl transition-colors sm:px-8 dark:border-[#44403C]/40 dark:bg-[#1C1917]/80">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link
            href="/projects"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#A8A29E] transition-colors duration-150 hover:bg-[#F5F5F4] hover:text-[#1C1917] focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 dark:text-[#78716C] dark:hover:bg-[#292524] dark:hover:text-[#FAFAF9]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <h1 className="truncate font-serif text-sm font-bold tracking-tight text-[#1C1917] sm:text-base dark:text-[#FAFAF9]">{project.name}</h1>
        </div>
      </header>

      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <WorkbenchLayout
            projectId={project.id}
            projectName={project.name}
            initialLatestDocumentId={latestDocumentId}
            initialTextInput={project.textInput ?? null}
          />
        </div>
      </div>
    </main>
  );
}
