import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { PrototypeWorkbench } from "@/components/prototypes/prototype-workbench";
import { WorkbenchLayout } from "@/components/workbench/workbench-layout";
import { getPage, getPageVersion, getProject, listPageSuggestions, listSourceDocuments, readPageHtml } from "@/lib/storage";

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

  const documents = await listSourceDocuments(project.id);
  const latestDocumentId = documents[0]?.id ?? null;

  const lastPageId = project.pageIds[project.pageIds.length - 1] ?? null;
  let initialPageId: string | null = null;
  let initialPageName: string | null = null;
  let initialHtml: string | null = null;
  let initialVersionCount = 0;
  let initialPreviewPath: string | null = null;
  let initialSuggestion: import("@/types").PageSuggestion | null = null;

  if (lastPageId) {
    const page = await getPage(project.id, lastPageId);
    if (page) {
      const [version, html, suggestions] = await Promise.all([
        getPageVersion(project.id, page.id, page.currentVersionId),
        readPageHtml(project.id, page.id, page.currentVersionId),
        listPageSuggestions(project.id),
      ]);
      if (version && html) {
        initialPageId = page.id;
        initialPageName = page.name;
        initialHtml = html;
        initialVersionCount = version.versionNumber;
        initialPreviewPath = version.previewPath;
        initialSuggestion = suggestions.find((s) => s.id === page.suggestionId) ?? null;
      }
    }
  }

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
          <Link
            href={`/projects/${project.id}/studio`}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-md bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-primary-700 motion-reduce:transition-none dark:bg-primary-500 dark:hover:bg-primary-400"
          >
            <Sparkles className="h-3.5 w-3.5" />
            React 生成
          </Link>
        </div>
      </header>

      <div className="flex-1">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {project.creationContext ? (
            <PrototypeWorkbench project={project} />
          ) : (
            <WorkbenchLayout
              projectId={project.id}
              projectName={project.name}
              initialLatestDocumentId={latestDocumentId}
              initialTextInput={project.textInput ?? null}
              initialPageId={initialPageId}
              initialPageName={initialPageName}
              initialHtml={initialHtml}
              initialVersionCount={initialVersionCount}
              initialPreviewPath={initialPreviewPath}
              initialSuggestion={initialSuggestion}
            />
          )}
        </div>
      </div>
    </main>
  );
}
