"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { KymaTarget } from "@/data/kyma"

const C = 64

function fieldAt(x: number, y: number, m: number, n: number, mix: number): number {
  const cmx = Math.cos(Math.PI * m * x)
  const cmy = Math.cos(Math.PI * m * y)
  const cnx = Math.cos(Math.PI * n * x)
  const cny = Math.cos(Math.PI * n * y)
  return mix * cnx * cmy + (1 - mix) * cmx * cny
}

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `
precision highp float;
uniform vec2 res;
uniform float um, un, umix, showT;
uniform vec3 tgt;
float fieldOf(vec2 q, float m, float n, float a){
  return a * cos(3.14159265 * n * q.x) * cos(3.14159265 * m * q.y)
       + (1.0 - a) * cos(3.14159265 * m * q.x) * cos(3.14159265 * n * q.y);
}
void main(){
  vec2 q = gl_FragCoord.xy / res;
  float f = fieldOf(q, um, un, umix);
  float g = abs(f);
  float node = 1.0 - smoothstep(0.0, 0.045, g);
  float halo = exp(-g * 7.0) * 0.30;
  vec3 col = vec3(0.055, 0.075, 0.07);
  col += halo * vec3(0.30, 0.50, 0.42);
  col += node * vec3(0.91, 0.86, 0.68);
  if (showT > 0.5) {
    float ft = fieldOf(q, tgt.x, tgt.y, tgt.z);
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

export default function KymaPlate({ initial, target, paramsRef, mini = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const glCanvasRef = useRef<HTMLCanvasElement>(null)
  const sandCanvasRef = useRef<HTMLCanvasElement>(null)
  const [m, setM] = useState(initial?.m ?? 2)
  const [n, setN] = useState(initial?.n ?? 2)
  const [mix, setMix] = useState(initial?.mix ?? 0)
  const [agitation, setAgitation] = useState(0.35)
  const [toneOn, setToneOn] = useState(false)
  const [freq, setFreq] = useState(0)
  const simRef = useRef({ m, n, mix, agitation })
  const audioRef = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null)

  simRef.current = { m, n, mix, agitation }
  if (paramsRef) { paramsRef.current.m = m; paramsRef.current.n = n; paramsRef.current.mix = mix }

  const displayedFreq = Math.round(C * Math.sqrt(m * m + n * n) * 10) / 10

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
    osc.frequency.value = simRef.current ? C * Math.sqrt(simRef.current.m ** 2 + simRef.current.n ** 2) : 128
    gain.gain.value = 0.05
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start()
    audioRef.current = { ctx, osc, gain }
    setToneOn(true)
  }, [toneOn])

  useEffect(() => {
    const a = audioRef.current
    if (a && toneOn) a.osc.frequency.setTargetAtTime(C * Math.sqrt(m * m + n * n), a.ctx.currentTime, 0.04)
  }, [m, n, toneOn])

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

    const N = mini ? 1600 : 3000
    const px = new Float32Array(N)
    const py = new Float32Array(N)
    const vx = new Float32Array(N)
    const vy = new Float32Array(N)
    for (let i = 0; i < N; i++) { px[i] = Math.random(); py[i] = Math.random() }

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

    let raf = 0
    const frame = () => {
      if (destroyed) return
      const s = simRef.current
      const { m: sm, n: sn, mix: smix } = s
      gl.uniform2f(uRes, glCanvas.width, glCanvas.height)
      gl.uniform1f(uM, sm); gl.uniform1f(uN, sn); gl.uniform1f(uMix, smix)
      if (target) { gl.uniform1f(uShowT, 1); gl.uniform3f(uTgt, target.m, target.n, target.mix) }
      else gl.uniform1f(uShowT, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      const jit = 0.05 * (0.3 + 0.7 * s.agitation)
      const G = 0.006
      sand.setTransform(dpr, 0, 0, dpr, 0, 0)
      sand.clearRect(0, 0, W, H)
      sand.fillStyle = "rgba(233, 224, 190, 0.55)"
      for (let i = 0; i < N; i++) {
        let x = px[i], y = py[i]
        const f = fieldAt(x, y, sm, sn, smix)
        const e = 0.004
        const fx = (fieldAt(x + e, y, sm, sn, smix) - f) / e
        const fy = (fieldAt(x, y + e, sm, sn, smix) - f) / e
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
      raf = requestAnimationFrame(frame)
    }
    frame()

    return () => {
      destroyed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [mini, target])

  useEffect(() => () => {
    const a = audioRef.current
    if (a) { a.osc.stop(); a.ctx.close(); audioRef.current = null }
  }, [])

  const numStyle = { touchAction: "pan-y" as const }

  return (
    <div className="kyma-plate">
      <div ref={wrapRef} className="kyma-canvas-wrap" style={{ aspectRatio: "1 / 1" }}>
        <canvas ref={glCanvasRef} className="kyma-canvas" aria-label="Chladni plate simulation" />
        <canvas ref={sandCanvasRef} className="kyma-canvas" aria-hidden="true" />
      </div>
      <div className="kyma-ctl-grid">
        <label className="kyma-ctl">
          <span>m (across) <b>{m}</b></span>
          <input type="range" min={1} max={8} step={1} value={m} style={numStyle}
            onChange={e => setM(Number(e.target.value))} />
        </label>
        <label className="kyma-ctl">
          <span>n (along) <b>{n}</b></span>
          <input type="range" min={1} max={8} step={1} value={n} style={numStyle}
            onChange={e => setN(Number(e.target.value))} />
        </label>
        <label className="kyma-ctl">
          <span>twin blend <b>{Math.round(mix * 100)}%</b></span>
          <input type="range" min={0} max={1} step={0.01} value={mix} style={numStyle}
            onChange={e => setMix(Number(e.target.value))} />
        </label>
        {!mini && (
          <label className="kyma-ctl">
            <span>agitation <b>{Math.round(agitation * 100)}%</b></span>
            <input type="range" min={0} max={1} step={0.01} value={agitation} style={numStyle}
              onChange={e => setAgitation(Number(e.target.value))} />
          </label>
        )}
      </div>
      {!mini && (
        <div className="kyma-plate-foot">
          <span className="kyma-freq">f &asymp; <b>{freq} Hz</b> <small>(&prop; &radic;(m&sup2;+n&sup2;))</small></span>
          <button type="button" className={`btn btn-sm${toneOn ? " btn-accent" : ""}`} onClick={toggleTone}>
            {toneOn ? `Tone on — ${freq} Hz` : "Play the tone"}
          </button>
        </div>
      )}
    </div>
  )
}
