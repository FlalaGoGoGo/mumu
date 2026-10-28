import { defineMcp } from "@lovable.dev/mcp-js";
import searchMuseums from "./tools/search-museums";
import getMuseum from "./tools/get-museum";
import searchExhibitions from "./tools/search-exhibitions";

export default defineMcp({
  name: "mumu",
  title: "MuMu",
  version: "0.1.0",
  instructions:
    "Public tools for MuMu, a museum discovery app. Search the museum catalog, read museum details (hours, address, website), and find exhibitions by keyword, museum, or date.",
  tools: [searchMuseums, getMuseum, searchExhibitions],
});
