import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Sparkles, Send, Pencil, Trash2, Mail, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";
import { needsFollowUp, formatRelative } from "@/lib/follow-up";
import { generateOutreachEmail } from "@/lib/ai-email.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/clients/$clientId")({
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { clientId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const generate = useServerFn(generateOutreachEmail);

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", clientId).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["outreach-logs", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("outreach_logs").select("*").eq("client_id", clientId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["client", clientId] });
    qc.invalidateQueries({ queryKey: ["clients"] });
    qc.invalidateQueries({ queryKey: ["dashboard-clients"] });
    qc.invalidateQueries({ queryKey: ["outreach-logs", clientId] });
  };

  const handleGenerate = async () => {
    if (!client) return;
    setGenerating(true);
    try {
      const result = await generate({
        data: {
          name: client.name,
          email: client.email,
          businessType: client.business_type,
          tags: client.tags,
          notes: client.notes,
        },
      });
      setSubject(result.subject);
      setBody(result.body);
      toast.success("Email drafted");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate email");
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!client) return;
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }

    const { error: insertErr } = await supabase.from("outreach_logs").insert({
      user_id: user.id,
      client_id: client.id,
      subject: subject.trim(),
      body: body.trim(),
      sent: true,
    });
    if (insertErr) { toast.error(insertErr.message); setSending(false); return; }

    await supabase.from("clients").update({ last_contacted: new Date().toISOString() }).eq("id", client.id);

    // Open user's mail client with prefilled message
    const mailto = `mailto:${encodeURIComponent(client.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;

    toast.success("Logged & opened in your mail app");
    setSubject(""); setBody("");
    setSending(false);
    refresh();
  };

  if (isLoading) {
    return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!client) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Button asChild variant="link"><Link to="/clients">Back to clients</Link></Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6 md:p-10">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link to="/clients"><ArrowLeft className="mr-1 h-4 w-4" /> All clients</Link>
        </Button>
      </div>

      <Card className="border-border/60 p-6 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent text-lg font-semibold text-primary">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
                <a href={`mailto:${client.email}`} className="text-sm text-muted-foreground hover:text-primary">{client.email}</a>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {client.business_type && <Badge variant="outline">{client.business_type}</Badge>}
              <Badge variant="secondary" className="capitalize">{client.status}</Badge>
              {needsFollowUp(client.last_contacted) && (
                <Badge className="bg-warning/15 text-warning-foreground hover:bg-warning/20">Follow-up needed</Badge>
              )}
              {client.tags.map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Button>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete</Button>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Last contacted</Label>
            <p className="mt-1 text-sm">{formatRelative(client.last_contacted)}{client.last_contacted ? ` · ${new Date(client.last_contacted).toLocaleDateString()}` : ""}</p>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Notes</Label>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{client.notes || "No notes yet."}</p>
          </div>
        </div>
      </Card>

      <Card className="border-border/60 p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold"><Mail className="h-4 w-4 text-primary" /> Outreach email</h2>
            <p className="text-xs text-muted-foreground">Draft, generate with AI, then send via your mail app.</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" /> {generating ? "Generating…" : "Generate with AI"}
          </Button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Quick hello" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message or click Generate with AI…" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending || !subject || !body}>
              <Send className="mr-2 h-4 w-4" /> {sending ? "Sending…" : "Send email"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-border/60 p-6 shadow-[var(--shadow-soft)]">
        <h2 className="flex items-center gap-2 font-semibold"><History className="h-4 w-4 text-primary" /> Outreach history</h2>
        <p className="text-xs text-muted-foreground">All outreach you've logged for this client.</p>
        <div className="mt-4 space-y-3">
          {(logs ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">No outreach logged yet.</p>
          ) : (
            (logs ?? []).map((log) => (
              <div key={log.id} className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{log.subject}</div>
                  <div className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{log.body}</p>
              </div>
            ))
          )}
        </div>
      </Card>

      <ClientFormDialog open={editOpen} onOpenChange={setEditOpen} client={client} onSaved={refresh} />
      <DeleteClientDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        clientId={client.id}
        clientName={client.name}
        onDeleted={() => navigate({ to: "/clients" })}
      />
    </div>
  );
}
