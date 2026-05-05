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
    <main className="min-h-screen bg-warm-bg text-warm-text">
      <header className="border-b border-warm-border-soft bg-warm-panel/80 backdrop-blur-sm px-5 py-2.5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <Link
            href="/projects"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-warm-text-soft transition-colors duration-150 hover:bg-warm-subtle hover:text-warm-text focus-visible:ring-2 focus-visible:ring-primary-500/50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <h1 className="truncate font-serif text-sm font-bold text-warm-text sm:text-base">{project.name}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8 lg:py-5">
        <WorkbenchLayout projectId={project.id} initialLatestDocumentId={latestDocumentId} />
      </div>
    </main>
  );
}
