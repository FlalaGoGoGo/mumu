import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CacheResult {
  artwork_id: string;
  source_url: string;
  cached_url: string | null;
  status: "success" | "failed" | "skipped";
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { artworks } = await req.json();

    if (!artworks || !Array.isArray(artworks)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'artworks' array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: CacheResult[] = [];

    for (const artwork of artworks) {
      const { artwork_id, image_url } = artwork;

      if (!artwork_id || !image_url) {
        results.push({
          artwork_id: artwork_id || "unknown",
          source_url: image_url || "",
          cached_url: null,
          status: "skipped",
          error: "Missing artwork_id or image_url",
        });
        continue;
      }

      // Check if already cached
      const fileName = `${artwork_id}.jpg`;
      const { data: existingFile } = await supabase.storage
        .from("artwork-images")
        .list("", { search: fileName });

      if (existingFile && existingFile.length > 0) {
        const { data: publicUrl } = supabase.storage
          .from("artwork-images")
          .getPublicUrl(fileName);

        results.push({
          artwork_id,
          source_url: image_url,
          cached_url: publicUrl.publicUrl,
          status: "skipped",
          error: "Already cached",
        });
        continue;
      }

      try {
        // Fetch the image with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        // Parse URL to get origin for Referer header
        let origin = "";
        try {
          const parsedUrl = new URL(image_url);
          origin = parsedUrl.origin;
        } catch {
          origin = "";
        }

        const imageResponse = await fetch(image_url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": origin,
            "Sec-Fetch-Dest": "image",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "cross-site",
          },
        });

        clearTimeout(timeoutId);

        if (!imageResponse.ok) {
          results.push({
            artwork_id,
            source_url: image_url,
            cached_url: null,
            status: "failed",
            error: `HTTP ${imageResponse.status}`,
          });
          continue;
        }

        const contentType = imageResponse.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
          results.push({
            artwork_id,
            source_url: image_url,
            cached_url: null,
            status: "failed",
            error: `Invalid content-type: ${contentType}`,
          });
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("artwork-images")
          .upload(fileName, imageBuffer, {
            contentType: contentType.includes("jpeg") || contentType.includes("jpg")
              ? "image/jpeg"
              : contentType,
            upsert: true,
          });

        if (uploadError) {
          results.push({
            artwork_id,
            source_url: image_url,
            cached_url: null,
            status: "failed",
            error: uploadError.message,
          });
          continue;
        }

        // Get public URL
        const { data: publicUrl } = supabase.storage
          .from("artwork-images")
          .getPublicUrl(fileName);

        results.push({
          artwork_id,
          source_url: image_url,
          cached_url: publicUrl.publicUrl,
          status: "success",
        });
      } catch (err) {
        results.push({
          artwork_id,
          source_url: image_url,
          cached_url: null,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const summary = {
      total: results.length,
      success: results.filter((r) => r.status === "success").length,
      failed: results.filter((r) => r.status === "failed").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    };

    return new Response(
      JSON.stringify({ summary, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
