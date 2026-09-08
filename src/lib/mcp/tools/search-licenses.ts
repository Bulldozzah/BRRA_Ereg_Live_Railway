import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { apiGet, toolError, toolText } from "../api";

export default defineTool({
  name: "search_licenses",
  title: "Search business licenses",
  description:
    "Search Zambia business licenses by keyword. Matches license name, description, keywords, purpose, and requirements. Returns a paginated list with basic license info.",
  inputSchema: {
    query: z
      .string()
      .trim()
      .min(1)
      .describe("Free-text search term (e.g. 'mining', 'restaurant', 'import')."),
    page: z.number().int().min(1).max(200).optional().describe("Page number, defaults to 1."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Results per page (1-50), defaults to 20."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, page, limit }) => {
    try {
      const data = await apiGet("/licenses", {
        search: query,
        page: page ?? 1,
        limit: limit ?? 20,
      });
      return toolText(data);
    } catch (err) {
      return toolError(err instanceof Error ? err.message : String(err));
    }
  },
});
