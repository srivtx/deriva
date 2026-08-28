// RIG slash-command table + tiny fuzzy matcher.

export type CmdAction = "model" | "folder" | "provider" | "new" | "compact" | "clear" | "help";

export type RigCommand = { cmd: string; desc: string; action: CmdAction };

export const COMMANDS: RigCommand[] = [
  { cmd: "/model", desc: "switch model", action: "model" },
  { cmd: "/folder", desc: "change working dir", action: "folder" },
  { cmd: "/provider", desc: "add or switch provider", action: "provider" },
  { cmd: "/new", desc: "spawn a new rig", action: "new" },
  { cmd: "/compact", desc: "summarize & shrink context", action: "compact" },
  { cmd: "/clear", desc: "clear transcript view", action: "clear" },
  { cmd: "/help", desc: "commands & keys", action: "help" },
];

/** Subsequence fuzzy match (lower-cased). Empty query matches everything. */
export function fuzzy(hay: string, q: string): boolean {
  if (!q) return true;
  hay = hay.toLowerCase();
  let i = 0;
  for (const ch of q.toLowerCase()) {
    if (ch === " ") continue;
    i = hay.indexOf(ch, i);
    if (i === -1) return false;
    i++;
  }
  return true;
}

/** Slash palette items matching the composer text (e.g. "/mo"). */
export function filterCommands(text: string): RigCommand[] {
  const tok = text.startsWith("/") ? text.slice(1) : text;
  const q = (tok.split(" ")[0] || "").toLowerCase();
  if (!q) return COMMANDS;
  return COMMANDS.filter((c) => c.cmd.slice(1).startsWith(q));
}
