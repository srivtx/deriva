"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Doto } from "next/font/google";
import type {
  ClientMessage,
  ModelInfo,
  Provider,
  ProviderKind,
  ServerMessage,
  SessionSummary,
  ToolCall,
  ToolResult,
} from "../../../harness/shared/types";
import { Chip, FeedBlock, Led, ModalShell, MsgRow, Msg, ToolCard } from "./blocks";
import { Composer } from "./composer";
import {
  EnginesModal,
  FolderPicker,
  HelpModal,
  ModelPicker,
  NewRigModal,
  PRESETS,
  ProviderFlow,
} from "./pickers";

type Item =
  | { kind: "msg"; m: Msg; live?: boolean }
  | { kind: "tool"; block: FeedBlock };

type ModalKind = "model" | "folder" | "provider" | "new" | "help" | "engines" | null;

function readParams() {
  if (typeof window === "undefined") return { d: null as string | null, token: null as string | null };
  const q = new URLSearchParams(location.search);
  return { d: q.get("d"), token: q.get("token") };
}

let _id = 0;
const uid = () => `m${++_id}`;

const SUGGEST = ["gpt-5.2", "gpt-5.1-codex", "claude-opus-4-5", "claude-sonnet-4-5", "gemini-3-pro", "minimax-m2.1"];

const doto = Doto({ subsets: ["latin"], variable: "--font-dot-loaded", display: "swap" });

const buzz = () => { try { navigator.vibrate?.(10); } catch {} };

export default function RigPage() {
  const [phase, setPhase] = useState<"auto" | "app" | "pair">("auto");
  const [isLocal, setIsLocal] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [showPair, setShowPair] = useState(false);
  const [pairQr, setPairQr] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [log, setLog] = useState<Record<string, Item[]>>({});
  const [pending, setPending] = useState<Record<string, { call: ToolCall; sessionId: string }>>({});
  const [models, setModels] = useState<Record<string, ModelInfo[]>>({});

  const [modal, setModal] = useState<ModalKind>(null);
  const [provStep, setProvStep] = useState<"tile" | "key" | "pick">("tile");
  const [provKind, setProvKind] = useState<string>("");
  const [provId, setProvId] = useState<string>("");
  const [provStatus, setProvStatus] = useState<string>("");
  const [provErr, setProvErr] = useState<string>("");
  const [selPid, setSelPid] = useState<string>("");
  const [selModel, setSelModel] = useState<string | null>(null);
  const [pendingCwd, setPendingCwd] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"rigs" | "chat">("chat");
  const [offline, setOffline] = useState(false);
  const [delTarget, setDelTarget] = useState<string | null>(null);
  const delTimer = useRef<number | null>(null);
  const didPair = useRef(false);
  const backoff = useRef(1000);
  const connectArgs = useRef<{ url: string; token: string; local: boolean } | null>(null);
  const sessionsRef = useRef<SessionSummary[]>([]);
  useEffect(() => { sessionsRef.current = sessions; }, [sessions]);

  const accId = useRef<string | null>(null);
  const currentRef = useRef<string | null>(null);
  useEffect(() => { currentRef.current = current; }, [current]);
  const didInit = useRef(false);
  const flow = useRef<null | { stage: "saved" | "fetching"; id: string }>(null);
  const toastTimer = useRef<number | null>(null);
  const providersRef = useRef<Provider[]>([]);
  useEffect(() => { providersRef.current = providers; }, [providers]);
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const send = useCallback((m: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(m));
  }, []);

  const toastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2500) as unknown as number;
  }, []);

  const updateLog = useCallback((sid: string, fn: (items: Item[]) => Item[]) => {
    setLog((l) => ({ ...l, [sid]: fn(l[sid] || []) }));
  }, []);

  const onMessage = useCallback(
    (m: ServerMessage) => {
      switch (m.type) {
        case "paired":
          didPair.current = true;
          setPhase("app");
          if (typeof Notification !== "undefined") Notification.requestPermission().catch(() => {});
          if (currentRef.current) send({ type: "open_session", sessionId: currentRef.current });
          break;
        case "providers":
          setProviders(m.list);
          if (!selPid && m.list[0]) setSelPid(m.list[0].id);
          if (!selModel && m.list[0]) setSelModel(m.list[0].model);
          if (flow.current?.stage === "saved") {
            setProvStatus("FETCHING MODELS…");
            send({ type: "fetch_models", providerId: flow.current.id });
            flow.current.stage = "fetching";
          }
          break;
        case "sessions":
          setSessions(m.list);
          if (!currentRef.current && m.list[0]) {
            setCurrent(m.list[0].id);
            send({ type: "open_session", sessionId: m.list[0].id });
          }
          break;
        case "models": {
          setModels((prev) => ({ ...prev, [m.providerId]: m.list }));
          if (flow.current?.stage === "fetching") {
            flow.current = null;
            setProvStatus("");
            const rec = m.list.find((x) => SUGGEST.includes(x.id)) || m.list[0];
            if (rec) {
              setSelModel(rec.id);
              setSelPid(m.providerId);
              const prov = providersRef.current.find((p) => p.id === m.providerId);
              if (prov) send({ type: "save_provider", provider: { ...prov, model: rec.id } });
            }
            setProvStep("pick");
          }
          break;
        }
        case "ready":
          setCurrent(m.sessionId);
          accId.current = null;
          break;
        case "session_status":
          setBusy((b) => ({ ...b, [m.sessionId]: m.busy }));
          break;
        case "message_delta": {
          const sid = m.sessionId;
          updateLog(sid, (items) => {
            if (accId.current) {
              const idx = items.findIndex((it) => it.kind === "msg" && it.m.id === accId.current);
              if (idx >= 0) {
                const copy = items.slice();
                const it = copy[idx] as Extract<Item, { kind: "msg" }>;
                copy[idx] = { kind: "msg", live: true, m: { ...it.m, content: it.m.content + m.delta } };
                return copy;
              }
            }
            const id = uid();
            accId.current = id;
            return [...items, { kind: "msg", live: true, m: { id, role: "assistant", content: m.delta } }];
          });
          break;
        }
        case "message_done": {
          const doneId = accId.current;
          accId.current = null;
          if (doneId) updateLog(m.sessionId, (items) => items.map((it) => (it.kind === "msg" && it.m.id === doneId ? { ...it, live: false } : it)));
          break;
        }
        case "tool_call": {
          const doneId = accId.current;
          accId.current = null;
          if (doneId) updateLog(m.sessionId, (items) => items.map((it) => (it.kind === "msg" && it.m.id === doneId ? { ...it, live: false } : it)));
          updateLog(m.sessionId, (items) => [...items, { kind: "tool", block: { call: m.call } }]);
          break;
        }
        case "tool_result":
          updateLog(m.sessionId, (items) => {
            const idx = items.findIndex((it) => it.kind === "tool" && it.block.call?.id === m.result.callId);
            if (idx >= 0) {
              const copy = items.slice();
              const it = copy[idx] as Extract<Item, { kind: "tool" }>;
              copy[idx] = { kind: "tool", block: { ...it.block, result: m.result } };
              return copy;
            }
            return [...items, { kind: "tool", block: { call: undefined, result: m.result } }];
          });
          break;
        case "permission_request":
          updateLog(m.sessionId, (items) => [...items, { kind: "tool", block: { call: m.call, needPerm: true, perm: null } }]);
          setPending((p) => ({ ...p, [m.call.id]: { call: m.call, sessionId: m.sessionId } }));
          if (typeof Notification !== "undefined") new Notification("RIG · approval needed", { body: m.call.name });
          break;
        case "session_idle":
          setBusy((b) => ({ ...b, [m.sessionId]: false }));
          break;
        case "session_done":
          setBusy((b) => ({ ...b, [m.sessionId]: false }));
          if (typeof Notification !== "undefined") new Notification("RIG · done", { body: "Agent finished." });
          break;
        case "info":
          toastMsg(m.message);
          updateLog(m.sessionId ?? currentRef.current ?? "", (items) => [...items, { kind: "msg", m: { id: uid(), role: "sys", content: m.message } }]);
          break;
        case "compacted":
          accId.current = null;
          setLog((l) => ({
            ...l,
            [m.sessionId]: [
              { kind: "msg", m: { id: uid(), role: "sys", content: "CONTEXT COMPACTED" } },
              { kind: "msg", m: { id: uid(), role: "assistant", content: m.summary } },
            ],
          }));
          toastMsg("COMPACTED");
          break;
        case "error": {
          flow.current = null;
          setProvStatus("");
          setProvErr(m.message);
          toastMsg(m.message);
          updateLog(m.sessionId ?? currentRef.current ?? "", (items) => [...items, { kind: "msg", m: { id: uid(), role: "err", content: m.message } }]);
          break;
        }
        case "history": {
          const items: Item[] = (m.messages || []).map((msg) => {
            if (msg.role === "tool") {
              return { kind: "tool", block: { call: undefined, result: { callId: msg.tool_call_id || "", ok: true, output: msg.content } } };
            }
            const role = msg.role === "assistant" ? "assistant" : "user";
            return { kind: "msg", m: { id: uid(), role, content: msg.content } };
          });
          setLog((l) => ({ ...l, [m.sessionId]: items }));
          break;
        }
        case "session_deleted": {
          setLog((l) => { const n = { ...l }; delete n[m.sessionId]; return n; });
          setDelTarget(null);
          if (currentRef.current === m.sessionId) {
            const remaining = sessionsRef.current.filter((s) => s.id !== m.sessionId);
            const next = remaining[0]?.id ?? null;
            setCurrent(next);
            if (next) send({ type: "open_session", sessionId: next });
          }
          break;
        }
      }
    },
    [updateLog, send, toastMsg, selPid, selModel],
  );

  const connect = useCallback(
    (wsUrl: string, tok: string, local = false) => {
      setIsLocal(local);
      connectArgs.current = { url: wsUrl, token: tok, local };
      const url = wsUrl.replace(/^http/, "ws");
      const sock = new WebSocket(url);
      ws.current = sock;
      sock.onmessage = (e) => {
        try { onMessage(JSON.parse(e.data)); } catch {}
      };
      sock.onopen = () => {
        backoff.current = 1000;
        setOffline(false);
        send({ type: "hello", token: tok });
      };
      sock.onclose = () => {
        if (didPair.current) {
          setOffline(true);
          const t = backoff.current;
          backoff.current = Math.min(backoff.current * 2, 8000);
          window.setTimeout(() => {
            const a = connectArgs.current;
            if (a && didPair.current) connect(a.url, a.token, a.local);
          }, t);
        } else {
          setPhase("pair");
        }
      };
    },
    [send, onMessage],
  );

  /**
   * Find the engine on THIS machine, wherever the page was served from.
   * A page from https://deriva.srivtx.xyz can still reach the local daemon
   * (browsers treat localhost as trustworthy); the old code only probed
   * location.hostname — which on the deployed domain is Vercel, not the Mac.
   */
  const probeEngine = useCallback(async (): Promise<{ host: string; token: string; port: number } | null> => {
    const hosts = Array.from(new Set(
      [
        typeof window !== "undefined" ? window.location.hostname : "",
        "localhost",
        "127.0.0.1",
      ].filter(Boolean),
    ));
    for (const h of hosts) {
      try {
        const r = await fetch(`http://${h}:8787/api/local-token`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
        if (r.ok) {
          const j = await r.json();
          return { host: h, token: j.token, port: j.port };
        }
      } catch {}
    }
    return null;
  }, []);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const { d, token: qToken } = readParams();
    if (d) {
      connect(d, qToken || "", false);
      return;
    }
    (async () => {
      const hit = await probeEngine();
      if (hit) {
        connect(`ws://${hit.host}:${hit.port}`, hit.token, true);
        return;
      }
      setPhase("pair");
    })();
  }, [connect, probeEngine]);

  const retryLocal = () => {
    setPhase("auto");
    (async () => {
      const hit = await probeEngine();
      if (hit) {
        connect(`ws://${hit.host}:${hit.port}`, hit.token, true);
        return;
      }
      setPhase("pair");
    })();
  };

  const openPairQr = async () => {
    setShowPair(true);
    setPairQr(null);
    try {
      const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
      const r = await fetch(`http://${host}:8787/api/pair-qr`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setPairQr(j.qr);
      }
    } catch {}
  };

  /* ---- actions ---- */
  const submitPrompt = (text: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) { toastMsg("NOT CONNECTED"); return; }
    if (!current) { toastMsg("NO RIG — TAP + NEW"); return; }
    if (!text.trim()) return;
    if (busy[current]) { toastMsg("RIG IS BUSY — STOP FIRST"); return; }
    updateLog(current, (items) => [...items, { kind: "msg", m: { id: uid(), role: "user", content: text } }]);
    setBusy((b) => ({ ...b, [current]: true }));
    send({ type: "prompt", sessionId: current, text });
  };
  const abort = () => {
    if (!current) return;
    buzz();
    send({ type: "abort", sessionId: current });
  };
  const onDeleteRig = (id: string) => {
    if (delTarget === id) {
      send({ type: "delete_session", sessionId: id });
      setDelTarget(null);
    } else {
      setDelTarget(id);
      if (delTimer.current) window.clearTimeout(delTimer.current);
      delTimer.current = window.setTimeout(() => setDelTarget(null), 2500) as unknown as number;
    }
  };
  const openModel = () => {
    if (selPid && !(models[selPid] || []).length) send({ type: "fetch_models", providerId: selPid });
    setModal("model");
  };
  const onUseEngine = (id: string) => {
    setSelPid(id);
    const p = providersRef.current.find((x) => x.id === id);
    setSelModel(p?.model || null);
    if (current) send({ type: "switch_provider", sessionId: current, providerId: id, model: p?.model || undefined });
    toastMsg("ENGINE · " + (p?.label || id));
  };
  const onEngineModels = (id: string) => {
    setSelPid(id);
    send({ type: "fetch_models", providerId: id });
    setModal("model");
  };
  const onDeleteEngine = (id: string) => {
    send({ type: "delete_provider", id });
    toastMsg("ENGINE DELETED");
  };
  const onAddEngine = () => {
    setProvStep("tile");
    setProvId("");
    setProvKind("");
    setProvStatus("");
    setProvErr("");
    setModal("provider");
  };
  const decide = (callId: string, decision: "approve" | "reject") => {
    const p = pending[callId];
    if (!p) return;
    buzz();
    send({ type: "permission", sessionId: p.sessionId, toolCallId: callId, decision });
    updateLog(p.sessionId, (items) =>
      items.map((it) =>
        it.kind === "tool" && it.block.call?.id === callId
          ? { kind: "tool", block: { ...it.block, needPerm: false, perm: decision } }
          : it,
      ),
    );
    setPending((pp) => { const n = { ...pp }; delete n[callId]; return n; });
  };
  const spawnRig = (cwd: string, perm: "auto" | "ask", title: string) => {
    if (!selPid) return;
    send({ type: "new_session", cwd, providerId: selPid, permission: perm, title: title || cwd.split("/").pop() || "rig" });
    setModal(null);
  };
  const pickModel = (id: string) => {
    const pid = selPid;
    const prov = providersRef.current.find((p) => p.id === pid);
    if (!prov) return;
    if (current) send({ type: "switch_provider", sessionId: current, providerId: prov.id, model: id });
    send({ type: "save_provider", provider: { ...prov, model: id } });
    setSelModel(id);
    setModal(null);
    toastMsg("MODEL SET · " + id);
  };
  const pickFolder = (path: string) => {
    setPendingCwd(path);
    if (current) send({ type: "set_cwd", sessionId: current, cwd: path });
    setModal(null);
    toastMsg("FOLDER · " + path.split("/").pop());
  };
  const onTile = (p: (typeof PRESETS)[number]) => {
    setProvKind(p.kind);
    setProvId(p.id);
    setProvStep("key");
    setProvStatus("");
    setProvErr("");
  };
  const connectProvider = (baseUrl: string, key: string) => {
    const preset = PRESETS.find((p) => p.id === provId);
    const id = provId || "provider";
    const kind = (preset?.kind || "openai-compatible") as ProviderKind;
    const label = preset?.label || id;
    setProvStatus("SAVING…");
    setProvErr("");
    flow.current = { stage: "saved", id };
    send({ type: "save_provider", provider: { id, label, kind, baseUrl, apiKey: key, model: "" } });
  };
  const onPickProviderModel = (id: string) => {
    const pid = provId;
    const prov = providersRef.current.find((p) => p.id === pid);
    if (!prov) return;
    send({ type: "save_provider", provider: { ...prov, model: id } });
    setSelPid(pid);
    setSelModel(id);
    setModal(null);
    setProvStep("tile");
    setProvKind("");
    setProvStatus("");
    setProvErr("");
    toastMsg("ENGINE READY · " + id);
  };
  const runCommand = (action: string) => {
    switch (action) {
      case "model": openModel(); break;
      case "folder": setModal("folder"); break;
      case "provider": setModal("engines"); break;
      case "new": setModal("new"); break;
      case "help": setModal("help"); break;
      case "compact":
        if (current) { send({ type: "compact", sessionId: current }); toastMsg("COMPACTING…"); }
        else toastMsg("NO RIG YET — /new");
        break;
      case "clear":
        if (current) setLog((l) => ({ ...l, [current]: [] }));
        else toastMsg("NOTHING TO CLEAR");
        break;
    }
  };

  const curItems = log[current ?? ""] || [];
  const curSession = sessions.find((s) => s.id === current);
  const prov = providers.find((p) => p.id === selPid);
  const cwdLabel = (curSession?.cwd || pendingCwd || "~").split("/").pop() || "~";

  return (
    <div className={"rig-root " + doto.variable}>
      {phase === "auto" ? (
        <div className="connect-wrap">
          <div className="connect-card">
            <h1>RIG</h1>
            <div className="hint">Waking your Mac's engine…</div>
            <Led state="busy" />
          </div>
        </div>
      ) : phase === "pair" ? (
        <div className="connect-wrap">
          <div className="connect-card">
            <h1>RIG</h1>
            {isMobile ? (
              <>
                <div className="hint">RIG lives on your Mac. Pair this phone to it.</div>
                <ol className="steps">
                  <li>On your Mac, open <b>RIG</b> from the Deriva home screen.</li>
                  <li>Tap <b>PAIR</b> in the top bar.</li>
                  <li>Scan the code with this phone's camera.</li>
                </ol>
              </>
            ) : (
              <>
                <div className="hint">RIG's engine isn't reachable on this Mac right now.</div>
                <ol className="steps">
                  <li>The engine is a login service — it normally starts with your Mac. No terminal needed.</li>
                  <li>If it stopped, restart it once: <code>launchctl kickstart -k "gui/$(id -u)/com.deriva.rig"</code></li>
                  <li>Then tap RETRY — this page finds it by itself.</li>
                </ol>
                <button className="btn primary" style={{ width: "100%", marginTop: 10 }} onClick={retryLocal}>RETRY</button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="rig-shell">
          {offline && <div className="offline">● RECONNECTING…</div>}
          <div className="rig-top">
            <span className="brand">RIG</span>
            <Led state={busy[current ?? ""] ? "busy" : "on"} />
            {providers.length === 0 ? (
              <button className="chip add" onClick={onAddEngine}>
                <span className="chip-l">ENGINE</span><span className="chip-v">+ ADD</span>
              </button>
            ) : (
              <>
                <Chip label="ENGINE" value={`${selModel || "—"} · ${prov?.label || "NONE"}`} onClick={() => setModal("engines")} />
                <Chip label="MODEL" value={selModel || "—"} onClick={openModel} />
                <Chip label="CWD" value={cwdLabel} onClick={() => setModal("folder")} />
              </>
            )}
            <span style={{ flex: 1 }} />
            <button className="btn sm" onClick={() => setModal("new")}>+ NEW</button>
            {isLocal && <button className="btn sm" onClick={openPairQr}>PAIR</button>}
            {busy[current ?? ""] && <button className="btn sm danger" onClick={abort}>STOP</button>}
          </div>

          <div className="rig-body">
            <div className={"rig-col side" + (mobileTab === "rigs" ? " show" : "")}>
              <div className="rig-col-head"><span>RIGS</span><Led state="on" /></div>
              <div className="scroll">
                {providers.length === 0 && <div className="kicker" style={{ margin: 12 }}>no engine — + ADD</div>}
                {sessions.map((s) => (
                  <div key={s.id} className={"rig-item" + (s.id === current ? " active" : "")} onClick={() => send({ type: "open_session", sessionId: s.id })}>
                    <span className="t"><Led state={busy[s.id] ? "busy" : s.id === current ? "on" : "off"} /> {s.title}
                      <button className="del" onClick={(e) => { e.stopPropagation(); onDeleteRig(s.id); }}>{delTarget === s.id ? "SURE?" : "✕"}</button>
                    </span>
                    <span className="c">{s.cwd}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={"rig-col main" + (mobileTab === "chat" ? " show" : "")}>
              <div className="rig-col-head">
                <span className="state-word">{busy[current ?? ""] ? "RUNNING" : "READY"}</span>
                <Led state={busy[current ?? ""] ? "busy" : "on"} />
              </div>
              <div className="transcript scroll">
                {curItems.length === 0 && (
                  <div className="empty">
                    <div className="empty-word">RIG</div>
                    <div className="empty-line">
                      {providers.length === 0 ? "NO ENGINE — TAP + ADD" : "READY — /HELP FOR COMMANDS"}
                    </div>
                  </div>
                )}
                {curItems.map((it, i) =>
                  it.kind === "msg"
                    ? <MsgRow key={it.m.id} m={it.m} live={it.live} />
                    : <ToolCard key={i} block={it.block} onDecide={decide} />,
                )}
              </div>
            </div>
          </div>

          <Composer onSubmit={submitPrompt} onCmd={runCommand} onStop={abort} running={!!(current && busy[current])} />

          <div className="transport">
            <div className="tabs">
              {(["rigs", "chat"] as const).map((t) => (
                <button key={t} className={"tab" + (mobileTab === t ? " active" : "")} onClick={() => setMobileTab(t)}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Style />

      {modal === "model" && (
        <ModelPicker
          list={models[selPid] || []}
          activeModel={selModel}
          onPick={pickModel}
          onRetry={() => selPid && send({ type: "fetch_models", providerId: selPid })}
          onEngines={() => setModal("engines")}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "folder" && <FolderPicker start={pendingCwd} onPick={pickFolder} onClose={() => setModal(null)} />}
      {modal === "provider" && (
        <ProviderFlow
          step={provStep}
          status={provStatus}
          err={provErr}
          provId={provId}
          models={models[provId] || []}
          onTile={onTile}
          onConnect={connectProvider}
          onPickModel={onPickProviderModel}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "engines" && (
        <EnginesModal
          providers={providers}
          activePid={selPid}
          onUse={onUseEngine}
          onModels={onEngineModels}
          onDelete={onDeleteEngine}
          onAdd={onAddEngine}
          onRestore={() => send({ type: "restore_providers" })}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "new" && (
        <NewRigModal
          providers={providers}
          activePid={selPid}
          activeModel={selModel}
          pendingCwd={pendingCwd}
          onBrowse={() => setModal("folder")}
          onPickModel={openModel}
          onSpawn={spawnRig}
          onAddEngine={onAddEngine}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "help" && <HelpModal onClose={() => setModal(null)} />}

      {showPair && (
        <div className="rig-modal" onClick={() => setShowPair(false)}>
          <div className="rig-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="ph"><span>PAIR YOUR PHONE</span><button className="btn sm" onClick={() => setShowPair(false)}>✕</button></div>
            <div className="pb" style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 10 }}>
              {pairQr ? (
                <>
                  <div className="qr-pad"><img src={pairQr} width={240} height={240} alt="pair qr" /></div>
                  <div className="hint">Scan with your phone camera. It opens RIG and connects to this Mac.</div>
                </>
              ) : (
                <div className="hint">Generating code… (is the engine running on this Mac?)</div>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ----------------------------- styles ----------------------------- */
function Style() {
  return (
    <style>{`
/* tokens are declared ON .rig-root (not :root) — a direct declaration always
   beats any inherited :root value (Deriva globals.css defines --ink/--line
   too), so app themes can never darken rig text again. */
.rig-root{
  --bg:#000;--s1:#0a0a0b;--s2:#141416;--s3:#1c1c1e;
  --line:#26262a;--line-strong:#3a3a3f;
  --ink:#f4f3ef;--ink-dim:#b0b0b6;--ink-faint:#8e8e93;
  --orange:#ff4f00;--green:#00ff66;--red:#ff3030;
  --font-mono:ui-monospace,"JetBrains Mono",Menlo,monospace;
  --font-dot:var(--font-dot-loaded),"Doto",var(--font-mono);
}
.rig-root{position:fixed;inset:var(--app-header-height) 0 0 0;background:var(--bg);color:var(--ink);font-family:var(--font-mono);overflow:hidden;color-scheme:dark}
.rig-root *{box-sizing:border-box}
@media(max-width:700px){.rig-root{inset:var(--mobile-header-height) 0 0 0}}
.rig-shell{display:grid;grid-template-rows:auto 1fr auto;height:100%;background:var(--bg)}

/* ---- type roles ---- */
.brand{font-family:var(--font-dot);font-weight:700;color:var(--orange);font-size:22px;letter-spacing:.02em;line-height:1;text-transform:uppercase}
.state-word{font-family:var(--font-dot);font-weight:700;font-size:16px;letter-spacing:.02em;color:var(--ink);text-transform:uppercase}
.hint{color:var(--ink-dim);font-size:10px;text-transform:uppercase;letter-spacing:.14em}
.kicker{color:var(--ink-faint);text-transform:uppercase;letter-spacing:.12em;font-size:10px}
.kicker.center{text-align:center;margin:auto;width:100%;padding:40px 20px}

/* ---- leds (§4) ---- */
.led{display:inline-block;width:9px;height:9px;background:var(--s3);box-shadow:inset 0 0 2px #000;vertical-align:middle;flex-shrink:0}
.led.on{background:var(--green);box-shadow:0 0 6px var(--green)}
.led.busy{background:var(--orange);box-shadow:0 0 6px var(--orange);animation:blink 1s steps(2) infinite}
.led.warn{background:var(--red);box-shadow:0 0 6px var(--red);animation:blink .6s steps(2) infinite}
.led.pending{background:var(--orange);box-shadow:0 0 6px var(--orange);animation:glyph-pulse 2s linear infinite}
@keyframes blink{50%{opacity:.25}}
@keyframes glyph-pulse{0%,100%{opacity:1}50%{opacity:.3}}

/* ---- shared control feel (§6: border/color only, 120-150ms linear) ---- */
.btn,.chip,.tab,.picker-row,.slash-row,.tile,.rig-item,.segmented button,.del{transition:border-color .13s linear,color .13s linear;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.btn{background:var(--s1);color:var(--ink);border:1px solid var(--line-strong);padding:10px 14px;text-transform:uppercase;letter-spacing:.12em;font-size:11px;border-radius:0;cursor:pointer;font-family:var(--font-mono)}
.btn:hover{border-color:var(--ink)}
.btn.primary{background:var(--orange);color:#000;border-color:var(--orange);font-weight:700}
.btn.primary:hover{border-color:var(--orange)}
.btn.primary:disabled{opacity:.4;cursor:not-allowed}
.btn.danger{border-color:var(--red);color:var(--red)}
.btn.send{background:var(--ink);color:#000;border-color:var(--ink);font-weight:700}
.btn.sm{padding:5px 10px;font-size:10px;min-height:32px}
.btn:disabled{opacity:.35;cursor:not-allowed}

/* ---- fields ---- */
.field{display:flex;flex-direction:column;gap:4px;margin:8px 0}
.field>label{color:var(--ink-dim);text-transform:uppercase;letter-spacing:.14em;font-size:9px}
.input,.select,.textarea{background:var(--bg);color:var(--ink);border:1px solid var(--line-strong);padding:8px 10px;font-family:var(--font-mono);font-size:13px;border-radius:0;width:100%}
.input:focus,.select:focus,.textarea:focus{outline:none;border-color:var(--orange)}
.input.search{border-color:var(--orange);margin-bottom:8px}
.textarea{resize:vertical;min-height:60px}
input:-webkit-autofill,textarea:-webkit-autofill,input:-webkit-autofill:hover,input:-webkit-autofill:focus{-webkit-box-shadow:0 0 0 1000px var(--s1) inset;box-shadow:0 0 0 1000px var(--s1) inset;-webkit-text-fill-color:var(--ink);caret-color:var(--ink)}

/* ---- transport bar (top) ---- */
.rig-top{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.chip{display:inline-flex;flex-direction:column;align-items:flex-start;gap:1px;background:var(--bg);border:1px solid var(--line);padding:5px 9px;cursor:pointer;font-family:var(--font-mono);color:var(--ink)}
.chip-l{color:var(--ink-dim);text-transform:uppercase;letter-spacing:.14em;font-size:9px}
.chip-v{color:var(--ink);font-size:11px;font-variant-numeric:tabular-nums;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chip:hover{border-color:var(--line-strong)}
.chip.add{border-color:var(--orange)}
.chip:disabled{opacity:.45;cursor:not-allowed}

/* ---- body / patch-list sidebar (§5) ---- */
.rig-body{display:grid;grid-template-columns:240px 1fr;min-height:0;overflow:hidden}
.rig-col{border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0;overflow:hidden}
.rig-col.main{border-right:none}
.rig-col-head{padding:9px 12px;border-bottom:1px solid var(--line);color:var(--ink-dim);text-transform:uppercase;letter-spacing:.14em;font-size:9px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.scroll{overflow:auto;min-height:0;flex:1}
.rig-item{padding:9px 12px;border-bottom:1px solid var(--line);cursor:pointer;display:flex;flex-direction:column;gap:3px}
.rig-item.active{background:var(--s2);box-shadow:inset 3px 0 0 var(--orange)}
.rig-item .t{color:var(--ink);font-size:13px;display:flex;gap:8px;align-items:center}
.rig-item .del{margin-left:auto;background:none;border:1px solid var(--line);color:var(--ink-dim);font-size:9px;padding:2px 6px;min-width:44px;min-height:28px;cursor:pointer;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.1em}
.rig-item .del:hover{border-color:var(--red);color:var(--red)}
.rig-item .c{color:var(--ink-faint);font-size:10px;word-break:break-all;font-variant-numeric:tabular-nums}

/* ---- transcript (§5) ---- */
.transcript{display:flex;flex-direction:column;padding:14px;height:100%;overflow:auto}
.bubble{margin-bottom:12px;white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.55}
.bubble.user{border:1px solid var(--line-strong);background:var(--s1);padding:10px 12px}
.bubble.assistant{padding:0}
.bubble.assistant.live{box-shadow:inset 3px 0 0 var(--green);padding-left:10px}
.bubble.sys,.bubble.err{border:none;background:none;font-size:10px;text-transform:uppercase;letter-spacing:.12em}
.bubble.sys{color:var(--ink-faint)}
.bubble.err{color:var(--red)}
.bubble .who{color:var(--ink-faint);text-transform:uppercase;letter-spacing:.16em;font-size:9px;display:block;margin-bottom:4px}

/* markdown (no deps) */
.md-p{margin:0 0 10px;white-space:pre-wrap}
.md-p:last-child{margin-bottom:0}
.md-h{color:var(--ink);text-transform:uppercase;letter-spacing:.1em;font-size:11px;font-weight:700;margin:14px 0 8px}
.md-ul,.md-ol{margin:0 0 10px;padding-left:18px}
.md-ul li,.md-ol li{margin:3px 0}
.md-pre{background:var(--bg);border:1px solid var(--line);padding:10px;margin:0 0 10px;white-space:pre-wrap;word-break:break-word;font-size:12px;color:#9fe0b4;max-height:260px;overflow:auto}
.bubble.assistant strong{color:var(--ink);font-weight:700}
.bubble.assistant em{color:var(--ink-dim);font-style:normal}
.bubble.assistant code{background:var(--s2);border:1px solid var(--line);padding:0 4px;font-size:12px}
.think{margin:0 0 10px;border:1px solid var(--line);background:var(--s1)}
.think summary{cursor:pointer;color:var(--ink-faint);font-size:9px;letter-spacing:.14em;text-transform:uppercase;padding:6px 10px;list-style:none}
.think summary::-webkit-details-marker{display:none}
.think-body{color:var(--ink-faint);font-size:11px;line-height:1.5;padding:0 10px 8px;white-space:pre-wrap;word-break:break-word;max-height:200px;overflow:auto}

/* ---- tool cards = module cards (§5) ---- */
.tcard{border:1px solid var(--line);background:var(--s1);padding:9px 10px;margin-bottom:10px}
.tcard.needperm{border-color:var(--orange)}
.tcard .tname{color:var(--ink-dim);text-transform:uppercase;letter-spacing:.1em;font-size:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tcard .tname-t{color:var(--ink);font-weight:700}
.tcard .targs{color:var(--ink-faint);text-transform:none;letter-spacing:0;font-size:10px;font-variant-numeric:tabular-nums}
.tcard .targs-full{margin:6px 0 0;white-space:pre-wrap;word-break:break-word;font-size:11px;color:var(--ink);background:var(--bg);border:1px solid var(--line);padding:8px;max-height:180px;overflow:auto}
.tcard pre.tout{margin:6px 0 0;white-space:pre-wrap;word-break:break-word;font-size:12px;max-height:200px;overflow:auto;background:var(--bg);border:1px solid var(--line);padding:8px;color:#9fe0b4}
.tcard.win-bad pre.tout{color:#ff8d8d}
.tcard .ok{color:var(--green)}
.tcard .bad{color:var(--red)}
.tcard .diff{margin:6px 0 0;white-space:pre;overflow:auto;background:var(--bg);border:1px solid var(--line);padding:8px;font-size:12px}
.tcard .diff .add{color:var(--green)}
.tcard .diff .del{color:var(--red)}
.perm-actions{display:flex;gap:8px;margin-top:8px}
.perm-actions .btn{flex:1;min-height:44px}

/* ---- composer (§5) ---- */
.composer{position:relative;display:flex;gap:8px;padding:10px;border-top:1px solid var(--line);background:var(--s1)}
.composer .textarea{flex:1}
.composer .btn{min-width:72px}
.slash-palette{position:absolute;bottom:calc(100% + 6px);left:10px;right:10px;background:var(--s1);border:1px solid var(--orange);z-index:20;max-height:230px;overflow:auto}
.slash-row{display:flex;gap:12px;padding:9px 12px;border-bottom:1px solid var(--line);cursor:pointer}
.slash-row.sel{background:var(--s2);border-left:3px solid var(--orange);padding-left:9px}
.sc-cmd{color:var(--orange);font-size:12px;letter-spacing:.08em}
.sc-desc{color:var(--ink-dim);font-size:11px;margin-left:auto;text-transform:none;letter-spacing:0}

/* ---- modals (§5) ---- */
.rig-modal{position:fixed;inset:0;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;z-index:200}
.rig-modal-card{border:1px solid var(--line);background:var(--s1);width:100%;max-width:340px}
.rig-modal-card.wide{max-width:560px}
.rig-modal-card .ph{padding:9px 12px;border-bottom:1px solid var(--orange);color:var(--ink);display:flex;justify-content:space-between;align-items:center}
.rig-modal-card .ph>span:first-child{font-family:var(--font-dot);font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase}
.rig-modal-card .pb{padding:16px}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px}
.tile{display:flex;flex-direction:column;gap:3px;border:1px solid var(--line);background:var(--bg);padding:12px;cursor:pointer;text-align:left;font-family:var(--font-mono);color:var(--ink)}
.tile:hover{border-color:var(--line-strong)}
.tile-name{color:var(--ink);font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.tile-kind{color:var(--ink-faint);font-size:10px;text-transform:uppercase}
.picker-list{display:flex;flex-direction:column;max-height:340px;overflow:auto;border:1px solid var(--line);margin-top:4px}
.picker-row{display:flex;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--line);cursor:pointer;font-size:12px}
.picker-row:hover{background:var(--s2)}
.picker-row.sel{background:var(--s2);border-left:3px solid var(--orange);padding-left:7px}
.picker-row.cur .pm-id{color:var(--green)}
.pm-id{color:var(--ink)}
.pm-sub{color:var(--ink-faint);margin-left:auto;font-size:10px;font-variant-numeric:tabular-nums}
.eng-row{display:flex;align-items:center;gap:10px;border:1px solid var(--line);padding:10px;margin-bottom:8px}
.eng-row.active{border-color:var(--orange)}
.eng-info{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.eng-name{color:var(--ink);font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.eng-sub{color:var(--ink-faint);font-size:10px;word-break:break-all;font-variant-numeric:tabular-nums}
.eng-actions{display:flex;gap:6px;flex-shrink:0}
.breadcrumb{font-size:12px;color:var(--green);padding:6px 0;word-break:break-all;font-variant-numeric:tabular-nums}
.quick{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}
.footer{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}
.row{display:flex;gap:8px;align-items:center;justify-content:space-between}
.mono{font-size:12px;color:var(--ink);word-break:break-all;font-variant-numeric:tabular-nums}
.segmented{display:flex;border:1px solid var(--line);width:fit-content}
.segmented button{background:var(--bg);color:var(--ink-dim);border:none;padding:7px 14px;font-family:var(--font-mono);font-size:11px;letter-spacing:.1em;cursor:pointer;text-transform:uppercase}
.segmented button.on{background:var(--ink);color:#000;font-weight:700}
.help{display:flex;flex-direction:column}
.help-row{display:flex;justify-content:space-between;gap:18px;padding:8px 0;border-bottom:1px solid var(--line);font-size:12px}
.help-row span:first-child{color:var(--ink);letter-spacing:.06em}
.help-row span:last-child{color:var(--ink-dim);text-transform:none;letter-spacing:0}
.help-sep{height:8px}
.bad{color:var(--red);font-size:11px;margin:6px 0;text-transform:uppercase;letter-spacing:.12em}

/* ---- connect / pair / empty (§5) ---- */
.connect-wrap{height:100%;display:flex;align-items:center;justify-content:center;padding:20px}
.connect-card{border:1px solid var(--line);background:var(--s1);padding:26px;width:100%;max-width:420px}
.connect-card h1{font-family:var(--font-dot);font-weight:700;color:var(--orange);font-size:34px;letter-spacing:.02em;margin:0 0 6px;line-height:1}
.connect-card .hint{color:var(--ink-dim);font-size:10px;margin:4px 0 16px}
.connect-card .led{display:block;margin:10px auto;width:12px;height:12px}
.steps{color:var(--ink-dim);font-size:12px;line-height:1.7;padding-left:18px;margin:8px 0}
.steps code{color:var(--green)}
.qr-pad{background:#fff;padding:8px;display:inline-block}
.empty{margin:auto;text-align:center;padding:60px 20px;background-image:radial-gradient(var(--line) 1px,transparent 1px);background-size:12px 12px;width:100%;max-width:520px}
.empty-word{font-family:var(--font-dot);font-weight:700;font-size:48px;color:var(--ink);letter-spacing:.02em;line-height:1}
.empty-line{margin-top:14px;color:var(--ink-faint);font-size:10px;text-transform:uppercase;letter-spacing:.14em}

/* ---- chrome ---- */
.offline{background:var(--red);color:#000;padding:4px 10px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;text-align:center}
.toast{position:fixed;left:14px;bottom:14px;background:var(--s1);border:1px solid var(--orange);color:var(--ink);padding:9px 14px;font-size:11px;letter-spacing:.08em;z-index:300;text-transform:uppercase}
.transport{display:none;border-top:1px solid var(--line);background:var(--bg)}
.transport .tabs{display:flex}
.transport .tab{flex:1;border:none;background:var(--bg);color:var(--ink-dim);padding:14px 0;text-transform:uppercase;letter-spacing:.18em;font-size:11px;border-right:1px solid var(--line);cursor:pointer;font-family:var(--font-mono)}
.transport .tab.active{background:var(--ink);color:#000;font-weight:700}

/* ---- motion: reduced-motion respect (§6) ---- */
@media (prefers-reduced-motion: reduce){
  .rig-root *,.rig-root *::before,.rig-root *::after{animation:none!important;transition:none!important}
}
@media(max-width:760px){
  .rig-body{grid-template-columns:1fr}
  .rig-col{display:none;border-right:none}
  .rig-col.show{display:flex}
  .transport{display:block}
  .rig-shell{grid-template-rows:auto 1fr auto auto}
  .btn.sm{min-height:44px;min-width:44px}
  .rig-item .del{min-height:44px}
}
@media(max-width:700px){
  .input,.select,.textarea,.input.search{font-size:16px}
}
`}</style>
  );
}
