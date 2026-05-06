"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

const SUGGESTIONS = [
  "SaaS 产品定价页面",
  "季度汇报演示页面",
  "移动端 APP 功能介绍",
];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } },
};

const chipVariants: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function EmptyCanvas({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="rounded-2xl border border-[#E7E5E4] bg-gradient-to-b from-white to-[#FAFAF9] px-6 py-16 text-center dark:border-[#44403C] dark:from-[#292524] dark:to-[#1C1917]"
      initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center">
        <svg viewBox="0 0 80 80" fill="none" className="h-full w-full">
          <motion.circle
            cx="40" cy="28" r="10"
            fill="rgba(59,130,246,0.04)" stroke="#D6D3D1" strokeWidth="1.5" className="dark:stroke-[#57534E]"
            animate={shouldReduceMotion ? {} : { y: [0, -3, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.rect
            x="18" y="45" width="16" height="16" rx="3"
            fill="rgba(245,158,11,0.04)" stroke="#D6D3D1" strokeWidth="1.5" className="dark:stroke-[#57534E]"
            animate={shouldReduceMotion ? {} : { y: [0, 3, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.polygon
            points="56,62 48,48 64,48"
            fill="rgba(139,92,246,0.04)" stroke="#D6D3D1" strokeWidth="1.5" className="dark:stroke-[#57534E]"
            animate={shouldReduceMotion ? {} : { y: [0, -2, 0], rotate: [0, 4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          <motion.line
            x1="34" y1="38" x2="30" y2="45" stroke="#E7E5E4" strokeWidth="1" strokeDasharray="2 2" className="dark:stroke-[#44403C]"
            animate={shouldReduceMotion ? {} : { opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.line
            x1="46" y1="38" x2="52" y2="48" stroke="#E7E5E4" strokeWidth="1" strokeDasharray="2 2" className="dark:stroke-[#44403C]"
            animate={shouldReduceMotion ? {} : { opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          />
        </svg>
      </div>

      <h3 className="font-serif text-lg font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
        你的演示工坊，空空如也
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#57534E] dark:text-[#A8A29E]">
        在上方描述你想要的演示页面，或拖入文档，AI 将帮你分析并生成
      </p>

      <div className="mt-8">
        <p className="mb-3 text-xs font-medium text-[#A8A29E] dark:text-[#78716C]">试试这些</p>
        <motion.div
          className="flex flex-wrap justify-center gap-2"
          variants={shouldReduceMotion ? undefined : containerVariants}
          initial="hidden"
          animate="show"
        >
          {SUGGESTIONS.map((text) => (
            <motion.button
              key={text}
              type="button"
              variants={shouldReduceMotion ? undefined : chipVariants}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={() => onSuggestionClick(text)}
              className="rounded-full bg-[#EFF6FF] px-3.5 py-1.5 text-xs font-medium text-[#2563EB] transition-colors duration-150 hover:bg-[#DBEAFE] hover:shadow-sm focus-visible:ring-2 focus-visible:ring-[#3B82F6]/50 focus-visible:ring-offset-2 dark:bg-[#1e3a8a]/20 dark:text-[#60A5FA] dark:hover:bg-[#1e3a8a]/30"
            >
              {text}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
