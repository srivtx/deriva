// Project 1 — Data Contract Lab (system-ai/ml-projects-plan.md Phase 2).
// L1–L5 fully authored: row contract → dedup+provenance → group-safe split →
// incremental ingest+dead letters → rebuildable release. The learner builds the
// release that every later project loads by ID.

import { defineProject } from "../../../schema/project"

export default defineProject({
  id: "document-intelligence",
  number: 1,
  family: "Data systems",
  title: "Data Contract Lab",
  pitch: "Build a versioned, validated document dataset from raw rows.",
  userStory:
    "A document classifier cannot learn from a row with no stable identity, empty text, " +
    "absent label, or evaluation reservation. This project turns 30 messy rows into a " +
    "release later projects load by ID.",
  prerequisites: [],
  artifactInputs: [],
  levels: [
    {
      status: "authored",
      id: "l1-row-contract",
      number: 1,
      title: "Row Contract & Validator",
      durationMinutes: 12,
      thinkingMove: "make one row trustworthy",
      purpose:
        "A single function decides whether a raw row may enter the training release, " +
        "with one stable reason per rejection — before any dataset, split, or model exists.",
      dependencies: [],
      relatedQuestionIds: ["DATA-001", "DATA-004", "DATA-005"],
      relatedLessonIds: ["ai-ml/00-data-contract/what-counts-as-training-data"],
      kind: "data",
      spec: {
        brief:
          "A document classifier cannot learn from a row with no stable identity, empty " +
          "text, absent label, or evaluation reservation. Implement the validator that " +
          "decides whether a raw row may enter the training release. Never silently " +
          "discard a row.",
        requiredApi: `def validate_row(row, reserved_ids=None):
    return (ok, reason)`,
        behavior: [
          "row must be a dictionary",
          "id must be a non-empty string",
          "text must be a non-empty trimmed string",
          "label must be present and allowed (bug, question, feature)",
          "reserved evaluation IDs are rejected before training",
          "every rejection has exactly one stable reason",
          "the input row is never mutated",
        ],
        constraints: [
          "reasons are fixed strings: malformed, missing-id, missing-text, unknown-label, missing-label, reserved",
          "a valid row returns (True, None)",
        ],
        examples: [
          { id: "ex1", given: "valid row", result: "(True, None)" },
          { id: "ex2", given: "row with '   ' text", result: "(False, 'missing-text')" },
          { id: "ex3", given: "row without a label", result: "(False, 'missing-label')" },
          { id: "ex4", given: "row reserved for evaluation", result: "(False, 'reserved')" },
        ],
      },
      designQuestion: {
        question: "Before the editor: which check must run FIRST so that later checks never see broken input?",
        options: [
          { label: "Is the row even a dictionary?", value: "shape" },
          { label: "Is the label allowed?", value: "label" },
          { label: "Is the id reserved?", value: "reserved" },
        ],
        correct: "shape",
        explanation: "A non-dict row has no .get at all — the shape check guards every other clause.",
      },
      implementation: {
        entryPoint: "validate_row",
        starter: `def validate_row(row, reserved_ids=None):
    # row: any value that arrived as a raw record.
    # reserved_ids: set of ids already reserved for the held-out set (or None).
    # Emit evidence as you decide (the trace will replay it):
    #   __deriva_emit("data.accept", rowId=0)
    #   __deriva_emit("data.reject", rowId=0, reason="missing-label")
    # Return (ok, reason) — ok is True only when every clause passes.
    # Your contract (you designed it in the gate):
    #   shape -> id -> text -> label -> reserved. One stable reason.

`,
        visibleTests: [
          { name: "valid row", call: "list(validate_row({'id': 'r01', 'text': 'hi', 'label': 'bug'}))", expect: [true, null], invariant: "a complete row must be accepted" },
          { name: "empty text", call: "list(validate_row({'id': 'r02', 'text': '   ', 'label': 'bug'}))", expect: [false, "missing-text"], invariant: "whitespace is not text — the model would learn from nothing" },
          { name: "missing label", call: "list(validate_row({'id': 'r03', 'text': 'hi', 'label': None}))", expect: [false, "missing-label"], invariant: "a row without an answer cannot be trained on" },
          { name: "non-dict row", call: "list(validate_row(['not', 'a', 'dict']))", expect: [false, "malformed"], invariant: "a list is not a row — shape guards every later clause" },
          { name: "reserved id", call: "list(validate_row({'id': 'eval-104', 'text': 'hi', 'label': 'bug'}, reserved_ids={'eval-104'}))", expect: [false, "reserved"], invariant: "training on the exam invalidates every later metric" },
        ],
        hiddenTestCases: [
          { name: "whitespace-only id", call: "list(validate_row({'id': '  ', 'text': 'hi', 'label': 'bug'}))", expect: [false, "missing-id"], invariant: "a blank id has no stable identity" },
          { name: "unknown label", call: "list(validate_row({'id': 'r04', 'text': 'hi', 'label': 'spam'}))", expect: [false, "unknown-label"], invariant: "labels not in the contract are invalid values, not new classes" },
          { name: "non-string id", call: "list(validate_row({'id': 123, 'text': 'hi', 'label': 'bug'}))", expect: [false, "missing-id"], invariant: "an id must be a string to be comparable and versionable" },
          { name: "reserved row otherwise valid", call: "list(validate_row({'id': 'eval-101', 'text': 'pagination resets', 'label': 'bug'}, reserved_ids={'eval-101', 'eval-104'}))", expect: [false, "reserved"], invariant: "reservation wins even when every other clause passes" },
        ],
        hints: [
          { level: 1, type: "question", text: "What is the FIRST thing a row must be before it has a .get method at all?" },
          { level: 2, type: "question", text: "Which two fields make a row trainable, and which of them also needs a fixed vocabulary?" },
          { level: 3, type: "question", text: "After all quality clauses pass, what single check still stands between the row and training?" },
          { level: 4, type: "assertion", text: "check shape (dict), then id (non-empty str), then text (non-empty trimmed str), then label (allowed set), then reserved_ids — return the first failing reason" },
        ],
        solution: `def validate_row(row, reserved_ids=None):
    if not isinstance(row, dict):
        __deriva_emit("data.reject", rowId=0, reason="malformed")
        return (False, "malformed")
    if not isinstance(row.get("id"), str) or not row["id"].strip():
        __deriva_emit("data.reject", rowId=0, reason="missing-id")
        return (False, "missing-id")
    if not isinstance(row.get("text"), str) or not row["text"].strip():
        __deriva_emit("data.reject", rowId=0, reason="missing-text")
        return (False, "missing-text")
    if row.get("label") is None:
        __deriva_emit("data.reject", rowId=0, reason="missing-label")
        return (False, "missing-label")
    if row["label"] not in ("bug", "question", "feature"):
        __deriva_emit("data.reject", rowId=0, reason="unknown-label")
        return (False, "unknown-label")
    if reserved_ids and row["id"] in reserved_ids:
        __deriva_emit("data.reject", rowId=0, reason="reserved")
        return (False, "reserved")
    __deriva_emit("data.accept", rowId=0)
    return (True, None)
`,
      },
      fixtureId: "tickets-30-l1",
      trace: { fixtureId: "tickets-30-l1", budget: 300 },
      artifact: {
        title: "Row contract",
        fields: [
          { name: "required_fields", label: "Required fields per row", required: true },
          { name: "allowed_labels", label: "Allowed labels", required: true },
          { name: "reserved_policy", label: "Reserved-ID policy", required: true },
        ],
        reflectionQuestion: "Why must the reserved row be rejected before training?",
        outputs: ["row-contract"],
      },
      failureDrill: {
        prompt: "Run the tests with a validator that silently skips bad rows instead of rejecting them. What evidence tells you the contract broke?",
        expectedObservation: "The rejected lists are empty and the accepted count is wrong — a silent skip hides the data problem instead of surfacing a reason.",
      },
      exitGate: {
        question: "Which failure would invalidate every later metric, and is prevented by this level?",
        options: [
          { label: "The reserved row training — the evaluation set is no longer an exam", value: "leak" },
          { label: "A short text making the dataset smaller", value: "size" },
          { label: "A duplicate id slowing training down", value: "slow" },
        ],
        correct: "leak",
        explanation: "One leaked row contaminates the entire evidence chain — prevention at the row level is the only cure.",
      },
    },
    {
      status: "authored",
      id: "l2-dedup-provenance",
      number: 2,
      title: "Deduplication + Provenance",
      durationMinutes: 15,
      thinkingMove: "normalize before you dedupe",
      purpose:
        "Exact and near duplicates silently double-count rows. The learner builds a " +
        "deterministic first-occurrence-wins deduper that records provenance for every " +
        "rejection — order-stable and explainable.",
      dependencies: ["row-contract"],
      relatedQuestionIds: ["DATA-002", "DATA-003"],
      relatedLessonIds: ["ai-ml/00-data-contract/what-counts-as-training-data"],
      kind: "data",
      spec: {
        brief:
          "The 30 rows contain exact duplicates and near-duplicates (case and whitespace " +
          "differences). Implement dedupe_rows that keeps the first occurrence under a " +
          "NORMALIZED key and records provenance: which row each duplicate came from.",
        requiredApi: `def dedupe_rows(rows):
    return [accepted, rejected, provenance]`,
        behavior: [
          "the duplicate key is normalized (text stripped and lowercased, label as-is)",
          "the first occurrence under each key survives",
          "rejected is a list of (index, reason) with reason 'duplicate'",
          "provenance maps a rejected index to 'duplicate-of:<first index>'",
          "the result order follows the input order",
          "rows already rejected by the row contract are not accepted here",
        ],
        constraints: [
          "rejected entries carry the ORIGINAL index in the input list",
          "provenance has an entry for every duplicate rejection",
          "no mutation of the input rows",
        ],
        examples: [
          { id: "ex1", given: "[r05, r23] with identical text", result: "r05 accepted, r23 rejected (duplicate-of:0)" },
          { id: "ex2", given: "'Sorting ...' vs '  SORTING ...'", result: "same key — second is a duplicate" },
        ],
      },
      designQuestion: {
        question: "Before the editor: what should the duplicate key be, exactly?",
        options: [
          { label: "The raw text and label", value: "raw" },
          { label: "Trimmed + lowercased text with the label", value: "normalized" },
          { label: "The row id only", value: "id" },
        ],
        correct: "normalized",
        explanation: "Normalization makes near-duplicates equal; raw text misses them and ids make everything unique.",
      },
      implementation: {
        entryPoint: "dedupe_rows",
        starter: `def dedupe_rows(rows):
    # rows: list of already-validated row dicts.
    # Emit evidence as you decide:
    #   __deriva_emit("data.accept", rowId=i)
    #   __deriva_emit("data.reject", rowId=i, reason="duplicate")
    # Return [accepted, rejected, provenance] where rejected is a list of
    # (index, reason) tuples and provenance maps index -> "duplicate-of:<first>".
    # Your contract (from the gate): normalized key, first occurrence wins.

`,
        visibleTests: [
          { name: "no duplicates", call: "dedupe_rows([{'id': 'a', 'text': 'hi', 'label': 'bug'}, {'id': 'b', 'text': 'bye', 'label': 'question'}])", expect: [[{ "id": "a", "text": "hi", "label": "bug" }, { "id": "b", "text": "bye", "label": "question" }], [], {}], invariant: "distinct rows must all survive" },
          { name: "exact duplicate", call: "dedupe_rows([{'id': 'a', 'text': 'hi', 'label': 'bug'}, {'id': 'b', 'text': 'hi', 'label': 'bug'}])", expect: [[{ "id": "a", "text": "hi", "label": "bug" }], [[1, "duplicate"]], { 1: "duplicate-of:0" }], invariant: "the first occurrence wins and provenance names it" },
          { name: "normalized duplicate", call: "dedupe_rows([{'id': 'a', 'text': '  Hi ', 'label': 'bug'}, {'id': 'b', 'text': 'hi', 'label': 'bug'}])", expect: [[{ "id": "a", "text": "  Hi ", "label": "bug" }], [[1, "duplicate"]], { 1: "duplicate-of:0" }], invariant: "case and whitespace are the same document" },
          { name: "same text different label", call: "dedupe_rows([{'id': 'a', 'text': 'hi', 'label': 'bug'}, {'id': 'b', 'text': 'hi', 'label': 'question'}])", expect: [[{ "id": "a", "text": "hi", "label": "bug" }, { "id": "b", "text": "hi", "label": "question" }], [], {}], invariant: "the key is text AND label — different answers mean different rows" },
          { name: "empty input", call: "dedupe_rows([])", expect: [[], [], {}], invariant: "an empty dataset is a valid dataset" },
        ],
        hiddenTestCases: [
          { name: "three-way duplicate", call: "dedupe_rows([{'id': 'a', 'text': 'x', 'label': 'bug'}, {'id': 'b', 'text': 'x', 'label': 'bug'}, {'id': 'c', 'text': 'x', 'label': 'bug'}])", expect: [[{ "id": "a", "text": "x", "label": "bug" }], [[1, "duplicate"], [2, "duplicate"]], { 1: "duplicate-of:0", 2: "duplicate-of:0" }], invariant: "every later copy points at the first, and only the first" },
          { name: "mixed punctuation", call: "dedupe_rows([{'id': 'a', 'text': 'Refresh twice!', 'label': 'bug'}, {'id': 'b', 'text': 'refresh twice', 'label': 'bug'}])", expect: [[{ "id": "a", "text": "Refresh twice!", "label": "bug" }], [[1, "duplicate"]], { 1: "duplicate-of:0" }], invariant: "normalization removes the whitespace difference — punctuation stays part of the key" },
          { name: "label differs by case only", call: "dedupe_rows([{'id': 'a', 'text': 'hi', 'label': 'Bug'}, {'id': 'b', 'text': 'hi', 'label': 'bug'}])", expect: [[{ "id": "a", "text": "hi", "label": "Bug" }, { "id": "b", "text": "hi", "label": "bug" }], [], {}], invariant: "labels are compared exactly — case variants are not the same label" },
        ],
        hints: [
          { level: 1, type: "question", text: "What makes two rows 'the same' for training — raw bytes or their meaning?" },
          { level: 2, type: "question", text: "Where does the first occurrence's index come from, and what must you remember about it?" },
          { level: 3, type: "question", text: "Which structure lets you look up a key and remember the first index at once?" },
          { level: 4, type: "assertion", text: "walk with enumerate; key = (text.strip().lower(), label); if key in seen → reject with 'duplicate-of:<seen[key]>', else seen[key] = i and accept" },
        ],
        solution: `def dedupe_rows(rows):
    accepted = []
    rejected = []
    provenance = {}
    seen = {}
    for i, row in enumerate(rows):
        key = (row["text"].strip().lower(), row["label"])
        if key in seen:
            __deriva_emit("data.reject", rowId=i, reason="duplicate")
            rejected.append((i, "duplicate"))
            provenance[i] = "duplicate-of:" + str(seen[key])
        else:
            seen[key] = i
            __deriva_emit("data.accept", rowId=i)
            accepted.append(row)
    return [accepted, rejected, provenance]
`,
      },
      fixtureId: "tickets-30-l2",
      trace: { fixtureId: "tickets-30-l2", budget: 300 },
      artifact: {
        title: "Dedup report",
        fields: [
          { name: "normalization_rule", label: "Duplicate key normalization rule", required: true },
          { name: "survivor_rule", label: "Which occurrence survives", required: true },
        ],
        reflectionQuestion: "Why does keeping the first occurrence (instead of the last) make the dataset reproducible?",
        outputs: ["dedup-report"],
      },
      failureDrill: {
        prompt: "Run the tests with a deduper that uses the raw text as the key. Which near-duplicate slips through, and what does it double-count?",
        expectedObservation: "'Sorting ...' and '  SORTING ...' survive as two rows — the same document is counted twice, biasing every label frequency.",
      },
      exitGate: {
        question: "What does the provenance map give the next level that a plain rejected-count would not?",
        options: [
          { label: "A chain from every duplicate back to the row it duplicated", value: "chain" },
          { label: "A faster dataset", value: "speed" },
          { label: "A prettier report", value: "pretty" },
        ],
        correct: "chain",
        explanation: "Provenance makes deduplication auditable — lineage that later projects can rebuild from.",
      },
    },
    {
      status: "authored",
      id: "l3-group-safe-split",
      number: 3,
      title: "Group-Safe Split",
      durationMinutes: 18,
      thinkingMove: "split by group, never by row",
      purpose:
        "A row-level split lets the same author appear in train and test, so the model " +
        "memorizes authors instead of learning. The learner builds a deterministic, " +
        "group-safe train/validation/test splitter.",
      dependencies: ["row-contract", "dedup-report"],
      relatedQuestionIds: ["DATA-006", "DATA-007", "THEORY-006"],
      relatedLessonIds: ["ai-ml/00-data-contract/split-the-evidence"],
      kind: "data",
      spec: {
        brief:
          "Tickets arrive from four authors. A row-level split would let 'chen' appear " +
          "in both train and test. Implement split_dataset that assigns WHOLE groups to " +
          "one split, deterministically, with a seeded shuffle.",
        requiredApi: `def split_dataset(rows, ratios, group_key, seed):
    return {"train": [...], "validation": [...], "test": [...]}`,
        behavior: [
          "rows are grouped by group_key (the author field)",
          "no group appears in more than one split",
          "every row is assigned exactly once",
          "split sizes follow the ratios approximately",
          "the same seed produces the identical split every time",
          "ratios must sum to 1",
        ],
        constraints: [
          "group membership is decided by hashing the group value with the seed",
          "a group is never split across boundaries",
          "the input rows are not mutated",
        ],
        examples: [
          { id: "ex1", given: "ratios [0.7, 0.15, 0.15], group_key 'author'", result: "each author fully in one split" },
          { id: "ex2", given: "seed 42 twice", result: "identical train/validation/test" },
        ],
      },
      designQuestion: {
        question: "Before the editor: what is the unit of assignment — the row or the group?",
        options: [
          { label: "The group — whole authors stay together", value: "group" },
          { label: "The row — finer control", value: "row" },
          { label: "The label — balance classes", value: "label" },
        ],
        correct: "group",
        explanation: "Only whole-group assignment prevents an author from leaking across splits.",
      },
      implementation: {
        entryPoint: "split_dataset",
        starter: `def split_dataset(rows, ratios, group_key, seed):
    # rows: list of validated row dicts.
    # ratios: [train, validation, test] summing to 1.
    # group_key: field name (e.g. "author") that defines a source group.
    # Emit evidence as you decide:
    #   __deriva_emit("data.split", rowId=i, split="train")
    # Return {"train": [...], "validation": [...], "test": [...]}.
    # Your contract (from the gate): assign whole groups, deterministically.

`,
        visibleTests: [
          { name: "sums to all rows", call: "sum(len(v) for v in split_dataset([{'id': 'a', 'author': 'ana'}, {'id': 'b', 'author': 'brian'}], [0.7, 0.15, 0.15], 'author', 42).values())", expect: 2, invariant: "every row lands in exactly one split" },
          { name: "group never crosses", call: "[g for g in ['ana', 'brian'] if sum(1 for s in split_dataset([{'id': 'a', 'author': 'ana'}, {'id': 'b', 'author': 'brian'}, {'id': 'c', 'author': 'ana'}], [0.7, 0.15, 0.15], 'author', 7).values() for r in s if r['author'] == g)]", expect: [], invariant: "no author may appear in two splits" },
          { name: "deterministic seed", call: "split_dataset([{'id': 'a', 'author': 'ana'}, {'id': 'b', 'author': 'brian'}, {'id': 'c', 'author': 'chen'}], [0.7, 0.15, 0.15], 'author', 42) == split_dataset([{'id': 'a', 'author': 'ana'}, {'id': 'b', 'author': 'brian'}, {'id': 'c', 'author': 'chen'}], [0.7, 0.15, 0.15], 'author', 42)", expect: true, invariant: "same seed must reproduce the identical split" },
          { name: "empty input", call: "split_dataset([], [0.7, 0.15, 0.15], 'author', 1)", expect: { "train": [], "validation": [], "test": [] }, invariant: "an empty dataset splits cleanly" },
        ],
        hiddenTestCases: [
          { name: "many groups stay atomic", call: "len({next(iter(s))['author'] for s in ({'t': split_dataset([{'id': str(i), 'author': 'a' + str(i)} for i in range(9)], [0.7, 0.15, 0.15], 'author', 99)['train']} | {})})", expect: 0, invariant: "single-row groups are still assigned wholly" },
          { name: "different seed changes the split", call: "split_dataset([{'id': 'a', 'author': 'ana'}, {'id': 'b', 'author': 'brian'}, {'id': 'c', 'author': 'chen'}], [0.7, 0.15, 0.15], 'author', 1) != split_dataset([{'id': 'a', 'author': 'ana'}, {'id': 'b', 'author': 'brian'}, {'id': 'c', 'author': 'chen'}], [0.7, 0.15, 0.15], 'author', 2)", expect: true, invariant: "a different seed must shuffle the assignment" },
        ],
        hints: [
          { level: 1, type: "question", text: "What object do you hash first — the row or its author?" },
          { level: 2, type: "question", text: "How do you turn a hash into a bucket, and what must the bucket boundaries add up to?" },
          { level: 3, type: "question", text: "Where does the seed enter so the same inputs always land in the same buckets?" },
          { level: 4, type: "assertion", text: "hash the group value with the seed, map into cumulative ratio buckets, and append the whole group to that split" },
        ],
        solution: `def split_dataset(rows, ratios, group_key, seed):
    buckets = {"train": [], "validation": [], "test": []}
    for row in rows:
        bucket = "train"
        h = (hash((row[group_key], seed)) % 1000) / 1000
        cum = 0.0
        for name, ratio in zip(buckets, ratios):
            cum += ratio
            if h < cum:
                bucket = name
                break
        buckets[bucket].append(row)
        __deriva_emit("data.split", rowId=len(buckets[bucket]) - 1, split=bucket)
    return buckets
`,
      },
      fixtureId: "tickets-30-l3",
      trace: { fixtureId: "tickets-30-l3", budget: 300 },
      artifact: {
        title: "Split policy",
        fields: [
          { name: "group_key", label: "Group key used", required: true },
          { name: "ratios", label: "Train/validation/test ratios", required: true },
          { name: "no_crossing_rule", label: "How groups are kept atomic", required: true },
        ],
        reflectionQuestion: "What would happen to the evaluation set if a single author leaked across train and test?",
        outputs: ["split-policy"],
      },
      failureDrill: {
        prompt: "Run the tests with a splitter that assigns rows directly to buckets. Which test fails, and what is the leaked evidence?",
        expectedObservation: "The 'group never crosses' test fails: one author lands in train AND test — the model could memorize their writing style.",
      },
      exitGate: {
        question: "Why must the split be deterministic before any experiment runs on it?",
        options: [
          { label: "So two runs can be compared without the split changing underneath them", value: "comparable" },
          { label: "So the code runs faster", value: "speed" },
          { label: "So the author names are hidden", value: "names" },
        ],
        correct: "comparable",
        explanation: "A moving split makes every comparison meaningless — reproducibility starts at the split.",
      },
    },
    {
      status: "authored",
      id: "l4-incremental-ingest",
      number: 4,
      title: "Incremental Ingest + Dead Letters",
      durationMinutes: 20,
      thinkingMove: "commit only what is durable",
      purpose:
        "New rows arrive in batches and a crash must not duplicate or lose work. The " +
        "learner builds a cursor-based ingest that resumes, rejects bad rows with " +
        "reasons, and never re-commits what is already durable.",
      dependencies: ["dedup-report", "split-policy"],
      relatedQuestionIds: ["DATA-009", "DATA-010", "QUEUE-002"],
      relatedLessonIds: ["ai-ml/03-experiments/reproducibility-is-part-of-correctness"],
      kind: "data",
      spec: {
        brief:
          "Batches of new tickets arrive after the release is built. Implement " +
          "ingest_batch that advances a cursor, rejects malformed or duplicate rows into " +
          "a dead-letter list, and never re-commits rows the state already holds.",
        requiredApi: `def ingest_batch(state, batch):
    return [state, report]`,
        behavior: [
          "state holds cursor and the set of committed row ids",
          "a row whose id is already committed is rejected as 'duplicate'",
          "malformed rows are rejected with a reason, never skipped silently",
          "the cursor advances past every row in the batch",
          "replaying the same batch produces the same report (idempotent)",
          "the report carries accepted and rejected counts",
        ],
        constraints: [
          "rejected entries are (row_id, reason) tuples",
          "state and report are plain dicts/lists — JSON-safe",
          "committed ids are never forgotten",
        ],
        examples: [
          { id: "ex1", given: "batch with two rows, cursor 0", result: "cursor 2, both accepted" },
          { id: "ex2", given: "same batch again", result: "both rejected as 'duplicate', cursor unchanged" },
        ],
      },
      designQuestion: {
        question: "Before the editor: when the same batch is sent twice, what must the second call do?",
        options: [
          { label: "Reject already-committed ids and commit nothing twice", value: "idempotent" },
          { label: "Commit everything again", value: "again" },
          { label: "Skip the batch entirely", value: "skip" },
        ],
        correct: "idempotent",
        explanation: "Idempotency is the only behavior safe under retries — the second send must be a no-op.",
      },
      implementation: {
        entryPoint: "ingest_batch",
        starter: `def ingest_batch(state, batch):
    # state: {"cursor": int, "committed": {row_id: True}}
    # batch: list of row dicts, each with an "id".
    # Emit evidence as you decide:
    #   __deriva_emit("data.accept", rowId=i)
    #   __deriva_emit("data.reject", rowId=i, reason="duplicate")
    # Return [new_state, report] where report is
    # {"accepted": int, "rejected": [[row_id, reason], ...], "cursor": int}.
    # Your contract (from the gate): never commit twice, never lose a row.

`,
        visibleTests: [
          { name: "first batch", call: "ingest_batch({'cursor': 0, 'committed': {}}, [{'id': 'a', 'text': 'hi', 'label': 'bug'}, {'id': 'b', 'text': 'bye', 'label': 'question'}])", expect: [{ "cursor": 2, "committed": { "a": true, "b": true } }, { "accepted": 2, "rejected": [], "cursor": 2 }], invariant: "fresh rows commit and the cursor advances" },
          { name: "replay is a no-op", call: "ingest_batch({'cursor': 2, 'committed': {'a': True, 'b': True}}, [{'id': 'a', 'text': 'hi', 'label': 'bug'}, {'id': 'b', 'text': 'bye', 'label': 'question'}])", expect: [{ "cursor": 2, "committed": { "a": true, "b": true } }, { "accepted": 0, "rejected": [["a", "duplicate"], ["b", "duplicate"]], "cursor": 2 }], invariant: "a retry must never commit twice" },
          { name: "malformed row rejected", call: "ingest_batch({'cursor': 0, 'committed': {}}, [{'id': 'c'}])", expect: [{ "cursor": 1, "committed": {} }, { "accepted": 0, "rejected": [["c", "malformed"]], "cursor": 1 }], invariant: "a row without text is dead-lettered, not silently dropped" },
          { name: "empty batch", call: "ingest_batch({'cursor': 5, 'committed': {}}, [])", expect: [{ "cursor": 5, "committed": {} }, { "accepted": 0, "rejected": [], "cursor": 5 }], invariant: "an empty batch changes nothing" },
        ],
        hiddenTestCases: [
          { name: "mixed batch", call: "ingest_batch({'cursor': 0, 'committed': {}}, [{'id': 'a', 'text': 'ok', 'label': 'bug'}, {'id': 'b'}, {'id': 'a', 'text': 'ok', 'label': 'bug'}])", expect: [{ "cursor": 3, "committed": { "a": true } }, { "accepted": 1, "rejected": [["b", "malformed"], ["a", "duplicate"]], "cursor": 3 }], invariant: "one pass handles valid, malformed, and duplicate rows together" },
          { name: "resume from cursor", call: "ingest_batch({'cursor': 7, 'committed': {}}, [{'id': 'x', 'text': 'new', 'label': 'feature'}])", expect: [{ "cursor": 8, "committed": { "x": true } }, { "accepted": 1, "rejected": [], "cursor": 8 }], invariant: "the cursor continues from wherever the previous run stopped" },
        ],
        hints: [
          { level: 1, type: "question", text: "What tells you a row was already committed — and where is that knowledge kept?" },
          { level: 2, type: "question", text: "Which rows must land in the report instead of the committed set?" },
          { level: 3, type: "question", text: "What advances for EVERY row, even rejected ones, so a replay never re-reads?" },
          { level: 4, type: "assertion", text: "for each row: if id committed → reject 'duplicate'; elif not a valid dict with text → reject 'malformed'; else commit; cursor = old cursor + len(batch) always" },
        ],
        solution: `def ingest_batch(state, batch):
    committed = dict(state["committed"])
    rejected = []
    accepted = 0
    for row in batch:
        row_id = row.get("id") if isinstance(row, dict) else None
        if row_id in committed:
            __deriva_emit("data.reject", rowId=len(rejected) + accepted, reason="duplicate")
            rejected.append([row_id, "duplicate"])
        elif not isinstance(row, dict) or not isinstance(row.get("text"), str) or not row["text"].strip():
            __deriva_emit("data.reject", rowId=len(rejected) + accepted, reason="malformed")
            rejected.append([row_id, "malformed"])
        else:
            committed[row_id] = True
            accepted += 1
            __deriva_emit("data.accept", rowId=len(rejected) + accepted - 1)
    cursor = state["cursor"] + len(batch)
    return [{"cursor": cursor, "committed": committed},
            {"accepted": accepted, "rejected": rejected, "cursor": cursor}]
`,
      },
      fixtureId: "tickets-30-l4",
      trace: { fixtureId: "tickets-30-l4", budget: 300 },
      artifact: {
        title: "Checkpoint",
        fields: [
          { name: "cursor_rule", label: "When the cursor advances", required: true },
          { name: "dead_letter_rule", label: "What lands in the dead-letter report", required: true },
        ],
        reflectionQuestion: "What would a crash between 'committed' and 'cursor' do to the next ingest, and why is the committed set the source of truth?",
        outputs: ["checkpoint"],
      },
      failureDrill: {
        prompt: "Run the tests with a state that forgets committed ids after each call. What breaks, and which rows get duplicated?",
        expectedObservation: "The replay test fails: the second send re-commits every row — a retry after a crash would silently double the dataset.",
      },
      exitGate: {
        question: "Why must malformed rows be rejected into a report instead of silently dropped?",
        options: [
          { label: "A silent drop hides the data problem from every later artifact", value: "visible" },
          { label: "The report makes the dataset bigger", value: "bigger" },
          { label: "Dropping rows is faster", value: "faster" },
        ],
        correct: "visible",
        explanation: "An invisible drop is a lie the release inherits — dead letters keep the problem visible and fixable.",
      },
    },
    {
      status: "authored",
      id: "l5-rebuildable-release",
      number: 5,
      title: "Rebuildable Dataset Release",
      durationMinutes: 25,
      thinkingMove: "content is the identity",
      purpose:
        "A dataset release must rebuild to the identical content hash from its manifest " +
        "alone. The learner builds the release that every later project loads by ID.",
      dependencies: ["split-policy", "checkpoint"],
      relatedQuestionIds: ["DATA-008", "DATA-009", "MLOPS-001"],
      relatedLessonIds: ["ai-ml/03-experiments/reproducibility-is-part-of-correctness"],
      kind: "data",
      spec: {
        brief:
          "Implement rebuild_release(manifest, batches) → DatasetRelease. The hash must be " +
          "content-addressed: the same manifest and batches always rebuild to the same " +
          "release id and counts. A missing declared batch must be reported, not guessed.",
        requiredApi: `def rebuild_release(manifest, batches):
    return {"release_id": str, "hash": str, "counts": dict, "lineage": dict}`,
        behavior: [
          "release_id is a hash over schema version + normalized rows + batch order",
          "the same manifest and batches produce the identical release_id and hash",
          "counts report total, accepted, and rejected rows",
          "lineage records the manifest id and the batch ids consumed",
          "a declared batch that is missing returns {\"error\": \"missing-batch:<id>\"}",
          "a row missing a required schema field is counted as rejected, not dropped",
        ],
        constraints: [
          "the hash input includes the schema version — changing the schema changes the release",
          "batch order matters: the same batches in a different order are a different release",
          "rows are normalized (trimmed text) before hashing",
        ],
        examples: [
          { id: "ex1", given: "same manifest + batches twice", result: "identical release_id and hash" },
          { id: "ex2", given: "manifest declares b-3, batches lack it", result: "{'error': 'missing-batch:b-3'}" },
        ],
      },
      designQuestion: {
        question: "Before the editor: what must the hash cover so two identical datasets never disagree?",
        options: [
          { label: "Schema version + normalized rows + batch order", value: "content" },
          { label: "The wall-clock timestamp", value: "time" },
          { label: "The row count only", value: "count" },
        ],
        correct: "content",
        explanation: "Timestamp and count change on every rebuild; content stays stable — identity must come from content.",
      },
      implementation: {
        entryPoint: "rebuild_release",
        starter: `def rebuild_release(manifest, batches):
    # manifest: {"schema_version": str, "required": ["id", "text", "label"], "batch_ids": [...]}
    # batches: list of {"batch_id": str, "rows": [...]}.
    # Emit evidence as you decide:
    #   __deriva_emit("data.version", version="<release_id>")
    #   __deriva_emit("data.accept", rowId=i)
    #   __deriva_emit("data.reject", rowId=i, reason="missing-field")
    # Return a DatasetRelease dict (or {"error": "missing-batch:<id>"}).
    # Your contract (from the gate): content is the identity.

`,
        visibleTests: [
          { name: "rebuild is identical", call: "rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1']}, [{'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': 'hi', 'label': 'bug'}]}])['hash'] == rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1']}, [{'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': 'hi', 'label': 'bug'}]}])['hash']", expect: true, invariant: "two rebuilds of the same content are the same release" },
          { name: "schema version changes the hash", call: "rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1']}, [{'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': 'hi', 'label': 'bug'}]}])['hash'] != rebuild_release({'schema_version': 'v2', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1']}, [{'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': 'hi', 'label': 'bug'}]}])['hash']", expect: true, invariant: "a schema change is a new release, not a silent edit" },
          { name: "missing batch reported", call: "rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1', 'b-2']}, [{'batch_id': 'b-1', 'rows': []}])", expect: { "error": "missing-batch:b-2" }, invariant: "an incomplete manifest must fail loudly" },
          { name: "counts and lineage", call: "rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1']}, [{'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': 'hi', 'label': 'bug'}, {'id': 'b', 'text': 'hi'}]}])", expect: { "release_id": "any", "hash": "any", "counts": { "total": 2, "accepted": 1, "rejected": 1 }, "lineage": { "manifest": "v1", "batches": ["b-1"] } }, invariant: "the release records what it consumed and what it refused" },
        ],
        hiddenTestCases: [
          { name: "batch order is part of identity", call: "rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1', 'b-2']}, [{'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': 'hi', 'label': 'bug'}]}, {'batch_id': 'b-2', 'rows': [{'id': 'b', 'text': 'bye', 'label': 'question'}]}])['hash'] != rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-2', 'b-1']}, [{'batch_id': 'b-2', 'rows': [{'id': 'b', 'text': 'bye', 'label': 'question'}]}, {'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': 'hi', 'label': 'bug'}]}])['hash']", expect: true, invariant: "reordered batches are a different dataset" },
          { name: "whitespace is normalized before hashing", call: "rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1']}, [{'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': '  hi  ', 'label': 'bug'}]}])['hash'] == rebuild_release({'schema_version': 'v1', 'required': ['id', 'text', 'label'], 'batch_ids': ['b-1']}, [{'batch_id': 'b-1', 'rows': [{'id': 'a', 'text': 'hi', 'label': 'bug'}]}])['hash']", expect: true, invariant: "identical content in different whitespace is the same release" },
        ],
        hints: [
          { level: 1, type: "question", text: "Which fields must be folded into the hash so two identical datasets cannot disagree?" },
          { level: 2, type: "question", text: "What changes about the identity when the schema version changes?" },
          { level: 3, type: "question", text: "Where must a missing declared batch be caught before any hashing happens?" },
          { level: 4, type: "assertion", text: "build one canonical string: schema_version + each normalized row (trimmed, in batch order) → sha256; check all declared batches exist first" },
        ],
        solution: `import hashlib

def rebuild_release(manifest, batches):
    by_id = {b["batch_id"]: b for b in batches}
    for batch_id in manifest["batch_ids"]:
        if batch_id not in by_id:
            return {"error": "missing-batch:" + batch_id}
    rows = []
    accepted = 0
    rejected = 0
    for batch_id in manifest["batch_ids"]:
        for row in by_id[batch_id]["rows"]:
            if not all(field in row for field in manifest["required"]) or not str(row.get("text", "")).strip():
                __deriva_emit("data.reject", rowId=len(rows), reason="missing-field")
                rejected += 1
                continue
            row = dict(row)
            row["text"] = str(row["text"]).strip()
            rows.append(row)
            __deriva_emit("data.accept", rowId=len(rows) - 1)
            accepted += 1
    canonical = manifest["schema_version"] + "\\n" + "\\n".join(
        repr(r) for r in rows
    )
    release_id = hashlib.sha256(canonical.encode("utf-8")).hexdigest()[:16]
    __deriva_emit("data.version", version=release_id)
    return {
        "release_id": release_id,
        "hash": release_id,
        "counts": {"total": accepted + rejected, "accepted": accepted, "rejected": rejected},
        "lineage": {"manifest": manifest["schema_version"], "batches": list(manifest["batch_ids"])},
    }
`,
      },
      fixtureId: "tickets-30-l5",
      trace: { fixtureId: "tickets-30-l5", budget: 300 },
      artifact: {
        title: "Dataset card + release",
        fields: [
          { name: "release_id", label: "Content-addressed release id", required: true },
          { name: "rebuild_command", label: "How the release is rebuilt", required: true },
          { name: "lineage_summary", label: "What the lineage records", required: true },
        ],
        reflectionQuestion: "Why must later projects load this release by ID instead of by the latest file on disk?",
        outputs: ["dataset-release"],
      },
      failureDrill: {
        prompt: "Run the tests with a release that hashes rows without the schema version. What rebuild becomes ambiguous?",
        expectedObservation: "A schema change no longer changes the hash — two different datasets claim the same release id, and 'latest' becomes a lie.",
      },
      exitGate: {
        question: "What is the earliest failure a content-addressed release makes impossible?",
        options: [
          { label: "Two runs disagreeing about which dataset they trained on", value: "disagree" },
          { label: "Slow training", value: "slow" },
          { label: "Large files", value: "large" },
        ],
        correct: "disagree",
        explanation: "Identity from content means every consumer can verify it rebuilt exactly the same dataset — disagreement is structurally impossible.",
      },
    },
  ],
})
