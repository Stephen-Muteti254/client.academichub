import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  Loader2,
  ArrowLeft,
  XCircle,
  FileText,
  Download,
  Clock,
  X,
  Edit,
  MessageSquare,
  BookOpen,
  Quote,
  Globe,
  FileType,
  Layers,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFileViewer } from "@/hooks/useFileViewer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Order {
  id: string;
  title: string;
  subject: string;
  type: string;
  pages: number;
  deadline: string | null;
  budget: number;
  status: string;
  description?: string | null;
  requirements?: string | null;
  progress?: number;
  files?: string[];
  sources?: number;
  citation?: string;
  language?: string;
  format?: string;
  client?: {
    id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  writer?: {
    id: string;
    name: string;
    avatar?: string;
  };
  writer_id?: string;
  writer_assigned?: boolean;
  created_at: string;
  updated_at?: string;
}

export default function OrderDetails() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { orderId, tab } = useParams();
  const outletCtx = useOutletContext<any>() || {};
  const openCancelDialog = outletCtx.openCancelDialog || (() => {});
  const { previewFile, openPreview, closePreview, downloadFile } = useFileViewer();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreOrder = async () => {
    if (!order) return;
    setIsRestoring(true);

    try {
      const res = await api.post(`/orders/${order.id}/restore`);

      toast({
        title: "Order Restored",
        description: "This order is active again.",
      });

      setOrder({ ...order, status: res.data.status });
      setShowRestoreDialog(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to restore order",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };


  /** Fetch Order Details */
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Unable to load order details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!order) return;
    try {
      setIsDeclining(true);
      await api.post(`/orders/${order.id}/decline`);
      toast({
        title: "Order Declined",
        description: "You will no longer see this order.",
      });
      navigate("/writer/available-orders/declined");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error?.message || "Failed to decline order.",
        variant: "destructive",
      });
    } finally {
      setIsDeclining(false);
      setDeclineOpen(false);
    }
  };

  function formatDeadlineRemaining(deadlineIso: string): string {
    const deadline = new Date(deadlineIso);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();

    if (isNaN(deadline.getTime())) return "Invalid deadline";
    if (diffMs <= 0) return "Expired";

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;

    if (days > 0) {
      return `${days} day${days !== 1 ? "s" : ""} ${hours} hour${hours !== 1 ? "s" : ""} left`;
    }
    return `${hours} hour${hours !== 1 ? "s" : ""} left`;
  }

  function deadlineClass(deadlineIso: string) {
    const diffMs = new Date(deadlineIso).getTime() - Date.now();
    const hoursLeft = diffMs / (1000 * 60 * 60);

    if (hoursLeft <= 6) return "text-destructive";
    if (hoursLeft <= 24) return "text-warning";
    return "text-deadline";
  }

  useEffect(() => {
    if (orderId) fetchOrderDetails();
  }, [orderId]);

  /** Loading State */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  /** Not Found State */
  if (!order) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Order not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      {/*<ScrollArea className="h-[calc(100dvh-4rem)]">*/}
      <div className="max-w-6xl mx-auto space-y-6 pr-3">
        {/* Header */}
        {user?.role === "writer" && (
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Back to Available Orders
            </Button>
            <Button onClick={() => navigate(`/writer/place-bid/${order.id}`)}>
              Place Bid
            </Button>
          </div>
        )}

        {user?.role === "client" && order.status === "cancelled" && (
          <Button
            size="lg"
            className="w-full"
            variant="outline"
            onClick={() => setShowRestoreDialog(true)}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Restore Order
          </Button>
        )}

        {/* Title Section */}
        <Card className="border-none p-2 mt-2 shadow-card">
          <CardHeader className="p-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-foreground">
                  {order.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground font-mono">
                  Order ID: {order.id}
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="flex items-center text-3xl font-bold text-primary">
                  <DollarSign className="h-7 w-7" />
                  {order.budget}
                </div>
                <Badge variant="status" className="capitalize">
                  {order.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Order Summary */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {/*<Layers className="h-5 w-5 text-primary" />*/}
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="subject">{order.subject}</Badge>
              <span className="text-sm text-muted-foreground">{order.type}</span>
            </div>

            <Separator className="bg-border/50" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Deadline */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Deadline</p>
                  {order.deadline && (
                    <p className={`text-sm font-semibold ${deadlineClass(order.deadline)}`}>
                      {formatDeadlineRemaining(order.deadline)}
                    </p>
                  )}
                </div>
              </div>

              {/* Pages */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Pages</p>
                  <p className="text-sm font-semibold text-foreground">{order.pages} pages</p>
                </div>
              </div>

              {/* Sources */}
              {order.sources !== undefined && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Sources</p>
                    <p className="text-sm font-semibold text-foreground">{order.sources} sources</p>
                  </div>
                </div>
              )}

              {/* Citation */}
              {order.citation_style && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Quote className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Citation</p>
                    <p className="text-sm font-semibold text-foreground">{order.citation_style}</p>
                  </div>
                </div>
              )}

              {/* Language */}
              {order.language && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Language</p>
                    <p className="text-sm font-semibold text-foreground">{order.language}</p>
                  </div>
                </div>
              )}

              {/* Format */}
              {order.format && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileType className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Format</p>
                    <p className="text-sm font-semibold text-foreground">{order.format}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
              {order.description || "No description provided."}
            </p>
          </CardContent>
        </Card>

        {/* Attached Files */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Attached Files</CardTitle>
          </CardHeader>
          <CardContent>
            {order.files && order.files.length > 0 ? (
              <div className="space-y-3">
                {order.files.map((fileUrl, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => openPreview(fileUrl, `File ${index + 1}`)}
                    >
                      <div className="p-2 rounded-md bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">File {index + 1}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {fileUrl.split("/").pop()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(fileUrl);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No files attached.</p>
            )}
          </CardContent>
        </Card>

        {/* Role-Specific Actions */}
        <div className="space-y-3">
          {user?.role === "client" && order.writer_id ? (
            <Button
              size="lg"
              className="w-full"
              variant="outline"
              onClick={() => navigate(`/chats?order=${order.id}`)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Writer
            </Button>
          ) : user?.role === "writer" && order.client ? (
            <Button
              size="lg"
              className="w-full"
              variant="outline"
              onClick={() => navigate(`/writer/chats?order=${order.id}`)}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Client
            </Button>
          ) : null}

          {user?.role !== "client" ? (
            <div className="grid gap-3 grid-cols-2">
              <Button
                size="lg"
                className="w-full"
                variant="outline"
                onClick={() => navigate(`/writer/place-bid/${order.id}`)}
              >
                Place Your Bid
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setDeclineOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline
              </Button>
            </div>
          ) : (
            ["in_progress", "draft"].includes(order.status) && !order.writer_assigned && (
              <div className="grid gap-3 grid-cols-2">
                <Button
                  size="lg"
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(`/orders/${tab}/${order.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => openCancelDialog(order.id)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel Order
                </Button>
              </div>
            )
          )}
        </div>
      </div>
      {/*</ScrollArea>*/}

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={closePreview}>
        <DialogContent
          forceMount
          className="z-50 m-0 p-0 gap-0 w-full h-full max-w-none bg-background border-none rounded-none overflow-hidden flex flex-col"
        >
          <DialogHeader className="flex items-center justify-between border-b bg-background/90 backdrop-blur-md px-6 py-1 shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {previewFile?.name || "Preview"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex items-center justify-center bg-muted/10 relative">
            {previewFile?.type === "loading" && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading file...</p>
              </div>
            )}

            {previewFile?.type === "pdf" && previewFile.url && (
              <iframe
                src={`${previewFile.url}#toolbar=0`}
                className="w-full h-full border-0 bg-white"
                title={previewFile.name}
              />
            )}

            {previewFile?.type === "image" && previewFile.url && (
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {(previewFile?.type === "document" || previewFile?.type === "other") &&
              previewFile.rawUrl && (
                <div className="text-center space-y-3">
                  <p className="text-muted-foreground">
                    Preview unavailable for this file type.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadFile(
                        previewFile.rawUrl,
                        previewFile.rawUrl.split("/").pop() || previewFile.name
                      )
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Decline Dialog */}
      <AlertDialog
        open={declineOpen}
        onOpenChange={(open) => {
          if (!isDeclining) setDeclineOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline This Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to decline this order?
              <br /><br />
              <strong>This action cannot be undone.</strong>
              Once declined, this order will no longer appear in your available list.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeclining}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeclining}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDecline}
            >
              {isDeclining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Declining…
                </>
              ) : (
                "Yes, Decline Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore This Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reactivate the order and notify the assigned writer (if any).
              <br /><br />
              You can cancel it again later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRestoring}>
              Keep Cancelled
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRestoring}
              onClick={handleRestoreOrder}
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring…
                </>
              ) : (
                "Restore Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
