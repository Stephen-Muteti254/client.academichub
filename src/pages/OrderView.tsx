import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

import {
  ArrowLeft,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Download,
  Loader2,
  BookOpen,
  Quote,
  Globe,
  FileType,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useFileViewer } from "@/hooks/useFileViewer";
import { FileUploadSection, UploadFile } from "@/components/FileUploadSection";

interface OrderFile {
  id: string;
  url: string;
  name: string;
  uploadedAt?: string;
}

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
  requirements?: string[];
  files?: OrderFile[];
  sources?: number;
  citation_style?: string;
  language?: string;
  format?: string;
  client_id?: string;
  created_at: string;
}

export default function OrderView() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { previewFile, openPreview, closePreview, downloadFile } = useFileViewer();

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      const data = res.data;

      if (!data || !data.id) {
        throw new Error("Malformed response");
      }

      const parsedFiles: OrderFile[] = (data.files || []).map((url: string, idx: number) => ({
        id: String(idx),
        url,
        name: url.split("/").pop() || "file",
        uploadedAt: undefined
      }));

      setOrder({
        ...data,
        files: parsedFiles,
        requirements: Array.isArray(data.requirements)
          ? data.requirements
          : data.requirements
            ? [data.requirements]
            : [],
        description: data.description || "",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const handleFileUpload = async (message?: unknown) => {
    if (uploadFiles.length === 0) return;

    const safeMessage =
      typeof message === "string" ? message.trim() : "";

    setIsUploading(true);
    try {
      const formData = new FormData();

      uploadFiles.forEach((uploadFile, index) => {
        formData.append("files", uploadFile.file);
        formData.append("file_types", uploadFile.type);
      });

      if (safeMessage) {
        formData.append("message", safeMessage);
      }

      await api.post(`/orders/${orderId}/submissions`, formData);

      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${uploadFiles.length} file(s)`,
      });

      setUploadFiles([]);
      fetchOrder();
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Upload failed",
        description:
          err.response?.data?.error?.message || "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="shadow-card">
          <CardContent className="p-6 text-center text-muted-foreground">
            {error || "Order not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-background">
      <div className="max-w-6xl mx-auto space-y-6 p-2 md:p-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Button variant="ghost" className="gap-2 w-fit" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>

          <Button 
            variant="outline"
            onClick={() => navigate(`/writer/chats?order=${order.id}&client=${order.client_id}`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Message Client
          </Button>
        </div>

        {/* Title Section */}
        <Card className="border-none p-4 shadow-card animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                {order.title}
              </h1>
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
        </Card>

        {/* Order Summary */}
        <Card className="shadow-card animate-fade-in" style={{ animationDelay: "50ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
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
                  {order.deadline ? (
                    <p className={`text-sm font-semibold ${deadlineClass(order.deadline)}`}>
                      {formatDeadlineRemaining(order.deadline)}
                    </p>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">No deadline</p>
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
        <Card className="shadow-card animate-fade-in" style={{ animationDelay: "100ms" }}>
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
        {order.files && order.files.length > 0 && (
          <Card
            className="shadow-card animate-fade-in"
            style={{ animationDelay: "150ms" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">
                Attached Files ({order.files.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {order.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => openPreview(file.url, file.name)}
                    >
                      <div className="p-2 rounded-md bg-primary/10 shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Click to preview
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file.url, file.name);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}


        {/* File Upload Section */}
        {order.status !== "cancelled" && (
        <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
          <FileUploadSection
            files={uploadFiles}
            onFilesChange={setUploadFiles}
            onSubmit={handleFileUpload}
            isUploading={isUploading}
          />
        </div>
        )}

        {/* Quick Actions */}
        {/*<Card className="shadow-card animate-fade-in" style={{ animationDelay: "250ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" variant="outline">
              Request Revision
            </Button>
          </CardContent>
        </Card>*/}
      </div>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={closePreview}>
        <DialogContent
          forceMount
          className="z-50 m-0 p-0 gap-0 w-full h-full max-w-none bg-background border-none rounded-none overflow-hidden flex flex-col"
        >
          <DialogHeader className="flex items-center justify-between border-b bg-background/90 backdrop-blur-md px-6 py-3 shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {previewFile?.name || "Preview"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex items-center justify-center bg-muted/10 relative overflow-auto">
            {previewFile?.type === "loading" && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading file...</p>
              </div>
            )}

            {previewFile?.type === "pdf" && previewFile.url && (
              <iframe
                src={`${previewFile.url}#toolbar=0`}
                className="w-full h-full border-0 bg-card"
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
