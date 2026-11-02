import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { records, thresholds } = await req.json();
    if (!Array.isArray(records) || records.length === 0) {
      return new Response(JSON.stringify({ error: "No records provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Compact recent trend (last up to 14 entries)
    const recent = records.slice(-14).map((r: any) => ({
      date: r.date,
      sludge_kg: Number(r.sludge_generated_kg),
      dry_solids_pct: Number(r.sludge_dry_solids_pct),
      biogas_m3: Number(r.biogas_yield_m3),
      methane_pct: Number(r.methane_content_pct),
      reclaimed_m3: Number(r.reclaimed_water_m3),
      reuse: r.reuse_application,
    }));

    const systemPrompt = `You are a wastewater treatment process engineer specializing in anaerobic digestion, sludge handling, and water reuse. Provide CONCISE, actionable operational recommendations. Reply ONLY in valid JSON matching: {"summary": string, "recommendations": [{"title": string, "detail": string, "priority": "high"|"medium"|"low"}]}. Provide 3-5 recommendations.`;

    const userPrompt = `Recent daily resource recovery data:\n${JSON.stringify(recent, null, 2)}\n\nOperator thresholds: methane min ${thresholds?.methaneMin ?? 55}%, reclaimed water min ${thresholds?.reclaimedMin ?? 100} m³/day.\n\nAnalyze trends in sludge generation, biogas yield, methane content, and reclaimed water reuse. Suggest specific process adjustments (e.g., digester temperature, HRT, C:N ratio, polymer dosing, filtration tuning) to improve performance.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI gateway error", status: aiRes.status, detail: text }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { summary: content, recommendations: [] }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
