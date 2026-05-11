import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { ArrowRight, Sparkles, Users, Mail, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" />;

  return (
    <div className="min-h-screen gradient-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground font-bold shadow-[var(--shadow-glow)]">1</div>
          <span className="font-semibold tracking-tight">OnePersonCRM</span>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
          <Button asChild><Link to="/signup">Get started</Link></Button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3 w-3 text-primary" /> Built for solo founders & freelancers
        </div>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
          The simplest CRM for a <span className="bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">team of one</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Track clients, generate AI-powered outreach emails, and never miss a follow-up — all in one calm, fast workspace.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg" className="shadow-[var(--shadow-glow)]">
            <Link to="/signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
          <Button asChild size="lg" variant="outline"><Link to="/login">Sign in</Link></Button>
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {[
            { icon: Users, title: "Client hub", desc: "All your contacts, tags, and notes in one place." },
            { icon: Mail, title: "AI outreach", desc: "Draft warm, personalized emails in one click." },
            { icon: BellRing, title: "Smart follow-ups", desc: "We flag clients you haven't contacted in 14+ days." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-2xl p-6 text-left">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
