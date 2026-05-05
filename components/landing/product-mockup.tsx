"use client";

import { useCallback, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

function MobileCard() {
  return (
    <div
      className="absolute left-0 top-0 z-10 w-[180px] origin-center rotate-[-3deg] overflow-hidden rounded-[20px] bg-[#1C1917] shadow-[0_25px_50px_-8px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-300 ease-out hover:z-40 hover:rotate-[-1deg] hover:scale-[1.04] hover:shadow-[0_30px_60px_-8px_rgba(0,0,0,0.45)] sm:w-[220px]"
    >
      <div className="relative flex justify-center pt-1.5">
        <div className="h-[5px] w-16 rounded-full bg-[#292524]" />
      </div>
      <div className="flex items-center justify-between px-4 pt-1 text-[8px] font-medium text-[#FAFAF9]/70">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <svg className="h-2 w-2.5" viewBox="0 0 12 8" fill="currentColor"><rect x="0" y="3" width="2" height="5" rx="0.5" opacity="0.4"/><rect x="3" y="2" width="2" height="6" rx="0.5" opacity="0.6"/><rect x="6" y="1" width="2" height="7" rx="0.5" opacity="0.8"/><rect x="9" y="0" width="2" height="8" rx="0.5"/></svg>
          <svg className="h-2 w-3" viewBox="0 0 14 8" fill="currentColor"><rect x="0.5" y="0.5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="11" y="2" width="2" height="4" rx="0.5"/><rect x="2" y="2" width="7" height="4" rx="0.5" opacity="0.7"/></svg>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-[#F59E0B]">每日习惯</div>
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#292524]">
            <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
          </div>
        </div>

        <div className="mt-2 font-serif text-[15px] font-bold leading-[1.2] text-[#FAFAF9]">
          养成更好的
          <br />
          <span className="italic text-[#F59E0B]">日常习惯</span>。
        </div>

        <div className="mt-2 text-[7px] leading-relaxed text-[#78716C]">
          追踪你的每一个小目标，让改变从今天开始。
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="#292524" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="88" strokeDashoffset="30" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-[#FAFAF9]">66%</span>
          </div>
          <div>
            <div className="text-[8px] font-semibold text-[#FAFAF9]">今日进度</div>
            <div className="text-[6px] text-[#78716C]">4 / 6 已完成</div>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 rounded-xl bg-[#292524] px-2.5 py-2">
            <span className="text-[10px]">🧘</span>
            <div className="flex-1">
              <div className="text-[7px] font-medium text-[#FAFAF9]">晨间冥想</div>
              <div className="text-[5.5px] text-[#78716C]">10 分钟 · 已坚持 23 天</div>
            </div>
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#10B981]">
              <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#292524] px-2.5 py-2">
            <span className="text-[10px]">📖</span>
            <div className="flex-1">
              <div className="text-[7px] font-medium text-[#FAFAF9]">阅读 30 分钟</div>
              <div className="text-[5.5px] text-[#78716C]">进行中 · 已读 15 分钟</div>
            </div>
            <div className="h-4 w-4 rounded-full border-2 border-[#F59E0B]">
              <div className="h-full w-full scale-50 rounded-full bg-[#F59E0B]/40" />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#292524] px-2.5 py-2">
            <span className="text-[10px]">💪</span>
            <div className="flex-1">
              <div className="text-[7px] font-medium text-[#FAFAF9]/50">运动 20 分钟</div>
              <div className="text-[5.5px] text-[#78716C]">待完成</div>
            </div>
            <div className="h-4 w-4 rounded-full border border-[#44403C]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-around border-t border-[#292524] px-4 py-2">
        <div className="h-1 w-5 rounded bg-[#F59E0B]" />
        <div className="h-1 w-5 rounded bg-[#44403C]" />
        <div className="h-1 w-5 rounded bg-[#44403C]" />
      </div>
    </div>
  );
}

function ProductCard() {
  return (
    <div
      className="absolute left-[90px] top-[40px] z-20 w-[280px] origin-center rotate-[2deg] overflow-hidden rounded-2xl bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] transition-[transform,box-shadow] duration-300 ease-out hover:z-40 hover:rotate-0 hover:scale-[1.04] hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] sm:left-[110px] sm:top-[50px] sm:w-[340px] dark:bg-[#292524] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
    >
      <div className="relative flex h-[120px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] sm:h-[140px] dark:from-[#57534E] dark:to-[#44403C]">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-[#1C1917]/80">
            <span className="text-[28px]">☕</span>
          </div>
          <div className="absolute bottom-2 right-3 rounded-full bg-white/90 px-2 py-0.5 text-[6px] font-semibold text-[#B45309] dark:bg-[#1C1917]/90 dark:text-[#F59E0B]">
            新品上架
          </div>
        </div>
      </div>

      <div className="px-5 pb-2 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[7px] font-medium uppercase tracking-[0.15em] text-[#A8A29E]">精品咖啡</div>
            <div className="mt-1 font-serif text-[15px] font-bold leading-tight text-[#1C1917] dark:text-[#FAFAF9]">
              云南日晒·蜜处理
            </div>
          </div>
          <div className="text-right">
            <div className="font-serif text-[16px] font-bold text-[#1C1917] dark:text-[#FAFAF9]">¥128</div>
            <div className="text-[6px] text-[#A8A29E] line-through">¥168</div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex gap-[1px]">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} className={`h-2.5 w-2.5 ${s <= 4 ? "text-[#F59E0B]" : "text-[#E7E5E4] dark:text-[#44403C]"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-[7px] font-medium text-[#44403C] dark:text-[#E7E5E4]">4.8</span>
          <span className="text-[6px] text-[#A8A29E]">· 326 条评价</span>
        </div>

        <div className="mt-3">
          <div className="text-[7px] font-medium text-[#78716C]">规格</div>
          <div className="mt-1 flex gap-1.5">
            {["200g", "500g", "1kg"].map((v, i) => (
              <div
                key={v}
                className={`rounded-md px-2.5 py-1 text-[7px] font-medium ${
                  i === 1
                    ? "bg-[#1C1917] text-white dark:bg-[#FAFAF9] dark:text-[#1C1917]"
                    : "border border-[#E7E5E4] text-[#44403C] dark:border-[#44403C] dark:text-[#E7E5E4]"
                }`}
              >
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-5 mb-4 mt-2 flex gap-2">
        <div className="flex h-7 flex-1 items-center justify-center rounded-md bg-[#1C1917] text-[8px] font-semibold text-white dark:bg-[#FAFAF9] dark:text-[#1C1917]">
          立即购买
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E7E5E4] dark:border-[#44403C]">
          <svg className="h-3 w-3 text-[#78716C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </div>
      </div>
    </div>
  );
}

function TaskBoardCard() {
  const columns = [
    {
      title: "待办", color: "bg-[#E7E5E4] dark:bg-[#44403C]", count: 3,
      tasks: [
        { title: "用户访谈脚本", tags: ["调研"], avatar: "🟣", priority: "text-[#F59E0B]" },
        { title: "竞品分析报告", tags: ["文档"], avatar: "🔵", priority: "text-[#A8A29E]" },
      ],
    },
    {
      title: "进行中", color: "bg-[#2563EB] dark:bg-[#60A5FA]", count: 2,
      tasks: [
        { title: "首页改版设计", tags: ["设计", "P0"], avatar: "🟠", priority: "text-[#EF4444]" },
        { title: "支付流程优化", tags: ["开发"], avatar: "🟢", priority: "text-[#F59E0B]" },
      ],
    },
    {
      title: "已完成", color: "bg-[#10B981]", count: 5,
      tasks: [
        { title: "注册页 A/B 测试", tags: ["增长"], avatar: "🔴", priority: "text-[#10B981]" },
      ],
    },
  ];

  return (
    <div
      className="absolute left-[20px] top-[380px] z-10 w-[340px] origin-center rotate-[1deg] overflow-hidden rounded-2xl bg-[#FAFAF9] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.18)] transition-[transform,box-shadow] duration-300 ease-out hover:z-40 hover:rotate-0 hover:scale-[1.04] hover:shadow-[0_35px_70px_-12px_rgba(0,0,0,0.25)] sm:left-[30px] sm:w-[420px] dark:bg-[#1C1917] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)]"
    >
      <div className="flex items-center justify-between bg-white px-4 pb-2.5 pt-3.5 dark:bg-[#292524]">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#F3E8FF] dark:bg-[#3B0764]/40">
            <svg className="h-2.5 w-2.5 text-[#9333EA] dark:text-[#C084FC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
          </div>
          <span className="text-[9px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">产品迭代看板</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex -space-x-1">
            {["🟣", "🔵", "🟠", "🟢"].map((a, i) => (
              <div key={i} className="flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#F5F5F4] text-[6px] dark:border-[#292524] dark:bg-[#44403C]">{a}</div>
            ))}
          </div>
          <span className="ml-1 text-[6px] text-[#A8A29E]">4 人</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 px-3 pb-3.5 pt-1">
        {columns.map((col) => (
          <div key={col.title}>
            <div className="mb-1.5 flex items-center gap-1.5">
              <div className={`h-1.5 w-1.5 rounded-full ${col.color}`} />
              <span className="text-[7px] font-semibold text-[#44403C] dark:text-[#E7E5E4]">{col.title}</span>
              <span className="ml-auto text-[6px] text-[#A8A29E]">{col.count}</span>
            </div>
            <div className="space-y-1.5">
              {col.tasks.map((task) => (
                <div key={task.title} className="rounded-lg bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:bg-[#292524]">
                  <div className="text-[7px] font-medium leading-snug text-[#1C1917] dark:text-[#FAFAF9]">{task.title}</div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <div className="flex gap-1">
                      {task.tags.map((tag) => (
                        <span key={tag} className="rounded bg-[#F5F5F4] px-1 py-[1px] text-[5px] font-medium text-[#78716C] dark:bg-[#44403C] dark:text-[#A8A29E]">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[7px] ${task.priority}`}>●</span>
                      <span className="text-[7px]">{task.avatar}</span>
                    </div>
                  </div>
                </div>
              ))}
              {col.title === "已完成" && (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-[#D6D3D1] py-2 dark:border-[#57534E]">
                  <span className="text-[6px] text-[#A8A29E]">+4 更多</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductMockup() {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (shouldReduceMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = ((e.clientX - centerX) / (rect.width / 2)) * 8;
    const y = ((e.clientY - centerY) / (rect.height / 2)) * -6;
    setTilt({ x, y });
  }, [shouldReduceMotion]);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[400px] sm:min-h-[480px] lg:min-h-[580px]"
      aria-hidden="true"
    >
      <motion.div
        className="origin-top-left scale-[0.65] sm:scale-[0.8] lg:scale-100"
        style={{
          transform: `perspective(800px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg) scale(var(--tw-scale-x, 1))`,
          transition: "transform 0.15s ease-out",
        }}
        animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
      >
        <MobileCard />
        <ProductCard />
        <TaskBoardCard />
      </motion.div>
    </div>
  );
}
