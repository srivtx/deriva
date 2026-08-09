#!/usr/bin/env node
// Strip types from each data file, then import the problem arrays and dump
// them as plain JSON for the Python verifier (scripts/verify-bank.py).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { pathToFileURL } from "node:url"
import ts from "typescript"

const DATA = join(process.cwd(), "src/data")
const files = readFileSync(join(DATA, "index.ts"), "utf8")
const headers = files.matchAll(/^import \{ .*? \} from "\.\/([a-z-]+)"/gm)
const mods = [...headers].map(m => m[1])
const bank = []

for (const mod of mods) {
  if (mod === "patterns" || mod === "lld" || mod === "system-design") continue
  const src = readFileSync(join(DATA, `${mod}.ts`), "utf8")
  const compiled = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
  }).outputText
  const tmp = `/tmp/deriva-mod-${mod}.mjs`
  writeFileSync(tmp, compiled)
  const key = mod === "bit-manipulation" ? "PROBLEMS_BIT" : `PROBLEMS_${mod.toUpperCase().replace("-", "_")}`
  const mod2 = await import(pathToFileURL(tmp).href)
  const problems = mod2[key]
  bank.push({
    id: mod,
    buildCode: mod2[`${mod === "advanced-trees" ? "AT" : mod === "bit-manipulation" ? "BIT" : mod.toUpperCase().replace("-", "_")}BUILD`] ?? findBuild(mod2, mod),
    problems: problems.map((p) => ({
      id: p.id, title: p.title, pattern: p.pattern, skill: p.skill,
      statement: p.statement, examples: p.examples, why: p.why, hints: p.hints,
      starterCode: p.starterCode, solution: p.solution, testCode: p.testCode,
      starterFunctions: matchFuncs(p.starterCode),
    })),
  })
}

function findBuild(mod2, mod) {
  // build helper exports vary: buildTreeCode, linkedListHelperCode, bstBuildCode, buildTrieCode, buildHeapCode
  const keys = Object.keys(mod2).filter((k) => /(build|helper).*code/i.test(k) && k !== "PROBLEMS")
  return keys.length ? mod2[keys[0]] : ""
}

function matchFuncs(code) {
  const re = /^def (\w+)\(([^)]*)\)/gm
  const out = []
  let m
  while ((m = re.exec(code))) {
    const params = m[2].split(",").map((s) => s.trim()).filter(Boolean)
    // only bare names (drop default/value annotations)
    out.push({ name: m[1], arity: params.filter((s) => /^[a-zA-Z_]/.exec(s)).length })
  }
  return out
}

mkdirSync("/tmp", { recursive: true })
writeFileSync("/tmp/deriva-bank.json", JSON.stringify(bank, null, 1))
writeFileSync(join("/tmp", "deriva-bank.json"), JSON.stringify(bank))
console.log(`dumped ${bank.length} topics, ${bank.reduce((a, t) => a + t.problems.length, 0)} problems`)