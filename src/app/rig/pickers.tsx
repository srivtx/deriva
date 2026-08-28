"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ModelInfo, Provider } from "../../../harness/shared/types";
import { fuzzy } from "./commands";
import { Led, ModalShell } from "./blocks";

export const PRESETS = [
  { id: "zen", label: "OPENCODE ZEN", kind: "opencode-zen", baseUrl: "https://opencode.ai/zen/v1" },
  { id: "go", label: "OPENCODE GO", kind: "opencode-go", baseUrl: "https://opencode.ai/zen/go/v1" },
  { id: "openai", label: "OPENAI-COMPATIBLE", kind: "openai-compatible", baseUrl: "" },
  { id: "anthropic", label: "ANTHROPIC", kind: "anthropic", baseUrl: "https://api.anthropic.com" },
] as const;

export type Preset = (typeof PRESETS)[number];

const RECOMMENDED = [
  "gpt-5.2",
  "gpt-5.1-codex",
  "claude-opus-4-5",
  "claude-sonnet-4-5",
  "gemini-3-pro",
  "minimax-m2.1",
];

/** Searchable model list, shared by the Model modal and the provider flow. */
export function ModelList({ list, activeModel, onPick }: {
  list: ModelInfo[];
  activeModel: string | null;
  onPick: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const filtered = list.filter((m) => fuzzy(m.id + " " + (m.name ?? ""), q));
  return (
    <>
      <input
        className="input search"
        autoFocus
        value={q}
        placeholder="search models…"
        onChange={(e) => {
          setQ(e.target.value);
          setSel(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSel((s) => Math.min(s + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSel((s) => Math.max(s - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[sel]) onPick(filtered[sel].id);
          }
        }}
      />
      <div className="picker-list">
        {filtered.length === 0 && <div className="hint">no models match</div>}
        {filtered.map((m, i) => (
          <div
            key={m.id}
            className={"picker-row" + (i === sel ? " sel" : "") + (m.id === activeModel ? " cur" : "")}
            onClick={() => onPick(m.id)}
          >
            <span className="led on" style={{ visibility: m.id === activeModel ? "visible" : "hidden" }} />
            <span className="pm-id">{m.name || m.id}</span>
            <span className="pm-sub">{m.id}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export function ModelPicker({ list, activeModel, onPick, onRetry, onEngines, onClose }: {
  list: ModelInfo[];
  activeModel: string | null;
  onPick: (id: string) => void;
  onRetry: () => void;
  onEngines: () => void;
  onClose: () => void;
}) {
  return (
    <ModalShell title="MODEL" onClose={onClose}>
      {list.length === 0 ? (
        <>
          <div className="hint">NO MODELS — REFETCH OR CHECK ENGINE</div>
          <button className="btn primary" style={{ width: "100%", marginTop: 10 }} onClick={onRetry}>
            RETRY FETCH
          </button>
          <button className="btn" style={{ width: "100%", marginTop: 8 }} onClick={onEngines}>
            OPEN ENGINES
          </button>
        </>
      ) : (
        <ModelList list={list} activeModel={activeModel} onPick={onPick} />
      )}
    </ModalShell>
  );
}

export function FolderPicker({ start, onPick, onClose }: {
  start: string;
  onPick: (p: string) => void;
  onClose: () => void;
}) {
  const [path, setPath] = useState(start);
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([]);
  const [parent, setParent] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const load = useCallback(async (p: string) => {
    try {
      const host = window.location.hostname;
      const r = await fetch(`http://${host}:8787/api/tree?path=${encodeURIComponent(p)}`, { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        setPath(j.path);
        setDirs(j.dirs || []);
        setParent(j.parent ?? null);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load(start);
  }, [start, load]);

  const mkdir = async () => {
    const n = name.trim();
    if (!n || !path) return;
    try {
      const host = window.location.hostname;
      const full = path.endsWith("/") ? path + n : path + "/" + n;
      const r = await fetch(`http://${host}:8787/api/mkdir?path=${encodeURIComponent(full)}`, { cache: "no-store" });
      if (r.ok) {
        setName("");
        setCreating(false);
        load(path);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <ModalShell title="FOLDER" onClose={onClose} wide>
      <div className="breadcrumb">{path}</div>
      <div className="quick">
        {["~", "~/projects", "~/Desktop"].map((q) => (
          <button key={q} className="btn sm" onClick={() => load(q === "~" ? "" : q.replace(/^~\//, ""))}>
            {q}
          </button>
        ))}
        {!creating && <button className="btn sm" onClick={() => setCreating(true)} disabled={!path}>+ NEW FOLDER</button>}
      </div>
      {creating && (
        <div className="row" style={{ marginBottom: 8 }}>
          <input
            className="input"
            autoFocus
            value={name}
            placeholder="new folder name…"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") mkdir();
              if (e.key === "Escape") setCreating(false);
            }}
          />
          <button className="btn sm primary" onClick={mkdir} disabled={!name.trim()}>CREATE</button>
          <button className="btn sm" onClick={() => setCreating(false)}>✕</button>
        </div>
      )}
      <div className="picker-list">
        {parent && (
          <div className="picker-row" onClick={() => load(parent)}>
            ..
          </div>
        )}
        {dirs.map((d) => (
          <div key={d.path} className="picker-row" onClick={() => load(d.path)}>
            ▸ {d.name}
          </div>
        ))}
        {dirs.length === 0 && <div className="hint">no subfolders</div>}
      </div>
      <div className="footer">
        <span className="hint">SELECTED: {path}</span>
        <button className="btn primary" onClick={() => onPick(path)}>
          USE THIS FOLDER
        </button>
      </div>
    </ModalShell>
  );
}

export function ProviderFlow({ step, status, err, provId, models, onTile, onConnect, onPickModel, onClose }: {
  step: "tile" | "key" | "pick";
  status: string;
  err: string;
  provId: string;
  models: ModelInfo[];
  onTile: (p: Preset) => void;
  onConnect: (baseUrl: string, key: string) => void;
  onPickModel: (id: string) => void;
  onClose: () => void;
}) {
  const [key, setKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const preset = PRESETS.find((p) => p.id === provId);
  const showBase = provId === "openai";

  if (step === "tile") {
    return (
      <ModalShell title="PROVIDER" onClose={onClose}>
        <div className="tiles">
          {PRESETS.map((p) => (
            <button key={p.id} className="tile" onClick={() => onTile(p)}>
              <span className="tile-name">{p.label}</span>
              <span className="tile-kind">{p.kind}</span>
            </button>
          ))}
        </div>
        <div className="hint">Pick a provider. Next, paste your API key — models are fetched automatically.</div>
      </ModalShell>
    );
  }

  if (step === "key") {
    return (
      <ModalShell title="PROVIDER" onClose={onClose}>
        <div className="hint">{preset?.label}</div>
        {showBase && (
          <div className="field">
            <label>BASE URL</label>
            <input
              className="input"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>
        )}
        <div className="field">
          <label>API KEY</label>
          <input
            className="input"
            type="password"
            autoFocus
            value={key}
            placeholder="paste key…"
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConnect(showBase ? baseUrl : preset?.baseUrl || "", key);
            }}
          />
        </div>
        {err && <div className="bad">{err}</div>}
        {status && <div className="hint">{status}</div>}
        <button
          className="btn primary"
          style={{ width: "100%" }}
          disabled={!key}
          onClick={() => onConnect(showBase ? baseUrl : preset?.baseUrl || "", key)}
        >
          CONNECT
        </button>
      </ModalShell>
    );
  }

  // pick
  const ordered = [...models].sort(
    (a, b) => RECOMMENDED.indexOf(a.id) - RECOMMENDED.indexOf(b.id),
  );
  return (
    <ModalShell title="PROVIDER · PICK MODEL" onClose={onClose}>
      <div className="hint">FOUND {models.length} MODELS — CHOOSE DEFAULT</div>
      <ModelList list={ordered} activeModel={null} onPick={onPickModel} />
    </ModalShell>
  );
}

export function EnginesModal({ providers, activePid, onUse, onModels, onDelete, onAdd, onRestore, onClose }: {
  providers: Provider[];
  activePid: string;
  onUse: (id: string) => void;
  onModels: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onRestore: () => void;
  onClose: () => void;
}) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const tRef = useRef<number | null>(null);
  const del = (id: string) => {
    if (confirm === id) {
      setConfirm(null);
      onDelete(id);
    } else {
      setConfirm(id);
      if (tRef.current) window.clearTimeout(tRef.current);
      tRef.current = window.setTimeout(() => setConfirm(null), 2500) as unknown as number;
    }
  };
  return (
    <ModalShell title="ENGINES" onClose={onClose}>
      {providers.length === 0 && (
        <>
          <div className="hint">no engines — add one, or restore the last backup</div>
          <button className="btn" style={{ width: "100%", marginBottom: 8 }} onClick={onRestore}>RESTORE LAST BACKUP</button>
        </>
      )}
      {providers.map((p) => (
        <div key={p.id} className={"eng-row" + (p.id === activePid ? " active" : "")}>
          <span className={"led " + (p.model ? "on" : "off")} />
          <div className="eng-info">
            <span className="eng-name">{p.label}</span>
            <span className="eng-sub">{p.id} · {p.kind} · {p.model || "NO MODEL"}</span>
          </div>
          <div className="eng-actions">
            <button className="btn sm" onClick={() => onUse(p.id)}>USE</button>
            <button className="btn sm" onClick={() => onModels(p.id)}>MODELS</button>
            <button className="btn sm danger" onClick={() => del(p.id)}>{confirm === p.id ? "SURE?" : "DEL"}</button>
          </div>
        </div>
      ))}
      <button className="btn primary" style={{ width: "100%", marginTop: 10 }} onClick={onAdd}>+ ADD ENGINE</button>
      <div className="hint" style={{ marginTop: 8 }}>DEL removes the stored key — an automatic backup is kept and restorable here.</div>
    </ModalShell>
  );
}

export function NewRigModal({ providers, activePid, pendingCwd, activeModel, onBrowse, onPickModel, onSpawn, onAddEngine, onClose }: {
  providers: Provider[];
  activePid: string;
  pendingCwd: string;
  activeModel: string | null;
  onBrowse: () => void;
  onPickModel: () => void;
  onSpawn: (cwd: string, perm: "auto" | "ask", title: string) => void;
  onAddEngine: () => void;
  onClose: () => void;
}) {
  const prov = providers.find((p) => p.id === activePid) || providers[0];
  const ready = !!prov && !!activeModel;
  const [perm, setPerm] = useState<"auto" | "ask">("auto");
  const [title, setTitle] = useState("");
  return (
    <ModalShell title="NEW RIG" onClose={onClose} wide>
      <div className="field">
        <label>WORKING DIR</label>
        <div className="row">
          <span className="mono">{pendingCwd}</span>
          <button className="btn sm" onClick={onBrowse}>BROWSE</button>
        </div>
      </div>
      <div className="field">
        <label>MODEL</label>
        <div className="row">
          <span className="mono">{activeModel || "none"}</span>
          <button className="btn sm" onClick={onPickModel}>PICK</button>
        </div>
      </div>
      <div className="field">
        <label>PERMISSION</label>
        <div className="segmented">
          <button className={perm === "auto" ? "on" : ""} onClick={() => setPerm("auto")}>AUTO</button>
          <button className={perm === "ask" ? "on" : ""} onClick={() => setPerm("ask")}>ASK</button>
        </div>
      </div>
      <div className="field">
        <label>TITLE</label>
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={pendingCwd.split("/").pop() || "rig"}
        />
      </div>
      <button
        className="btn primary"
        style={{ width: "100%" }}
        disabled={!ready}
        onClick={() => onSpawn(pendingCwd, perm, title)}
      >
        {ready ? "SPAWN ▸" : "NEED PROVIDER + MODEL"}
      </button>
      {!ready && <button className="btn" style={{ width: "100%", marginTop: 8 }} onClick={onAddEngine}>+ ADD ENGINE</button>}
    </ModalShell>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="HELP" onClose={onClose} wide>
      <div className="help">
        <div className="help-row"><span>/model</span><span>switch model (searchable)</span></div>
        <div className="help-row"><span>/folder</span><span>change working dir (desktop)</span></div>
        <div className="help-row"><span>/provider</span><span>add or switch provider (key only)</span></div>
        <div className="help-row"><span>/new</span><span>spawn a new rig</span></div>
        <div className="help-row"><span>/compact</span><span>summarize &amp; shrink context</span></div>
        <div className="help-row"><span>/clear</span><span>clear transcript view</span></div>
        <div className="help-row"><span>/help</span><span>this panel</span></div>
        <div className="help-sep" />
        <div className="help-row"><span>ENTER</span><span>send · SHIFT+ENTER newline</span></div>
        <div className="help-row"><span>/</span><span>open command palette · ↑↓ · ENTER · ESC</span></div>
      </div>
    </ModalShell>
  );
}
