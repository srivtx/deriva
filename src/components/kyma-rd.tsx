"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { KYMA_PRESETS } from "@/data/kyma"

const SIM = 256
const DA = 1.0
const DB = 0.5
const DT = 1.0

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const SIM_FRAG = `
precision highp float;
uniform sampler2D state;
uniform vec2 texel;
uniform float F, k;
void main(){
  vec2 uv = gl_FragCoord.xy * texel;
  vec4 c = texture2D(state, uv);
  vec2 lap =
    0.20 * (texture2D(state, uv + vec2(texel.x, 0.0)).rg + texture2D(state, uv - vec2(texel.x, 0.0)).rg
          + texture2D(state, uv + vec2(0.0, texel.y)).rg + texture2D(state, uv - vec2(0.0, texel.y)).rg)
    + 0.05 * (texture2D(state, uv + texel).rg + texture2D(state, uv - texel).rg
            + texture2D(state, uv + vec2(texel.x, -texel.y)).rg + texture2D(state, uv + vec2(-texel.x, texel.y)).rg)
    - c.rg;
  float A = c.r, B = c.g;
  float AB2 = A * B * B;
  float dA = ${DA.toFixed(1)} * lap.x - AB2 + F * (1.0 - A);
  float dB = ${DB.toFixed(1)} * lap.y + AB2 - (F + k) * B;
  gl_FragColor = vec4(clamp(A + ${DT.toFixed(1)} * dA, 0.0, 1.0), clamp(B + ${DT.toFixed(1)} * dB, 0.0, 1.0), 0.0, 1.0);
}`

// palettes: [background, mid, high] per colormap
const PALETTES: [number[], number[], number[]][] = [
  [[0.055, 0.075, 0.07], [0.36, 0.32, 0.55], [0.85, 0.78, 0.55]],
  [[0.05, 0.07, 0.075], [0.55, 0.30, 0.42], [0.98, 0.90, 0.72]],
  [[0.04, 0.06, 0.08], [0.20, 0.52, 0.62], [0.88, 0.96, 0.90]],
  [[0.07, 0.05, 0.04], [0.72, 0.42, 0.16], [0.99, 0.86, 0.60]],
]

const DRAW_FRAG = `
precision highp float;
uniform sampler2D state;
uniform vec2 view;
uniform int pal;
void main(){
  vec2 c = texture2D(state, gl_FragCoord.xy / view).rg;
  float v = smoothstep(0.12, 0.5, c.g);
  float edge = smoothstep(0.02, 0.14, c.g) * (1.0 - smoothstep(0.35, 0.75, c.g));
  vec3 bg; vec3 mid; vec3 hi;
  if (pal == 0) { bg = vec3(0.055, 0.075, 0.07); mid = vec3(0.36, 0.32, 0.55); hi = vec3(0.85, 0.78, 0.55); }
  else if (pal == 1) { bg = vec3(0.05, 0.07, 0.075); mid = vec3(0.55, 0.30, 0.42); hi = vec3(0.98, 0.90, 0.72); }
  else if (pal == 2) { bg = vec3(0.04, 0.06, 0.08); mid = vec3(0.20, 0.52, 0.62); hi = vec3(0.88, 0.96, 0.90); }
  else { bg = vec3(0.07, 0.05, 0.04); mid = vec3(0.72, 0.42, 0.16); hi = vec3(0.99, 0.86, 0.60); }
  vec3 col = bg;
  col = mix(col, mid, edge);
  col = mix(col, hi, v);
  gl_FragColor = vec4(col, 1.0);
}`

interface Props {
  initial?: { F: number; k: number }
  fkRef?: { current: { F: number; k: number } }
  mini?: boolean
}

const SEED_DOTS_NORM: [number, number][] = [[0.3125, 0.3125], [0.3125, 0.6875], [0.6875, 0.3125], [0.6875, 0.6875], [0.5, 0.5]]

function initialState(): Float32Array {
  const data = new Float32Array(SIM * SIM * 4)
  for (let i = 0; i < SIM * SIM; i++) data[i * 4] = 1
  const rad = Math.max(2, Math.round(SIM / 64))
  for (const [ny, nx] of SEED_DOTS_NORM) {
    const y = Math.round(ny * SIM), x = Math.round(nx * SIM)
    for (let dy = -rad; dy <= rad; dy++)
      for (let dx = -rad; dx <= rad; dx++) {
        const i = ((y + dy) * SIM + (x + dx)) * 4
        data[i] = 0.4; data[i + 1] = 0.9
      }
  }
  return data
}

const f32buf = new Float32Array(1)
const i32buf = new Int32Array(f32buf.buffer)
function toHalf(val: number): number {
  f32buf[0] = val
  const x = i32buf[0]
  let bits = (x >> 16) & 0x8000
  let m = (x >> 12) & 0x07ff
  const e = (x >> 23) & 0xff
  if (e < 103) return bits
  if (e > 142) return bits | 0x7c00
  if (e < 113) { m |= 0x0800; bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1); return bits }
  bits |= ((e - 112) << 10) | (m >> 1)
  bits += m & 1
  return bits
}

function asHalfPixels(data: Float32Array): Uint16Array {
  const out = new Uint16Array(data.length)
  for (let i = 0; i < data.length; i++) out[i] = toHalf(data[i])
  return out
}

const PALETTE_NAMES = ["Ember", "Rose", "Tide", "Dune"]

export default function KymaRD({ initial, fkRef, mini = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [F, setF] = useState(initial?.F ?? 0.0545)
  const [k, setK] = useState(initial?.k ?? 0.062)
  const [speed, setSpeed] = useState(8)
  const [paused, setPaused] = useState(false)
  const [palette, setPalette] = useState(0)
  const [brush, setBrush] = useState(4)
  const [substance, setSubstance] = useState<"seed" | "clear">("seed")
  const [engine, setEngine] = useState<"webgl2" | "cpu" | "">("")
  const [steps, setSteps] = useState(0)
  const [fs, setFs] = useState(false)
  const paramsRef = useRef({ F, k, speed, paused, palette, brush, substance })
  paramsRef.current = { F, k, speed, paused, palette, brush, substance }
  if (fkRef) { fkRef.current.F = F; fkRef.current.k = k }
  const reseedRef = useRef<() => void>(() => {})
  const stepOnceRef = useRef<() => void>(() => {})
  const stepsRef = useRef(0)
  const visibleRef = useRef(true)

  const toggleFs = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.().catch(() => {})
  }, [])

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  const applyPreset = (p: { F: number; k: number }) => { setF(p.F); setK(p.k) }

  const clickAtlas = (ev: React.MouseEvent<HTMLDivElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect()
    const fx = (ev.clientX - rect.left) / rect.width
    const fy = (ev.clientY - rect.top) / rect.height
    setF(+(0.01 + fx * 0.08).toFixed(4))
    setK(+(0.075 - fy * 0.045).toFixed(4))
  }

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    let destroyed = false
    let raf = 0
    const cleanups: (() => void)[] = []
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const gl2 = canvas.getContext("webgl2", { preserveDrawingBuffer: true })
    const floatOK = gl2?.getExtension("EXT_color_buffer_float")

    if (gl2 && floatOK) {
      setEngine("webgl2")
      const gl = gl2
      const compile = (type: number, src: string) => {
        const sh = gl.createShader(type)!
        gl.shaderSource(sh, src); gl.compileShader(sh)
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
          console.error("KYMA shader compile:", gl.getShaderInfoLog(sh), src.slice(0, 200))
        return sh
      }
      const makeProg = (frag: string) => {
        const prog = gl.createProgram()!
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
          console.error("KYMA shader link:", gl.getProgramInfoLog(prog))
        return prog
      }
      const simProg = makeProg(SIM_FRAG)
      const drawProg = makeProg(DRAW_FRAG)
      const quad = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, quad)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
      const bindQuad = (prog: WebGLProgram) => {
        const loc = gl.getAttribLocation(prog, "p")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
      }

      let front = gl.createTexture()!
      let back = gl.createTexture()!
      let fboFront = gl.createFramebuffer()!
      let fboBack = gl.createFramebuffer()!
      const setupTex = (tex: WebGLTexture) => {
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SIM, SIM, 0, gl.RGBA, gl.HALF_FLOAT, null)
      }
      const uploadState = (tex: WebGLTexture, data: Float32Array) => {
        gl.bindTexture(gl.TEXTURE_2D, tex)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SIM, SIM, gl.RGBA, gl.HALF_FLOAT, asHalfPixels(data))
      }
      setupTex(front)
      setupTex(back)
      uploadState(back, initialState())
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboFront)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, front, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboBack)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, back, 0)

      const reseed = () => {
        uploadState(back, initialState())
        stepsRef.current = 0
        lastStepsShown = 0
      }
      reseedRef.current = reseed
      cleanups.push(() => { gl.getExtension("WEBGL_lose_context")?.loseContext() })

      let W = 0, H = 0
      const resize = () => {
        const r = canvas.getBoundingClientRect()
        W = Math.max(1, Math.round(r.width))
        H = Math.max(1, Math.round(r.height))
        canvas.width = Math.round(W * dpr)
        canvas.height = Math.round(H * dpr)
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)
      const io = new IntersectionObserver(entries => {
        visibleRef.current = entries[0].isIntersecting
        canvas.dataset.kymaVisible = String(entries[0].isIntersecting)
      }, { threshold: 0.02 })
      io.observe(wrap)
      cleanups.push(() => { ro.disconnect(); io.disconnect() })

      const paint = (clientX: number, clientY: number) => {
        const rect = canvas.getBoundingClientRect()
        const tx = Math.floor(((clientX - rect.left) / rect.width) * SIM)
        const ty = Math.floor((1 - (clientY - rect.top) / rect.height) * SIM)
        const { brush: br, substance: sub } = paramsRef.current
        const rad = Math.max(2, Math.round(br))
        const x0 = Math.max(0, Math.min(SIM - rad * 2, tx - rad))
        const y0 = Math.max(0, Math.min(SIM - rad * 2, ty - rad))
        const patch = new Float32Array(rad * 2 * rad * 2 * 4)
        for (let i = 0; i < patch.length; i += 4) {
          if (sub === "seed") { patch[i] = 0.5; patch[i + 1] = 0.9 }
          else { patch[i] = 1.0; patch[i + 1] = 0.0 }
        }
        gl.bindTexture(gl.TEXTURE_2D, front)
        gl.texSubImage2D(gl.TEXTURE_2D, 0, x0, y0, rad * 2, rad * 2, gl.RGBA, gl.HALF_FLOAT, asHalfPixels(patch))
      }
      const onPointer = (ev: PointerEvent) => { if (ev.buttons > 0) paint(ev.clientX, ev.clientY) }
      canvas.addEventListener("pointermove", onPointer)
      canvas.addEventListener("pointerdown", onPointer)
      cleanups.push(() => {
        canvas.removeEventListener("pointermove", onPointer)
        canvas.removeEventListener("pointerdown", onPointer)
      })

      const runSim = (sp: number) => {
        const { F: f, k: kk } = paramsRef.current
        gl.useProgram(simProg); bindQuad(simProg)
        gl.uniform1i(gl.getUniformLocation(simProg, "state"), 0)
        gl.uniform2f(gl.getUniformLocation(simProg, "texel"), 1 / SIM, 1 / SIM)
        gl.uniform1f(gl.getUniformLocation(simProg, "F"), f)
        gl.uniform1f(gl.getUniformLocation(simProg, "k"), kk)
        gl.activeTexture(gl.TEXTURE0)
        for (let s = 0; s < sp; s++) {
          gl.bindFramebuffer(gl.FRAMEBUFFER, fboFront)
          gl.viewport(0, 0, SIM, SIM)
          gl.bindTexture(gl.TEXTURE_2D, back)
          gl.drawArrays(gl.TRIANGLES, 0, 3)
          const t = front; front = back; back = t
          const fb = fboFront; fboFront = fboBack; fboBack = fb
            stepsRef.current++
          }
          if (stepsRef.current % 60 === 0) setSteps(stepsRef.current)
        }
      stepOnceRef.current = () => {
        runSim(1)
        lastStepsShown = stepsRef.current
        setSteps(stepsRef.current)
      }

      const render = () => {
        const { palette: pal } = paramsRef.current
        gl.useProgram(drawProg); bindQuad(drawProg)
        gl.uniform1i(gl.getUniformLocation(drawProg, "state"), 0)
        gl.uniform2f(gl.getUniformLocation(drawProg, "view"), canvas.width, canvas.height)
        gl.uniform1i(gl.getUniformLocation(drawProg, "pal"), pal)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.bindTexture(gl.TEXTURE_2D, front)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }

      let lastStepsShown = 0
      const frame = () => {
        if (destroyed) return
        raf = requestAnimationFrame(frame)
        try {
          const { speed: sp, paused: ps } = paramsRef.current
          if (visibleRef.current) {
          if (!ps) {
            runSim(mini ? Math.min(sp, 4) : sp)
            if (stepsRef.current - lastStepsShown >= 60) {
              lastStepsShown = stepsRef.current
              setSteps(stepsRef.current)
            }
          } else if (stepsRef.current !== lastStepsShown) {
              lastStepsShown = stepsRef.current
              setSteps(stepsRef.current)
            }
            render()
          }
        } catch (e) {
          console.error("KYMA rd frame:", e)
        }
      }
      frame()
    } else {
      setEngine("cpu")
      const ctx2d = canvas.getContext("2d")
      if (!ctx2d) return
      const CN = 128
      const A = new Float32Array(CN * CN).fill(1)
      const B = new Float32Array(CN * CN)
      const reseedCPU = () => {
        A.fill(1); B.fill(0)
        stepsRef.current = 0
        for (const [ny, nx] of SEED_DOTS_NORM) {
          const y0 = Math.round(ny * CN), x0 = Math.round(nx * CN)
          const r = Math.max(2, Math.round(CN / 64))
          for (let dy = -r; dy <= r; dy++)
            for (let dx = -r; dx <= r; dx++) {
              const i = (y0 + dy) * CN + (x0 + dx)
              A[i] = 0.4; B[i] = 0.9
            }
        }
      }
      reseedRef.current = reseedCPU
      const off = document.createElement("canvas")
      off.width = CN; off.height = CN
      const offCtx = off.getContext("2d")!
      const img = offCtx.createImageData(CN, CN)
      const palRGB = (v: number): [number, number, number] => {
        const [bg, mid, hi] = PALETTES[paramsRef.current.palette] as [[number, number, number], [number, number, number], [number, number, number]]
        const t = v < 0.12 ? 0 : v > 0.5 ? 1 : (v - 0.12) / 0.38
        const e = v < 0.02 ? 0 : v < 0.14 ? (v - 0.02) / 0.12 : v > 0.75 ? 0 : v > 0.35 ? (0.75 - v) / 0.4 : 1
        const mixv = (a: number[], b: number[], u: number) => a.map((x, i) => x + (b[i] - x) * u) as number[]
        const c1 = mixv(bg, mid, e), c2 = mixv(c1, hi, t)
        return [c2[0], c2[1], c2[2]]
      }
      const lap = (Z: Float32Array, out: Float32Array) => {
        for (let y = 0; y < CN; y++) {
          const yn = ((y + 1) % CN) * CN, yp = ((y - 1 + CN) % CN) * CN, y0 = y * CN
          for (let x = 0; x < CN; x++) {
            const xn = (x + 1) % CN, xp = (x - 1 + CN) % CN
            out[y0 + x] =
              0.2 * (Z[y0 + xn] + Z[y0 + xp] + Z[yn + x] + Z[yp + x]) +
              0.05 * (Z[yn + xn] + Z[yn + xp] + Z[yp + xn] + Z[yp + xp]) - Z[y0 + x]
          }
        }
      }
      const dA = new Float32Array(CN * CN)
      const dB = new Float32Array(CN * CN)
      let W = 0, H = 0
      const resize = () => {
        const r = canvas.getBoundingClientRect()
        W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height))
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
      }
      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)
      const io = new IntersectionObserver(entries => {
        visibleRef.current = entries[0].isIntersecting
        canvas.dataset.kymaVisible = String(entries[0].isIntersecting)
      }, { threshold: 0.02 })
      io.observe(wrap)
      const frame = () => {
        if (destroyed) return
        if (visibleRef.current) {
          const { F: f, k: kk, speed: sp, paused: ps } = paramsRef.current
          if (!ps) {
            for (let s = 0; s < Math.min(sp, 3); s++) {
              lap(A, dA); lap(B, dB)
              for (let i = 0; i < A.length; i++) {
                const ab2 = A[i] * B[i] * B[i]
                A[i] = Math.min(1, Math.max(0, A[i] + DT * (DA * dA[i] - ab2 + f * (1 - A[i]))))
                B[i] = Math.min(1, Math.max(0, B[i] + DT * (DB * dB[i] + ab2 - (f + kk) * B[i])))
              }
              stepsRef.current++
            }
          }
          for (let i = 0; i < B.length; i++) {
            const [r, g, b] = palRGB(B[i])
            img.data[i * 4] = Math.round(r * 255)
            img.data[i * 4 + 1] = Math.round(g * 255)
            img.data[i * 4 + 2] = Math.round(b * 255)
            img.data[i * 4 + 3] = 255
          }
          offCtx.putImageData(img, 0, 0)
          ctx2d.imageSmoothingEnabled = true
          ctx2d.drawImage(off, 0, 0, canvas.width, canvas.height)
        }
        raf = requestAnimationFrame(frame)
      }
      frame()
    }

    return () => {
      destroyed = true
      cancelAnimationFrame(raf)
      for (const c of cleanups) c()
    }
  }, [mini])

  const atlasPos = {
    left: `${((F - 0.01) / 0.08) * 100}%`,
    top: `${(1 - (k - 0.03) / 0.045) * 100}%`,
  }

  return (
    <div className="kyma-rd">
      <div ref={wrapRef} className={`kyma-canvas-wrap${fs ? " kyma-fs" : ""}`} style={{ aspectRatio: fs ? undefined : "1 / 1" }}>
        <canvas ref={canvasRef} className="kyma-canvas kyma-rd-canvas" aria-label="Gray-Scott reaction-diffusion simulation" />
        {!mini && (
          <div className="kyma-hud">
            <span className="kyma-chip">F {F.toFixed(4)} · k {k.toFixed(4)}</span>
            <span className="kyma-chip">{steps.toLocaleString()} steps</span>
            {paused && <span className="kyma-chip kyma-chip-warn">paused</span>}
          </div>
        )}
        {!mini && (
          <button type="button" className="kyma-fs-btn" onClick={toggleFs} aria-label={fs ? "Exit full screen" : "Full screen"}>
            {fs ? "⤡ exit" : "⛶ full"}
          </button>
        )}
      </div>

      {!mini && (
        <>
          <div className="kyma-atlas-row">
            <div className="kyma-atlas" onClick={clickAtlas} title="Click the map to set the chemistry"
              role="button" tabIndex={0} aria-label="Feed-kill parameter atlas">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/kyma/atlas.png" alt="Gray-Scott pattern atlas: alive regions of the feed-kill plane" draggable={false} />
              <span className="kyma-atlas-marker" style={atlasPos} />
              {KYMA_PRESETS.map(p => (
                <span key={p.name} className="kyma-atlas-dot" title={p.name}
                  style={{ left: `${((p.F - 0.01) / 0.08) * 100}%`, top: `${(1 - (p.k - 0.03) / 0.045) * 100}%` }} />
              ))}
            </div>
            <span className="kyma-atlas-axis kyma-atlas-axis-x">feed F &rarr;</span>
            <span className="kyma-atlas-axis kyma-atlas-axis-y">kill k &uarr;</span>
            <p className="kyma-atlas-note">The atlas: bright regions are chemistries where a pattern survives (computed on a coarse grid — your live dish is the ground truth). Click anywhere to steer there. Dots mark the presets.</p>
          </div>

          <div className="kyma-seg-row">
            <div className="kyma-seg">
              <button type="button" className={substance === "seed" ? "on" : ""} onClick={() => setSubstance("seed")}>Seed</button>
              <button type="button" className={substance === "clear" ? "on" : ""} onClick={() => setSubstance("clear")}>Clear</button>
            </div>
            <div className="kyma-seg">
              <button type="button" className={!paused ? "on" : ""} onClick={() => setPaused(false)}>&#9654; Run</button>
              <button type="button" className={paused ? "on" : ""} onClick={() => setPaused(true)}>&#10073;&#10073; Pause</button>
              <button type="button" onClick={() => stepOnceRef.current()}>Step</button>
            </div>
          </div>

          <div className="kyma-presets-row">
            <div className="kyma-presets">
              {KYMA_PRESETS.map(p => (
                <button key={p.name} type="button" className="btn btn-sm" onClick={() => applyPreset(p)}
                  title={p.note}>{p.name}</button>
              ))}
              <button type="button" className="btn btn-sm" onClick={() => reseedRef.current()}>Reseed</button>
            </div>
            <div className="kyma-presets">
              {PALETTE_NAMES.map((nm, i) => (
                <button key={nm} type="button" className={`btn btn-sm${palette === i ? " btn-accent" : ""}`}
                  onClick={() => setPalette(i)}>{nm}</button>
              ))}
            </div>
          </div>

          <div className="kyma-ctl-grid">
            <label className="kyma-ctl">
              <span>feed F <b>{F.toFixed(4)}</b></span>
              <input type="range" min={0.01} max={0.09} step={0.0005} value={F}
                onChange={e => setF(Number(e.target.value))} />
            </label>
            <label className="kyma-ctl">
              <span>kill k <b>{k.toFixed(4)}</b></span>
              <input type="range" min={0.03} max={0.075} step={0.0005} value={k}
                onChange={e => setK(Number(e.target.value))} />
            </label>
            <label className="kyma-ctl">
              <span>brush <b>{brush}</b></span>
              <input type="range" min={2} max={14} step={1} value={brush}
                onChange={e => setBrush(Number(e.target.value))} />
            </label>
            <label className="kyma-ctl">
              <span>speed <b>{speed}&times;</b></span>
              <input type="range" min={1} max={16} step={1} value={speed}
                onChange={e => setSpeed(Number(e.target.value))} />
            </label>
          </div>
          <span className="kyma-engine">{engine === "cpu" ? "CPU fallback engine" : "GPU engine · drag on the dish to paint"}</span>
          <p className="kyma-hint">F = how much food drops in each tick · k = how fast the pattern drains away · their balance picks the pattern — the atlas is the map of that balance · brush paints (Seed) or wipes (Clear) colonies</p>
        </>
      )}

      {mini && (
        <div className="kyma-ctl-grid">
          <label className="kyma-ctl">
            <span>feed F <b>{F.toFixed(4)}</b></span>
            <input type="range" min={0.01} max={0.09} step={0.0005} value={F}
              onChange={e => setF(Number(e.target.value))} />
          </label>
          <label className="kyma-ctl">
            <span>kill k <b>{k.toFixed(4)}</b></span>
            <input type="range" min={0.03} max={0.075} step={0.0005} value={k}
              onChange={e => setK(Number(e.target.value))} />
          </label>
        </div>
      )}
    </div>
  )
}
