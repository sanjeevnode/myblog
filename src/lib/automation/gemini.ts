import "server-only";

/**
 * Gemini blog generation, ported from myblog-automation. Direct generation
 * (no search grounding) with JSON mode; output is Tiptap JSON validated
 * against the node types the editor/renderer supports.
 */

// One area is picked at random per run — this is what actually forces variety;
// an unseeded LLM asked "pick a topic" converges on the same few favorites.
const TECH_TOPIC_AREAS = [
  "distributed systems", "consensus algorithms", "databases", "database internals",
  "sql optimization", "nosql databases", "storage engines", "indexing techniques",
  "query execution", "transaction processing", "mvcc", "replication",
  "database sharding", "database partitioning", "distributed databases",
  "time series databases", "graph databases", "vector databases", "search engines",
  "information retrieval", "full-text search", "inverted indexes", "caching systems",
  "redis internals", "memcached", "content delivery networks", "api design",
  "rest apis", "graphql", "grpc", "webhooks", "event-driven architecture",
  "event sourcing", "cqrs", "microservices", "monolithic architecture",
  "service mesh", "backend architecture", "software architecture",
  "clean architecture", "hexagonal architecture", "domain-driven design",
  "design patterns", "software engineering principles", "dependency injection",
  "message queues", "apache kafka", "rabbitmq", "apache pulsar",
  "stream processing", "real-time data processing", "observability",
  "distributed tracing", "structured logging", "application monitoring",
  "metrics collection", "performance profiling", "performance optimization",
  "benchmarking", "memory optimization", "cpu optimization", "garbage collection",
  "memory allocators", "concurrency", "multithreading", "parallel programming",
  "async programming", "lock-free programming", "thread synchronization",
  "operating systems", "linux internals", "windows internals",
  "process scheduling", "virtual memory", "file systems", "kernel architecture",
  "system calls", "network programming", "computer networking", "tcp/ip", "udp",
  "http", "http2", "http3", "quic", "tls", "dns", "dhcp", "bgp",
  "vpn technologies", "load balancing", "reverse proxies", "nginx",
  "envoy proxy", "web servers", "authentication", "authorization", "oauth2",
  "openid connect", "jwt", "identity management", "access control",
  "cybersecurity", "application security", "web security", "network security",
  "cryptography", "public key infrastructure", "ssl certificates",
  "secure coding", "owasp top 10", "software vulnerabilities",
  "penetration testing", "malware analysis", "reverse engineering",
  "container security", "cloud security", "devsecops", "docker",
  "container runtimes", "kubernetes", "kubernetes internals", "helm",
  "container orchestration", "serverless computing", "edge computing",
  "cloud architecture", "aws services", "azure architecture", "google cloud",
  "multi-cloud", "hybrid cloud", "infrastructure as code", "terraform",
  "pulumi", "ansible", "configuration management", "devops", "ci/cd",
  "build systems", "github actions", "gitlab ci", "jenkins",
  "release engineering", "feature flags", "canary deployments",
  "blue green deployments", "chaos engineering", "software testing",
  "unit testing", "integration testing", "contract testing",
  "end-to-end testing", "test automation", "mutation testing",
  "compiler design", "interpreters", "language runtimes", "virtual machines",
  "jit compilation", "bytecode execution", "static analysis", "code generation",
  "program analysis", "web browsers", "browser engines", "rendering pipelines",
  "javascript engines", "css rendering", "web performance",
  "frontend architecture", "react internals", "vue internals",
  "angular architecture", "state management", "progressive web apps",
  "webassembly", "mobile development", "android internals", "ios internals",
  "cross-platform development", "flutter architecture", "react native",
  "mobile performance", "mobile security", "git internals", "version control",
  "merge algorithms", "code review practices", "developer productivity",
  "software maintenance", "technical debt", "refactoring",
  "legacy system modernization", "payment systems", "payment gateways",
  "fintech infrastructure", "digital wallets", "blockchain fundamentals",
  "smart contracts", "distributed ledgers", "cryptocurrency infrastructure",
  "machine learning", "deep learning", "mlops", "feature engineering",
  "model deployment", "model monitoring", "ai infrastructure",
  "llm architecture", "transformers", "retrieval augmented generation",
  "vector search", "prompt engineering", "ai agents", "tool calling",
  "function calling", "model context protocol", "reasoning models",
  "gpu architecture", "cuda programming", "parallel computing",
  "hardware acceleration", "computer graphics", "image processing",
  "video streaming", "audio processing", "webrtc", "websockets",
  "real-time communication", "distributed caching", "high availability",
  "fault tolerance", "resilience engineering", "disaster recovery",
  "system scalability", "horizontal scaling", "vertical scaling",
  "capacity planning", "rate limiting", "api gateways", "feature stores",
  "data engineering", "data pipelines", "etl", "streaming analytics",
  "big data", "apache spark", "hadoop ecosystem", "data lakes",
  "lakehouse architecture", "observability platforms", "edge ai",
  "internet of things", "embedded systems", "robotics software",
  "computer vision", "natural language processing", "recommendation systems",
  "search ranking algorithms", "graph algorithms",
  "algorithms and data structures", "software licensing",
  "open source ecosystems", "developer tools", "terminal utilities",
  "command line interfaces", "workflow automation", "scripting languages",
  "python internals", "go internals", "java virtual machine", "dotnet runtime",
  "rust programming", "c++ performance", "javascript runtime",
  "typescript compiler", "php internals",
];

const SYSTEM_INSTRUCTION = `You are a senior software engineer and technology writer for a personal blog
focused on Technology. Each time you run:

1. You will be given a technology area and a list of titles already published on
   the blog. Choose one specific, substantive topic within the given area that
   does not overlap with any already-published title.
2. Go deep on that one topic — a concrete concept, technique, system, or
   mechanism. Not a vague trend piece; explain how it actually works.
3. Write an original, genuinely useful blog post: how it works, why it matters,
   real trade-offs, and what a working engineer should take away. Write like a
   knowledgeable practitioner, not a press release.
4. Write a short LinkedIn post summarizing the blog for professional sharing.

Output rules:
- Output ONLY valid JSON. No markdown code fences, no preamble, no explanation
  before or after the JSON.
- The JSON must match the exact schema given in the user message.
- Word count for the blog body: 600-900 words total across all content nodes.
- The LinkedIn summary must be short and professional: one plain opening line
  stating the topic, then 2-3 bullet points (each a single crisp sentence,
  prefixed with "• ") carrying the key takeaways. No fluff, no "check out my
  blog" phrasing — the link to the full post is appended automatically after
  your text.
- Do not fabricate specific claims: no invented statistics, dates, product
  launches, paper titles, or names. Stick to well-established facts; when
  uncertain, explain concepts rather than cite specifics.
- Do not use first-person "I" — write in a neutral third-person editorial voice.
- Do not editorialize with strong opinions; explain significance factually.`;

const USER_MESSAGE_TEMPLATE = `Generate today's blog post.

Technology area for this post: {topic_area}

Titles already published on the blog — your topic must NOT overlap with any of these:
{avoid_titles}

Return ONLY a JSON object with this exact shape:

{
  "category": "Technology",
  "title": "string, under 90 characters, specific and non-clickbait",
  "excerpt": "string, 1-2 sentences, under 200 characters, used as the feed preview",
  "tags": ["array", "of", "3-5", "lowercase", "tags"],
  "content": {
    "type": "doc",
    "content": [
      // Tiptap ProseMirror JSON nodes go here.
      // Use only these node types: heading (levels 2-3), paragraph, bulletList,
      // orderedList, listItem, blockquote, codeBlock (only if genuinely relevant
      // to a tech story), and these marks: bold, italic, link.
      // Structure: start with a level-2 heading for the opening context, use
      // level-3 headings to break up 2-4 sections within the body, use at least
      // one bulleted or ordered list where it aids clarity (e.g. key facts,
      // timeline, findings), and close with a short concluding paragraph.
      // Do not use heading level 1 - the post title is rendered separately.
    ]
  },
  "linkedinSummary": "string, plain text in this exact shape: one opening line
    naming the topic, a blank line, then 2-3 bullet lines each starting with
    '• ' giving the key takeaways (one sentence each), then optionally one
    line with 2-3 relevant hashtags. Under 80 words total. The blog link is
    appended automatically — do not include any URL yourself."
}

Output must be valid, parseable JSON and nothing else.`;

const ALLOWED_NODE_TYPES = new Set([
  "heading", "paragraph", "bulletList", "orderedList", "listItem",
  "blockquote", "codeBlock", "text", "hardBreak",
]);

export type GeneratedPost = {
  category: string;
  title: string;
  excerpt: string;
  tags: string[];
  content: { type: "doc"; content: unknown[] };
  linkedinSummary: string;
};

/** Defensively remove markdown code fences / preamble around the JSON object. */
function stripFences(raw: string): string {
  const text = raw.trim();
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (fenced) return fenced[1];
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);
  return text;
}

function validate(data: Record<string, unknown>): asserts data is GeneratedPost {
  for (const key of ["category", "title", "excerpt", "tags", "content", "linkedinSummary"]) {
    if (!(key in data)) throw new Error(`missing field '${key}'`);
  }
  const nodes = (data.content as { content?: unknown }).content;
  if (!Array.isArray(nodes) || nodes.length === 0) {
    throw new Error("content.content is empty");
  }
  const check = (node: { type?: string; content?: unknown[] }) => {
    if (!ALLOWED_NODE_TYPES.has(node.type ?? "")) {
      throw new Error(`invalid Tiptap node type: ${node.type}`);
    }
    for (const child of node.content ?? []) check(child as { type?: string });
  };
  for (const node of nodes) check(node as { type?: string });
}

async function callGemini(userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 500)}`);
  }
  const body = await res.json();
  const text: string =
    body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
  if (!text) throw new Error("Gemini returned an empty response");
  return text;
}

/** Generate a validated post payload. Retries once on invalid output. */
export async function generatePost(avoidTitles: string[] = []): Promise<GeneratedPost> {
  const topicArea = TECH_TOPIC_AREAS[Math.floor(Math.random() * TECH_TOPIC_AREAS.length)];
  const titlesBlock = avoidTitles.map((t) => `- ${t}`).join("\n") || "- (none yet)";
  const userMessage = USER_MESSAGE_TEMPLATE
    .replace("{topic_area}", topicArea)
    .replace("{avoid_titles}", titlesBlock);
  console.log(`[automation] topic area: ${topicArea}`);

  let lastError: unknown;
  for (const attempt of [1, 2]) {
    const raw = await callGemini(userMessage);
    try {
      const data = JSON.parse(stripFences(raw));
      validate(data);
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`[automation] generation attempt ${attempt} invalid:`, err);
    }
  }
  throw new Error(`Gemini output invalid after 2 attempts: ${lastError}`);
}
