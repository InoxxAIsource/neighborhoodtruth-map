import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVoterId } from "./useVoterId";
import { toast } from "sonner";

export function useLabelFeedback(labelId: string) {
  const voterId = useVoterId();
  const queryClient = useQueryClient();

  const { data: feedbackStats } = useQuery({
    queryKey: ["label-feedback", labelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_feedback" as any)
        .select("is_accurate")
        .eq("label_id", labelId);
      if (error) throw error;
      const items = data as any[];
      const accurate = items.filter((f: any) => f.is_accurate).length;
      const inaccurate = items.length - accurate;
      return { accurate, inaccurate, total: items.length };
    },
  });

  const { data: userFeedback } = useQuery({
    queryKey: ["label-feedback-user", labelId, voterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("label_feedback" as any)
        .select("is_accurate")
        .eq("label_id", labelId)
        .eq("voter_id", voterId)
        .maybeSingle();
      if (error) throw error;
      return data as { is_accurate: boolean } | null;
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async (isAccurate: boolean) => {
      const { error } = await supabase
        .from("label_feedback" as any)
        .insert({ label_id: labelId, voter_id: voterId, is_accurate: isAccurate } as any);
      if (error) {
        if (error.code === "23505") throw new Error("Already submitted");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-feedback", labelId] });
      queryClient.invalidateQueries({ queryKey: ["label-feedback-user", labelId, voterId] });
      toast.success("Thanks for your feedback!");
    },
    onError: (e) => {
      toast.error(e.message === "Already submitted" ? "You already gave feedback!" : "Failed to submit");
    },
  });

  return { feedbackStats, userFeedback, submitFeedback };
}
