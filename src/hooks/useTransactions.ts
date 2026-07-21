import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface TransactionItem {
  id: string;
  type: "earning" | "withdrawal";
  amount: number;
  description: string;
  status: string;
  order_id: string | null;
  created_at: string;
}

export interface Filters {
  orderId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
}

export default function useTransactions() {
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const load = useCallback(
    async (reset = false) => {
      if (loading) return;
      setLoading(true);

      try {
        const res = await api.get("/transactions", {
          params: {
            limit: 20,
            page: reset ? 1 : page,
            type: filters.type,
            order_id: filters.orderId,
            date_from: filters.dateFrom,
            date_to: filters.dateTo,
          },
        });

        const tx = res.data.transactions;
        const pag = res.data.pagination;

        if (reset) {
          setItems(tx);
          setPage(2);
        } else {
          setItems((p) => [...p, ...tx]);
          setPage((p) => p + 1);
        }

        setHasMore(pag.page < pag.total_pages);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [loading, page, filters]
  );

  const refresh = () => load(true);

  useEffect(() => {
    load(true);
  }, [filters]);

  return {
    items,
    hasMore,
    loading,
    setFilters,
    filters,
    loadMore: () => load(false),
    refresh,
  };
}
