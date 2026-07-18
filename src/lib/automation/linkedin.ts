import "server-only";

const RETRIES = 3;

/**
 * Publish a text post via the LinkedIn REST Posts API (personal profile URN).
 * Returns the LinkedIn post URN. Throws on failure.
 */
export async function publishSummary(text: string): Promise<string> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) throw new Error("LINKEDIN_ACCESS_TOKEN not configured");

  const payload = {
    author: process.env.LINKEDIN_AUTHOR_URN || "urn:li:person:lcxBLP9jZV",
    commentary: text,
    visibility: "PUBLIC",
    distribution: { feedDistribution: "MAIN_FEED" },
    lifecycleState: "PUBLISHED",
    isReshareDisabledByAuthor: false,
  };
  const headers = {
    Authorization: `Bearer ${token}`,
    "LinkedIn-Version": process.env.LINKEDIN_VERSION || "202601",
    "X-Restli-Protocol-Version": "2.0.0",
    "Content-Type": "application/json",
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch("https://api.linkedin.com/rest/posts", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        return res.headers.get("x-restli-id") ?? "";
      }
      if (res.status === 401) {
        throw new Error(
          "LinkedIn token expired or invalid (401) — replace LINKEDIN_ACCESS_TOKEN"
        );
      }
      const body = (await res.text()).slice(0, 500);
      if (res.status >= 400 && res.status < 500) {
        throw new Error(`LinkedIn rejected post: ${res.status} ${body}`);
      }
      lastError = new Error(`LinkedIn ${res.status}: ${body}`);
    } catch (err) {
      // 4xx errors are terminal; only network/5xx failures are retried.
      if (err instanceof Error && /rejected post|token expired/.test(err.message)) throw err;
      lastError = err;
    }
    console.warn(`[automation] linkedin attempt ${attempt} failed:`, lastError);
  }
  throw new Error(`LinkedIn publish failed after ${RETRIES} attempts: ${lastError}`);
}
