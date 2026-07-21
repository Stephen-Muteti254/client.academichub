import { useState } from "react";
import { CreditCard, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatMoney, getCurrencySymbol } from "@/lib/currency";

interface DepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeposit: (amount: number) => Promise<void>;
  isLoading?: boolean;
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
}

const quickAmounts = [5000, 10000, 20000, 50000, 100000];

export function DepositDialog({
  open,
  onOpenChange,
  onDeposit,
  isLoading,
  currency = 'USD',
  minAmount = 1,
  maxAmount = 1000000,
}: DepositDialogProps) {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const formatCurrency = (value: number) =>
    formatMoney(value, currency, 0);

  const handleAmountChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    setError('');
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
    setError('');
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (numAmount < minAmount) {
      setError(`Minimum deposit is ${formatCurrency(minAmount)}`);
      return;
    }

    if (numAmount > maxAmount) {
      setError(`Maximum deposit is ${formatCurrency(maxAmount)}`);
      return;
    }

    try {
      await onDeposit(numAmount);
      setAmount('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setAmount('');
      setError('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/*<CreditCard className="h-5 w-5 text-primary" />*/}
            Deposit Funds
          </DialogTitle>
          <DialogDescription>
            Add money to your wallet using Paystack. Funds will be available instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                {getCurrencySymbol(currency)}
              </span>
              <Input
                id="amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-8 text-lg font-semibold h-12"
              />
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Select</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={amount === value.toString() ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQuickAmount(value)}
                  className="font-medium"
                >
                  {formatCurrency(value)}
                </Button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="py-2">
              {/*<AlertCircle className="h-4 w-4" />*/}
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p>• Secure payment powered by Paystack</p>
            <p>• Minimum deposit: {formatCurrency(minAmount)}</p>
            <p>• Funds available instantly after payment</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !amount}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
