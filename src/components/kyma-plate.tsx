"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { KymaTarget } from "@/data/kyma"

const C = 64

// alpha_{m,n}: the n-th zero of J_m, m = 0..6, n = 1..5 (precomputed via series + bisection)
const ALPHA: number[][] = [
  [2.4048, 5.5201, 8.6537, 11.7915, 14.9309],
  [3.8317, 7.0156, 10.1735, 13.3237, 16.4706],
  [5.1356, 8.4172, 11.6198, 14.7960, 17.9598],
  [6.3802, 9.7610, 13.0152, 16.2234, 19.4094],
  [7.5883, 11.0647, 14.3725, 17.6160, 20.8269],
  [8.7715, 12.3386, 15.7002, 18.9801, 22.2178],
  [9.9361, 13.5893, 17.0038, 20.3208, 23.5861],
]

function besselJ(m: number, z: number): number {
  // series J_m(z) — fine for z <= ~24 in float64
  let term = 1
  for (let s = 1; s <= m; s++) term *= z / (2 * s)
  let sum = term
  for (let s = 1; s <= 30; s++) {
    term *= -1 * (z * z) / (4 * s * (s + m))
    sum += term
    if (Math.abs(term) < 1e-12) break
  }
  return sum
}

type Shape = "square" | "circle"

function fieldSquare(x: number, y: number, m: number, n: number, mix: number): number {
  const cmx = Math.cos(Math.PI * m * x)
  const cmy = Math.cos(Math.PI * m * y)
  const cnx = Math.cos(Math.PI * n * x)
  const cny = Math.cos(Math.PI * n * y)
  return mix * cnx * cmy + (1 - mix) * cmx * cny
}

function fieldCircle(x: number, y: number, m: number, n: number): number {
  const dx = x - 0.5, dy = y - 0.5
  const r = Math.sqrt(dx * dx + dy * dy) * 2
  const th = Math.atan2(dy, dx)
  const k = (ALPHA[m] && ALPHA[m][n - 1]) || 2.4048
  return besselJ(m, k * r) * Math.cos(m * th) * (r <= 1 ? 1 : 0)
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
precision highp float;
uniform vec2 res;
uniform float um, un, umix, showT, uCircle, uGlow;
uniform vec3 tgt;
float bessel(int m, float z){
  float z2 = z * z * 0.25;
  float term = 1.0;
  for (int i = 1; i <= 6; i++) {
    if (float(i) <= float(m) + 0.5) term *= z / (2.0 * float(i));
  }
  float sum = term;
  for (int s = 1; s <= 24; s++) {
    term *= -z2 / (float(s) * float(s + m));
    sum += term;
  }
  return sum;
}
float alphaOf(int m, int n){
  // alpha_{m,n} table, m 0..6, n 1..5
  if (m == 0) { if (n == 1) return 2.4048; if (n == 2) return 5.5201; if (n == 3) return 8.6537; if (n == 4) return 11.7915; return 14.9309; }
  if (m == 1) { if (n == 1) return 3.8317; if (n == 2) return 7.0156; if (n == 3) return 10.1735; if (n == 4) return 13.3237; return 16.4706; }
  if (m == 2) { if (n == 1) return 5.1356; if (n == 2) return 8.4172; if (n == 3) return 11.6198; if (n == 4) return 14.7960; return 17.9598; }
  if (m == 3) { if (n == 1) return 6.3802; if (n == 2) return 9.7610; if (n == 3) return 13.0152; if (n == 4) return 16.2234; return 19.4094; }
  if (m == 4) { if (n == 1) return 7.5883; if (n == 2) return 11.0647; if (n == 3) return 14.3725; if (n == 4) return 17.6160; return 20.8269; }
  if (m == 5) { if (n == 1) return 8.7715; if (n == 2) return 12.3386; if (n == 3) return 15.7002; if (n == 4) return 18.9801; return 22.2178; }
  if (n == 1) return 9.9361; if (n == 2) return 13.5893; if (n == 3) return 17.0038; if (n == 4) return 20.3208; return 23.5861;
}
float fieldOf(vec2 q, float m, float n, float a, float circle){
  if (circle > 0.5) {
    vec2 d = q - 0.5;
    float r = length(d) * 2.0;
    float th = atan(d.y, d.x);
    int mi = int(m + 0.5);
    int ni = int(clamp(n + 0.5, 1.0, 5.0));
    float k = alphaOf(mi, ni);
    return bessel(mi, k * r) * cos(m * th) * step(r, 1.0);
  }
  return a * cos(3.14159265 * n * q.x) * cos(3.14159265 * m * q.y)
       + (1.0 - a) * cos(3.14159265 * m * q.x) * cos(3.14159265 * n * q.y);
}
void main(){
  vec2 q = gl_FragCoord.xy / res;
  float f = fieldOf(q, um, un, umix, uCircle);
  float g = abs(f);
  float node = 1.0 - smoothstep(0.0, 0.045, g);
  float halo = exp(-g * 7.0) * uGlow;
  vec3 col = vec3(0.045, 0.062, 0.058);
  col += halo * vec3(0.30, 0.52, 0.44);
  col += node * vec3(0.93, 0.88, 0.70);
  if (uCircle > 0.5) {
    float rr = length(q - 0.5) * 2.0;
    float rim = smoothstep(0.985, 1.0, rr);
    col = mix(col, vec3(0.16, 0.20, 0.18), rim * (1.0 - step(1.005, rr)));
    col *= 1.0 - step(1.005, rr) * 0.0;
    if (rr > 1.005) col = vec3(0.032, 0.045, 0.042);
  }
  float vig = 1.0 - 0.35 * dot(q - 0.5, q - 0.5) * 2.2;
  col *= vig;
  if (showT > 0.5) {
    float ft = fieldOf(q, tgt.x, tgt.y, tgt.z, uCircle);
    float nt = 1.0 - smoothstep(0.0, 0.06, abs(ft));
    col = mix(col, vec3(0.30, 0.72, 0.50), nt * 0.5);
  }
  gl_FragColor = vec4(col, 1.0);
}`

interface Props {
  initial?: { m: number; n: number; mix: number }
  target?: KymaTarget
  paramsRef?: { current: { m: number; n: number; mix: number } }
  mini?: boolean
}

const SQUARE_PRESETS: { name: string; m: number; n: number; mix: number }[] = [
  { name: "Twin", m: 1, n: 1, mix: 0 },
  { name: "Weave", m: 2, n: 3, mix: 0 },
  { name: "Lattice", m: 2, n: 2, mix: 0 },
  { name: "Diagonal", m: 1, n: 4, mix: 1 },
  { name: "Drapery", m: 3, n: 4, mix: 0 },
  { name: "Filigree", m: 5, n: 5, mix: 0 },
]

const CIRCLE_PRESETS: { name: string; m: number; n: number; mix: number }[] = [
  { name: "Ring", m: 0, n: 1, mix: 0 },
  { name: "Halo", m: 0, n: 3, mix: 0 },
  { name: "Star", m: 3, n: 1, mix: 0 },
  { name: "Daisy", m: 5, n: 1, mix: 0 },
  { name: "Mandala", m: 4, n: 2, mix: 0 },
  { name: "Rose", m: 6, n: 3, mix: 0 },
]

export default function KymaPlate({ initial, target, paramsRef, mini = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const glCanvasRef = useRef<HTMLCanvasElement>(null)
  const sandCanvasRef = useRef<HTMLCanvasElement>(null)
  const [shape, setShape] = useState<Shape>("square")
  const [m, setM] = useState(initial?.m ?? 2)
  const [n, setN] = useState(initial?.n ?? 2)
  const [mix, setMix] = useState(initial?.mix ?? 0)
  const [agitation, setAgitation] = useState(0.35)
  const [glow, setGlow] = useState(0.3)
  const [toneOn, setToneOn] = useState(false)
  const [freq, setFreq] = useState(0)
  const simRef = useRef({ m, n, mix, agitation, glow, shape })
  const audioRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null)
  const pourRef = useRef<{ x: number; y: number } | null>(null)

  simRef.current = { m, n, mix, agitation, glow, shape }
  if (paramsRef) { paramsRef.current.m = m; paramsRef.current.n = n; paramsRef.current.mix = mix }

  const circle = shape === "circle"
  const displayedFreq = circle
    ? Math.round(8 * (m + 2 * n) ** 2)
    : Math.round(C * Math.sqrt(m * m + n * n) * 10) / 10

  useEffect(() => { setFreq(displayedFreq) }, [displayedFreq])

  const toggleTone = useCallback(() => {
    if (toneOn) {
      const a = audioRef.current
      if (a) { a.osc.stop(); a.ctx.close(); audioRef.current = null }
      setToneOn(false)
      return
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = displayedFreq
    gain.gain.value = 0.05
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start()
    audioRef.current = { ctx, osc, gain }
    setToneOn(true)
  }, [toneOn, displayedFreq])

  useEffect(() => {
    const a = audioRef.current
    if (a && toneOn) a.osc.frequency.setTargetAtTime(displayedFreq, a.ctx.currentTime, 0.04)
  }, [displayedFreq, toneOn])

  const scatterSand = useCallback(() => {
    const sand = sandCanvasRef.current
    if (!sand) return
    sand.dispatchEvent(new CustomEvent("kyma-scatter"))
  }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    const glCanvas = glCanvasRef.current
    const sandCanvas = sandCanvasRef.current
    if (!wrap || !glCanvas || !sandCanvas) return

    let destroyed = false
    const gl = glCanvas.getContext("webgl", { antialias: false, preserveDrawingBuffer: true })
    const sand = sandCanvas.getContext("2d")
    if (!gl || !sand) return

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!
      gl.shaderSource(sh, src); gl.compileShader(sh)
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
        console.error("KYMA plate shader:", gl.getShaderInfoLog(sh))
      return sh
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "p")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, "res")
    const uM = gl.getUniformLocation(prog, "um")
    const uN = gl.getUniformLocation(prog, "un")
    const uMix = gl.getUniformLocation(prog, "umix")
    const uShowT = gl.getUniformLocation(prog, "showT")
    const uTgt = gl.getUniformLocation(prog, "tgt")
    const uCircle = gl.getUniformLocation(prog, "uCircle")
    const uGlow = gl.getUniformLocation(prog, "uGlow")

    const N = mini ? 2200 : 4200
    const px = new Float32Array(N)
    const py = new Float32Array(N)
    const vx = new Float32Array(N)
    const vy = new Float32Array(N)
    const reset = (i: number) => { px[i] = Math.random(); py[i] = Math.random() }
    for (let i = 0; i < N; i++) reset(i)

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let W = 0, H = 0
    const resize = () => {
      const r = wrap.getBoundingClientRect()
      W = Math.max(1, Math.round(r.width))
      H = Math.max(1, Math.round(r.height))
      glCanvas.width = Math.round(W * dpr); glCanvas.height = Math.round(H * dpr)
      sandCanvas.width = Math.round(W * dpr); sandCanvas.height = Math.round(H * dpr)
      gl.viewport(0, 0, glCanvas.width, glCanvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const fieldAt = (x: number, y: number, sm: number, sn: number, smix: number, circ: boolean) =>
      circ ? fieldCircle(x, y, Math.round(sm) % 7, Math.max(1, Math.min(5, Math.round(sn))))
           : fieldSquare(x, y, sm, sn, smix)

    const scatter = () => { for (let i = 0; i < N; i++) reset(i) }
    const onScatter = () => scatter()
    sandCanvas.addEventListener("kyma-scatter", onScatter as EventListener)

    let raf = 0
    const frame = () => {
      if (destroyed) return
      const s = simRef.current
      const circ = s.shape === "circle"
      const sm = circ ? Math.round(s.m) % 7 : s.m
      const sn = circ ? Math.max(1, Math.min(5, Math.round(s.n))) : s.n

      gl.uniform2f(uRes, glCanvas.width, glCanvas.height)
      gl.uniform1f(uM, sm); gl.uniform1f(uN, sn); gl.uniform1f(uMix, circ ? 0 : s.mix)
      gl.uniform1f(uCircle, circ ? 1 : 0)
      gl.uniform1f(uGlow, 0.12 + s.glow)
      if (target) { gl.uniform1f(uShowT, 1); gl.uniform3f(uTgt, target.m, target.n, target.mix) }
      else gl.uniform1f(uShowT, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      const jit = 0.05 * (0.3 + 0.7 * s.agitation)
      const G = 0.006
      sand.setTransform(dpr, 0, 0, dpr, 0, 0)
      sand.clearRect(0, 0, W, H)
      sand.fillStyle = "rgba(236, 226, 190, 0.6)"
      for (let i = 0; i < N; i++) {
        let x = px[i], y = py[i]
        if (circ) {
          const dx = x - 0.5, dy = y - 0.5
          if (dx * dx + dy * dy > 0.25) { reset(i); x = px[i]; y = py[i] }
        }
        const f = fieldAt(x, y, sm, sn, circ ? 0 : s.mix, circ)
        const e = 0.004
        const fx = (fieldAt(x + e, y, sm, sn, circ ? 0 : s.mix, circ) - f) / e
        const fy = (fieldAt(x, y + e, sm, sn, circ ? 0 : s.mix, circ) - f) / e
        vx[i] = (vx[i] - f * fx * G) * 0.8 + (Math.random() - 0.5) * jit * Math.abs(f)
        vy[i] = (vy[i] - f * fy * G) * 0.8 + (Math.random() - 0.5) * jit * Math.abs(f)
        if (vx[i] > 0.02) vx[i] = 0.02; else if (vx[i] < -0.02) vx[i] = -0.02
        if (vy[i] > 0.02) vy[i] = 0.02; else if (vy[i] < -0.02) vy[i] = -0.02
        x += vx[i]; y += vy[i]
        if (x < 0) x += 1; if (x > 1) x -= 1
        if (y < 0) y += 1; if (y > 1) y -= 1
        px[i] = x; py[i] = y
        sand.fillRect(x * W - 0.8, y * H - 0.8, 1.6, 1.6)
      }
      if (pourRef.current) {
        const { x: cx, y: cy } = pourRef.current
        pourRef.current = null
        for (let i = 0; i < 90; i++) {
          const j = (Math.random() * N) | 0
          px[j] = cx + (Math.random() - 0.5) * 0.05
          py[j] = cy + (Math.random() - 0.5) * 0.05
          vx[j] = 0; vy[j] = 0
        }
      }
      raf = requestAnimationFrame(frame)
    }
    frame()

    const onPour = (ev: PointerEvent) => {
      if (ev.buttons === 0 || mini) return
      const rect = sandCanvas.getBoundingClientRect()
      pourRef.current = { x: (ev.clientX - rect.left) / rect.width, y: 1 - (ev.clientY - rect.top) / rect.height }
    }
    sandCanvas.addEventListener("pointerdown", onPour)
    sandCanvas.addEventListener("pointermove", onPour)

    return () => {
      destroyed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      sandCanvas.removeEventListener("kyma-scatter", onScatter as EventListener)
      sandCanvas.removeEventListener("pointerdown", onPour)
      sandCanvas.removeEventListener("pointermove", onPour)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [mini, target])

  useEffect(() => () => {
    const a = audioRef.current
    if (a) { a.osc.stop(); a.ctx.close(); audioRef.current = null }
  }, [])

  const applySquarePreset = (p: { m: number; n: number; mix: number }) => {
    setShape("square"); setM(p.m); setN(p.n); setMix(p.mix)
  }
  const applyCirclePreset = (p: { m: number; n: number; mix: number }) => {
    setShape("circle"); setM(p.m); setN(p.n)
  }

  return (
    <div className="kyma-plate">
      <div ref={wrapRef} className="kyma-canvas-wrap" style={{ aspectRatio: "1 / 1" }}>
        <canvas ref={glCanvasRef} className="kyma-canvas" aria-label="Chladni plate simulation" />
        <canvas ref={sandCanvasRef} className="kyma-canvas kyma-sand-canvas" aria-hidden="true" />
        {!mini && (
          <div className="kyma-hud">
            <span className="kyma-chip">{circle ? `⊙ (${m}⌀, ${n}○)` : `□ (${m}, ${n})`}</span>
            <span className="kyma-chip kyma-chip-freq">{freq} Hz</span>
          </div>
        )}
        {mini && target && (
          <div className="kyma-hud">
            <span className="kyma-chip">match the green</span>
          </div>
        )}
      </div>

      {!mini && (
        <>
          <div className="kyma-seg-row">
            <div className="kyma-seg">
              <button type="button" className={!circle ? "on" : ""} onClick={() => setShape("square")}>Square plate</button>
              <button type="button" className={circle ? "on" : ""} onClick={() => setShape("circle")}>Circle plate</button>
            </div>
            <button type="button" className="btn btn-sm" onClick={scatterSand}>Scatter sand</button>
          </div>

          <div className="kyma-seg-row kyma-presets-row">
            <div className="kyma-presets">
              {(circle ? CIRCLE_PRESETS : SQUARE_PRESETS).map(p => (
                <button key={p.name} type="button" className="btn btn-sm"
                  onClick={() => circle ? applyCirclePreset(p) : applySquarePreset(p)}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="kyma-ctl-grid">
            <label className="kyma-ctl">
              <span>{circle ? "diameters ⌀" : "m (across)"} <b>{m}</b></span>
              <input type="range" min={circle ? 0 : 1} max={circle ? 6 : 8} step={1} value={m}
                onChange={e => setM(Number(e.target.value))} />
            </label>
            <label className="kyma-ctl">
              <span>{circle ? "circles ○" : "n (along)"} <b>{n}</b></span>
              <input type="range" min={1} max={circle ? 5 : 8} step={1} value={n}
                onChange={e => setN(Number(e.target.value))} />
            </label>
            {!circle && (
              <label className="kyma-ctl">
                <span>twin blend <b>{Math.round(mix * 100)}%</b></span>
                <input type="range" min={0} max={1} step={0.01} value={mix}
                  onChange={e => setMix(Number(e.target.value))} />
              </label>
            )}
            <label className="kyma-ctl">
              <span>drive <b>{Math.round(agitation * 100)}%</b></span>
              <input type="range" min={0} max={1} step={0.01} value={agitation}
                onChange={e => setAgitation(Number(e.target.value))} />
            </label>
            <label className="kyma-ctl">
              <span>glow <b>{Math.round(glow * 100)}%</b></span>
              <input type="range" min={0} max={1} step={0.01} value={glow}
                onChange={e => setGlow(Number(e.target.value))} />
            </label>
          </div>

          <div className="kyma-plate-foot">
            <span className="kyma-freq">
              f &asymp; <b>{freq} Hz</b>
              <small> {circle ? "(&prop; (m + 2n)&sup2;)" : "(&prop; &radic;(m&sup2;+n&sup2;))"}</small>
            </span>
            <button type="button" className={`btn btn-sm${toneOn ? " btn-accent" : ""}`} onClick={toggleTone}>
              {toneOn ? `Tone on — ${freq} Hz` : "Play the tone"}
            </button>
          </div>
        </>
      )}

      {mini && (
        <div className="kyma-ctl-grid">
          <label className="kyma-ctl">
            <span>{circle ? "diameters" : "m"} <b>{m}</b></span>
            <input type="range" min={circle ? 0 : 1} max={circle ? 6 : 8} step={1} value={m}
              onChange={e => setM(Number(e.target.value))} />
          </label>
          <label className="kyma-ctl">
            <span>{circle ? "circles" : "n"} <b>{n}</b></span>
            <input type="range" min={1} max={circle ? 5 : 8} step={1} value={n}
              onChange={e => setN(Number(e.target.value))} />
          </label>
          {!circle && (
            <label className="kyma-ctl">
              <span>twin blend <b>{Math.round(mix * 100)}%</b></span>
              <input type="range" min={0} max={1} step={0.01} value={mix}
                onChange={e => setMix(Number(e.target.value))} />
            </label>
          )}
        </div>
      )}
    </div>
  )
}
