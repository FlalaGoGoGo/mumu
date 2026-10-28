import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_museum",
  title: "Get museum",
  description: "Get full public details for one museum by its museum_id.",
  inputSchema: { museum_id: z.string().min(1).describe("Canonical museum id, e.g. art-institute-of-chicago-us.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ museum_id }) => {
    const { data, error } = await supabaseAnon()
      .from("museums")
      .select("museum_id, name, address, city, state, country, lat, lng, website_url, opening_hours, tags, hero_image_url")
      .eq("museum_id", museum_id)
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No museum found with id ${museum_id}`);
    const museum = { ...data };
    return { content: [{ type: "text", text: JSON.stringify(museum) }], structuredContent: { museum } };
  },
});
