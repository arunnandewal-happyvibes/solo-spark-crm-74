import { createFileRoute, Outlet, Navigate, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, Users, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clients", label: "Clients", icon: Users },
] as const;

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] font-bold text-primary-foreground shadow-[var(--shadow-glow)]">1</div>
        <div>
          <div className="text-sm font-semibold leading-tight">OnePersonCRM</div>
          <div className="text-xs text-muted-foreground">Solo workspace</div>
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.to)
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="border-t p-3">
        <div className="mb-2 truncate px-2 text-xs text-muted-foreground">{user?.email}</div>
        <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>
    );
  }
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
        <SidebarContent />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b bg-card/60 px-4 backdrop-blur md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-sidebar p-0">
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-[image:var(--gradient-primary)] text-xs font-bold text-primary-foreground">1</div>
            <span className="text-sm font-semibold">OnePersonCRM</span>
          </div>
        </header>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
