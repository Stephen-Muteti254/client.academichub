import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { 
  WalletBalance, 
  WalletStats, 
  Transaction, 
  TransactionType,
  DepositResponse 
} from '@/types/wallet';
import { useToast } from '@/hooks/use-toast';
import PaystackPop from "@paystack/inline-js";

interface WalletData {
  balance: WalletBalance;
  stats: WalletStats;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export function useWallet() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [transactionFilter, setTransactionFilter] = useState<TransactionType | 'all'>('all');

  // Fetch wallet balance and stats
  const {
    data: walletData,
    isLoading: isLoadingWallet,
    isFetching: isFetchingWallet,
    error: walletError,
    refetch: refetchWallet,
  } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get('/wallet');

      return {
        balance: {
          available: response.data.available,
          pending: response.data.pending ?? 0,
          total:
            (response.data.available ?? 0) +
            (response.data.pending ?? 0),
          currency: response.data.currency ?? 'USD',
        },
        stats: response.data.stats ?? {
          total_deposits: 0,
          total_spent: 0,
          total_refunds: 0,
          total_withdrawals: 0,
        },
      };
    },

    staleTime: 30_000,
  });



  // Fetch transactions
  const { 
    data: transactionsData, 
    isLoading: isLoadingTransactions,
    isFetching: isFetchingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery<TransactionsResponse>({
    queryKey: ['wallet-transactions', transactionFilter],
    queryFn: async () => {
      const params = transactionFilter !== 'all'
        ? { type: transactionFilter }
        : {};

      const response = await api.get('/wallet/transactions', { params });

      return {
        transactions: response.data.transactions ?? [],
        total: response.data.pagination?.total ?? 0,
        page: response.data.pagination?.page ?? 1,
        limit: response.data.pagination?.limit ?? 20,
      };
    },
    staleTime: 30_000,
  });

  // Initiate deposit
  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await api.post<DepositResponse>("/wallet/deposit/init", {
        amount,
        callback_url: `${window.location.origin}/client/wallet?deposit=success`,
      });
      console.log("PAYSTACK INIT RESPONSE:", response.data);
      return response.data;
    },
    onSuccess: (data: DepositResponse) => {
      console.log("url = ", data.authorization_url);
      window.location.href = data.authorization_url;
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Deposit Failed",
        description: error.message || "Failed to initiate deposit. Please try again.",
      });
    },
  });


  // Verify deposit callback
  const verifyDepositMutation = useMutation({
    mutationFn: async (reference: string) => {
      const response = await api.post('/wallet/deposit/verify', { reference });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast({
        title: 'Deposit Successful',
        description: 'Your wallet has been credited.',
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Verification Failed',
        description: error.message || 'Failed to verify deposit. Please contact support.',
      });
    },
  });

  // Handle deposit callback from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference');
    const deposit = urlParams.get('deposit');

    if (reference && deposit === 'success') {
      verifyDepositMutation.mutate(reference);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleDeposit = useCallback(async (amount: number) => {
    await depositMutation.mutateAsync(amount);
  }, [depositMutation]);

  const handleFilterChange = useCallback((filter: TransactionType | 'all') => {
    setTransactionFilter(filter);
  }, []);

  return {
    balance: walletData?.balance ?? {
      available: 0,
      pending: 0,
      total: 0,
      currency: 'USD',
    },
    stats: walletData?.stats ?? {
      total_deposits: 0,
      total_spent: 0,
      total_refunds: 0,
      total_withdrawals: 0,
    },

    transactions: transactionsData?.transactions ?? [],
    transactionFilter,

    // IMPORTANT
    isLoadingWallet: isLoadingWallet || isFetchingWallet,
    isLoadingTransactions: isLoadingTransactions || isFetchingTransactions,
    isDepositing: depositMutation.isPending,

    walletError,
    transactionsError,

    handleDeposit,
    handleFilterChange,
    refetchWallet,
    refetchTransactions,
  };

}