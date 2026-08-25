// Ghost worker — wllama runtime with strict, verifiable storage ownership.
// All model bytes live under ONE CacheManager; delete verifies; OPFS sweep as fallback.
import { Wllama, CacheManager } from "https://cdn.jsdelivr.net/npm/@wllama/wllama@3.6.0/esm/index.min.js"

const WASM_URL = "https://cdn.jsdelivr.net/npm/@wllama/wllama@3.6.0/esm/wasm/wllama.wasm"

let wllama = null
let activeController = null

const post = msg => self.postMessage(msg)

function baseName(url) {
  try { return new URL(url).pathname.split("/").pop().toLowerCase() } catch { return "" }
}

async function releaseRuntime() {
  if (activeController) { try { activeController.abort() } catch {} }
  if (!wllama) return
  const w = wllama
  wllama = null
  try {
    await Promise.race([
      w.exit(),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ])
  } catch {}
}

async function opfsSweep(base) {
  // Fallback: remove any OPFS root entry whose name contains the gguf basename.
  try {
    const root = await navigator.storage.getDirectory()
    const names = []
    for await (const name of root.keys()) names.push(name)
    const lower = base.toLowerCase()
    for (const name of names) {
      if (lower && name.toLowerCase().includes(lower.split(".")[0])) {
        try { await root.removeEntry(name, { recurse: true }) } catch {}
      }
    }
  } catch {}
}

async function verifyGone(cm, url, base) {
  try {
    const name = await cm.getNameFromURL(url)
    const size = await cm.getSize(name)
    if (size >= 0) return false
  } catch {}
  // also check raw OPFS listing
  try {
    const root = await navigator.storage.getDirectory()
    const lowerBase = base.split(".")[0].toLowerCase()
    for await (const name of root.keys()) {
      if (name.toLowerCase().includes(lowerBase)) return false
    }
  } catch {}
  return true
}

async function cachedSize(url) {
  try {
    const cm = new CacheManager()
    const name = await cm.getNameFromURL(url)
    return await cm.getSize(name)
  } catch {
    return -1
  }
}

self.onmessage = async event => {
  const { id, cmd, payload } = event.data || {}
  try {
    if (cmd === "probe") {
      post({ id, evt: "ok", data: { webgpu: typeof navigator !== "undefined" && !!navigator.gpu } })
      return
    }

    if (cmd === "status") {
      post({ id, evt: "ok", data: { loaded: !!wllama } })
      return
    }

    if (cmd === "cached") {
      const size = await cachedSize(payload.url)
      post({ id, evt: "ok", data: { cached: size >= 0, size } })
      return
    }

    if (cmd === "download") {
      const cm = new CacheManager()
      activeController = new AbortController()
      await cm.download(payload.url, {
        progressCallback: ({ loaded, total }) => post({ id, evt: "progress", loaded, total }),
        signal: activeController.signal,
      })
      activeController = null
      const size = await cachedSize(payload.url)
      post({ id, evt: "ok", data: { done: true, size } })
      return
    }

    if (cmd === "load") {
      if (!wllama) {
        const cm = new CacheManager()
        const blob = await cm.open(payload.url)
        if (!blob || blob.size <= 0) {
          post({ id, evt: "error", message: "MODEL_NOT_CACHED", name: "GhostStorage", hint: "download the brain first" })
          return
        }
        wllama = new Wllama({ default: WASM_URL })
        await wllama.loadModel([blob], {
          n_ctx: payload.nCtx || 2048,
          jinja: true,
        })
      }
      post({ id, evt: "ok", data: { loaded: true } })
      return
    }

    if (cmd === "chat") {
      if (!wllama) throw new Error("model not loaded")
      activeController = new AbortController()
      const signal = activeController.signal
      const started = performance.now()
      let tokens = 0
      let text = ""
      let lastError = null

      const emitToken = piece => {
        if (!piece) return
        tokens += 1
        text += piece
        post({ id, evt: "token", piece })
      }

      // Render ChatML ourselves and use the low-level completion primitive.
      // This bypasses the chat-template machinery entirely — its mid-stream
      // failures were producing one-word replies, "$$" artifacts and hangs.
      const CHATML_STOP = ["<|im_end|>", "<|im_start|>"]
      const prompt = payload.messages
        .map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`)
        .join("\n") + "\n<|im_start|>assistant\n"
      const clean = s => String(s ?? "").replace(/<\|[a-z_]+\|>/g, "")
      const baseOpts = {
        prompt,
        max_tokens: Math.min(payload.maxTokens || 280, 280),
        temperature: payload.temperature ?? 0.35,
        top_p: 0.9,
        stop: CHATML_STOP,
        signal,
      }
      try {
        const stream = await wllama.createCompletion({
          ...baseOpts,
          stream: true,
        })
        if (stream && typeof stream[Symbol.asyncIterator] === "function") {
          for await (const chunk of stream) {
            if (signal.aborted) break
            emitToken(clean(chunk?.choices?.[0]?.delta?.content ?? chunk?.choices?.[0]?.text ?? ""))
          }
          const seconds = (performance.now() - started) / 1000
          post({ id, evt: signal.aborted ? "stopped" : "done", data: { text, tokens, tps: seconds > 0 ? tokens / seconds : 0 } })
          activeController = null
          return
        }
      } catch (err) {
        if (signal.aborted) {
          post({ id, evt: "stopped", data: { text, tokens, tps: 0 } })
          activeController = null
          return
        }
        lastError = err
      }

      try {
        const res = await wllama.createCompletion({ ...baseOpts })
        text =
          res?.choices?.[0]?.text ??
          res?.choices?.[0]?.message?.content ??
          (typeof res === "string" ? clean(res) : clean(text))
        tokens = Math.max(1, Math.round(text.length / 4))
        const seconds = (performance.now() - started) / 1000
        post({ id, evt: "done", data: { text, tokens, tps: seconds > 0 ? tokens / seconds : 0 } })
        activeController = null
        return
      } catch (err) {
        lastError = lastError ?? err
      }

      activeController = null
      const e = lastError || new Error("inference failed")
      post({ id, evt: "error", message: String(e?.message || e), name: e?.name || "", hint: "both stream and fallback calls failed" })
      return
    }

    if (cmd === "stop") {
      if (activeController) activeController.abort()
      post({ id, evt: "ok", data: { stopped: true } })
      return
    }

    if (cmd === "delete" || cmd === "eject") {
      const url = payload.url
      const base = baseName(url)
      await releaseRuntime()
      const cm = new CacheManager()
      let hardFailed = false
      try {
        await cm.delete(url)
      } catch {
        hardFailed = true
      }
      let gone = false
      try {
        gone = await verifyGone(cm, url, base)
      } catch {}
      if (!gone || hardFailed) {
        await opfsSweep(base)
        try {
          gone = await verifyGone(cm, url, base)
        } catch {}
      }
      post({ id, evt: "ok", data: { deleted: true, verified: gone } })
      return
    }

    post({ id, evt: "error", message: `unknown cmd ${cmd}` })
  } catch (err) {
    activeController = null
    post({
      id,
      evt: "error",
      message: String(err?.message || err),
      name: err?.name || "",
      hint: typeof err?.stack === "string" ? err.stack.split("\n")[1]?.trim().slice(0, 160) : "",
    })
  }
}
