import { z } from "zod";

/**
 * RIG shared protocol.
 * Client (phone/desktop PWA) <-> Daemon (local harness on your Mac).
 * Transport: WebSocket JSON frames.
 */

export const ProviderKind = z.enum([
  "openai-compatible",
  "anthropic",
  "opencode-zen",
  "opencode-go",
]);
export type ProviderKind = z.infer<typeof ProviderKind>;

export const ProviderSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: ProviderKind,
  baseUrl: z.string().optional(),
  apiKey: z.string(),
  model: z.string(),
});
export type Provider = z.infer<typeof ProviderSchema>;

export const ModelInfoSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  endpoint: z.enum(["chat_completions", "messages", "responses"]).optional(),
});
export type ModelInfo = z.infer<typeof ModelInfoSchema>;

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.string(), // JSON-encoded arguments
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ChatRole = z.enum(["system", "user", "assistant", "tool"]);
export type ChatRole = z.infer<typeof ChatRole>;

export const ChatMessageSchema = z.object({
  role: ChatRole,
  content: z.string(),
  tool_call_id: z.string().optional(),
  tool_calls: z
    .array(z.object({ id: z.string(), name: z.string(), args: z.string() }))
    .optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const PermissionMode = z.enum(["auto", "ask"]);
export type PermissionMode = z.infer<typeof PermissionMode>;

export const SessionSummarySchema = z.object({
  id: z.string(),
  cwd: z.string(),
  providerId: z.string(),
  permission: PermissionMode,
  title: z.string(),
  updatedAt: z.number(),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;

/* ------------------------------------------------------------------ */
/* Client -> Daemon                                                    */
/* ------------------------------------------------------------------ */

export const ClientMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hello"), token: z.string() }),
  z.object({ type: z.literal("prompt"), sessionId: z.string(), text: z.string() }),
  z.object({ type: z.literal("abort"), sessionId: z.string() }),
  z.object({
    type: z.literal("permission"),
    sessionId: z.string(),
    toolCallId: z.string(),
    decision: z.enum(["approve", "reject"]),
  }),
  z.object({
    type: z.literal("new_session"),
    cwd: z.string(),
    providerId: z.string(),
    permission: PermissionMode,
    title: z.string().optional(),
  }),
  z.object({ type: z.literal("switch_provider"), sessionId: z.string(), providerId: z.string(), model: z.string().optional() }),
  z.object({ type: z.literal("list_providers") }),
  z.object({ type: z.literal("save_provider"), provider: ProviderSchema }),
  z.object({ type: z.literal("delete_provider"), id: z.string() }),
  z.object({ type: z.literal("restore_providers") }),
  z.object({ type: z.literal("list_sessions") }),
  z.object({ type: z.literal("open_session"), sessionId: z.string() }),
  z.object({ type: z.literal("delete_session"), sessionId: z.string() }),
  z.object({ type: z.literal("fetch_models"), providerId: z.string() }),
  z.object({ type: z.literal("compact"), sessionId: z.string() }),
  z.object({ type: z.literal("set_cwd"), sessionId: z.string(), cwd: z.string() }),
]);
export type ClientMessage = z.infer<typeof ClientMessage>;

/* ------------------------------------------------------------------ */
/* Daemon -> Client                                                    */
/* ------------------------------------------------------------------ */

export const ToolResultSchema = z.object({
  callId: z.string(),
  ok: z.boolean(),
  output: z.string(),
  diff: z.string().optional(),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

export const ServerMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paired") }),
  z.object({ type: z.literal("ready"), sessionId: z.string() }),
  z.object({ type: z.literal("message_delta"), sessionId: z.string(), delta: z.string() }),
  z.object({ type: z.literal("message_done"), sessionId: z.string() }),
  z.object({ type: z.literal("tool_call"), sessionId: z.string(), call: ToolCallSchema }),
  z.object({ type: z.literal("tool_result"), sessionId: z.string(), result: ToolResultSchema }),
  z.object({ type: z.literal("permission_request"), sessionId: z.string(), call: ToolCallSchema }),
  z.object({ type: z.literal("session_idle"), sessionId: z.string() }),
  z.object({ type: z.literal("session_done"), sessionId: z.string() }),
  z.object({ type: z.literal("session_status"), sessionId: z.string(), busy: z.boolean() }),
  z.object({ type: z.literal("session_deleted"), sessionId: z.string() }),
  z.object({ type: z.literal("history"), sessionId: z.string(), messages: z.array(ChatMessageSchema) }),
  z.object({ type: z.literal("error"), message: z.string(), sessionId: z.string().optional() }),
  z.object({ type: z.literal("info"), message: z.string(), sessionId: z.string().optional() }),
  z.object({ type: z.literal("compacted"), sessionId: z.string(), summary: z.string() }),
  z.object({ type: z.literal("providers"), list: z.array(ProviderSchema) }),
  z.object({ type: z.literal("sessions"), list: z.array(SessionSummarySchema) }),
  z.object({
    type: z.literal("models"),
    providerId: z.string(),
    list: z.array(ModelInfoSchema),
  }),
]);
export type ServerMessage = z.infer<typeof ServerMessage>;

/* Tool definitions sent to the model */
export const TOOL_DEFS = [
  {
    name: "read",
    description: "Read a file's contents. Args: { path: string }",
  },
  {
    name: "write",
    description: "Create/overwrite a file. Args: { path: string, content: string }",
  },
  {
    name: "edit",
    description: "Replace `old` with `new` in a file. Args: { path: string, old: string, new: string }",
  },
  {
    name: "bash",
    description: "Run a shell command in the working dir (timeout 30s). Args: { command: string }",
  },
  {
    name: "glob",
    description: "Find files by pattern (supports ** and *). Args: { pattern: string }",
  },
  {
    name: "grep",
    description: "Search file contents for a regex. Args: { pattern: string, path?: string }",
  },
] as const;
