import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "search_museums",
  title: "Search museums",
  description: "Search MuMu's museum catalog by name, city, state or country.",
  inputSchema: {
    query: z.string().optional().describe("Text matched against museum name or city."),
    country: z.string().optional().describe("Exact country name filter."),
    state: z.string().optional().describe("Exact state/region filter."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, country, state, limit }) => {
    let q = supabaseAnon()
      .from("museums")
      .select("museum_id, name, city, state, country, website_url, opening_hours, tags")
      .order("name")
      .limit(limit ?? 20);
    if (query) {
      const safe = query.replace(/[,()%]/g, " ");
      q = q.or(`name.ilike.%${safe}%,city.ilike.%${safe}%`);
    }
    if (country) q = q.eq("country", country);
    if (state) q = q.eq("state", state);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const museums = (data ?? []).map((m) => ({
      museum_id: m.museum_id, name: m.name, city: m.city, state: m.state, country: m.country,
      website_url: m.website_url, opening_hours: m.opening_hours, tags: m.tags,
    }));
    return { content: [{ type: "text", text: JSON.stringify(museums) }], structuredContent: { museums } };
  },
});
