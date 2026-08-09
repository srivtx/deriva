#!/usr/bin/env python3
"""Debug runner: execute a problem's build+starter+solution, run its test code
with every `assert` individually labeled so the failing assertion is identified,
and show the labeled source line. Usage: python3 scripts/debug-problem.py <topic> <id>"""
import ast, json, subprocess, sys

bank = json.load(open("/tmp/deriva-bank.json"))
topic = next(t for t in bank if t["id"] == sys.argv[1])
p = next(x for x in topic["problems"] if x["id"] == int(sys.argv[2]))

setup = topic["buildCode"] or ""
prelude = p["starterCode"] + "\n\n" + p["solution"]

# run prelude once
ns = {}
r = subprocess.run([sys.executable, "-c", f"{setup}\n\n{prelude}", "ARGV"], capture_output=True, text=True, timeout=8)
print(f"== prelude rc={r.returncode}")
if r.stderr.strip():
    print(r.stderr.strip()[:500])

# label asserts in the test code
tree = ast.parse(p["testCode"])
counter = [0]
def walk(node):
    for n in ast.walk(node):
        if isinstance(n, ast.Assert) and n.test is not None:
            counter[0] += 1
            label = f"A{counter[0]}: {ast.unparse(n.test)}"
            n.test = ast.Call(
                func=ast.Name(id="_check", ctx=ast.Load()),
                args=[n.test, ast.Constant(label)],
                keywords=[],
            )
walk(tree)
mod = ast.Module(body=tree.body, type_ignores=[])
src = ast.unparse(mod)
checker = "_check = lambda cond, label: (lambda: (_ for _ in ()).throw(AssertionError(label)) )() if not cond else print('[ok]', label)\n"
full = f"{setup}\n\n{prelude}\n\n{checker}\n\n{src}"
r2 = subprocess.run([sys.executable, "-c", full], capture_output=True, text=True, timeout=8)
print("== test rc:", r2.returncode)
for line in r2.stdout.splitlines():
    print("   ", line)
if r2.stderr.strip():
    print(r2.stderr.strip()[:800])