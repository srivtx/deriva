"use client";
import { useEffect, type ReactNode } from "react";
import type { ToolCall } from "../../../harness/shared/types";

export type FeedBlock = { call?: ToolCall; result?: { callId: string; ok: boolean; output: string; diff?: string }; needPerm?: boolean; perm?: "approve" | "reject" | null };

export type Msg = { id: string; role: "user" | "assistant" | "sys" | "err"; content: string };

export function Led({ state }: { state: "off" | "on" | "busy" | "warn" | "pending" }) {
  return <span className={"led " + state} />;
}

export function Chip({ label, value, onClick, disabled }: {
  label: string;
  value: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button className="chip" onClick={onClick} disabled={disabled}>
      <span className="chip-l">{label}</span>
      <span className="chip-v">{value}</span>
    </button>
  );
}

export function ModalShell({ title, onClose, children, wide }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="rig-modal" onClick={onClose}>
      <div className={"rig-modal-card" + (wide ? " wide" : "")} onClick={(e) => e.stopPropagation()}>
        <div className="ph">
          <span>{title}</span>
          <button className="btn sm" onClick={onClose}>✕</button>
        </div>
        <div className="pb">{children}</div>
      </div>
    </div>
  );
}

function summarizeArgs(json: string): string {
  try {
    const o = JSON.parse(json);
    const keys = Object.keys(o);
    const first = keys.slice(0, 1).map((k) => {
      const v = o[k];
      const s = typeof v === "string" ? v : JSON.stringify(v);
      return `${k}=${s.slice(0, 48)}`;
    });
    return first.length ? " · " + first.join(" ") : "";
  } catch {
    return "";
  }
}

function prettyArgs(json: string): string {
  try {
    const o = JSON.parse(json);
    let s = JSON.stringify(o, null, 2);
    if (s.length > 600) s = s.slice(0, 600) + "\n…(truncated)";
    return s;
  } catch {
    return json.length > 600 ? json.slice(0, 600) + "\n…(truncated)" : json;
  }
}

/* ---- minimal markdown renderer (no deps; React elements only) ---- */

function inlineNodes(text: string, k: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const key = `${k}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={key}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={key}>{t.slice(1, -1)}</code>);
    else out.push(<em key={key}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Block =
  | { t: "p"; lines: string[] }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "h"; text: string }
  | { t: "pre"; text: string };

function parseBlocks(src: string): Block[] {
  const lines = src.split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { t: "ul" | "ol"; items: string[] } | null = null;
  let fence: string[] | null = null;
  const flushP = () => {
    if (para.length) { blocks.push({ t: "p", lines: para }); para = []; }
  };
  const flushL = () => {
    if (list) { blocks.push(list); list = null; }
  };
  for (const line of lines) {
    if (fence !== null) {
      if (/^```/.test(line.trim())) { blocks.push({ t: "pre", text: fence.join("\n") }); fence = null; }
      else fence.push(line);
      continue;
    }
    if (/^```/.test(line.trim())) { flushP(); flushL(); fence = []; continue; }
    const h = line.match(/^#{1,6}\s+(.*)/);
    if (h) { flushP(); flushL(); blocks.push({ t: "h", text: h[1] }); continue; }
    const ul = line.match(/^\s*[-*+]\s+(.*)/);
    if (ul) { flushP(); if (!list || list.t !== "ul") { flushL(); list = { t: "ul", items: [] }; } list.items.push(ul[1]); continue; }
    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (ol) { flushP(); if (!list || list.t !== "ol") { flushL(); list = { t: "ol", items: [] }; } list.items.push(ol[1]); continue; }
    if (!line.trim()) { flushP(); flushL(); continue; }
    para.push(line);
  }
  if (fence) blocks.push({ t: "pre", text: fence.join("\n") });
  flushP();
  flushL();
  return blocks;
}

export function RichText({ text }: { text: string }) {
  // fold <think>…</think> (or unterminated while streaming) into a collapsed block
  const parts: { think: boolean; body: string }[] = [];
  const re = /<think>([\s\S]*?)(<\/think>|$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ think: false, body: text.slice(last, m.index) });
    parts.push({ think: true, body: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ think: false, body: text.slice(last) });

  return (
    <>
      {parts.map((p, i) =>
        p.think ? (
          <details key={i} className="think">
            <summary>REASONING</summary>
            <div className="think-body">{p.body.trim()}</div>
          </details>
        ) : (
          <span key={i}>
            {parseBlocks(p.body).map((b, j) => {
              const k = `${i}-${j}`;
              if (b.t === "p") return <p key={k} className="md-p">{inlineNodes(b.lines.join("\n"), k)}</p>;
              if (b.t === "h") return <div key={k} className="md-h">{inlineNodes(b.text, k)}</div>;
              if (b.t === "pre") return <pre key={k} className="md-pre">{b.text}</pre>;
              const L = b.t === "ul" ? "md-ul" : "md-ol";
              return (
                <b.t key={k} className={L}>
                  {b.items.map((it, n) => <li key={n}>{inlineNodes(it, `${k}-${n}`)}</li>)}
                </b.t>
              );
            })}
          </span>
        ),
      )}
    </>
  );
}

export function ToolCard({ block, onDecide }: {
  block: FeedBlock;
  onDecide: (id: string, d: "approve" | "reject") => void;
}) {
  const call = block.call;
  const result = block.result;
  const state = result ? (result.ok ? "on" : "warn") : block.needPerm ? "pending" : "busy";
  const win = result ? (result.ok ? " win-ok" : " win-bad") : "";
  return (
    <div className={"tcard" + (block.needPerm ? " needperm" : "") + win}>
      <div className="tname">
        <Led state={state} />
        <span className="tname-t">{call?.name ?? "tool"}</span>
        <span className="targs">{call ? summarizeArgs(call.args) : ""}</span>
        {result?.ok === true && <span className="ok">OK</span>}
        {result?.ok === false && <span className="bad">FAIL</span>}
      </div>
      {result && (
        <>
          <pre className="tout">{result.output}</pre>
          {result.diff && (
            <pre className="diff">
              {result.diff.split("\n").map((l, i) => (
                <div key={i} className={l.startsWith("+") ? "add" : l.startsWith("-") ? "del" : ""}>{l}</div>
              ))}
            </pre>
          )}
        </>
      )}
      {!result && <pre className="kicker">{block.needPerm ? "awaiting approval…" : "running…"}</pre>}
      {block.needPerm && call && (
        <pre className="targs-full">{prettyArgs(call.args)}</pre>
      )}
      {block.needPerm && call && (
        <div className="perm-actions">
          <button className="btn sm primary" onClick={() => onDecide(call.id, "approve")}>APPROVE</button>
          <button className="btn sm danger" onClick={() => onDecide(call.id, "reject")}>REJECT</button>
        </div>
      )}
    </div>
  );
}

export function MsgRow({ m, live }: { m: Msg; live?: boolean }) {
  if (m.role === "assistant") {
    return (
      <div className={"bubble assistant" + (live ? " live" : "")}>
        <RichText text={m.content} />
      </div>
    );
  }
  return (
    <div className={"bubble " + m.role}>
      <span className="who">{m.role}</span>
      {m.content}
    </div>
  );
}
