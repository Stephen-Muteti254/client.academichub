import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const TABS = ["all", "pending", "accepted", "rejected"];
const LIMIT = 10;

interface Bid {
  id: string;
  order_id: string;
  order_title: string;
  order_description?: string;
  writer_id: string;
  writer_name?: string;
  bid_amount: number;
  message?: string;
  delivery_time?: string;
  response_deadline?: string;
  status: string;
  created_at: string;
}

export default function OrderBids() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bids, setBids] = useState<Bid[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadingRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const { tab, orderId, bidTab = "pending" } = useParams();
  const [actionLoading, setActionLoading] = useState<{
    [bidId: string]: "accept" | "reject" | null;
  }>({});


  // Fetch bids for this order (using mock data)
  const fetchBids = useCallback(
    async (p = 1, reset = false) => {
      if (!reset && loadingRef.current) return;
      loadingRef.current = true;

      try {
        reset ? setInitialLoading(true) : setLoading(true);

        const params: any = { page: p, limit: LIMIT };
        if (bidTab !== "all") params.status = bidTab;

        const res = await api.get(`/client/orders/${orderId}/bids`, {
          params,
        });

        const list = (res.data?.bids || []).map(b => ({
          ...b,
          submitted_at: b.submitted_at || b.created_at,
        }));
        const pagination = res.data?.pagination || {};
        console.log(list);

        setBids(prev => (reset ? list : [...prev, ...list]));
        setPage(pagination.page || p);
        setHasMore((pagination.page || p) < (pagination.total_pages || 1));
        console.log(bids);
      } catch (err: any) {
        toast({
          title: "Error",
          description:
            err.response?.data?.message || "Failed to load order bids",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        if (reset) setInitialLoading(false);
        loadingRef.current = false;
      }
    },
    [orderId, bidTab, toast]
  );


  // Reset on tab change
  useEffect(() => {
    setBids([]);
    setPage(1);
    setHasMore(true);
    fetchBids(1, true);
  }, [bidTab, fetchBids]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el || loadingRef.current || !hasMore) return;

    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      fetchBids(page + 1);
    }
  }, [fetchBids, hasMore, page]);

  // Bid Actions
  const handleAcceptBid = async (bidId: string) => {
    setActionLoading(prev => ({ ...prev, [bidId]: "accept" }));
    try {
      await api.put(`/client/bids/${bidId}/status`, { action: "accept" });
      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: "accepted" } : b));
      toast({ title: "Bid Accepted", description: "Writer assigned to order" });
    } catch (err: any) {
        const errorData = err.response?.data?.error;

        toast({
          title: errorData?.code || "Error",
          description: errorData?.message || "Failed to accept bid",
          variant: "destructive",
        });
      } finally {
      setActionLoading(prev => ({ ...prev, [bidId]: null }));
    }
  };


  const handleRejectBid = async (bidId: string) => {
    setActionLoading(prev => ({ ...prev, [bidId]: "reject" }));
    try {
      await api.put(`/client/bids/${bidId}/status`, { action: "reject" });
      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: "rejected" } : b));
      toast({ title: "Bid Rejected" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to reject bid",
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [bidId]: null }));
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Static Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <h1 className="text-2xl font-bold">Order Bids</h1>
      </div>

      <Card className="border-0 flex-1 flex flex-col overflow-hidden relative">
        {initialLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Tabs - Static */}
        <CardHeader className="p-0 pb-0">
          <div className="flex gap-1 px-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => navigate(`/orders/${tab}/${orderId}/bids/${t}`)}
                className={`pb-1 px-4 text-sm font-medium transition-colors ${
                  bidTab === t
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </CardHeader>

        {/* Bid List */}
        {/* Scrollable Bid List */}
        <CardContent className="p-0 flex-1 overflow-hidden">
          <ScrollArea
            ref={viewportRef}
            onScroll={handleScroll}
            className="h-full w-full"
          >
            <div className="space-y-4 p-4">
              {bids.length === 0 && !initialLoading && (
                <div className="text-center py-10 text-muted-foreground">No bids found.</div>
              )}

              {bids.map((bid) => (
                <Card key={bid.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-6">
                      {/* LEFT – Bid Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">
                              {bid.writerName || "Anonymous Writer"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Submitted {new Date(bid.submitted_at || bid.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {bid.message && (
                          <div className="border-t pt-3 text-sm">
                            <strong className="text-foreground">Writer message:</strong>
                            <p className="mt-1 text-muted-foreground">{bid.message}</p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                          {bid.delivery_time && (
                            <span>
                              <strong className="text-foreground">Delivery:</strong> {bid.delivery_time}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* RIGHT – Price & Actions */}
                      <div className="flex flex-col items-end justify-between sm:w-48">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            ${Number(bid.amount).toFixed(2)}
                          </p>
                          <Badge
                            variant={
                              bid.status === "pending"
                                ? "default"
                                : bid.status === "accepted"
                                ? "default"
                                : "destructive"
                            }
                            className="mt-1"
                          >
                            {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Message button for unconfirmed, open, pending */}
                          {(bid.status === "unconfirmed" ||
                            bid.status === "open" ||
                            bid.status === "pending") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                navigate(`/chats?order=${bid.order_id}&writer=${bid.writerId}`)
                              }
                              className="w-full mt-4"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Message
                            </Button>
                          )}

                          {/* Accept + Reject only for open | pending */}
                          {(bid.status === "open" || bid.status === "pending") && (
                            <>
                            {console.log("BUTTON STATE", {
                              bidId: bid.id,
                              actionValue: actionLoading[bid.id],
                              disabled: actionLoading[bid.id] != null,
                              status: bid.status
                            })}
                            <div className="flex flex-col gap-2 mt-2 w-full">
                              <Button
                                size="sm"
                                onClick={() => handleAcceptBid(bid.id)}
                                className="w-full"
                                disabled={actionLoading[bid.id] != null}
                              >
                                {actionLoading[bid.id] === "accept" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Accept Bid"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectBid(bid.id)}
                                className="w-full"
                                disabled={actionLoading[bid.id] != null}
                              >
                                {actionLoading[bid.id] === "reject" ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Reject"
                                )}
                              </Button>
                            </div>
                            </>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {loading && !initialLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {!hasMore && bids.length > 0 && (
                <p className="text-center py-3 text-muted-foreground text-sm">
                  No more bids
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
