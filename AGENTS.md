# Deriva — Agent Guide

**Deriva** is an interactive platform for learning DSA through first-principles
derivation. The curriculum is the product; software serves the curriculum.

## Read first (in order)

The `docs/` suite is the constitution. Before any task, read:

1. `docs/01-product-requirements.md` — what we're building and non-goals
2. `docs/02-learning-philosophy.md` — why it works
3. `docs/03-curriculum-design-rules.md` — binding content laws (A1–E)
4. `docs/05-system-architecture.md` — the trace-is-the-product architecture
5. `docs/06-folder-structure.md` — where things live + boundary rules

Others as needed: 04 (curriculum content), 07 (tech decisions), 08 (persistence),
09 (design system), 10 (roadmap).

## Non-negotiables

- **Concepts → Reasoning → Patterns → Implementation.** Code is always Stage 6.
- Every problem follows the 9-stage flow (01 §5). Every stage teaches exactly one
  thinking-move (Rule A1).
- Naive solutions are taught before optimized ones wherever a contrast exists (Rule A3).
- Every visualization is a pure function of (trace, cursor). The viz layer never
  executes code.
- Lessons are typed, zod-validated data — curriculum errors are build errors.
- Conceptual understanding beats feature count, always.
- Python (Pyodide in a Web Worker) is the execution language.

## Conventions

- Folder boundary rules in `docs/06` are enforced by lint; respect them.
- Design tokens in `src/design-system/tokens.css` are the only allowed colors/spacing
  (see `docs/09`); arbitrary hex in components is a lint error.
- New tech decisions are appended to `docs/07` as D-records with rationale.
- When work touches anything described in `docs/`, update the corresponding doc in the
  same change.
