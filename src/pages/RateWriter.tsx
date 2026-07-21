import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Star, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

const RATING_LABELS = [
  { value: 1, label: "Poor", description: "Did not meet expectations" },
  { value: 2, label: "Fair", description: "Below average quality" },
  { value: 3, label: "Good", description: "Met expectations" },
  { value: 4, label: "Very Good", description: "Exceeded expectations" },
  { value: 5, label: "Excellent", description: "Outstanding work!" },
];

export default function RateWriter() {
  const { orderId } = useParams<{ orderId: string }>();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeRating = hoveredRating || rating;
  const currentLabel = RATING_LABELS.find((r) => r.value === activeRating);


  useEffect(() => {
    const checkReview = async () => {
      try {
        const res = await api.get(`/orders/${orderId}/has_review`);
        setIsSubmitted(res.data.isSubmitted);
      } finally {
        setLoading(false);
      }
    };
    checkReview();
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/orders/${orderId}/review`, {
        rating,
        review: review.trim() || undefined,
      });

      setIsSubmitted(true);
      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      // Navigate back after a short delay
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center border-success/20 bg-success/5">
          <CardContent className="pt-10 pb-10">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Thank You!
            </h2>
            <p className="text-muted-foreground">
              Your review has been submitted successfully.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Rate Your Writer</h1>
            <p className="text-sm text-muted-foreground">Order {orderId}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="h-[calc(100dvh-4rem)]">
      <div className="max-w-4xl mx-auto pr-3 py-8">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">How was your experience?</CardTitle>
            <CardDescription className="text-base">
              Your feedback helps writers improve and helps other clients make informed decisions.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            {/* Star Rating */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className={cn(
                      "relative p-1 transition-all duration-200 ease-out",
                      "hover:scale-110 active:scale-95",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                    )}
                  >
                    <Star
                      className={cn(
                        "h-10 w-10 sm:h-12 sm:w-12 transition-all duration-200",
                        value <= activeRating
                          ? "fill-rating text-rating drop-shadow-[0_0_8px_hsl(var(--rating)/0.5)]"
                          : "fill-transparent text-muted-foreground/40 hover:text-muted-foreground/60"
                      )}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              <div
                className={cn(
                  "h-14 flex flex-col items-center justify-center transition-all duration-200",
                  activeRating > 0 ? "opacity-100" : "opacity-0"
                )}
              >
                {currentLabel && (
                  <>
                    <span className="text-lg font-semibold text-foreground">
                      {currentLabel.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {currentLabel.description}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Review Text */}
            <div className="space-y-3">
              <Label htmlFor="review" className="text-base font-medium">
                Write a review <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="review"
                placeholder="Share your experience with this writer. What did they do well? Any suggestions for improvement?"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
                className="resize-none bg-muted/30 border-border/50 focus:border-primary/50 transition-colors"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {review.length}/1000 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="sm:flex-1 order-2 sm:order-1"
                disabled={isSubmitting}
              >
                Skip for now
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="sm:flex-1 order-1 sm:order-2 gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          Your review will be visible to the writer and may be displayed publicly to help other clients.
        </p>
      </div>
    </ScrollArea>
    </div>
  );
}
