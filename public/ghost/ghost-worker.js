/* GHOST WORKER — wllama 2.4.0 (proven CPU core, callback streaming).
   v3's server-context glue corrupted on mobile Chrome (garbage tokens,
   hangs, invalid allocations). This core is the battle-tested path.
   Protocol is unchanged: probe/status/cached/download/load/chat/stop/
   eject/delete/clear — engine.ts and page.tsx need no edits. */

// Vendored same-origin copy — no CDN dependency, fully offline-capable.
import { Wllama, CacheManager } from "/ghost/vendor/wllama/index.js";

const BASE = "/ghost/vendor/wllama";
const CONFIG_PATHS = {
  "single-thread/wllama.wasm": `${BASE}/single-thread/wllama.wasm`,
  "multi-thread/wllama.wasm": `${BASE}/multi-thread/wllama.wasm`,
};
const CHATML_STOP = ["<|im_end|>", "<|im_start|>"];

let wllama = null;
let loadedUrl = null;

const post = (msg) => self.postMessage(msg);

function emitToken(id, piece) {
  post({ id, evt: "token", piece });
}

async function releaseRuntime() {
  if (!wllama) return;
  try { await wllama.exit(); } catch {}
  wllama = null;
  loadedUrl = null;
}

function baseName(url) {
  try { return new URL(url).pathname.split("/").pop() || url; }
  catch { return url; }
}

async function verifyGone(cm, url) {
  const blob = await cm.open(url).catch(() => null);
  if (blob && blob.size > 0) return false;
  const root = await navigator.storage.getDirectory();
  for (const dirName of ["cache", "wllama", "ghost-models"]) {
    try {
      const dir = await root.getDirectoryHandle(dirName);
      const target = baseName(url);
      for await (const name of dir.keys()) {
        if (name.includes(target) || target.includes(name)) {
          try { await dir.removeEntry(name); } catch {}
          return false;
        }
      }
    } catch {}
  }
  return true;
}

async function opfsSweep(base) {
  try {
    const root = await navigator.storage.getDirectory();
    for (const dirName of ["cache", "wllama", "ghost-models"]) {
      try {
        const dir = await root.getDirectoryHandle(dirName);
        for await (const name of dir.keys()) {
          if (name.includes(base)) {
            try { await dir.removeEntry(name); } catch {}
          }
        }
      } catch {}
    }
  } catch {}
}

async function ensureLoaded(payload) {
  if (wllama && loadedUrl === payload.url) return;
  await releaseRuntime();
  const cm = new CacheManager();
  let blob = await cm.open(payload.url);
  // Integrity gate: truncated/corrupt files load "fine" then produce
  // garbage tokens and memory crashes. Verify before trusting.
  if (blob && blob.size > 4) {
    const magic = await blob.slice(0, 4).text();
    const name = await cm.getNameFromURL(payload.url);
    const meta = await cm.getMetadata(name).catch(() => null);
    const expected = meta?.originalSize ?? meta?.size ?? 0;
    if (magic !== "GGUF" || (expected > 0 && Math.abs(blob.size - expected) > 1024)) {
      await cm.delete(payload.url).catch(() => {});
      await opfsSweep(baseName(payload.url));
      throw Object.assign(new Error("MODEL_CORRUPT"), { name: "GhostStorage" });
    }
  }
  if (!blob || blob.size <= 0) {
    throw Object.assign(new Error("MODEL_NOT_CACHED"), { name: "GhostStorage" });
  }
  wllama = new Wllama(CONFIG_PATHS);
  await wllama.loadModel([blob], { n_ctx: 2048 });
  loadedUrl = payload.url;
}

self.onmessage = async (e) => {
  const { id, cmd, payload } = e.data || {};
  try {
    /* ---------- probe ---------- */
    if (cmd === "probe") {
      // Workers have no localStorage — readiness is tracked client-side.
      post({ id, evt: "done", data: { ready: true } });
      return;
    }

    /* ---------- status ---------- */
    if (cmd === "status") {
      post({
        id, evt: "done",
        data: { loaded: !!wllama, url: loadedUrl },
      });
      return;
    }

    /* ---------- cached size ---------- */
    if (cmd === "cached") {
      const cm = new CacheManager();
      const blob = await cm.open(payload.url).catch(() => null);
      post({ id, evt: "done", data: { cached: !!(blob && blob.size > 0), bytes: blob ? blob.size : 0 } });
      return;
    }

    /* ---------- scan all cached urls ---------- */
    if (cmd === "scanStorage") {
      const cm = new CacheManager();
      const urls = payload.urls || [];
      const out = [];
      for (const url of urls) {
        const blob = await cm.open(url).catch(() => null);
        if (blob && blob.size > 0) out.push({ url, bytes: blob.size });
      }
      post({ id, evt: "done", data: { entries: out } });
      return;
    }

    /* ---------- download with progress ---------- */
    if (cmd === "download") {
      const cm = new CacheManager();
      const signal = payload.signal;
      const res = await fetch(payload.url, { signal });
      if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status}`);
      const total = Number(res.headers.get("content-length")) || payload.totalBytes || 0;
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        post({
          id, evt: "progress",
          loaded: received,
          total,
          data: {
            fraction: total > 0 ? Math.min(1, received / total) : 0,
            loadedMb: Math.round(received / 1048576),
            totalMb: Math.round(total / 1048576),
          },
        });
      }
      const name = await cm.getNameFromURL(payload.url);
      await cm.write(
        name,
        new Blob(chunks).stream(),
        { originalSize: received, createdAt: Date.now(), url: payload.url },
      );
      post({ id, evt: "done", data: { bytes: received } });
      return;
    }

    /* ---------- load into runtime ---------- */
    if (cmd === "load") {
      await ensureLoaded(payload);
      post({ id, evt: "done", data: {} });
      return;
    }

    /* ---------- chat: self-rendered ChatML, single-shot, callback stream ---- */
    if (cmd === "chat") {
      if (!wllama) {
        await ensureLoaded({ url: payload.url ?? payload.modelUrl });
      }
      const msgs = Array.isArray(payload.messages) ? payload.messages : [];
      const promptStr = msgs
        .map((m) => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
        .join("\n") + "\n<|im_start|>assistant\n";
      const clean = (s) => String(s ?? "").replace(/<\|[a-z_]+\|>/g, "");
      const started = performance.now();
      let tokens = 0;
      const text = await wllama.createCompletion(promptStr, {
        nPredict: Math.min(payload.maxTokens || 280, 280),
        sampling: { temp: payload.temperature ?? 0.35, top_p: 0.9 },
        stopTokens: CHATML_STOP,
        onNewToken: (_token, piece) => {
          tokens += 1;
          emitToken(id, clean(new TextDecoder().decode(piece)));
        },
      });
      const seconds = (performance.now() - started) / 1000;
      const finalText = clean(typeof text === "string" ? text : text?.choices?.[0]?.text ?? "");
      post({ id, evt: "done", data: {
        text: finalText,
        tokens: Math.max(tokens, 1),
        tps: seconds > 0 ? Math.max(tokens, 1) / seconds : 0,
      }});
      return;
    }

    /* ---------- stop: hard terminate (only reliable kill switch) ---------- */
    if (cmd === "stop") {
      post({ id, evt: "done", data: {} });
      setTimeout(() => self.close(), 30);
      return;
    }

    /* ---------- eject from RAM (keep file) ---------- */
    if (cmd === "eject") {
      await releaseRuntime();
      post({ id, evt: "done", data: {} });
      return;
    }

    /* ---------- delete brain ---------- */
    if (cmd === "delete") {
      await releaseRuntime(); // live wasm holds OPFS handles; cold first
      const cm = new CacheManager();
      await cm.delete(payload.url).catch(() => {});
      const gone = await verifyGone(new CacheManager(), payload.url);
      if (!gone) await opfsSweep(baseName(payload.url));
      const verified = await verifyGone(new CacheManager(), payload.url);
      post({ id, evt: "done", data: { verified } });
      return;
    }

    /* ---------- clear everything ghost-related in storage ---------- */
    if (cmd === "clearAll") {
      await releaseRuntime();
      await opfsSweep(".gguf");
      const cm = new CacheManager();
      for (const url of payload.urls || []) await cm.delete(url).catch(() => {});
      post({ id, evt: "done", data: {} });
      return;
    }

    post({ id, evt: "error", message: `unknown command ${cmd}` });
  } catch (err) {
    const message = String(err?.message || err);
    post({
      id, evt: "error",
      message,
      name: err?.name || "Error",
      hint: message.includes("MODEL_CORRUPT")
        ? "brain file damaged — refetching a clean copy"
        : message.includes("MODEL_NOT_CACHED")
          ? "download the brain first"
          : "",
    });
    // Any inference failure leaves suspect state — recycle the runtime.
    if (cmd === "chat" || cmd === "load") await releaseRuntime();
  }
};
