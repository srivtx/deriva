// Pure Python indentation, formatting, and key event helpers.
// Zero DOM dependencies — fully testable in Vitest.

export interface AutoIndentResult {
  insertion: string
  cursorOffset: number
}

export interface IndentSelectionResult {
  newCode: string
  newStart: number
  newEnd: number
}

export interface SmartBackspaceResult {
  deleteCount: number
  deletePair: boolean
}

export interface LineCommentResult {
  newCode: string
  newStart: number
  newEnd: number
}

export interface LineCol {
  line: number
  col: number
}

/**
 * Calculates line (1-indexed) and column (1-indexed) from cursor character offset.
 */
export function getLineAndCol(code: string, cursorIndex: number): LineCol {
  const bounded = Math.max(0, Math.min(cursorIndex, code.length))
  const slice = code.slice(0, bounded)
  const lines = slice.split("\n")
  const line = lines.length
  const col = (lines[lines.length - 1]?.length ?? 0) + 1
  return { line, col }
}

/**
 * Computes auto-indentation when Enter is pressed in Python code.
 * Rules:
 * 1. Preserves current line leading whitespace.
 * 2. Adds 4 spaces if line before cursor ends with a colon ':'.
 * 3. Expands brackets when Enter is pressed between '()', '[]', or '{}'.
 */
export function computeAutoIndent(code: string, cursorIndex: number): AutoIndentResult {
  const bounded = Math.max(0, Math.min(cursorIndex, code.length))
  const lastNewline = code.lastIndexOf("\n", bounded - 1)
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1
  const lineBeforeCursor = code.slice(lineStart, bounded)
  const leadingWhitespace = lineBeforeCursor.match(/^\s*/)?.[0] || ""

  // Check for bracket expansion between () [] {}
  if (bounded > 0 && bounded < code.length) {
    const charBefore = code[bounded - 1]
    const charAfter = code[bounded]
    const isBracketPair =
      (charBefore === "(" && charAfter === ")") ||
      (charBefore === "[" && charAfter === "]") ||
      (charBefore === "{" && charAfter === "}")

    if (isBracketPair) {
      const innerIndent = leadingWhitespace + "    "
      const insertion = "\n" + innerIndent + "\n" + leadingWhitespace
      const cursorOffset = 1 + innerIndent.length
      return { insertion, cursorOffset }
    }
  }

  // Check if line before cursor ends with colon (start of new block in Python)
  const trimmed = lineBeforeCursor.trim()
  let extraIndent = ""
  if (trimmed.endsWith(":")) {
    extraIndent = "    "
  }

  const nextIndent = leadingWhitespace + extraIndent
  const insertion = "\n" + nextIndent
  return { insertion, cursorOffset: insertion.length }
}

/**
 * Indents or dedents the selection (or single cursor line).
 * Tab indents by 4 spaces.
 * Shift+Tab dedents by up to 4 spaces per line.
 */
export function indentSelection(
  code: string,
  start: number,
  end: number,
  dedent = false,
): IndentSelectionResult {
  const boundedStart = Math.max(0, Math.min(start, code.length))
  const boundedEnd = Math.max(boundedStart, Math.min(end, code.length))

  // If no selection and indenting (normal Tab): insert 4 spaces at cursor
  if (boundedStart === boundedEnd && !dedent) {
    const newCode = code.slice(0, boundedStart) + "    " + code.slice(boundedEnd)
    return {
      newCode,
      newStart: boundedStart + 4,
      newEnd: boundedStart + 4,
    }
  }

  // Spanned lines across selection (or single line if dedenting at cursor)
  const lastNewline = code.lastIndexOf("\n", boundedStart - 1)
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1
  let lineEnd = code.indexOf("\n", boundedEnd)
  if (lineEnd === -1) lineEnd = code.length

  const chunk = code.slice(lineStart, lineEnd)
  const lines = chunk.split("\n")

  if (dedent) {
    let firstLineRemoved = 0
    let totalRemoved = 0

    const newLines = lines.map((line, idx) => {
      let removeCount = 0
      if (line.startsWith("    ")) removeCount = 4
      else if (line.startsWith("\t")) removeCount = 1
      else {
        const match = line.match(/^ +/)
        if (match) removeCount = Math.min(match[0].length, 4)
      }
      if (idx === 0) firstLineRemoved = removeCount
      totalRemoved += removeCount
      return line.slice(removeCount)
    })

    const replacement = newLines.join("\n")
    const newCode = code.slice(0, lineStart) + replacement + code.slice(lineEnd)
    const newStart = Math.max(lineStart, boundedStart - firstLineRemoved)
    const newEnd = Math.max(newStart, boundedEnd - totalRemoved)
    return { newCode, newStart, newEnd }
  } else {
    // Multiline indent
    const newLines = lines.map(line => "    " + line)
    const replacement = newLines.join("\n")
    const newCode = code.slice(0, lineStart) + replacement + code.slice(lineEnd)
    const newStart = boundedStart + 4
    const newEnd = boundedEnd + lines.length * 4
    return { newCode, newStart, newEnd }
  }
}

/**
 * Handles smart backspace:
 * 1. If cursor is preceded only by spaces on current line, deletes up to 4 spaces to reach previous tab stop.
 * 2. If cursor is between empty matching pair () [] {} "" '', deletes both.
 */
export function handleSmartBackspace(
  code: string,
  cursorIndex: number,
): SmartBackspaceResult | null {
  if (cursorIndex <= 0 || cursorIndex > code.length) return null

  const lastNewline = code.lastIndexOf("\n", cursorIndex - 1)
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1
  const lineBeforeCursor = code.slice(lineStart, cursorIndex)

  // Empty matching pair check: () [] {} "" ''
  if (cursorIndex < code.length) {
    const charBefore = code[cursorIndex - 1]
    const charAfter = code[cursorIndex]
    const isPair =
      (charBefore === "(" && charAfter === ")") ||
      (charBefore === "[" && charAfter === "]") ||
      (charBefore === "{" && charAfter === "}") ||
      (charBefore === '"' && charAfter === '"') ||
      (charBefore === "'" && charAfter === "'")

    if (isPair) {
      return { deleteCount: 1, deletePair: true }
    }
  }

  // Preceded only by spaces: smart dedent to tab stop
  if (lineBeforeCursor.length > 0 && /^ +$/.test(lineBeforeCursor)) {
    const col = lineBeforeCursor.length
    const deleteCount = col % 4 === 0 ? 4 : col % 4
    if (deleteCount > 0) {
      return { deleteCount, deletePair: false }
    }
  }

  return null
}

/**
 * Toggles '#' comment on all lines touched by the selection.
 * If all non-empty lines are commented, uncomments them.
 * Otherwise comments them.
 */
export function toggleLineComment(
  code: string,
  start: number,
  end: number,
): LineCommentResult {
  const boundedStart = Math.max(0, Math.min(start, code.length))
  const boundedEnd = Math.max(boundedStart, Math.min(end, code.length))

  const lastNewline = code.lastIndexOf("\n", boundedStart - 1)
  const lineStart = lastNewline === -1 ? 0 : lastNewline + 1
  let lineEnd = code.indexOf("\n", boundedEnd)
  if (lineEnd === -1) lineEnd = code.length

  const chunk = code.slice(lineStart, lineEnd)
  const lines = chunk.split("\n")

  const allCommented = lines.every(
    line => line.trim().length === 0 || line.trimStart().startsWith("#"),
  )

  const newLines = lines.map(line => {
    if (allCommented) {
      return line.replace(/^(\s*)# ?/, "$1")
    } else {
      if (line.trim().length === 0) return line
      return line.replace(/^(\s*)/, "$1# ")
    }
  })

  const replacement = newLines.join("\n")
  const newCode = code.slice(0, lineStart) + replacement + code.slice(lineEnd)
  const newStart = lineStart
  const newEnd = lineStart + replacement.length

  return { newCode, newStart, newEnd }
}

/**
 * Formats Python indentation:
 * - Converts tabs to 4 spaces
 * - Strips trailing whitespace on each line
 * - Ensures file ends with a single newline
 */
export function formatPythonIndentation(code: string): string {
  const lines = code.split("\n")
  const formatted = lines.map(line => {
    // Convert tabs to 4 spaces
    const tabExpanded = line.replace(/\t/g, "    ")
    // Trim right trailing spaces
    return tabExpanded.trimEnd()
  })

  const result = formatted.join("\n").trimEnd()
  return result ? result + "\n" : ""
}

/**
 * Extracts line number from Python error / traceback output.
 * If setupLines is provided, subtracts setup lines to report the student line.
 */
export function extractErrorLine(output: string, setupLines = 0): number | null {
  if (!output) return null

  // Matches Python traceback: File "...", line 12 or line 12, in ...
  const matches = [...output.matchAll(/(?:File "[^"]+", line (\d+)|line (\d+), in |SyntaxError:.*line (\d+)|AssertionError at line (\d+))/gi)]
  if (!matches.length) {
    // Fallback: look for any "line <number>"
    const simple = [...output.matchAll(/\bline (\d+)\b/gi)]
    if (!simple.length) return null
    const last = simple[simple.length - 1]
    const rawLine = parseInt(last[1], 10)
    if (isNaN(rawLine)) return null
    const studentLine = rawLine - setupLines
    return studentLine > 0 ? studentLine : null
  }

  const lastMatch = matches[matches.length - 1]
  const rawNum = lastMatch[1] || lastMatch[2] || lastMatch[3] || lastMatch[4]
  const rawLine = parseInt(rawNum, 10)
  if (isNaN(rawLine)) return null

  const studentLine = rawLine - setupLines
  return studentLine > 0 ? studentLine : null
}
