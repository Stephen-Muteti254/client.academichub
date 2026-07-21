import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DollarSign,
  Clock,
  FileText,
  Download,
  BookOpen,
  Quote,
  Globe,
  FileType,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  title: string;
  subject?: string;
  type?: string;
  pages: number;
  deadline: string | null;
  budget: number;
  status?: string;
  description?: string | null;
  requirements?: string | null;
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
}

interface OrderInfoCardProps {
  order: Order;
  compact?: boolean;
  defaultExpanded?: boolean;
  onViewFullDetails?: () => void;
  onDownloadFile?: (url: string, name?: string) => void;
  onPreviewFile?: (url: string, name: string) => void;
  className?: string;
}

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

export function OrderInfoCard({
  order,
  compact = false,
  defaultExpanded = true,
  onViewFullDetails,
  onDownloadFile,
  onPreviewFile,
  className,
}: OrderInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showDescription, setShowDescription] = useState(false);
  const [showFiles, setShowFiles] = useState(false);

  const hasFiles = order.files && order.files.length > 0;
  const hasDescription = order.description && order.description.trim().length > 0;

  return (
    <Card className={cn("shadow-card overflow-hidden", className)}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {/* Header - Always Visible */}
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-semibold line-clamp-1">
                  Order Details
                </CardTitle>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {order.title}
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Quick Stats Row */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {order.subject}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {order.type}
              </Badge>
              <Badge variant="outline" className="capitalize text-xs">
                {order.status.replace("_", " ")}
              </Badge>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* Budget */}
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Budget</p>
                  <p className="text-sm font-bold text-primary">${order.budget}</p>
                </div>
              </div>

              {/* Deadline */}
              {order.deadline && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="p-1.5 rounded-md bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deadline</p>
                    <p className={cn("text-sm font-semibold", deadlineClass(order.deadline))}>
                      {formatDeadlineRemaining(order.deadline)}
                    </p>
                  </div>
                </div>
              )}

              {/* Pages */}
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="p-1.5 rounded-md bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pages</p>
                  <p className="text-sm font-semibold text-foreground">{order.pages}</p>
                </div>
              </div>

              {/* Sources */}
              {order.sources !== undefined && (
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="p-1.5 rounded-md bg-muted">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sources</p>
                    <p className="text-sm font-semibold text-foreground">{order.sources}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details Row */}
            {(order.citation || order.language || order.format) && (
              <>
                <Separator className="bg-border/50" />
                <div className="flex flex-wrap gap-4">
                  {order.citation && (
                    <div className="flex items-center gap-2 text-sm">
                      <Quote className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Citation:</span>
                      <span className="font-medium">{order.citation}</span>
                    </div>
                  )}
                  {order.language && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Language:</span>
                      <span className="font-medium">{order.language}</span>
                    </div>
                  )}
                  {order.format && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileType className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Format:</span>
                      <span className="font-medium">{order.format}</span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Description Collapsible */}
            {hasDescription && (
              <Collapsible open={showDescription} onOpenChange={setShowDescription}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-10 px-3 bg-muted/30 hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {/*<Info className="h-4 w-4" />*/}
                      Description
                    </span>
                    {showDescription ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 p-4 rounded-lg bg-muted/20 border border-border/30">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {order.description}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Attached Files Collapsible */}
            {hasFiles && (
              <Collapsible open={showFiles} onOpenChange={setShowFiles}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between h-10 px-3 bg-muted/30 hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      {/*<FileText className="h-4 w-4" />*/}
                      Attached Files
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                        {order.files!.length}
                      </Badge>
                    </span>
                    {showFiles ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 space-y-2">
                    {order.files!.map((fileUrl, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors group"
                      >
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                          onClick={() => onPreviewFile?.(fileUrl, `File ${index + 1}`)}
                        >
                          <div className="p-2 rounded-md bg-primary/10 shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">File {index + 1}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {fileUrl.split("/").pop()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadFile?.(fileUrl, fileUrl.split("/").pop());
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Order ID Footer */}
            <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/30">
              <span className="font-mono">Order ID: {order.id}</span>
              {order.client && (
                <span>Client: {order.client.name}</span>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default OrderInfoCard;
