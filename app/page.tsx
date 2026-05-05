import { HeroSection } from "@/components/landing/hero-section";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[#FAFAF9] dark:bg-[#1C1917]" />
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden="true"
      >
        <div
          className="absolute h-[600px] w-[600px] rounded-full"
          style={{
            left: "-5%",
            top: "-15%",
            background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
            animation: "aurora1 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute h-[500px] w-[500px] rounded-full"
          style={{
            right: "0%",
            top: "40%",
            background: "radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)",
            animation: "aurora2 22s ease-in-out infinite 3s",
          }}
        />
        <div
          className="absolute h-[450px] w-[450px] rounded-full"
          style={{
            left: "25%",
            bottom: "-10%",
            background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
            animation: "aurora3 20s ease-in-out infinite 5s",
          }}
        />
      </div>
      <div className="relative z-10">
        <HeroSection />
      </div>
    </main>
  );
}
