import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";
import { needsFollowUp, formatRelative } from "@/lib/follow-up";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

export const Route = createFileRoute("/_authenticated/clients")({
  component: ClientsPage,
});

function ClientsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["dashboard-clients"] });
  };

  const filtered = (data ?? []).filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.business_type ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage everyone in your CRM.</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add client</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, business…" className="pl-9" />
      </div>

      <Card className="overflow-hidden border-border/60 shadow-[var(--shadow-soft)]">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          (data ?? []).length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-accent text-primary">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">No clients yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Add your first client to get started.</p>
              <Button className="mt-4" onClick={() => setAddOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add client</Button>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">No results.</div>
          )
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Business</TableHead>
                  <TableHead className="hidden lg:table-cell">Tags</TableHead>
                  <TableHead className="hidden sm:table-cell">Last contacted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="group">
                    <TableCell className="font-medium">
                      <Link to="/clients/$clientId" params={{ clientId: c.id }} className="hover:text-primary">
                        {c.name}
                      </Link>
                      {needsFollowUp(c.last_contacted) && (
                        <Badge variant="secondary" className="ml-2 bg-warning/15 text-warning-foreground">Follow-up</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{c.email}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{c.business_type || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.tags.length === 0 ? <span className="text-muted-foreground">—</span> :
                          c.tags.slice(0, 3).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{formatRelative(c.last_contacted)}</TableCell>
                    <TableCell><Badge variant={c.status === "active" ? "default" : "secondary"} className="capitalize">{c.status}</Badge></TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditClient(c)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteClient(c)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <ClientFormDialog open={addOpen} onOpenChange={setAddOpen} onSaved={refresh} />
      <ClientFormDialog open={!!editClient} onOpenChange={(v) => !v && setEditClient(null)} client={editClient} onSaved={refresh} />
      <DeleteClientDialog open={!!deleteClient} onOpenChange={(v) => !v && setDeleteClient(null)} clientId={deleteClient?.id} clientName={deleteClient?.name} onDeleted={refresh} />
    </div>
  );
}
