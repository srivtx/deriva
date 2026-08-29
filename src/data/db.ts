// ── DB Ladder ────────────────────────────────────────────────────────────────
// 50 problems, 10 stages, strictly linear: every problem teaches exactly one
// SQL/data move, and every later query composes only moves taught earlier.
// Execution: real SQLite through Python's stdlib sqlite3 (Pyodide worker).
// Shared mini-worlds (shop, university, staff, log) are defined in the
// workbench DEPS block — single source of truth for schema + seed data.

export interface DbProblem {
  id: number; stage: number; title: string; pattern: string; skill: string
  statement: string; examples: { input: string; output: string; explain?: string }[]
  why: string; starterCode: string; hints: string[]; solution: string; walkthrough: string; testCode: string
}

export const STAGES_DB = [
  { id: 0, name: "Data Reflex", desc: "rows are the noun" },
  { id: 1, name: "Shape It", desc: "expressions, strings, CASE" },
  { id: 2, name: "Collapse It", desc: "many rows → one answer" },
  { id: 3, name: "Connect It", desc: "joins across tables" },
  { id: 4, name: "Nest It", desc: "subqueries and set ops" },
  { id: 5, name: "Windows", desc: "rank, lag, running totals" },
  { id: 6, name: "Compose It", desc: "CTEs build pipelines" },
  { id: 7, name: "Design It", desc: "schema as the guardian" },
  { id: 8, name: "Make It Fast", desc: "indexes and query plans" },
  { id: 9, name: "Trust It", desc: "transactions and correctness" },
]

export const PROBLEMS_DB: DbProblem[] = [
  // ══ STAGE 0 — Data Reflex ══
  {
    id: 1, stage: 0, title: "First Look", pattern: "projection", skill: "pick columns, not tables",
    statement: "Write a query that returns the name and city of every customer, nothing more. The table is customers(id, name, city, signed_up). Assign the SQL string to a variable named SQL.",
    examples: [
      { input: "customers: (1, 'Ana', 'Pune'), (2, 'Bilal', 'Delhi')", output: "[('Ana', 'Pune'), ('Bilal', 'Delhi')]", explain: "two columns, in table order, every row" },
    ],
    why: "SELECT * is a habit that breaks in production: it drags every column over the wire, breaks when the schema grows, and hides intent. The first reflex of SQL is naming exactly the columns you mean — the query IS the specification of what you need.",
    starterCode: "# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\n-- write your query here\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "A SELECT starts with the columns you want, comma-separated.",
      "FROM names the table the columns live in.",
      "This query needs no WHERE — every row is an answer.",
    ],
    solution: "# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT name, city FROM customers\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "The shape of the answer is decided in the SELECT list: two columns in, two columns out, same order as written. FROM picks the table. That's the whole move — declare the shape you want and the table that has it. Everything later in this ladder hangs off this skeleton: SELECT (shape) → FROM (source) → WHERE (filter) → GROUP BY (collapse) → ORDER BY (arrange).",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Ana', 'Pune'), ('Bilal', 'Delhi'), ('Chen', 'Mumbai'), ('Diya', 'Pune'), ('Eshan', 'Goa')], rows\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "The Filter", pattern: "selection", skill: "WHERE keeps only matching rows",
    statement: "Return the id and total of every order with total greater than 300 and status 'shipped'. Table: orders(id, customer_id, total, status, placed_at, delivered_at).",
    examples: [
      { input: "orders: (1, 400, 'shipped'), (2, 250, 'shipped'), (3, 500, 'pending')", output: "[(1, 400)]", explain: "row 2 fails the amount, row 3 fails the status" },
    ],
    why: "A database answers questions by discarding rows. WHERE is that discard rule, evaluated per row, before anything is returned. Getting precise about the filter — both conditions, ANDed — is the difference between an answer and a guess.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "WHERE comes after FROM and holds both conditions.",
      "Two conditions that must both hold are joined with AND.",
      "Text values need quotes: status = 'shipped'.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, total FROM orders\nWHERE total > 300 AND status = 'shipped'\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "WHERE runs per row, top to bottom of the table, keeping rows where the expression is true. AND means both sides must hold; the seed data contains rows that fail each side individually — that's deliberate, so you can watch each condition kill its own rows. Filter first, shape second: WHERE narrows the world before SELECT projects it.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert sorted(rows) == [(1, 400), (2, 420)], rows\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "The Distinct Question", pattern: "deduplication", skill: "DISTINCT collapses duplicates",
    statement: "Return one row per city that has at least one customer — no duplicates. Table: customers(id, name, city, signed_up). Pune has two customers; it must appear once.",
    examples: [
      { input: "cities in customers: Pune, Delhi, Mumbai, Pune", output: "[('Delhi',), ('Mumbai',), ('Pune',)]", explain: "one row per distinct value" },
    ],
    why: "How many cities do we serve? COUNT(*) overcounts because data repeats by design — one row per customer, not per city. DISTINCT is the move that changes the grain of the answer: from rows as stored to values as unique. Asking 'what grain do I need?' before writing the query is the skill.",
    starterCode: "# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "DISTINCT goes immediately after SELECT.",
      "It applies to the whole selected row-combination, not just one column.",
      "Sorting the output makes it easier to eyeball — ORDER BY city.",
    ],
    solution: "# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT DISTINCT city FROM customers ORDER BY city\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "SELECT DISTINCT city keeps one row per unique value — it answers 'which values exist', not 'how many'. Note the grain shift: the answer's rows are cities, not customers. Every future aggregate (Stage 2) is this same question with a count attached. ORDER BY at the end makes the result deterministic — always sort when the answer's order matters to a human or a test.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Delhi',), ('Goa',), ('Mumbai',), ('Pune',)], rows\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Top Three", pattern: "ranking-lite", skill: "ORDER BY + LIMIT = top-N",
    statement: "Return the id and total of the 3 largest orders, biggest first. Table: orders(id, customer_id, total, status, placed_at, delivered_at).",
    examples: [
      { input: "totals: 120, 400, 420, 500, 90", output: "top 3 → 500, 420, 400", explain: "sort descending, keep first three" },
    ],
    why: "'Show me the top N' is the most-asked dashboard question, and SQL answers it with two clauses: ORDER BY arranges, LIMIT cuts. No loop, no max-scanning — the sort is one declarative line. Sorting direction is where bugs hide: DESC for biggest-first, ASC (default) for smallest-first.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "ORDER BY total arranges rows by the total column.",
      "DESC flips the direction: biggest first.",
      "LIMIT 3 keeps only the first three rows after sorting.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, total FROM orders ORDER BY total DESC LIMIT 3\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Conceptually the database sorts the full filtered set, then hands you the first N rows. ORDER BY names the sort key; DESC flips big-to-small; LIMIT slices. Note what you did NOT write: no loop, no comparison logic — you declared the result, SQL found it. Ties at the cut boundary are order-unstable; when ties matter you'll tiebreak with a second key (id) — a habit worth building now: ORDER BY total DESC, id DESC.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(6, 500), (2, 420), (1, 400)], rows\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "The Missing Value", pattern: "null-handling", skill: "IS NULL and COALESCE",
    statement: "Orders have a delivered_at that is NULL until they ship. Two jobs: (a) return ids of undelivered orders using SQL, (b) return each order id with delivered_at or the fallback 'not shipped' — assign the second query to SQL2 as well.",
    examples: [
      { input: "delivered_at: '2024-01-03', NULL, NULL", output: "undelivered ids: [2, 3]", explain: "NULL is not a value — it needs IS NULL" },
    ],
    why: "NULL means 'absent', not zero and not empty string. The classic trap: WHERE delivered_at = NULL returns NOTHING, because NULL compared to anything yields 'unknown', and unknown is not true. SQL's answer is IS NULL for detection and COALESCE for substitution. Every dataset with optional fields — and they all have them — needs this move.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\n# delivered_at is NULL until the order is delivered\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nSQL2 = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nrows2 = con.execute(SQL2).fetchall() if SQL2.strip() else []",
    hints: [
      "= NULL is never true. Detection uses IS NULL.",
      "COALESCE(a, b) returns a unless a is NULL, then b.",
      "Query 2 selects id and COALESCE(delivered_at, 'not shipped').",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\n# delivered_at is NULL until the order is delivered\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id FROM orders WHERE delivered_at IS NULL\n\"\"\"\n\nSQL2 = \"\"\"\nSELECT id, COALESCE(delivered_at, 'not shipped') FROM orders ORDER BY id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nrows2 = con.execute(SQL2).fetchall() if SQL2.strip() else []",
    walkthrough: "Three-valued logic: true, false, unknown. NULL compared to anything (even NULL = NULL) is unknown, so = NULL filters nothing. IS NULL is the only honest detection. COALESCE walks its arguments left to right and returns the first non-NULL — the standard 'display a default' move. Internalize this now: in Stage 3, LEFT JOINs manufacture NULLs for unmatched rows, and this exact move is how you read them.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert sorted(rows) == [(2,), (4,), (6,)], rows\nrows2 = con.execute(SQL2).fetchall() if SQL2.strip() else []\nd = dict(rows2)\nassert d[1] == '2024-01-09' and d[2] == 'not shipped' and d[6] == 'not shipped', rows2\nprint('All tests passed!')"
  },

  // ══ STAGE 1 — Shape It ══
  {
    id: 6, stage: 1, title: "Compute a Column", pattern: "expression", skill: "arithmetic + AS in the select list",
    statement: "GST is 18%. Return each shipped order's id and total-with-tax as with_tax (total × 1.18), rounded to 2 decimal places. Table: orders(id, customer_id, total, status, placed_at, delivered_at).",
    examples: [
      { input: "total = 400", output: "with_tax = 472.0", explain: "400 × 1.18, computed per row" },
    ],
    why: "The select list is not just for picking stored columns — it's a per-row calculator. total × 1.18 is computed fresh for every row flowing through. AS names the result; without it the column is called 'total * 1.18' in the output, which no dashboard deserves. Derived columns keep raw data raw and presentation derived.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Write the arithmetic directly in the select list: total * 1.18.",
      "ROUND(x, 2) keeps money honest to paise.",
      "AS with_tax names the computed column.",
      "Filter with WHERE status = 'shipped' (Stage 0 move).",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, ROUND(total * 1.18, 2) AS with_tax\nFROM orders\nWHERE status = 'shipped'\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Expressions in SELECT are evaluated per row: each order gets its own with_tax. AS is cosmetic to the data but essential to the contract — downstream code reads columns by name. Round at the presentation edge, never store rounded money (you'd accumulate drift). Note the clause order you're building reflexively: SELECT → FROM → WHERE. It reads like the question: 'give me this shape, from here, keeping only these rows'.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nd = dict(rows)\nassert d[1] == 472.0 and d[2] == 495.6, rows\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 1, title: "Mailing Labels", pattern: "string-shaping", skill: "concatenation || and string functions",
    statement: "Build mailing labels: return one string per customer shaped 'Name <CITY>' — name as-is, city uppercased, joined with ' <' and '>'. E.g. 'Ana <PUNE>'. Table: customers(id, name, city, signed_up).",
    examples: [
      { input: "name='Ana', city='Pune'", output: "'Ana <PUNE>'", explain: "concatenate with ||, transform with UPPER" },
    ],
    why: "Sometimes the answer isn't a column, it's a sentence. SQL builds display strings with || (concatenation) and reshapes values with UPPER/LOWER/SUBSTR/LENGTH. This is presentation-layer work living in the query — fine for labels and exports, and a skill every reporting task needs.",
    starterCode: "# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "|| glues strings: name || ' <' || ... .",
      "UPPER(city) capitalizes the city.",
      "Don't forget the closing '>' — labels are exact strings.",
      "ORDER BY name keeps the output stable.",
    ],
    solution: "# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT name || ' <' || UPPER(city) || '>' AS label\nFROM customers ORDER BY name\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "|| is string addition; UPPER transforms; AS names the whole expression. Read the label as data flowing through a pipeline: raw name → glue → raw city → UPPER → glue. One warning to carry forever: if any piece is NULL, || in SQLite yields NULL (concatenating 'unknown' poisons the string) — COALESCE your inputs when NULLs are possible. Here the seed has none, but production data always does.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows[0] == ('Ana <PUNE>',) and ('Bilal <DELHI>',) in rows and ('Eshan <GOA>',) in rows, rows\nassert len(rows) == 5, rows\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "The January Orders", pattern: "date-extraction", skill: "strftime extracts parts of dates",
    statement: "placed_at is stored as ISO text like '2024-01-05'. Return the id and total of orders placed in January 2024. Table: orders(id, customer_id, total, status, placed_at, delivered_at).",
    examples: [
      { input: "placed_at = '2024-01-05'", output: "month part = '01'", explain: "strftime('%Y-%m', ...) yields '2024-01'" },
    ],
    why: "Dates arrive as text (ISO) or numbers (epoch) and every temporal question — 'this month', 'last 7 days', 'January 2024' — is a part-extraction or a comparison. SQLite's strftime is the swiss knife: it formats a date string into any part you need. Extract to a comparable form, then filter. Deterministic because you compare against fixed strings, never 'now'.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\n# placed_at looks like '2024-01-05'\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "strftime('%Y-%m', placed_at) gives '2024-01' for January orders.",
      "ISO text compares correctly as strings: placed_at <= '2024-01-31' also works.",
      "Either approach passes — but strftime generalizes to week, day, hour.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\n# placed_at looks like '2024-01-05'\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, total FROM orders\nWHERE strftime('%Y-%m', placed_at) = '2024-01'\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "ISO dates sort and compare correctly as plain text — '2024-01-05' < '2024-02-01' lexicographically — that's why storage prefers ISO. strftime('%Y-%m', col) reduces each date to its year-month prefix; equality turns 'which month' into a filter. Watch what you must NOT do: date functions wrapped around a column defeat indexes (Stage 8 will prove it with EXPLAIN). For big tables prefer range predicates: placed_at >= '2024-01-01' AND placed_at < '2024-02-01'.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert sorted(rows) == [(1, 400), (2, 420)], rows\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Size Buckets", pattern: "case-when", skill: "CASE derives a category column",
    statement: "Classify each order by size: 'small' for total < 200, 'medium' for 200–399, 'large' for 400 and above. Return id and bucket for every order. Table: orders(id, customer_id, total, status, placed_at, delivered_at).",
    examples: [
      { input: "total = 250", output: "'medium'", explain: "first matching WHEN wins" },
    ],
    why: "CASE WHEN is SQL's if/else, evaluated per row inside the select list. It's how raw numbers become categories — buckets, flags, labels — which is what humans and reports actually read. The boundaries are the business rule: <200, 200–399, 400+. Encode them exactly; off-by-one bucket edges are a classic production bug.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "CASE WHEN total < 200 THEN 'small' ... END — each WHEN is checked in order.",
      "The middle bucket: total < 400 (you already know it's >= 200 because the first WHEN failed).",
      "ELSE catches whatever falls through; END closes the CASE.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id,\n       CASE WHEN total < 200 THEN 'small'\n            WHEN total < 400 THEN 'medium'\n            ELSE 'large' END AS bucket\nFROM orders ORDER BY id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "CASE evaluates WHENs top to bottom and takes the first truth — so the second WHEN doesn't need 'total >= 200 AND total < 400'; failing the first WHEN already implies total >= 200. That ordering-as-logic trick keeps bucket queries clean, but it means order matters: swap the WHENs and every order becomes 'large'. No ELSE means NULL for unmatched rows — with a catch-all ELSE your bucket column is total. This move powers Stage 2's conditional aggregation.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nd = dict(rows)\nassert d[3] == 'small' and d[5] == 'medium' and d[6] == 'large', rows\nassert len(rows) == 6\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "The Filter Toolkit", pattern: "predicate-toolbox", skill: "IN, BETWEEN, LIKE in one query",
    statement: "Find products that are category 'audio' or 'wearable', priced between 2000 and 20000, whose name starts with 'Wireless'. Return name and price. Table: products(id, name, category, price).",
    examples: [
      { input: "('Wireless Earbuds', 'audio', 4999)", output: "matches all three predicates", explain: "IN for the set, BETWEEN for the range, LIKE for the prefix" },
    ],
    why: "Three filter shapes cover almost every WHERE you'll ever write: IN (membership in a set), BETWEEN (inclusive range), LIKE (pattern, where % matches anything). Each replaces a clumsier AND-chain. LIKE 'Wireless%' anchors the pattern to the start — 'Wireless%' and '%Wireless%' are completely different questions, and only the anchored one can use an index (Stage 8).",
    starterCode: "# products(id, name, category, price)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "category IN ('audio', 'wearable') replaces two equality checks with OR.",
      "price BETWEEN 2000 AND 20000 is inclusive on both ends.",
      "LIKE 'Wireless%' — starts with Wireless. The % is the wildcard.",
    ],
    solution: "# products(id, name, category, price)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT name, price FROM products\nWHERE category IN ('audio', 'wearable')\n  AND price BETWEEN 2000 AND 20000\n  AND name LIKE 'Wireless%'\nORDER BY price\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "IN reads as set membership and scales to any list; BETWEEN is a paired >= AND <=; LIKE does prefix/suffix/contains via %. The % placement is semantics: 'Wireless%' = prefix (index-friendly), '%Wireless' = suffix, '%Wireless%' = contains (always a full scan). Case sensitivity: SQLite's LIKE is case-insensitive for ASCII by default — convenient, but remember it when porting queries. This toolkit + AND/OR is 90% of production filtering.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Wireless Earbuds', 4999)], rows\nprint('All tests passed!')"
  },

  // ══ STAGE 2 — Collapse It ══
  {
    id: 11, stage: 2, title: "One Number Answers", pattern: "aggregation", skill: "COUNT, SUM, AVG, MAX, MIN",
    statement: "Return a single row describing all orders: order count AS order_count, revenue AS revenue (SUM of total), average order value AS avg_order (2 decimals), biggest AS biggest, smallest AS smallest. Table: orders(id, customer_id, total, status, placed_at, delivered_at).",
    examples: [
      { input: "totals: 400, 420, 150, 180, 250, 500", output: "count=6, revenue=1900.0, avg=316.67", explain: "six rows collapse into one" },
    ],
    why: "Aggregates are collapse functions: they take many rows and return one. COUNT counts rows, SUM/AVG/MAX/MIN fold the values. This is the first time the answer's grain changes fundamentally — the output is one row no matter how big the table. Dashboards, KPIs, header stats: they're all five aggregates in a trench coat.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "No GROUP BY needed — aggregates over the whole table are legal alone.",
      "Each aggregate gets its own alias: COUNT(*) AS order_count, ...",
      "AVG returns a float with many decimals — wrap in ROUND(x, 2).",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT COUNT(*) AS order_count,\n       SUM(total) AS revenue,\n       ROUND(AVG(total), 2) AS avg_order,\n       MAX(total) AS biggest,\n       MIN(total) AS smallest\nFROM orders\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Five aggregates, one row. The mental model: COUNT(*) counts input rows; SUM/AVG/MIN/MAX each fold the total column into a single value. AVG = SUM/COUNT on numeric columns. Note ROUND(AVG(...), 2) — averages of money are presentation values, round them at the edge. An aggregate over zero rows still returns one row: COUNT gives 0, SUM gives NULL (not 0!) — remember that; it surprises everyone once in production.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(6, 1900.0, 316.67, 500.0, 150.0)], rows\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 2, title: "Per-Customer Counts", pattern: "group-by", skill: "GROUP BY splits collapse per key",
    statement: "Return each customer_id with the number of orders they placed, ordered by customer_id. Table: orders(id, customer_id, total, status, placed_at, delivered_at).",
    examples: [
      { input: "Ana placed 2 orders, Bilal 2, Chen 1, Diya 1", output: "[(1, 2), (2, 2), (3, 1), (4, 1)]", explain: "one row per customer" },
    ],
    why: "GROUP BY is the workhorse of analytics: partition rows into buckets by a key, then collapse each bucket separately. 'Orders per customer', 'sales per region', 'errors per hour' — every per-X metric is GROUP BY X. The output grain is now 'one row per key value', which is exactly the DISTINCT grain from Stage 0 — but carrying a measurement.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "SELECT customer_id, COUNT(*) ... GROUP BY customer_id.",
      "Every non-aggregate column in SELECT must appear in GROUP BY.",
      "ORDER BY customer_id keeps the output deterministic.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT customer_id, COUNT(*) AS order_count\nFROM orders\nGROUP BY customer_id\nORDER BY customer_id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Mechanics worth picturing: rows are partitioned by customer_id — all of Ana's orders in one bucket, Bilal's in another — then COUNT(*) runs per bucket. Two rules follow. First, the golden rule: any column in SELECT must be either in GROUP BY or inside an aggregate; anything else is ambiguous (which row's value would you show?). Second, customers with zero orders don't appear at all — groups form from existing rows only. Making zero-groups visible needs a LEFT JOIN from customers (two problems away).",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(1, 2), (2, 2), (3, 1), (4, 1)], rows\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 2, title: "Repeat Buyers", pattern: "having", skill: "HAVING filters groups, WHERE filters rows",
    statement: "Return customer_id and order_count for customers with at least 2 orders. Table: orders as before.",
    examples: [
      { input: "Ana 2 orders, Bilal 2, Chen 1, Diya 1", output: "[(1, 2), (2, 2)]", explain: "only groups passing the group-filter" },
    ],
    why: "WHERE can't ask questions about counts — it runs before groups exist ('count of what?'). HAVING runs after grouping and filters groups. The two-stage model is the key mental picture of any grouped query: WHERE → group → HAVING → select. Confusing the two is the most common GROUP BY bug; the fix is asking 'is this condition about a row or about a bucket?'",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Same query as before, plus HAVING after GROUP BY.",
      "HAVING COUNT(*) >= 2 — the aggregate goes inside HAVING.",
      "Clause order is fixed: WHERE ... GROUP BY ... HAVING ... ORDER BY.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT customer_id, COUNT(*) AS order_count\nFROM orders\nGROUP BY customer_id\nHAVING COUNT(*) >= 2\nORDER BY customer_id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "The pipeline: WHERE discards rows (total > 300 would run here), GROUP BY buckets the survivors, HAVING discards buckets (count < 2), SELECT shapes output. A useful consequence: HAVING can reference aggregates that aren't in the SELECT list — filter on COUNT(*) while showing only customer_id. One more: 'customers with exactly one order' is HAVING COUNT(*) = 1, and 'at least one' is a group that exists at all — remember zero-groups never form.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(1, 2), (2, 2)], rows\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 2, title: "Two Keys at Once", pattern: "multi-group", skill: "GROUP BY a combination",
    statement: "Count orders per customer per status — one row for each (customer_id, status) combination, ordered by customer_id then status. Table: orders as before.",
    examples: [
      { input: "Ana: 2 shipped; Bilal: 1 shipped + 1 pending", output: "[(1, 'shipped', 2), (2, 'pending', 1), (2, 'shipped', 1), ...]", explain: "the bucket key is the pair" },
    ],
    why: "The GROUP BY key is a tuple, not necessarily one column. GROUP BY customer_id, status forms a bucket per combination — the grain of the answer becomes 'customer × status'. This is how crosstabs start, and why the golden rule exists: SELECT can only show key columns and aggregates, because within a bucket the key is constant and everything else varies.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "GROUP BY customer_id, status — comma-separated keys.",
      "SELECT the two keys plus COUNT(*).",
      "ORDER BY customer_id, status for a stable, readable answer.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT customer_id, status, COUNT(*) AS n\nFROM orders\nGROUP BY customer_id, status\nORDER BY customer_id, status\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Buckets are now labeled by pairs. Ana's two orders are both shipped → one bucket (1, 'shipped', 2). Bilal splits into two buckets. Read the grain out loud before writing any grouped query — 'one row per customer per status' — and the SELECT list writes itself. This move also exposes missing combinations: Ana has no 'pending' bucket, and SQL won't invent the row. Cross-tabs that force every combination need a calendar/units table LEFT JOINed in — a pattern you'll meet in real analytics work.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(1, 'shipped', 2), (2, 'pending', 1), (2, 'shipped', 1), (3, 'shipped', 1), (4, 'pending', 1)], rows\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Two Ledgers in One Pass", pattern: "conditional-agg", skill: "SUM(CASE ...) = pivot in one scan",
    statement: "Per customer, return customer_id, shipped revenue (SUM of total where status='shipped') AS shipped_rev, and pending revenue AS pending_rev. One query, ordered by customer_id. Table: orders as before.",
    examples: [
      { input: "Ana: shipped 400+420, pending 0", output: "(1, 820.0, 0)", explain: "CASE routes each row to its column" },
    ],
    why: "Stage 1's CASE WHEN returns; now it works inside SUM. SUM(CASE WHEN cond THEN total ELSE 0 END) splits one stream into several ledgers in a single pass — the classic 'pivot rows into columns' move. This is the standard shape of every revenue-by-segment report ever written, and COUNT(CASE WHEN...) its counting twin.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Inside SUM: CASE WHEN status = 'shipped' THEN total ELSE 0 END.",
      "Two SUM(CASE...) expressions, one for shipped, one for pending.",
      "GROUP BY customer_id does the per-customer part.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT customer_id,\n       SUM(CASE WHEN status = 'shipped' THEN total ELSE 0 END) AS shipped_rev,\n       SUM(CASE WHEN status = 'pending' THEN total ELSE 0 END) AS pending_rev\nFROM orders\nGROUP BY customer_id\nORDER BY customer_id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Watch the data flow: every row visits every SUM; the CASE is a router — shipped totals flow into ledger one, pending into ledger two, everything else becomes 0. GROUP BY collapses per customer. Without ELSE 0, unmatched rows contribute NULL and SUM ignores NULLs — which happens to give the same answer here, but ELSE 0 states the intent and protects you when you switch to AVG, where NULL-skipping silently changes the denominator. A sibling worth knowing: COUNT(*) counts rows, COUNT(col) counts non-NULL values — COUNT(delivered_at) is 'how many actually delivered'.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(1, 820.0, 0), (2, 150.0, 180.0), (3, 250.0, 0), (4, 0, 500.0)], rows\nprint('All tests passed!')"
  },

  // ══ STAGE 3 — Connect It ══
  {
    id: 16, stage: 3, title: "Two Tables, One Answer", pattern: "inner-join", skill: "JOIN ... ON = match rows across tables",
    statement: "Return order id with the customer's name on every order: SELECT orders.id, customers.name ... ordered by order id. Tables: orders(id, customer_id, ...), customers(id, name, city, signed_up).",
    examples: [
      { input: "order 1 belongs to customer 1", output: "(1, 'Ana')", explain: "the ON condition glues id to customer_id" },
    ],
    why: "Data is normalized — facts live in separate tables, connected by keys. JOIN is how you reconstruct the story: match each order to its customer via customer_id = id. The ON condition is a per-pair filter evaluated over every combination; the surviving pairs are your result. This is the single most-used clause in analytical SQL.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\n# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "FROM orders JOIN customers ON orders.customer_id = customers.id.",
      "Table-qualify columns (orders.id) — both tables have an id.",
      "JOIN (inner) keeps only pairs that match; Eshan has no order, so he appears nowhere.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\n# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT orders.id, customers.name\nFROM orders\nJOIN customers ON orders.customer_id = customers.id\nORDER BY orders.id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Mechanically: take every (order, customer) pair, keep those where customer_id = id, project id + name. INNER JOIN means unmatched rows vanish from BOTH sides — Eshan (customer 5, zero orders) disappears; if an order referenced a deleted customer it would vanish too. Whether disappearing is correct is a business question, not a SQL one — which is exactly why the next problem exists. Read joins out loud: 'orders joined to customers on the customer reference'.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(1, 'Ana'), (2, 'Ana'), (3, 'Bilal'), (4, 'Bilal'), (5, 'Chen'), (6, 'Diya')], rows\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 3, title: "Everyone, Even the Quiet Ones", pattern: "left-join", skill: "LEFT JOIN preserves the left table",
    statement: "Return every customer's name with their order count — customers with zero orders must appear with count 0. Ordered by name. Tables: customers, orders.",
    examples: [
      { input: "Eshan signed up but never ordered", output: "('Eshan', 0)", explain: "LEFT JOIN keeps him; COUNT(orders.id) sees NULLs" },
    ],
    why: "INNER JOIN silently drops unmatched rows — which silently lies in per-customer reports. LEFT JOIN keeps every left-table row and fills the right side with NULLs when there's no match. Combined with the COUNT(col)-skips-NULLs rule from Stage 2, you get the canonical 'count including zeros' pattern. Preserve the entity, then measure it.",
    starterCode: "# customers(id, name, city, signed_up)\n# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "FROM customers LEFT JOIN orders ON customers.id = orders.customer_id.",
      "GROUP BY customers.id — grouping by the key keeps groups per customer.",
      "COUNT(orders.id) counts non-NULL ids — zero for Eshan. COUNT(*) would say 1!",
    ],
    solution: "# customers(id, name, city, signed_up)\n# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT customers.name, COUNT(orders.id) AS order_count\nFROM customers\nLEFT JOIN orders ON customers.id = orders.customer_id\nGROUP BY customers.id\nORDER BY customers.name\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "LEFT JOIN guarantees every customer survives; unmatched ones get a phantom row of NULLs on the order side. Then the Stage 2 rule kicks in with force: COUNT(*) counts the phantom row (wrong: 1), COUNT(orders.id) skips NULLs (right: 0). This pair — LEFT JOIN plus COUNT(right.col) — is among the most-duplicated SQL idioms in existence. GROUP BY customers.id rather than name: id is the key, unique and stable; two customers named 'Ana' would merge under a name-group. Group by keys, display names.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Ana', 2), ('Bilal', 2), ('Chen', 1), ('Diya', 1), ('Eshan', 0)], rows\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 3, title: "The Never-Ordered", pattern: "anti-join", skill: "LEFT JOIN ... WHERE right IS NULL",
    statement: "Return the name of every customer who has never placed an order. Tables: customers, orders.",
    examples: [
      { input: "Eshan has no orders", output: "[('Eshan',)]", explain: "unmatched left rows are exactly the never-ordered" },
    ],
    why: "Who ISN'T in the other table? That's an anti-join, and it's everywhere: users who never logged in, products never sold, invoices without payments. The idiom: LEFT JOIN, then keep only rows where the right side is NULL — the fingerprint of 'no match'. Stage 0's IS NULL was the detection tool; here it becomes a set-difference operator.",
    starterCode: "# customers(id, name, city, signed_up)\n# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "LEFT JOIN first — unmatched customers get NULL order ids.",
      "WHERE orders.id IS NULL keeps only those unmatched rows.",
      "SELECT customers.name — the left table's columns are the only real data here.",
    ],
    solution: "# customers(id, name, city, signed_up)\n# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT customers.name\nFROM customers\nLEFT JOIN orders ON customers.id = orders.customer_id\nWHERE orders.id IS NULL\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Read it as set subtraction: all customers MINUS customers present in orders. The LEFT JOIN manufactures one NULL-padded row per unmatched customer; IS NULL selects exactly those. One caution: the IS NULL column must be a right-table column guaranteed non-NULL when a match exists — the primary key (orders.id) is the safe choice; a nullable column would produce false positives. Stage 4 will rewrite this same question with NOT EXISTS — same answer, different machinery, and you'll compare.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Eshan',)], rows\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 3, title: "The Three-Table Story", pattern: "multi-join", skill: "chain joins through a fact table",
    statement: "Return each product's name with its revenue (SUM of qty * unit_price across all order items), ordered by revenue descending. Tables: order_items(id, order_id, product_id, qty, unit_price), products(id, name, category, price).",
    examples: [
      { input: "USB-C Cable sold 2×75 + 150 + 150", output: "('USB-C Cable', 450.0)", explain: "join lines to products, then collapse per product" },
    ],
    why: "Real analytics is join chains: a fact table (order_items) connected to dimension tables (products) — star-schema shape. The recipe composes everything you own: join to translate product_id → name (Stage 3), compute qty * unit_price per row (Stage 1), GROUP BY name and SUM (Stage 2). One query, three moves. This IS the everyday analytical query.",
    starterCode: "# order_items(id, order_id, product_id, qty, unit_price)\n# products(id, name, category, price)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "FROM order_items JOIN products ON order_items.product_id = products.id.",
      "Revenue per line is qty * unit_price; SUM it.",
      "GROUP BY products.name (or products.id — grouping by the key is safer with duplicate names).",
      "ORDER BY the revenue SUM, descending.",
    ],
    solution: "# order_items(id, order_id, product_id, qty, unit_price)\n# products(id, name, category, price)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT products.name, SUM(order_items.qty * order_items.unit_price) AS revenue\nFROM order_items\nJOIN products ON order_items.product_id = products.id\nGROUP BY products.id\nORDER BY revenue DESC\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Follow one line: 2 USB-C cables at 75 → joined to the products row for id 6 → line revenue 150 → summed with the other cable lines → 450. Join first (enrich), then compute (per row), then collapse (per product). GROUP BY products.id while SELECTing products.name works because id is the primary key: functionally, name depends on id, so SQLite allows it — but the explicit habit of grouping by the key protects you in engines stricter than SQLite and against duplicate names.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('USB-C Cable', 450.0), ('Wired Earphones', 430.0), ('Wireless Earbuds', 420.0), ('Smart Band', 350.0), ('Bluetooth Speaker', 250.0)], rows\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 3, title: "Who Reports to Whom", pattern: "self-join", skill: "a table joined to itself",
    statement: "The employees table stores hierarchy via manager_id pointing at another employee. Return every employee's name with their manager's name — the CEO's manager is NULL and must still appear. Ordered by employee id. Table: employees(id, name, manager_id, salary).",
    examples: [
      { input: "Rohit's manager_id = 2 (Arjun)", output: "('Rohit', 'Arjun')", explain: "two aliases of the same table play different roles" },
    ],
    why: "Hierarchies live inside single tables: every row's manager is another row. The self-join trick: give the table two aliases (e = employee, m = manager) and join e.manager_id = m.id — SQL treats them as two independent copies. Org charts, category trees, referral chains: any 'parent pointer' data is this pattern. Note it's a LEFT join — the top of the tree has no manager and must survive.",
    starterCode: "# employees(id, name, manager_id, salary)\n# manager_id references employees.id; the CEO's manager_id is NULL\ncon = staff_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "FROM employees e LEFT JOIN employees m ON e.manager_id = m.id.",
      "e is the employee, m is the (possible) manager — aliases create the two roles.",
      "SELECT e.name, m.name — the CEO's m.name will be NULL, which is correct.",
    ],
    solution: "# employees(id, name, manager_id, salary)\n# manager_id references employees.id; the CEO's manager_id is NULL\ncon = staff_db()\n\nSQL = \"\"\"\nSELECT e.name, m.name\nFROM employees e\nLEFT JOIN employees m ON e.manager_id = m.id\nORDER BY e.id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "One physical table, two logical roles. The FROM clause copies employees as e and as m; the join wires each employee to their manager's copy. Aliases are the whole trick — without them, 'employees JOIN employees' is ambiguous nonsense. The LEFT JOIN keeps Meera (CEO) with manager NULL: hierarchies have tops, and inner joins would erase them. Stage 6 will extend this exact table with a RECURSIVE CTE to walk the whole tree depth-first — same data, one level deeper of a move.",
    testCode: "con = staff_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Meera', None), ('Arjun', 'Meera'), ('Kavya', 'Meera'), ('Rohit', 'Arjun'), ('Sara', 'Arjun'), ('Vikram', 'Kavya')], rows\nprint('All tests passed!')"
  },

  // ══ STAGE 4 — Nest It ══
  {
    id: 21, stage: 4, title: "Above Average", pattern: "scalar-subquery", skill: "a subquery that returns one value",
    statement: "Return the id and total of orders whose total is above the average order total. Compute the average inside the query — no hardcoded numbers. Table: orders as before.",
    examples: [
      { input: "average total = 316.67", output: "orders 400, 420, 500 qualify", explain: "the inner query computes the bar, the outer filters against it" },
    ],
    why: "Queries can feed queries. A scalar subquery returns exactly one value and can sit anywhere an expression can — here inside the comparison. 'Above average' is impossible in one flat WHERE (you can't compare to an aggregate you haven't computed), so the database runs the inner query first, then filters the outer against its result. Two-step thought, one statement.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "WHERE total > (SELECT AVG(total) FROM orders) — parentheses delimit the inner query.",
      "The inner query is a complete SELECT on its own — you can run it standalone to see the bar.",
      "If the subquery ever returned more than one row, the comparison would error — scalar means scalar.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, total FROM orders\nWHERE total > (SELECT AVG(total) FROM orders)\nORDER BY id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Evaluation order: the subquery fires once, yields 316.67, and the outer WHERE becomes 'total > 316.67'. One subtlety with self-referencing tables like this: the inner AVG sees ALL rows including the outer ones — that's what we want here. Note you never wrote 316.67 — hardcoding computed values is how dashboards start lying when data changes. This move generalizes: scalar subqueries can also appear in the SELECT list (a per-row constant lookup) — the next problems explore nesting further.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(1, 400.0), (2, 420.0), (6, 500.0)], rows\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 4, title: "The Membership Test", pattern: "in-subquery", skill: "IN (SELECT ...) = filter by a computed set",
    statement: "Return the names of customers who currently have at least one pending order. Use a subquery — not a join. Tables: customers, orders.",
    examples: [
      { input: "pending orders belong to customers 2 and 4", output: "[('Bilal',), ('Diya',)]", explain: "the inner query yields a set of ids; IN tests membership" },
    ],
    why: "A subquery can also return a SET — many rows, one column — and IN checks membership against it. This is the natural shape of 'who has at least one X': the inner query finds the qualifying ids, the outer translates ids to people. It reads top-down exactly like the English question, which is why analysts prefer it over joins for membership logic.",
    starterCode: "# customers(id, name, city, signed_up)\n# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Inner query: SELECT customer_id FROM orders WHERE status = 'pending'.",
      "Outer query: SELECT name FROM customers WHERE id IN ( ...that... ).",
      "ORDER BY name for a stable answer.",
    ],
    solution: "# customers(id, name, city, signed_up)\n# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT name FROM customers\nWHERE id IN (SELECT customer_id FROM orders WHERE status = 'pending')\nORDER BY name\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "The inner SELECT materializes {2, 4}; the outer keeps customers whose id is in that set. Two subtleties. Duplicates in the set don't matter — IN is membership, not counting. And NOT IN has a famous NULL trap: if the inner set ever contains NULL, NOT IN returns nothing at all (unknown poisons every comparison). NOT EXISTS — next problem — doesn't have that trap, which is why professionals reach for it for negation. IN reads great; NOT IN is a landmine.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Bilal',), ('Diya',)], rows\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 4, title: "Anti-Join, Rewritten", pattern: "not-exists", skill: "NOT EXISTS = the safe anti-join",
    statement: "Return the names of customers who have NEVER placed an order — using NOT EXISTS this time (P18 used LEFT JOIN ... IS NULL). Same answer, different machinery. Tables: customers, orders.",
    examples: [
      { input: "Eshan has no orders", output: "[('Eshan',)]", explain: "for each customer, ask: does any order reference them?" },
    ],
    why: "EXISTS runs the inner query per outer row and asks a yes/no question: 'is there at least one match?' NOT EXISTS negates it. It's the professional anti-join: no NULL landmine (NOT IN's trap), no phantom-row bookkeeping (LEFT JOIN's), and the ON condition lives right inside, making intent explicit. Same question as P18 — now compare the two shapes and pick consciously.",
    starterCode: "# customers(id, name, city, signed_up)\n# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Shape: WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id).",
      "The inner query references the outer row (c.id) — that correlation is the point.",
      "SELECT 1 is convention — EXISTS never looks at the columns, only at whether a row exists.",
    ],
    solution: "# customers(id, name, city, signed_up)\n# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT c.name\nFROM customers c\nWHERE NOT EXISTS (\n    SELECT 1 FROM orders o WHERE o.customer_id = c.id\n)\nORDER BY c.name\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "For Ana, the engine asks 'any order with customer_id = 1?' — yes → excluded. For Eshan — no rows → NOT EXISTS true → kept. The inner query is correlated: it mentions c.id, a value from the outer row, so it conceptually re-runs per customer (real engines optimize this into a single pass). Versus P18: LEFT JOIN...IS NULL and NOT EXISTS return identical results here, but NOT EXISTS stays correct even with NULLs in the join column and needs no phantom-row reasoning. Default to it for 'never/not any' questions.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Eshan',)], rows\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 4, title: "One Report, Two Streams", pattern: "union", skill: "UNION ALL stacks result sets",
    statement: "Build an action list: every shipped order as (id, total, 'needs_delivery') UNION ALL every pending order as (id, total, 'needs_payment'), ordered by id. Table: orders as before.",
    examples: [
      { input: "orders 1,2,3,5 shipped; orders 4,6 pending", output: "(1, 400.0, 'needs_delivery'), ..., (6, 500.0, 'needs_payment')", explain: "two selects, one stacked result" },
    ],
    why: "Sometimes the answer is two different queries stapled together — different filters, different labels, same columns. UNION ALL stacks result sets vertically; it's the glue for 'do X for A, and Y for B, in one feed'. The critical distinction: UNION ALL keeps duplicates (and is fast — no work beyond stacking); plain UNION deduplicates (a hidden sort/hash). Choose ALL unless you truly need dedup.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Two complete SELECTs separated by UNION ALL.",
      "Same column count in both — and put the label in the same position: SELECT id, total, 'needs_delivery' AS action ...",
      "ORDER BY at the very end applies to the combined result.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, total, 'needs_delivery' AS action FROM orders WHERE status = 'shipped'\nUNION ALL\nSELECT id, total, 'needs_payment' AS action FROM orders WHERE status = 'pending'\nORDER BY id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Each SELECT runs independently — its own WHERE, its own labels — then UNION ALL concatenates. The column lists must line up in count and type-position; the FIRST select's aliases name the columns. The literal-in-select trick ('needs_delivery') is how you tag which stream each row came from — without it, the merged feed would be unreadable. When would plain UNION matter? Merging 'emails' and 'usernames' into one deduplicated contact column. For labeled streams like this, duplicates are impossible anyway — UNION ALL, always.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [\n    (1, 400.0, 'needs_delivery'), (2, 420.0, 'needs_delivery'),\n    (3, 150.0, 'needs_delivery'), (4, 180.0, 'needs_payment'),\n    (5, 250.0, 'needs_delivery'), (6, 500.0, 'needs_payment')], rows\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 4, title: "The Per-Row Question", pattern: "correlated-subquery", skill: "a subquery that reads the outer row",
    statement: "For every order, return its id and how many orders that same customer has placed in total — as customer_order_count. Ordered by order id. Table: orders as before.",
    examples: [
      { input: "Ana's orders are ids 1 and 2", output: "both get customer_order_count = 2", explain: "the inner query counts that customer's rows, per outer row" },
    ],
    why: "This is the full correlated form of P21: the subquery references the outer row (o.customer_id) and therefore re-evaluates for each one. It answers per-row questions that joins answer awkwardly and windows answer elegantly ('how many siblings does this row have?'). Hold this shape in mind — Stage 5 rewrites this exact query with a window function in one line, and the comparison teaches you when each tool wins.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Alias the outer table (FROM orders o) so the inner query can reference it.",
      "Inner: SELECT COUNT(*) FROM orders o2 WHERE o2.customer_id = o.customer_id.",
      "Put the subquery in the SELECT list, aliased AS customer_order_count.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT o.id,\n       (SELECT COUNT(*) FROM orders o2 WHERE o2.customer_id = o.customer_id) AS customer_order_count\nFROM orders o\nORDER BY o.id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Two aliases, one table — same trick as the self-join, but nested: o is 'this order', o2 scans 'all orders by the same customer'. For order 1, the engine counts Ana's rows → 2; for order 5, Chen's rows → 1. The join alternative would be a self-join + GROUP BY — three clauses for one number. The window alternative (coming in Stage 5) is COUNT(*) OVER (PARTITION BY customer_id) — same answer, one scan, no nesting. Correlated subqueries win when the per-row question is irregular (MIN, MAX, EXISTS of a subset); windows win when it's uniform. You'll meet both — recognizing the choice IS the skill.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(1, 2), (2, 2), (3, 2), (4, 2), (5, 1), (6, 1)], rows\nprint('All tests passed!')"
  },

  // ══ STAGE 5 — Windows ══
  {
    id: 26, stage: 5, title: "Number the Rows", pattern: "row-number", skill: "ROW_NUMBER() OVER ranks without collapsing",
    statement: "Return each order's id, customer_id, total, plus ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC) AS rn — each customer's orders numbered from 1, biggest first. Ordered by customer_id, then rn. Table: orders as before.",
    examples: [
      { input: "Ana's orders: 420, 400", output: "order 2 gets rn=1, order 1 gets rn=2", explain: "windows rank rows without squashing them" },
    ],
    why: "Everything so far either kept rows (WHERE) or collapsed them (GROUP BY). Window functions do neither: they compute over a neighborhood of rows and ATTACH the result to every row. ROW_NUMBER is the gateway: partition (the neighborhood), order (within it), number. This unlocks top-N-per-group — the single most-demanded analytical query in interviews.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC) AS rn.",
      "PARTITION BY is 'the GROUP BY-shaped neighborhood'; ORDER BY is the ranking rule inside it.",
      "No GROUP BY anywhere — the row count is unchanged; six rows in, six rows out.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, customer_id, total,\n       ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC) AS rn\nFROM orders\nORDER BY customer_id, rn\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "The OVER clause is the new concept: it defines a window — PARTITION BY customer_id slices rows into per-customer neighborhoods; ORDER BY total DESC ranks within each slice; ROW_NUMBER hands out 1, 2, ... and sticks the number ON the row. Contrast with GROUP BY one more time: grouping collapses Ana's two orders into one row; the window keeps both and annotates them. Note the final ORDER BY (customer_id, rn) is just display sorting — window computation already happened. Ties get arbitrary numbers; if tie order matters, add a deterministic tiebreaker in the OVER's ORDER BY.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [\n    (2, 1, 420.0, 1), (1, 1, 400.0, 2),\n    (4, 2, 180.0, 1), (3, 2, 150.0, 2),\n    (5, 3, 250.0, 1), (6, 4, 500.0, 1)], rows\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 5, title: "RANK vs DENSE_RANK", pattern: "rank-family", skill: "ties: gaps or no gaps",
    statement: "On employees(id, name, manager_id, salary), return name, salary, RANK() OVER (ORDER BY salary DESC) AS rnk, and DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk, ordered by salary desc then name.",
    examples: [
      { input: "salaries: 200k, 120k, 120k, 90k", output: "RANK: 1, 2, 2, 4 — DENSE: 1, 2, 2, 3", explain: "RANK skips after ties; DENSE_RANK doesn't" },
    ],
    why: "Leaderboards have ties, and two questions exist about them: 'what position did you come at?' (RANK — after a two-way tie for 2nd, next is 4th) and 'how many salary levels are above you?' (DENSE_RANK — next is 3rd). Same data, subtly different semantics, and using the wrong one puts the wrong person '4th'. This problem makes you feel the difference on tied data — which is exactly where it matters.",
    starterCode: "# employees(id, name, manager_id, salary)\ncon = staff_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Two window functions, same OVER clause, different function names.",
      "No PARTITION BY — the whole table is one ranking.",
      "Watch Vikram (90k): RANK says 4, DENSE_RANK says 3.",
    ],
    solution: "# employees(id, name, manager_id, salary)\ncon = staff_db()\n\nSQL = \"\"\"\nSELECT name, salary,\n       RANK() OVER (ORDER BY salary DESC) AS rnk,\n       DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rnk\nFROM employees\nORDER BY salary DESC, name\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Arjun and Kavya tie at 120k → both get 2 under either function. The fork happens at Vikram: RANK counts POSITION (1, 2, 2, then jumps to 4 — two people tied ahead of him), DENSE_RANK counts LEVELS (1, 2, 2, then 3 — one salary level above). Rule of thumb: prize podiums and competition results → RANK; percentile bands and tier labels → DENSE_RANK. There's a third sibling, NTILE(n) — splits rows into n equal buckets — useful for 'top quartile' questions. Same OVER machinery, different tie philosophy.",
    testCode: "con = staff_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [\n    ('Meera', 200000.0, 1, 1), ('Arjun', 120000.0, 2, 2), ('Kavya', 120000.0, 2, 2),\n    ('Vikram', 90000.0, 4, 3), ('Rohit', 80000.0, 5, 4), ('Sara', 80000.0, 5, 4)], rows\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 5, title: "Best Order per Customer", pattern: "top-n-per-group", skill: "window in a derived table, then filter",
    statement: "Return each customer's biggest order: (id, customer_id, total) where the order is rn=1 under ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC). You'll need the window in a derived table (a subquery in FROM) because window results can't be filtered in the same WHERE. Ordered by customer_id.",
    examples: [
      { input: "Ana's biggest is 420", output: "(2, 1, 420.0)", explain: "rank first, then keep rn = 1" },
    ],
    why: "The most-asked interview query in existence: top-N per group. It needs two steps — rank inside, filter outside — and SQL's clause order forces the two-step through a derived table: windows compute AFTER WHERE, so WHERE rn = 1 in the same query is illegal. The derived table (FROM (SELECT ...) AS t) is the bridge. Learn this shape once and every 'latest per user', 'highest per region', 'newest per thread' query is the same query.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, customer_id, total\nFROM (\n    -- inner query: the P26 window\n) AS ranked\n-- outer query: keep rn = 1\nORDER BY customer_id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Inner: SELECT id, customer_id, total, ROW_NUMBER() OVER (...) AS rn FROM orders.",
      "Outer: WHERE rn = 1 — legal here because rn is now a plain column of the derived table.",
      "Keep the inner ORDER BY inside the OVER only; the outer ORDER BY sorts the result.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT id, customer_id, total\nFROM (\n    SELECT id, customer_id, total,\n           ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC) AS rn\n    FROM orders\n) AS ranked\nWHERE rn = 1\nORDER BY customer_id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Why the wrapper is forced: SQL's logical evaluation runs WHERE before window functions — so rn doesn't 'exist yet' in the same query level. The derived table freezes the windowed result into an ordinary table, and the outer WHERE filters it like any column. Read the pipeline: inner ranks every order within its customer; outer keeps rank-1 rows. Change ORDER BY inside OVER to placed_at DESC and the same skeleton returns 'latest order per customer'. Top-2? WHERE rn <= 2. One skeleton, infinite questions — and P34 will rename this two-step with a CTE for readability.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(2, 1, 420.0), (4, 2, 180.0), (5, 3, 250.0), (6, 4, 500.0)], rows\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 5, title: "Day over Day", pattern: "lag", skill: "LAG reads the previous row",
    statement: "On daily_revenue(day, revenue), return day, revenue, and the day-over-day change: revenue - LAG(revenue) OVER (ORDER BY day) AS delta. Ordered by day. The first day has no previous row — its delta is NULL.",
    examples: [
      { input: "revenues: 300, 450", output: "deltas: NULL, 150", explain: "LAG looks one row back" },
    ],
    why: "Change over time needs the PREVIOUS row — and in a set-based language that's not obvious. LAG(col) OVER (ORDER BY ...) reaches one row back in the window's ordering; LEAD reaches forward. Deltas, growth rates, time-between-events: all are 'this row minus the last one'. The NULL on the first row is honest — there was no yesterday — and COALESCE only if the display demands it.",
    starterCode: "# daily_revenue(day, revenue)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "LAG(revenue) OVER (ORDER BY day) yields the previous day's revenue.",
      "Subtract it from revenue in the SELECT list.",
      "The first row's LAG is NULL, so its delta is NULL — that's correct, don't fight it.",
    ],
    solution: "# daily_revenue(day, revenue)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT day, revenue,\n       revenue - LAG(revenue) OVER (ORDER BY day) AS delta\nFROM daily_revenue\nORDER BY day\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Before windows, 'previous row' meant a self-join on day-1 or a correlated subquery — both fragile around gaps. LAG makes it one expression, and the OVER's ORDER BY (not the table's order!) defines what 'previous' means — change it to ORDER BY revenue DESC and 'previous' becomes 'next-cheaper day'. Deltas computed: +150, -200, +350, -400, +300. Siblings: LAG(revenue, 2) looks two rows back; LEAD looks forward. For percent change, cast: 100.0 * (revenue - LAG(revenue) OVER (...)) / LAG(revenue) OVER (...).",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [\n    ('2024-04-01', 300.0, None), ('2024-04-02', 450.0, 150.0),\n    ('2024-04-03', 250.0, -200.0), ('2024-04-04', 600.0, 350.0),\n    ('2024-04-05', 200.0, -400.0), ('2024-04-06', 500.0, 300.0)], rows\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 5, title: "The Running Total", pattern: "running-aggregate", skill: "SUM OVER (ORDER BY ...) accumulates",
    statement: "On daily_revenue(day, revenue), return day, revenue, and a running total: SUM(revenue) OVER (ORDER BY day) AS running_total. Ordered by day.",
    examples: [
      { input: "revenues: 300, 450", output: "running: 300, 750", explain: "each row carries the sum of all rows up to it" },
    ],
    why: "Aggregates collapse; aggregates OVER an ordered window ACCUMULATE — each row gets the sum of everything up to it. Cumulative revenue, cumulative error count, balance-after-each-transaction: the running total is the canonical 'state over time' query. The quiet magic: adding ORDER BY inside OVER changes SUM's window from 'all rows' to 'all rows up to me' — framing, and it's why the same function reads two ways.",
    starterCode: "# daily_revenue(day, revenue)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "SUM(revenue) OVER (ORDER BY day) — no PARTITION BY, just the ordering.",
      "Without ORDER BY inside OVER, SUM(revenue) OVER () is the grand total on every row.",
      "With ORDER BY, the default frame is RANGE up to the current row.",
    ],
    solution: "# daily_revenue(day, revenue)\ncon = shop_db()\n\nSQL = \"\"\"\nSELECT day, revenue,\n       SUM(revenue) OVER (ORDER BY day) AS running_total\nFROM daily_revenue\nORDER BY day\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Compare the three SUMs you now own: SUM(revenue) — collapses to one row (Stage 2); SUM(revenue) OVER () — grand total stamped on every row; SUM(revenue) OVER (ORDER BY day) — cumulative up to each row. The difference is entirely the OVER clause: empty window = whole set; ordered window = growing prefix. (SQLite's default frame is RANGE BETWEEN UNPRECEDING AND CURRENT ROW; write ROWS BETWEEN explicitly when peers must not share a value — for unique days it's identical.) Final row's running total equals the grand total 2300 — a free self-check that the window did its job.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [\n    ('2024-04-01', 300.0, 300.0), ('2024-04-02', 450.0, 750.0),\n    ('2024-04-03', 250.0, 1000.0), ('2024-04-04', 600.0, 1600.0),\n    ('2024-04-05', 200.0, 1800.0), ('2024-04-06', 500.0, 2300.0)], rows\nprint('All tests passed!')"
  },

  // ══ STAGE 6 — Compose It ══
  {
    id: 31, stage: 6, title: "Name the Steps", pattern: "cte", skill: "WITH turns a derived table into a named step",
    statement: "Rewrite P28 (each customer's biggest order) using a CTE: WITH ranked AS (...the P26 window...) SELECT id, customer_id, total FROM ranked WHERE rn = 1 ORDER BY customer_id. Same result as the derived-table version.",
    examples: [
      { input: "P28's derived table", output: "same rows, now the subquery has a name: ranked", explain: "WITH alias AS (query) — then use alias like a table" },
    ],
    why: "The derived table worked, but nested subqueries read inside-out and can't be reused. A CTE (WITH ... AS) names a query and lets the main query reference it like a temporary table — top-down, readable, reusable. Nothing new computationally; this is the same two-step pipeline with the first step labeled. Readability is a feature: named steps let a reviewer audit each one.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "WITH ranked AS (SELECT id, customer_id, total, ROW_NUMBER() OVER (...) AS rn FROM orders)",
      "Then the main query follows the CTE: SELECT ... FROM ranked WHERE rn = 1.",
      "The CTE body is exactly P26's window query.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nWITH ranked AS (\n    SELECT id, customer_id, total,\n           ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY total DESC) AS rn\n    FROM orders\n)\nSELECT id, customer_id, total\nFROM ranked\nWHERE rn = 1\nORDER BY customer_id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "WITH computes the CTE once, materializes (or inlines — engines choose) the result as ranked, and the main query treats it as a table. versus P28's nested form: the logic is identical, but now it reads like a recipe — step 1 rank, step 2 filter — instead of an onion. CTEs also compose (next problem) and can even reference themselves (P33). One scope note: a CTE lives only for the single statement that follows it — it's a named subquery, not a created table.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(2, 1, 420.0), (4, 2, 180.0), (5, 3, 250.0), (6, 4, 500.0)], rows\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 6, title: "The Pipeline", pattern: "chained-ctes", skill: "each CTE consumes the previous one",
    statement: "Build monthly revenue and its month-over-month change in one statement: CTE monthly (month AS 'YYYY-MM' via strftime, SUM(total) grouped by month), then CTE growth (month, rev, rev - LAG(rev) OVER (ORDER BY month) AS delta over monthly). Return month, rev, delta from growth, ordered by month.",
    examples: [
      { input: "Jan 820, Feb 330, Mar 750", output: "deltas: NULL, -490, +420", explain: "step 1 aggregates, step 2 compares" },
    ],
    why: "Real analytical queries are pipelines, and chained CTEs are SQL's way to write them: each WITH step consumes the previous one, top to bottom. Aggregate first, then compare — you can't LAG across months that don't exist as rows yet, so monthly must be built before growth. This layering — one transformation per step — is how sprawling queries stay debuggable: comment out the last step and inspect the previous result.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nWITH monthly AS (\n    -- step 1: one row per month\n),\ngrowth AS (\n    -- step 2: LAG over monthly\n)\nSELECT month, rev, delta FROM growth ORDER BY month\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Step 1: SELECT strftime('%Y-%m', placed_at) AS month, SUM(total) AS rev FROM orders GROUP BY month.",
      "Step 2: SELECT month, rev, rev - LAG(rev) OVER (ORDER BY month) AS delta FROM monthly.",
      "The final SELECT just reads growth.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nWITH monthly AS (\n    SELECT strftime('%Y-%m', placed_at) AS month, SUM(total) AS rev\n    FROM orders\n    GROUP BY month\n),\ngrowth AS (\n    SELECT month, rev,\n           rev - LAG(rev) OVER (ORDER BY month) AS delta\n    FROM monthly\n)\nSELECT month, rev, delta FROM growth ORDER BY month\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Two CTEs, comma-separated, each referencing its predecessor — monthly makes months from raw orders (P8's strftime + P12's GROUP BY), growth applies P29's LAG to those month rows. The order matters directionally: LAG needs one-row-per-month to exist first. This is also where debugging strategy lives: run the statement with just the first CTE and SELECT * FROM monthly to inspect the middle of the pipeline — impossible with nested subqueries, trivial with CTEs. Three months, deltas −490 then +420: February's crash and March's recovery, computed in one pass.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('2024-01', 820.0, None), ('2024-02', 330.0, -490.0), ('2024-03', 750.0, 420.0)], rows\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 6, title: "Walk the Whole Tree", pattern: "recursive-cte", skill: "WITH RECURSIVE walks parent-pointer hierarchies",
    statement: "On employees(id, name, manager_id, salary) (P20's table), use a recursive CTE to return every employee with their depth from the CEO: anchor = the CEO (manager_id IS NULL, level 0); step = anyone whose manager is already in the tree, level + 1. Return id, name, level ordered by level then id.",
    examples: [
      { input: "Meera (CEO) → Arjun, Kavya → Rohit, Sara, Vikram", output: "Meera level 0; Arjun/Kavya level 1; Rohit/Sara/Vikram level 2", explain: "the CTE joins into itself until no new rows appear" },
    ],
    why: "Self-joins (P20) reach one level; recursive CTEs reach ALL levels — org charts, category trees, bill-of-materials, graph reachability. The machinery is a two-part union: an ANCHOR query (where to start) and a RECURSIVE step (how to expand), repeated until the step produces nothing. This is SQL's only loop, and the parent-pointer pattern you modeled in LLD finally gets its full walk.",
    starterCode: "# employees(id, name, manager_id, salary)\ncon = staff_db()\n\nSQL = \"\"\"\nWITH RECURSIVE tree AS (\n    -- anchor: the CEO\n    -- step: children of anyone already in tree\n)\nSELECT id, name, level FROM tree ORDER BY level, id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "Anchor: SELECT id, name, manager_id, 0 AS level FROM employees WHERE manager_id IS NULL.",
      "Step: SELECT e.id, e.name, e.manager_id, tree.level + 1 FROM employees e JOIN tree ON e.manager_id = tree.id.",
      "Join the two parts with UNION ALL inside the CTE.",
    ],
    solution: "# employees(id, name, manager_id, salary)\ncon = staff_db()\n\nSQL = \"\"\"\nWITH RECURSIVE tree(id, name, manager_id, level) AS (\n    SELECT id, name, manager_id, 0 FROM employees WHERE manager_id IS NULL\n    UNION ALL\n    SELECT e.id, e.name, e.manager_id, tree.level + 1\n    FROM employees e JOIN tree ON e.manager_id = tree.id\n)\nSELECT id, name, level FROM tree ORDER BY level, id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Execution picture: the anchor produces Meera (level 0). The step joins employees against tree — at first just Meera — producing Arjun and Kavya (level 1). The working table now holds 3 rows; the step runs again, producing Rohit, Sara, Vikram (level 2). Next pass adds nothing → stop. That 'expand until fixpoint' loop is the general graph-walk; swap manager_id for any parent reference and it just works. Two guards for production: a cycle (someone their own ancestor) loops forever — track a path and exclude repeats; and prefer UNION ALL here (no dedup needed, faster) but switch to UNION when cycles must be broken.",
    testCode: "con = staff_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(1, 'Meera', 0), (2, 'Arjun', 1), (3, 'Kavya', 1), (4, 'Rohit', 2), (5, 'Sara', 2), (6, 'Vikram', 2)], rows\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 6, title: "Latest per Customer, Cleanly", pattern: "cte-plus-window", skill: "the canonical latest-row pattern",
    statement: "Return each customer's most recent order as (id, customer_id): rank by placed_at DESC inside a CTE (tiebreak: id DESC), keep rn = 1. Ordered by customer_id. Table: orders as before.",
    examples: [
      { input: "Ana's orders: 2024-01-05 and 2024-01-20", output: "order 2 (2024-01-20)", explain: "same skeleton as P28, new sort key" },
    ],
    why: "'Latest row per entity' is the most frequent top-N-per-group in practice: latest login, latest payment, latest status. It's P28's skeleton with a different ORDER BY inside OVER — which is the point of this problem: the pattern is the pattern; only the ranking key changes. The id DESC tiebreak is a professional habit: two orders on the same timestamp must not make the answer nondeterministic.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_at DESC, id DESC) AS rn.",
      "CTE named whatever reads best — recent AS (...).",
      "SELECT id, customer_id FROM recent WHERE rn = 1.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nWITH recent AS (\n    SELECT id, customer_id, placed_at,\n           ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY placed_at DESC, id DESC) AS rn\n    FROM orders\n)\nSELECT id, customer_id FROM recent WHERE rn = 1 ORDER BY customer_id\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "The third appearance of rank-inside-a-CTE — biggest (P28), latest (here), and next you'll pick the tool yourself. Deliberate repetition: this pattern must be reflexive. Note what changed and what didn't: the OVER's ORDER BY now sorts by time with an id tiebreak; everything else is untouched. This is also where you'd graduate to a real pattern name: 'window + filter' has many local dialects (some engines prefer DISTINCT ON or LEFT JOIN on max) — SQLite speaks the window dialect, and so now do you.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [(2, 1), (4, 2), (5, 3), (6, 4)], rows\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 6, title: "The Analyst's Question", pattern: "capstone-query", skill: "compose joins, filters, CTEs into one answer",
    statement: "Which city generated the most shipped revenue, and what share of total shipped revenue is it? Answer as one row: (city, revenue, share_pct) with share rounded to 1 decimal. Compose: CTE city_rev (join orders→customers, filter shipped, SUM per city), CTE total (grand sum), then combine with a CROSS JOIN and compute the share. Tables: orders, customers as before.",
    examples: [
      { input: "shipped: Pune 820, Delhi 150, Mumbai 250", output: "('Pune', 820.0, 67.2)", explain: "820 / 1220 = 67.2%" },
    ],
    why: "Capstone for the query half of the ladder: one real analytical question, composed from moves you own — a join (P16), a filter (P2), a GROUP BY sum (P12), a chained CTE (P32), and a cross join to carry the grand total alongside the parts. No new syntax. This is the shape of every 'top segment and its share' report, and it should now read as a paragraph, not a puzzle.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\n# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\nWITH city_rev AS (\n    -- shipped revenue per city\n),\ngrand AS (\n    -- total shipped revenue\n)\nSELECT ...\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    hints: [
      "city_rev: SELECT c.city, SUM(o.total) AS rev FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.status = 'shipped' GROUP BY c.city.",
      "grand: SELECT SUM(rev) AS total FROM city_rev.",
      "Main: FROM city_rev CROSS JOIN grand — every row of one times the single row of the other.",
      "share_pct = ROUND(100.0 * rev / total, 1) — multiply by 100.0 first, or integer division eats the decimals.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\n# customers(id, name, city, signed_up)\ncon = shop_db()\n\nSQL = \"\"\"\nWITH city_rev AS (\n    SELECT c.city, SUM(o.total) AS rev\n    FROM orders o\n    JOIN customers c ON o.customer_id = c.id\n    WHERE o.status = 'shipped'\n    GROUP BY c.city\n),\ngrand AS (\n    SELECT SUM(rev) AS total FROM city_rev\n)\nSELECT city_rev.city, city_rev.rev,\n       ROUND(100.0 * city_rev.rev / grand.total, 1) AS share_pct\nFROM city_rev\nCROSS JOIN grand\nORDER BY city_rev.rev DESC\nLIMIT 1\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []",
    walkthrough: "Follow the composition: city_rev is P19's join-chain grouped by city instead of product (P12); grand reaches INTO the first CTE (steps can consume earlier steps); CROSS JOIN pairs each city with the single grand row so every line can compute its share — the standard trick for 'part over whole' without re-scanning. The arithmetic guard matters: 100.0 * first forces float math; 100 * 820 / 1220 in integer land would round to 67. LIMIT 1 after ORDER BY rev DESC takes the top city. Sanity check the share: 820 + 150 + 250 = 1220; 820/1220 = 67.2% ✓. If you can rebuild this query from the English question alone, the query half of this ladder is yours.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nassert rows == [('Pune', 820.0, 67.2)], rows\nprint('All tests passed!')"
  },

  // ══ STAGE 7 — Design It ══
  {
    id: 36, stage: 7, title: "Declare a Table", pattern: "ddl", skill: "CREATE TABLE: types, PK, defaults",
    statement: "Write a single CREATE TABLE statement (assign it to the string variable DDL) for suppliers(id, name, city): id an INTEGER PRIMARY KEY, name TEXT NOT NULL, city TEXT DEFAULT 'Unknown'. The test will create it and insert a supplier with only a name.",
    examples: [
      { input: "INSERT INTO suppliers (name) VALUES ('Sharma Traders')", output: "(1, 'Sharma Traders', 'Unknown')", explain: "id auto-assigned, city defaulted" },
    ],
    why: "Until now you consumed schemas; now you author them. CREATE TABLE is a design act: choose a type per column, make id an INTEGER PRIMARY KEY (SQLite's rowid alias — auto-assigned, indexed, unique), forbid what must exist (NOT NULL), default what has an obvious fallback. The schema you declare is enforced on every future insert — design decisions here outlive every query.",
    starterCode: "con = sqlite3.connect(\":memory:\")\n\nDDL = \"\"\"\n-- one CREATE TABLE statement for suppliers\n\"\"\"\n\nif DDL.strip(): con.execute(DDL)",
    hints: [
      "CREATE TABLE suppliers (id INTEGER PRIMARY KEY, ...) — that type is SQLite's auto-rowid.",
      "NOT NULL goes after the column's type.",
      "DEFAULT 'Unknown' supplies the value when the INSERT omits the column.",
    ],
    solution: "con = sqlite3.connect(\":memory:\")\n\nDDL = \"\"\"\nCREATE TABLE suppliers (\n    id INTEGER PRIMARY KEY,\n    name TEXT NOT NULL,\n    city TEXT DEFAULT 'Unknown'\n)\n\"\"\"\n\nif DDL.strip(): con.execute(DDL)",
    walkthrough: "Three column constraints encode three design decisions. INTEGER PRIMARY KEY is special in SQLite: it becomes an alias for the internal rowid, so inserts without an id get a monotonic one automatically — free autoincrement. NOT NULL pushes a validation from application code into the one place every writer must pass through. DEFAULT makes omission meaningful instead of NULL. Compare with LLD's constructor invariants: same idea, declared once, enforced by the machine. Every table you design from here on should answer: what is the key, what must exist, what happens when a field is absent?",
    testCode: "con = sqlite3.connect(\":memory:\")\nif DDL.strip(): con.execute(DDL)\ncon.execute(\"INSERT INTO suppliers (name) VALUES ('Sharma Traders')\")\nrows = con.execute(\"SELECT id, name, city FROM suppliers\").fetchall()\nassert rows == [(1, 'Sharma Traders', 'Unknown')], rows\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 7, title: "The Database as Guardian", pattern: "constraints", skill: "UNIQUE and CHECK reject bad states",
    statement: "Design users(id, name, email, age) so that: emails cannot repeat (UNIQUE) and cannot be missing; age must be 13 or older (CHECK). Assign the CREATE TABLE to DDL. The test inserts one valid user, then tries a duplicate email and an underage signup — both must fail with sqlite3.IntegrityError.",
    examples: [
      { input: "INSERT ('a@x.com', 20) → ok; again ('a@x.com', 30) → error", output: "IntegrityError", explain: "the machine owns the rule" },
    ],
    why: "Applications have bugs; multiple writers, races, and migrations guarantee bad data unless the schema itself refuses it. UNIQUE makes duplicates unrepresentable; CHECK encodes domain rules ('13+ only') at the door. This is LLD's 'the machine owns the rule' translated to data: catch the violation at insert time with a precise error, not six months later in a report. Every bank balance that has never gone negative owes its life to a constraint.",
    starterCode: "con = sqlite3.connect(\":memory:\")\n\nDDL = \"\"\"\n-- users: id INTEGER PRIMARY KEY, name TEXT NOT NULL,\n-- email TEXT NOT NULL UNIQUE, age INTEGER with a CHECK\n\"\"\"\n\nif DDL.strip(): con.execute(DDL)",
    hints: [
      "UNIQUE goes right after the column definition: email TEXT NOT NULL UNIQUE.",
      "CHECK wraps a predicate: age INTEGER CHECK (age >= 13).",
      "Violations raise sqlite3.IntegrityError — that's the contract, not a crash to fear.",
    ],
    solution: "con = sqlite3.connect(\":memory:\")\n\nDDL = \"\"\"\nCREATE TABLE users (\n    id INTEGER PRIMARY KEY,\n    name TEXT NOT NULL,\n    email TEXT NOT NULL UNIQUE,\n    age INTEGER CHECK (age >= 13)\n)\n\"\"\"\n\nif DDL.strip(): con.execute(DDL)",
    walkthrough: "Two constraints, two failure modes caught at the door: the duplicate email insert dies on UNIQUE, the 12-year-old dies on CHECK — both as sqlite3.IntegrityError, which the application maps to a friendly message. The design insight: the rule lives where ALL writers meet it. A new import script, a teammate's quick fix, a manual psql session — none can bypass the schema. Checklist when designing any table: what's unique (keys, emails, slugs)? What ranges are legal (age, quantities, percentages)? What must never be missing? Declare them; the database enforces for free, forever.",
    testCode: "con = sqlite3.connect(\":memory:\")\nif DDL.strip(): con.execute(DDL)\ncon.execute(\"INSERT INTO users (name, email, age) VALUES ('Ana', 'a@x.com', 20)\")\ndef raises(fn):\n    try:\n        fn()\n        return False\n    except sqlite3.IntegrityError:\n        return True\nassert raises(lambda: con.execute(\"INSERT INTO users (name, email, age) VALUES ('Copy', 'a@x.com', 30)\")), \"duplicate email must fail\"\nassert raises(lambda: con.execute(\"INSERT INTO users (name, email, age) VALUES ('Kid', 'k@x.com', 12)\")), \"underage must fail\"\nassert con.execute(\"SELECT COUNT(*) FROM users\").fetchone()[0] == 1\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 7, title: "The Reference Is Enforced", pattern: "foreign-key", skill: "REFERENCES + ON DELETE CASCADE",
    statement: "Design two tables (one DDL string with both CREATEs): customers2(id INTEGER PRIMARY KEY, name TEXT NOT NULL) and orders2(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers2(id) ON DELETE CASCADE). The test enables PRAGMA foreign_keys = ON, inserts a customer and order, expects an orphan order insert to fail, then deletes the customer and expects the order to vanish with them.",
    examples: [
      { input: "order references customer 99 (missing)", output: "IntegrityError", explain: "no order may point at a customer who isn't there" },
    ],
    why: "Foreign keys are the schema-level version of LLD's 'lifetime coupling' lesson: a child row must reference a parent that exists, and the schema says what happens when the parent dies. REFERENCES is the pointer; ON DELETE CASCADE is the lifetime policy (delete the customer, their orders follow). With PRAGMA foreign_keys = OFF — SQLite's default, for history's sake — none of this is checked, which is why so many production databases are quietly full of orphans.",
    starterCode: "con = sqlite3.connect(\":memory:\")\n\nDDL = \"\"\"\n-- two CREATE TABLE statements, separated by a semicolon:\n-- customers2 first, then orders2 with REFERENCES ... ON DELETE CASCADE\n\"\"\"\n\ncon.executescript(DDL)",
    hints: [
      "customer_id INTEGER NOT NULL REFERENCES customers2(id) — the reference lives on the child.",
      "Append ON DELETE CASCADE to the REFERENCES clause.",
      "The test runs PRAGMA foreign_keys = ON — enforcement must be on for any of this to fire.",
    ],
    solution: "con = sqlite3.connect(\":memory:\")\n\nDDL = \"\"\"\nCREATE TABLE customers2 (\n    id INTEGER PRIMARY KEY,\n    name TEXT NOT NULL\n);\nCREATE TABLE orders2 (\n    id INTEGER PRIMARY KEY,\n    customer_id INTEGER NOT NULL REFERENCES customers2(id) ON DELETE CASCADE\n)\n\"\"\"\n\ncon.executescript(DDL)",
    walkthrough: "Three behaviors, all declared rather than coded: the orphan INSERT is rejected (the reference can't dangle), the DELETE cascades (children die with their parent), and a valid reference passes silently. ON DELETE has siblings — SET NULL (keep the child, cut the link) and RESTRICT (refuse the delete while children exist) — and the choice is a product decision: should deleting an account delete its invoice history? Note the two-part lesson: the constraint declares intent, but PRAGMA foreign_keys = ON is required per-connection in SQLite — a reminder that 'the schema enforces it' is only as strong as the enforcement switch.",
    testCode: "con = sqlite3.connect(\":memory:\")\ncon.execute(\"PRAGMA foreign_keys = ON\")\ncon.executescript(DDL)\ncon.execute(\"INSERT INTO customers2 VALUES (1, 'Ana')\")\ncon.execute(\"INSERT INTO orders2 (customer_id) VALUES (1)\")\ntry:\n    con.execute(\"INSERT INTO orders2 (customer_id) VALUES (99)\")\n    assert False, \"orphan insert must fail\"\nexcept sqlite3.IntegrityError:\n    pass\ncon.execute(\"DELETE FROM customers2 WHERE id = 1\")\nremaining = con.execute(\"SELECT COUNT(*) FROM orders2\").fetchone()[0]\nassert remaining == 0, f\"cascade failed, {remaining} rows left\"\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 7, title: "Split the God Table", pattern: "normalization", skill: "3NF: one entity per table",
    statement: "A flat import table sales_flat(date, customer_name, customer_city, product, qty, amount) repeats customer data on every sale row. Design the normalized schema (one DDL string, both CREATEs): customers_n(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, city TEXT NOT NULL) and orders_n(id INTEGER PRIMARY KEY, customer_id INTEGER NOT NULL REFERENCES customers_n(id), date TEXT NOT NULL, product TEXT NOT NULL, qty INTEGER NOT NULL, amount REAL NOT NULL). The test re-homes three flat rows and checks: 3 sales → exactly 2 customer rows, and a join restores the flat view.",
    examples: [
      { input: "Ana appears on 2 of 3 flat rows", output: "customers_n has 1 Ana; her 2 orders reference her id", explain: "entity data stored once, referenced many times" },
    ],
    why: "The god-class of data. A flat table that mixes two entities (customer facts repeated on sale rows) has exactly the disease of LLD's god class: the same fact stored in many places will eventually disagree — 'Ana' moves cities and half her rows update, half don't. Normalization is the cure: one entity per table, facts stored once, referenced by key. 1NF: atomic values. 2NF: no partial-key repetition. 3NF: no transitive facts — customer city lives with customer, not with sale.",
    starterCode: "con = sqlite3.connect(\":memory:\")\n\nDDLC = \"\"\"\n-- two CREATE TABLE statements:\n-- customers_n (name UNIQUE) and orders_n (REFERENCES customers_n)\n\"\"\"\n\ncon.executescript(DDLC)",
    hints: [
      "The DDL is given in the statement — the design lesson is WHY each piece is there.",
      "UNIQUE on customers_n.name is what lets the test's INSERT OR IGNORE deduplicate.",
      "orders_n.customer_id REFERENCES customers_n(id) is the re-wiring of the repetition.",
    ],
    solution: "con = sqlite3.connect(\":memory:\")\n\nDDLC = \"\"\"\nCREATE TABLE customers_n (\n    id INTEGER PRIMARY KEY,\n    name TEXT NOT NULL UNIQUE,\n    city TEXT NOT NULL\n);\nCREATE TABLE orders_n (\n    id INTEGER PRIMARY KEY,\n    customer_id INTEGER NOT NULL REFERENCES customers_n(id),\n    date TEXT NOT NULL,\n    product TEXT NOT NULL,\n    qty INTEGER NOT NULL,\n    amount REAL NOT NULL\n)\n\"\"\"\n\ncon.executescript(DDLC)",
    walkthrough: "Trace a flat row ('2024-01-05', 'Ana', 'Pune', ...): the customer part ('Ana', 'Pune') is a FACT ABOUT AN ENTITY, not about the sale — so it moves to customers_n, stored once; the sale row keeps only the reference (customer_id). The test proves both directions of correctness: 3 sales collapse to 2 customers (INSERT OR IGNORE dedups via UNIQUE — P37's guardian at work), and P16's join reconstructs the flat view exactly. Update anomaly gone: change Ana's city in ONE place. This is 3NF, and it's the same instinct as splitting a god class: each table owns one entity's facts; relationships are references, not copies.",
    testCode: "con = sqlite3.connect(\":memory:\")\ncon.executescript(DDLC)\nrows = [\n    ('2024-01-05', 'Ana', 'Pune', 'earphones', 1, 250.0),\n    ('2024-01-20', 'Ana', 'Pune', 'cable', 2, 150.0),\n    ('2024-02-03', 'Bilal', 'Delhi', 'cable', 1, 150.0),\n]\nfor date, name, city, product, qty, amount in rows:\n    con.execute(\"INSERT OR IGNORE INTO customers_n (name, city) VALUES (?, ?)\", (name, city))\n    cid = con.execute(\"SELECT id FROM customers_n WHERE name = ?\", (name,)).fetchone()[0]\n    con.execute(\"INSERT INTO orders_n (customer_id, date, product, qty, amount) VALUES (?, ?, ?, ?, ?)\", (cid, date, product, qty, amount))\nassert con.execute(\"SELECT COUNT(*) FROM customers_n\").fetchone()[0] == 2, \"3 sales must collapse to 2 customers\"\nflat = con.execute(\"SELECT o.date, c.name, c.city, o.product, o.qty, o.amount FROM orders_n o JOIN customers_n c ON o.customer_id = c.id ORDER BY o.id\").fetchall()\nassert flat == rows, flat\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 7, title: "Build the Index, Prove It", pattern: "index", skill: "CREATE INDEX + EXPLAIN QUERY PLAN",
    statement: "Create an index on orders(customer_id) — assign the single CREATE INDEX statement to the string IDX. The test runs it against shop_db, then asks SQLite for the query plan of SELECT * FROM orders WHERE customer_id = 1 and expects the plan to mention USING INDEX.",
    examples: [
      { input: "CREATE INDEX idx_orders_customer ON orders(customer_id)", output: "plan: SEARCH orders USING INDEX idx_orders_customer", explain: "the index turns a scan into a seek" },
    ],
    why: "An index is a sorted lookup structure (a B-tree) over one column — the phone book next to the unordered pile. Without it, WHERE customer_id = 1 reads every row (a scan); with it, the engine seeks straight to the matching rows. But declaring an index proves nothing — professionals verify with EXPLAIN QUERY PLAN, which shows whether the engine actually chose it. Trust plans, not vibes.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDX = \"\"\"\n-- one CREATE INDEX statement on orders(customer_id)\n\"\"\"\n\nif IDX.strip(): con.execute(IDX)",
    hints: [
      "CREATE INDEX some_name ON orders(customer_id) — pick any index name.",
      "The test runs EXPLAIN QUERY PLAN and checks the plan text.",
      "Look for SEARCH ... USING INDEX in the output — that's the seek.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDX = \"\"\"\nCREATE INDEX idx_orders_customer ON orders(customer_id)\n\"\"\"\n\nif IDX.strip(): con.execute(IDX)",
    walkthrough: "What the engine does with your index: builds a sorted structure mapping customer_id values to row locations — sorted, so 'find all customer_id = 1' is a binary search, not a stroll. EXPLAIN QUERY PLAN is the contract check: pre-index the plan says SCAN orders (read everything); post-index it says SEARCH orders USING INDEX idx_orders_customer. Note the asymmetry you'll exploit next stage: the index helps reads of customer_id but every INSERT/UPDATE now also updates the index — storage and write cost for read speed. That trade is the entire discipline of indexing, and the next five problems are its manual.",
    testCode: "con = shop_db()\nif IDX.strip(): con.execute(IDX)\nplan = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1\").fetchall()\nassert any(\"USING INDEX\" in str(row) for row in plan), plan\nprint('All tests passed!')"
  },

  // ══ STAGE 8 — Make It Fast ══
  {
    id: 41, stage: 8, title: "Read the Plan", pattern: "explain", skill: "SCAN means read everything",
    statement: "Assign to SQL an EXPLAIN QUERY PLAN statement for: SELECT * FROM orders WHERE customer_id = 1. Run it — the result rows describe how SQLite will execute the query. Assign the plan statement itself to SQL (the test executes SQL against an unindexed shop_db and reads the plan text).",
    examples: [
      { input: "EXPLAIN QUERY PLAN SELECT ...", output: "detail column: 'SCAN orders'", explain: "SCAN = the engine will read every row" },
    ],
    why: "Before optimizing anything, learn to SEE the execution. EXPLAIN QUERY PLAN asks SQLite how it intends to run your query without running it. On an unindexed table, a filtered lookup is a SCAN: read all rows, test each one. At 6 orders that's nothing; at 60 million it's the outage. Reading plans is the difference between guessing why a query is slow and knowing.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\n\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nfor row in rows:\n    print(row[-1])",
    hints: [
      "The statement shape: EXPLAIN QUERY PLAN <your select>.",
      "The result's last column (row[-1]) holds the human-readable plan text.",
      "You're looking for the word SCAN — that's the full-table read.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nSQL = \"\"\"\nEXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1\n\"\"\"\n\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nfor row in rows:\n    print(row[-1])",
    walkthrough: "The plan row's detail says SCAN orders — plain English for 'there is no shortcut; every row gets read and tested'. This is the baseline every future plan is judged against. Two habits form here: run EXPLAIN QUERY PLAN before judging any query, and read the detail column (row[-1]) — SCAN orders, SEARCH ... USING INDEX ..., and for joins one line per table. Cost intuition: scan cost grows with table size; seek cost grows with matches. The next problem flips this plan to a seek and you'll own both readings.",
    testCode: "con = shop_db()\nrows = con.execute(SQL).fetchall() if SQL.strip() else []\nplan = \" | \".join(str(r[-1]) for r in rows)\nassert \"SCAN\" in plan, plan\nassert \"USING INDEX\" not in plan, plan\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 8, title: "Scan Becomes Search", pattern: "index-verify", skill: "prove the index changed the plan",
    statement: "Assign to IDX a CREATE INDEX statement on orders(customer_id). The test reads the plan BEFORE the index (expecting a scan), applies your IDX, reads the plan again — the second plan must use your index.",
    examples: [
      { input: "before: SCAN orders", output: "after: SEARCH orders USING INDEX ...", explain: "same query, different plan — that's the whole point" },
    ],
    why: "P40 created an index and checked it appeared. This problem makes the before/after comparison explicit, because that comparison is the ONLY honest way to index: measure the plan before, add the index, measure again. Indexes that don't change the plan are pure write-amplification — they tax every insert for zero read benefit. Show me the plan delta, or don't ship the index.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDX = \"\"\"\n\n\"\"\"",
    hints: [
      "Same index as P40: CREATE INDEX <name> ON orders(customer_id).",
      "The test handles both EXPLAIN calls — your job is just the statement.",
      "The after-plan must contain USING INDEX with your index's name.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDX = \"\"\"\nCREATE INDEX idx_orders_customer ON orders(customer_id)\n\"\"\"",
    walkthrough: "The two plans tell the whole indexing story in one breath: before — SCAN orders (cost scales with table size); after — SEARCH orders USING INDEX idx_orders_customer (cost scales with matching rows). The query text never changed; the plan did. This is why EXPLAIN QUERY PLAN belongs in code review for any schema change: the index either shows up in a plan someone actually runs, or it's dead weight. For the dashboard's customer-order lookup, this single index is the difference between a page that loads and a page that times out at scale.",
    testCode: "con = shop_db()\nbefore = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1\").fetchall()\nif IDX.strip(): con.execute(IDX)\nafter = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1\").fetchall()\nassert any(\"SCAN\" in str(r) for r in before), before\nassert any(\"USING INDEX\" in str(r) for r in after), after\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 8, title: "The Leftmost Rule", pattern: "composite-index", skill: "composite indexes match prefixes only",
    statement: "Assign to IDX2 a composite index on orders(customer_id, status). The test proves the leftmost-prefix rule: a plan for WHERE customer_id = 1 must use the index; a plan for WHERE status = 'pending' alone must NOT.",
    examples: [
      { input: "index on (customer_id, status)", output: "customer_id query: USING INDEX — status-only query: SCAN", explain: "the phone book is sorted by surname, then first name" },
    ],
    why: "A composite index is sorted by column 1, then column 2 within equal column-1 values — exactly like a phone book sorted by surname then first name. You can seek by surname alone (leftmost prefix); you CANNOT seek by first name alone (it's scattered within every surname). Column order in composite indexes is therefore a design decision, not a style choice: most-selective, most-queried column leads.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDX2 = \"\"\"\n\n\"\"\"",
    hints: [
      "CREATE INDEX <name> ON orders(customer_id, status) — order matters.",
      "The test checks two plans: one uses your index, one must not.",
      "Think phone book: seekable by first column alone, not by the second.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDX2 = \"\"\"\nCREATE INDEX idx_orders_customer_status ON orders(customer_id, status)\n\"\"\"",
    walkthrough: "Why it's true: the B-tree's sort key is (customer_id, status) as a pair. WHERE customer_id = 1 defines a contiguous range in that sort — seekable. WHERE status = 'pending' matches rows scattered across every customer value — no contiguous range, no seek, SCAN. The middle case, WHERE customer_id = 1 AND status = 'pending', uses BOTH columns — the most selective seek of all. Design habit: when two columns are queried together constantly, composite them; lead with the equality-filtered, high-cardinality column. And drop the standalone index it replaces — every index taxes every write.",
    testCode: "con = shop_db()\ncon.execute(IDX2)\np1 = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 1\").fetchall()\np2 = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE status = 'pending'\").fetchall()\nassert any(\"USING INDEX\" in str(r) for r in p1), p1\nassert not any(\"USING INDEX\" in str(r) for r in p2), p2\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 8, title: "Index the Hot Slice", pattern: "partial-index", skill: "index a WHERE slice, not the table",
    statement: "Pending orders are the hot path, but they're 1/3 of the table. Assign to IDXP a partial index: CREATE INDEX ... ON orders(customer_id) WHERE status = 'pending'. The test proves: the plan for WHERE status = 'pending' AND customer_id = 1 uses it; the plan for WHERE customer_id = 2 (no status) does not.",
    examples: [
      { input: "index over only pending rows", output: "pending lookups: USING INDEX — general lookups: SCAN", explain: "a smaller index that only serves the slice it covers" },
    ],
    why: "Indexes have a fixed tax: storage plus a write on every INSERT/UPDATE. A partial index pays that tax only for the rows that matter — the hot slice (status = 'pending', active = 1, unprocessed = true). The planner uses it only when the query's WHERE implies the index's WHERE, which the two plans demonstrate. When a table's read traffic targets one well-defined slice, the partial index is the highest-value-per-byte index there is.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDXP = \"\"\"\n\n\"\"\"",
    hints: [
      "The WHERE clause goes at the END of the CREATE INDEX statement.",
      "The test's first plan includes status = 'pending' — that's what makes the partial index usable.",
      "The second plan lacks the status filter — the index's slice doesn't cover it.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDXP = \"\"\"\nCREATE INDEX idx_orders_pending ON orders(customer_id) WHERE status = 'pending'\n\"\"\"",
    walkthrough: "Two properties make this elegant. Size: the index holds only pending rows — a third of this table, often a rounding error in production where 'pending' is 0.1%. Applicability: the planner uses it only for queries whose conditions imply WHERE status = 'pending' — the test's first query qualifies, the second doesn't and falls back to a scan. The operations queue pattern: partial index on (created_at) WHERE status = 'pending' turns 'next job to process' into an instant seek on a tiny structure. Index the slice that's hot; let the cold bulk stay unindexed.",
    testCode: "con = shop_db()\ncon.execute(IDXP)\np1 = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE status = 'pending' AND customer_id = 1\").fetchall()\np2 = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 2\").fetchall()\nassert any(\"USING INDEX\" in str(r) for r in p1), p1\nassert not any(\"USING INDEX\" in str(r) for r in p2), p2\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 8, title: "Index Dead Zones", pattern: "index-limits", skill: "what defeats an index",
    statement: "Assign to IDXS a plain index on orders(status). The test then checks three plans: WHERE status = 'shipped' (must use the index), WHERE UPPER(status) = 'SHIPPED' (must not), and WHERE total > 300 (must not — no index covers total).",
    examples: [
      { input: "WHERE UPPER(status) = 'SHIPPED'", output: "SCAN — the function hides the column from the index", explain: "the index stores status values, not UPPER(status) values" },
    ],
    why: "Indexes create dead zones, and they're all man-made. Wrap the column in a function (UPPER(status)) and the engine can't use an index on the raw column — the indexed world has 'shipped', your predicate asks about 'SHIPPED'. Query a column with no index (total) and there's nothing to seek. These two patterns — function-wrapped predicates and unindexed columns — explain the vast majority of 'we have an index, why is it slow?!' incidents.",
    starterCode: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDXS = \"\"\"\n\n\"\"\"",
    hints: [
      "CREATE INDEX <name> ON orders(status).",
      "The test runs three EXPLAIN QUERY PLAN calls against the same query text shapes as the statement.",
      "Only the raw status comparison can seek; the other two plans must remain scans.",
    ],
    solution: "# orders(id, customer_id, total, status, placed_at, delivered_at)\ncon = shop_db()\n\nIDXS = \"\"\"\nCREATE INDEX idx_orders_status ON orders(status)\n\"\"\"",
    walkthrough: "The map of dead zones, from this one query set: (1) Function-wrapped column — UPPER(status) can't consult an index on status. Fixes: normalize on write (store uppercase), or create a functional index ON UPPER(status) — SQLite supports it. (2) Unindexed column — total > 300 scans because no structure sorts by total; add one only if that filter is frequent AND selective. (3) Implicit functions are the sneaky ones: CAST, arithmetic on the column, date() around a timestamp — all functions in disguise. When a query is slow, run EXPLAIN QUERY PLAN first; when a plan scans unexpectedly, hunt for something wrapped around the column.",
    testCode: "con = shop_db()\ncon.execute(IDXS)\np1 = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE status = 'shipped'\").fetchall()\np2 = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE UPPER(status) = 'SHIPPED'\").fetchall()\np3 = con.execute(\"EXPLAIN QUERY PLAN SELECT * FROM orders WHERE total > 300\").fetchall()\nassert any(\"USING INDEX\" in str(r) for r in p1), p1\nassert not any(\"USING INDEX\" in str(r) for r in p2), p2\nassert not any(\"USING INDEX\" in str(r) for r in p3), p3\nprint('All tests passed!')"
  },

  // ══ STAGE 9 — Trust It ══
  {
    id: 46, stage: 9, title: "The Transfer", pattern: "transaction", skill: "BEGIN / COMMIT / ROLLBACK = all or nothing",
    statement: "Implement transfer(con, from_id, to_id, amount) on accounts(id, balance): BEGIN, debit the sender, credit the receiver, COMMIT — and return True. If the sender's balance is insufficient, ROLLBACK and return False, leaving BOTH balances untouched. The test's connection uses isolation_level=None so your explicit BEGIN/COMMIT control the transaction.",
    examples: [
      { input: "transfer 200 from (1: 1000) to (2: 500)", output: "True — balances 800 / 700", explain: "then a 5000 transfer returns False and changes nothing" },
    ],
    why: "Two updates that must live or die together — debit and credit — are the textbook transaction. Without BEGIN...COMMIT, a crash (or a failed statement) between the two updates leaves money created or destroyed. ROLLBACK is the undo button: discard everything since BEGIN as if it never happened. Atomicity is not a feature you bolt on; it's the boundary you declare.",
    starterCode: "# accounts(id, balance) — the test's connection is in isolation_level=None mode,\n# so con.execute(\"BEGIN\") / (\"COMMIT\") / (\"ROLLBACK\") are yours to call.\n\ndef transfer(con, from_id, to_id, amount):\n    pass",
    hints: [
      "Read the sender's balance first; if it's less than amount, ROLLBACK and return False.",
      "Then two UPDATEs, then COMMIT, then return True.",
      "Sequence: BEGIN → check → debit → credit → COMMIT.",
    ],
    solution: "# accounts(id, balance) — the test's connection is in isolation_level=None mode,\n# so con.execute(\"BEGIN\") / (\"COMMIT\") / (\"ROLLBACK\") are yours to call.\n\ndef transfer(con, from_id, to_id, amount):\n    con.execute(\"BEGIN\")\n    balance = con.execute(\"SELECT balance FROM accounts WHERE id = ?\", (from_id,)).fetchone()[0]\n    if balance < amount:\n        con.execute(\"ROLLBACK\")\n        return False\n    con.execute(\"UPDATE accounts SET balance = balance - ? WHERE id = ?\", (amount, from_id))\n    con.execute(\"UPDATE accounts SET balance = balance + ? WHERE id = ?\", (amount, to_id))\n    con.execute(\"COMMIT\")\n    return True",
    walkthrough: "Why not just two UPDATEs with an if-check? Because between them — a crash, a deploy, a connection cut — lies a half-transfer: money vaporized from account 1, never arriving at account 2. BEGIN makes the pair indivisible: either both land (COMMIT) or neither did (ROLLBACK), and every other connection sees only the before or the after, never the middle. The check-then-act order matters too: read the balance INSIDE the transaction, so no other writer can slip a debit in before yours commits. P37's CHECK (balance >= 0) constraint is the backstop if the check is ever bypassed — defense in depth.",
    testCode: "con = sqlite3.connect(\":memory:\", isolation_level=None)\ncon.execute(\"CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance REAL NOT NULL CHECK (balance >= 0))\")\ncon.execute(\"INSERT INTO accounts VALUES (1, 1000.0), (2, 500.0)\")\nassert transfer(con, 1, 2, 200.0) is True\nassert con.execute(\"SELECT balance FROM accounts WHERE id = 1\").fetchone()[0] == 800.0\nassert con.execute(\"SELECT balance FROM accounts WHERE id = 2\").fetchone()[0] == 700.0\nassert transfer(con, 2, 1, 5000.0) is False\nassert con.execute(\"SELECT balance FROM accounts WHERE id = 1\").fetchone()[0] == 800.0\nassert con.execute(\"SELECT balance FROM accounts WHERE id = 2\").fetchone()[0] == 700.0\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 9, title: "The Poisoned Batch", pattern: "atomic-batch", skill: "one bad row rejects the whole batch",
    statement: "Implement ingest(con, rows) that inserts a list of (name, email) into users(email UNIQUE) — ALL of them inside one transaction, returning True on success. If ANY insert violates a constraint, ROLLBACK and return False with zero rows persisted. The test feeds a batch whose third email duplicates the first.",
    examples: [
      { input: "batch: Ana(a@x), Bilal(b@x), Fake-Ana(a@x)", output: "False — 0 rows in users", explain: "not 2 rows, not a partial import: nothing" },
    ],
    why: "A 10,000-row import dies on row 9,847. Without a transaction you own a poisoned table: 9,846 partial rows, a re-run that duplicates them, and a cleanup script nobody wants to write. With one transaction around the batch, the failure is clean: ROLLBACK, nothing persisted, fix the data, re-run. Atomicity at batch scope is the difference between a recoverable error and a data-repair incident.",
    starterCode: "# users(id, name, email UNIQUE) — the test's connection is isolation_level=None.\n\ndef ingest(con, rows):\n    pass",
    hints: [
      "BEGIN before the loop, COMMIT after it.",
      "Wrap the loop in try/except sqlite3.IntegrityError — on catch: ROLLBACK, return False.",
      "The success path: COMMIT, return True.",
    ],
    solution: "# users(id, name, email UNIQUE) — the test's connection is isolation_level=None.\n\ndef ingest(con, rows):\n    con.execute(\"BEGIN\")\n    try:\n        for name, email in rows:\n            con.execute(\"INSERT INTO users (name, email) VALUES (?, ?)\", (name, email))\n        con.execute(\"COMMIT\")\n        return True\n    except sqlite3.IntegrityError:\n        con.execute(\"ROLLBACK\")\n        return False",
    walkthrough: "The transaction encodes a policy: this batch is one unit of correctness. The third insert raises IntegrityError (UNIQUE email — P37's guardian), the except path rolls back, and the first two inserts — already executed! — vanish with it. That's the part to internalize: executed ≠ committed. Until COMMIT, everything since BEGIN is retractable; ROLLBACK retracts it. Compare the alternative: without the transaction, a failed batch leaves whatever landed, and 'which rows made it?' becomes archaeology. Note the constraint did the detection for free — no duplicate-checking query, no race between check and insert.",
    testCode: "con = sqlite3.connect(\":memory:\", isolation_level=None)\ncon.execute(\"CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE)\")\nbatch = [('Ana', 'a@x.com'), ('Bilal', 'b@x.com'), ('Fake Ana', 'a@x.com')]\nassert ingest(con, batch) is False\nassert con.execute(\"SELECT COUNT(*) FROM users\").fetchone()[0] == 0, \"poisoned batch must leave zero rows\"\nassert ingest(con, batch[:2]) is True\nassert con.execute(\"SELECT COUNT(*) FROM users\").fetchone()[0] == 2\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 9, title: "One Writer at a Time", pattern: "locking", skill: "writers serialize; SQLITE_BUSY is the queue signal",
    statement: "The test holds a write transaction (BEGIN IMMEDIATE) on a shared in-memory database, then calls your block_writer(dsn), which must open a SECOND connection to the same database (same dsn, uri=True, timeout=0) and attempt an INSERT. It returns True if the insert was rejected with a 'locked' error (sqlite3.OperationalError containing 'locked') and False if it succeeded.",
    examples: [
      { input: "con1 holds BEGIN IMMEDIATE; con2 tries INSERT", output: "block_writer → True", explain: "after con1 COMMITs, the same attempt succeeds → False" },
    ],
    why: "Concurrency, felt directly. A write transaction takes the database's write lock; any OTHER writer must wait or fail — SQLite's file-level rule is one writer at a time. The waiting policy is busy_timeout: 0 means 'fail instantly with database is locked', 5000 means 'queue for up to 5s'. Every 'database is locked' error in production is this exact scene, and the fixes are all here: shorter transactions, retries with backoff, or a queue in front of the write.",
    starterCode: "# The test's dsn: \"file:deriva_lock_demo?mode=memory&cache=shared\"\n# Open your connection with: sqlite3.connect(dsn, uri=True, isolation_level=None, timeout=0)\n\ndef block_writer(dsn):\n    pass",
    hints: [
      "Open the second connection with timeout=0 — zero patience for the lock.",
      "Try the INSERT; catch sqlite3.OperationalError; return \"locked\" in str(e).lower().",
      "Return False if the insert simply succeeded. Close your connection in finally.",
    ],
    solution: "# The test's dsn: \"file:deriva_lock_demo?mode=memory&cache=shared\"\n# Open your connection with: sqlite3.connect(dsn, uri=True, isolation_level=None, timeout=0)\n\ndef block_writer(dsn):\n    con2 = sqlite3.connect(dsn, uri=True, isolation_level=None, timeout=0)\n    try:\n        con2.execute(\"INSERT INTO accounts (id, balance) VALUES (9, 0.0)\")\n        return False\n    except sqlite3.OperationalError as e:\n        return \"locked\" in str(e).lower()\n    finally:\n        con2.close()",
    walkthrough: "The mechanics: BEGIN IMMEDIATE upgrades con1 to writer immediately (no lazy upgrade later), taking the database's single write slot. con2's INSERT finds the slot taken, and with timeout=0 refuses to wait — OperationalError('database is locked'). After COMMIT releases the lock, the identical insert sails through. This IS serialization — the correctness guarantee from Stage LLD-10's mutual exclusion, enforced by the database itself. Production notes that all map back to this demo: keep write transactions short (the lock is the queue), set a sane busy_timeout instead of 0 (politeness), and if lock errors persist, that's architecture telling you writes need to go through one door — a single writer process or a queue.",
    testCode: "dsn = \"file:deriva_lock_demo?mode=memory&cache=shared\"\ncon = sqlite3.connect(dsn, uri=True, isolation_level=None)\ncon.execute(\"CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY, balance REAL)\")\ncon.execute(\"DELETE FROM accounts\")\ncon.execute(\"INSERT INTO accounts VALUES (1, 100.0)\")\ncon.execute(\"BEGIN IMMEDIATE\")\nassert block_writer(dsn) is True, \"second writer must be locked out\"\ncon.execute(\"COMMIT\")\nassert block_writer(dsn) is False, \"after commit, the write must succeed\"\ncon.execute(\"DELETE FROM accounts WHERE id = 9\")\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 9, title: "The Merge Write", pattern: "upsert", skill: "INSERT ... ON CONFLICT DO UPDATE",
    statement: "Implement upsert_stock(con, product_id, qty) against stock(product_id INTEGER PRIMARY KEY, qty): insert a new row, or — if the product already exists — add qty to the existing amount, in ONE statement using INSERT ... ON CONFLICT(product_id) DO UPDATE. The test calls it 3 times for product 1 (qty 5 each) and once for product 2.",
    examples: [
      { input: "upsert(1, 5) × 3", output: "one row: product 1, qty 15", explain: "no SELECT-then-INSERT dance, no race between them" },
    ],
    why: "'Insert if new, update if not' — the merge write — is a daily operation: inventory adjustments, counters, presence flags. The naive version is two statements (SELECT to check, then INSERT or UPDATE) with a race between them: two writers check simultaneously, both see nothing, both insert, constraint error. ON CONFLICT does check-and-write ATOMICALLY inside the engine. excluded is the row that WOULD have been inserted — your update reads the incoming qty from it.",
    starterCode: "# stock(product_id INTEGER PRIMARY KEY, qty INTEGER NOT NULL)\n\ndef upsert_stock(con, product_id, qty):\n    pass",
    hints: [
      "One statement: INSERT INTO stock (product_id, qty) VALUES (?, ?) ON CONFLICT(product_id) DO UPDATE SET qty = qty + excluded.qty.",
      "excluded.qty refers to the value that failed to insert — the qty you passed in.",
      "In the DO UPDATE clause, unqualified qty means 'the existing row's qty'.",
    ],
    solution: "# stock(product_id INTEGER PRIMARY KEY, qty INTEGER NOT NULL)\n\ndef upsert_stock(con, product_id, qty):\n    con.execute(\n        \"INSERT INTO stock (product_id, qty) VALUES (?, ?) \"\n        \"ON CONFLICT(product_id) DO UPDATE SET qty = qty + excluded.qty\",\n        (product_id, qty))",
    walkthrough: "Read the statement as a fork: no conflict → plain insert; conflict on product_id → instead, update the EXISTING row, setting qty = old qty + excluded.qty (the incoming value). Three calls of 5 become one row of 15 — no counter row was ever read into your application, so no read-modify-write race exists even under concurrency: the addition happens inside the engine's atomic write. Two variants worth knowing: DO NOTHING (idempotent inserts — dedupe by key) and SET qty = excluded.qty (replace instead of accumulate — last-write-wins). Which variant you choose is the idempotency design; that final choice is next problem's capstone.",
    testCode: "con = sqlite3.connect(\":memory:\", isolation_level=None)\ncon.execute(\"CREATE TABLE stock (product_id INTEGER PRIMARY KEY, qty INTEGER NOT NULL CHECK (qty >= 0))\")\nfor _ in range(3):\n    upsert_stock(con, 1, 5)\nupsert_stock(con, 2, 2)\nrows = con.execute(\"SELECT product_id, qty FROM stock ORDER BY product_id\").fetchall()\nassert rows == [(1, 15), (2, 2)], rows\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 9, title: "The Idempotent Pipeline", pattern: "capstone-correctness", skill: "at-least-once delivery, exactly-once effect",
    statement: "Payment webhooks arrive from the design canvas — sometimes twice. Implement ingest(con, events) against events(event_id TEXT PRIMARY KEY, user_id, amount CHECK (amount > 0)): each event is (event_id, user_id, amount). Insert it — or, if event_id already exists, REPLACE the stored amount with the new one (ON CONFLICT ... DO UPDATE SET amount = excluded.amount). Return the total of all amounts afterward. The test ingests the same 3-event batch three times, then a correction for e2.",
    examples: [
      { input: "batch [e1:100, e2:50, e3:75] replayed 3×", output: "still 3 rows, total 225 — replays are no-ops", explain: "then e2 corrected to 60 → total 235" },
    ],
    why: "Capstone of the trust stage and the whole ladder. Networks deliver at-least-once: retries, double-clicks, redelivered webhooks are NORMAL, not bugs. The only sane system is one where processing an event twice has the same effect as once — idempotency. The recipe is everything this stage built: a PRIMARY KEY that makes replays recognizable (P37's guardian), an upsert that merges them atomically (P49), a CHECK that keeps poisoned data out (P37 again), and the knowledge that a replay changes nothing (P46's precision about what a write means).",
    starterCode: "# events(event_id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, amount REAL NOT NULL)\n# each event arrives as a tuple (event_id, user_id, amount)\n\ndef ingest(con, events):\n    pass",
    hints: [
      "Loop the events; one INSERT ... ON CONFLICT(event_id) DO UPDATE SET amount = excluded.amount each.",
      "Return SUM(amount) over the whole table after the loop.",
      "Replays hit the conflict path and set the same value — a no-op by construction.",
    ],
    solution: "# events(event_id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, amount REAL NOT NULL)\n# each event arrives as a tuple (event_id, user_id, amount)\n\ndef ingest(con, events):\n    for event_id, user_id, amount in events:\n        con.execute(\n            \"INSERT INTO events (event_id, user_id, amount) VALUES (?, ?, ?) \"\n            \"ON CONFLICT(event_id) DO UPDATE SET amount = excluded.amount\",\n            (event_id, user_id, amount))\n    return con.execute(\"SELECT SUM(amount) FROM events\").fetchone()[0]",
    walkthrough: "Trace a replay: e1 arrives again → INSERT attempts → PRIMARY KEY conflict → DO UPDATE sets amount to the same 100 → zero net change. Three replays, three no-ops, total still 225. Then the correction e2:60 rides the SAME code path — replays and corrections are one mechanism, not two. That's the engineering beauty: exactly-once EFFECT from at-least-once DELIVERY, using only a key and a merge write. Every durable system you'll ever design — webhook receivers, message consumers, sync engines — is this pattern wearing different clothes. The ladder closes where LLD ended: the machine owns the rule, and correctness is a property of the design, not of anyone's vigilance.",
    testCode: "con = sqlite3.connect(\":memory:\", isolation_level=None)\ncon.execute(\"CREATE TABLE events (event_id TEXT PRIMARY KEY, user_id INTEGER NOT NULL, amount REAL NOT NULL CHECK (amount > 0))\")\nbatch = [('e1', 1, 100.0), ('e2', 1, 50.0), ('e3', 2, 75.0)]\nassert ingest(con, batch) == 225.0\nassert ingest(con, batch) == 225.0\nassert ingest(con, batch) == 225.0\nassert con.execute(\"SELECT COUNT(*) FROM events\").fetchone()[0] == 3, \"replays must not add rows\"\nassert ingest(con, [('e2', 1, 60.0)]) == 235.0\nprint('All tests passed!')"
  },

// __APPEND_STAGES__
]
