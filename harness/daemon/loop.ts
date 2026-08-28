import type { ChatMessage, Provider, ServerMessage, ToolCall } from "../shared/types.js";
import { streamChat, summarize } from "./providers.js";
import { MUTATING, runTool } from "./tools.js";
import { Rig, refreshSummary } from "./session.js";

export type LoopCtx = {
  rig: Rig;
  send: (m: ServerMessage) => void;
  requestPermission: (call: ToolCall) => Promise<boolean>;
  getProvider: (id: string) => Provider | undefined;
  signal: AbortSignal;
};

const MAX_TURNS = 25;

function systemPrompt(cwd: string): string {
  return [
    "You are RIG, a coding agent running inside a local harness on the user's machine.",
    `Working directory: ${cwd}`,
    "You have tools: read, write, edit, bash, glob, grep.",
    "Guidelines:",
    "- Prefer reading before editing. Use glob/grep to locate code.",
    "- Make small, correct changes. After edits, run build/tests via bash to verify when possible.",
    "- For long builds/tests pass a larger bash timeout (seconds, up to 300).",
    "- 'old' in edit must be unique in the file — include more context or pass all:true.",
    "- For big files, read with an offset (1-based line) to reach later parts.",
    "- Explain concisely what you are doing as you work.",
    "- When the task is complete, give a short summary. Do not loop forever.",
  ].join("\n");
}

export async function runRig(userText: string, ctx: LoopCtx): Promise<void> {
  const { rig, send, requestPermission, getProvider, signal } = ctx;
  rig.busy = true;
  rig.abort = new AbortController();
  const linked = AbortSignal.any([signal, rig.abort.signal]);

  rig.append({ role: "user", content: userText });
  send({ type: "session_status", sessionId: rig.id, busy: true });

  const provider = getProvider(rig.providerId);
  if (!provider) {
    send({ type: "error", message: "No provider configured for this rig." });
    rig.busy = false;
    return;
  }
  if (!rig.model && !provider.model) {
    send({ type: "error", message: "NO MODEL SET — pick one with /model" });
    rig.busy = false;
    return;
  }

  const history: ChatMessage[] = [
    { role: "system", content: systemPrompt(rig.cwd) },
    ...rig.messages,
  ];

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      if (linked.aborted) {
        send({ type: "session_idle", sessionId: rig.id });
        return;
      }
      const modelProvider = { ...provider, model: rig.model || provider.model };
      let acc = "";
      const res = await streamChat(modelProvider, history, {
        signal: linked,
        onDelta: (d) => {
          acc += d;
          send({ type: "message_delta", sessionId: rig.id, delta: d });
        },
      });
      send({ type: "message_done", sessionId: rig.id });

      history.push({
        role: "assistant",
        content: res.content,
        tool_calls: res.toolCalls.length ? res.toolCalls : undefined,
      });
      rig.append({
        role: "assistant",
        content: res.content,
        tool_calls: res.toolCalls.length ? res.toolCalls : undefined,
      });

      if (res.toolCalls.length === 0) break;

      for (const call of res.toolCalls) {
        if (linked.aborted) {
          send({ type: "session_idle", sessionId: rig.id });
          return;
        }
        send({ type: "tool_call", sessionId: rig.id, call });
        let approved = true;
        if (MUTATING.has(call.name) && rig.permission === "ask") {
          send({ type: "permission_request", sessionId: rig.id, call });
          approved = await requestPermission(call);
        }
        if (!approved) {
          const msg = "Permission denied by operator.";
          rig.append({ role: "tool", content: msg, tool_call_id: call.id });
          history.push({ role: "tool", content: msg, tool_call_id: call.id });
          send({
            type: "tool_result",
            sessionId: rig.id,
            result: { callId: call.id, ok: false, output: msg },
          });
          continue;
        }
        const result = await runTool(call, rig.cwd);
        send({ type: "tool_result", sessionId: rig.id, result });
        rig.append({ role: "tool", content: result.output, tool_call_id: call.id });
        history.push({ role: "tool", content: result.output, tool_call_id: call.id });
      }
    }
    await rig.persist();
    await refreshSummary(rig);
    send({ type: "session_done", sessionId: rig.id });
  } catch (e: any) {
    if (e.name === "AbortError") {
      send({ type: "session_idle", sessionId: rig.id });
    } else {
      send({ type: "error", message: String(e.message || e), sessionId: rig.id });
      send({ type: "session_done", sessionId: rig.id });
    }
  } finally {
    rig.busy = false;
    rig.abort = null;
    send({ type: "session_status", sessionId: rig.id, busy: false });
  }
}

/**
 * Summarize the session's message history into a compact system note so the
 * model keeps working with far fewer tokens. Mirrors Claude Code's /compact.
 */
export async function compactRig(sessionId: string, ctx: LoopCtx): Promise<void> {
  const { rig, send, getProvider } = ctx;
  if (rig.messages.length === 0) {
    send({ type: "info", message: "nothing to compact" });
    return;
  }
  const provider = getProvider(rig.providerId);
  if (!provider) {
    send({ type: "error", message: "no provider for this rig" });
    return;
  }
  try {
    const summary = await summarize(provider, rig.messages);
    rig.messages = [{ role: "system", content: `Compacted session context:\n${summary}` }];
    await rig.persist();
    await refreshSummary(rig);
    send({ type: "compacted", sessionId, summary });
    send({ type: "info", message: "context compacted" });
  } catch (e: any) {
    send({ type: "error", message: `compact failed: ${e.message || e}` });
  }
}
