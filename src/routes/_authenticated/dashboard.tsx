import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, BellRing, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { needsFollowUp, formatRelative } from "@/lib/follow-up";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const clients = data ?? [];
  const followUps = clients.filter((c) => needsFollowUp(c.last_contacted));
  const recent = clients.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-6 md:p-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">A calm overview of your client pipeline.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total clients" value={isLoading ? "—" : clients.length} accent="primary" />
        <StatCard icon={BellRing} label="Follow-ups needed" value={isLoading ? "—" : followUps.length} accent="warning" />
        <StatCard icon={CheckCircle2} label="Active" value={isLoading ? "—" : clients.filter(c => c.status === "active").length} accent="success" />
      </div>

      <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">Recent clients</h2>
            <p className="text-xs text-muted-foreground">Your 5 most recently added contacts.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/clients">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : recent.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y">
            {recent.map((c) => (
              <li key={c.id}>
                <Link to="/clients/$clientId" params={{ clientId: c.id }} className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-accent/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      {needsFollowUp(c.last_contacted) && <Badge variant="secondary" className="bg-warning/15 text-warning-foreground">Follow-up</Badge>}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{c.email}</div>
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">
                    {formatRelative(c.last_contacted)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent: "primary" | "warning" | "success" }) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/15 text-warning-foreground",
    success: "bg-success/15 text-success-foreground",
  };
  return (
    <Card className="flex items-center gap-4 border-border/60 p-5 shadow-[var(--shadow-soft)]">
      <div className={`grid h-11 w-11 place-items-center rounded-xl ${tones[accent]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary">
        <Users className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">No clients yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Add your first client to start tracking outreach and follow-ups.</p>
      <Button asChild className="mt-4"><Link to="/clients">Add your first client</Link></Button>
    </div>
  );
}
