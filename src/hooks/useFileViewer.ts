import { useState, useCallback } from "react";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api"; // your axios instance
import { useAuth } from "@/contexts/AuthContext";

interface PreviewFileState {
  url: string;        // blob url for preview
  rawUrl: string;     // original API url
  name: string;
  type: string;       // pdf | image | document | other | loading
}

const getFileType = (url: string): string => {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["pdf"].includes(ext)) return "pdf";
  if (["doc", "docx"].includes(ext)) return "document";
  return "other";
};

export function useFileViewer() {
  const { token } = useAuth();
  const [previewFile, setPreviewFile] = useState<PreviewFileState | null>(null);

  /** -------------------------------
   * PREVIEW FILE
   * --------------------------------*/
  const openPreview = useCallback(
    async (url: string, name?: string) => {
      const type = getFileType(url);
      setPreviewFile({
        url: "",
        rawUrl: url,
        name: name || url.split("/").pop() || "File",
        type: "loading",
      });

      try {
        const res = await api.get(url, {
          responseType: type === "pdf" || type === "image" ? "blob" : "arraybuffer",
          headers: { Authorization: `Bearer ${token}` },
        });

        const blob = new Blob([res.data]);
        const blobUrl = URL.createObjectURL(blob);

        setPreviewFile({
          url: blobUrl,
          rawUrl: url,
          name: name || url.split("/").pop() || "File",
          type,
        });
      } catch (err) {
        console.error("Preview error:", err);
        setPreviewFile(null);
        toast({
          title: "Error",
          description: "Unable to preview file.",
          variant: "destructive",
        });
      }
    },
    [token]
  );

  /** -------------------------------
   * CLOSE PREVIEW
   * --------------------------------*/
  const closePreview = useCallback(() => {
    if (previewFile?.url?.startsWith("blob:")) {
      URL.revokeObjectURL(previewFile.url);
    }
    setPreviewFile(null);
  }, [previewFile]);

  /** -------------------------------
   * DOWNLOAD FILE (always raw URL)
   * --------------------------------*/
  const downloadFile = useCallback(
    async (url: string, name?: string) => {
      try {
        const res = await api.get(url, {
          responseType: "blob",
          headers: { Authorization: `Bearer ${token}` },
        });

        const blobUrl = URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = name || url.split("/").pop() || "file";
        link.click();

        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        toast({
          title: "Download Failed",
          description: "Unable to download file.",
          variant: "destructive",
        });
      }
    },
    [token]
  );

  return {
    previewFile,
    openPreview,
    closePreview,
    downloadFile,
  };
}
