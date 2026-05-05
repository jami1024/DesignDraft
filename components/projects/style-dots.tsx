import { getStylePresetById } from "@/lib/styles";

export function StyleDots({ presetId, showName = true }: { presetId: string; showName?: boolean }) {
  const preset = getStylePresetById(presetId);
  const colors = preset.palette.slice(0, 3);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex gap-0.5">
        {colors.map((color, i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full ring-1 ring-black/5 dark:ring-white/10"
            style={{ backgroundColor: color }}
          />
        ))}
      </span>
      {showName && (
        <span className="text-xs text-[#78716C] dark:text-[#A8A29E]">{preset.name}</span>
      )}
    </span>
  );
}
