import { useState, useEffect } from "react";
import api from "@/lib/api";

export default function usePaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get("/payment-methods");
      setMethods(res.data.methods);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { methods, loading, reload: load };
}
