import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ClientMessage,
  Provider,
  ServerMessage,
  SessionSummary,
  ToolCall,
  ToolResult,
} from "../../shared/types";

type Msg = { id: string; role: "user" | "assistant" | "tool" | "err"; content: string };
type FeedBlock = {
  call?: ToolCall;
  result?: ToolResult;
  needPerm?: boolean;
  perm?: "approve" | "reject" | null;
};

function defaultWsHost() {
  const q = new URLSearchParams(location.search).get("ws");
  if (q) return q;
  if (location.port === "5173") return "localhost:8787";
  return location.host;
}

let _id = 0;
const uid = () => `m${++_id}`;

export default function App() {
  const [phase, setPhase] = useState<"connect" | "app">("connect");
  const [token, setToken] = useState(new URLSearchParams(location.search).get("token") || "");
  const [wsHost, setWsHost] = useState(defaultWsHost());
  const [status, setStatus] = useState<"idle" | "running">("idle");
  const ws = useRef<WebSocket | null>(null);

  const [providers, setProviders] = useState<Provider[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [chat, setChat] = useState<Record<string, Msg[]>>({});
  const [feed, setFeed] = useState<Record<string, FeedBlock[]>>({});
  const [pending, setPending] = useState<Record<string, { call: ToolCall; sessionId: string }>>({});
  const [showProviders, setShowProviders] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "tools" | "rigs">("chat");

  const accId = useRef<string | null>(null);

  const send = useCallback((m: ClientMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(m));
  }, []);

  const updateChat = useCallback((sid: string, fn: (m: Msg[]) => Msg[]) => {
    setChat((c) => ({ ...c, [sid]: fn(c[sid] || []) }));
  }, []);
  const updateFeed = useCallback((sid: string, fn: (f: FeedBlock[]) => FeedBlock[]) => {
    setFeed((c) => ({ ...c, [sid]: fn(c[sid] || []) }));
  }, []);

  const onMessage = useCallback(
    (m: ServerMessage) => {
      switch (m.type) {
        case "paired":
          setPhase("app");
          if ("Notification" in window) Notification.requestPermission().catch(() => {});
          break;
        case "providers":
          setProviders(m.list);
          break;
        case "sessions":
          setSessions(m.list);
          break;
        case "ready":
          setCurrent(m.sessionId);
          accId.current = null;
          setStatus("running");
          break;
        case "message_delta": {
          const sid = m.sessionId;
          updateChat(sid, (ms) => {
            if (accId.current && ms.find((x) => x.id === accId.current)) {
              return ms.map((x) =>
                x.id === accId.current ? { ...x, content: x.content + m.delta } : x,
              );
            }
            const id = uid();
            accId.current = id;
            return [...ms, { id, role: "assistant", content: m.delta }];
          });
          break;
        }
        case "message_done":
          accId.current = null;
          break;
        case "tool_call":
          accId.current = null;
          updateFeed(m.sessionId, (f) => [...f, { call: m.call }]);
          break;
        case "tool_result": {
          const r = m.result;
          updateFeed(m.sessionId, (f) =>
            f.map((b, i) =>
              i === f.length - 1 && b.call?.id === r.callId
                ? { ...b, result: r }
                : i === f.length - 1 && !b.result
                  ? { ...b, result: r }
                  : b,
            ),
          );
          updateChat(m.sessionId, (ms) => [
            ...ms,
            { id: uid(), role: "tool", content: `${r.ok ? "ok" : "err"} · ${r.output}` },
          ]);
          break;
        }
        case "permission_request": {
          updateFeed(m.sessionId, (f) => [
            ...f,
            { call: m.call, needPerm: true, perm: null },
          ]);
          setPending((p) => ({ ...p, [m.call.id]: { call: m.call, sessionId: m.sessionId } }));
          if ("Notification" in window) {
            new Notification("RIG · approval needed", { body: m.call.name });
          }
          break;
        }
        case "session_idle":
          setStatus("idle");
          break;
        case "session_done":
          setStatus("idle");
          if ("Notification" in window) new Notification("RIG · done", { body: "Agent finished." });
          break;
        case "error":
          updateChat(current ?? "", (ms) => [
            ...ms,
            { id: uid(), role: "err", content: m.message },
          ]);
          setStatus("idle");
          break;
      }
    },
    [current, updateChat, updateFeed],
  );

  const connect = useCallback(() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const sock = new WebSocket(`${proto}://${wsHost}/ws`);
    ws.current = sock;
    sock.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data));
      } catch {}
    };
    sock.onopen = () => send({ type: "hello", token });
    sock.onclose = () => setPhase("connect");
  }, [wsHost, token, send, onMessage]);

  /* ----------------------------- actions ----------------------------- */
  const submitPrompt = (text: string) => {
    if (!current || !text.trim()) return;
    updateChat(current, (ms) => [...ms, { id: uid(), role: "user", content: text }]);
    send({ type: "prompt", sessionId: current, text });
  };
  const abort = () => current && send({ type: "abort", sessionId: current });
  const decide = (callId: string, decision: "approve" | "reject") => {
    const p = pending[callId];
    if (!p) return;
    send({ type: "permission", sessionId: p.sessionId, toolCallId: callId, decision });
    updateFeed(p.sessionId, (f) =>
      f.map((b) => (b.call?.id === callId ? { ...b, needPerm: false, perm: decision } : b)),
    );
    setPending((pp) => {
      const n = { ...pp };
      delete n[callId];
      return n;
    });
  };
  const newSession = (cwd: string, providerId: string, permission: "auto" | "ask", title: string) =>
    send({ type: "new_session", cwd, providerId, permission, title });

  if (phase === "connect") {
    return (
      <div className="connect-wrap">
        <div className="connect-card">
          <h1>RIG</h1>
          <div className="hint">
            Local coding harness. Run <code>npm run rig</code> on your Mac, then open{" "}
            <span className="pair-link">http://localhost:8787/pair</span> to scan the QR.
          </div>
          <div className="field">
            <label>TOKEN</label>
            <input className="input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="daemon token" />
          </div>
          <div className="field">
            <label>WS HOST</label>
            <input className="input" value={wsHost} onChange={(e) => setWsHost(e.target.value)} placeholder="localhost:8787" />
          </div>
          <button className="btn primary" style={{ width: "100%", marginTop: 10 }} onClick={connect}>
            Connect
          </button>
        </div>
      </div>
    );
  }

  const curMsgs = chat[current ?? ""] || [];
  const curFeed = feed[current ?? ""] || [];
  const curSession = sessions.find((s) => s.id === current);

  return (
    <div className="rig-shell">
      <div className="rig-top">
        <span className="brand">RIG</span>
        <span className={"led " + (status === "running" ? "busy" : "on")} />
        <span className="kicker desktop-only">{status === "running" ? "RUNNING" : "IDLE"}</span>
        <span style={{ flex: 1 }} />
        <span className="kicker desktop-only">{curSession?.cwd}</span>
        <button className="btn sm" onClick={() => setShowProviders((v) => !v)}>
          PROVIDERS
        </button>
        {status === "running" && (
          <button className="btn sm danger" onClick={abort}>
            STOP
          </button>
        )}
      </div>

      <div className="rig-body">
        {/* LEFT: rigs + providers */}
        <div className={"rig-col" + (mobileTab === "rigs" ? " show" : "")}>
          <div className="rig-col-head">
            <span>RIGS</span>
            <span className="led on" />
          </div>
          <div style={{ overflow: "auto" }}>
            {sessions.map((s) => (
              <div
                key={s.id}
                className={"rig-item" + (s.id === current ? " active" : "")}
                onClick={() => send({ type: "open_session", sessionId: s.id })}
              >
                <span className="t">
                  <span className="led" /> {s.title}
                </span>
                <span className="c">{s.cwd}</span>
              </div>
            ))}
            <NewSessionForm providers={providers} onCreate={newSession} />
          </div>
          {showProviders && <ProvidersPanel providers={providers} send={send} />}
        </div>

        {/* CENTER: chat */}
        <div className={"rig-col" + (mobileTab === "chat" ? " show" : "")}>
          <div className="rig-col-head">
            <span>CHAT</span>
            <span className="led" />
          </div>
          <div className="chat">
            {curMsgs.length === 0 && (
              <div className="kicker">No session. Create a rig on the left, then send a prompt.</div>
            )}
            {curMsgs.map((m) => (
              <div key={m.id} className={"bubble " + m.role}>
                <span className="who">{m.role}</span>
                {m.content}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: tools */}
        <div className={"rig-col" + (mobileTab === "tools" ? " show" : "")}>
          <div className="rig-col-head">
            <span>TOOLS</span>
            <span className="led" />
          </div>
          <div className="feed">
            {curFeed.length === 0 && <div className="kicker">Tool activity appears here.</div>}
            {curFeed.map((b, i) => (
              <ToolBlock key={i} b={b} onDecide={decide} />
            ))}
          </div>
        </div>
      </div>

      {/* composer (desktop + phone) */}
      <Composer onSubmit={submitPrompt} running={status === "running"} />

      {/* phone transport */}
      <div className="transport">
        <div className="tabs">
          {(["chat", "tools", "rigs"] as const).map((t) => (
            <button
              key={t}
              className={"tab" + (mobileTab === t ? " active" : "")}
              onClick={() => setMobileTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- sub components ----------------------------- */

function ToolBlock({ b, onDecide }: { b: FeedBlock; onDecide: (id: string, d: "approve" | "reject") => void }) {
  return (
    <div className="tblock">
      <div className="tname">
        <span className="led" />
        {b.call?.name}
        {b.result?.ok === true && <span className="ok">OK</span>}
        {b.result?.ok === false && <span className="bad">FAIL</span>}
      </div>
      {b.result ? (
        <>
          <pre>{b.result.output}</pre>
          {b.result.diff && (
            <pre className="diff">
              {b.result.diff.split("\n").map((l, i) => (
                <div key={i} className={l.startsWith("+") ? "add" : l.startsWith("-") ? "del" : ""}>
                  {l}
                </div>
              ))}
            </pre>
          )}
        </>
      ) : (
        <pre className="kicker">{b.needPerm ? "awaiting approval…" : "running…"}</pre>
      )}
      {b.needPerm && b.call && (
        <div className="perm-actions">
          <button className="btn sm primary" onClick={() => onDecide(b.call!.id, "approve")}>
            APPROVE
          </button>
          <button className="btn sm danger" onClick={() => onDecide(b.call!.id, "reject")}>
            REJECT
          </button>
        </div>
      )}
    </div>
  );
}

function Composer({ onSubmit, running }: { onSubmit: (t: string) => void; running: boolean }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const rec = useRef<any>(null);

  const toggleVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    if (listening) {
      rec.current?.stop();
      setListening(false);
      return;
    }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => setText((t) => (t + " " + e.results[0][0].transcript).trim());
    r.onend = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div className="composer">
      <textarea
        className="textarea"
        value={text}
        placeholder={running ? "agent running… (or send to steer)" : "tell the rig what to do"}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit(text);
            setText("");
          }
        }}
      />
      <button className="btn sm" onClick={toggleVoice} title="voice">
        {listening ? "●" : "🎙"}
      </button>
      <button
        className="btn primary"
        disabled={!text.trim()}
        onClick={() => {
          onSubmit(text);
          setText("");
        }}
      >
        SEND
      </button>
    </div>
  );
}

function NewSessionForm({
  providers,
  onCreate,
}: {
  providers: Provider[];
  onCreate: (cwd: string, pid: string, perm: "auto" | "ask", title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cwd, setCwd] = useState(".");
  const [pid, setPid] = useState(providers[0]?.id || "");
  const [perm, setPerm] = useState<"auto" | "ask">("auto");
  const [title, setTitle] = useState("");

  if (!providers.length)
    return <div className="kicker" style={{ margin: 12 }}>Add a provider first.</div>;

  return (
    <div className="rig-panel" style={{ margin: 10 }}>
      <div className="ph">
        <span>NEW RIG</span>
        <button className="btn sm" onClick={() => setOpen((v) => !v)}>
          {open ? "CLOSE" : "+"}
        </button>
      </div>
      {open && (
        <div className="pb">
          <div className="field">
            <label>WORKING DIR</label>
            <input className="input" value={cwd} onChange={(e) => setCwd(e.target.value)} placeholder="/abs/path or ." />
          </div>
          <div className="field">
            <label>PROVIDER</label>
            <select className="select" value={pid} onChange={(e) => setPid(e.target.value)}>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} · {p.model}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>PERMISSION</label>
            <select className="select" value={perm} onChange={(e) => setPerm(e.target.value as any)}>
              <option value="auto">auto (cwd-scoped)</option>
              <option value="ask">ask (phone approves)</option>
            </select>
          </div>
          <div className="field">
            <label>TITLE</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="my project" />
          </div>
          <button
            className="btn primary"
            style={{ width: "100%" }}
            onClick={() => {
              onCreate(cwd, pid, perm, title || cwd);
              setOpen(false);
            }}
          >
            SPAWN RIG
          </button>
        </div>
      )}
    </div>
  );
}

function ProvidersPanel({
  providers,
  send,
}: {
  providers: Provider[];
  send: (m: ClientMessage) => void;
}) {
  const [p, setP] = useState<Provider>({
    id: "",
    label: "",
    kind: "openai-compatible",
    baseUrl: "https://opencode.ai/zen/v1",
    apiKey: "",
    model: "deepseek-v4-flash-free",
  });

  return (
    <div className="rig-panel" style={{ margin: 10 }}>
      <div className="ph">
        <span>PROVIDERS</span>
      </div>
      <div className="pb">
        {providers.map((x) => (
          <div key={x.id} className="rig-item" style={{ margin: "6px 0" }}>
            <span className="t">{x.label}</span>
            <span className="c">
              {x.kind} · {x.model}
            </span>
            <button className="btn sm danger" style={{ marginTop: 4 }} onClick={() => send({ type: "delete_provider", id: x.id })}>
              DELETE
            </button>
          </div>
        ))}
        <div className="field">
          <label>LABEL</label>
          <input className="input" value={p.label} onChange={(e) => setP({ ...p, label: e.target.value })} />
        </div>
        <div className="field">
          <label>KIND</label>
          <select className="select" value={p.kind} onChange={(e) => setP({ ...p, kind: e.target.value as any })}>
            <option value="openai-compatible">openai-compatible</option>
            <option value="anthropic">anthropic</option>
          </select>
        </div>
        <div className="field">
          <label>BASE URL</label>
          <input
            className="input"
            value={p.baseUrl}
            onChange={(e) => setP({ ...p, baseUrl: e.target.value })}
            placeholder="https://opencode.ai/zen/v1"
          />
        </div>
        <div className="field">
          <label>API KEY</label>
          <input className="input" value={p.apiKey} onChange={(e) => setP({ ...p, apiKey: e.target.value })} />
        </div>
        <div className="field">
          <label>MODEL</label>
          <input className="input" value={p.model} onChange={(e) => setP({ ...p, model: e.target.value })} />
        </div>
        <button
          className="btn primary"
          style={{ width: "100%" }}
          disabled={!p.label || !p.apiKey}
          onClick={() =>
            send({ type: "save_provider", provider: { ...p, id: p.id || p.label.toLowerCase().replace(/\s/g, "-") } })
          }
        >
          SAVE PROVIDER
        </button>
      </div>
    </div>
  );
}
