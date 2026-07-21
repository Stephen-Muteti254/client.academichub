import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  MessageSquare,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useFileViewer } from "@/hooks/useFileViewer";
import { CancelOrderDialog } from "@/components/CancelOrderDialog";
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

const LIMIT = 10;

interface Submission {
  id: string;
  order_id: string;
  submission_number: number;
  writer_id: string;
  message: string;
  files: Array<{
    name: string;
    path?: string;
    url?: string;
    size?: number;
    type?: string;  // NEW: file type
  }>;
  status: string;
  created_at: string;
  updated_at?: string;
}


interface SubmissionsResponse {
  order_status: string;
  writer_assigned: boolean;
  submissions: Submission[];
}

export default function OrderSubmissions() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [writerAssigned, setWriterAssigned] = useState(false);

  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionMessage, setRevisionMessage] = useState("");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  const loadingRef = useRef(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const { previewFile, openPreview, closePreview, downloadFile } = useFileViewer();
  const [markingComplete, setMarkingComplete] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>("in_progress");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestoreOrder = async () => {
    setIsRestoring(true);
    try {
      const res = await api.post(`/orders/${orderId}/restore`);

      toast({
        title: "Order Restored",
        description: "The order has been restored and is now active.",
      });

      // Update local status immediately
      setOrderStatus(res.data.status); // submissions page
      // OR
      setOrder((prev) => prev ? { ...prev, status: res.data.status } : prev); // details page

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


  // Fetch submissions (using mock data)
  const fetchSubmissions = useCallback(
    async (reset = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        reset ? setInitialLoading(true) : setLoading(true);

        const res = await api.get(`/orders/${orderId}/submissions`);

        const data: Submission[] = res.data || [];
        console.log(data);

        setSubmissions(data.submissions || []);
        setWriterAssigned(data.writer_assigned || false);
        setOrderStatus(data.order_status);
        setHasMore(false);
      } catch (err: any) {
        const msg =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Failed to load submissions";

        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
      } finally {
        setInitialLoading(false);
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [orderId, toast]
  );


  useEffect(() => {
    fetchSubmissions(1, true);
  }, [fetchSubmissions]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el || loadingRef.current || !hasMore) return;

    if (el.scrollHeight - el.scrollTop - el.clientHeight < 120) {
      fetchSubmissions(page + 1);
    }
  }, [fetchSubmissions, hasMore, page]);

  // Request revision
  const handleRequestRevision = async () => {
    if (!selectedSubmissionId || !revisionMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide details about what needs to be revised.",
        variant: "destructive",
      });
      return;
    }

    try {
      await api.post(`/orders/${orderId}/submissions/${selectedSubmissionId}/revision`, {
        message: revisionMessage,
      });

      toast({
        title: "Revision Requested",
        description: "The writer has been notified of your revision request.",
      });

      setShowRevisionDialog(false);
      setRevisionMessage("");
      setSelectedSubmissionId(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to request revision",
        variant: "destructive",
      });
    }
  };

  // Mark order complete
  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    try {
      await api.post(`/orders/${orderId}/complete`);
      toast({
        title: "Order Completed",
        description: "This order has been marked as complete.",
      });
      navigate("/client/orders/completed");
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to mark order as complete",
        variant: "destructive",
      });
    } finally {
      setMarkingComplete(false);
    }
  };


  // Cancel order
  const handleCancelOrder = async (reason: string) => {
    setIsCancelling(true);
    try {
      await api.post(`/orders/${orderId}/cancel`, { reason });
      toast({
        title: "Order Cancelled",
        description: "This order has been cancelled.",
      });
      setOrderStatus("cancelled");
      setShowCancelDialog(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to cancel order",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const onCancelOrder = () => {
    setShowCancelDialog(true);
  };

  return (
    <div className="h-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pr-2">
        <h1 className="text-2xl font-bold">Order Submissions</h1>
        {orderStatus !== "completed" && (
          <div className="flex gap-2 pt-2">

            {/* Request Revision - Secondary action */}
            <Button
              variant="outline"
              onClick={() => setShowRevisionDialog(true)}
              disabled={!submissions.length}
            >
              <MessageSquare className="h-4 w-4" />
              Request Revision
            </Button>

            {/* Mark Complete - Primary action */}
            <Button onClick={handleMarkComplete} disabled={markingComplete || !submissions.length}>
              {markingComplete ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Mark as Complete
            </Button>

            {/* Cancel / Restore */}
            {orderStatus === "cancelled" ? (
              <Button
                variant="outline"
                onClick={() => setShowRestoreDialog(true)}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Restore Order</span>
                <span className="sm:hidden">Restore</span>
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={onCancelOrder}
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Cancel Order</span>
                <span className="sm:hidden">Cancel</span>
              </Button>
            )}

          </div>
        )}
      </div>

      <Card className="border-0 relative">
        {initialLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <CardContent className="p-0">
            <div className="p-4 pl-2 space-y-4">
              {/* No writer assigned message */}
              {!writerAssigned && !initialLoading && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No Writer Assigned Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Once you accept a bid and assign a writer, their submissions will appear here.
                    </p>
                    <Button onClick={() => navigate(`/client/orders/${orderId}/bids`)}>
                      View Bids
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* No submissions yet */}
              {writerAssigned && submissions.length === 0 && !initialLoading && (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center space-y-3">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="font-semibold text-lg">
                      No Submissions Yet
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      The assigned writer has not submitted any work for this order yet.
                      Submissions will appear here as soon as the writer uploads their work.
                    </p>
                    <p className="text-muted-foreground text-sm">
                      You’ll be able to review files, request revisions, or mark the order as complete once a submission is made.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Submissions List */}
              {submissions.map((submission, index) => (
                <Card key={submission.id} className="border shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Submission {submission.submission_number}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(submission.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge>{submission.status}</Badge>
                    </div>
                  </CardHeader>

                  <Separator />

                  <CardContent className="p-4 space-y-4">
                    {/* Writer Message */}
                    {submission.message && (
                      <div>
                        <Label className="text-sm font-semibold">Writer's Message:</Label>
                        <p className="mt-1 text-muted-foreground">{submission.message}</p>
                      </div>
                    )}

                    {/* Files */}
                    {submission.files && submission.files.length > 0 && (
                      <div>
                        <Label className="text-sm font-semibold">Submitted Files:</Label>
                        <div className="mt-2 space-y-2">
                          {submission.files.map((file, idx) => {
                            const fileUrl = `/orders/submissions/files/${submission.order_id}/${submission.id}/${file.name}`;
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div
                                  className="flex items-center gap-3 cursor-pointer"
                                  onClick={() => openPreview(fileUrl, file.name)}
                                >
                                  <div className="p-2 rounded-md bg-primary/10">
                                    <FileText className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex items-center justify-between gap-3 w-full">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">{file.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {file.type && <Badge variant="secondary" className="text-xs">{file.type}</Badge>}
                                      {file.size && <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
                                    </div>
                                  </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => downloadFile(fileUrl, file.name)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}

                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {loading && !initialLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {!hasMore && submissions.length > 0 && (
                <p className="text-center py-3 text-muted-foreground text-sm">
                  No more submissions
                </p>
              )}
            </div>
        </CardContent>
      </Card>

      {/* Revision Dialog */}
      <Dialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
            <DialogDescription>
              Please provide details about what needs to be revised or improved in this submission.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="revision-message">Revision Details *</Label>
            <Textarea
              id="revision-message"
              placeholder="Explain what changes you'd like to see..."
              value={revisionMessage}
              onChange={(e) => setRevisionMessage(e.target.value)}
              rows={5}
              required
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestRevision}>Send Revision Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <CancelOrderDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelOrder}
        writerAssigned={writerAssigned}
        isLoading={isCancelling}
      />


      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore This Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reactivate the order and allow the writer to continue working.
              <br /><br />
              The order status will be restored automatically based on previous submissions.
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
                "Yes, Restore Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Dialog open={!!previewFile} onOpenChange={closePreview}>
        <DialogContent
          forceMount
          className="z-50 m-0 p-0 gap-0 w-full h-full max-w-none bg-background border-none rounded-none overflow-hidden flex flex-col overflow-y-auto"
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

    </div>
  );
}
