"use client";

import Link from "next/link";
import { ArrowRight, FileText, Layers, Palette, Repeat } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { ProductMockup } from "./product-mockup";

const stats = [
  { value: "3", label: "步骤完成", icon: FileText },
  { value: "5", label: "风格预设", icon: Palette },
  { value: "∞", label: "对话迭代", icon: Repeat, ariaLabel: "无限次对话迭代" },
  { value: "0", label: "需要编码", icon: Layers },
];

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  const init = (delay: number) => shouldReduceMotion ? false : { opacity: 0, y: 20, filter: "blur(6px)" };
  const anim = { opacity: 1, y: 0, filter: "blur(0px)" };
  const trans = (delay: number) => ({ duration: 0.6, delay, ease: "easeOut" as const });

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-6 pb-12 pt-16 sm:px-8 sm:pt-20 lg:px-10 lg:pt-24">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div>
            <motion.h1
              className="font-serif text-4xl font-bold leading-[1.15] text-[#1C1917] sm:text-5xl lg:text-6xl dark:text-[#FAFAF9]"
              initial={init(0)}
              animate={anim}
              transition={trans(0)}
            >
              把需求变成
              <br />
              <span className="text-[#2563EB] underline decoration-[#2563EB]/30 decoration-[3px] underline-offset-[6px] dark:text-[#60A5FA] dark:decoration-[#60A5FA]/30">
                可交互的
              </span>
              <br />
              演示页面。
            </motion.h1>

            <motion.p
              className="mt-6 max-w-md text-base leading-relaxed text-[#57534E] dark:text-[#A8A29E]"
              initial={init(0.15)}
              animate={anim}
              transition={trans(0.15)}
            >
              告别设计稿和代码，只需描述需求，AI
              帮你生成、修改、迭代演示页面。
            </motion.p>

            <motion.div
              className="mt-8"
              initial={init(0.3)}
              animate={anim}
              transition={trans(0.3)}
            >
              <Link
                href="/projects"
                className="group inline-flex h-11 items-center gap-2 rounded-md bg-[#1C1917] px-6 text-sm font-semibold text-white shadow-warm-sm transition-all duration-150 hover:bg-[#44403C] hover:shadow-warm-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#1C1917] focus-visible:ring-offset-2 dark:bg-[#FAFAF9] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4]"
              >
                开始使用
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="mt-12 lg:mt-0"
            initial={init(0.4)}
            animate={anim}
            transition={trans(0.4)}
          >
            <ProductMockup />
          </motion.div>
        </div>

        <motion.div
          className="mt-16 border-t border-[#E7E5E4] pt-8 dark:border-[#44403C]"
          initial={init(0.5)}
          animate={anim}
          transition={trans(0.5)}
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  aria-label={stat.ariaLabel ?? `${stat.value} ${stat.label}`}
                  className="flex items-center gap-3 rounded-xl border border-[#E7E5E4]/60 bg-white/60 px-4 py-3 backdrop-blur-sm dark:border-[#44403C]/60 dark:bg-[#292524]/60"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F5F4] text-[#78716C] dark:bg-[#1C1917] dark:text-[#A8A29E]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-serif text-2xl font-bold tracking-tight text-[#1C1917] dark:text-[#FAFAF9]">
                      {stat.value}
                    </div>
                    <div className="text-xs font-medium text-[#78716C] dark:text-[#A8A29E]">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
