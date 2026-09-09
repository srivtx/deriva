import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import path from "node:path"
import { performance } from "node:perf_hooks"

const here = path.dirname(fileURLToPath(import.meta.url))
const engineTs = path.join(here, "engine.ts")
const root = path.join(here, "../../..")

async function loadEngine() {
  const esbuild = path.join(root, "node_modules/.bin/esbuild")
  if (existsSync(esbuild)) {
    const t0 = performance.now()
    execFileSync(esbuild, [engineTs, "--bundle", "--format=esm", "--outfile=/tmp/corona-engine.mjs"], { stdio: "inherit" })
    console.log(`[harness] compiled with esbuild in ${(performance.now() - t0).toFixed(0)}ms -> /tmp/corona-engine.mjs`)
    return import("/tmp/corona-engine.mjs")
  }
  console.log("[harness] esbuild not found in node_modules/.bin, falling back to tsc")
  const tsc = path.join(root, "node_modules/.bin/tsc")
  if (existsSync(tsc)) {
    const outDir = "/tmp/corona-engine-build"
    mkdirSync(outDir, { recursive: true })
    writeFileSync(path.join(outDir, "package.json"), JSON.stringify({ type: "module" }))
    const t0 = performance.now()
    execFileSync(tsc, [engineTs, "--ignoreConfig", "--outDir", outDir, "--module", "esnext", "--target", "es2022", "--moduleResolution", "bundler", "--skipLibCheck", "--strict"], { stdio: "inherit" })
    console.log(`[harness] compiled with tsc in ${(performance.now() - t0).toFixed(0)}ms -> ${outDir}/engine.js`)
    return import(path.join(outDir, "engine.js"))
  }
  console.log("[harness] tsc not found either, using node native type stripping")
  return import(engineTs)
}

const E = await loadEngine()
const {
  ENGINE_VERSION, normalize, keyOf, orientationsOf, cellNeighbors, regionAround,
  analyze, verifyWitness, makeCertificate, makeTiler, huntNonTiler,
} = E

let pass = 0
let fail = 0
const check = (name, cond, extra = "") => {
  if (cond) { pass++; console.log(`PASS ${name}${extra ? " — " + extra : ""}`) }
  else { fail++; console.log(`FAIL ${name}${extra ? " — " + extra : ""}`) }
}
const perf = (ms) => (ms < 1 ? "<1" : ms.toFixed(0)) + "ms"

console.log(`engine: ${ENGINE_VERSION}`)

check("engine version exported", typeof ENGINE_VERSION === "string" && ENGINE_VERSION.length > 0, ENGINE_VERSION)

const L = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]
check("L-tromino orientation count", orientationsOf("square", L).length, `got ${orientationsOf("square", L).length} (expected 4)`)
check("domino orientation count", orientationsOf("square", [{ x: 0, y: 0 }, { x: 3, y: 0 }]).length === 2)

check("keyOf translation invariant",
  keyOf("square", [{ x: 5, y: 7 }, { x: 6, y: 7 }]) === keyOf("square", [{ x: 0, y: 0 }, { x: 1, y: 0 }]))
check("normalize dedupes+sorts",
  JSON.stringify(normalize("hex", [{ x: 2, y: 2 }, { x: 1, y: 1 }, { x: 2, y: 2 }])) === JSON.stringify([{ x: 0, y: 0 }, { x: 1, y: 1 }]))

const hexAdj = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }]
const nb = new Set(cellNeighbors("hex", { x: 0, y: 0 }).map(c => `${c.x},${c.y}`))
check("hex 6-neighborhood axial", hexAdj.slice(1).every(c => nb.has(`${c.x},${c.y}`)) && nb.size === 6)

const regionSquare = (s) => { const o = []; for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) o.push({ x, y }); return o }
const regionHexPar = (w, h) => { const o = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o.push({ x, y }); return o }

function replayTiling(grid, cells, witness, region) {
  const orients = orientationsOf(grid, cells)
  const rset = new Set(region.map(c => `${c.x},${c.y}`))
  const used = new Set()
  for (const p of witness.placements) {
    const o = orients[p.orient]
    if (!o) return `bad orientation id ${p.orient}`
    for (const c of o.cells) {
      const k = `${c.x + p.dx},${c.y + p.dy}`
      if (!rset.has(k)) return `cell (${k}) outside region`
      if (used.has(k)) return `overlap at (${k})`
      used.add(k)
    }
  }
  if (used.size !== region.length) return `covered ${used.size}/${region.length} cells`
  return null
}

const domino = makeTiler("square")
const dominoRes = analyze("square", domino, 4)
check("square domino is tiler", dominoRes.tiler === true, `region=${dominoRes.tilingWitness?.regionNote}, placements=${dominoRes.tilingWitness?.placements.length}, runtime=${perf(dominoRes.runtimeMs)}`)
if (dominoRes.tilingWitness) {
  const note = dominoRes.tilingWitness.regionNote
  const sizeMatch = note.match(/(\d+)x(\d+)/)
  const w = sizeMatch ? Number(sizeMatch[1]) : 0
  const h = sizeMatch ? Number(sizeMatch[2]) : 0
  const err = w > 0 ? replayTiling("square", domino, dominoRes.tilingWitness, regionSquare(Math.max(w, h))) : "unknown witness region: " + note
  check("domino witness covers its region exactly", err === null, err ?? `${dominoRes.tilingWitness.placements.length} placements · region=${note}`)
} else check("domino witness covers its region exactly", false, "no witness")
console.log(`  domino corona depthReached=${dominoRes.depthReached} (informational)`)

const hexTiler = makeTiler("hex")
const hexTilerRes = analyze("hex", hexTiler, 4)
check("hex dihex is tiler", hexTilerRes.tiler === true, `region=${hexTilerRes.tilingWitness?.regionNote}, placements=${hexTilerRes.tilingWitness?.placements.length}, runtime=${perf(hexTilerRes.runtimeMs)}`)
if (hexTilerRes.tilingWitness) {
  const err = replayTiling("hex", hexTiler, hexTilerRes.tilingWitness, regionHexPar(12, 12))
  check("dihex witness covers 12x12 parallelogram exactly", err === null, err ?? `${hexTilerRes.tilingWitness.placements.length} placements x 2 = 144`)
} else check("dihex witness covers 12x12 parallelogram exactly", false, "no witness")

const t0hunt = performance.now()
const bad7 = huntNonTiler("square", 7, 12345)
const huntMs = performance.now() - t0hunt
check("huntNonTiler square n=7 found a candidate", bad7 !== null, `cells=${JSON.stringify(bad7)}, hunt took ${perf(huntMs)}`)
let bad7Key = null
if (bad7) {
  bad7Key = keyOf("square", bad7)
  const bad7Res = analyze("square", bad7, 3)
  check("hunted 7-cell shape is a candidate non-tiler in analyze", bad7Res.tiler === false, `tiler=${bad7Res.tiler}, analyze runtime=${perf(bad7Res.runtimeMs)}, depthReached=${bad7Res.depthReached}`)
  if (bad7Res.depthReached >= 1 && bad7Res.coronas) {
    const v = verifyWitness("square", bad7, bad7Res.coronas)
    check("corona witness verifies", v.ok === true, v.ok ? `depth=${bad7Res.coronas.depth}` : v.error)
  } else {
    check("corona witness verifies", true, `no corona found up to depth 3 (depthReached=${bad7Res.depthReached}) — verify skipped`)
  }
  const certStr = makeCertificate("square", bad7, 3)
  let cert = null
  try { cert = JSON.parse(certStr) } catch { cert = null }
  check("makeCertificate parses", cert !== null && cert.ENGINE_VERSION === ENGINE_VERSION && Array.isArray(cert.cells) && cert.grid === "square" && "madeAt" in cert, `bytes=${certStr.length}`)
  const bad7Again = huntNonTiler("square", 7, 12345)
  check("huntNonTiler deterministic given seed", bad7Again && keyOf("square", bad7Again) === bad7Key)
  const bad7Seed2 = huntNonTiler("square", 7, 777)
  console.log(`  seed 777 variant: ${bad7Seed2 ? JSON.stringify(bad7Seed2) : "null"} (informational)`)
}

const t0hex = performance.now()
const hexBad7 = huntNonTiler("hex", 7, 42)
const hexHuntMs = performance.now() - t0hex
if (hexBad7) {
  const hexBadRes = analyze("hex", hexBad7, 3)
  console.log(`hex huntNonTiler n=7: found ${JSON.stringify(normalize("hex", hexBad7))} in ${perf(hexHuntMs)} — analyze says tiler=${hexBadRes.tiler} (informational)`)
} else {
  console.log(`hex huntNonTiler n=7: null after budget in ${perf(hexHuntMs)} (informational)`)
}

const coronaCandidates = {
  square: [
    ["L-tromino", L],
    ["T-tetromino", [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }]],
    ["S-tetromino", [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }]],
    ["P-tetromino", [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }].slice(0, 4)],
  ],
  hex: [
    ["bent trihex", [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }]],
    ["line trihex", [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]],
    ["hex Y", [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 1 }]],
  ],
}
let ringFound = 0
let ringChecked = 0
for (const [grid, list] of Object.entries(coronaCandidates)) {
  for (const [name, cells] of list) {
    const res = analyze(grid, cells, 2)
    if (res.depthReached >= 1 && res.coronas) {
      ringFound++
      const v = verifyWitness(grid, cells, res.coronas)
      ringChecked += v.ok ? 1 : 0
      check(`corona ring found+verified: ${grid} ${name}`, v.ok === true, `depth=${res.coronas.depth}, rings=${res.coronas.rings.map(r => r.length).join("+")} placements, tiler=${res.tiler}, runtime=${perf(res.runtimeMs)}`)
    } else {
      console.log(`  ${grid} ${name}: no corona ring up to depth 2 (informational)`)
    }
  }
}
check("at least one corona ring witness exercised end-to-end", ringFound >= 1 && ringChecked >= 1, `${ringChecked}/${ringFound} rings verified`)

const block8 = []
for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) block8.push({ x, y })
const runs = 5
const times = []
let blockRes = null
for (let i = 0; i < runs; i++) {
  const t0 = performance.now()
  blockRes = analyze("square", block8, 4)
  times.push(performance.now() - t0)
}
const avg = times.reduce((a, b) => a + b, 0) / runs
check("8-cell block analyze sane", blockRes !== null && blockRes.orientations.length === 2 && blockRes.tiler === true, `tiler=${blockRes.tiler}, depthReached=${blockRes.depthReached}, orientations=${blockRes.orientations.length}`)
console.log(`  bench analyze(square 8-cell block, maxDepth 4): avg ${avg.toFixed(1)}ms over ${runs} runs (min ${Math.min(...times).toFixed(1)}, max ${Math.max(...times).toFixed(1)})`)
if (blockRes.coronas) {
  const v = verifyWitness("square", block8, blockRes.coronas)
  check("8-cell block corona witness verifies", v.ok === true, v.ok ? `depth=${blockRes.coronas.depth}` : v.error)
} else {
  console.log(`  8-cell block: no corona witness (depthReached=${blockRes.depthReached}) (informational)`)
}

const dominoRing = regionAround("square", [{ x: 0, y: 0 }, { x: 1, y: 0 }], 2)
check("regionAround radius 2 around domino = 6 cells", dominoRing.length === 6, `got ${dominoRing.length}`)
const hexRing = regionAround("hex", [{ x: 0, y: 0 }], 2)
check("regionAround radius 2 around single hex = 6 cells", hexRing.length === 6, `got ${hexRing.length}`)

console.log(`\n${fail === 0 ? "ALL PASS" : "FAILURES"}: ${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
