import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  User
} from "lucide-react";

interface SubmittedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

// Mock submission data
const mockSubmissions = {
  "SUB-001": {
    id: "SUB-001",
    orderId: "AO-001",
    orderTitle: "Business Plan for Tech Startup",
    writer: {
      name: "John Writer",
      rating: 4.8,
      completedOrders: 156
    },
    submittedAt: "2024-01-16 10:30 AM",
    files: [
      { id: "1", name: "Business_Plan_Final.docx", type: "Final", size: "2.3 MB", uploadedAt: "2024-01-16 10:30 AM" },
      { id: "2", name: "AI_Detection_Report.pdf", type: "AI Report", size: "0.8 MB", uploadedAt: "2024-01-16 10:30 AM" },
      { id: "3", name: "Plagiarism_Check.pdf", type: "Plagiarism Report", size: "1.1 MB", uploadedAt: "2024-01-16 10:30 AM" }
    ] as SubmittedFile[]
  }
};

const getFileTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    "Final": "bg-success/10 text-success",
    "Draft": "bg-blue-500/10 text-blue-600",
    "AI Report": "bg-purple-500/10 text-purple-600",
    "Plagiarism Report": "bg-indigo-500/10 text-indigo-600",
    "Revision": "bg-amber-500/10 text-amber-600",
    "Additional": "bg-gray-500/10 text-gray-600"
  };
  return colors[type] || "bg-muted text-muted-foreground";
};

export default function ReviewSubmission() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const submission = mockSubmissions[submissionId as keyof typeof mockSubmissions];

  const handleApprove = async () => {
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Submission Approved!",
        description: "Payment has been released to the writer."
      });
      setIsProcessing(false);
      navigate("/orders/completed/all");
    }, 1500);
  };

  const handleRequestRevision = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback for the revision request",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Revision Requested",
        description: "The writer has been notified of the required changes."
      });
      setIsProcessing(false);
      navigate("/orders/revision/all");
    }, 1500);
  };

  const handleReject = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejecting the submission",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Submission Rejected",
        description: "The writer has been notified.",
        variant: "destructive"
      });
      setIsProcessing(false);
      navigate("/orders/disputed/all");
    }, 1500);
  };

  if (!submission) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Submission not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Review Submission</h1>
            <p className="text-sm text-muted-foreground">Review and approve the writer's work</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Submitted Files */}
          <Card>
            <CardHeader>
              <CardTitle>Submitted Files</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review all files submitted by the writer
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {submission.files.map((file) => (
                <Card key={file.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className={getFileTypeColor(file.type)}>
                              {file.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Feedback Section */}
          <Card>
            <CardHeader>
              <CardTitle>Provide Feedback</CardTitle>
              <p className="text-sm text-muted-foreground">
                Required if requesting revision or rejecting submission
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feedback">Your Feedback</Label>
                <Textarea
                  id="feedback"
                  placeholder="Provide detailed feedback on the submission, including any issues or required changes..."
                  className="min-h-[200px]"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {feedback.length} / 2000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Guidelines */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Review Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Approve:</span> If the work meets all requirements and quality standards. Payment will be released immediately.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <RefreshCw className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Request Revision:</span> If minor changes are needed. Writer will resubmit within the agreed timeline.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium">Reject:</span> If the work is significantly below standards or doesn't meet requirements. This may lead to dispute resolution.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              className="w-full bg-success hover:bg-success/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve & Pay
            </Button>
            
            <Button
              onClick={handleRequestRevision}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Request Revision
            </Button>
            
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              variant="destructive"
              className="w-full"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Title</p>
                <p className="font-medium">{submission.orderTitle}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                <p className="font-mono text-sm">#{submission.orderId}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Submission ID</p>
                <p className="font-mono text-sm">#{submission.id}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Submitted At</p>
                <p className="font-medium">{submission.submittedAt}</p>
              </div>
            </CardContent>
          </Card>

          {/* Writer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Writer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-brand-primary" />
                </div>
                <div>
                  <p className="font-medium">{submission.writer.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>⭐ {submission.writer.rating}</span>
                    <span>•</span>
                    <span>{submission.writer.completedOrders} orders</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Profile
              </Button>

              <Button variant="outline" className="w-full">
                Message Writer
              </Button>
            </CardContent>
          </Card>

          {/* Important Notice */}
          <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-amber-900 dark:text-amber-100">Important</p>
                  <p className="text-amber-800 dark:text-amber-200">
                    Once you approve, payment will be released to the writer immediately. Please review carefully.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
