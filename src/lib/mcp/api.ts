// Shared helper for MCP tools to call the existing Zambia eRegistry Express API.
// The URL is intentionally hardcoded because the MCP function runs in a Deno
// edge runtime and must not depend on Vite env vars.
export const EREGISTRY_API_BASE_URL =
  "https://cooperative-respect-production-3d40.up.railway.app/api";

export async function apiGet<T = unknown>(
  path: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(EREGISTRY_API_BASE_URL + path);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status} ${res.statusText} at ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export function toolText(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: data as Record<string, unknown>,
  };
}

export function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}
