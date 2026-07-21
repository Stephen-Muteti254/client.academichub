import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { TransactionList } from "@/components/wallet/TransactionList";
import { DepositDialog } from "@/components/wallet/DepositDialog";
import { WithdrawDialog } from "@/components/wallet/WithdrawDialog";
import { useWallet } from "@/hooks/useWallet";
import { triggerSupportChat } from '@/contexts/SupportChatContext';
import { cn } from "@/lib/utils";

export default function ClientWallet() {
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  
  const {
    balance,
    stats,
    transactions,
    transactionFilter,
    isLoadingWallet,
    isLoadingTransactions,
    isDepositing,
    handleDeposit,
    handleFilterChange,
    refetchWallet,
    refetchTransactions,
  } = useWallet();

  const handleRefresh = () => {
    refetchWallet();
    refetchTransactions();
  };

  const handleContactSupport = () => {
    // Trigger the support chat
    if (typeof triggerSupportChat === 'function') {
      triggerSupportChat();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
          disabled={isLoadingWallet || isLoadingTransactions}
        >
          <RefreshCw className={cn(
            "h-4 w-4",
            (isLoadingWallet || isLoadingTransactions) && "animate-spin"
          )} />
          Refresh
        </Button>
      </div>

      {/* Balance Card */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <BalanceCard
          balance={balance}
          stats={stats}
          onDeposit={() => setDepositOpen(true)}
          onWithdraw={() => setWithdrawOpen(true)}
          isLoading={isLoadingWallet}
        />
      </div>

      {/* Transaction History */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <TransactionList
          transactions={transactions}
          isLoading={isLoadingTransactions}
          currency={balance.currency}
          onFilterChange={handleFilterChange}
          activeFilter={transactionFilter}
        />
      </div>

      {/* Deposit Dialog */}
      <DepositDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        onDeposit={handleDeposit}
        isLoading={isDepositing}
        currency={balance.currency}
      />

      {/* Withdraw Dialog */}
      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        onContactSupport={handleContactSupport}
        availableBalance={balance.available}
        currency={balance.currency}
      />
    </div>
  );
}
