import { AlertTriangle, HeadphonesIcon, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatMoney } from "@/lib/currency";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactSupport: () => void;
  availableBalance?: number;
  currency?: string;
}

export function WithdrawDialog({
  open,
  onOpenChange,
  onContactSupport,
  availableBalance = 0,
  currency = 'NGN',
}: WithdrawDialogProps) {
  const formatCurrency = (value: number) =>
    formatMoney(value, currency);

  const handleContactSupport = () => {
    onContactSupport();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeadphonesIcon className="h-5 w-5 text-primary" />
            Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Withdraw your available balance securely
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Available Balance */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Available for Withdrawal</p>
            <p className="text-2xl font-bold text-foreground">
              {formatCurrency(availableBalance)}
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="border-wallet-warning/50 bg-wallet-warning/5">
            <AlertTriangle className="h-4 w-4 text-wallet-warning" />
            <AlertTitle className="text-wallet-warning">Support Assisted Withdrawals</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              For your security, all withdrawals are processed through our support team. 
              Please contact support to initiate a withdrawal request.
            </AlertDescription>
          </Alert>

          {/* Steps */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">How it works:</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                  1
                </span>
                <p>Contact our support team via chat or email</p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                  2
                </span>
                <p>Provide your bank account details and withdrawal amount</p>
              </div>
              <div className="flex gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium shrink-0">
                  3
                </span>
                <p>Receive funds within 1-3 business days</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleContactSupport}
            className="gap-2"
          >
            <HeadphonesIcon className="h-4 w-4" />
            Contact Support
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
