"use client";
import { useState } from "react";
import { COMMANDS, filterCommands } from "./commands";

export function Composer({ onSubmit, onCmd, onStop, running }: {
  onSubmit: (t: string) => void;
  onCmd: (action: string) => void;
  onStop: () => void;
  running: boolean;
}) {
  const [text, setText] = useState("");
  const slashOpen = text.startsWith("/") && !text.slice(1).includes(" ");
  const matches = slashOpen ? filterCommands(text) : [];
  const [sel, setSel] = useState(0);

  const runCmd = (i: number) => {
    const c = matches[i] ?? matches[0];
    if (!c) return;
    onCmd(c.action);
    setText("");
  };

  return (
    <div className="composer">
      {slashOpen && matches.length > 0 && (
        <div className="slash-palette">
          {matches.map((c, i) => (
            <div
              key={c.cmd}
              className={"slash-row" + (i === sel ? " sel" : "")}
              onMouseDown={(e) => {
                e.preventDefault();
                runCmd(i);
              }}
            >
              <span className="sc-cmd">{c.cmd}</span>
              <span className="sc-desc">{c.desc}</span>
            </div>
          ))}
        </div>
      )}
      <textarea
        className="textarea"
        value={text}
        placeholder={running ? "agent running — STOP first to send" : "tell the rig what to do — press / for commands"}
        onChange={(e) => {
          setText(e.target.value);
          setSel(0);
        }}
        onKeyDown={(e) => {
          if (slashOpen) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, matches.length - 1));
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
              return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
              e.preventDefault();
              runCmd(sel);
              return;
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setText("");
              return;
            }
          }
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (text.trim()) {
              onSubmit(text.trim());
              setText("");
            }
          }
        }}
      />
      {running ? (
        <button
          className="btn danger stop"
          onClick={() => {
            navigator.vibrate?.(10);
            onStop();
          }}
        >
          STOP
        </button>
      ) : (
        <button
          className="btn send"
          disabled={!text.trim()}
          onClick={() => {
            if (text.trim()) {
              onSubmit(text.trim());
              setText("");
            }
          }}
        >
          SEND
        </button>
      )}
    </div>
  );
}

export { COMMANDS };
