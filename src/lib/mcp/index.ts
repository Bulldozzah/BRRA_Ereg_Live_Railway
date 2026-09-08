import { defineMcp } from "@lovable.dev/mcp-js";
import searchLicenses from "./tools/search-licenses";
import getLicense from "./tools/get-license";
import listAgencies from "./tools/list-agencies";
import listRegulations from "./tools/list-regulations";
import listTaxonomies from "./tools/list-taxonomies";

export default defineMcp({
  name: "zambia-eregistry-mcp",
  title: "Zambia eRegistry",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Zambia Business eRegistry. Search and retrieve business licenses, issuing agencies, regulations open for public comment, and reference taxonomies (jurisdictions, industries, business types, activities). All data is public.",
  tools: [searchLicenses, getLicense, listAgencies, listRegulations, listTaxonomies],
});
