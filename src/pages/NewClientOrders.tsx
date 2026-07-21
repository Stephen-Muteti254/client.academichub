import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { FileExplorer } from "@/components/FileExplorer/FileExplorer";
import { FileExplorerItem } from "@/components/FileExplorer/FileExplorerItem";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useLocation } from "react-router-dom";

interface Order {
  id: string;
  title: string;
  subject: string;
  type: string;
  pages: number;
  budget: number;
  status: string;
  deadline: string;
  created_at: string;
  writer_assigned?: boolean;
}

export default function ClientOrders() {
  const params = useParams();
  const { tab } = params;
  const orderId = params.orderId;
  const { pathname } = useLocation();
  const isCreate = pathname.endsWith("/create");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(orderId || null);
  const [isCancelling, setIsCancelling] = useState(false);

  const validTabs = [
    { slug: "in-progress", label: "In Progress" },
    { slug: "completed", label: "Completed" },
    { slug: "cancelled", label: "Cancelled" },
    { slug: "draft", label: "Draft" },
  ];

  const currentTab = validTabs.find((t) => t.slug === tab);

  // Fetch orders
  const fetchOrders = useCallback(async (reset = false) => {
    if (loading) return;

    try {
      if (reset) {
        setInitialLoading(true);
        setPage(1);
      }

      setLoading(true);

      const statusMap: Record<string, string> = {
        "in-progress": "in_progress",
        completed: "completed",
        cancelled: "cancelled",
        draft: "draft",
      };

      const normalizedStatus = statusMap[tab] || "in_progress";

      const response = await api.get("/orders", {
        params: {
          page,
          limit: 20,
          status: normalizedStatus,
        },
      });

      const newOrders = response.data?.orders || [];

      console.log(response.data);

      setOrders(prev => reset ? newOrders : [...prev, ...newOrders]);
      setHasMore(response.data?.meta?.has_more ?? newOrders.length > 0);

    } catch (err: any) {
      toast({
        title: "Failed to load orders",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [tab, page, toast, loading]);


  // Refetch when tab changes
  useEffect(() => {
    setOrders([]);
    setPage(1);
    fetchOrders(true);
  }, [tab]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchOrders(false);
    }
  }, [page]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;
    setPage(prev => prev + 1);
  }, [hasMore, loading]);

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!cancelId) return;

    const requiresReason = orderToCancel?.writer_assigned;

    if (requiresReason && !cancelReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for cancellation as this order is already assigned.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCancelling(true);

      await api.post(`/orders/${cancelId}/cancel`, {
        reason: cancelReason || undefined,
      });

      toast({
        title: "Order Cancelled",
        description: "This order has been successfully cancelled.",
      });

      // Refresh list
      setOrders([]);
      setPage(1);
      fetchOrders(true);
      
      // Navigate away from cancelled order if viewing it
      if (orderId === cancelId) {
        navigate(`/client/orders/${tab}`);
      }
    } catch (err: any) {
      toast({
        title: "Failed to cancel order",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
      setCancelId(null);
      setCancelReason("");
      setOrderToCancel(null);
    }
  };

  const openCancelDialog = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    setOrderToCancel(order || null);
    setCancelId(orderId);
  };

  const handleOrderClick = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  if (!currentTab) {
    navigate("/client/orders/in-progress");
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border px-3 py-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
        <Button
          onClick={() => navigate(`/client/orders/${tab}/create`)}
          variant="outline"
        >
          + New Order
        </Button>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Order Listings */}
        <div className="w-60 border-r border-border flex flex-col bg-card">
          {/* Tabs */}
          <ScrollArea className="w-full pb-2 border-b border-border">
            <div className="flex whitespace-nowrap">
              {validTabs.map(({ slug, label }) => (
                <button
                  key={slug}
                  disabled={initialLoading}
                  onClick={() => navigate(`/client/orders/${slug}`)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    tab === slug
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground",
                    initialLoading
                      ? "opacity-50 cursor-not-allowed hover:text-muted-foreground"
                      : "hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Always-visible, thin horizontal scrollbar */}
            <ScrollBar orientation="horizontal" className="opacity-100 h-2" />
          </ScrollArea>

          {/* Order List */}
          <div className="flex-1 overflow-hidden">
            {initialLoading ? (
              <div className="flex flex-col justify-center items-center h-full text-muted-foreground">
                <Loader2 className="h-6 w-6 mb-2 animate-spin" />
                <p className="text-sm">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <p className="text-muted-foreground">No orders found.</p>
              </div>
            ) : (
              <FileExplorer onScroll={handleScroll}>
                {orders.map((order) => (
                  <FileExplorerItem
                    key={order.id}
                    order={order}
                    onCancel={openCancelDialog}
                    isExpanded={expandedOrderId === order.id}
                    onToggle={handleOrderClick}
                    currentTab={tab}
                  />
                ))}

                {loading && !initialLoading && (
                  <div className="flex justify-center items-center py-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <span className="text-sm">Loading more...</span>
                  </div>
                )}

                {!hasMore && orders.length > 0 && (
                  <p className="text-center text-xs text-muted-foreground py-3">
                    No more orders
                  </p>
                )}
              </FileExplorer>
            )}
          </div>
        </div>

      {/* Right Panel - Order Details */}
      <div className="flex-1 bg-background overflow-y-auto pl-2 lg:pl-3">
        {orderId || isCreate ? (
          <Outlet context={{ openCancelDialog }} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Select an order to view details</p>
          </div>
        )}
      </div>

      {/* Cancel Order Dialog */}
      <AlertDialog
        open={!!cancelId}
        onOpenChange={(open) => {
          if (isCancelling) return;
          if (!open) {
            setCancelId(null);
            setCancelReason("");
            setOrderToCancel(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel This Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
              {(orderToCancel?.writer_assigned) && (
                <>
                  <br />
                  <br />
                  <strong>This order has already been assigned to a writer.</strong>
                  Cancelling at this stage affects the writer’s workflow, so a reason is required.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {(orderToCancel?.writer_assigned) && (
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Please explain why you're cancelling this order..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isCancelling}
              onClick={() => {
                setCancelId(null);
                setCancelReason("");
                setOrderToCancel(null);
              }}
            >
              Keep Order
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClickCapture={(e) => {
                e.preventDefault();
              }}
              onClick={handleCancelOrder}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Yes, Cancel Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </div>
  );
}
