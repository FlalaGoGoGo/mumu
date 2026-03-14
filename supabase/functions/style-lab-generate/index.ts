import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STYLE_PROMPTS: Record<string, string> = {
  "madame-x":
    "Transform this photo into an elegant formal portrait in the style of John Singer Sargent's Portrait of Madame X. Use a refined 19th-century museum painting aesthetic with a restrained dark palette, polished brushwork, and dramatic dark sophistication. Keep the subject's face, pose, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
  "pearl-earring":
    "Transform this photo into a soft old-master portrait in the style of Vermeer's Girl with a Pearl Earring. Use luminous skin tones, intimate close-up composition, a quiet gaze, and delicate light against a dark background. Keep the subject's face, pose, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
  "mona-lisa":
    "Transform this photo into a Renaissance portrait in the style of Leonardo da Vinci's Mona Lisa. Use balanced composition, subtle sfumato technique, calm expression, and museum-quality realism with a soft landscape background. Keep the subject's face, pose, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
  "rembrandt":
    "Transform this photo into a dramatic portrait in the style of Rembrandt's self-portraits. Use dramatic chiaroscuro lighting, a dark background, warm earth tones, psychological depth, and painterly realism with visible brushstrokes. Keep the subject's face, pose, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
  "van-gogh":
    "Transform this photo into an expressive portrait in the style of Vincent van Gogh's self-portraits. Use vivid painterly texture, bold directional brushstrokes, vibrant colors, and an energetic post-impressionist feel. Keep the subject's face recognizable and the pose exactly as it is. Do not add text, frames, watermarks, or extra people.",
  "adele-bloch-bauer":
    "Transform this photo into a gilded decorative portrait in the style of Gustav Klimt's Portrait of Adele Bloch-Bauer I. Use luxurious gold patterning, elegant ornamental surfaces, rich decorative backgrounds, and a formal fashion portrait feel. Keep the subject's face, pose, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
  "the-kiss":
    "Transform this photo into a romantic gilded composition in the style of Gustav Klimt's The Kiss. Use decorative gold patterning, intimacy, warmth, floral ornamental backgrounds, and a tender romantic atmosphere. Keep the subjects' faces, poses, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
  "birth-of-venus":
    "Transform this photo into a graceful classical portrait in the style of Botticelli's The Birth of Venus. Use airy softness, a romantic Renaissance palette, elegant flowing forms, and luminous gentle beauty. Keep the subject's face, pose, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
  "arnolfini":
    "Transform this photo into a formal portrait in the style of Jan van Eyck's Arnolfini Portrait. Use rich interior atmosphere, historical oil-painting texture, ceremonial mood, precise detail, and a Northern Renaissance aesthetic. Keep the subjects' faces, poses, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
  "las-meninas":
    "Transform this photo into a grand court portrait in the style of Velázquez's Las Meninas. Use layered interior space, refined realism, warm golden light, a palatial atmosphere, and sophisticated group portrait composition. Keep all subjects' faces, poses, and composition exactly as they are. Do not add text, frames, watermarks, or extra people.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { sourceImageUrl, presetKey, sessionId } = await req.json();

    if (!sourceImageUrl || !presetKey || !sessionId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = STYLE_PROMPTS[presetKey];
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Unknown preset" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client — bypasses RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create generation record server-side
    const { data: genRow, error: insertErr } = await supabase
      .from("style_lab_generations")
      .insert({
        session_id: sessionId,
        preset_key: presetKey,
        source_image_url: sourceImageUrl,
        status: "generating",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to create generation record" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generationId = genRow.id;

    // Call Lovable AI with image editing
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: sourceImageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      await supabase.from("style_lab_generations").update({ status: "failed" }).eq("id", generationId);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData || !imageData.startsWith("data:image")) {
      console.error("No image in AI response");
      await supabase.from("style_lab_generations").update({ status: "failed" }).eq("id", generationId);
      return new Response(JSON.stringify({ error: "No image was generated. Try a different photo." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 and upload to storage
    const base64Data = imageData.split(",")[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const outputPath = `outputs/${sessionId}/${generationId}.png`;
    const { error: uploadError } = await supabase.storage
      .from("style-lab")
      .upload(outputPath, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      await supabase.from("style_lab_generations").update({ status: "failed" }).eq("id", generationId);
      return new Response(JSON.stringify({ error: "Failed to save result" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: publicUrl } = supabase.storage.from("style-lab").getPublicUrl(outputPath);

    // Update generation record to completed
    await supabase
      .from("style_lab_generations")
      .update({ output_image_url: publicUrl.publicUrl, status: "completed" })
      .eq("id", generationId);

    return new Response(
      JSON.stringify({ outputImageUrl: publicUrl.publicUrl, generationId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("style-lab-generate error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
