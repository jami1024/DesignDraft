export type StylePresetId = "modern-minimal" | "warm-soft" | "tech-utility" | "editorial" | "playful-vibrant";

export type StylePreset = {
  id: StylePresetId;
  name: string;
  description: string;
  recommendedFor: string[];
  palette: string[];
  typography: string;
  layout: string;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "克制、清晰、软件产品感，适合稳定通用的演示页面。",
    recommendedFor: ["SaaS", "工具产品", "效率产品"],
    palette: ["#FAFAF9", "#FFFFFF", "#1C1917", "#2563EB"],
    typography: "清晰无衬线，标题紧凑，正文稳定。",
    layout: "大留白、少装饰、清晰栅格。",
  },
  {
    id: "warm-soft",
    name: "Warm Soft",
    description: "温暖、亲和、可信，适合非技术人员和轻量产品介绍。",
    recommendedFor: ["教育", "咨询", "健康", "轻量产品"],
    palette: ["#FFF7ED", "#FFFFFF", "#292524", "#EA580C"],
    typography: "柔和但清楚，标题可稍有编辑感。",
    layout: "圆角适中、模块呼吸感强。",
  },
  {
    id: "tech-utility",
    name: "Tech Utility",
    description: "信息密度高、工程化、重视指标和状态。",
    recommendedFor: ["Dashboard", "后台系统", "数据产品"],
    palette: ["#F8FAFC", "#FFFFFF", "#0F172A", "#059669"],
    typography: "数字清晰，状态标签易读。",
    layout: "指标、表格、筛选和操作入口优先。",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "杂志感、叙事性，适合高质感汇报和品牌说明。",
    recommendedFor: ["品牌介绍", "汇报页", "方案页"],
    palette: ["#FDF6E3", "#FFFFFF", "#1C1917", "#B45309"],
    typography: "标题更有刊物气质，正文像文章一样稳。",
    layout: "大标题、分栏、引用和重点语句形成节奏。",
  },
  {
    id: "playful-vibrant",
    name: "Playful / Vibrant",
    description: "活泼、有能量，适合活动和年轻化消费场景。",
    recommendedFor: ["活动页", "消费产品", "年轻化品牌"],
    palette: ["#FFF1F2", "#FFFFFF", "#18181B", "#E11D48"],
    typography: "标题可以更有性格，正文保持可读。",
    layout: "节奏更强，但避免影响信息理解。",
  },
];

export function listStylePresets() {
  return STYLE_PRESETS;
}

export function getStylePresetById(id: string) {
  return STYLE_PRESETS.find((preset) => preset.id === id) ?? STYLE_PRESETS[0];
}
