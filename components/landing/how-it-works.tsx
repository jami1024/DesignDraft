"use client";

import { ChevronRight, FileText, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

interface Step {
  number: number;
  title: string;
  description: string;
  mockType: "input" | "processing" | "preview";
}

const steps: Step[] = [
  {
    number: 1,
    title: "输入需求",
    description: "粘贴文字需求，或上传 .md / .txt 文件",
    mockType: "input",
  },
  {
    number: 2,
    title: "AI 分析生成",
    description: "自动理解需求，推荐页面方案，一键生成",
    mockType: "processing",
  },
  {
    number: 3,
    title: "预览并迭代",
    description: "查看可交互的 HTML 页面，点选或对话修改",
    mockType: "preview",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2, delayChildren: 0.1 } },
};

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

function InputMock() {
  return (
    <div className="space-y-3 p-4">
      <div className="rounded-lg border border-dashed border-[#D6D3D1] p-3 dark:border-[#57534E]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#A8A29E] dark:text-[#78716C]" />
          <span className="text-[11px] text-[#A8A29E] dark:text-[#78716C]">上传文件或粘贴文字</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-full rounded bg-[#E7E5E4] dark:bg-[#44403C]" />
        <div className="h-2 w-4/5 rounded bg-[#E7E5E4] dark:bg-[#44403C]" />
        <div className="h-2 w-3/5 rounded bg-[#E7E5E4] dark:bg-[#44403C]" />
      </div>
      <div className="h-7 w-20 rounded-md bg-[#D6D3D1] dark:bg-[#57534E]" />
    </div>
  );
}

function ProcessingMock() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-[spin_4s_linear_infinite] rounded-full border-2 border-transparent border-t-[#3B82F6] motion-reduce:animate-none dark:border-t-[#60A5FA]" />
        <div className="absolute inset-2 animate-[spin_3s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-[#93C5FD] motion-reduce:animate-none dark:border-b-[#3B82F6]" />
        <Sparkles className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
      </div>
      <span className="mt-3 text-[11px] font-medium text-[#2563EB] dark:text-[#60A5FA]">分析中...</span>
    </div>
  );
}

function PreviewMock() {
  return (
    <div className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="h-2 w-8 rounded bg-[#E7E5E4] dark:bg-[#44403C]" />
        <div className="flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2 py-0.5 dark:bg-[#052E16]">
          <div className="h-1.5 w-1.5 rounded-full bg-[#10B981] dark:bg-[#34D399]" />
          <span className="text-[10px] font-medium text-[#10B981] dark:text-[#34D399]">完成</span>
        </div>
      </div>
      <div className="space-y-2 rounded-lg border border-[#E7E5E4] bg-white p-3 dark:border-[#44403C] dark:bg-[#292524]">
        <div className="h-3 w-2/3 rounded bg-[#E7E5E4] dark:bg-[#44403C]" />
        <div className="h-2 w-full rounded bg-[#F5F5F4] dark:bg-[#3A3632]" />
        <div className="h-2 w-5/6 rounded bg-[#F5F5F4] dark:bg-[#3A3632]" />
        <div className="mt-2 flex gap-2">
          <div className="h-6 w-14 rounded bg-[#D6D3D1] dark:bg-[#57534E]" />
          <div className="h-6 w-14 rounded border border-[#E7E5E4] dark:border-[#44403C]" />
        </div>
      </div>
    </div>
  );
}

const mockComponents = {
  input: InputMock,
  processing: ProcessingMock,
  preview: PreviewMock,
};

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="border-t border-[#E7E5E4] bg-[#FAFAF9] px-6 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24 dark:border-[#44403C] dark:bg-[#1C1917]">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center font-serif text-xl font-bold text-[#1C1917] sm:text-2xl dark:text-[#FAFAF9]">
          三步完成，从构思到演示
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-[#78716C] dark:text-[#A8A29E]">
          无需设计技能，无需编写代码
        </p>

        <motion.div
          className="mt-12 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:gap-0"
          variants={containerVariants}
          initial={shouldReduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {steps.map((step, index) => {
            const MockComponent = mockComponents[step.mockType];
            return (
              <div key={step.number} className="flex flex-1 items-center">
                <motion.div
                  variants={stepVariants}
                  className="flex-1 overflow-hidden rounded-xl border border-[#E7E5E4] bg-white dark:border-[#44403C] dark:bg-[#292524]"
                >
                  <div className="h-36 bg-[#FAFAF9] dark:bg-[#1C1917]">
                    <MockComponent />
                  </div>
                  <div className="border-t border-[#E7E5E4] p-4 dark:border-[#44403C]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-[11px] font-bold text-white dark:bg-[#3B82F6]">
                        {step.number}
                      </span>
                      <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
                        {step.title}
                      </h3>
                    </div>
                    <p className="mt-1.5 pl-[34px] text-xs leading-relaxed text-[#78716C] dark:text-[#A8A29E]">
                      {step.description}
                    </p>
                  </div>
                </motion.div>

                {index < steps.length - 1 && (
                  <div className="hidden shrink-0 px-3 lg:block">
                    <ChevronRight className="h-5 w-5 text-[#D6D3D1] dark:text-[#57534E]" />
                  </div>
                )}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
