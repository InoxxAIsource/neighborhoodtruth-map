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

    // Compute crime/safety breakdown
    const safetyBuckets = { dangerous: 0, sketchy: 0, moderate: 0, safe: 0, very_safe: 0 };
    nearbyLabels.forEach((l: any) => {
      if (l.safety <= 1) safetyBuckets.dangerous++;
      else if (l.safety <= 2) safetyBuckets.sketchy++;
      else if (l.safety <= 3) safetyBuckets.moderate++;
      else if (l.safety <= 4) safetyBuckets.safe++;
      else safetyBuckets.very_safe++;
    });

    const lowSafetyLabels = nearbyLabels
      .filter((l: any) => l.safety <= 2)
      .map((l: any) => ({ text: l.text, safety: l.safety, score: l.upvotes - l.downvotes }));

    // Category breakdown (good vs bad places)
    const categoryCounts: Record<string, number> = {};
    nearbyLabels.forEach((l: any) => {
      if (l.category) categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
    });

    // Time-based heuristics from vibes
    const nightVibes = ["Nightlife", "Late-night eats", "Bar scene", "Club scene", "Party"];
    const nightMentions = nearbyLabels.filter((l: any) =>
      (l.vibe || []).some((v: string) => nightVibes.some((nv) => v.toLowerCase().includes(nv.toLowerCase())))
    ).length;

    const systemPrompt = `You are NeighborhoodTruth AI — a brutally honest, hyper-local neighborhood guide for ${neighborhood_name}. You synthesize real community crowdsourced data to give people the REAL picture of a neighborhood, not the tourist brochure version.

PERSONALITY:
- You're like a street-smart local friend who's lived here for years
- Honest and direct — you don't sugarcoat dangerous areas or overhype gentrified spots
- Use casual, relatable language (think: helpful Reddit local, not a real estate agent)
- Sprinkle in emojis sparingly for personality
- When data is strong, be confident. When data is thin, say "heads up, I only have X data points here"

COMMUNITY DATA FOR ${neighborhood_name} (${nearbyLabels.length} labels):

📊 TOP LABELS (by community votes):
${JSON.stringify(labelSummary.slice(0, 12))}

🛡️ SAFETY & CRIME PROFILE:
- Average safety: ${avgSafety}/5
- Safety breakdown: ${JSON.stringify(safetyBuckets)}
- Labels flagged as unsafe (safety ≤2): ${JSON.stringify(lowSafetyLabels.slice(0, 5))}
- Crime risk estimate: ${Number(avgSafety) <= 2 ? "HIGH — multiple reports of safety concerns" : Number(avgSafety) <= 3 ? "MODERATE — mixed safety reports" : Number(avgSafety) >= 4 ? "LOW — community generally feels safe" : "INSUFFICIENT DATA"}

💰 COST OF LIVING:
- Distribution: ${JSON.stringify(costCounts)}
- Affordability: ${costCounts["$"] > costCounts["$$$"] ? "Budget-friendly area" : costCounts["$$$$"] > 2 ? "Expensive area — bring your wallet" : "Mid-range pricing"}

🎭 VIBE CHECK:
- Top vibes: ${topVibes.join(", ") || "not enough data"}
- Nightlife activity: ${nightMentions} labels mention nightlife/late-night
- Place categories: ${JSON.stringify(categoryCounts)}

RESPONSE RULES:
- Keep answers under 200 words — be punchy, not rambling
- ALWAYS cite data: "Based on ${nearbyLabels.length} community reports..." or "X out of Y locals rated this..."
- For safety questions: give a clear rating AND specific advice (which streets to avoid, what time gets sketchy)
- For vibe questions: paint a picture — what does it FEEL like walking around?
- For cost questions: give specific price ranges when possible ($$ = ~$15-25 meals)
- If someone asks about crime: be honest about the safety data, mention the score AND what labels say
- If data is insufficient (<3 labels): say "I only have X data points — take this with a grain of salt 🧂"
- Never make up specific crime statistics or fake business names
- Suggest 1-2 follow-up questions the user might want to ask

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
