import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Bell,
  CheckCircle,
  AlertCircle,
  DollarSign,
  MessageSquare,
  FileText,
  Star,
} from "lucide-react";
import api from "@/lib/api";
import { useNotificationContext } from "@/contexts/NotificationContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  target_type?: string;
  target_group?: string;
  created_at: string;
  is_read?: boolean;
}

const LIMIT = 10;

export default function Notifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // const scrollRef = useRef<{
  //   getElement: () => HTMLDivElement | null;
  //   scrollTop: () => number;
  //   scrollHeight: () => number;
  //   clientHeight: () => number;
  // }>(null);
  const loadingRef = useRef(false);
  const nextPageRef = useRef(1);

  const { setUnreadCount } = useNotificationContext();

  // fetch (robust: page + limit + guards)
  const fetchNotifications = useCallback(
    async (p = 1, append = false) => {
      // prevent duplicate calls
      if (!append && loadingRef.current) return;

      loadingRef.current = true;
      try {
        append ? setLoading(true) : setInitialLoading(true);

        const res = await api.get("/notifications", {
          params: { page: p, limit: LIMIT },
        });

        // support different response shapes (keep compatibility)
        const fetched =
          res.data?.notifications || res.data?.data?.notifications || [];

        setNotifications(prev => (append ? [...prev, ...fetched] : fetched));
        console.log(notifications);

        // pagination info may come in different shapes — defensive
        const totalPages =
          res.data?.pagination?.total_pages ||
          res.data?.data?.pagination?.total_pages ||
          1;

        setPage(p);
        nextPageRef.current = p + 1;
        setHasMore(p < totalPages);
      } catch (err: any) {
        console.error(err);
        toast({
          title: "Error",
          description:
            err?.response?.data?.error?.message || "Failed to load notifications",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setInitialLoading(false);
        loadingRef.current = false;
      }
    },
    [toast]
  );

  // initial load
  useEffect(() => {
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  // onScroll - same pattern as AdminPayments
  const handleWindowScroll = useCallback(() => {
    if (loadingRef.current || !hasMore) return;

    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - 200) {
      fetchNotifications(nextPageRef.current, true);
    }
  }, [fetchNotifications, hasMore]);

  useEffect(() => {
    window.addEventListener("scroll", handleWindowScroll);
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, [handleWindowScroll]);


  // mark all as read
  const markAllAsRead = async () => {
    try {
      await api.post("/notifications/mark-seen");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast({ title: "All notifications marked as read" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to mark all as read",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "payment":
        return DollarSign;
      case "message":
        return MessageSquare;
      case "review":
        return Star;
      case "order":
        return FileText;
      case "warning":
      case "urgent":
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <Button
          variant="outline"
          onClick={markAllAsRead}
          disabled={unreadCount === 0}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark All Read
        </Button>
      </div>

      {/* Notifications Card */}
      <Card className="border-0">
        <CardContent className="p-0 h-full flex flex-col">
          {/* initial loading overlay (keeps original feel) */}
          {initialLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 pointer-events-none">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
            <div className="p-2 space-y-1 pb-8">
              {notifications.length === 0 && !initialLoading ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications found</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const IconComponent = getIcon(n.type);
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start space-x-4 p-4 border-b hover:bg-accent/50 transition-colors ${
                        !n.is_read ? "bg-accent/20" : ""
                      }`}
                    >
                      <div className="p-2 rounded-full bg-accent text-brand-primary">
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3
                              className={`font-medium ${
                                !n.is_read ? "font-semibold" : ""
                              }`}
                            >
                              {n.title}
                              {!n.is_read && (
                                <span className="ml-2 w-2 h-2 bg-brand-primary rounded-full inline-block"></span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {n.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(n.created_at).toLocaleString()}
                            </p>
                          </div>
                          {/* kept original design: no action buttons shown by default */}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* loader for further pages (keeps original look) */}
              {loading && !initialLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              )}

              {!hasMore && !initialLoading && notifications.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-3">
                  No more notifications
                </p>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
