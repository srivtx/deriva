import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { nanoid } from "nanoid";
import type { ChatMessage, PermissionMode, Provider, SessionSummary } from "../shared/types.js";

const DIR = path.join(os.homedir(), ".rig");

async function ensure() {
  await fs.mkdir(DIR, { recursive: true });
}
const pProviders = () => path.join(DIR, "providers.json");
const pSessions = () => path.join(DIR, "sessions.json");
const pMsgs = (id: string) => path.join(DIR, `${id}.jsonl`);

/* ----------------------------- Providers ----------------------------- */

const KNOWN: Record<string, { kind: Provider["kind"]; baseUrl: string }> = {
  zen: { kind: "opencode-zen", baseUrl: "https://opencode.ai/zen/v1" },
  go: { kind: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1" },
};

/** Repair providers saved by the pre-fix UI (wrong kind / empty baseUrl). */
export function repairProviders(list: Provider[]): Provider[] {
  const out: Provider[] = [];
  for (const p of list) {
    const known = KNOWN[p.id];
    if (known && (p.kind !== known.kind || !p.baseUrl)) {
      out.push({ ...p, kind: known.kind, baseUrl: known.baseUrl });
      continue;
    }
    if (!p.baseUrl || !p.baseUrl.trim()) continue;
    out.push(p);
  }
  return out;
}

export async function loadProviders(): Promise<Provider[]> {
  await ensure();
  try {
    return JSON.parse(await fs.readFile(pProviders(), "utf8"));
  } catch {
    return [];
  }
}

export async function saveProviders(list: Provider[]) {
  await ensure();
  try {
    const prev = await fs.readFile(pProviders(), "utf8");
    if (prev.trim() && prev.trim() !== "[]") {
      await fs.writeFile(pProviders() + ".bak", prev);
    }
  } catch {
    // no previous file
  }
  await fs.writeFile(pProviders(), JSON.stringify(list, null, 2));
}

/** Recover providers from the .bak kept by saveProviders (misclick insurance). */
export async function restoreProvidersBackup(): Promise<Provider[]> {
  await ensure();
  try {
    const bak = JSON.parse(await fs.readFile(pProviders() + ".bak", "utf8")) as Provider[];
    if (Array.isArray(bak) && bak.length) {
      await fs.writeFile(pProviders(), JSON.stringify(bak, null, 2));
      return bak;
    }
  } catch {
    // no backup
  }
  return [];
}

/* ----------------------------- Sessions ----------------------------- */

export class Rig {
  id: string;
  cwd: string;
  providerId: string;
  model?: string;
  permission: PermissionMode;
  title: string;
  messages: ChatMessage[] = [];
  updatedAt = Date.now();
  busy = false;
  abort: AbortController | null = null;

  constructor(init: Partial<Rig>) {
    this.id = init.id ?? nanoid(8);
    this.cwd = init.cwd && init.cwd.trim() ? init.cwd : os.homedir();
    this.providerId = init.providerId ?? "";
    this.model = init.model;
    this.permission = init.permission ?? "auto";
    this.title = init.title ?? "rig";
  }

  async load() {
    try {
      const raw = await fs.readFile(pMsgs(this.id), "utf8");
      this.messages = raw
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l));
    } catch {
      this.messages = [];
    }
  }

  append(m: ChatMessage) {
    this.messages.push(m);
    this.updatedAt = Date.now();
  }

  async persist() {
    await ensure();
    await fs.writeFile(pMsgs(this.id), this.messages.map((m) => JSON.stringify(m)).join("\n") + "\n");
  }

  summary(): SessionSummary {
    return {
      id: this.id,
      cwd: this.cwd,
      providerId: this.providerId,
      permission: this.permission,
      title: this.title,
      updatedAt: this.updatedAt,
    };
  }

  /** Effective model: rig override, else provider's model. */
  effectiveModel(getProvider: (id: string) => Provider | undefined): string {
    return this.model || getProvider(this.providerId)?.model || "";
  }
}

const rigs = new Map<string, Rig>();

export async function createRig(init: Partial<Rig>): Promise<Rig> {
  await ensure();
  const rig = new Rig(init);
  const summaries = await listSummaries();
  summaries.unshift(rig.summary());
  await fs.writeFile(pSessions(), JSON.stringify(summaries.slice(0, 50), null, 2));
  rigs.set(rig.id, rig);
  return rig;
}

export function getRig(id: string): Rig | undefined {
  return rigs.get(id);
}

export async function deleteRig(id: string): Promise<void> {
  const rig = rigs.get(id);
  if (rig) {
    rig.abort?.abort();
    rigs.delete(id);
  }
  await fs.rm(pMsgs(id), { force: true }).catch(() => {});
  const list = (await listSummaries()).filter((s) => s.id !== id);
  await fs.writeFile(pSessions(), JSON.stringify(list.slice(0, 50), null, 2));
}

export async function listSummaries(): Promise<SessionSummary[]> {
  await ensure();
  try {
    return JSON.parse(await fs.readFile(pSessions(), "utf8"));
  } catch {
    return [];
  }
}

export async function refreshSummary(rig: Rig) {
  const list = await listSummaries();
  const idx = list.findIndex((s) => s.id === rig.id);
  const sum = rig.summary();
  if (idx >= 0) list[idx] = sum;
  else list.unshift(sum);
  await fs.writeFile(pSessions(), JSON.stringify(list.slice(0, 50), null, 2));
}
