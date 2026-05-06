"use client";

import { useCallback, useState } from "react";

import { TopBar } from "@/components/projects/top-bar";
import { CommandZone } from "@/components/projects/command-zone";
import { ProjectGallery } from "@/components/projects/project-gallery";

function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
      <div
        className="absolute h-[600px] w-[600px] rounded-full"
        style={{
          left: "10%",
          top: "-10%",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
          animation: "aurora1 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute h-[500px] w-[500px] rounded-full"
        style={{
          right: "5%",
          top: "30%",
          background: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, transparent 70%)",
          animation: "aurora2 22s ease-in-out infinite 3s",
        }}
      />
      <div
        className="absolute h-[550px] w-[550px] rounded-full"
        style={{
          left: "30%",
          bottom: "-5%",
          background: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%)",
          animation: "aurora3 20s ease-in-out infinite 5s",
        }}
      />
    </div>
  );
}

export default function ProjectsPage() {
  const [projectCount, setProjectCount] = useState<number | null>(null);

  const isLoaded = projectCount !== null;
  const hasProjects = isLoaded && projectCount > 0;

  const handleProjectCountChange = useCallback((count: number) => {
    setProjectCount(count);
  }, []);

  const handleSuggestionClick = useCallback((text: string) => {
    setTimeout(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
        nativeSetter?.call(textarea, text);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.focus();
      }
    }, 50);
  }, []);

  return (
    <main className="relative min-h-screen px-6 sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[#FAFAF9] dark:bg-[#1C1917]" />
      <AuroraBackground />

      <div className="relative z-10 mx-auto max-w-5xl">
        <TopBar />

        <div className={hasProjects || !isLoaded ? "pb-4 pt-4" : "pb-6 pt-6 sm:pt-8"}>
          <CommandZone compact={hasProjects || !isLoaded} />
        </div>

        <div className="pb-10">
          <ProjectGallery
            onSuggestionClick={handleSuggestionClick}
            onProjectCountChange={handleProjectCountChange}
          />
        </div>
      </div>
    </main>
  );
}
