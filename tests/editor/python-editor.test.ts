import { describe, it, expect } from "vitest"
import {
  computeAutoIndent,
  indentSelection,
  handleSmartBackspace,
  toggleLineComment,
  formatPythonIndentation,
  extractErrorLine,
  getLineAndCol,
} from "../../src/editor/indent"

describe("Python auto-indentation and editor helpers", () => {
  describe("getLineAndCol", () => {
    it("returns line 1, col 1 for start of file", () => {
      expect(getLineAndCol("def solve():\n    return 1", 0)).toEqual({ line: 1, col: 1 })
    })

    it("returns correct line and col inside line 2", () => {
      const code = "def solve():\n    return 1"
      // "def solve():\n" has 13 chars. Index 17 is col 5 of line 2.
      expect(getLineAndCol(code, 17)).toEqual({ line: 2, col: 5 })
    })
  })

  describe("computeAutoIndent", () => {
    it("adds 4 spaces after a function definition ending with colon", () => {
      const code = "def twoSum(nums, target):"
      const res = computeAutoIndent(code, code.length)
      expect(res.insertion).toBe("\n    ")
      expect(res.cursorOffset).toBe(5)
    })

    it("adds an additional 4 spaces after an indented if/for ending with colon", () => {
      const code = "def solve():\n    if not root:"
      const res = computeAutoIndent(code, code.length)
      expect(res.insertion).toBe("\n        ")
      expect(res.cursorOffset).toBe(9)
    })

    it("preserves existing indentation on normal statements", () => {
      const code = "def solve():\n    total = 0"
      const res = computeAutoIndent(code, code.length)
      expect(res.insertion).toBe("\n    ")
      expect(res.cursorOffset).toBe(5)
    })

    it("expands brackets when Enter is pressed between ()", () => {
      const code = "def solve():\n    arr = ()"
      const cursor = code.length - 1 // between '(' and ')'
      const res = computeAutoIndent(code, cursor)
      expect(res.insertion).toBe("\n        \n    ")
      // Cursor should be on the inner line after the 8 spaces
      expect(res.cursorOffset).toBe(9)
    })

    it("expands brackets when Enter is pressed between []", () => {
      const code = "res = []"
      const cursor = 7 // between '[' and ']'
      const res = computeAutoIndent(code, cursor)
      expect(res.insertion).toBe("\n    \n")
      expect(res.cursorOffset).toBe(5)
    })
  })

  describe("indentSelection", () => {
    it("inserts 4 spaces when pressing Tab with single cursor", () => {
      const code = "x = 1"
      const res = indentSelection(code, 0, 0, false)
      expect(res.newCode).toBe("    x = 1")
      expect(res.newStart).toBe(4)
      expect(res.newEnd).toBe(4)
    })

    it("indents multiple lines when pressing Tab on a selection", () => {
      const code = "a = 1\nb = 2"
      const res = indentSelection(code, 0, code.length, false)
      expect(res.newCode).toBe("    a = 1\n    b = 2")
    })

    it("dedents 4 spaces when pressing Shift+Tab on indented lines", () => {
      const code = "    a = 1\n    b = 2"
      const res = indentSelection(code, 0, code.length, true)
      expect(res.newCode).toBe("a = 1\nb = 2")
    })

    it("dedents up to 4 spaces when line has fewer than 4 spaces", () => {
      const code = "  a = 1"
      const res = indentSelection(code, 0, code.length, true)
      expect(res.newCode).toBe("a = 1")
    })
  })

  describe("handleSmartBackspace", () => {
    it("deletes 4 spaces when cursor is at 4 spaces indentation", () => {
      const code = "    "
      const res = handleSmartBackspace(code, 4)
      expect(res).toEqual({ deleteCount: 4, deletePair: false })
    })

    it("deletes 4 spaces when cursor is at 8 spaces indentation", () => {
      const code = "        "
      const res = handleSmartBackspace(code, 8)
      expect(res).toEqual({ deleteCount: 4, deletePair: false })
    })

    it("deletes remainder spaces if not a full tab stop", () => {
      const code = "   " // 3 spaces
      const res = handleSmartBackspace(code, 3)
      expect(res).toEqual({ deleteCount: 3, deletePair: false })
    })

    it("deletes matching pair when cursor is between empty brackets ()", () => {
      const code = "()"
      const res = handleSmartBackspace(code, 1)
      expect(res).toEqual({ deleteCount: 1, deletePair: true })
    })

    it("deletes matching pair when cursor is between empty quotes \"\"", () => {
      const code = '""'
      const res = handleSmartBackspace(code, 1)
      expect(res).toEqual({ deleteCount: 1, deletePair: true })
    })

    it("returns null when not at indent boundary and not in pair", () => {
      const code = "x = 1"
      const res = handleSmartBackspace(code, 3)
      expect(res).toBeNull()
    })
  })

  describe("toggleLineComment", () => {
    it("adds # comment preserving indentation", () => {
      const code = "    ans = 42"
      const res = toggleLineComment(code, 0, code.length)
      expect(res.newCode).toBe("    # ans = 42")
    })

    it("uncomments if lines are already commented", () => {
      const code = "    # ans = 42"
      const res = toggleLineComment(code, 0, code.length)
      expect(res.newCode).toBe("    ans = 42")
    })
  })

  describe("formatPythonIndentation", () => {
    it("expands tabs and trims trailing spaces", () => {
      const raw = "\tdef foo():   \n\t\treturn 1   "
      const formatted = formatPythonIndentation(raw)
      expect(formatted).toBe("    def foo():\n        return 1\n")
    })
  })

  describe("extractErrorLine", () => {
    it("extracts line from Python traceback", () => {
      const tb = `Traceback (most recent call last):
  File "<exec>", line 6, in <module>
  File "<exec>", line 3, in twoSum
AssertionError: expected [0, 1]`
      expect(extractErrorLine(tb)).toBe(3)
    })

    it("extracts line accounting for setupLines offset", () => {
      const tb = `File "<exec>", line 10, in solve`
      // setup had 5 lines
      expect(extractErrorLine(tb, 5)).toBe(5)
    })

    it("returns null if no line info is found", () => {
      expect(extractErrorLine("All tests passed!")).toBeNull()
    })
  })
})
