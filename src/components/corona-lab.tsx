"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { analyze, orientationsOf, keyOf, verifyWitness, ENGINE_VERSION, type GridKind, type Cell } from "@/lib/corona/engine"

export type CoronaParams = { grid: "square" | "hex"; cells: string[]; tool: "draw" | "erase"; maxDepth: number }
export type CoronaGrade = { ready: boolean; tiler: boolean | null; depthReached: number; cellCount: number; orientationCount: number; error?: string }

type AnalyzeOut = ReturnType<typeof analyze>
type LabResult = {
  key: string
  tiler: boolean | null
  coronas: AnalyzeOut["coronas"]
  depthReached: number
  orientationCount: number
  orientations: AnalyzeOut["orientations"]
  runtimeMs: number
  witnessOk: boolean | null
  witnessError: string | null
}

interface Props {
  paramsRef: { current: CoronaParams }
  puzzleRef: { current: CoronaGrade | null }
}

const HEX_S = 1 / Math.sqrt(3)
const RING_STEP = 0.6
const RING_STAGGER = 0.3
const RING_DUR = 0.55

const BG_CSS = "#0B0F1A"
const SHAPE_CSS = "#F59E0B"
const DOT_CSS = "rgba(148,163,184,0.35)"
const RING_CSS = ["#38BDF8", "#A78BFA", "#34D399", "#F472B6"]
const SHAPE_RGB: [number, number, number] = [0.961, 0.62, 0.043]
const DOT_RGB: [number, number, number] = [0.58, 0.66, 0.82]
const RING_RGB: [number, number, number][] = [
  [0.22, 0.741, 0.973],
  [0.655, 0.545, 0.98],
  [0.204, 0.827, 0.6],
  [0.957, 0.447, 0.714],
]
const BG: [number, number, number] = [0.043, 0.059, 0.102]

type TileRec = { cx: number; cy: number; half: number; kind: number; r: number; g: number; b: number; css: string; alpha: number; glow: number; delay: number }
type Sink = { gl: number[]; js: TileRec[] }
const makeSink = (): Sink => ({ gl: [], js: [] })

const PRESETS: Record<GridKind, { name: string; short: string; cells: string[] }[]> = {
  square: [
    { name: "T tetromino", short: "T", cells: ["0,0", "1,0", "2,0", "1,1"] },
    { name: "L pentomino", short: "L", cells: ["0,0", "0,1", "0,2", "0,3", "1,3"] },
    { name: "P pentomino", short: "P", cells: ["0,0", "1,0", "0,1", "1,1", "0,2"] },
    { name: "Domino", short: "DOMINO", cells: ["0,0", "1,0"] },
  ],
  hex: [
    { name: "Dihex", short: "DIHEX", cells: ["0,0", "1,0"] },
    { name: "Hex blob 7", short: "BLOB 7", cells: ["0,0", "1,0", "0,1", "-1,1", "-1,0", "0,-1", "1,-1"] },
  ],
}

const isCellKey = (s: string) => /^-?\d+,-?\d+$/.test(s)

function parseCells(list: string[]): Cell[] {
  return list.filter(isCellKey).map(s => {
    const i = s.indexOf(",")
    return { x: Number(s.slice(0, i)), y: Number(s.slice(i + 1)) }
  })
}

function sortCellKeys(list: string[]): string[] {
  const cells = parseCells(list)
  cells.sort((a, b) => a.y - b.y || a.x - b.x)
  const out: string[] = []
  const seen = new Set<string>()
  for (const c of cells) {
    const k = `${c.x},${c.y}`
    if (!seen.has(k)) { seen.add(k); out.push(k) }
  }
  return out
}

function cellCenter(grid: GridKind, x: number, y: number): [number, number] {
  if (grid === "hex") return [x + y / 2, y * 1.5 * HEX_S]
  return [x, y]
}

function hexCellAt(wx: number, wy: number): [number, number] {
  const qf = (Math.sqrt(3) / 3 * wx - wy / 3) / HEX_S
  const rf = (2 / 3 * wy) / HEX_S
  let x = Math.round(qf)
  let z = Math.round(rf)
  let y = Math.round(-qf - rf)
  const dx = Math.abs(x - qf)
  const dy = Math.abs(y + qf + rf)
  const dz = Math.abs(z - rf)
  if (dx > dy && dx > dz) x = -y - z
  else if (dy > dz) y = -x - z
  else z = -x - y
  return [x, z]
}

const VERT = `#version 300 es
uniform vec2 uCenter;
uniform float uScale;
uniform vec2 uRes;
uniform float uNow;
uniform float uT0;
uniform float uDur;
in vec2 aPos;
in vec2 aLocal;
in vec2 aCenter;
in vec4 aColor;
in vec3 aMeta;
out vec2 vLocal;
out vec4 vColor;
out float vKind;
out float vGlow;
out float vPix;
void main() {
  float prog = clamp((uNow - uT0 - aMeta.y) / uDur, 0.0, 1.0);
  float e = 1.0 - pow(1.0 - prog, 3.0);
  float k = mix(0.5, 1.0, e);
  vec2 pos = aCenter + (aPos - aCenter) * k;
  vLocal = aLocal * k;
  vColor = vec4(aColor.rgb, aColor.a * e);
  vKind = aMeta.x;
  vGlow = aMeta.z;
  vPix = 2.0 * uScale / max(uRes.y, 1.0);
  vec2 c = (pos - uCenter) / uScale;
  gl_Position = vec4(c.x * uRes.y / uRes.x, -c.y, 0.0, 1.0);
}`

const FRAG = `#version 300 es
precision highp float;
in vec2 vLocal;
in vec4 vColor;
in float vKind;
in float vGlow;
in float vPix;
out vec4 outColor;
float sdRoundRect(vec2 p, float b, float r) {
  vec2 q = abs(p) - b + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}
float sdHex(vec2 p, float r) {
  const vec3 k = vec3(-0.8660254038, 0.5, 0.5773502692);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}
void main() {
  float d;
  if (vKind < 0.5) d = length(vLocal) - 0.05;
  else if (vKind < 1.5) d = sdRoundRect(vLocal, 0.44, 0.1);
  else d = sdHex(vLocal.yx, 0.46);
  float e = max(1.5 * vPix, 0.003);
  float shape = 1.0 - smoothstep(-e, e, d);
  float glow = vGlow * exp(-max(d, 0.0) * 9.0);
  float a = clamp((shape + glow) * vColor.a, 0.0, 1.0);
  outColor = vec4(vColor.rgb * a, a);
}`

type SceneState = {
  grid: GridKind
  cells: string[]
  tool: "draw" | "erase"
  maxDepth: number
  result: LabResult | null
  currentKey: string | null
  staticDirty: boolean
  ringsDirty: boolean
  animStart: number
  animEnd: number
}

export default function CoronaLab({ paramsRef, puzzleRef }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [grid, setGrid] = useState<GridKind>(() => (paramsRef.current.grid === "hex" ? "hex" : "square"))
  const [cells, setCells] = useState<string[]>(() => sortCellKeys(paramsRef.current.cells ?? []))
  const [tool, setTool] = useState<"draw" | "erase">(() => (paramsRef.current.tool === "erase" ? "erase" : "draw"))
  const [maxDepth, setMaxDepth] = useState(() => {
    const d = paramsRef.current.maxDepth
    return d >= 1 && d <= 5 ? Math.round(d) : 3
  })
  const [computing, setComputing] = useState(false)
  const [result, setResult] = useState<LabResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orientCount, setOrientCount] = useState(0)
  const [copied, setCopied] = useState(false)
  const [renderer2d, setRenderer2d] = useState(false)

  const busyRef = useRef(false)
  const cacheRef = useRef(new Map<string, LabResult>())
  const runAnalyzeRef = useRef<() => void>(() => {})
  const paintRef = useRef<(x: number, y: number, erase: boolean) => void>(() => {})
  const adoptRef = useRef<(p: CoronaParams) => void>(() => {})
  const visibleRef = useRef(true)
  const prevResultRef = useRef<LabResult | null>(null)
  const camTargetRef = useRef({ cx: 0, cy: 0, scale: 7 })
  const sceneRef = useRef<SceneState>({
    grid, cells, tool, maxDepth, result, currentKey: null,
    staticDirty: true, ringsDirty: true, animStart: -1, animEnd: -1,
  })

  paramsRef.current = { grid, cells, tool, maxDepth }

  const cs = parseCells(cells)
  const currentKey = cs.length > 0 ? `${maxDepth}|${keyOf(grid, cs)}` : null
  const shown = result !== null && currentKey !== null && result.key === currentKey
  const shownResult = shown ? result : null

  const s = sceneRef.current
  s.grid = grid
  s.cells = cells
  s.tool = tool
  s.maxDepth = maxDepth
  s.result = result
  s.currentKey = currentKey

  if (puzzleRef) {
    puzzleRef.current = {
      ready: shown && !computing && error === null,
      tiler: shownResult !== null && error === null ? shownResult.tiler : null,
      depthReached: shownResult !== null && error === null ? shownResult.depthReached : 0,
      cellCount: cs.length,
      orientationCount: orientCount,
      ...(error !== null ? { error } : {}),
    }
  }

  paintRef.current = (x, y, erase) => {
    const k = `${x},${y}`
    setCells(prev => (erase ? prev.filter(c => c !== k) : sortCellKeys([...prev, k])))
  }

  adoptRef.current = p => {
    if ((p.grid === "square" || p.grid === "hex") && p.grid !== grid) setGrid(p.grid)
    if ((p.tool === "draw" || p.tool === "erase") && p.tool !== tool) setTool(p.tool)
    if (typeof p.maxDepth === "number" && p.maxDepth >= 1 && p.maxDepth <= 5 && Math.round(p.maxDepth) !== maxDepth) setMaxDepth(Math.round(p.maxDepth))
    if (Array.isArray(p.cells)) {
      const next = sortCellKeys(p.cells)
      if (next.join("|") !== cells.join("|")) setCells(next)
    }
  }

  const runAnalyze = useCallback(() => {
    if (busyRef.current) return
    const list = parseCells(cells)
    if (list.length === 0) return
    busyRef.current = true
    setComputing(true)
    window.setTimeout(() => {
      try {
        const key = `${maxDepth}|${keyOf(grid, list)}`
        let r = cacheRef.current.get(key)
        if (!r) {
          const res = analyze(grid, list, maxDepth)
          let witnessOk: boolean | null = null
          let witnessError: string | null = null
          if (res.coronas) {
            try {
              const v = verifyWitness(grid, list, res.coronas)
              witnessOk = v.ok
              witnessError = v.ok ? null : v.error ?? "witness rejected"
            } catch (e) {
              witnessOk = null
              witnessError = e instanceof Error ? e.message : String(e)
            }
          }
          r = { key, tiler: res.tiler, coronas: res.coronas, depthReached: res.depthReached, orientationCount: res.orientations.length, orientations: res.orientations, runtimeMs: res.runtimeMs, witnessOk, witnessError }
          cacheRef.current.set(key, r)
          if (cacheRef.current.size > 64) {
            const oldest = cacheRef.current.keys().next()
            if (oldest.done !== true) cacheRef.current.delete(oldest.value)
          }
        }
        setError(null)
        setResult(r)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        setResult(null)
      } finally {
        busyRef.current = false
        setComputing(false)
      }
    }, 0)
  }, [grid, cells, maxDepth])
  runAnalyzeRef.current = runAnalyze

  useEffect(() => {
    const list = parseCells(cells)
    setOrientCount(list.length === 0 ? 0 : orientationsOf(grid, list).length)
  }, [grid, cells])

  useEffect(() => {
    const list = parseCells(cells)
    if (list.length === 0) {
      setResult(null)
      setError(null)
      return
    }
    const t = window.setTimeout(() => runAnalyzeRef.current(), 420)
    return () => window.clearTimeout(t)
  }, [grid, cells, maxDepth])

  useEffect(() => {
    const sc = sceneRef.current
    sc.staticDirty = true
    sc.ringsDirty = true
    if (result !== null && result !== prevResultRef.current) {
      prevResultRef.current = result
      const now = performance.now() / 1000
      sc.animStart = now
      sc.animEnd = now + RING_STEP * (result.coronas?.rings?.length ?? 0) + RING_STAGGER + RING_DUR + 0.1
    }
    const list = parseCells(cells)
    const wrap = wrapRef.current
    const rect = wrap?.getBoundingClientRect()
    const aspect = rect && rect.height > 0 ? rect.width / rect.height : 4 / 3
    if (list.length === 0) {
      camTargetRef.current = { cx: 0, cy: 0, scale: 7 }
      return
    }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    for (const c of list) {
      const [wx, wy] = cellCenter(grid, c.x, c.y)
      if (wx < minX) minX = wx
      if (wx > maxX) maxX = wx
      if (wy < minY) minY = wy
      if (wy > maxY) maxY = wy
    }
    const ringsShown = result !== null && currentKey !== null && result.key === currentKey && result.depthReached > 0
    const pad = ringsShown ? 1.0 : maxDepth + 1.4
    minX -= pad
    maxX += pad
    minY -= pad
    maxY += pad
    const w = maxX - minX
    const h = maxY - minY
    camTargetRef.current = { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, scale: Math.max(2.2, Math.max(w / (2 * aspect), h / 2) + 0.4) }
  }, [grid, cells, maxDepth, result, currentKey])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    let destroyed = false
    let raf = 0
    let mode: "webgl" | "2d" = "webgl"
    const gl = canvas.getContext("webgl2", { preserveDrawingBuffer: true }) ?? canvas.getContext("webgl2")
    if (!gl) mode = "2d"
    setRenderer2d(mode === "2d")
    const ctx2d = mode === "2d" ? canvas.getContext("2d") : null
    if (mode === "2d" && !ctx2d) mode = "webgl"

    const sinks = {
      staticSink: makeSink(),
      ringSink: makeSink(),
    }
    let staticCount = 0
    let ringCount = 0

    let prog: WebGLProgram | null = null
    let staticBuf: WebGLBuffer | null = null
    let ringBuf: WebGLBuffer | null = null
    let uCenter: WebGLUniformLocation | null = null
    let uScale: WebGLUniformLocation | null = null
    let uRes: WebGLUniformLocation | null = null
    let uNow: WebGLUniformLocation | null = null
    let uT0: WebGLUniformLocation | null = null
    let uDur: WebGLUniformLocation | null = null
    let attrs: { aPos: number; aLocal: number; aCenter: number; aColor: number; aMeta: number } | null = null
    const STRIDE = 13 * 4

    if (gl && mode === "webgl") {
      try {
        const compile = (type: number, src: string) => {
          const sh = gl.createShader(type)!
          gl.shaderSource(sh, src)
          gl.compileShader(sh)
          if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error("CORONA shader:", gl.getShaderInfoLog(sh))
          return sh
        }
        prog = gl.createProgram()!
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
        gl.linkProgram(prog)
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error("CORONA link:", gl.getProgramInfoLog(prog))
        gl.useProgram(prog)
        staticBuf = gl.createBuffer()!
        ringBuf = gl.createBuffer()!
        const aPos = gl.getAttribLocation(prog, "aPos")
        const aLocal = gl.getAttribLocation(prog, "aLocal")
        const aCenter = gl.getAttribLocation(prog, "aCenter")
        const aColor = gl.getAttribLocation(prog, "aColor")
        const aMeta = gl.getAttribLocation(prog, "aMeta")
        attrs = { aPos, aLocal, aCenter, aColor, aMeta }
        for (const loc of [aPos, aLocal, aCenter, aColor, aMeta]) gl.enableVertexAttribArray(loc)
        uCenter = gl.getUniformLocation(prog, "uCenter")
        uScale = gl.getUniformLocation(prog, "uScale")
        uRes = gl.getUniformLocation(prog, "uRes")
        uNow = gl.getUniformLocation(prog, "uNow")
        uT0 = gl.getUniformLocation(prog, "uT0")
        uDur = gl.getUniformLocation(prog, "uDur")
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      } catch (e) {
        console.error("CORONA webgl init:", e)
        mode = "webgl"
      }
    }

    const cam = { cx: 0, cy: 0, scale: 7, init: false }
    let needDraw = true
    let aspect = 4 / 3

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      const w = Math.max(1, Math.round(r.width))
      const h = Math.max(1, Math.round(r.height))
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      if (h > 0) aspect = w / h
      needDraw = true
    }

    const pushQuad = (sink: Sink, cx: number, cy: number, half: number, kind: number, rgb: [number, number, number], css: string, alpha: number, glow: number, delay: number) => {
      const pts: [number, number][] = [[-half, -half], [half, -half], [half, half], [-half, -half], [half, half], [-half, half]]
      for (const [dx, dy] of pts) sink.gl.push(cx + dx, cy + dy, dx, dy, cx, cy, rgb[0], rgb[1], rgb[2], alpha, kind, delay, glow)
      sink.js.push({ cx, cy, half, kind, r: rgb[0], g: rgb[1], b: rgb[2], css, alpha, glow, delay })
    }

    const buildStatic = () => {
      const sc = sceneRef.current
      const sink = makeSink()
      const list = parseCells(sc.cells)
      if (list.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
        for (const c of list) {
          const [wx, wy] = cellCenter(sc.grid, c.x, c.y)
          if (wx < minX) minX = wx
          if (wx > maxX) maxX = wx
          if (wy < minY) minY = wy
          if (wy > maxY) maxY = wy
        }
        const pad = sc.maxDepth + 2.5
        const x0 = minX - pad, x1 = maxX + pad, y0 = minY - pad, y1 = maxY + pad
        if (sc.grid === "square") {
          const qx0 = Math.floor(x0), qx1 = Math.ceil(x1), qy0 = Math.floor(y0), qy1 = Math.ceil(y1)
          const step = (qx1 - qx0) * (qy1 - qy0) > 3600 ? 2 : 1
          for (let gx = qx0; gx <= qx1; gx += step)
            for (let gy = qy0; gy <= qy1; gy += step)
              pushQuad(sink, gx, gy, 0.12, 0, DOT_RGB, DOT_CSS, 0.16, 0, -1000)
        } else {
          const c0 = hexCellAt(x0, y0)
          const c1 = hexCellAt(x1, y1)
          const q0 = Math.min(c0[0], c1[0]) - 1, q1 = Math.max(c0[0], c1[0]) + 1
          const r0 = Math.min(c0[1], c1[1]) - 1, r1 = Math.max(c0[1], c1[1]) + 1
          const step = (q1 - q0) * (r1 - r0) > 3600 ? 2 : 1
          for (let q = q0; q <= q1; q += step)
            for (let r = r0; r <= r1; r += step) {
              const [wx, wy] = cellCenter("hex", q, r)
              if (wx < x0 - 0.5 || wx > x1 + 0.5 || wy < y0 - 0.5 || wy > y1 + 0.5) continue
              pushQuad(sink, wx, wy, 0.12, 0, DOT_RGB, DOT_CSS, 0.16, 0, -1000)
            }
        }
        const half = sc.grid === "hex" ? 1.05 : 0.95
        const kind = sc.grid === "hex" ? 2 : 1
        for (const c of list) {
          const [wx, wy] = cellCenter(sc.grid, c.x, c.y)
          pushQuad(sink, wx, wy, half, kind, SHAPE_RGB, SHAPE_CSS, 1, 0.32, -1000)
        }
      }
      sinks.staticSink = sink
      staticCount = sink.gl.length / 13
      if (gl && staticBuf) {
        gl.bindBuffer(gl.ARRAY_BUFFER, staticBuf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sink.gl), gl.DYNAMIC_DRAW)
      }
    }

    const buildRings = () => {
      const sc = sceneRef.current
      const sink = makeSink()
      const r = sc.result
      if (r && r.coronas && sc.currentKey !== null && r.key === sc.currentKey && r.depthReached > 0) {
        const list = parseCells(sc.cells)
        const orients = r.orientations
        let cx = 0, cy = 0
        for (const c of list) {
          const [wx, wy] = cellCenter(sc.grid, c.x, c.y)
          cx += wx
          cy += wy
        }
        cx /= list.length
        cy /= list.length
        let radius = 1
        for (const c of list) {
          const [wx, wy] = cellCenter(sc.grid, c.x, c.y)
          radius = Math.max(radius, Math.hypot(wx - cx, wy - cy))
        }
        const used = new Set(sc.cells)
        const rings = r.coronas.rings
        const half = sc.grid === "hex" ? 1.05 : 0.95
        const kind = sc.grid === "hex" ? 2 : 1
        for (let ri = 0; ri < rings.length; ri++) {
          const color = RING_RGB[ri % RING_RGB.length]
          const css = RING_CSS[ri % RING_CSS.length]
          const glow = ri === rings.length - 1 ? 0.5 : 0.16
          const seen = new Set<string>()
          for (const p of rings[ri]) {
            const oc = orients[p.orient]?.cells ?? []
            for (const c of oc) {
              const x = c.x + p.dx
              const y = c.y + p.dy
              const k = `${x},${y}`
              if (used.has(k) || seen.has(k)) continue
              seen.add(k)
              const [wx, wy] = cellCenter(sc.grid, x, y)
              const dist = Math.min(1, Math.max(0, Math.hypot(wx - cx, wy - cy) / (radius + 0.5)))
              pushQuad(sink, wx, wy, half, kind, color, css, 0.92, glow, ri * RING_STEP + dist * RING_STAGGER)
            }
          }
          for (const k of seen) used.add(k)
        }
      }
      sinks.ringSink = sink
      ringCount = sink.gl.length / 13
      if (gl && ringBuf) {
        gl.bindBuffer(gl.ARRAY_BUFFER, ringBuf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sink.gl), gl.DYNAMIC_DRAW)
      }
    }

    const draw2d = (now: number, animating: boolean, t0: number) => {
      const c = ctx2d
      if (!c) return
      const W = canvas.width / dpr
      const H = canvas.height / dpr
      c.setTransform(dpr, 0, 0, dpr, 0, 0)
      c.fillStyle = BG_CSS
      c.fillRect(0, 0, W, H)
      const S = (H / 2) / cam.scale
      const toX = (wx: number) => W / 2 + (wx - cam.cx) * S
      const toY = (wy: number) => H / 2 - (wy - cam.cy) * S
      const dur = RING_DUR
      const paint = (tiles: TileRec[], order: "under" | "over") => {
        for (const t of tiles) {
          const p = t.delay < -100 ? 1 : Math.min(1, Math.max(0, (now - t0 - t.delay) / dur))
          if (p <= 0) continue
          const e = 1 - Math.pow(1 - p, 3)
          const k = 0.5 + 0.5 * e
          const a = t.alpha * e
          if (a <= 0.002) continue
          const x = toX(t.cx)
          const y = toY(t.cy)
          const sz = t.half * S * k
          if (x < -sz || x > W + sz || y < -sz || y > H + sz) continue
          if (t.glow > 0.2) {
            c.save()
            c.shadowColor = t.css
            c.shadowBlur = t.glow * 18
            c.fillStyle = t.css
            c.globalAlpha = a * 0.9
            fillTile(c, t.kind, x, y, sz)
            c.restore()
          }
          c.globalAlpha = a
          c.fillStyle = t.css
          fillTile(c, t.kind, x, y, sz)
        }
        void order
      }
      paint(sinks.ringSink.js, "under")
      paint(sinks.staticSink.js, "over")
      c.globalAlpha = 1
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(es => {
      visibleRef.current = es[0].isIntersecting
      if (es[0].isIntersecting) needDraw = true
    }, { threshold: 0.02 })
    io.observe(wrap)

    const onLost = (ev: Event) => {
      ev.preventDefault()
      needDraw = false
      console.error("CORONA webgl context lost — rendering paused")
    }
    canvas.addEventListener("webglcontextlost", onLost)

    const paramsSeen = { grid: "", cells: "", tool: "", maxDepth: -1 }
    const adoptExternal = () => {
      const p = paramsRef.current
      if (!p) return
      const cellsSig = Array.isArray(p.cells) ? p.cells.join("|") : ""
      if (p.grid === paramsSeen.grid && cellsSig === paramsSeen.cells && p.tool === paramsSeen.tool && p.maxDepth === paramsSeen.maxDepth) return
      paramsSeen.grid = p.grid
      paramsSeen.cells = cellsSig
      paramsSeen.tool = p.tool
      paramsSeen.maxDepth = p.maxDepth
      adoptRef.current(p)
    }

    const worldAt = (clientX: number, clientY: number): [number, number] => {
      const r = canvas.getBoundingClientRect()
      const nx = ((clientX - r.left) / r.width) * 2 - 1
      const ny = ((clientY - r.top) / r.height) * 2 - 1
      return [cam.cx + nx * cam.scale * aspect, cam.cy - ny * cam.scale]
    }
    const strokeErase = { current: false }
    const lastPaint = { current: "" }
    const paintAt = (clientX: number, clientY: number, erase: boolean) => {
      const sc = sceneRef.current
      const [wx, wy] = worldAt(clientX, clientY)
      const c = sc.grid === "hex" ? hexCellAt(wx, wy) : [Math.round(wx), Math.round(wy)]
      const sig = `${c[0]},${c[1]}|${erase ? "e" : "d"}`
      if (sig === lastPaint.current) return
      lastPaint.current = sig
      paintRef.current(c[0], c[1], erase)
    }
    const onDown = (ev: PointerEvent) => {
      if (ev.button !== 0 && ev.button !== 2) return
      ev.preventDefault()
      strokeErase.current = ev.button === 2 || sceneRef.current.tool === "erase"
      lastPaint.current = ""
      try { canvas.setPointerCapture(ev.pointerId) } catch {}
      paintAt(ev.clientX, ev.clientY, strokeErase.current)
    }
    const onMove = (ev: PointerEvent) => {
      if (ev.buttons === 0) return
      paintAt(ev.clientX, ev.clientY, strokeErase.current)
    }
    const onUp = (ev: PointerEvent) => {
      lastPaint.current = ""
      try { canvas.releasePointerCapture(ev.pointerId) } catch {}
    }
    const onCtx = (ev: Event) => ev.preventDefault()
    canvas.addEventListener("pointerdown", onDown)
    canvas.addEventListener("pointermove", onMove)
    canvas.addEventListener("pointerup", onUp)
    canvas.addEventListener("pointercancel", onUp)
    canvas.addEventListener("contextmenu", onCtx)

    const frame = () => {
      if (destroyed) return
      raf = requestAnimationFrame(frame)
      try {
        adoptExternal()
        if (!visibleRef.current) return
        const sc = sceneRef.current
        if (sc.staticDirty) {
          buildStatic()
          sc.staticDirty = false
          needDraw = true
        }
        if (sc.ringsDirty) {
          buildRings()
          sc.ringsDirty = false
          needDraw = true
        }
        const t = camTargetRef.current
        if (!cam.init) {
          cam.cx = t.cx
          cam.cy = t.cy
          cam.scale = Math.max(t.scale * 1.6, 2)
          cam.init = true
          needDraw = true
        }
        const now = performance.now() / 1000
        const animating = now < sc.animEnd
        const nx = cam.cx + (t.cx - cam.cx) * 0.1
        const ny = cam.cy + (t.cy - cam.cy) * 0.1
        const ns = cam.scale + (t.scale - cam.scale) * 0.1
        const moved = Math.abs(nx - cam.cx) > 1e-4 || Math.abs(ny - cam.cy) > 1e-4 || Math.abs(ns - cam.scale) > 1e-4 * Math.max(cam.scale, 1)
        cam.cx = nx
        cam.cy = ny
        cam.scale = ns
        if (!needDraw && !animating && !moved) return
        if (mode === "webgl" && gl && prog) {
          gl.viewport(0, 0, canvas.width, canvas.height)
          gl.clearColor(BG[0], BG[1], BG[2], 1)
          gl.clear(gl.COLOR_BUFFER_BIT)
          gl.uniform2f(uCenter, cam.cx, cam.cy)
          gl.uniform1f(uScale, cam.scale)
          gl.uniform2f(uRes, canvas.width, canvas.height)
          gl.uniform1f(uNow, now)
          gl.uniform1f(uT0, animating ? sc.animStart : -1e9)
          gl.uniform1f(uDur, RING_DUR)
          if (attrs) {
            const drawBuf = (buf: WebGLBuffer | null, count: number) => {
              if (!buf || count === 0) return
              gl!.bindBuffer(gl!.ARRAY_BUFFER, buf)
              gl!.vertexAttribPointer(attrs!.aPos, 2, gl!.FLOAT, false, STRIDE, 0)
              gl!.vertexAttribPointer(attrs!.aLocal, 2, gl!.FLOAT, false, STRIDE, 8)
              gl!.vertexAttribPointer(attrs!.aCenter, 2, gl!.FLOAT, false, STRIDE, 16)
              gl!.vertexAttribPointer(attrs!.aColor, 4, gl!.FLOAT, false, STRIDE, 24)
              gl!.vertexAttribPointer(attrs!.aMeta, 3, gl!.FLOAT, false, STRIDE, 40)
              gl!.drawArrays(gl!.TRIANGLES, 0, count)
            }
            drawBuf(ringBuf, ringCount)
            drawBuf(staticBuf, staticCount)
          }
        } else if (mode === "2d" && ctx2d) {
          draw2d(now, animating, animating ? sc.animStart : 1e12)
        }
        needDraw = false
      } catch (e) {
        console.error("CORONA frame:", e)
      }
    }
    resize()
    frame()

    return () => {
      destroyed = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("pointerdown", onDown)
      canvas.removeEventListener("pointermove", onMove)
      canvas.removeEventListener("pointerup", onUp)
      canvas.removeEventListener("pointercancel", onUp)
      canvas.removeEventListener("contextmenu", onCtx)
      canvas.removeEventListener("webglcontextlost", onLost)
      if (mode === "webgl") gl?.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [paramsRef])

  const switchGrid = (g: GridKind) => {
    if (g === grid) return
    setGrid(g)
    setCells([])
    setResult(null)
    setError(null)
  }

  const clearAll = () => {
    setCells([])
    setResult(null)
    setError(null)
  }

  const applyPreset = (name: string) => {
    const p = PRESETS[grid].find(x => x.name === name)
    if (!p) return
    setCells(sortCellKeys(p.cells))
    setResult(null)
    setError(null)
  }

  const copyCert = useCallback(() => {
    if (!result || result.depthReached < 1) return
    const cert = { ENGINE_VERSION, grid, cells, maxDepth, coronas: result.coronas }
    const text = JSON.stringify(cert, null, 2)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      }).catch(() => {})
    }
  }, [result, grid, cells, maxDepth])

  const tilerLabel = shownResult === null ? "—" : shownResult.tiler === null ? "?" : shownResult.tiler ? (shownResult.witnessOk === false ? "YES?" : "YES ✓") : "NO"
  const coronaLabel = shownResult !== null ? `${shownResult.depthReached}/${maxDepth}` : "—"
  const tilerChipClass = shownResult === null || shownResult.tiler === null ? "" : shownResult.tiler ? " kyma-chip-freq" : " kyma-chip-warn"
  const heavyShape = shownResult !== null && shownResult.runtimeMs > 200

  const hint = (() => {
    if (cs.length === 0) return "Drag on the grid to draw a polyform — right-click or Erase removes cells. Analyze rings it with copies of itself."
    if (error !== null) return `The engine failed on this shape: ${error}`
    if (computing) return "Computing coronas…"
    if (shownResult === null) return "Shape changed — the coronas will re-ring it in a moment."
    if (shownResult.tiler === null) return "Inconclusive — no candidate region fits this cell count, or the search budget ran out. Try a different shape or depth."
    if (shownResult.tiler) return `It tiles the plane — tilers can be ringed forever, so coronas run the full ${maxDepth}.`
    if (shownResult.depthReached === 0) return "No tiling found — every copy collides. Now: how many rings can it take?"
    if (shownResult.depthReached >= maxDepth) return `Rings ${shownResult.depthReached}/${maxDepth} with no jam yet — push max depth higher to keep testing.`
    return `Candidate non-tiler — the packing jams after ${shownResult.depthReached} ring${shownResult.depthReached === 1 ? "" : "s"}. That is its Heesch number.${heavyShape ? " (heavy shape — analysis capped safely)" : ""}`
  })()

  return (
    <>
      <div className="corona-lab-head">
        <div>
          <div className="corona-lab-title">The Corona Board</div>
          <div className="corona-lab-sub">1960s · Heesch&apos;s problem · square &amp; hex · live tiling engine</div>
        </div>
        <span className="corona-chip">ENGINE {ENGINE_VERSION}{renderer2d ? " · 2D" : ""}</span>
      </div>
      <div className="corona-lab-body">
        <div ref={wrapRef} className="corona-stage">
          <canvas ref={canvasRef} className="corona-canvas" style={{ cursor: "crosshair" }} aria-label="Corona lab canvas: draw a polyform and watch coronas ring it" />
          <div className="corona-hud">
            <span className="kyma-chip">CELLS {cs.length}</span>
            <span className="kyma-chip">ORIENT {cs.length > 0 ? orientCount : 0}</span>
            <span className={`kyma-chip${tilerChipClass}`}>TILER {tilerLabel}</span>
            <span className="kyma-chip">CORONAS {coronaLabel}</span>
            {computing && <span className="kyma-chip kyma-chip-warn">computing…</span>}
          </div>
        </div>
        <div className="corona-rail">
          <div className="corona-rail-group">
            <div className="corona-rail-label">Lattice</div>
            <div className="corona-seg">
              <button type="button" className={grid === "square" ? "corona-seg-btn corona-seg-on" : "corona-seg-btn"} onClick={() => switchGrid("square")}>Square</button>
              <button type="button" className={grid === "hex" ? "corona-seg-btn corona-seg-on" : "corona-seg-btn"} onClick={() => switchGrid("hex")}>Hex</button>
            </div>
          </div>
          <div className="corona-rail-group">
            <div className="corona-rail-label">Tool</div>
            <div className="corona-seg">
              <button type="button" className={tool === "draw" ? "corona-seg-btn corona-seg-on" : "corona-seg-btn"} onClick={() => setTool("draw")}>Draw</button>
              <button type="button" className={tool === "erase" ? "corona-seg-btn corona-seg-on" : "corona-seg-btn"} onClick={() => setTool("erase")}>Erase</button>
            </div>
          </div>
          <div className="corona-rail-group">
            <div className="corona-rail-label">Corona depth</div>
            <div className="corona-chiprow">
              {[1, 2, 3, 4, 5].map(d => (
                <button key={d} type="button" className={maxDepth === d ? "corona-depth-btn corona-seg-on" : "corona-depth-btn"} onClick={() => setMaxDepth(d)}>{d}</button>
              ))}
            </div>
          </div>
          <div className="corona-rail-group">
            <div className="corona-rail-label">Presets</div>
            <div className="corona-chiprow">
              {PRESETS[grid].map(p => (
                <button key={p.name} type="button" className="corona-preset-btn" onClick={() => applyPreset(p.name)}>{p.short}</button>
              ))}
            </div>
          </div>
          <div className="corona-rail-group">
            <button type="button" className="corona-analyze" disabled={computing} onClick={() => runAnalyzeRef.current()}>{computing ? "Analyzing…" : "Analyze"}</button>
            <button type="button" className="corona-cert" onClick={clearAll}>Clear</button>
          </div>
          {shownResult !== null && shownResult.depthReached >= 1 && (
            <div className="corona-rail-group">
              <button type="button" className="corona-cert" onClick={copyCert}>{copied ? "Copied ✓" : "Copy certificate"}</button>
              <span className="corona-witness-line">{shownResult.runtimeMs.toFixed(1)} ms · {shownResult.witnessOk === true ? "witness verified" : shownResult.witnessOk === false ? `witness rejected: ${shownResult.witnessError ?? "mismatch"}` : "coronas certified"}</span>
            </div>
          )}
          <p className="corona-hint">{hint}</p>
        </div>
      </div>
    </>
  )
}

function fillTile(c: CanvasRenderingContext2D, kind: number, x: number, y: number, sz: number) {
  if (kind === 0) {
    c.beginPath()
    c.arc(x, y, Math.max(1.2, sz * 0.42), 0, Math.PI * 2)
    c.fill()
    return
  }
  if (kind === 1) {
    const b = sz * 0.463
    const r = Math.min(sz * 0.105, b)
    c.beginPath()
    c.roundRect(x - b, y - b, b * 2, b * 2, r)
    c.fill()
    return
  }
  c.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i
    const px = x + sz * 0.438 * Math.cos(a)
    const py = y + sz * 0.438 * Math.sin(a)
    if (i === 0) c.moveTo(px, py)
    else c.lineTo(px, py)
  }
  c.closePath()
  c.fill()
}
