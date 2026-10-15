import { requestFreshData } from "@/lib/refresh/webhook";

/**
 * Ask the external pull to refresh one page's seeds.
 * REFRESH_WEBHOOK_KEY stays on the server. The JSON result never includes it.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400 });
  }

  const result = await requestFreshData(body);
  return Response.json(result.body, { status: result.status });
}
