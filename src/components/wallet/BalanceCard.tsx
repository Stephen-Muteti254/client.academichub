import { Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WalletBalance, WalletStats } from "@/types/wallet";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";

interface BalanceCardProps {
  balance: WalletBalance;
  stats: WalletStats;
  onDeposit: () => void;
  onWithdraw: () => void;
  isLoading?: boolean;
}

export function BalanceCard({ 
  balance, 
  stats, 
  onDeposit, 
  onWithdraw,
  isLoading 
}: BalanceCardProps) {
  
  const formatCurrency = (amount: number) =>
    formatMoney(amount, balance.currency || "USD");

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 animate-pulse-subtle">
            <div className="h-8 w-32 bg-primary-foreground/20 rounded mb-2" />
            <div className="h-12 w-48 bg-primary-foreground/20 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Left: Balance Info */}
          <div className="flex items-center gap-3 text-primary">

            <div>
              <p className="text-sm opacity-90">Available Balance</p>
              <h2 className="text-3xl font-bold tracking-tight">
                {formatCurrency(balance.available)}
              </h2>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={onDeposit}
              variant="outline"
              size="sm"
              className="text-primary font-semibold"
            >
              <ArrowDownLeft className="h-4 w-4 mr-2" />
              Deposit
            </Button>

            <Button
              onClick={onWithdraw}
              variant="outline"
              size="sm"
              className="text-primary font-semibold"
            >
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({ 
  label, 
  value, 
  className 
}: { 
  label: string; 
  value: string; 
  className?: string;
}) {
  return (
    <div className="p-4 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn("font-semibold text-sm", className)}>{value}</p>
    </div>
  );
}
