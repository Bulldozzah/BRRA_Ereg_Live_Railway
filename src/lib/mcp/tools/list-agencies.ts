import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { apiGet, toolError, toolText } from "../api";

export default defineTool({
  name: "list_agencies",
  title: "List issuing agencies",
  description:
    "List Zambian government agencies that issue business licenses. Optional keyword filter matches agency name.",
  inputSchema: {
    query: z.string().trim().min(1).optional().describe("Optional keyword filter."),
    page: z.number().int().min(1).max(200).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, page, limit }) => {
    try {
      const data = await apiGet("/agencies", {
        search: query,
        page: page ?? 1,
        limit: limit ?? 50,
      });
      return toolText(data);
    } catch (err) {
      return toolError(err instanceof Error ? err.message : String(err));
    }
  },
});
