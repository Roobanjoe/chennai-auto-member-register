import { Link, useRouterState } from "@tanstack/react-router";
import { Check, ClipboardList, FileCheck2, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { path: "/", label: "பதிவு படிவம்", icon: ClipboardList },
  { path: "/preview", label: "முன்னோட்டம்", icon: FileCheck2 },
  { path: "/thank-you", label: "உறுதிப்பாடு", icon: PartyPopper },
] as const;

/**
 * Top-of-page progress indicator showing the user where they are in the
 * three-page registration flow (Form → Preview → Confirmation).
 */
export function RegistrationProgress() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const activeIndex = Math.max(
    0,
    STEPS.findIndex((s) => s.path === path),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pt-5 sm:px-6">
      <ol className="flex items-center gap-2 rounded-2xl border border-primary/10 bg-card/80 p-2.5 shadow-soft backdrop-blur">
        {STEPS.map((s, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          const Icon = s.icon;
          const node = (
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                  done && "border-primary bg-primary text-primary-foreground shadow-sm",
                  active && "scale-105 border-primary bg-primary-soft text-primary ring-4 ring-primary/15",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p
                  className={cn(
                    "truncate text-[10px] font-medium uppercase tracking-wide",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  படி {i + 1}
                </p>
                <p
                  className={cn(
                    "truncate text-sm font-semibold transition-colors",
                    active ? "text-primary-deep" : "text-foreground/70",
                  )}
                >
                  {s.label}
                </p>
              </div>
            </div>
          );
          return (
            <li key={s.path} className="flex flex-1 items-center gap-2">
              {/* The first step is always navigable; later steps only when reached */}
              {i === 0 ? (
                <Link to={s.path} className="rounded-full transition-opacity hover:opacity-90">
                  {node}
                </Link>
              ) : (
                node
              )}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "ml-1 h-1 flex-1 rounded-full transition-all duration-500",
                    i < activeIndex ? "bg-primary" : "bg-border/70",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
