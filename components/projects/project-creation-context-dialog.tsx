"use client";

import { X } from "lucide-react";
import React, { useState } from "react";

import type { ProjectCreationContext, PrototypePlatform } from "@/types";

const PLATFORM_OPTIONS: { value: PrototypePlatform; label: string; description: string }[] = [
  { value: "website", label: "网站", description: "官网、后台、SaaS、运营页、门户系统" },
  { value: "mobile", label: "移动端", description: "App 原型、移动 H5、手机端产品流程" },
  { value: "miniapp", label: "小程序", description: "微信小程序、校园/社区/交易/服务类轻应用" },
];

const AUDIENCE_OPTIONS = ["客户", "投资人", "内部团队", "管理层", "产品经理", "设计师", "开发者", "运营人员", "销售团队", "审核人员", "普通用户", "学生", "商家", "管理员", "合作伙伴"];
const USE_CASE_OPTIONS = ["产品演示", "需求评审", "客户提案", "销售转化", "融资路演", "内部汇报", "开发交付", "可用性测试", "视觉探索", "信息架构梳理", "活动宣传", "流程验证"];

type Props = {
  requirement: string;
  onCancel: () => void;
  onConfirm: (context: ProjectCreationContext) => void;
};

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function ProjectCreationContextDialog({ requirement, onCancel, onConfirm }: Props) {
  const [platform, setPlatform] = useState<PrototypePlatform | null>(null);
  const [audiences, setAudiences] = useState<string[]>([]);
  const [audienceNote, setAudienceNote] = useState("");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [useCaseNote, setUseCaseNote] = useState("");
  const [keywords, setKeywords] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!platform || (audiences.length === 0 && !audienceNote.trim()) || (useCases.length === 0 && !useCaseNote.trim())) {
      setError("请先确认平台、受众和用途");
      return;
    }

    onConfirm({
      platform,
      audiences,
      ...(audienceNote.trim() ? { audienceNote: audienceNote.trim() } : {}),
      useCases,
      ...(useCaseNote.trim() ? { useCaseNote: useCaseNote.trim() } : {}),
      ...(keywords.trim() ? { keywords: keywords.trim() } : {}),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-[0_20px_60px_rgba(28,25,23,0.18)] dark:border-[#44403C] dark:bg-[#292524]">
        <button type="button" onClick={onCancel} className="absolute right-4 top-4 rounded-md p-1 text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAFAF9]" aria-label="关闭">
          <X className="h-4 w-4" />
        </button>
        <h2 className="font-serif text-xl font-bold text-[#1C1917] dark:text-[#FAFAF9]">确认生成方向</h2>
        <p className="mt-1 text-sm text-[#78716C] dark:text-[#A8A29E]">这些信息会影响 AI 推荐的原型方案。平台创建后不可修改。</p>
        <div className="mt-4 rounded-xl bg-[#FAFAF9] p-3 text-sm text-[#44403C] dark:bg-[#1C1917] dark:text-[#D6D3D1]">{requirement}</div>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">平台类型</h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {PLATFORM_OPTIONS.map((option) => (
              <button key={option.value} type="button" aria-label={option.label} onClick={() => setPlatform(option.value)} className={`rounded-xl border p-4 text-left transition ${platform === option.value ? "border-[#2563EB] bg-blue-50 dark:border-[#60A5FA] dark:bg-blue-950/30" : "border-[#E7E5E4] hover:bg-[#F5F5F4] dark:border-[#44403C] dark:hover:bg-[#1C1917]"}`}>
                <div className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">{option.label}</div>
                <div className="mt-1 text-xs leading-relaxed text-[#78716C] dark:text-[#A8A29E]">{option.description}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">受众群体</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {AUDIENCE_OPTIONS.map((item) => (
              <button key={item} type="button" onClick={() => setAudiences((current) => toggle(current, item))} className={`rounded-full border px-3 py-1.5 text-xs ${audiences.includes(item) ? "border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-[#60A5FA] dark:bg-blue-950/30 dark:text-[#60A5FA]" : "border-[#E7E5E4] text-[#57534E] dark:border-[#44403C] dark:text-[#D6D3D1]"}`}>{item}</button>
            ))}
          </div>
          <input value={audienceNote} onChange={(event) => setAudienceNote(event.target.value)} placeholder="补充受众，例如：校园社团负责人" className="mt-2 h-10 w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 text-sm outline-none focus:border-[#3B82F6] dark:border-[#44403C] dark:bg-[#1C1917]" />
        </section>

        <section className="mt-5">
          <h3 className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">用途</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {USE_CASE_OPTIONS.map((item) => (
              <button key={item} type="button" onClick={() => setUseCases((current) => toggle(current, item))} className={`rounded-full border px-3 py-1.5 text-xs ${useCases.includes(item) ? "border-[#2563EB] bg-blue-50 text-[#2563EB] dark:border-[#60A5FA] dark:bg-blue-950/30 dark:text-[#60A5FA]" : "border-[#E7E5E4] text-[#57534E] dark:border-[#44403C] dark:text-[#D6D3D1]"}`}>{item}</button>
            ))}
          </div>
          <input value={useCaseNote} onChange={(event) => setUseCaseNote(event.target.value)} placeholder="补充用途，例如：给学校领导看" className="mt-2 h-10 w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 text-sm outline-none focus:border-[#3B82F6] dark:border-[#44403C] dark:bg-[#1C1917]" />
        </section>

        <section className="mt-5">
          <label htmlFor="prototype-keywords" className="text-sm font-semibold text-[#1C1917] dark:text-[#FAFAF9]">关键词 / 风格偏好</label>
          <textarea id="prototype-keywords" value={keywords} onChange={(event) => setKeywords(event.target.value)} placeholder="暖色、校园感、不要太商务、像真实产品" className="mt-2 min-h-20 w-full rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-3 py-2 text-sm outline-none focus:border-[#3B82F6] dark:border-[#44403C] dark:bg-[#1C1917]" />
        </section>

        {error ? <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div> : null}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-lg border border-[#E7E5E4] px-4 py-2 text-sm font-medium text-[#57534E] hover:bg-[#F5F5F4] dark:border-[#44403C] dark:text-[#D6D3D1] dark:hover:bg-[#1C1917]">取消</button>
          <button type="button" onClick={submit} className="rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1D4ED8]">开始分析</button>
        </div>
      </div>
    </div>
  );
}
