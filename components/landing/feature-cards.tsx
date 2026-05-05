"use client";

import { Eye, Sparkles, Upload } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  step: number;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: Upload,
    step: 1,
    title: "录入需求",
    description: "支持上传文档、粘贴文字或拖入原型图，灵活适配你的工作方式",
  },
  {
    icon: Sparkles,
    step: 2,
    title: "AI 智能分析",
    description: "自动理解需求内容，推荐多种页面方案和视觉方向供你选择",
  },
  {
    icon: Eye,
    step: 3,
    title: "预览与迭代",
    description: "生成可交互的 HTML 演示页，支持点选修改和对话式持续优化",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export function FeatureCards() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="border-t border-[#E7E5E4] bg-white px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 dark:border-[#44403C] dark:bg-[#292524]"
    >
      <div className="mx-auto max-w-4xl">
        <h2 className="text-center font-serif text-xl font-bold text-[#1C1917] sm:text-2xl dark:text-[#FAFAF9]">
          从需求到演示，三步完成
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-[#78716C] dark:text-[#A8A29E]">
          无论你是产品经理、设计师还是开发者，都能快速上手
        </p>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-3"
          variants={containerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-warm-md motion-reduce:transition-none dark:border-[#44403C] dark:bg-[#1C1917] dark:hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.4)]"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] dark:bg-[#172554]/40">
                <feature.icon className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
              </div>

              <span className="mt-4 inline-block text-xs font-semibold text-[#3B82F6] dark:text-[#60A5FA]">
                步骤 {feature.step}
              </span>
              <h3 className="mt-1 text-base font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#78716C] dark:text-[#A8A29E]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
