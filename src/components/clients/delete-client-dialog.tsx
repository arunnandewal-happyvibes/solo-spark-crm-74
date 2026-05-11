import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientId?: string;
  clientName?: string;
  onDeleted?: () => void;
}

export function DeleteClientDialog({ open, onOpenChange, clientId, clientName, onDeleted }: Props) {
  const handleDelete = async () => {
    if (!clientId) return;
    const { error } = await supabase.from("clients").delete().eq("id", clientId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Client deleted");
    onOpenChange(false);
    onDeleted?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {clientName || "client"}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this client and all related outreach history. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
