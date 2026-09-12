import Link from "next/link";
import {
  ArrowRight,
  Upload,
  Brain,
  MessagesSquare,
  ListChecks,
  FileBarChart,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/layout/logo";
import { CommandCenter } from "@/components/landing/command-center";
import { ExploreDemoButton } from "@/components/landing/explore-demo-button";
import { APP_TAGLINE } from "@/lib/constants";

const STEPS = [
  { n: "01", title: "Upload", body: "Bring your workplace documents — PDF, DOCX, Excel, CSV." },
  { n: "02", title: "Understand", body: "AI processes and indexes your information." },
  { n: "03", title: "Ask", body: "Get grounded answers with page-level sources." },
  { n: "04", title: "Act", body: "Extract tasks, owners and deadlines automatically." },
  { n: "05", title: "Report", body: "Create management-ready insights in seconds." },
];

const FEATURES = [
  { icon: MessagesSquare, title: "Grounded Copilot", body: "Every answer cites the document and page it came from. No hallucinated sources." },
  { icon: ListChecks, title: "Action extraction", body: "Turn a maintenance report into tracked tasks with owners, priorities and due dates." },
  { icon: FileBarChart, title: "Instant reports", body: "Executive summaries, risk assessments and management briefs from your files." },
  { icon: Brain, title: "Spreadsheet intelligence", body: "Real pandas analysis of your data, explained in plain language." },
  { icon: ShieldCheck, title: "Isolated & secure", body: "Row-level security, private storage and per-user isolation by default." },
  { icon: Upload, title: "Works instantly", body: "Load a realistic demo workspace and explore the full product in one click." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Start for Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="container relative grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div className="animate-slide-up">
            <Badge variant="outline" className="mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              48-Hour AI Productivity & Innovation Challenge
            </Badge>
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Turn workplace
              <br />
              information into{" "}
              <span className="text-gradient">action</span>.
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Upload your documents. Ask questions. Extract actions. Generate
              reports. Make better decisions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start for Free <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <ExploreDemoButton size="lg" variant="outline">
                Explore Demo
              </ExploreDemoButton>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              No credit card. Demo workspace loads with realistic sample data.
            </p>
          </div>

          <div className="animate-fade-in [animation-delay:200ms]">
            <div className="glass rounded-2xl border border-border p-8">
              <CommandCenter />
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="border-t border-border/60 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              From information to action
            </h2>
            <p className="mt-3 text-muted-foreground">
              WorkFlow AI doesn&apos;t just answer questions. It moves work forward.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="group rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span className="font-mono text-sm text-primary">{s.n}</span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-card/30 py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              Workplace intelligence, end to end
            </h2>
            <p className="mt-3 text-muted-foreground">
              AI-powered workplace intelligence for documents, decisions, and action.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pitch */}
      <section className="border-t border-border/60 py-20">
        <div className="container max-w-3xl text-center">
          <Quote className="mx-auto h-8 w-8 text-primary/50" />
          <p className="mt-5 text-xl font-medium leading-relaxed sm:text-2xl">
            Don&apos;t just ask AI questions. Give it your workplace information
            and let it turn that information into action.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">
            {APP_TAGLINE} · Built for the 48-Hour AI Challenge.
          </p>
        </div>
      </footer>
    </div>
  );
}
