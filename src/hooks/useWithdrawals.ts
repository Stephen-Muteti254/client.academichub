import { useState, useEffect } from "react";
import api from "@/lib/api";


export default function useWithdrawals(filters) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const LIMIT = 20;

  async function load(reset = false, p = 1) {
    try {
      const res = await api.get("/withdrawals", {
        params: {
          page: p,
          limit: LIMIT,
          from: filters.dateFrom,
          to: filters.dateTo,
        }
      });

      const list = res.data.withdrawals || [];
      const pagination = res.data.pagination;

      setHasMore(p < pagination.total_pages);
      setItems(reset ? list : (prev) => [...prev, ...list]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItems([]);
    setPage(1);
    load(true, 1);
  }, [filters]);

  useEffect(() => {
    if (page > 1) load(false, page);
  }, [page]);

  return { items, loading, hasMore, loadMore: () => setPage(p => p + 1) };
}
