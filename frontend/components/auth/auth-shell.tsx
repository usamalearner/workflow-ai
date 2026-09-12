import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { CommandCenter } from "@/components/landing/command-center";

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-card/40 p-10 lg:flex">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <Link href="/" className="relative">
          <Logo />
        </Link>
        <div className="relative">
          <CommandCenter />
        </div>
        <p className="relative max-w-sm text-sm text-muted-foreground">
          &ldquo;Don&apos;t just ask AI questions. Give it your workplace
          information and let it turn that information into action.&rdquo;
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 inline-flex lg:hidden">
            <Logo />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
