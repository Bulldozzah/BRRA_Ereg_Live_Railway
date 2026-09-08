import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { apiGet, toolError, toolText } from "../api";

const KIND_TO_PATH = {
  jurisdictions: "/locations",
  industries: "/industries",
  business_types: "/businesstypes",
  activities: "/activities",
} as const;

export default defineTool({
  name: "list_taxonomies",
  title: "List reference taxonomies",
  description:
    "List reference taxonomy items used to categorize licenses: jurisdictions (locations), industries, business types, or activities.",
  inputSchema: {
    kind: z
      .enum(["jurisdictions", "industries", "business_types", "activities"])
      .describe("Which taxonomy to list."),
    query: z.string().trim().min(1).optional().describe("Optional keyword filter."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kind, query, limit }) => {
    try {
      const data = await apiGet(KIND_TO_PATH[kind], {
        search: query,
        limit: limit ?? 100,
      });
      return toolText(data);
    } catch (err) {
      return toolError(err instanceof Error ? err.message : String(err));
    }
  },
});
