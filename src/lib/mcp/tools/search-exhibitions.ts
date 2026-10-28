import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "search_exhibitions",
  title: "Search exhibitions",
  description: "Find museum exhibitions by keyword or museum, optionally only those on view on a date.",
  inputSchema: {
    query: z.string().optional().describe("Text matched against the exhibition name."),
    museum_id: z.string().optional().describe("Only exhibitions at this museum."),
    on_date: z.string().optional().describe("YYYY-MM-DD; only exhibitions running on this date."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, museum_id, on_date, limit }) => {
    let q = supabaseAnon()
      .from("exhibitions")
      .select("exhibition_id, museum_id, exhibition_name, start_date, end_date, official_url, short_description, museums!inner(name, city, country)")
      .limit(limit ?? 20);
    if (query) q = q.ilike("exhibition_name", `%${query}%`);
    if (museum_id) q = q.eq("museum_id", museum_id);
    if (on_date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(on_date)) throw new ToolError("on_date must be YYYY-MM-DD");
      q = q.lte("start_date", on_date).gte("end_date", on_date);
    }
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const exhibitions = (data ?? []).map((e) => {
      const m = e.museums as unknown as { name: string; city: string; country: string } | null;
      return {
        exhibition_id: e.exhibition_id, museum_id: e.museum_id, name: e.exhibition_name,
        start_date: e.start_date, end_date: e.end_date, official_url: e.official_url,
        description: e.short_description, museum_name: m?.name ?? null, city: m?.city ?? null, country: m?.country ?? null,
      };
    });
    return { content: [{ type: "text", text: JSON.stringify(exhibitions) }], structuredContent: { exhibitions } };
  },
});
