import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DesignDraft",
  description: "输入需求，生成可交互的 HTML 演示页面。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <body>{children}</body>
    </html>
  );
}
