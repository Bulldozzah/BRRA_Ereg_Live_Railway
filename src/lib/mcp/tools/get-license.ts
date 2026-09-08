import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { apiGet, toolError, toolText } from "../api";

export default defineTool({
  name: "get_license",
  title: "Get license details",
  description:
    "Retrieve the full details of a single Zambia business license by its numeric ID, including issuing agency, jurisdiction, fees, processing time, and requirements.",
  inputSchema: {
    id: z.number().int().positive().describe("Numeric license ID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }) => {
    try {
      const data = await apiGet(`/licenses/${id}`);
      return toolText(data);
    } catch (err) {
      return toolError(err instanceof Error ? err.message : String(err));
    }
  },
});
