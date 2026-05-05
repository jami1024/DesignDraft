"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { TopBar } from "@/components/projects/top-bar";
import { CommandZone } from "@/components/projects/command-zone";
import { ProjectGallery } from "@/components/projects/project-gallery";

function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      <div
        className="absolute h-[600px] w-[600px] rounded-full"
        style={{
          left: "10%",
          top: "-10%",
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          animation: "aurora1 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute h-[500px] w-[500px] rounded-full"
        style={{
          right: "5%",
          top: "30%",
          background: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)",
          animation: "aurora2 22s ease-in-out infinite 3s",
        }}
      />
      <div
        className="absolute h-[550px] w-[550px] rounded-full"
        style={{
          left: "30%",
          bottom: "-5%",
          background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
          animation: "aurora3 20s ease-in-out infinite 5s",
        }}
      />
    </div>
  );
}

export default function ProjectsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [showCommandZone, setShowCommandZone] = useState(false);
  const userToggled = useRef(false);

  const isLoaded = projectCount !== null;
  const hasProjects = isLoaded && projectCount > 0;

  const handleProjectCountChange = useCallback((count: number) => {
    setProjectCount(count);
  }, []);

  const handleNewProject = useCallback(() => {
    userToggled.current = true;
    setShowCommandZone(true);
  }, []);

  const handleCollapse = useCallback(() => {
    setShowCommandZone(false);
  }, []);

  const handleSuggestionClick = useCallback((text: string) => {
    userToggled.current = true;
    setShowCommandZone(true);
    setTimeout(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
        nativeSetter?.call(textarea, text);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.focus();
      }
    }, 150);
  }, []);

  const showFullCommandZone = isLoaded && (!hasProjects || showCommandZone);

  return (
    <main className="relative min-h-screen overflow-hidden px-6 sm:px-8 lg:px-10">
      <div className="absolute inset-0 bg-[#FAFAF9] dark:bg-[#1C1917]" />
      <AuroraBackground />

      <div className="relative z-10 mx-auto max-w-4xl">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, filter: "blur(4px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5 }}
        >
          <TopBar />
        </motion.div>

        <AnimatePresence initial={false}>
          {showFullCommandZone && (
            <motion.div
              key="command-zone"
              className={hasProjects ? "pb-4 pt-2" : "pb-6 pt-6 sm:pt-8"}
              initial={userToggled.current && !shouldReduceMotion ? { opacity: 0, y: -12, scale: 0.98 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
            >
              <CommandZone />
              {hasProjects && (
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={handleCollapse}
                    className="text-xs text-[#A8A29E] transition-colors hover:text-[#78716C] dark:text-[#78716C] dark:hover:text-[#A8A29E]"
                  >
                    收起
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="pb-10"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <ProjectGallery
            onSuggestionClick={handleSuggestionClick}
            onProjectCountChange={handleProjectCountChange}
            onNewProject={handleNewProject}
          />
        </motion.div>
      </div>
    </main>
  );
}
