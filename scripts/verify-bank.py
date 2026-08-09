#!/usr/bin/env python3
"""Audit Deriva's DSA problem bank: verify each problem's solution actually
passes its own test code (with topic build helpers preloaded), and cross-check
that starter functions, solution functions, and functions the tests call are
the same set with the same arity.
"""
import json, re, subprocess, sys

bank = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "/tmp/deriva-bank.json"))

FUNCRE = re.compile(r"^def\s+([A-Za-z_]\w*)\s*\(([^)]*)\)", re.M)
TESTCALL = re.compile(r"(?m)^\s*(?:assert|with|for|[A-Za-z_][\w.]*\s*=\s*|[A-Za-z_]\w*\([^)]*\))")

def funcs(code):
    return {m.group(1): [s.strip() for s in m.group(2).split(",") if s.strip()] for m in FUNCRE.finditer(code)}

def called_functions(test_code, known):
    out = set()
    for m in re.finditer(r"\b([A-Za-z_]\w*)\s*\(", test_code):
        if m.group(1) in known:
            out.add(m.group(1))
    return out

passed = 0
failed = []
timeouts = []
mismatch = []
uncovered = []

def called(code, known):
    return set(m.group(1) for m in re.finditer(r"\b([A-Za-z_]\w*)\s*\(", code) if m.group(1) in known)

for topic in bank:
    for p in topic["problems"]:
        f_starter = funcs(p["starterCode"])
        f_sol = funcs(p["solution"])
        try:
            src = "\n\n".join(filter(None, [topic["buildCode"], p["solution"], p["testCode"]]))
            r = subprocess.run([sys.executable, "-c", src], capture_output=True, text=True, timeout=8)
        except subprocess.TimeoutExpired:
            timeouts.append(f"{topic['id']}/{p['id']} {p['title']}")
            continue
        if r.returncode == 0:
            passed += 1
        else:
            err = r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "rc!=0"
            failed.append((f"{topic['id']}/{p['id']} {p['title']}", err))

        known = set(f_starter) | set(f_sol)
        needed = called(p["testCode"], known)
        for f in sorted(needed):
            if f not in f_starter:
                mismatch.append(f"{topic['id']}/{p['id']}: test calls '{f}' but starter never defines it")
            elif f_starter[f] != f_sol.get(f):
                mismatch.append(f"{topic['id']}/{p['id']}: arity {f} starter={len(f_starter[f])} sol={len(f_sol.get(f, []))}")
        if not f_starter:
            uncovered.append(f"{topic['id']}/{p['id']} (no functions parsed from starter)")

def called(code, known):
    return set(m.group(1) for m in re.finditer(r"\b([A-Za-z_]\w*)\s*\(", code) if m.group(1) in known)

total = sum(len(t["problems"]) for t in bank)
print(f"total problems: {total}")
print(f"solution passes its own tests: {passed}")
print(f"TIMEOUTS ({len(timeouts)}):")
for t in timeouts:
    print("  ", t)
print(f"FAILED ({len(failed)}):")
for f in failed[:40]:
    print("  ", f)
print(f"MISMATCHES ({len(mismatch)}):")
for m in mismatch[:40]:
    print("  ", m)
print(f"STARTER-UNPARSED ({len(uncovered)}):")
for u in uncovered[:20]:
    print("  ", u)