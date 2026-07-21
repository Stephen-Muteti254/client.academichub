import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function useBalance() {
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/balance");
      setBalance(res.data);
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return { balance, loading, reload: load };
}
