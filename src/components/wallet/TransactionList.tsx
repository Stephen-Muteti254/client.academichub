import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCw, 
  Gift,
  FileText,
  MoreHorizontal,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Transaction, TransactionType, TransactionStatus } from "@/types/wallet";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  currency?: string;
  onFilterChange?: (type: TransactionType | 'all') => void;
  activeFilter?: TransactionType | 'all';
}

const transactionConfig: Record<TransactionType, {
  icon: typeof ArrowDownLeft;
  label: string;
  colorClass: string;
  bgClass: string;
}> = {
  deposit: {
    icon: ArrowDownLeft,
    label: 'Deposit',
    colorClass: 'text-wallet-success',
    bgClass: 'bg-wallet-success/10',
  },
  payment: {
    icon: FileText,
    label: 'Payment',
    colorClass: 'text-destructive',
    bgClass: 'bg-destructive/10',
  },
  refund: {
    icon: RefreshCw,
    label: 'Refund',
    colorClass: 'text-wallet-info',
    bgClass: 'bg-wallet-info/10',
  },
  withdrawal: {
    icon: ArrowUpRight,
    label: 'Withdrawal',
    colorClass: 'text-muted-foreground',
    bgClass: 'bg-muted',
  },
  bonus: {
    icon: Gift,
    label: 'Bonus',
    colorClass: 'text-wallet-warning',
    bgClass: 'bg-wallet-warning/10',
  },
};

const statusConfig: Record<TransactionStatus, {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}> = {
  completed: { label: 'Completed', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'outline' },
};


const fallbackTransactionConfig = {
  icon: FileText,
  label: "Transaction",
  colorClass: "text-muted-foreground",
  bgClass: "bg-muted",
};




export function TransactionList({ 
  transactions, 
  isLoading,
  currency = 'NGN',
  onFilterChange,
  activeFilter = 'all'
}: TransactionListProps) {
  
  const formatCurrency = (amount: number) =>
    formatMoney(amount, currency);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      console.warn("Invalid date received:", dateStr);
      return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };


  const filterOptions: Array<{ value: TransactionType | 'all'; label: string }> = [
    { value: 'all', label: 'All Transactions' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'payment', label: 'Payments' },
    { value: 'refund', label: 'Refunds' },
    { value: 'withdrawal', label: 'Withdrawals' },
    { value: 'bonus', label: 'Bonuses' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-10 w-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
              <div className="h-5 w-20 bg-muted rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Transaction History</CardTitle>
        {onFilterChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterOptions.find(f => f.value === activeFilter)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {filterOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => onFilterChange(option.value)}
                  className={cn(activeFilter === option.value && "bg-accent")}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No transactions yet</p>
            {/*<p className="text-sm text-muted-foreground mt-1">
              Your transaction history will appear here
            </p>*/}
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((transaction, index) => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction}
                currency={currency}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                isLast={index === transactions.length - 1}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TransactionItem({ 
  transaction, 
  currency,
  formatCurrency,
  formatDate,
  isLast 
}: { 
  transaction: Transaction;
  currency: string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  isLast: boolean;
}) {
  const config =
    transactionConfig[transaction.type as TransactionType] ??
    fallbackTransactionConfig;

  const Icon = config.icon;
  
  const statusCfg =
    statusConfig[transaction.status as TransactionStatus] ?? {
      label: transaction.status,
      variant: "secondary",
    };

  // const Icon = config.icon;
  
  const isCredit = ['deposit', 'refund', 'bonus'].includes(transaction.type);

  return (
    <div className={cn(
      "flex items-center gap-4 py-4 px-2 -mx-2 transition-colors hover:bg-muted/50",
      !isLast && "border-b border-border"
    )}>
      <div className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
        config.bgClass
      )}>
        <Icon className={cn("h-5 w-5", config.colorClass)} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">
            {transaction.description}
          </p>
          {transaction.status !== 'completed' && (
            <Badge variant={statusCfg.variant} className="text-xs shrink-0">
              {statusCfg.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatDate(transaction.created_at)}
          </span>
          {transaction.reference && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground truncate">
                Ref: {transaction.reference}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className={cn(
          "font-semibold",
          isCredit ? "text-wallet-success" : "text-foreground"
        )}>
          {isCredit ? '+' : '-'}{formatCurrency(transaction.amount)}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Details</DropdownMenuItem>
          {transaction.order_id && (
            <DropdownMenuItem>View Order</DropdownMenuItem>
          )}
          <DropdownMenuItem>Download Receipt</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
