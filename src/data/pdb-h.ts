import type { PdbProblem } from "./pdb"

// ── PDB H: stages 17-18 — The Boundary · The Number Line ────────────────────

export const PROBLEMS_PDB_H: PdbProblem[] = [
  // ══ STAGE 17 — The Boundary ══
  {
    id: 66, stage: 17, title: "The Vanishing End", pattern: "binary-search-bounds", skill: "half-open bounds close the loop", file: "first_hit.py", bugCount: 1,
    statement: "first_hit.py binary-searches for the first index with vals[i] >= threshold. CI: 'when the answer is the very end of the array — or past it — the search returns one short.'\n\nThe loop is half-open (lo < hi) but the bound is closed (len(vals) - 1). Trace what happens at the last candidate.",
    examples: [
      { input: "first_hit([10, 20, 25], 30)", output: "3", explain: "nothing qualifies: answer is len(vals)" },
      { input: "first_hit([1, 5], 6)", output: "2", explain: "both below: answer is len(vals)" },
    ],
    why: "With hi = len(vals) - 1 and `while lo < hi`, the final candidate never gets probed: the loop exits the moment lo catches hi, and that index is trusted without comparison. The half-open idiom pairs lo < hi with hi = len(vals) — the bound IS the fallback answer, so it needs no probing. Mixed idioms are the binary-search death sentence.",
    starterCode: "def first_hit(vals, threshold):\n    \"\"\"First index with vals[i] >= threshold; len(vals) if none.\"\"\"\n    lo, hi = 0, len(vals) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if vals[mid] >= threshold:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo\n",
    hints: [
      "Trace first_hit([1, 5], 6): the loop exits with lo == hi == 1. Was vals[1] ever compared to 6?",
      "With lo < hi, which initial hi lets the search consider index len(vals) - 1?",
      "Half-open: hi = len(vals). The fallback answer needs no probing.",
    ],
    solution: "def first_hit(vals, threshold):\n    \"\"\"First index with vals[i] >= threshold; len(vals) if none.\"\"\"\n    lo, hi = 0, len(vals)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if vals[mid] >= threshold:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo\n",
    walkthrough: "The transcript traces [1, 5], threshold 6: mid=0, vals[0]=1 < 6, lo=1; now lo == hi and the loop exits — vals[1] was never compared, yet lo is returned as if it had been. Setting hi = len(vals) makes the invariant honest: 'lo is always a valid answer candidate', so when the loop closes on it, no probe is needed. Mixed closed/half-open idioms skip exactly one candidate — the one at the edge.",
    testCode: "check_call('nothing qualifies: len(vals)', lambda: first_hit([10, 20, 25], 30), 3)\ncheck_call('two below threshold', lambda: first_hit([1, 5], 6), 2)\ncheck_call('first element qualifies', lambda: first_hit([10, 20, 30], 10), 0)\ncheck_call('single element qualifies', lambda: first_hit([5], 5), 0)\ncheck_call('empty array', lambda: first_hit([], 1), 0)\ncheck_call('last element qualifies', lambda: first_hit([10, 20, 30], 30), 2)\ncheck_call('mid boundary', lambda: first_hit([10, 20, 30], 20), 1)\nfinish()",
    entry: "first_hit([10, 20, 25], 30)",
    pdbLoad: ["args", "n", "p vals", "p lo, hi", "c"],
  },
  {
    id: 67, stage: 17, title: "The Bloated Window", pattern: "window-shrink", skill: "shrink before you measure", file: "window.py", bugCount: 1,
    statement: "window.py slides a k-day window and reports the best sum. CI: 'later sums are too high — the window carries an extra day.'\n\nAfter appending a new day, when does the window shrink — and to what size?",
    examples: [
      { input: "best_window([2, 1, 5, 1, 3, 2], 3)", output: "9", explain: "5+1+3 is the best trio" },
      { input: "best_window([4, 2, 1, 6], 2)", output: "7", explain: "1+6" },
    ],
    why: "After cur += vals[right] the window is k+1 wide; the shrink condition must run until it is k again — while right - left >= k. With strict >, the k+1 window survives and every subsequent best is polluted by one extra element. Boundary conditions in sliding windows decide correctness, not style.",
    starterCode: "def best_window(vals, k):\n    \"\"\"Max sum of any k consecutive days.\"\"\"\n    best = cur = sum(vals[:k])\n    left = 0\n    for right in range(k, len(vals)):\n        cur += vals[right]\n        while right - left > k:\n            cur -= vals[left]\n            left += 1\n        best = max(best, cur)\n    return best\n",
    hints: [
      "After the append, the window [left..right] holds how many elements? What should it hold?",
      "right - left > k leaves the window at k+1. What does the first subtraction give?",
      "Shrink until right - left >= k: exactly one subtraction restores width k.",
    ],
    solution: "def best_window(vals, k):\n    \"\"\"Max sum of any k consecutive days.\"\"\"\n    best = cur = sum(vals[:k])\n    left = 0\n    for right in range(k, len(vals)):\n        cur += vals[right]\n        while right - left >= k:\n            cur -= vals[left]\n            left += 1\n        best = max(best, cur)\n    return best\n",
    walkthrough: "p cur, left right after the first append prints (9, 0) — four elements [2,1,5,1] under a 3-wide contract, because right - left == k failed the strict >. Every later max() compares against a bloated window. The shrink loop must fire while the window is TOO BIG: >= shrinks exactly once per step, restoring width k before best is measured.",
    testCode: "check_call('classic terrain', lambda: best_window([2, 1, 5, 1, 3, 2], 3), 9)\ncheck_call('best at the end', lambda: best_window([4, 2, 1, 6], 2), 7)\ncheck_call('window is the whole array', lambda: best_window([1, 2, 3, 4], 4), 10)\ncheck_call('k=1 picks the max', lambda: best_window([3, 1, 4, 1, 5], 1), 5)\ncheck_call('single element, k=1', lambda: best_window([5], 1), 5)\nfinish()",
    entry: "best_window([2, 1, 5, 1, 3, 2], 3)",
    pdbLoad: ["args", "n", "n", "n", "n", "p cur, left", "c"],
  },
  {
    id: 68, stage: 17, title: "The Dueling Pointers", pattern: "pointer-direction", skill: "each comparison moves the right end", file: "duo.py", bugCount: 1,
    statement: "duo.py finds a pair summing to a target in a sorted list with two pointers. CI: 'known-existing pairs come back as None.'\n\nWatch which end moves on a small sum. Is that the end that helps?",
    examples: [
      { input: "find_pair([1, 3, 4, 6, 8], 10)", output: "(2, 3)", explain: "4 + 6" },
      { input: "find_pair([1, 2, 3, 9], 5)", output: "(1, 2)", explain: "2 + 3" },
    ],
    why: "The two-pointer invariant: if the sum is too SMALL, only moving the left end up can help (values increase rightward); too big, move the right end down. The bug moves the wrong end on 'too small', so the pointer walks off the valid region and reports None for pairs that exist. Direction IS the algorithm.",
    starterCode: "def find_pair(sorted_vals, target):\n    \"\"\"Indices (i, j), i < j, with sorted_vals[i] + sorted_vals[j] == target, else None.\"\"\"\n    l, r = 0, len(sorted_vals) - 1\n    while l < r:\n        s = sorted_vals[l] + sorted_vals[r]\n        if s == target:\n            return (l, r)\n        if s < target:\n            r -= 1\n        else:\n            l += 1\n    return None\n",
    hints: [
      "p l, r and p sorted_vals[l] + sorted_vals[r] each lap. On s < target, which pointer moves — and should the sum grow or shrink?",
      "Moving r down makes the sum SMALLER — the opposite of what a too-small sum needs.",
      "s < target must grow the sum: l += 1. The too-big case moves r -= 1.",
    ],
    solution: "def find_pair(sorted_vals, target):\n    \"\"\"Indices (i, j), i < j, with sorted_vals[i] + sorted_vals[j] == target, else None.\"\"\"\n    l, r = 0, len(sorted_vals) - 1\n    while l < r:\n        s = sorted_vals[l] + sorted_vals[r]\n        if s == target:\n            return (l, r)\n        if s < target:\n            l += 1\n        else:\n            r -= 1\n    return None\n",
    walkthrough: "The transcript on [1, 3, 4, 6, 8], target 10: sum 1+8=9 is too small — and the code steps r DOWN to 6, making sums even smaller, walking both ends off the pair. The invariant is directional: sorted order means only l += 1 can raise a too-small sum (and r -= 1 lower a too-big one). Two swapped lines were the entire algorithm.",
    testCode: "check_call('pair in the middle', lambda: find_pair([1, 3, 4, 6, 8], 10), (2, 3))\ncheck_call('adjacent pair', lambda: find_pair([1, 2, 3, 9], 5), (1, 2))\ncheck_call('no pair exists', lambda: find_pair([1, 2], 100), None)\ncheck_call('zeros pair with each other', lambda: find_pair([0, 0], 0), (0, 1))\ncheck_call('pair at the ends', lambda: find_pair([1, 5, 9], 10), (0, 2))\nfinish()",
    entry: "find_pair([1, 3, 4, 6, 8], 10)",
    pdbLoad: ["args", "n", "n", "p l, r", "p sorted_vals[l] + sorted_vals[r]", "c"],
  },
  {
    id: 69, stage: 17, title: "The Missing Day", pattern: "range-fencepost", skill: "inclusive ends need the +1", file: "tenancy.py", bugCount: 1,
    statement: "tenancy.py counts the calendar days a room block occupies, from check-in THROUGH check-out. CI: 'a same-day block reports 0 days, and every booking is one short.'\n\nThe fencepost: how many posts does a fence with n rails have?",
    examples: [
      { input: "occupied_days(Mar 1, Mar 5)", output: "5", explain: "the 1st, 2nd, 3rd, 4th and 5th" },
      { input: "occupied_days(Mar 1, Mar 1)", output: "1", explain: "a same-day block still occupies a day" },
    ],
    why: "range(a, b) excludes b — perfect for rails-between-posts, wrong for inclusive spans. Counting inclusive days needs the +1 (or (checkout - checkin).days + 1). Same-day bookings returning 0 is the fencepost error announcing itself at the degenerate edge.",
    starterCode: "from datetime import date\n\n\ndef occupied_days(checkin, checkout):\n    \"\"\"Calendar days from check-in through check-out, inclusive.\"\"\"\n    return len(range(checkin.toordinal(), checkout.toordinal()))\n",
    hints: [
      "p checkin.toordinal(), checkout.toordinal() — does range include the second ordinal?",
      "A same-day block returns 0. What single arithmetic touch fixes every case at once?",
      "Inclusive spans need range(a, b + 1) — or (checkout - checkin).days + 1.",
    ],
    solution: "from datetime import date\n\n\ndef occupied_days(checkin, checkout):\n    \"\"\"Calendar days from check-in through check-out, inclusive.\"\"\"\n    return (checkout - checkin).days + 1\n",
    walkthrough: "p checkin.toordinal(), checkout.toordinal() shows (739..., 739...+4): range covers four ordinals, but the span touches five days. range's exclusive end is a rails-between-posts habit; inclusive spans are posts: (checkout - checkin).days + 1. The same-day case returning 0 was the fencepost bug at its clearest.",
    testCode: "check_call('five-day block', lambda: occupied_days(__import__('datetime').date(2026, 3, 1), __import__('datetime').date(2026, 3, 5)), 5)\ncheck_call('same-day block is one day', lambda: occupied_days(__import__('datetime').date(2026, 3, 1), __import__('datetime').date(2026, 3, 1)), 1)\ncheck_call('across a year boundary', lambda: occupied_days(__import__('datetime').date(2025, 12, 30), __import__('datetime').date(2026, 1, 2)), 4)\nfinish()",
    entry: "occupied_days(__import__('datetime').date(2026, 3, 1), __import__('datetime').date(2026, 3, 5))",
    pdbLoad: ["args", "p checkin, checkout", "p checkin.toordinal(), checkout.toordinal()", "c"],
  },

  // ══ STAGE 18 — The Number Line ══
  {
    id: 70, stage: 18, title: "The Truncated Floor", pattern: "int-vs-floor", skill: "int() truncates toward zero", file: "zones.py", bugCount: 1,
    statement: "zones.py maps positions to floor levels: 2.7 lands on level 2, and -0.5 is one level BELOW ground — level -1. CI: 'below-ground positions map to the ground floor.'\n\nTwo functions disagree about -0.5. The debugger can show both.",
    examples: [
      { input: "level(2.7)", output: "2", explain: "floored down" },
      { input: "level(-0.5)", output: "-1", explain: "below ground is its own level" },
    ],
    why: "int() truncates toward zero: int(-0.5) == 0. math.floor() rounds toward negative infinity: floor(-0.5) == -1. Above zero they agree — which is exactly why the bug hides until the first negative input. The spec says floor; the code says truncate.",
    starterCode: "import math\n\n\ndef level(position):\n    \"\"\"Floor index: 2.7 -> 2, -0.5 -> -1 (one level below ground).\"\"\"\n    return int(position)\n",
    hints: [
      "p int(-0.5) and p math.floor(-0.5) — same answer?",
      "Above zero the two agree. Where do they diverge?",
      "The spec says floor. Which function implements floor?",
    ],
    solution: "import math\n\n\ndef level(position):\n    \"\"\"Floor index: 2.7 -> 2, -0.5 -> -1 (one level below ground).\"\"\"\n    return math.floor(position)\n",
    walkthrough: "The transcript prints int(-0.5) -> 0 and math.floor(-0.5) -> -1 side by side: truncation vs flooring, identical above zero and opposite below. Positive-only tests had kept the lie invisible. One function name — int → math.floor — aligns the code with the spec's number line.",
    testCode: "check_call('2.7 floors to 2', lambda: level(2.7), 2)\ncheck_call('3.0 is already whole', lambda: level(3.0), 3)\ncheck_call('-0.5 is one below ground', lambda: level(-0.5), -1)\ncheck_call('-2.1 floors to -3', lambda: level(-2.1), -3)\ncheck_call('whole negative stays', lambda: level(-2.0), -2)\nfinish()",
    entry: "level(-0.5)",
    pdbLoad: ["args", "p int(-0.5)", "p math.floor(-0.5)", "c"],
  },
  {
    id: 71, stage: 18, title: "The Banker's Cut", pattern: "bankers-rounding", skill: "round() rounds half to even", file: "starrating.py", bugCount: 1,
    statement: "starrating.py renders whole-star ratings: the spec says halves round UP — 4.5 stars shows as 5. CI: '4.5 stars displays as 4, and 2.5 as 2, but 3.5 as 4.'\n\nThat pattern — some halves up, some down — has a name. The debugger can print it.",
    examples: [
      { input: "stars(4.5)", output: "5", explain: "half rounds UP" },
      { input: "stars(2.5)", output: "3", explain: "half rounds UP — every time" },
    ],
    why: "Python's round() uses banker's rounding: exact halves go to the EVEN neighbor — round(4.5) is 4, round(3.5) is 4, round(2.5) is 2. Fine for statistics, wrong for the half-up convention the spec demands. floor(x + 0.5) implements half-up in one expression.",
    starterCode: "import math\n\n\ndef stars(rating):\n    \"\"\"Whole stars, halves rounded up: 4.5 -> 5, 3.5 -> 4.\"\"\"\n    return round(rating)\n",
    hints: [
      "p round(4.5), p round(3.5), p round(2.5) — which way does each half go?",
      "Which halves does banker's rounding send DOWN? Why does 3.5 pass the tests?",
      "Half-up is floor(x + 0.5).",
    ],
    solution: "import math\n\n\ndef stars(rating):\n    \"\"\"Whole stars, halves rounded up: 4.5 -> 5, 3.5 -> 4.\"\"\"\n    return math.floor(rating + 0.5)\n",
    walkthrough: "The transcript prints round(4.5) -> 4, round(3.5) -> 4, round(2.5) -> 2: halves go to the even neighbor, so 3.5 accidentally agrees with the spec while 4.5 and 2.5 do not — the alternating pass/fail pattern that names the bug. math.floor(rating + 0.5) is half-up for every non-negative rating, and the odd test cases stop flip-flopping.",
    testCode: "check_call('4.5 shows as 5', lambda: stars(4.5), 5)\ncheck_call('2.5 shows as 3', lambda: stars(2.5), 3)\ncheck_call('3.5 shows as 4', lambda: stars(3.5), 4)\ncheck_call('below half stays', lambda: stars(4.4), 4)\ncheck_call('above half climbs', lambda: stars(4.6), 5)\nfinish()",
    entry: "stars(4.5)",
    pdbLoad: ["args", "p round(4.5)", "p round(2.5)", "p round(3.5)", "c"],
  },
  {
    id: 72, stage: 18, title: "The Exact Penny", pattern: "float-equality", skill: "money compares to the cent", file: "charge.py", bugCount: 1,
    statement: "charge.py checks whether payment parts cover an amount due. CI: 'a customer paying 0.10 + 0.20 against a 0.30 due gets DECLINED.'\n\nThe arithmetic is fine; the comparison is not. Print the sum.",
    examples: [
      { input: "is_exact([0.1, 0.2], 0.3)", output: "True", explain: "0.30 to the cent" },
      { input: "is_exact([1.13, 2.51], 3.64)", output: "True", explain: "3.640000...? to the cent, yes" },
    ],
    why: "Binary floats cannot represent 0.1 or 0.2 exactly, so 0.1 + 0.2 == 0.30000000000000004 — never equal to the literal 0.3. Money lives at two decimals: round the sum to the cent before comparing (or use integer cents / Decimal). == on accumulated floats compares representation noise.",
    starterCode: "def is_exact(payment_parts, due):\n    \"\"\"True iff the parts sum to the amount due, to the cent.\n\n    Amounts are dollars with at most two decimals; compare to the cent.\n    \"\"\"\n    return sum(payment_parts) == due\n",
    hints: [
      "p 0.1 + 0.2 — what comes back, to the last digit?",
      "The spec says 'to the cent'. At how many decimals do two amounts become equal money?",
      "round(sum(payment_parts), 2) == due compares money, not representations.",
    ],
    solution: "def is_exact(payment_parts, due):\n    \"\"\"True iff the parts sum to the amount due, to the cent.\n\n    Amounts are dollars with at most two decimals; compare to the cent.\n    \"\"\"\n    return round(sum(payment_parts), 2) == due\n",
    walkthrough: "p sum(payment_parts) prints 0.30000000000000004 — the sum is correct to the cent and wrong to the representation. The spec's 'to the cent' is the license to round before comparing; 0.3 == 0.3 is then trivially true. (The industrial versions of this fix are integer cents or decimal.Decimal — the walkthrough's point is that == on floats compares noise.)",
    testCode: "check_call('0.10 + 0.20 covers 0.30', lambda: is_exact([0.1, 0.2], 0.3), True)\ncheck_call('1.13 + 2.51 covers 3.64', lambda: is_exact([1.13, 2.51], 3.64), True)\ncheck_call('exact single part', lambda: is_exact([5.0], 5.0), True)\ncheck_call('a cent short is not exact', lambda: is_exact([0.1, 0.2], 0.31), False)\nfinish()",
    entry: "is_exact([0.1, 0.2], 0.3)",
    pdbLoad: ["args", "n", "p sum(payment_parts)", "p 0.1 + 0.2", "c"],
  },
  {
    id: 73, stage: 18, title: "The Broken Clock", pattern: "modular-wrap", skill: "clocks wrap with %", file: "shiftclock.py", bugCount: 1,
    statement: "shiftclock.py rewinds times: 10:00 minus 90 minutes is 8:30, and 01:00 minus 90 minutes is 23:30 — the day before. CI: 'going past midnight produces times from a mirror universe.'\n\nWatch total turn negative. What does abs() do to a clock?",
    examples: [
      { input: "shift_back(1, 0, 90)", output: "(23, 30)", explain: "wraps to the previous day" },
      { input: "shift_back(10, 0, 90)", output: "(8, 30)", explain: "same-day rewind" },
    ],
    why: "A clock is arithmetic mod 24*60: negative totals are not errors, they are yesterday. abs() destroys the phase information (abs(-30) == 30 means 00:30, not 23:30), while % (24*60) maps any total — positive or negative — onto the real clock face. Python's % returns a result with the divisor's sign, so it wraps negatives correctly.",
    starterCode: "def shift_back(h, m, minutes):\n    \"\"\"Time `minutes` earlier as (h, m), wrapping past midnight.\"\"\"\n    total = h * 60 + m - minutes\n    if total < 0:\n        total = abs(total)\n    return (total // 60, total % 60)\n",
    hints: [
      "p total right after the subtraction for (1, 0, 90). What is it? What SHOULD 01:00 minus 90m be?",
      "abs(-30) is 30 — but -30 minutes past midnight is 23:30, not 00:30. What operation maps -30 onto 1410?",
      "One expression wraps everything: total = (h * 60 + m - minutes) % (24 * 60).",
    ],
    solution: "def shift_back(h, m, minutes):\n    \"\"\"Time `minutes` earlier as (h, m), wrapping past midnight.\"\"\"\n    total = (h * 60 + m - minutes) % (24 * 60)\n    return (total // 60, total % 60)\n",
    walkthrough: "The transcript: p total prints -30 for (1, 0, 90) — thirty minutes before midnight — then abs() flips it to +30, i.e. 00:30, a time twelve hours from the truth. Modular arithmetic is the clock's native language: -30 % 1440 == 1410 == 23:30, automatically, for any overshoot. One expression replaces the if/abs and handles positive cases unchanged.",
    testCode: "check_call('01:00 minus 90m is 23:30', lambda: shift_back(1, 0, 90), (23, 30))\ncheck_call('00:30 minus 45m is 23:45', lambda: shift_back(0, 30, 45), (23, 45))\ncheck_call('same-day rewind', lambda: shift_back(10, 0, 90), (8, 30))\ncheck_call('zero shift is identity', lambda: shift_back(5, 0, 0), (5, 0))\ncheck_call('more than a day back wraps', lambda: shift_back(6, 0, 24 * 60), (6, 0))\nfinish()",
    entry: "shift_back(1, 0, 90)",
    pdbLoad: ["args", "n", "p total", "n", "n", "p total", "c"],
  },
]
