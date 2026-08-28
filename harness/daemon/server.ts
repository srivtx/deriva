import { createServer } from "node:http";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { WebSocketServer, WebSocket } from "ws";
import QRCode from "qrcode";
import type { ClientMessage, Provider, ServerMessage } from "../shared/types.js";
import { fetchModels, streamChat } from "./providers.js";
import {
  createRig,
  deleteRig,
  getRig,
  listSummaries,
  loadProviders,
  refreshSummary,
  repairProviders,
  restoreProvidersBackup,
  Rig,
  saveProviders,
} from "./session.js";
import { runRig, compactRig } from "./loop.js";
import { makeToken, lanAddresses } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.RIG_PORT || 8787);
const TOKEN = process.env.RIG_TOKEN || makeToken();
const UI_BASE = process.env.RIG_UI_BASE || `http://localhost:3000/rig`;

type Conn = { ws: WebSocket; authed: boolean };

const pend = new Map<string, { sessionId: string; resolve: (ok: boolean) => void }>();

function resolvePends(sessionId: string, ok: boolean) {
  for (const [id, p] of pend) {
    if (p.sessionId === sessionId) {
      p.resolve(ok);
      pend.delete(id);
    }
  }
}

const conns = new Set<Conn>();
let providers: Provider[] = [];

async function boot() {
  providers = await loadProviders();
  const repaired = repairProviders(providers);
  if (repaired.length !== providers.length || repaired.some((p, i) => p !== providers[i] && (p.kind !== providers[i].kind || p.baseUrl !== providers[i].baseUrl))) {
    providers = repaired;
    await saveProviders(providers);
    console.log("providers: repaired corrupt entries");
  }
  if (providers.length === 0) {
    const seeded: Provider[] = [];
    if (process.env.OPENCODE_ZEN_API_KEY) {
      seeded.push({
        id: "opencode-zen",
        label: "OpenCode Zen",
        kind: "opencode-zen",
        apiKey: process.env.OPENCODE_ZEN_API_KEY,
        model: process.env.RIG_MODEL || "deepseek-v4-flash-free",
      });
    }
    if (process.env.OPENCODE_GO_API_KEY) {
      seeded.push({
        id: "opencode-go",
        label: "OpenCode Go",
        kind: "opencode-go",
        apiKey: process.env.OPENCODE_GO_API_KEY,
        model: process.env.RIG_GO_MODEL || "grok-4.6",
      });
    }
    if (seeded.length) {
      providers = seeded;
      await saveProviders(providers);
    }
  }

  const server = createServer(async (req, res) => {
    const url = (req.url || "/").split("?")[0];
    if (req.method === "OPTIONS") {
      cors(res, req);
      res.writeHead(204);
      return res.end();
    }
    if (url === "/pair") return servePair(req, res);
    if (url === "/api/health") {
      cors(res, req);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    }
    if (url === "/api/local-token" || url === "/api/pair-qr") {
      cors(res, req);
      if (!isOwnMachine(req.socket.remoteAddress)) {
        res.writeHead(403, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "only this Mac" }));
      }
      const lan = lanAddresses(PORT)[0] || `http://localhost:${PORT}`;
      if (url === "/api/local-token") {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ token: TOKEN, lan, port: PORT }));
      }
      const cockpit = cockpitForLan(lan);
      const qr = await QRCode.toDataURL(cockpit, { margin: 1, width: 240 });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ qr, url: cockpit }));
    }
    if (url === "/api/mkdir") {
      cors(res, req);
      if (!isOwnMachine(req.socket.remoteAddress)) {
        res.writeHead(403, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "only this Mac" }));
      }
      const root = os.homedir();
      const m = (req.url || "").match(/[?&]path=([^&]*)/);
      const rel = m ? decodeURIComponent(m[1]) : "";
      if (!rel.trim()) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "no path" }));
      }
      const abs = path.resolve(root, rel);
      if (!abs.startsWith(root)) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "outside home dir" }));
      }
      try {
        fs.mkdirSync(abs, { recursive: true });
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ ok: true, path: abs }));
      } catch (e: any) {
        res.writeHead(400, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: String(e.message || e) }));
      }
    }
    if (url === "/api/tree") {
      cors(res, req);
      if (!isOwnMachine(req.socket.remoteAddress)) {
        res.writeHead(403, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "only this Mac" }));
      }
      const root = os.homedir();
      const m = (req.url || "").match(/[?&]path=([^&]*)/);
      const rel = m ? decodeURIComponent(m[1]) : "";
      let abs = path.resolve(root, rel || ".");
      if (!abs.startsWith(root)) abs = root;
      let dirs: { name: string; path: string }[] = [];
      try {
        dirs = fs
          .readdirSync(abs, { withFileTypes: true })
          .filter((d) => d.isDirectory() && !d.name.startsWith("."))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((d) => ({ name: d.name, path: path.join(abs, d.name) }));
      } catch {
        // unreadable path -> empty list
      }
      const parent = abs === root ? null : path.dirname(abs);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ path: abs, parent, dirs }));
    }
    res.writeHead(302, { location: UI_BASE });
    res.end();
  });

  const wss = new WebSocketServer({ server });
  wss.on("connection", (ws) => {
    const conn: Conn = { ws, authed: false };
    conns.add(conn);
    ws.on("message", (buf) => handleMessage(conn, buf.toString()));
    ws.on("close", () => {
      conns.delete(conn);
    });
  });

  server.listen(PORT, "0.0.0.0", () => banner());
}

function send(conn: Conn, m: ServerMessage) {
  if (conn.ws.readyState === WebSocket.OPEN) conn.ws.send(JSON.stringify(m));
}

async function handleMessage(conn: Conn, raw: string) {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    return;
  }

  if (msg.type === "hello") {
    if (msg.token !== TOKEN) {
      send(conn, { type: "error", message: "bad token" });
      return conn.ws.close();
    }
    conn.authed = true;
    send(conn, { type: "paired" });
    send(conn, { type: "providers", list: providers });
    send(conn, { type: "sessions", list: await listSummaries() });
    return;
  }

  if (!conn.authed) return;

  switch (msg.type) {
    case "fetch_models": {
      const p = providers.find((x) => x.id === msg.providerId);
      if (!p) return send(conn, { type: "error", message: "unknown provider" });
      try {
        const list = await fetchModels(p);
        send(conn, { type: "models", providerId: p.id, list });
      } catch (e: any) {
        send(conn, { type: "models", providerId: p.id, list: [] });
        send(conn, { type: "error", message: `model fetch failed: ${e.message}` });
      }
      break;
    }
    case "prompt": {
      const rig = getRig(msg.sessionId);
      if (!rig) return send(conn, { type: "error", message: "unknown session" });
      if (rig.busy) return send(conn, { type: "error", message: "RIG IS BUSY — STOP FIRST", sessionId: rig.id });
      runRig(msg.text, {
        rig,
        send: (m) => broadcast(m),
        requestPermission: (call) => new Promise((resolve) => pend.set(call.id, { sessionId: rig.id, resolve })),
        getProvider: (id) => providers.find((p) => p.id === id),
        signal: new AbortController().signal,
      });
      break;
    }
    case "abort": {
      resolvePends(msg.sessionId, false);
      getRig(msg.sessionId)?.abort?.abort();
      break;
    }
    case "permission": {
      const p = pend.get(msg.toolCallId);
      if (p) {
        p.resolve(msg.decision === "approve");
        pend.delete(msg.toolCallId);
      }
      break;
    }
    case "new_session": {
      const rig = await createRig({
        cwd: msg.cwd,
        providerId: msg.providerId,
        permission: msg.permission,
        title: msg.title || path.basename(msg.cwd),
      });
      send(conn, { type: "sessions", list: await listSummaries() });
      send(conn, { type: "ready", sessionId: rig.id });
      break;
    }
    case "open_session": {
      const sum = (await listSummaries()).find((s) => s.id === msg.sessionId);
      if (!sum) return;
      let rig = getRig(sum.id);
      if (!rig) {
        rig = new Rig(sum);
        await rig.load();
      }
      send(conn, { type: "ready", sessionId: rig.id });
      send(conn, { type: "history", sessionId: rig.id, messages: rig.messages });
      break;
    }
    case "delete_session": {
      const rig = getRig(msg.sessionId);
      if (rig) rig.abort?.abort();
      resolvePends(msg.sessionId, false);
      await deleteRig(msg.sessionId);
      broadcast({ type: "sessions", list: await listSummaries() });
      broadcast({ type: "session_deleted", sessionId: msg.sessionId });
      break;
    }
    case "switch_provider": {
      const rig = getRig(msg.sessionId);
      if (!rig) return;
      if (rig.busy) return send(conn, { type: "error", message: "RIG IS BUSY — STOP FIRST", sessionId: rig.id });
      rig.providerId = msg.providerId;
      if (msg.model !== undefined) rig.model = msg.model || undefined;
      await refreshSummary(rig);
      break;
    }
    case "list_providers":
      send(conn, { type: "providers", list: providers });
      break;
    case "save_provider": {
      const i = providers.findIndex((p) => p.id === msg.provider.id);
      if (i >= 0) providers[i] = msg.provider;
      else providers.push(msg.provider);
      await saveProviders(providers);
      broadcast({ type: "providers", list: providers });
      break;
    }
    case "delete_provider": {
      providers = providers.filter((p) => p.id !== msg.id);
      await saveProviders(providers);
      broadcast({ type: "providers", list: providers });
      break;
    }
    case "restore_providers": {
      const restored = await restoreProvidersBackup();
      if (restored.length) {
        providers = restored;
        broadcast({ type: "providers", list: providers });
        send(conn, { type: "info", message: `RESTORED ${restored.length} ENGINE(S) FROM BACKUP` });
      } else {
        send(conn, { type: "info", message: "NO BACKUP FOUND" });
      }
      break;
    }
    case "list_sessions":
      send(conn, { type: "sessions", list: await listSummaries() });
      break;
    case "set_cwd": {
      const rig = getRig(msg.sessionId);
      if (!rig) return;
      if (rig.busy) return send(conn, { type: "error", message: "RIG IS BUSY — STOP FIRST", sessionId: rig.id });
      rig.cwd = msg.cwd;
      await refreshSummary(rig);
      send(conn, { type: "info", message: "CWD " + msg.cwd, sessionId: rig.id });
      send(conn, { type: "sessions", list: await listSummaries() });
      break;
    }
    case "compact": {
      const rig = getRig(msg.sessionId);
      if (!rig) return send(conn, { type: "error", message: "unknown session" });
      if (rig.busy) return send(conn, { type: "error", message: "RIG IS BUSY — STOP FIRST", sessionId: rig.id });
      broadcast({ type: "session_status", sessionId: rig.id, busy: true });
      try {
        await compactRig(msg.sessionId, {
          rig,
          send: (m) => broadcast(m),
          requestPermission: (call) => new Promise((resolve) => pend.set(call.id, { sessionId: rig.id, resolve })),
          getProvider: (id) => providers.find((p) => p.id === id),
          signal: new AbortController().signal,
        });
      } finally {
        broadcast({ type: "session_status", sessionId: rig.id, busy: false });
      }
      break;
    }
  }
}

function broadcast(m: ServerMessage) {
  for (const c of conns) send(c, m);
}

/* ----------------------------- http helpers ----------------------------- */

function ownIps(): Set<string> {
  const set = new Set<string>();
  for (const list of Object.values(os.networkInterfaces())) {
    for (const i of list || []) {
      if (i.family === "IPv4" && !i.internal) set.add(i.address);
    }
  }
  return set;
}

function isOwnMachine(addr?: string): boolean {
  if (!addr) return false;
  const a = addr.replace(/^::ffff:/, "");
  if (a === "127.0.0.1" || a === "::1") return true;
  return ownIps().has(a);
}

function cors(res: any, req: any) {
  const origin = req.headers.origin as string | undefined;
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Vary", "Origin");
}

function cockpitForLan(lan: string): string {
  const base = lan || `http://localhost:${PORT}`;
  const wsHost = base.replace("http://", "");
  return `${UI_BASE}?d=${encodeURIComponent(`ws://${wsHost}`)}&token=${TOKEN}`;
}

/* ----------------------------- pair page ----------------------------- */

async function servePair(req: any, res: any) {
  const lan = lanAddresses(PORT);
  const host = lan[0] || `http://localhost:${PORT}`;
  const wsHost = host.replace("http://", "");
  const uiUrl = `${UI_BASE}?d=${encodeURIComponent(`ws://${wsHost}`)}&token=${TOKEN}`;
  const qr = await QRCode.toDataURL(uiUrl, { margin: 1, width: 220 });
  const card = [
    "<!doctype html><html><head><meta charset=\"utf-8\">",
    "<title>RIG &middot; pair</title>",
    "<style>",
    "body{background:#000;color:#fff;font:14px/1.5 ui-monospace,monospace;",
    "display:flex;flex-direction:column;align-items:center;gap:18px;",
    "padding:40px;justify-content:center;min-height:100vh;margin:0}",
    "h1{color:#FF4F00;letter-spacing:.2em;margin:0}",
    ".card{border:1px solid #FF4F00;padding:24px;text-align:center;max-width:420px}",
    ".tok{color:#00FF87;font-size:18px;letter-spacing:.3em;margin:12px 0}",
    "a{color:#FF4F00;word-break:break-all}",
    ".sub{color:#B8B8B8;font-size:12px;margin-top:10px}",
    "</style></head><body>",
    "<h1>RIG</h1>",
    "<div class=\"card\">",
    `<img src="${qr}" width="220" height="220" alt="qr"/>`,
    `<div class="tok">${TOKEN}</div>`,
    `<div class="sub">Scan with your phone.<br/>`,
    `Or open <a href="${uiUrl}">the cockpit</a>.<br/>`,
    `Desktop: <a href="${UI_BASE}">${UI_BASE}</a></div>`,
    "</div></body></html>",
  ].join("\n");
  res.writeHead(200, { "content-type": "text/html" });
  res.end(card);
}

/* ----------------------------- banner ----------------------------- */

async function banner() {
  const lan = lanAddresses(PORT);
  const term = await QRCode.toString(
    `${UI_BASE}?d=${encodeURIComponent(
      `ws://${(lan[0] || `http://localhost:${PORT}`).replace("http://", "")}`,
    )}&token=${TOKEN}`,
    { type: "terminal", small: true },
  );
  console.log("\n  RIG — local coding harness");
  console.log("  ───────────────────────────────");
  console.log(`  token   : ${TOKEN}`);
  console.log(`  cockpit : ${UI_BASE}`);
  lan.forEach((u) => console.log(`  lan     : ${u}`));
  console.log(`  pair    : http://localhost:${PORT}/pair`);
  if (providers.length)
    console.log(`  providers: ${providers.map((p) => `${p.label} (${p.model})`).join(", ")}`);
  else console.log("  providers: NONE — add one in the cockpit (Providers).");
  console.log(term);
}

boot();
