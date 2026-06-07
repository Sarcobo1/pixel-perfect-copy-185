import { Check } from "lucide-react";

export const STEPS = [
  { key: "brand", label: "Brand" },
  { key: "logo", label: "Logo" },
  { key: "palette", label: "Palette" },
  { key: "voice", label: "Voice" },
  { key: "timeline", label: "Timeline" },
  { key: "render", label: "Render" },
] as const;

export type StepKey = typeof STEPS[number]["key"];

export function StepIndicator({ current, onSelect }: { current: StepKey; onSelect: (k: StepKey) => void }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              active
                ? "border-primary bg-primary text-primary-foreground shadow-lime-glow"
                : done
                  ? "border-primary/30 bg-primary-soft text-primary-hover"
                  : "border-border bg-surface text-muted-foreground"
            }`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
              active ? "bg-primary-foreground/20" : done ? "bg-primary text-primary-foreground" : "bg-muted"
            }`}>
              {done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
