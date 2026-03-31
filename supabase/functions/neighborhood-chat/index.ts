import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { neighborhood_name, user_question, conversation_history = [], lat, lng } =
      await req.json();

    if (!neighborhood_name || !user_question) {
      return new Response(
        JSON.stringify({ error: "neighborhood_name and user_question are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query neighborhood data from Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find labels near this location (within ~1.5km)
    const radius = 0.015;
    let labelsQuery = supabase.from("labels").select("*");

    if (lat && lng) {
      const { data: allLabels } = await labelsQuery;
      var nearbyLabels = (allLabels || []).filter(
        (l: any) => Math.sqrt((l.lat - lat) ** 2 + (l.lng - lng) ** 2) <= radius
      );
    } else {
      const { data } = await labelsQuery.limit(50);
      var nearbyLabels = data || [];
    }

    // Build context from labels
    const labelSummary = nearbyLabels
      .sort((a: any, b: any) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
      .slice(0, 20)
      .map((l: any) => ({
        text: l.text,
        score: l.upvotes - l.downvotes,
        safety: l.safety,
        cost: l.cost,
        vibes: l.vibe || [],
        category: l.category,
      }));

    const avgSafety =
      nearbyLabels.length > 0
        ? (nearbyLabels.reduce((s: number, l: any) => s + l.safety, 0) / nearbyLabels.length).toFixed(1)
        : "unknown";

    const costCounts: Record<string, number> = {};
    nearbyLabels.forEach((l: any) => {
      costCounts[l.cost] = (costCounts[l.cost] || 0) + 1;
    });

    const vibeCounts: Record<string, number> = {};
    nearbyLabels.forEach((l: any) =>
      (l.vibe || []).forEach((v: string) => {
        vibeCounts[v] = (vibeCounts[v] || 0) + 1;
      })
    );
    const topVibes = Object.entries(vibeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([v, c]) => `${v} (${c} mentions)`);

    const systemPrompt = `You are a hyper-local neighborhood guide for ${neighborhood_name}.

AVAILABLE DATA FROM ${nearbyLabels.length} COMMUNITY LABELS:
- Top labels by votes: ${JSON.stringify(labelSummary.slice(0, 10))}
- Average safety rating: ${avgSafety}/5
- Cost distribution: ${JSON.stringify(costCounts)}
- Top vibes: ${topVibes.join(", ") || "none yet"}

RULES:
- Keep answers under 150 words
- Be honest, not promotional
- Cite community data when possible (e.g. "Based on ${nearbyLabels.length} community labels...")
- If you don't have enough data, say so honestly
- Suggest specific details when the data supports it
- Use a casual but helpful tone
- Focus on what the community has reported

Answer the user's question about ${neighborhood_name}.`;

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const messages = [
      ...conversation_history,
      { role: "user", content: user_question },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({
        ai_response: responseText,
        sources_used: [
          `${nearbyLabels.length} community labels`,
          `Average safety: ${avgSafety}/5`,
          topVibes.length > 0 ? `Top vibes: ${topVibes.slice(0, 3).join(", ")}` : null,
        ].filter(Boolean),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("neighborhood-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
