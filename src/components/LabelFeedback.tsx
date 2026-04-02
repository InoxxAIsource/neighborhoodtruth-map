import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLabelFeedback } from "@/hooks/useLabelFeedback";

interface LabelFeedbackProps {
  labelId: string;
}

export function LabelFeedback({ labelId }: LabelFeedbackProps) {
  const { feedbackStats, userFeedback, submitFeedback } = useLabelFeedback(labelId);
  const hasVoted = userFeedback !== null && userFeedback !== undefined;

  return (
    <div className="border-t pt-2 mt-2">
      <p className="text-xs text-muted-foreground mb-1.5">Is this still accurate?</p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={hasVoted && userFeedback?.is_accurate ? "default" : "outline"}
          className="h-7 px-2.5 text-xs gap-1"
          disabled={hasVoted || submitFeedback.isPending}
          onClick={() => submitFeedback.mutate(true)}
        >
          <ThumbsUp className="h-3 w-3" />
          {feedbackStats?.accurate ?? 0}
        </Button>
        <Button
          size="sm"
          variant={hasVoted && userFeedback?.is_accurate === false ? "destructive" : "outline"}
          className="h-7 px-2.5 text-xs gap-1"
          disabled={hasVoted || submitFeedback.isPending}
          onClick={() => submitFeedback.mutate(false)}
        >
          <ThumbsDown className="h-3 w-3" />
          {feedbackStats?.inaccurate ?? 0}
        </Button>
        {feedbackStats && feedbackStats.total > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {Math.round((feedbackStats.accurate / feedbackStats.total) * 100)}% say yes
          </span>
        )}
      </div>
    </div>
  );
}
