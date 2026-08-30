import type { PdbProblem } from "./pdb"

// ── PDB E: stages 11-12 — The Broken Text · The Pattern ─────────────────────

export const PROBLEMS_PDB_E: PdbProblem[] = [
  // ══ STAGE 11 — The Broken Text ══
  {
    id: 42, stage: 11, title: "The Phantom Tokens", pattern: "split-semantics", skill: "read the split you actually called", file: "logparse.py", bugCount: 1,
    statement: "logparse.py counts words in free-form text. CI is red: texts with double spaces, tabs, or leading padding all report phantom words.\n\nRun the tests, then point at the split. The evidence is the token list itself.",
    examples: [
      { input: "count_words('hello world')", output: "2", explain: "one space splits cleanly" },
      { input: "count_words('hello  world')", output: "2", explain: "double spaces are still two words" },
    ],
    why: "split(' ') splits on EXACTLY one space and manufactures empty strings for every extra one; split() with no argument collapses any run of whitespace. The two are not interchangeable, and the bug is invisible until you print the token list.",
    starterCode: "def count_words(text):\n    \"\"\"Number of whitespace-separated words across the whole text.\"\"\"\n    return len(text.split(\" \"))\n",
    hints: [
      "Print the tokens for 'hello  world' (two spaces). What is the middle token?",
      "Which form of split() treats runs of whitespace — spaces, tabs, newlines — as one separator?",
      "split() with no arguments splits on runs of whitespace and drops the empties.",
    ],
    solution: "def count_words(text):\n    \"\"\"Number of whitespace-separated words across the whole text.\"\"\"\n    return len(text.split())\n",
    walkthrough: "p text.split(' ') on 'hello  world' shows ['hello', '', 'world'] — the empty string in the middle is the phantom word. One character deleted (the argument) and every red test turns green: split() splits on runs of any whitespace and never produces empty tokens. The debugger transcript shows both token lists side by side.",
    testCode: "check_call('single spaces split cleanly', lambda: count_words('hello world'), 2)\ncheck_call('double spaces are one gap', lambda: count_words('hello  world'), 2)\ncheck_call('padding is not a word', lambda: count_words('  padded  '), 1)\ncheck_call('tabs count as whitespace', lambda: count_words('tab\\tsep too'), 3)\ncheck_call('empty text has no words', lambda: count_words(''), 0)\nfinish()",
    entry: "count_words('hello  world')",
    pdbLoad: ["args", "p text.split(' ')", "p text.split()", "c"],
  },
  {
    id: 43, stage: 11, title: "The Missing Bigram", pattern: "slice-boundary", skill: "check where the slice window ends", file: "bigram.py", bugCount: 1,
    statement: "bigram.py counts consecutive word pairs for a search-index job. The report: 'the last bigram of every text is missing.'\n\nThat phrasing is the diagnosis. Find the window whose end is one too early.",
    examples: [
      { input: "bigrams(['a', 'b', 'c'])", output: "[('a', 'b'), ('b', 'c')]", explain: "two overlapping pairs from three words" },
      { input: "bigrams(['a', 'b'])", output: "[('a', 'b')]", explain: "one word pair" },
    ],
    why: "Overlapping windows of width 2 need n-1 start positions: range(len(words) - 1). Off-by-one slice bugs announce themselves exactly like this report — 'the last X is missing' — and the fix is one number.",
    starterCode: "def bigrams(words):\n    \"\"\"Consecutive overlapping pairs, in order.\"\"\"\n    return [tuple(words[i:i + 2]) for i in range(len(words) - 2)]\n",
    hints: [
      "For ['a', 'b', 'c'], which start indices does the loop visit, and which pair does it never build?",
      "The last bigram starts at index len(words) - 2. Where does the range stop?",
      "range(len(words) - 2) stops one start too early. The loop must reach len(words) - 1.",
    ],
    solution: "def bigrams(words):\n    \"\"\"Consecutive overlapping pairs, in order.\"\"\"\n    return [tuple(words[i:i + 2]) for i in range(len(words) - 1)]\n",
    walkthrough: "p len(words) shows 4 for ['the', 'quick', 'brown', 'fox'] — the loop visits starts 0 and 1, so ('brown', 'fox') never exists. Bigrams need starts 0..n-2, i.e. range(len(words) - 1). One character: -2 → -1, and the last pair of every text reappears.",
    testCode: "check_call('three words, two pairs', lambda: bigrams(['a', 'b', 'c']), [('a', 'b'), ('b', 'c')])\ncheck_call('two words, one pair', lambda: bigrams(['a', 'b']), [('a', 'b')])\ncheck_call('one word has no bigrams', lambda: bigrams(['a']), [])\ncheck_call('four words, three pairs', lambda: bigrams(['the', 'quick', 'brown', 'fox']), [('the', 'quick'), ('quick', 'brown'), ('brown', 'fox')])\ncheck_call('empty input', lambda: bigrams([]), [])\nfinish()",
    entry: "bigrams(['the', 'quick', 'brown', 'fox'])",
    pdbLoad: ["args", "p words", "p len(words)", "c"],
  },
  {
    id: 44, stage: 11, title: "Two Names, One Person", pattern: "normalization", skill: "normalize before you key", file: "rsvp.py", bugCount: 1,
    statement: "rsvp.py tallies party RSVPs. The report: 'Alice shows up three times in the guest data but the tally lists three different people.'\n\nThe keys are raw strings. The spec: case-insensitive, surrounding whitespace ignored.",
    examples: [
      { input: "tally(['Alice', 'alice', 'ALICE'])", output: "{'alice': 3}", explain: "one person, three spellings" },
      { input: "tally(['  bob ', 'Bob'])", output: "{'bob': 2}", explain: "padding is not part of a name" },
    ],
    why: "Dictionary keys are exact strings: 'Alice' and 'alice' are different people until you normalize. The debugging move is printing the keys — the tally's shape tells you immediately that identity, not counting, is broken.",
    starterCode: "def tally(names):\n    \"\"\"Case-insensitive name -> count. Surrounding whitespace ignored.\"\"\"\n    counts = {}\n    for name in names:\n        counts[name] = counts.get(name, 0) + 1\n    return counts\n",
    hints: [
      "Print the tally's keys. How many spellings of alice are in there?",
      "Where is the key built? What does the spec say it should look like before counting?",
      "counts[name.strip().lower()] normalizes padding and case in one expression.",
    ],
    solution: "def tally(names):\n    \"\"\"Case-insensitive name -> count. Surrounding whitespace ignored.\"\"\"\n    counts = {}\n    for name in names:\n        key = name.strip().lower()\n        counts[key] = counts.get(key, 0) + 1\n    return counts\n",
    walkthrough: "The tally's keys are ['Alice', 'alice', 'ALICE'] — the counting logic was never wrong; the identity was. Normalizing at the door (strip + lower) merges the three spellings into one person. Classic key bugs are found by reading keys, not by re-checking arithmetic.",
    testCode: "check_call('three spellings, one person', lambda: tally(['Alice', 'alice', 'ALICE']), {'alice': 3})\ncheck_call('padding stripped before keying', lambda: tally(['  bob ', 'Bob']), {'bob': 2})\ncheck_call('four mixed entries', lambda: tally(['Cy', 'cy', 'CY', 'Cy']), {'cy': 4})\ncheck_call('empty input', lambda: tally([]), {})\nfinish()",
    entry: "tally(['Alice', 'alice', 'ALICE'])",
    pdbLoad: ["args", "p names", "c"],
  },
  {
    id: 45, stage: 11, title: "The Trailing Comma", pattern: "join-vs-accumulate", skill: "let join place the separators", file: "badge.py", bugCount: 1,
    statement: "badge.py formats employee badges as 'Name-Id' joined by commas. QA: 'every line ends with a comma nobody asked for.'\n\nManual separator placement is the bug pattern. Let join do it.",
    examples: [
      { input: "badges([{name: 'Mesa', id: 7}, {name: 'Rook', id: 3}])", output: "'Mesa-7,Rook-3'", explain: "separator BETWEEN items, never after" },
      { input: "badges([])", output: "''", explain: "empty in, empty out" },
    ],
    why: "Accumulating with out += item + ',' puts the separator after every item including the last. str.join places it only between items and handles the empty list for free. When a separator leaks at an edge, stop patching strings — switch to join.",
    starterCode: "def badges(employees):\n    \"\"\"Comma-separated 'Name-Id' badges, no trailing comma.\"\"\"\n    out = \"\"\n    for e in employees:\n        out = out + f\"{e['name']}-{e['id']}\" + \",\"\n    return out\n",
    hints: [
      "Print out after each iteration. When does the comma appear relative to the item?",
      "Which expression renders all items with the separator only BETWEEN them?",
      "','.join(...) over a generator of badge strings is the whole fix.",
    ],
    solution: "def badges(employees):\n    \"\"\"Comma-separated 'Name-Id' badges, no trailing comma.\"\"\"\n    return \",\".join(f\"{e['name']}-{e['id']}\" for e in employees)\n",
    walkthrough: "p out after lap one shows 'Mesa-7,' — the separator rides out with every append, so the last lap leaves one behind. ','.join places separators only between items and returns '' for an empty list, deleting the edge cases with the pattern. When separators leak at the edges, the answer is join, not more slicing.",
    testCode: "check_call('two badges, one comma', lambda: badges([{'name': 'Mesa', 'id': 7}, {'name': 'Rook', 'id': 3}]), 'Mesa-7,Rook-3')\ncheck_call('single badge, no comma', lambda: badges([{'name': 'Mesa', 'id': 7}]), 'Mesa-7')\ncheck_call('empty roster', lambda: badges([]), '')\nfinish()",
    entry: "badges([{'name': 'Mesa', 'id': 7}, {'name': 'Rook', 'id': 3}])",
    pdbLoad: ["args", "n", "n", "n", "p out", "c"],
  },

  // ══ STAGE 12 — The Pattern ══
  {
    id: 46, stage: 12, title: "The Greedy Grab", pattern: "greedy-quantifier", skill: "watch what .* reaches for", file: "quotes.py", bugCount: 1,
    statement: "quotes.py extracts \"...\" fragments from chat logs. CI: 'one giant match swallowing everything between the first and last quote.'\n\nRun the pattern alone against the input. The regex means what it matches.",
    examples: [
      { input: "quotes('say \"hi\" then \"bye\"')", output: "['hi', 'bye']", explain: "each quoted fragment separately" },
      { input: "quotes('\"solo\"')", output: "['solo']", explain: "a single fragment" },
    ],
    why: ".* is greedy: it consumes as much as possible, so '\"(.*)\"' spans from the first quote to the LAST one. The non-greedy .*? stops at the first closing quote. One question mark is the difference between two fragments and one Frankenstring.",
    starterCode: "import re\n\n\ndef quotes(line):\n    \"\"\"All \"...\" fragments, in order.\"\"\"\n    return re.findall(r'\"(.*)\"', line)\n",
    hints: [
      "p re.findall(r'\"(.*)\"', line) — how many matches, and what is inside the one?",
      "Greedy .* walks to the LAST quote in the line. What would stop at the FIRST?",
      "The non-greedy quantifier .*? stops each match at the first closing quote.",
    ],
    solution: "import re\n\n\ndef quotes(line):\n    \"\"\"All \"...\" fragments, in order.\"\"\"\n    return re.findall(r'\"(.*?)\"', line)\n",
    walkthrough: "The transcript prints ['hi\" then \"bye'] — one match, spanning quote one to quote four. That is .* doing its job: as much as possible. Adding the question mark (.*?) inverts the appetite: stop at the first closing quote, then continue scanning. Run the regex alone in the debugger and the bug confesses before you touch any other code.",
    testCode: "check_call('two fragments stay separate', lambda: quotes('say \"hi\" then \"bye\"'), ['hi', 'bye'])\ncheck_call('three fragments', lambda: quotes('\"a\" \"b\" \"c\"'), ['a', 'b', 'c'])\ncheck_call('one fragment is one match', lambda: quotes('\"solo\"'), ['solo'])\ncheck_call('no quotes, no matches', lambda: quotes('no quotes here'), [])\nfinish()",
    entry: "quotes('say \"hi\" then \"bye\"')",
    pdbLoad: ["args", "p line", "c"],
  },
  {
    id: 47, stage: 12, title: "The Unanchored Match", pattern: "anchors", skill: "decide where the pattern may sit", file: "yearcheck.py", bugCount: 1,
    statement: "yearcheck.py validates that a field IS a four-digit year. CI: 'the field ab2024cd passes, and so does 19999.'\n\nsearch() asks 'is this pattern anywhere inside?'. The spec asks 'is the whole field this pattern?'.",
    examples: [
      { input: "is_year('2024')", output: "True", explain: "exactly four digits" },
      { input: "is_year('ab2024cd')", output: "False", explain: "digits buried in garbage are not a year" },
    ],
    why: "re.search finds the pattern ANYWHERE in the string; validation needs the pattern to be the ENTIRE string. fullmatch (or ^...$ anchors) is the contract. Unanchored validation is the classic regex false-positive.",
    starterCode: "import re\n\n\ndef is_year(field):\n    \"\"\"True iff field is exactly four digits.\"\"\"\n    return bool(re.search(r\"[0-9]{4}\", field))\n",
    hints: [
      "p re.search(r'[0-9]{4}', 'ab2024cd') — does it match? Where?",
      "What is the difference between 'contains four digits' and 'is four digits'?",
      "re.fullmatch(r'[0-9]{4}', field) demands the whole string.",
    ],
    solution: "import re\n\n\ndef is_year(field):\n    \"\"\"True iff field is exactly four digits.\"\"\"\n    return bool(re.fullmatch(r\"[0-9]{4}\", field))\n",
    walkthrough: "The debugger prints both calls side by side: search finds '2024' inside 'ab2024cd' (a substring hit), fullmatch returns None (the whole string is not four digits). Validation without anchors is a substring check wearing a validation costume — one word swaps the semantics.",
    testCode: "check_call('plain year passes', lambda: is_year('2024'), True)\ncheck_call('extra digits rejected', lambda: is_year('23456'), False)\ncheck_call('buried digits rejected', lambda: is_year('ab2024cd'), False)\ncheck_call('letters among digits rejected', lambda: is_year('20x4'), False)\ncheck_call('empty field rejected', lambda: is_year(''), False)\nfinish()",
    entry: "is_year('ab2024cd')",
    pdbLoad: ["args", "p re.search(r'[0-9]{4}', field)", "p re.fullmatch(r'[0-9]{4}', field)", "c"],
  },
  {
    id: 48, stage: 12, title: "The Escape Artist", pattern: "metacharacter-escape", skill: "escape the character you mean", file: "splitlog.py", bugCount: 1,
    statement: "splitlog.py breaks timestamps like '12.05.2024' into parts. CI: 'every timestamp shatters into single characters.'\n\nThe dot in a regex is not a dot. Run the split alone and read the wreckage.",
    examples: [
      { input: "date_parts('12.05.2024')", output: "['12', '05', '2024']", explain: "split on literal dots" },
      { input: "date_parts('2024')", output: "['2024']", explain: "no dots, one part" },
    ],
    why: "In a regex, . matches ANY character — so re.split('.', s) cuts at every character in the string. The literal dot must be escaped: r'\\.'. Better still, for a literal separator you may not need regex at all — str.split('.') is plain and honest.",
    starterCode: "import re\n\n\ndef date_parts(stamp):\n    \"\"\"['DD', 'MM', 'YYYY'] from a dot-separated stamp.\"\"\"\n    return re.split(\".\", stamp)\n",
    hints: [
      "p re.split('.', stamp) — what came back, and how many pieces?",
      "What does . match in a regex? What character did you MEAN?",
      "Escape it (r'\\.') — or skip regex entirely: stamp.split('.').",
    ],
    solution: "import re\n\n\ndef date_parts(stamp):\n    \"\"\"['DD', 'MM', 'YYYY'] from a dot-separated stamp.\"\"\"\n    return stamp.split(\".\")\n",
    walkthrough: "re.split('.', '12.05.2024') returns eleven mostly-empty strings — the pattern matched every single character because . is the any-char metacharacter. Escaping (r'\\.') fixes the regex; dropping regex for str.split fixes the problem. Both are one line; the transcript proves which character was being matched.",
    testCode: "check_call('full stamp splits into three parts', lambda: date_parts('12.05.2024'), ['12', '05', '2024'])\ncheck_call('another stamp', lambda: date_parts('01.01.1970'), ['01', '01', '1970'])\ncheck_call('no dots, one part', lambda: date_parts('2024'), ['2024'])\nfinish()",
    entry: "date_parts('12.05.2024')",
    pdbLoad: ["args", "p re.split('.', stamp)", "p stamp.split('.')", "c"],
  },
  {
    id: 49, stage: 12, title: "The Phantom Group", pattern: "findall-groups", skill: "know the shape findall returns", file: "env.py", bugCount: 1,
    statement: "env.py parses 'k=v' pairs into a dict. CI: 'the dict's keys look like (\"db\", \"host\") — literal tuples as strings.'\n\nfindall with groups returns a different SHAPE than you assumed. Print one item.",
    examples: [
      { input: "parse_env('db=host port=5432')", output: "{'db': 'host', 'port': '5432'}", explain: "key -> value" },
      { input: "parse_env('a=1')", output: "{'a': '1'}", explain: "single pair" },
    ],
    why: "re.findall returns the full match strings — UNLESS the pattern has groups, in which case it returns tuples of the groups. Treating each item as one string (result[match] = match) produces keys like (\"db\", \"host\"). The shape of what a function returns is part of its contract.",
    starterCode: "import re\n\n\ndef parse_env(line):\n    \"\"\"Dict of key=value pairs from 'a=1 b=2' style config.\"\"\"\n    result = {}\n    for match in re.findall(r\"(\\w+)=(\\w+)\", line):\n        result[match] = match\n    return result\n",
    hints: [
      "p match — what is it? A string, or something else?",
      "The pattern has TWO groups. What shape does findall return when groups exist?",
      "Unpack the tuple: for key, value in re.findall(...).",
    ],
    solution: "import re\n\n\ndef parse_env(line):\n    \"\"\"Dict of key=value pairs from 'a=1 b=2' style config.\"\"\"\n    result = {}\n    for key, value in re.findall(r\"(\\w+)=(\\w+)\", line):\n        result[key] = value\n    return result\n",
    walkthrough: "p match prints (\"db\", \"host\") — a TUPLE, because the pattern has two groups and findall returns groups when they exist. p type(match) would say <class 'tuple'>. The fix unpacks the pair: for key, value in ... The bug was never in the regex; it was in assuming the return shape.",
    testCode: "check_call('two pairs parsed', lambda: parse_env('db=host port=5432'), {'db': 'host', 'port': '5432'})\ncheck_call('single pair', lambda: parse_env('a=1'), {'a': '1'})\ncheck_call('empty config', lambda: parse_env(''), {})\nfinish()",
    entry: "parse_env('db=host port=5432')",
    pdbLoad: ["args", "n", "n", "p match", "c"],
  },
]
