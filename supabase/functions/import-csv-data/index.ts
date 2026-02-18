import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function countQuotes(str: string): number {
  return (str.match(/"/g) || []).length;
}

function parseCSVMultiline(text: string): Record<string, string>[] {
  const lines = text.split("\n");
  if (lines.length < 2) return [];
  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const headers = parseCSVLine(headerLine);
  const rows: Record<string, string>[] = [];
  let i = 1;
  while (i < lines.length) {
    let currentLine = lines[i];
    while (i < lines.length - 1 && countQuotes(currentLine) % 2 !== 0) {
      i++;
      currentLine += "\n" + lines[i];
    }
    const values = parseCSVLine(currentLine);
    if (values.length >= headers.length && values[0]) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = (values[idx] || "").trim();
      });
      rows.push(row);
    }
    i++;
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { table, app_url, replace_mode } = await req.json();
    if (!app_url) throw new Error("app_url is required");

    const results: string[] = [];

    if (table === "museums" || table === "all") {
      const resp = await fetch(`${app_url}/data/museums.csv`);
      if (!resp.ok) throw new Error(`Failed to fetch museums.csv: ${resp.status}`);
      const csvText = await resp.text();
      const rows = parseCSVMultiline(csvText);

      // If replace mode, delete exhibitions first (FK), then museums
      if (replace_mode) {
        const { error: delExh } = await supabase.from("exhibitions").delete().neq("exhibition_id", "");
        if (delExh) throw new Error(`Failed to clear exhibitions: ${delExh.message}`);
        const { error: delMus } = await supabase.from("museums").delete().neq("museum_id", "");
        if (delMus) throw new Error(`Failed to clear museums: ${delMus.message}`);
        results.push("museums: cleared existing museums + exhibitions");
      }

      const batchSize = 500;
      let total = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map((r) => ({
          museum_id: r.museum_id,
          name: r.name,
          city: r.city,
          state: r.state || null,
          country: r.country,
          lat: parseFloat(r.lat) || 0,
          lng: parseFloat(r.lng) || 0,
          address: r.address || null,
          website_url: r.website_url || null,
          opening_hours: r.opening_hours || null,
          has_full_content:
            r.has_full_content === "TRUE" || r.has_full_content === "true",
          hero_image_url: r.hero_image_url || null,
          tags: r.tags || null,
          highlight:
            (r.highlight || r.hightlight) === "TRUE" ||
            (r.highlight || r.hightlight) === "true",
        }));
        const { error } = await supabase
          .from("museums")
          .upsert(batch, { onConflict: "museum_id" });
        if (error)
          throw new Error(`museums batch at ${i}: ${error.message}`);
        total += batch.length;
      }
      results.push(`museums: upserted ${total} rows`);
    }

    if (table === "exhibitions" || table === "all") {
      const resp = await fetch(`${app_url}/data/exhibitions.csv`);
      if (!resp.ok)
        throw new Error(`Failed to fetch exhibitions.csv: ${resp.status}`);
      const csvText = await resp.text();
      const rows = parseCSVMultiline(csvText);

      // Get valid museum_ids
      const { data: museumRows } = await supabase
        .from("museums")
        .select("museum_id");
      const validIds = new Set(
        (museumRows || []).map((m: { museum_id: string }) => m.museum_id)
      );

      const batchSize = 200;
      let total = 0;
      let skipped = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        const batch = chunk
          .filter((r) => validIds.has(r.museum_id))
          .map((r) => ({
            exhibition_id: r.exhibition_id,
            museum_id: r.museum_id,
            exhibition_name: r.exhibition_name,
            cover_image_url: r.cover_image_url || null,
            start_date: r.start_date || null,
            end_date: r.end_date || null,
            official_url: r.official_url || null,
            short_description: r.short_description || null,
            related_artworks: r.related_artworks || null,
          }));
        skipped += chunk.length - batch.length;
        if (batch.length > 0) {
          const { error } = await supabase
            .from("exhibitions")
            .upsert(batch, { onConflict: "exhibition_id" });
          if (error)
            throw new Error(`exhibitions batch at ${i}: ${error.message}`);
          total += batch.length;
        }
      }
      results.push(
        `exhibitions: upserted ${total} rows (${skipped} skipped)`
      );
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
