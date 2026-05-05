"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export function BottomCta() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      className="border-t border-[#E7E5E4] bg-[#EFF6FF] px-6 py-20 sm:px-8 sm:py-28 lg:px-10 dark:border-[#44403C] dark:bg-[#172554]/30"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-2xl font-bold text-[#1C1917] sm:text-3xl dark:text-[#FAFAF9]">
          准备好了吗？
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-[#78716C] sm:text-base dark:text-[#A8A29E]">
          创建你的第一个项目，体验从需求到演示页面的完整流程。
        </p>
        <Link
          href="/projects"
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-[#1C1917] px-6 text-sm font-semibold text-white shadow-warm-sm transition-colors duration-150 hover:bg-[#44403C] focus-visible:ring-2 focus-visible:ring-[#1C1917] focus-visible:ring-offset-2 motion-reduce:transition-none dark:bg-[#FAFAF9] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
        >
          开始使用
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.section>
  );
}
