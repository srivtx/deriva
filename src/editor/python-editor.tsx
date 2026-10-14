"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  computeAutoIndent,
  indentSelection,
  handleSmartBackspace,
  toggleLineComment,
  formatPythonIndentation,
  getLineAndCol,
} from "./indent"

export interface PythonEditorProps {
  value: string
  onChange: (value: string) => void
  onRun?: () => void
  onReset?: () => void
  filename?: string
  language?: string
  status?: string
  errorLine?: number | null
  minHeight?: number | string
  readOnly?: boolean
  className?: string
  id?: string
  ariaLabel?: string
  showMobileBar?: boolean
}

const PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
}

const CLOSING = new Set([")", "]", "}", '"', "'"])

export function PythonEditor({
  value,
  onChange,
  onRun,
  onReset,
  filename = "solution.py",
  language = "Python 3.12",
  status = "Worker sandbox",
  errorLine = null,
  minHeight = 260,
  readOnly = false,
  className = "",
  id,
  ariaLabel = "Python code editor",
  showMobileBar = true,
}: PythonEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 })
  const [copied, setCopied] = useState(false)
  const [formatted, setFormatted] = useState(false)

  // Update cursor line and column
  const updateCursor = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    const pos = getLineAndCol(value, el.selectionStart)
    setCursorPos(pos)
  }, [value])

  // Sync scroll between textarea and line gutter
  const syncScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  // Handle all Python keyboard interactions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return
    const el = textareaRef.current
    if (!el) return

    const start = el.selectionStart
    const end = el.selectionEnd

    // 1. Run shortcut: Cmd+Enter (Mac) or Ctrl+Enter (Win/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      onRun?.()
      return
    }

    // 2. Comment toggle shortcut: Cmd+/ or Ctrl+/
    if ((e.metaKey || e.ctrlKey) && e.key === "/") {
      e.preventDefault()
      const res = toggleLineComment(value, start, end)
      onChange(res.newCode)
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = res.newStart
          textareaRef.current.selectionEnd = res.newEnd
          updateCursor()
        }
      })
      return
    }

    // 3. Tab and Shift+Tab (indent / dedent)
    if (e.key === "Tab") {
      e.preventDefault()
      const res = indentSelection(value, start, end, e.shiftKey)
      onChange(res.newCode)
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = res.newStart
          textareaRef.current.selectionEnd = res.newEnd
          updateCursor()
        }
      })
      return
    }

    // 4. Enter key: Auto-indentation
    if (e.key === "Enter") {
      e.preventDefault()
      const res = computeAutoIndent(value, start)
      const newCode = value.slice(0, start) + res.insertion + value.slice(end)
      onChange(newCode)
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const nextPos = start + res.cursorOffset
          textareaRef.current.selectionStart = nextPos
          textareaRef.current.selectionEnd = nextPos
          updateCursor()
        }
      })
      return
    }

    // 5. Backspace: Smart dedent & empty bracket pair deletion
    if (e.key === "Backspace" && start === end) {
      const smart = handleSmartBackspace(value, start)
      if (smart) {
        e.preventDefault()
        const deleteCount = smart.deletePair ? 1 : smart.deleteCount
        const endCut = smart.deletePair ? start + 1 : start
        const newCode = value.slice(0, start - deleteCount) + value.slice(endCut)
        onChange(newCode)
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            const nextPos = start - deleteCount
            textareaRef.current.selectionStart = nextPos
            textareaRef.current.selectionEnd = nextPos
            updateCursor()
          }
        })
        return
      }
    }

    // 6. Auto-close pairs & selection wrap
    if (PAIRS[e.key]) {
      const close = PAIRS[e.key]

      if (start !== end) {
        // Selection wrapping
        e.preventDefault()
        const selected = value.slice(start, end)
        const newCode = value.slice(0, start) + e.key + selected + close + value.slice(end)
        onChange(newCode)
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = start + 1
            textareaRef.current.selectionEnd = end + 1
            updateCursor()
          }
        })
        return
      }

      // If next char is already quote, step over
      if ((e.key === '"' || e.key === "'") && value[start] === e.key) {
        e.preventDefault()
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1
            updateCursor()
          }
        })
        return
      }

      // Avoid auto-closing single quote inside words (e.g. don't)
      if (e.key === "'" && start > 0 && /[a-zA-Z0-9]/.test(value[start - 1])) {
        return
      }

      e.preventDefault()
      const newCode = value.slice(0, start) + e.key + close + value.slice(end)
      onChange(newCode)
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1
          updateCursor()
        }
      })
      return
    }

    // 7. Step over closing character
    if (CLOSING.has(e.key) && start === end && value[start] === e.key) {
      e.preventDefault()
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1
          updateCursor()
        }
      })
      return
    }
  }

  // Quick insertion helpers for mobile / phone bar
  const insertSnippet = (snippet: string, cursorOffset?: number) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newCode = value.slice(0, start) + snippet + value.slice(end)
    onChange(newCode)
    requestAnimationFrame(() => {
      el.focus()
      const targetPos = start + (cursorOffset !== undefined ? cursorOffset : snippet.length)
      el.selectionStart = el.selectionEnd = targetPos
      updateCursor()
    })
  }

  const handleIndentBtn = (dedent = false) => {
    const el = textareaRef.current
    if (!el) return
    const res = indentSelection(value, el.selectionStart, el.selectionEnd, dedent)
    onChange(res.newCode)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = res.newStart
      el.selectionEnd = res.newEnd
      updateCursor()
    })
  }

  const handleFormat = () => {
    const formattedCode = formatPythonIndentation(value)
    onChange(formattedCode)
    setFormatted(true)
    setTimeout(() => setFormatted(false), 1500)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // fallback
    }
  }

  const lines = value.split("\n")

  return (
    <div className={`py-ed-container ${className}`}>
      {/* Top Bar */}
      <div className="py-ed-bar">
        <div className="py-ed-meta">
          <span className="py-ed-lang">{language}</span>
          <span className="py-ed-file">{filename}</span>
          <span className="py-ed-status">{status}</span>
          <span className="py-ed-cursor" aria-live="off">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
        </div>
        <div className="py-ed-actions">
          {onRun && (
            <button
              type="button"
              onClick={onRun}
              className="py-ed-btn py-ed-btn-run"
              title="Run code (⌘↵ or Ctrl+↵)"
              aria-label="Run code"
            >
              <span>▶</span> Run <kbd className="py-ed-kbd">⌘↵</kbd>
            </button>
          )}
          <button
            type="button"
            onClick={handleFormat}
            className="py-ed-btn"
            title="Clean indentation and trailing spaces"
            aria-label="Format code"
          >
            {formatted ? "✓ Formatted" : "Format"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="py-ed-btn"
            title="Copy code to clipboard"
            aria-label="Copy code"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="py-ed-btn"
              title="Reset code to starter code"
              aria-label="Reset code"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Editor Body with Line Numbers Gutter */}
      <div className="py-ed-body" style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}>
        <div
          ref={gutterRef}
          className="py-ed-gutter"
          aria-hidden="true"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1
            const isCursor = cursorPos.line === lineNum
            const isError = errorLine === lineNum
            return (
              <div
                key={lineNum}
                className={`py-ed-line-num${isCursor ? " active" : ""}${isError ? " error" : ""}`}
                title={isError ? `Error occurred on line ${lineNum}` : undefined}
              >
                {isError && <span className="py-ed-error-dot" />}
                {lineNum}
              </div>
            )
          })}
        </div>

        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={e => {
            onChange(e.target.value)
            updateCursor()
          }}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          onClick={updateCursor}
          onKeyUp={updateCursor}
          onSelect={updateCursor}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          readOnly={readOnly}
          className="py-ed-textarea"
          aria-label={ariaLabel}
        />
      </div>

      {/* Phone / Mobile Quick Keys Accessory Bar */}
      {showMobileBar && (
        <div className="py-ed-mobile-bar" aria-label="Quick code keys">
          <button type="button" onClick={() => handleIndentBtn(false)} className="py-key" title="Indent 4 spaces (Tab)">
            Tab
          </button>
          <button type="button" onClick={() => handleIndentBtn(true)} className="py-key" title="Dedent 4 spaces (Shift+Tab)">
            Dedent
          </button>
          <button type="button" onClick={() => insertSnippet(":")} className="py-key symbol">
            :
          </button>
          <button type="button" onClick={() => insertSnippet("()", 1)} className="py-key symbol">
            ( )
          </button>
          <button type="button" onClick={() => insertSnippet("[]", 1)} className="py-key symbol">
            [ ]
          </button>
          <button type="button" onClick={() => insertSnippet("{}", 1)} className="py-key symbol">
            {`{ }`}
          </button>
          <button type="button" onClick={() => insertSnippet('""', 1)} className="py-key symbol">
            &quot;&quot;
          </button>
          <button type="button" onClick={() => insertSnippet("''", 1)} className="py-key symbol">
            &apos;&apos;
          </button>
          <button type="button" onClick={() => insertSnippet("def ")} className="py-key kw">
            def
          </button>
          <button type="button" onClick={() => insertSnippet("return ")} className="py-key kw">
            return
          </button>
          <button type="button" onClick={() => insertSnippet("for ")} className="py-key kw">
            for
          </button>
          <button type="button" onClick={() => insertSnippet("if ")} className="py-key kw">
            if
          </button>
          <button type="button" onClick={() => insertSnippet("self.")} className="py-key kw">
            self.
          </button>
        </div>
      )}

      <style jsx>{`
        .py-ed-container {
          display: flex;
          flex-direction: column;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow-raised);
          font-family: var(--font-ui);
        }

        .py-ed-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--sp-1) var(--sp-3);
          background: var(--paper-raised);
          border-bottom: 1px solid var(--line);
          gap: var(--sp-2);
          flex-wrap: wrap;
        }

        .py-ed-meta {
          display: flex;
          align-items: center;
          gap: var(--sp-2);
          font-size: 11px;
        }

        .py-ed-lang {
          color: var(--accent);
          font-weight: 700;
          font-family: var(--font-mono);
          letter-spacing: -0.01em;
        }

        .py-ed-file {
          color: var(--ink-soft);
          font-family: var(--font-mono);
          font-size: 11px;
        }

        .py-ed-status {
          background: var(--accent-soft);
          color: var(--accent);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }

        .py-ed-cursor {
          color: var(--ink-soft);
          font-family: var(--font-mono);
          font-size: 10px;
          opacity: 0.8;
          margin-left: 4px;
        }

        .py-ed-actions {
          display: flex;
          align-items: center;
          gap: var(--sp-1);
        }

        .py-ed-btn {
          background: transparent;
          color: var(--ink-soft);
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 2px 7px;
          font-size: 11px;
          cursor: pointer;
          font-family: var(--font-ui);
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: background var(--dur-fast), color var(--dur-fast), border-color var(--dur-fast);
        }

        .py-ed-btn:hover {
          background: var(--paper);
          color: var(--ink);
          border-color: var(--line);
        }

        .py-ed-btn-run {
          background: var(--accent-soft);
          color: var(--accent);
          font-weight: 600;
          border-color: var(--accent);
        }

        .py-ed-btn-run:hover {
          background: var(--accent);
          color: var(--paper-raised);
        }

        .py-ed-kbd {
          font-family: var(--font-mono);
          font-size: 9px;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 3px;
          padding: 1px 3px;
          color: var(--ink);
          line-height: 1;
        }

        .py-ed-body {
          display: flex;
          position: relative;
          background: var(--paper);
          overflow: hidden;
          min-height: 260px;
          max-height: 520px;
        }

        .py-ed-gutter {
          flex-shrink: 0;
          width: 44px;
          padding: 12px 6px 12px 0;
          background: var(--paper-raised);
          border-right: 1px solid var(--line);
          user-select: none;
          overflow: hidden;
          text-align: right;
          font-family: var(--font-mono);
          font-size: 13px;
          line-height: 1.65;
          color: var(--ink-soft);
          opacity: 0.65;
        }

        .py-ed-line-num {
          position: relative;
          padding-right: 8px;
        }

        .py-ed-line-num.active {
          color: var(--accent);
          font-weight: 700;
          opacity: 1;
        }

        .py-ed-line-num.error {
          color: var(--viz-pruned);
          font-weight: 700;
          opacity: 1;
          background: var(--accent-soft);
        }

        .py-ed-error-dot {
          position: absolute;
          left: 4px;
          top: 6px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--viz-pruned);
        }

        .py-ed-textarea {
          flex: 1;
          background: var(--paper);
          color: var(--ink);
          border: none;
          outline: none;
          resize: none;
          padding: 12px 16px;
          font-family: var(--font-mono);
          font-size: 14px;
          line-height: 1.65;
          tab-size: 4;
          white-space: pre;
          overflow: auto;
          box-sizing: border-box;
        }

        .py-ed-mobile-bar {
          display: flex;
          align-items: center;
          gap: var(--sp-1);
          padding: var(--sp-1) var(--sp-2);
          background: var(--paper-raised);
          border-top: 1px solid var(--line);
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }

        .py-ed-mobile-bar::-webkit-scrollbar {
          display: none;
        }

        .py-key {
          flex-shrink: 0;
          height: 28px;
          padding: 0 8px;
          background: var(--paper);
          color: var(--ink);
          border: 1px solid var(--line);
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 11px;
          cursor: pointer;
          user-select: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background var(--dur-fast);
        }

        .py-key:hover, .py-key:active {
          background: var(--accent-soft);
          color: var(--accent);
          border-color: var(--accent);
        }

        .py-key.symbol {
          font-weight: 700;
        }

        .py-key.kw {
          color: var(--accent);
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .py-ed-bar {
            padding: var(--sp-1) var(--sp-2);
          }
          .py-ed-status, .py-ed-kbd {
            display: none;
          }
          .py-ed-textarea {
            font-size: 13px;
            padding: 10px 12px;
          }
          .py-ed-gutter {
            width: 36px;
            font-size: 12px;
            padding: 10px 4px 10px 0;
          }
        }
      `}</style>
    </div>
  )
}
