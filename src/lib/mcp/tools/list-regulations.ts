import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { apiGet, toolError, toolText } from "../api";

export default defineTool({
  name: "list_regulations",
  title: "List regulations (Notice & Comment)",
  description:
    "List published regulations open for public notice and comment, with title, agency, and closing date.",
  inputSchema: {
    query: z.string().trim().min(1).optional().describe("Optional keyword filter."),
    page: z.number().int().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, page, limit }) => {
    try {
      const data = await apiGet("/regulations", {
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
