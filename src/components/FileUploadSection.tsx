import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, X, FileText, Loader2, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const FILE_TYPES = [
  { value: "ai_report", label: "AI Report" },
  { value: "plagiarism_report", label: "Plagiarism Report" },
  { value: "final_draft", label: "Final Draft" },
  { value: "revision", label: "Revision" },
  { value: "outline", label: "Outline" },
  { value: "reference_material", label: "Reference Material" },
  { value: "additional_content", label: "Additional Content" },
  { value: "other", label: "Other" },
] as const;

export type FileType = typeof FILE_TYPES[number]["value"];

export interface UploadFile {
  id: string;
  file: File;
  type: FileType;
  progress?: number;
}

interface FileUploadSectionProps {
  files: UploadFile[];
  onFilesChange: (files: UploadFile[]) => void;
  onSubmit: (message: string) => void;
  isUploading: boolean;
}

export function FileUploadSection({
  files,
  onFilesChange,
  onSubmit,
  isUploading,
}: FileUploadSectionProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [writerMessage, setWriterMessage] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFiles: UploadFile[] = droppedFiles.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: "additional_content" as FileType,
      }));

      onFilesChange([...files, ...newFiles]);
    },
    [files, onFilesChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const selectedFiles = Array.from(e.target.files);
    const newFiles: UploadFile[] = selectedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      type: "additional_content" as FileType,
    }));

    onFilesChange([...files, ...newFiles]);
    e.target.value = "";
  };

  const updateFileType = (id: string, type: FileType) => {
    onFilesChange(
      files.map((f) => (f.id === id ? { ...f, type } : f))
    );
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Files
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <CloudUpload className={cn(
            "h-12 w-12 mx-auto mb-3 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-sm font-medium mb-1">
            {isDragging ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="text-xs text-muted-foreground">
            or click to browse from your computer
          </p>
        </div>

        {/* Files Table */}
        {files.length > 0 && (
          <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[40%]">File Name</TableHead>
                  <TableHead className="w-[15%]">Size</TableHead>
                  <TableHead className="w-[35%]">File Type</TableHead>
                  <TableHead className="w-[10%] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((uploadFile) => (
                  <TableRow key={uploadFile.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate max-w-[200px]" title={uploadFile.file.name}>
                          {uploadFile.file.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatFileSize(uploadFile.file.size)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={uploadFile.type}
                        onValueChange={(value) => updateFileType(uploadFile.id, value as FileType)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FILE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(uploadFile.id)}
                        disabled={isUploading}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>            
          </div>

          {/* Writer Message */}
          <div className="space-y-2">
            <Label htmlFor="writer-message" className="text-sm font-medium">
              Message to Client <span className="text-muted-foreground">(optional)</span>
            </Label>

            <Textarea
              id="writer-message"
              placeholder="Add a short note for the client about these files..."
              value={writerMessage}
              onChange={(e) => setWriterMessage(e.target.value)}
              maxLength={500}
              className="resize-none"
            />

            <div className="text-xs text-muted-foreground text-right">
              {writerMessage.length}/500
            </div>
          </div>
          </>
        )}

        {/* Submit Button */}
        {files.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={() => onSubmit(writerMessage)} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit {files.length} {files.length === 1 ? "File" : "Files"}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
