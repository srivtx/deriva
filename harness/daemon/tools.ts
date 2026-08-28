import { spawn } from "node:child_process";
import { promises as fs, type Dirent } from "node:fs";
import * as path from "node:path";
import type { ToolCall, ToolResult } from "../shared/types.js";

const MAX_OUTPUT = 8000;
const BASH_TIMEOUT_DEFAULT = 60;
const BASH_TIMEOUT_MAX = 300;

function within(p: string, cwd: string): string {
  const abs = path.isAbsolute(p) ? p : path.resolve(cwd, p);
  const rel = path.relative(cwd, abs);
  if (rel.startsWith("..")) throw new Error(`Path escapes working dir: ${p}`);
  return abs;
}

async function readTool(call: ToolCall, cwd: string): Promise<ToolResult> {
  try {
    const { path: p, offset } = JSON.parse(call.args || "{}");
    const abs = within(p, cwd);
    const stat = await fs.stat(abs);
    if (stat.isDirectory()) {
      const entries = await fs.readdir(abs);
      return { callId: call.id, ok: true, output: `DIR ${p}/\n${entries.join("\n")}` };
    }
    let text = await fs.readFile(abs, "utf8");
    if (offset) {
      const lines = text.split("\n");
      const start = Math.min(Math.max(Math.floor(Number(offset)) - 1, 0), Math.max(lines.length - 1, 0));
      text = `[lines ${start + 1}–${lines.length} of ${lines.length}]\n` + lines.slice(start, start + 2000).join("\n");
    }
    if (text.length > MAX_OUTPUT) {
      text = text.slice(0, MAX_OUTPUT) + "\n…(truncated — read again with a larger offset)";
    }
    return { callId: call.id, ok: true, output: text };
  } catch (e: any) {
    return { callId: call.id, ok: false, output: String(e.message) };
  }
}

async function writeTool(call: ToolCall, cwd: string): Promise<ToolResult> {
  try {
    const { path: p, content } = JSON.parse(call.args || "{}");
    const abs = within(p, cwd);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    const existed = await fs.stat(abs).catch(() => null);
    await fs.writeFile(abs, content ?? "", "utf8");
    const diff = existed ? `WROTE ${p} (${content?.length ?? 0} bytes)` : `CREATED ${p}`;
    return { callId: call.id, ok: true, output: diff, diff };
  } catch (e: any) {
    return { callId: call.id, ok: false, output: String(e.message) };
  }
}

async function editTool(call: ToolCall, cwd: string): Promise<ToolResult> {
  try {
    const { path: p, old, new: nw, all } = JSON.parse(call.args || "{}");
    if (!old) return { callId: call.id, ok: false, output: "edit: 'old' is required" };
    const abs = within(p, cwd);
    const text = await fs.readFile(abs, "utf8");
    const count = text.split(old).length - 1;
    if (count === 0) {
      return { callId: call.id, ok: false, output: `edit: 'old' not found in ${p}` };
    }
    if (count > 1 && !all) {
      return {
        callId: call.id,
        ok: false,
        output: `edit: 'old' appears ${count} times in ${p} — pass all:true to replace every occurrence, or include more surrounding text to make it unique`,
      };
    }
    const next = all ? text.split(old).join(nw ?? "") : text.replace(old, nw ?? "");
    await fs.writeFile(abs, next, "utf8");
    const lines = nw?.split("\n").length ?? 0;
    const spots = all ? `${count} spots` : "1 spot";
    return { callId: call.id, ok: true, output: `EDITED ${p} (${spots}, +${lines} lines)`, diff: `-${old}\n+${nw}` };
  } catch (e: any) {
    return { callId: call.id, ok: false, output: String(e.message) };
  }
}

function bashTool(call: ToolCall, cwd: string): Promise<ToolResult> {
  return new Promise((resolve) => {
    let { command, timeout } = JSON.parse(call.args || "{}");
    if (!command) return resolve({ callId: call.id, ok: false, output: "empty command" });
    const secs = Math.min(Math.max(Math.floor(Number(timeout)) || BASH_TIMEOUT_DEFAULT, 5), BASH_TIMEOUT_MAX);
    const child = spawn(command, { shell: true, cwd, env: process.env });
    let out = "";
    let err = "";
    const to = setTimeout(() => {
      child.kill("SIGKILL");
      resolve({ callId: call.id, ok: false, output: out + err + `\n…(timeout ${secs}s — retry with a bigger timeout arg, max ${BASH_TIMEOUT_MAX}s)` });
    }, secs * 1000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("close", (code) => {
      clearTimeout(to);
      const merged = (out + err).slice(-MAX_OUTPUT);
      resolve({
        callId: call.id,
        ok: code === 0,
        output: `$ ${command}\n[exit ${code}]\n${merged}`,
      });
    });
    child.on("error", (e: any) =>
      resolve({ callId: call.id, ok: false, output: String(e.message) }),
    );
  });
}

async function globTool(call: ToolCall, cwd: string): Promise<ToolResult> {
  try {
    const { pattern } = JSON.parse(call.args || "{}");
    const files = await walk(cwd, pattern, cwd, 0, 4000);
    const out = files.length ? files.join("\n") : "no matches";
    return { callId: call.id, ok: true, output: out };
  } catch (e: any) {
    return { callId: call.id, ok: false, output: String(e.message) };
  }
}

async function grepTool(call: ToolCall, cwd: string): Promise<ToolResult> {
  try {
    const { pattern, path: sub } = JSON.parse(call.args || "{}");
    const re = new RegExp(pattern, "i");
    const root = sub ? within(sub, cwd) : cwd;
    const files = await walk(root, "**/*", cwd, 0, 4000);
    const hits: string[] = [];
    for (const f of files.slice(0, 200)) {
      let txt: string;
      try {
        txt = await fs.readFile(path.resolve(cwd, f), "utf8");
      } catch {
        continue;
      }
      const lines = txt.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) {
          hits.push(`${f}:${i + 1}: ${lines[i].slice(0, 200)}`);
          if (hits.length >= 400) break;
        }
      }
      if (hits.length >= 400) break;
    }
    const truncated = hits.length >= 400;
    if (truncated) hits.push("…(stopped at 400 hits — narrow with a path arg)");
    return { callId: call.id, ok: true, output: hits.length ? hits.join("\n") : "no matches" };
  } catch (e: any) {
    return { callId: call.id, ok: false, output: String(e.message) };
  }
}

async function walk(
  dir: string,
  pattern: string,
  cwd: string,
  depth: number,
  limit: number,
): Promise<string[]> {
  const out: string[] = [];
  let entries: Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git" || e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name);
    const rel = path.relative(cwd, abs).split(path.sep).join("/");
    if (e.isDirectory()) {
      if (depth < 12 && out.length < limit) {
        out.push(...(await walk(abs, pattern, cwd, depth + 1, limit - out.length)));
      }
    } else if (matchPattern(rel, pattern)) {
      out.push(rel);
    }
    if (out.length >= limit) break;
  }
  return out;
}

function matchPattern(rel: string, pattern: string): boolean {
  const re = new RegExp(
    "^" +
      pattern
        .split("/")
        .map((seg) =>
          seg === "**"
            ? "(.*)"
            : seg
                .replace(/[.+^${}()|[\]\\]/g, "\\$&")
                .replace(/\*/g, "[^/]*")
                .replace(/\?/g, "."),
        )
        .join("/") +
      "$",
  );
  return re.test(rel);
}

export async function runTool(call: ToolCall, cwd: string): Promise<ToolResult> {
  switch (call.name) {
    case "read":
      return readTool(call, cwd);
    case "write":
      return writeTool(call, cwd);
    case "edit":
      return editTool(call, cwd);
    case "bash":
      return bashTool(call, cwd);
    case "glob":
      return globTool(call, cwd);
    case "grep":
      return grepTool(call, cwd);
    default:
      return { callId: call.id, ok: false, output: `unknown tool: ${call.name}` };
  }
}

/** Tools that mutate the workspace and require permission in `ask` mode. */
export const MUTATING = new Set(["write", "edit", "bash"]);
