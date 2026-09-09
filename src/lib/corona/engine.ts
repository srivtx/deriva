export type GridKind = "square" | "hex"
export type Cell = { x: number; y: number }
export type Orientation = { id: number; cells: Cell[] }
export type Placement = { orient: number; dx: number; dy: number }
export type CoronaResult = {
  grid: GridKind
  cells: Cell[]
  orientations: Orientation[]
  tiler: boolean | null
  tilingWitness: { placements: Placement[]; regionNote: string } | null
  coronas: { depth: number; rings: Placement[][] } | null
  depthReached: number
  maxDepthTried: number
  runtimeMs: number
}

export const ENGINE_VERSION = "corona-engine 0.1.0"

const SQ_DIRS: Cell[] = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }]
const HEX_DIRS: Cell[] = [
  { x: 1, y: 0 },
  { x: 1, y: -1 },
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: -1, y: 1 },
  { x: 0, y: 1 },
]
const ROW_CAP = 400_000
const VISIT_CAP = 20_000_000
const HUNT_BUDGET = 20_000
const MAX_DEPTH_HARD_CAP = 5
const OFFSET = 1_000_000
const SPAN = 2_000_001

const ckey = (x: number, y: number): number => (x + OFFSET) * SPAN + (y + OFFSET)

export function normalize(_grid: GridKind, cells: Cell[]): Cell[] {
  const uniq = new Map<number, Cell>()
  let mx = Infinity
  let my = Infinity
  for (const c of cells) {
    const k = ckey(c.x, c.y)
    if (uniq.has(k)) continue
    uniq.set(k, c)
    if (c.x < mx) mx = c.x
    if (c.y < my) my = c.y
  }
  const out: Cell[] = []
  for (const c of uniq.values()) out.push({ x: c.x - mx, y: c.y - my })
  out.sort((a, b) => a.y - b.y || a.x - b.x)
  return out
}

export function keyOf(grid: GridKind, cells: Cell[]): string {
  const norm = normalize(grid, cells)
  return grid + "|" + norm.map(c => c.x + "," + c.y).join(";")
}

function transformSquare(cells: Cell[], rot: number, refl: boolean): Cell[] {
  return cells.map(c => {
    let x = refl ? -c.x : c.x
    let y = c.y
    for (let i = 0; i < rot; i++) {
      const nx = -y
      const ny = x
      x = nx
      y = ny
    }
    return { x, y }
  })
}

function transformHex(cells: Cell[], rot: number, refl: boolean): Cell[] {
  return cells.map(c => {
    let x = c.x
    let y = c.y
    let z = -x - y
    if (refl) {
      const t = x
      x = y
      y = t
    }
    for (let i = 0; i < rot; i++) {
      const nx = -z
      const ny = -x
      const nz = -y
      x = nx
      y = ny
      z = nz
    }
    return { x, y }
  })
}

export function orientationsOf(grid: GridKind, cells: Cell[]): Orientation[] {
  const base = normalize(grid, cells)
  const rots = grid === "square" ? 4 : 6
  const seen = new Set<string>()
  const out: Orientation[] = []
  for (let refl = 0; refl < 2; refl++) {
    for (let rot = 0; rot < rots; rot++) {
      const t = normalize(grid, grid === "square" ? transformSquare(base, rot, refl === 1) : transformHex(base, rot, refl === 1))
      const k = keyOf(grid, t)
      if (seen.has(k)) continue
      seen.add(k)
      out.push({ id: out.length, cells: t })
    }
  }
  return out
}

export function cellNeighbors(grid: GridKind, c: Cell): Cell[] {
  const dirs = grid === "square" ? SQ_DIRS : HEX_DIRS
  return dirs.map(d => ({ x: c.x + d.x, y: c.y + d.y }))
}

export function regionAround(grid: GridKind, occupied: Cell[], radius: number): Cell[] {
  if (radius < 2) return []
  const occ = new Set<number>()
  for (const c of occupied) occ.add(ckey(c.x, c.y))
  const dist = new Map<number, number>()
  let frontier: Cell[] = []
  const out: Cell[] = []
  for (const c of occupied) {
    for (const nb of cellNeighbors(grid, c)) {
      const k = ckey(nb.x, nb.y)
      if (occ.has(k) || dist.has(k)) continue
      dist.set(k, 1)
      frontier.push(nb)
    }
  }
  out.push(...frontier)
  for (let d = 2; d <= radius - 1; d++) {
    const next: Cell[] = []
    for (const c of frontier) {
      for (const nb of cellNeighbors(grid, c)) {
        const k = ckey(nb.x, nb.y)
        if (occ.has(k) || dist.has(k)) continue
        dist.set(k, d)
        next.push(nb)
      }
    }
    out.push(...next)
    frontier = next
  }
  return out
}

function bfsWithin(grid: GridKind, uset: Set<number>, start: Cell): Map<number, number> {
  const dist = new Map<number, number>()
  dist.set(ckey(start.x, start.y), 0)
  let frontier: Cell[] = [start]
  let d = 0
  while (frontier.length > 0) {
    d++
    const next: Cell[] = []
    for (const c of frontier) {
      for (const nb of cellNeighbors(grid, c)) {
        const k = ckey(nb.x, nb.y)
        if (!uset.has(k) || dist.has(k)) continue
        dist.set(k, d)
        next.push(nb)
      }
    }
    frontier = next
  }
  return dist
}

function diameterOf(grid: GridKind, uset: Set<number>, ucells: Cell[]): number {
  let max = 0
  for (const c of ucells) {
    for (const d of bfsWithin(grid, uset, c).values()) {
      if (d > max) max = d
    }
  }
  return max
}

function dlxSolve(numCols: number, rowCells: number[][], visitCap: number): { rows: number[] | null; overflow: boolean } {
  let total = 0
  for (const r of rowCells) total += r.length
  const cap = numCols + 1 + total
  const L = new Int32Array(cap)
  const R = new Int32Array(cap)
  const U = new Int32Array(cap)
  const D = new Int32Array(cap)
  const C = new Int32Array(cap)
  const RW = new Int32Array(cap)
  const S = new Int32Array(numCols + 1)
  for (let i = 0; i <= numCols; i++) {
    L[i] = i - 1
    R[i] = i + 1
    U[i] = i
    D[i] = i
    C[i] = i
  }
  L[0] = numCols
  R[numCols] = 0
  let nn = numCols + 1
  for (let ri = 0; ri < rowCells.length; ri++) {
    const cells = rowCells[ri]
    let first = -1
    let last = -1
    for (const col of cells) {
      const h = col + 1
      const n = nn++
      U[n] = U[h]
      D[n] = h
      D[U[h]] = n
      U[h] = n
      C[n] = h
      RW[n] = ri
      S[h]++
      if (first === -1) {
        first = n
        last = n
        L[n] = n
        R[n] = n
      } else {
        L[n] = last
        R[n] = first
        R[last] = n
        L[first] = n
        last = n
      }
    }
  }
  const cover = (c: number): void => {
    R[L[c]] = R[c]
    L[R[c]] = L[c]
    for (let i = D[c]; i !== c; i = D[i]) {
      for (let j = R[i]; j !== i; j = R[j]) {
        D[U[j]] = D[j]
        U[D[j]] = U[j]
        S[C[j]]--
      }
    }
  }
  const uncover = (c: number): void => {
    for (let i = U[c]; i !== c; i = U[i]) {
      for (let j = L[i]; j !== i; j = L[j]) {
        D[U[j]] = j
        U[D[j]] = j
        S[C[j]]++
      }
    }
    R[L[c]] = c
    L[R[c]] = c
  }
  let visits = 0
  let overflow = false
  const stack: number[] = []
  const search = (): boolean => {
    if (R[0] === 0) return true
    visits++
    if (visits > visitCap) {
      overflow = true
      return false
    }
    let c = 0
    let min = 0x7fffffff
    for (let j = R[0]; j !== 0; j = R[j]) {
      if (S[j] < min) {
        min = S[j]
        c = j
        if (min === 0) break
      }
    }
    if (min === 0) return false
    cover(c)
    for (let r = D[c]; r !== c && !overflow; r = D[r]) {
      stack.push(RW[r])
      for (let j = R[r]; j !== r; j = R[j]) cover(C[j])
      if (search()) return true
      for (let j = L[r]; j !== r; j = L[j]) uncover(C[j])
      stack.pop()
    }
    uncover(c)
    return false
  }
  const found = search()
  if (overflow) return { rows: null, overflow: true }
  return { rows: found ? stack.slice() : null, overflow: false }
}

function indexRegion(region: Cell[]): Map<number, number> {
  const index = new Map<number, number>()
  for (let i = 0; i < region.length; i++) index.set(ckey(region[i].x, region[i].y), i)
  return index
}

function placementCells(p: Placement, orientations: Orientation[]): Cell[] {
  const o = orientations[p.orient]
  if (!o) return []
  return o.cells.map(c => ({ x: c.x + p.dx, y: c.y + p.dy }))
}

function placementsInRegion(region: Cell[], orientations: Orientation[]): Placement[] {
  const index = indexRegion(region)
  const seen = new Set<string>()
  const out: Placement[] = []
  for (const o of orientations) {
    const cs = o.cells
    for (const a of region) {
      for (const oc of cs) {
        const dx = a.x - oc.x
        const dy = a.y - oc.y
        const pk = o.id + "|" + dx + "|" + dy
        if (seen.has(pk)) continue
        let fit = true
        for (const c of cs) {
          if (!index.has(ckey(c.x + dx, c.y + dy))) {
            fit = false
            break
          }
        }
        if (!fit) continue
        seen.add(pk)
        out.push({ orient: o.id, dx, dy })
      }
    }
  }
  return out
}

function solveCover(region: Cell[], orientations: Orientation[]): { placements: Placement[] | null; overflow: boolean } {
  const rows = placementsInRegion(region, orientations)
  if (rows.length === 0 || rows.length > ROW_CAP) return { placements: null, overflow: false }
  const index = indexRegion(region)
  const rowCells: number[][] = []
  for (const p of rows) {
    const idxs: number[] = []
    let ok = true
    for (const c of placementCells(p, orientations)) {
      const i = index.get(ckey(c.x, c.y))
      if (i === undefined) {
        ok = false
        break
      }
      idxs.push(i)
    }
    if (!ok) return { placements: null, overflow: false }
    rowCells.push(idxs)
  }
  const res = dlxSolve(region.length, rowCells, VISIT_CAP)
  if (res.overflow) return { placements: null, overflow: true }
  if (!res.rows) return { placements: null, overflow: false }
  return { placements: res.rows.map(i => rows[i]), overflow: false }
}

function squareRegion(s: number): Cell[] {
  const out: Cell[] = []
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) out.push({ x, y })
  }
  return out
}

function hexBall(r: number): Cell[] {
  const out: Cell[] = []
  for (let q = -r; q <= r; q++) {
    const lo = Math.max(-r, -q - r)
    const hi = Math.min(r, -q + r)
    for (let y = lo; y <= hi; y++) out.push({ x: q, y })
  }
  return out
}

function hexParallelogram(w: number, h: number): Cell[] {
  const out: Cell[] = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) out.push({ x, y })
  }
  return out
}

type RegionCand = { note: string; build: () => Cell[] }

function tilerRegions(grid: GridKind, n: number): RegionCand[] {
  const out: RegionCand[] = []
  if (grid === "square") {
    for (const s of [8, 10, 12, 14, 16, 20, 24, 28, 30]) {
      if ((s * s) % n === 0) {
        const size = s
        out.push({ note: "square region " + size + "x" + size + " (" + size * size + " cells)", build: () => squareRegion(size) })
      }
    }
  } else {
    for (let r = 3; r <= 9; r++) {
      const cnt = 3 * r * (r + 1) + 1
      if (cnt % n === 0) {
        const rad = r
        out.push({ note: "hex ball r=" + rad + " (" + cnt + " cells)", build: () => hexBall(rad) })
      }
    }
    if (out.length === 0) {
      for (const wh of [[12, 12], [16, 12], [20, 12], [24, 12], [20, 20]]) {
        const w = wh[0]
        const h = wh[1]
        if ((w * h) % n === 0) {
          out.push({ note: "hex parallelogram " + w + "x" + h + " (" + w * h + " cells)", build: () => hexParallelogram(w, h) })
        }
      }
    }
  }
  return out
}

function coronaSearch(grid: GridKind, orients: Orientation[], base: Cell[], maxDepth: number): Placement[][] {
  const uset = new Set<number>()
  for (const c of base) uset.add(ckey(c.x, c.y))
  const ucells = base.slice()
  const rings: Placement[][] = []
  for (let k = 1; k <= maxDepth; k++) {
    const d = diameterOf(grid, uset, ucells)
    const region = regionAround(grid, ucells, d + 1)
    if (region.length === 0) break
    const solved = solveCover(region, orients)
    if (solved.overflow || !solved.placements) break
    rings.push(solved.placements)
    for (const p of solved.placements) {
      for (const c of placementCells(p, orients)) {
        const k2 = ckey(c.x, c.y)
        if (!uset.has(k2)) {
          uset.add(k2)
          ucells.push(c)
        }
      }
    }
  }
  return rings
}

export function analyze(grid: GridKind, cells: Cell[], maxDepth?: number): CoronaResult {
  const t0 = Date.now()
  const norm = normalize(grid, cells)
  const orients = orientationsOf(grid, norm)
  const n = norm.length
  const depthCap = Math.min(Math.max(0, Math.floor(maxDepth ?? 4)), MAX_DEPTH_HARD_CAP)
  let tiler: boolean | null = null
  let tilingWitness: { placements: Placement[]; regionNote: string } | null = null
  if (n > 0) {
    const cands = tilerRegions(grid, n)
    let overflowed = false
    if (cands.length === 0) {
      tiler = null
    } else {
      for (const cand of cands) {
        const solved = solveCover(cand.build(), orients)
        if (solved.overflow) {
          overflowed = true
          continue
        }
        if (solved.placements) {
          tilingWitness = { placements: solved.placements, regionNote: cand.note }
          break
        }
      }
      tiler = tilingWitness ? true : overflowed ? null : false
    }
  }
  const rings = n > 0 && depthCap > 0 ? coronaSearch(grid, orients, norm, depthCap) : []
  return {
    grid,
    cells: norm,
    orientations: orients,
    tiler,
    tilingWitness,
    coronas: rings.length > 0 ? { depth: rings.length, rings } : null,
    depthReached: rings.length,
    maxDepthTried: depthCap,
    runtimeMs: Date.now() - t0,
  }
}

export function verifyWitness(grid: GridKind, cells: Cell[], coronas: { depth: number; rings: Placement[][] }): { ok: boolean; error?: string } {
  const err = (e: string): { ok: boolean; error: string } => ({ ok: false, error: e })
  const norm = normalize(grid, cells)
  const orients = orientationsOf(grid, norm)
  if (coronas.depth !== coronas.rings.length) return err("depth " + coronas.depth + " does not match rings length " + coronas.rings.length)
  const uset = new Set<number>()
  for (const c of norm) uset.add(ckey(c.x, c.y))
  const ucells = norm.slice()
  for (let k = 0; k < coronas.rings.length; k++) {
    const d = diameterOf(grid, uset, ucells)
    const region = regionAround(grid, ucells, d + 1)
    if (region.length === 0) return err("ring " + (k + 1) + ": empty region")
    const rset = new Set<number>()
    for (const c of region) rset.add(ckey(c.x, c.y))
    const cover = new Map<number, number>()
    for (const p of coronas.rings[k]) {
      if (!orients[p.orient]) return err("ring " + (k + 1) + ": unknown orientation id " + p.orient)
      for (const c of placementCells(p, orients)) {
        const kk = ckey(c.x, c.y)
        if (!rset.has(kk)) return err("ring " + (k + 1) + ": placement cell outside region")
        if (uset.has(kk)) return err("ring " + (k + 1) + ": placement overlaps previous union")
        cover.set(kk, (cover.get(kk) ?? 0) + 1)
      }
    }
    for (const c of region) {
      const cnt = cover.get(ckey(c.x, c.y)) ?? 0
      if (cnt !== 1) return err("ring " + (k + 1) + ": region cell covered " + cnt + " times")
    }
    if (cover.size !== region.length) return err("ring " + (k + 1) + ": covered cells outside region")
    for (const p of coronas.rings[k]) {
      for (const c of placementCells(p, orients)) {
        const kk = ckey(c.x, c.y)
        if (!uset.has(kk)) {
          uset.add(kk)
          ucells.push(c)
        }
      }
    }
  }
  return { ok: true }
}

export function makeCertificate(grid: GridKind, cells: Cell[], maxDepth: number): string {
  const res = analyze(grid, cells, maxDepth)
  return JSON.stringify({
    ENGINE_VERSION,
    grid,
    cells: res.cells,
    maxDepth: res.maxDepthTried,
    coronas: res.coronas,
    madeAt: new Date().toISOString(),
  })
}

export function makeTiler(grid: GridKind): Cell[] {
  void grid
  return [{ x: 0, y: 0 }, { x: 1, y: 0 }]
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const t = arr[i]
    arr[i] = arr[j]
    arr[j] = t
  }
}

export function huntNonTiler(grid: GridKind, size: number, seed?: number): Cell[] | null {
  if (size < 2) return null
  const cands = tilerRegions(grid, size)
  if (cands.length === 0) return null
  const region = cands[0].build()
  const rng = mulberry32(seed === undefined ? 1 : seed)
  const start = normalize(grid, [{ x: 0, y: 0 }])
  const seen = new Set<string>([keyOf(grid, start)])
  const queue: Cell[][] = [start]
  let tested = 0
  while (queue.length > 0 && tested < HUNT_BUDGET) {
    const cur = queue.shift()
    if (!cur) break
    if (cur.length === size) {
      tested++
      const orients = orientationsOf(grid, cur)
      const solved = solveCover(region, orients)
      if (!solved.overflow && !solved.placements) return cur
      continue
    }
    const curSet = new Set<number>()
    for (const c of cur) curSet.add(ckey(c.x, c.y))
    const exp: Cell[][] = []
    for (const c of cur) {
      for (const nb of cellNeighbors(grid, c)) {
        const k = ckey(nb.x, nb.y)
        if (curSet.has(k)) continue
        exp.push(normalize(grid, [...cur, nb]))
      }
    }
    shuffle(exp, rng)
    for (const e of exp) {
      const k = keyOf(grid, e)
      if (seen.has(k)) continue
      seen.add(k)
      queue.push(e)
    }
  }
  return null
}
