import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-7 w-7", className)}
      fill="none"
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        className="fill-primary/10 stroke-primary/40"
        strokeWidth="1.5"
      />
      <circle cx="9" cy="9" r="2.6" className="fill-primary" />
      <circle cx="9" cy="23" r="2.6" className="fill-primary/70" />
      <circle cx="23" cy="16" r="3" className="fill-accent" />
      <path
        d="M11.4 9.6c5 1 5 11.4 9.2 5.9M11.4 22.4c5-1 5-11.4 9.2-5.9"
        className="stroke-primary/60"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M22 12.5l1.2-2.4 1.2 2.4 2.4 1.2-2.4 1.2L23.2 17l-1.2-2.5-2.4-1.2z"
        className="fill-accent"
      />
    </svg>
  );
}

export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showText && (
        <span className="text-[15px] font-semibold tracking-tight">
          WorkFlow<span className="text-primary"> AI</span>
        </span>
      )}
    </span>
  );
}
