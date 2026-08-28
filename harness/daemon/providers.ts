import type { ChatMessage, ModelInfo, Provider, ToolCall } from "../shared/types.js";

const ZEN_BASE = "https://opencode.ai/zen/v1";
const GO_BASE = "https://opencode.ai/zen/go/v1";

export type StreamCallbacks = {
  onDelta: (text: string) => void;
  signal?: AbortSignal;
};

export type ProviderStreamResult = {
  content: string;
  toolCalls: ToolCall[];
};

/** Base URL for a provider kind. */
export function baseURL(p: Provider): string {
  if (p.baseUrl) return p.baseUrl.replace(/\/$/, "");
  if (p.kind === "opencode-go") return GO_BASE;
  if (p.kind === "opencode-zen") return ZEN_BASE;
  return ZEN_BASE;
}

/**
 * Fetch the list of available models for a provider.
 * OpenCode Zen & Go both expose an OpenAI-compatible /v1/models endpoint.
 * Go's is unauthenticated; Zen needs a bearer <REDACTED>
 */
export async function fetchModels(p: Provider): Promise<ModelInfo[]> {
  const base = baseURL(p);
  const url = `${base}/models`;
  const headers: Record<string, string> = {};
  if (p.kind !== "opencode-go" && p.apiKey) {
    headers.Authorization = `Bearer ${p.apiKey}`;
  }
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`models fetch failed ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as any;
  const items: any[] = json.data ?? json.models ?? [];
  return items.map((m: any) => ({
    id: m.id,
    name: m.name || m.id,
    endpoint: m.endpoint,
  }));
}

export async function streamChat(
  provider: Provider,
  messages: ChatMessage[],
  cb: StreamCallbacks,
): Promise<ProviderStreamResult> {
  if (provider.kind === "anthropic") return streamAnthropic(provider, messages, cb);
  if (provider.kind === "opencode-go") return streamOpenAI(provider, messages, cb, GO_BASE);
  if (provider.kind === "opencode-zen") return streamOpenAI(provider, messages, cb, ZEN_BASE);
  return streamOpenAI(provider, messages, cb, baseURL(provider));
}

/* ----------------------------- OpenAI-compatible ----------------------------- */

function schema(props: Record<string, string>, required: string[]) {
  return {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(props).map(([k, v]) => [k, { type: v }]),
    ),
    required,
  };
}

function buildTools() {
  return [
    { type: "function", function: { name: "read", description: "Read a file (or list a dir). Args: {path, offset?} — offset = 1-based line to start from for big files.", parameters: schema({ path: "string", offset: "number" }, ["path"]) } },
    { type: "function", function: { name: "write", description: "Create or overwrite a file. Args: {path,content}", parameters: schema({ path: "string", content: "string" }, ["path", "content"]) } },
    { type: "function", function: { name: "edit", description: "Replace text in a file. Args: {path,old,new,all?} — 'old' must be unique unless all:true.", parameters: schema({ path: "string", old: "string", new: "string", all: "boolean" }, ["path", "old", "new"]) } },
    { type: "function", function: { name: "bash", description: "Run a shell command. Args: {command, timeout?} — timeout seconds, default 60, max 300.", parameters: schema({ command: "string", timeout: "number" }, ["command"]) } },
    { type: "function", function: { name: "glob", description: "Find files by pattern. Args: {pattern}", parameters: schema({ pattern: "string" }, ["pattern"]) } },
    { type: "function", function: { name: "grep", description: "Search file contents. Args: {pattern,path?}", parameters: schema({ pattern: "string", path: "string" }, ["pattern"]) } },
  ];
}

async function streamOpenAI(
  provider: Provider,
  messages: ChatMessage[],
  cb: StreamCallbacks,
  base: string,
): Promise<ProviderStreamResult> {
  const url = `${base}/chat/completions`;
  const body = {
    model: provider.model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content || "",
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      ...(m.tool_calls
        ? {
            tool_calls: m.tool_calls.map((t) => ({
              id: t.id,
              type: "function",
              function: { name: t.name, arguments: t.args },
            })),
          }
        : {}),
    })),
    tools: buildTools(),
    tool_choice: "auto",
    stream: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: cb.signal,
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Provider ${provider.label} error ${res.status}: ${txt.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let content = "";
  const calls: Map<number, { id: string; name: string; args: string }> = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") continue;
      let json: any;
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      const delta = json.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.content) {
        content += delta.content;
        cb.onDelta(delta.content);
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index ?? 0;
          const cur = calls.get(idx) ?? { id: "", name: "", args: "" };
          if (tc.id) cur.id = tc.id;
          if (tc.function?.name) cur.name = tc.function.name;
          if (tc.function?.arguments) cur.args += tc.function.arguments;
          calls.set(idx, cur);
        }
      }
    }
  }

  const toolCalls: ToolCall[] = [...calls.values()]
    .filter((c) => c.id && c.name)
    .map((c) => ({ id: c.id, name: c.name, args: c.args || "{}" }));

  return { content, toolCalls };
}

/** One-shot (non-streaming) completion used for /compact summarization. */
export async function summarize(provider: Provider, messages: ChatMessage[]): Promise<string> {
  const base = baseURL(provider);
  const conv = messages
    .filter((m) => m.role !== "system")
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n")
    .slice(-9000);
  const url = `${base}/chat/completions`;
  const body = {
    model: provider.model,
    stream: false,
    messages: [
      {
        role: "system",
        content:
          "You are a compaction step. Summarize the key context, decisions, files changed, and the current task of this coding session as 4-6 concise bullet points. No preamble, no markdown fences.",
      },
      { role: "user", content: conv || "(empty session)" },
    ],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${provider.apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`summarize ${res.status}: ${txt.slice(0, 160)}`);
  }
  const json = (await res.json()) as any;
  return json.choices?.[0]?.message?.content || "";
}

/* ----------------------------- Anthropic ----------------------------- */

async function streamAnthropic(
  provider: Provider,
  messages: ChatMessage[],
  cb: StreamCallbacks,
): Promise<ProviderStreamResult> {
  const url = "https://api.anthropic.com/v1/messages";
  const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const conv = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "tool" ? "user" : m.role,
      content:
        m.role === "tool"
          ? [{ type: "tool_result", tool_use_id: m.tool_call_id, content: m.content }]
          : m.tool_calls
            ? [
                { type: "text", text: m.content || "" },
                ...m.tool_calls.map((t) => ({
                  type: "tool_use",
                  id: t.id,
                  name: t.name,
                  input: safeParse(t.args),
                })),
              ]
            : m.content,
    }));

  const body = {
    model: provider.model,
    max_tokens: 4096,
    system: sys || undefined,
    messages: conv,
    tools: buildTools().map((t: any) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters,
    })),
    stream: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": provider.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: cb.signal,
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Anthropic error ${res.status}: ${txt.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let content = "";
  const calls: Map<string, { id: string; name: string; args: string }> = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      let json: any;
      try {
        json = JSON.parse(data);
      } catch {
        continue;
      }
      if (json.type === "content_block_delta" && json.delta?.type === "text_delta") {
        content += json.delta.text;
        cb.onDelta(json.delta.text);
      }
      if (json.type === "content_block_start" && json.content_block?.type === "tool_use") {
        calls.set(json.content_block.id, {
          id: json.content_block.id,
          name: json.content_block.name,
          args: "",
        });
      }
      if (json.type === "content_block_delta" && json.delta?.type === "input_json_delta") {
        for (const c of calls.values()) c.args += json.delta.partial_json;
      }
    }
  }

  const toolCalls: ToolCall[] = [...calls.values()].map((c) => ({
    id: c.id,
    name: c.name,
    args: c.args || "{}",
  }));
  return { content, toolCalls };
}

function safeParse(s: string): any {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}
