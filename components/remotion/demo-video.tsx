import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";

const TYPING_TEXT = "春季发布会客户演示页面，需要展示三个核心产品功能…";

function TypingText({ text, startFrame }: { text: string; startFrame: number }) {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;
  if (localFrame < 0) return null;
  const charsToShow = Math.min(Math.floor(localFrame / 2), text.length);
  const displayText = text.slice(0, charsToShow);
  const showCursor = localFrame % 16 < 10;

  return (
    <span>
      {displayText}
      {charsToShow < text.length && showCursor && (
        <span style={{ color: "#3B82F6" }}>|</span>
      )}
    </span>
  );
}

function SceneTitle({ children }: { children: React.ReactNode }) {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 10], [8, 0], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: 28,
        fontSize: 13,
        fontWeight: 600,
        color: "#3B82F6",
        opacity,
        transform: `translateY(${y}px)`,
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </div>
  );
}

function Scene1Input() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const inputOpacity = interpolate(frame, [8, 16], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FAFAF9",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
      }}
    >
      <SceneTitle>第 1 步 · 描述需求</SceneTitle>

      <div
        style={{
          transform: `scale(${boxScale})`,
          width: 420,
          background: "white",
          borderRadius: 12,
          border: "1px solid #E7E5E4",
          padding: 20,
          boxShadow: "0 2px 8px rgba(28,25,23,0.06)",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#1C1917",
            marginBottom: 10,
          }}
        >
          项目名称
        </div>
        <div
          style={{
            opacity: inputOpacity,
            background: "#FAFAF9",
            border: "1px solid #E7E5E4",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
            color: "#1C1917",
            minHeight: 38,
            lineHeight: 1.6,
          }}
        >
          <TypingText text={TYPING_TEXT} startFrame={14} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Scene2Analysis() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerScale = spring({ frame, fps, config: { damping: 15, stiffness: 120 } });
  const dotCount = 3;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FAFAF9",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
      }}
    >
      <SceneTitle>第 2 步 · AI 分析</SceneTitle>

      <div
        style={{
          transform: `scale(${containerScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "linear-gradient(135deg, #3B82F6, #2563EB)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" />
            <path d="M8.24 4.35A4 4 0 0 1 12 2" />
            <path d="M14.5 12.5L12 15l-2.5-2.5" />
            <circle cx="12" cy="18" r="3" />
          </svg>
        </div>

        <div style={{ fontSize: 15, fontWeight: 600, color: "#1C1917" }}>
          AI 正在分析需求
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: dotCount }).map((_, i) => {
            const dotOpacity = interpolate(
              (frame + i * 8) % 24,
              [0, 12, 24],
              [0.2, 1, 0.2],
            );
            return (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#3B82F6",
                  opacity: dotOpacity,
                }}
              />
            );
          })}
        </div>

        <div style={{ width: 320, marginTop: 8 }}>
          {["识别页面类型与布局", "提取核心功能模块", "匹配最佳设计风格"].map(
            (text, i) => {
              const itemFrame = frame - 20 - i * 15;
              const opacity = interpolate(itemFrame, [0, 10], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const x = interpolate(itemFrame, [0, 10], [12, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              const showCheck = itemFrame > 18;

              return (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    opacity,
                    transform: `translateX(${x}px)`,
                    fontSize: 13,
                    color: "#44403C",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: showCheck ? "#10B981" : "#E7E5E4",
                      transition: "background-color 0.2s",
                    }}
                  >
                    {showCheck && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 5l2.5 2.5L8 3" />
                      </svg>
                    )}
                  </div>
                  {text}
                </div>
              );
            },
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Scene3Generate() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pageScale = spring({ frame: frame - 5, fps, config: { damping: 14, stiffness: 100 } });

  const headerWidth = interpolate(frame, [10, 30], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const block1Opacity = interpolate(frame, [25, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const block2Opacity = interpolate(frame, [35, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const block3Opacity = interpolate(frame, [45, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FAFAF9",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
      }}
    >
      <SceneTitle>第 3 步 · 生成页面</SceneTitle>

      <div
        style={{
          transform: `scale(${Math.max(0, pageScale)})`,
          width: 400,
          background: "white",
          borderRadius: 12,
          border: "1px solid #E7E5E4",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(28,25,23,0.08)",
        }}
      >
        <div
          style={{
            height: 48,
            background: `linear-gradient(90deg, #3B82F6 ${headerWidth}%, #DBEAFE ${headerWidth}%)`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 8,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" }} />
          <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" }} />
          <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.5)" }} />
          <div
            style={{
              marginLeft: 16,
              fontSize: 12,
              fontWeight: 600,
              color: "white",
              opacity: headerWidth > 50 ? 1 : 0,
            }}
          >
            春季发布会 · 客户演示
          </div>
        </div>

        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ opacity: block1Opacity }}>
            <div style={{ height: 10, width: "70%", backgroundColor: "#1C1917", borderRadius: 4 }} />
            <div style={{ height: 8, width: "90%", backgroundColor: "#E7E5E4", borderRadius: 4, marginTop: 8 }} />
            <div style={{ height: 8, width: "60%", backgroundColor: "#E7E5E4", borderRadius: 4, marginTop: 4 }} />
          </div>

          <div style={{ opacity: block2Opacity, display: "flex", gap: 10 }}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                style={{
                  flex: 1,
                  height: 60,
                  borderRadius: 8,
                  backgroundColor: n === 1 ? "#EFF6FF" : n === 2 ? "#F0FDF4" : "#FFF7ED",
                  border: `1px solid ${n === 1 ? "#BFDBFE" : n === 2 ? "#BBF7D0" : "#FED7AA"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: n === 1 ? "#2563EB" : n === 2 ? "#16A34A" : "#EA580C",
                }}
              >
                功能 {n}
              </div>
            ))}
          </div>

          <div style={{ opacity: block3Opacity }}>
            <div
              style={{
                height: 32,
                width: 100,
                borderRadius: 8,
                backgroundColor: "#1C1917",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "white",
              }}
            >
              了解更多
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function Scene4Iterate() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const highlightOpacity = interpolate(frame, [20, 28, 50, 58], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chatY = spring({ frame: frame - 35, fps, config: { damping: 14, stiffness: 100 } });
  const doneOpacity = interpolate(frame, [70, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#FAFAF9",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
      }}
    >
      <SceneTitle>第 4 步 · 对话迭代</SceneTitle>

      <div
        style={{
          opacity: fadeIn,
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 240,
            background: "white",
            borderRadius: 12,
            border: "1px solid #E7E5E4",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(28,25,23,0.06)",
          }}
        >
          <div
            style={{
              height: 28,
              backgroundColor: "#3B82F6",
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              gap: 5,
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" }} />
            <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" }} />
            <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" }} />
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 8, width: "65%", backgroundColor: "#1C1917", borderRadius: 3 }} />
            <div style={{ height: 6, width: "85%", backgroundColor: "#E7E5E4", borderRadius: 3 }} />

            <div
              style={{
                position: "relative",
                display: "flex",
                gap: 6,
                marginTop: 4,
              }}
            >
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 6,
                    backgroundColor: n === 2 ? "#EFF6FF" : "#F5F5F4",
                    border: `1px solid ${n === 2 ? "#3B82F6" : "#E7E5E4"}`,
                  }}
                />
              ))}
              {highlightOpacity > 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: -3,
                    borderRadius: 9,
                    border: "2px solid #3B82F6",
                    opacity: highlightOpacity,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>

            <div style={{ height: 6, width: "50%", backgroundColor: "#E7E5E4", borderRadius: 3, marginTop: 4 }} />
          </div>
        </div>

        <div
          style={{
            width: 200,
            transform: `translateY(${(1 - Math.max(0, chatY)) * 16}px)`,
            opacity: Math.max(0, chatY),
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #E7E5E4",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              color: "#44403C",
              boxShadow: "0 1px 4px rgba(28,25,23,0.05)",
            }}
          >
            把中间的卡片颜色改为蓝色主题
          </div>

          <div
            style={{
              backgroundColor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 12,
              color: "#1D4ED8",
              boxShadow: "0 1px 4px rgba(59,130,246,0.08)",
            }}
          >
            已更新卡片配色为蓝色主题 ✓
          </div>

          <div
            style={{
              opacity: doneOpacity,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#10B981",
              marginTop: 4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="6" />
              <path d="M4.5 7l2 2L9.5 5" />
            </svg>
            迭代完成
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function DemoVideo() {
  return (
    <AbsoluteFill style={{ backgroundColor: "#FAFAF9" }}>
      <Sequence from={0} durationInFrames={90}>
        <Scene1Input />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <Scene2Analysis />
      </Sequence>
      <Sequence from={180} durationInFrames={80}>
        <Scene3Generate />
      </Sequence>
      <Sequence from={260} durationInFrames={90}>
        <Scene4Iterate />
      </Sequence>
    </AbsoluteFill>
  );
}

export const DEMO_VIDEO_CONFIG = {
  durationInFrames: 350,
  fps: 30,
  width: 560,
  height: 360,
} as const;
