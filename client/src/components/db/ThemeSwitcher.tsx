import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { themes, type ThemeId } from "@/lib/theme";
import { cn } from "@/lib/utils";

type Props = { theme: ThemeId; onChange: (t: ThemeId) => void };

export function ThemeSwitcher({ theme, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const current = themes.find((t) => t.id === theme) ?? themes[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Palette className="size-3.5 shrink-0" />
        <span className="hidden sm:inline">{current.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent",
                theme === t.id && "font-medium",
              )}
            >
              <span className="flex shrink-0 overflow-hidden rounded-full border border-border">
                {t.swatch.map((c) => (
                  <span key={c} className="size-3" style={{ background: c }} />
                ))}
              </span>
              <span className="min-w-0 flex-1 truncate">{t.label}</span>
              {theme === t.id && <Check className="size-3.5 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
