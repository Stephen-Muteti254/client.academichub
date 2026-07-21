import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";
import OrderForm from "./OrderForm";
import { Loader2 } from "lucide-react";

export default function EditOrderPage() {
  const { orderId } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setData(res.data.data || res.data);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin" />
        Loading order...
      </div>
    );
  }

  return <OrderForm mode="edit" orderId={orderId} initialData={data} />;
}