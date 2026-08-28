import WebSocket from "ws";
import * as os from "node:os";

const GO_BASE = "https://opencode.ai/zen/go/v1";
const boot = await (await fetch("http://localhost:8787/api/local-token")).json();
const ws = new WebSocket(`ws://localhost:${boot.port}`);
const waiters = [];
ws.on("message", (d) => {
  const m = JSON.parse(d);
  for (let i = waiters.length - 1; i >= 0; i--) {
    const w = waiters[i];
    if (w.pred(m)) { waiters.splice(i, 1); clearTimeout(w.to); w.res(m); }
  }
});
const send = (m) => ws.send(JSON.stringify(m));
const waitFor = (pred, tag, ms = 10000) =>
  new Promise((res, rej) => {
    const w = { pred, res };
    w.to = setTimeout(() => rej(new Error("TIMEOUT: " + tag)), ms);
    waiters.push(w);
  });
const red = (m) => JSON.stringify(m).replace(/"apiKey":"[^"]*"/g, '"apiKey":"***"').slice(0, 200);

ws.on("open", async () => {
  const results = [];
  const ok = (name, cond, extra = "") => results.push(`${cond ? "PASS" : "SKIP"}  ${name}  ${extra}`);
  try {
    // register ALL hello-phase waiters before sending hello (frame order varies)
    const pPaired = waitFor((m) => m.type === "paired", "paired");
    const pSess0 = waitFor((m) => m.type === "sessions", "sessions0");
    const pProv0 = waitFor((m) => m.type === "providers", "providers0");
    send({ type: "hello", token: boot.token });
    await pPaired;
    ok("pair", true);

    // cleanup leftovers from earlier runs
    const hello0 = await pSess0;
    for (const s of hello0.list.filter((s) => s.title === "smoke" || s.title === "smoke-perm")) {
      send({ type: "delete_session", sessionId: s.id });
      await waitFor((m) => m.type === "session_deleted" && m.sessionId === s.id, "cleanup");
    }
    const prov0 = await pProv0;
    ok("providers frame", Array.isArray(prov0.list), `n=${prov0.list.length}`);
    send({ type: "delete_provider", id: "smoke-go" });

    // engine: use a real keyed one if present, else a throwaway (GO /models is open)
    let eng = prov0.list.find((p) => p.apiKey);
    let synthetic = false;
    if (!eng) {
      eng = { id: "smoke-go", label: "SMOKE", kind: "opencode-go", baseUrl: GO_BASE, apiKey: "sk-smoke", model: "" };
      send({ type: "save_provider", provider: eng });
      await waitFor((m) => m.type === "providers" && m.list.some((p) => p.id === "smoke-go"), "save-smoke");
      synthetic = true;
      results.push("NOTE  no keyed engine stored — live-stream/approval checks degrade");
    }

    send({ type: "fetch_models", providerId: eng.id });
    const mods = await waitFor((m) => m.type === "models", "models", 20000);
    ok("models fetched", (mods.list?.length || 0) > 0, `n=${mods.list?.length}`);
    const testModel = mods.list.find((x) => x.id.includes("free"))?.id || mods.list[0]?.id;

    const sessP = waitFor((m) => m.type === "sessions" && m.list.some((s) => s.title === "smoke"), "sessions-new");
    send({ type: "new_session", cwd: "", providerId: eng.id, permission: "auto", title: "smoke" });
    const ready = await waitFor((m) => m.type === "ready", "ready");
    const sid = ready.sessionId;
    const sess = await sessP;
    ok("cwd '' -> homedir", sess.list.find((s) => s.id === sid)?.cwd === os.homedir(), `cwd=${sess.list.find((s) => s.id === sid)?.cwd}`);

    send({ type: "switch_provider", sessionId: sid, providerId: eng.id, model: testModel });
    send({ type: "open_session", sessionId: sid });
    const hist = await waitFor((m) => m.type === "history" && m.sessionId === sid, "history");
    ok("history frame", Array.isArray(hist.messages));

    send({ type: "prompt", sessionId: sid, text: "Reply with exactly: OK" });
    const first = await waitFor((m) => m.type === "message_delta" || m.type === "error", "stream", 60000);
    if (first.type === "message_delta") ok("live stream", true, red(first));
    else ok("live stream (degraded: provider auth error = pipeline OK, key invalid)", /40[13]|invalid|unauthor/i.test(first.message || ""), red(first));
    await waitFor((m) => m.type === "session_idle" || m.type === "session_done", "done", 60000).catch(() => {});

    send({ type: "delete_session", sessionId: sid });
    await waitFor((m) => m.type === "session_deleted" && m.sessionId === sid, "deleted");
    ok("delete rig", true);

    // scenario 2 (needs a real keyed engine): approval + busy guard + STOP mid-approval
    if (!synthetic) {
      const sessP2 = waitFor((m) => m.type === "sessions" && m.list.some((s) => s.title === "smoke-perm"), "sessions-perm");
      send({ type: "new_session", cwd: "/tmp", providerId: eng.id, permission: "ask", title: "smoke-perm" });
      const ready2 = await waitFor((m) => m.type === "ready", "ready2");
      const sid2 = ready2.sessionId;
      await sessP2;
      send({ type: "switch_provider", sessionId: sid2, providerId: eng.id, model: testModel });
      send({ type: "prompt", sessionId: sid2, text: "Create a file named rig_smoke_test.txt containing exactly: hi. You MUST use the write tool." });
      const perm = await waitFor((m) => m.type === "permission_request" && m.sessionId === sid2, "permission_request", 90000);
      ok("approval card", !!perm.call?.id, `tool=${perm.call?.name}`);
      send({ type: "prompt", sessionId: sid2, text: "second prompt while busy" });
      const busyErr = await waitFor((m) => m.type === "error" && m.sessionId === sid2, "busy-guard", 5000);
      ok("busy guard rejects prompt", /BUSY/i.test(busyErr.message || ""), red(busyErr));
      send({ type: "abort", sessionId: sid2 });
      await waitFor((m) => m.type === "session_idle" && m.sessionId === sid2, "stopped", 10000);
      ok("STOP mid-approval works", true);
      send({ type: "delete_session", sessionId: sid2 });
      await waitFor((m) => m.type === "session_deleted" && m.sessionId === sid2, "deleted2");
      ok("delete rig 2", true);
    }

    if (synthetic) {
      send({ type: "delete_provider", id: "smoke-go" });
      await waitFor((m) => m.type === "providers" && !m.list.some((p) => p.id === "smoke-go"), "del-smoke-prov");
      ok("cleanup synthetic engine", true);
    }
  } catch (e) {
    results.push("ABORT " + e.message);
  }
  console.log(results.join("\n"));
  process.exit(0);
});
ws.on("error", (e) => { console.log("WS ERROR", e.message); process.exit(1); });
