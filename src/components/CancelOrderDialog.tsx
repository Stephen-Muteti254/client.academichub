import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  writerAssigned: boolean;
  isLoading?: boolean;
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  writerAssigned,
  isLoading = false,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (writerAssigned && !reason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }
    setError("");
    await onConfirm(reason);
    setReason("");
  };

  const handleClose = (value: boolean) => {
    if (!isLoading) {
      onOpenChange(value);
      if (!value) {
        setReason("");
        setError("");
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel This Order?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to cancel this order?
            </span>
            {writerAssigned && (
              <span className="block font-medium text-foreground">
                A writer is currently assigned. Cancellation may affect your account standing.
              </span>
            )}
            <span className="block font-semibold">
              This action cannot be undone.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {writerAssigned && (
          <div className="space-y-2 py-2">
            <Label htmlFor="cancel-reason" className="text-sm font-medium">
              Reason for cancellation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              placeholder="Please explain why you're cancelling this order..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              rows={3}
              className={error ? "border-destructive" : ""}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Keep Order</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling…
              </>
            ) : (
              "Yes, Cancel Order"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
