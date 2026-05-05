"use client";

import { Player } from "@remotion/player";
import { DemoVideo, DEMO_VIDEO_CONFIG } from "./demo-video";

export function DemoPlayer() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E7E5E4] shadow-warm-sm dark:border-[#44403C]">
      <Player
        component={DemoVideo}
        durationInFrames={DEMO_VIDEO_CONFIG.durationInFrames}
        compositionWidth={DEMO_VIDEO_CONFIG.width}
        compositionHeight={DEMO_VIDEO_CONFIG.height}
        fps={DEMO_VIDEO_CONFIG.fps}
        style={{ width: "100%" }}
        controls
        loop
        autoPlay
      />
    </div>
  );
}
