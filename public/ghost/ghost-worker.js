// Ghost worker — runs wllama (llama.cpp→WASM) off the main thread.
// Loaded lazily from /ghost/ghost-worker.js only when the user opts in.
import { Wllama, CacheManager } from "https://cdn.jsdelivr.net/npm/@wllama/wllama@3.6.0/esm/index.min.js"

const WASM_URL = "https://cdn.jsdelivr.net/npm/@wllama/wllama@3.6.0/esm/wasm/wllama.wasm"

let wllama = null
let activeController = null

const post = msg => self.postMessage(msg)

async function cachedSize(url) {
  try {
    const cm = new CacheManager()
    const name = await cm.getNameFromURL(url)
    const size = await cm.getSize(name)
    return size
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
      post({ id, evt: "ok", data: { done: true } })
      return
    }

    if (cmd === "load") {
      if (!wllama) {
        wllama = new Wllama({ default: WASM_URL })
        activeController = new AbortController()
        await wllama.loadModelFromUrl(payload.url, {
          n_ctx: payload.nCtx || 2048,
          jinja: true,
          progressCallback: ({ loaded, total }) => post({ id, evt: "progress", loaded, total }),
        })
        activeController = null
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

      const emitToken = piece => {
        if (!piece) return
        tokens += 1
        text += piece
        post({ id, evt: "token", piece })
      }

      let streamed = false
      try {
        const stream = await wllama.createChatCompletion({
          messages: payload.messages,
          max_tokens: payload.maxTokens || 320,
          temperature: payload.temperature ?? 0.7,
          stream: true,
          signal,
        })
        if (stream && typeof stream[Symbol.asyncIterator] === "function") {
          for await (const chunk of stream) {
            if (signal.aborted) break
            emitToken(chunk?.choices?.[0]?.delta?.content ?? "")
          }
          streamed = true
        }
      } catch (err) {
        if (signal.aborted) {
          // fall through — treated as stop
        } else {
          throw err
        }
      }

      if (!streamed && !signal.aborted) {
        const res = await wllama.createChatCompletion({
          messages: payload.messages,
          max_tokens: payload.maxTokens || 320,
          temperature: payload.temperature ?? 0.7,
          signal,
        })
        text = res?.choices?.[0]?.message?.content ?? ""
        tokens = Math.max(1, Math.round(text.length / 4))
      }

      const seconds = (performance.now() - started) / 1000
      const aborted = signal.aborted
      activeController = null
      post({
        id,
        evt: aborted ? "stopped" : "done",
        data: { text, tokens, tps: seconds > 0 ? tokens / seconds : 0 },
      })
      return
    }

    if (cmd === "stop") {
      if (activeController) activeController.abort()
      post({ id, evt: "ok", data: { stopped: true } })
      return
    }

    if (cmd === "eject") {
      try { if (wllama) await wllama.exit() } catch {}
      wllama = null
      try {
        const cm = new CacheManager()
        await cm.delete(payload.url)
      } catch {}
      post({ id, evt: "ok", data: { ejected: true } })
      return
    }

    post({ id, evt: "error", message: `unknown cmd ${cmd}` })
  } catch (err) {
    activeController = null
    post({ id, evt: "error", message: String(err?.message || err) })
  }
}
