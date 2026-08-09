export interface Problem {
  id: number
  stage: number
  title: string
  pattern: string
  skill: string
  statement: string
  examples: { input: string; output: string; explain?: string }[]
  why: string
  starterCode: string
  hints: string[]
  solution: string
  walkthrough: string
  testCode: string
}

export const STAGES_INTERVALS = [
  { id: 0, name: "Overlap Reflex", desc: "6 orderings→1 test" },
  { id: 1, name: "Sort by Start", desc: "adjacent check" },
  { id: 2, name: "Merge", desc: "running interval" },
  { id: 3, name: "Insert & Gaps", desc: "three zones" },
  { id: 4, name: "Naive", desc: "pairwise check" },
  { id: 5, name: "Optimization", desc: "sweep line" },
  { id: 6, name: "Mastery", desc: "compose" },
]

export const PROBLEMS_INTERVALS: Problem[] = [
  // ── STAGE 0: Overlap Reflex ──
  {
    id: 1, stage: 0, title: "Check If Two Intervals Overlap", pattern: "single overlap test", skill: "max(start1,start2) < min(end1,end2)",
    statement: "Given two intervals [s1,e1] and [s2,e2], return True if they overlap (share at least one point). Use the formula: max(s1,s2) < min(e1,e2).",
    examples: [
      { input: "a = [1,5], b = [2,6]", output: "True", explain: "overlap at 2..5" },
      { input: "a = [1,3], b = [4,6]", output: "False", explain: "gap between 3 and 4" },
      { input: "a = [1,4], b = [4,6]", output: "True", explain: "touch at 4 is overlap" },
    ],
    why: "This single test is the foundation of ALL interval algorithms. The 6 possible orderings collapse into one question: do the intervals intersect? max(start) < min(end) covers them all.",
    starterCode: "def has_overlap(a, b):\n    pass",
    hints: [
      "Two intervals overlap if the latest start is before the earliest end.",
      "max(a[0], b[0]) < min(a[1], b[1]) — less than (not <=) for strict overlap; <= includes touching.",
      "There are 6 ways to arrange 4 points. This one condition handles all of them."
    ],
     solution: "def has_overlap(a, b):\n    return max(a[0], b[0]) <= min(a[1], b[1])",
    walkthrough: "Overlap means the intervals intersect. The overlap region starts at the later of the two starts and ends at the earlier of the two ends. If the start of the overlap region < end, they overlap. max(s1,s2) < min(e1,e2) encodes this in one line.",
    testCode: "assert has_overlap([1,5], [2,6]) == True\nassert has_overlap([1,3], [4,6]) == False\nassert has_overlap([1,4], [4,6]) == True\nassert has_overlap([2,3], [1,2]) == True\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Six Ordering Cases Exercise", pattern: "enumerate all cases", skill: "identify the 6 ways two intervals can relate",
    statement: "Write a function that takes two intervals and returns the CASE type: 'overlap', 'b_after_a', 'a_after_b', 'b_contains_a', 'a_contains_b', or 'identical'. List all 6 orderings.",
    examples: [
      { input: "a = [1,5], b = [3,7]", output: "'overlap'" },
      { input: "a = [1,3], b = [4,6]", output: "'b_after_a'" },
      { input: "a = [2,8], b = [3,5]", output: "'a_contains_b'" },
    ],
    why: "Six cases exist. Any interval algorithm must handle all of them correctly. Enumerating them builds the mental model: before, after, overlap, contains (two directions), identical.",
    starterCode: "def classify_overlap(a, b):\n    s1, e1 = a\n    s2, e2 = b\n    pass",
    hints: [
      "Check identity: s1 == s2 and e1 == e2. Check contains: s1 <= s2 and e1 >= e2 (a contains b) or vice versa.",
      "Check after/before: e1 <= s2 means b is after a. e2 <= s1 means a is after b.",
      "Otherwise: overlap."
    ],
    solution: "def classify_overlap(a, b):\n    s1, e1 = a\n    s2, e2 = b\n    if s1 == s2 and e1 == e2:\n        return 'identical'\n    if s1 <= s2 and e1 >= e2:\n        return 'a_contains_b'\n    if s2 <= s1 and e2 >= e1:\n        return 'b_contains_a'\n    if e1 <= s2:\n        return 'b_after_a'\n    if e2 <= s1:\n        return 'a_after_b'\n    return 'overlap'",
    walkthrough: "Six relations: (1) identical, (2-3) one contains the other, (4-5) completely disjoint (one before the other), (6) partial overlap. The check order matters: check contains before disjoint to avoid misclassification.",
    testCode: "assert classify_overlap([1,5], [3,7]) == 'overlap'\nassert classify_overlap([1,3], [4,6]) == 'b_after_a'\nassert classify_overlap([2,8], [3,5]) == 'a_contains_b'\nassert classify_overlap([3,5], [1,8]) == 'b_contains_a'\nassert classify_overlap([1,3], [1,3]) == 'identical'\nassert classify_overlap([5,7], [1,3]) == 'a_after_b'\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Find Any Overlap in List", pattern: "brute-force overlap check", skill: "check all pairs, find first overlap",
    statement: "Given a list of intervals, return True if ANY two intervals overlap. Brute-force: check all O(n²) pairs.",
    examples: [
      { input: "intervals = [[1,3],[8,10],[7,8]]", output: "True", explain: "[8,10] and [7,8] overlap at 8" },
      { input: "intervals = [[1,3],[4,6]]", output: "False" },
    ],
    why: "The pairwise check is the entry to 'does ANY overlap exist' — the question that leads to sorting-based approaches. When intervals are sorted, you only need to check adjacent pairs.",
    starterCode: "def has_any_overlap(intervals):\n    pass",
    hints: [
      "Use the overlap test from P1 on every pair (i,j) where i < j.",
      "O(n²) is fine for small n. For larger n, we'll optimize in Stage 1.",
      "Return True as soon as you find the first overlapping pair."
    ],
     solution: "def has_any_overlap(intervals):\n    n = len(intervals)\n    for i in range(n):\n        for j in range(i + 1, n):\n            s1, e1 = intervals[i]\n            s2, e2 = intervals[j]\n            if max(s1, s2) <= min(e1, e2):\n                return True\n    return False",
    walkthrough: "Brute-force all pairs. For each pair, use the max-start < min-end overlap test. Return on first found. O(n²). This establishes the baseline: pairwise checking works but is expensive — motivating the sorting optimization in Stage 1.",
    testCode: "assert has_any_overlap([[1,3],[8,10],[7,8]]) == True\nassert has_any_overlap([[1,3],[4,6]]) == False\nassert has_any_overlap([[1,2],[2,3],[3,4]]) == True\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "All Six Cases Exercise — Collection", pattern: "generate all 6 case examples", skill: "produce test data covering all ordering relations",
    statement: "Create a function that takes two intervals in grid order and tests ALL six classification outcomes, verifying that the overlap test + classification work correctly on generated cases.",
    examples: [
      { input: "(none — generates test cases)", output: "True (all six cases verified)" },
    ],
    why: "Automaticity: the 6-case framework must become a reflex. Generating all six cases and testing the classification solidifies the mental model before we move to sorting-based optimization.",
    starterCode: "def verify_all_six_cases():\n    cases = []\n    pass",
    hints: [
      "Generate: identical (same interval), a_contains_b (a=[2,8], b=[3,5]), b_contains_a (swap), disjoint a< b (a=[1,3], b=[4,6]), disjoint b<a (swap), overlap (a=[1,5], b=[3,7]).",
      "For each case, run classify_overlap and check against expected label.",
      "Also verify: the overlap test from P1 returns True for identical, contains, overlap; False for disjoint."
    ],
     solution: "def verify_all_six_cases():\n    def classify_overlap(a, b):\n        s1, e1 = a\n        s2, e2 = b\n        if s1 == s2 and e1 == e2:\n            return 'identical'\n        if s1 <= s2 and e1 >= e2:\n            return 'a_contains_b'\n        if s2 <= s1 and e2 >= e1:\n            return 'b_contains_a'\n        if e1 <= s2:\n            return 'b_after_a'\n        if e2 <= s1:\n            return 'a_after_b'\n        return 'overlap'\n    def has_overlap(a, b):\n        return max(a[0], b[0]) <= min(a[1], b[1])\n    cases = [\n        ([1,5],[1,5],'identical'),\n        ([2,8],[3,5],'a_contains_b'),\n        ([3,5],[1,8],'b_contains_a'),\n        ([1,3],[4,6],'b_after_a'),\n        ([5,7],[1,3],'a_after_b'),\n        ([1,5],[3,7],'overlap'),\n    ]\n    for a, b, expected in cases:\n        if classify_overlap(a, b) != expected:\n            return False\n        if expected in ('b_after_a', 'a_after_b'):\n            if has_overlap(a, b):\n                return False\n        elif not has_overlap(a, b):\n            return False\n    return True",
    walkthrough: "Generate all six cases. Run classification and overlap test on each. Verify: disjoint cases should have no overlap, all others should overlap. This exercise builds the reflex that 'max(start) < min(end)' covers 4 of 6 cases, and the other 2 (disjoint) are its negation.",
    testCode: "assert verify_all_six_cases() == True\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Check If Interval Contains Point", pattern: "point-in-interval test", skill: "check if a point p falls within [start, end]: start <= p <= end",
    statement: "Given an interval [start, end] and a point p, return True if p is inside the interval (inclusive). Use: start <= p <= end.",
    examples: [
      { input: "interval = [1,5], p = 3", output: "True" },
      { input: "interval = [1,5], p = 6", output: "False" },
      { input: "interval = [1,5], p = 1", output: "True", explain: "boundary is inclusive" },
    ],
    why: "The point-in-interval test is the one-dimension-lower analog of overlap. An interval is a set of points; containment is the question 'is this point in the set?' This is the atomic membership question for intervals.",
    starterCode: "def contains_point(interval, p):\n    pass",
    hints: [
      "Check if p is between start and end (inclusive): start <= p <= end.",
      "This is a single range check. O(1).",
      "Contrast with overlap: overlap asks 'do these two line segments intersect?' Containment asks 'is this point inside?'"
    ],
    solution: "def contains_point(interval, p):\n    return interval[0] <= p <= interval[1]",
    walkthrough: "A point p is in the interval [start, end] if start <= p <= end. This is the foundation of all interval-point operations. If the interval is open (start < p < end), the test changes — but closed intervals are the default.",
    testCode: "assert contains_point([1,5], 3) == True\nassert contains_point([1,5], 6) == False\nassert contains_point([1,5], 1) == True\nassert contains_point([1,5], 5) == True\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 0, title: "Interval Length", pattern: "basic interval property", skill: "compute end - start (width of interval)",
    statement: "Given an interval [start, end], return its length: end - start. This measures how many units the interval spans.",
    examples: [
      { input: "interval = [1,5]", output: "4" },
      { input: "interval = [0,10]", output: "10" },
    ],
    why: "Interval length = end - start. This is the most basic interval metric. Used when computing total covered length, gaps, or comparing interval sizes. Establishes the end-always-greater-than-start invariant.",
    starterCode: "def interval_length(interval):\n    pass",
    hints: [
      "Return interval[1] - interval[0].",
      "For [1,5]: length = 5 - 1 = 4.",
      "Length of a point-interval [a,a] is 0."
    ],
    solution: "def interval_length(interval):\n    return interval[1] - interval[0]",
    walkthrough: "Length = end - start. Assumes end >= start. The distance between the two boundaries. This simple metric powers total coverage computation (sum of merged interval lengths), gap detection, and overlap region size calculation.",
    testCode: "assert interval_length([1,5]) == 4\nassert interval_length([0,10]) == 10\nassert interval_length([3,3]) == 0\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 0, title: "Find Overlap Region", pattern: "intersection computation", skill: "return the overlapping region as [max_start, min_end] if it exists",
    statement: "Given two intervals a and b, return the overlapping region as an interval [max_start, min_end]. If they don't overlap (max_start >= min_end), return None or empty. This is the actual intersection, not just a True/False.",
    examples: [
      { input: "a = [1,5], b = [2,6]", output: "[2,5]", explain: "overlap region is [2,5]" },
      { input: "a = [1,3], b = [4,6]", output: "None", explain: "no overlap" },
    ],
    why: "The overlap TEST (P1) answers yes/no. The overlap REGION is the actual intersection — the interval where both overlap. max(start) < min(end) is the test; [max(start), min(end)] is the region. Building the region is step 1 toward merge.",
    starterCode: "def overlap_region(a, b):\n    pass",
    hints: [
      "Compute max_start = max(a[0], b[0]), min_end = min(a[1], b[1]).",
      "If max_start < min_end: return [max_start, min_end]. Else: return None.",
      "This is the overlap test + constructing the answer interval."
    ],
     solution: "def overlap_region(a, b):\n    start = max(a[0], b[0])\n    end = min(a[1], b[1])\n    if start <= end:\n        return [start, end]\n    return None",
    walkthrough: "Overlap region = the intersection of two line segments. max(start) gives the later start (left edge of overlap). min(end) gives the earlier end (right edge). If start < end, the region is non-empty. This is the building block for merge: each merge decision uses this region.",
    testCode: "assert overlap_region([1,5], [2,6]) == [2,5]\nassert overlap_region([1,3], [4,6]) is None\nassert overlap_region([1,4], [4,6]) == [4,4]\nprint('All tests passed!')"
  },

  // ── STAGE 1: Sort by Start ──
  {
    id: 8, stage: 1, title: "Check Adjacent Only After Sorting", pattern: "sort then adjacent check", skill: "after sorting, overlap can only happen between neighbors",
    statement: "Given a list of intervals, sort by start time. Then check ONLY adjacent pairs for overlap. Prove: if two intervals A and C (non-adjacent) overlap, then B (between them) MUST overlap with at least one.",
    examples: [
      { input: "intervals = [[1,5],[2,3],[4,6]]", output: "True", explain: "adjacent [1,5] and [4,6] overlap" },
      { input: "intervals = [[1,2],[3,4]]", output: "False" },
    ],
    why: "Sorting by start makes overlap check O(n log n) instead of O(n²). The key property: sorted by start, if A and C overlap, then A and B (adjacent) also overlap. Adjacent check is sufficient.",
    starterCode: "def has_overlap_sorted(intervals):\n    intervals.sort(key=lambda x: x[0])\n    pass",
    hints: [
      "Sort by start. Iterate i from 0 to n-2: check interval i and i+1 using the overlap test.",
      "Why adjacent? If intervals sorted by start, any non-adjacent overlap MUST also have an adjacent overlap.",
      "Property: if A overlaps C (A before C), then B (between A and C) starts at most C.start and extends past A.end — so A overlaps B."
    ],
     solution: "def has_overlap_sorted(intervals):\n    intervals.sort(key=lambda x: x[0])\n    for i in range(len(intervals) - 1):\n        if intervals[i][1] >= intervals[i+1][0]:\n            return True\n    return False",
    walkthrough: "Sort by start. Iterate adjacent pairs. If intervals[i].end > intervals[i+1].start, they overlap. This is sufficient because if any two non-adjacent intervals A,C overlap, then A must also overlap the interval B between them (B starts <= C.start < A.end). Checking adjacent pairs catches all overlaps. O(n log n).",
    testCode: "assert has_overlap_sorted([[1,5],[2,3],[4,6]]) == True\nassert has_overlap_sorted([[1,2],[3,4]]) == False\nassert has_overlap_sorted([[1,3],[8,10],[7,8]]) == True\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Why Far Pairs Are Redundant", pattern: "transitivity proof", skill: "if A.start <= B.start <= C.start and A overlaps C, then A overlaps B",
    statement: "Prove: after sorting by start, if intervals A,B,C are in order and A overlaps C, then A must also overlap B. Implement code that verifies this property on all triples of randomly generated intervals.",
    examples: [
      { input: "(random intervals generated)", output: "True (property verified for all inputs)" },
    ],
    why: "Make the proof concrete. The claim 'check adjacent pairs is sufficient' rests on this transitivity. Verifying on generated data builds conviction.",
    starterCode: "def verify_transitivity(intervals):\n    intervals.sort(key=lambda x: x[0])\n    pass",
    hints: [
      "Sort by start. For each triple (i, j, k) with i < j < k: if intervals[i] overlaps intervals[k], check that intervals[i] also overlaps intervals[j].",
      "The proof: sorted by start, intervals[i].start <= intervals[j].start <= intervals[k].start. If A overlaps C, intervals[i].end > intervals[k].start >= intervals[j].start — so A.end > B.start, hence A overlaps B.",
      "Return True only if the property holds for ALL triples."
    ],
    solution: "def verify_transitivity(intervals):\n    intervals.sort(key=lambda x: x[0])\n    n = len(intervals)\n    for i in range(n):\n        for j in range(i + 1, n):\n            for k in range(j + 1, n):\n                a, b, c = intervals[i], intervals[j], intervals[k]\n                if a[1] > c[0]:\n                    if not (a[1] > b[0]):\n                        return False\n    return True",
    walkthrough: "For all triples A,B,C (sorted by start): if A overlaps C (A.end > C.start), then check A overlaps B (A.end > B.start). Since B.start <= C.start (sort order), A.end > C.start implies A.end > B.start. The code tests every triple against this property. Always True — this is a mathematical invariant.",
    testCode: "assert verify_transitivity([[1,5],[2,3],[4,6]]) == True\nassert verify_transitivity([[1,3],[4,5],[6,8]]) == True\nassert verify_transitivity([[1,4],[2,3],[3,5]]) == True\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Sort Intervals by Start", pattern: "sorting intervals", skill: "implement sort by start, verify correctness",
    statement: "Write a function that sorts intervals by start time ascending. If two intervals have the same start, sort by end ascending. Verify the sorted result.",
    examples: [
      { input: "intervals = [[5,9],[1,3],[2,6],[1,2]]", output: "[[1,2],[1,3],[2,6],[5,9]]" },
    ],
    why: "Sorting is the prelude to every interval algorithm. Getting the sort key right (start, then end) and verifying the order are prerequisites for Stages 2+.",
    starterCode: "def sort_intervals(intervals):\n    pass",
    hints: [
      "Use sorted(intervals, key=lambda x: (x[0], x[1])).",
      "x[0] (start) primary, x[1] (end) secondary for tie-breaking.",
      "Verify: for all i, sorted[i][0] <= sorted[i+1][0], and if equal start, sorted[i][1] <= sorted[i+1][1]."
    ],
    solution: "def sort_intervals(intervals):\n    return sorted(intervals, key=lambda x: (x[0], x[1]))",
    walkthrough: "Sort by start ascending, end ascending. This ordering groups intervals by position, enabling adjacent-only checks. Tie-breaking by end ensures consistent behavior when intervals share start points.",
    testCode: "assert sort_intervals([[5,9],[1,3],[2,6],[1,2]]) == [[1,2],[1,3],[2,6],[5,9]]\nassert sort_intervals([[3,5],[3,4],[1,2]]) == [[1,2],[3,4],[3,5]]\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Verify Sorted Property", pattern: "sorted invariant check", skill: "check that sorting + adjacent overlap is equivalent to pairwise check",
    statement: "For a list of intervals, verify that sorting by start and checking adjacent pairs produces the SAME result as checking all pairs (the pairwise method from P3). Return True if equivalent.",
    examples: [
      { input: "intervals = [[1,5],[2,3],[4,6]]", output: "True" },
      { input: "intervals = [[1,2],[3,4]]", output: "True" },
    ],
    why: "This verifies the central claim of Stage 1: adjacent-only check after sorting is equivalent to checking all pairs. Proof via code execution.",
    starterCode: "def verify_equivalence(intervals):\n    def pairwise_check(ints):\n        pass\n    def adjacent_check(ints):\n        pass\n    pass",
    hints: [
      "Implement both methods: pairwise (O(n²)) and adjacent-only after sort (O(n log n)).",
      "Run both on the same input and compare boolean results.",
      "They should ALWAYS agree if the transitivity property holds."
    ],
    solution: "def verify_equivalence(intervals):\n    def pairwise_check(ints):\n        n = len(ints)\n        for i in range(n):\n            for j in range(i + 1, n):\n                if max(ints[i][0], ints[j][0]) < min(ints[i][1], ints[j][1]):\n                    return True\n        return False\n    def adjacent_check(ints):\n        s = sorted(ints, key=lambda x: x[0])\n        for i in range(len(s) - 1):\n            if s[i][1] > s[i+1][0]:\n                return True\n        return False\n    return pairwise_check(intervals) == adjacent_check(intervals)",
    walkthrough: "Run both algorithms on the same input. If they always agree, adjacent-only check is proven correct. The transitivity property (P6) guarantees they'll always agree for any input.",
    testCode: "assert verify_equivalence([[1,5],[2,3],[4,6]]) == True\nassert verify_equivalence([[1,2],[3,4]]) == True\nassert verify_equivalence([[1,3],[8,10],[7,8]]) == True\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Sort by End Time", pattern: "sort by end", skill: "sort intervals by end time ascending; use for greedy earliest-finish algorithms",
    statement: "Sort intervals by end time ascending. If ends equal, sort by start ascending. Return the sorted list. This ordering is the foundation of activity selection and minimum-arrows algorithms.",
    examples: [
      { input: "intervals = [[1,5],[2,3],[0,2]]", output: "[[0,2],[2,3],[1,5]]" },
    ],
    why: "Sort by start (Stage 1) enables adjacent overlap checks. Sort by END enables greedy selection: picking the earliest-finishing interval maximizes remaining space. Both sort orders are fundamental — different purposes, different keys.",
    starterCode: "def sort_by_end(intervals):\n    pass",
    hints: [
      "Use sorted(intervals, key=lambda x: (x[1], x[0])). Primary sort key is end, secondary is start.",
      "Sorting by end groups intervals by when they finish — crucial for selecting non-overlapping subsets.",
      "Contrast with sort by start: start-sort groups by beginning, end-sort groups by completion."
    ],
    solution: "def sort_by_end(intervals):\n    return sorted(intervals, key=lambda x: (x[1], x[0]))",
    walkthrough: "Sort by end ascending, start ascending for tie-breaking. For activity selection: after sorting by end, each picked interval is the locally earliest-finishing compatible one. This greed is optimal — proof: replacing any chosen earliest-finish with a later-finish can only reduce remaining capacity.",
    testCode: "assert sort_by_end([[1,5],[2,3],[0,2]]) == [[0,2],[2,3],[1,5]]\nassert sort_by_end([[2,3],[1,2],[3,4]]) == [[1,2],[2,3],[3,4]]\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 1, title: "Find Earliest and Latest Interval", pattern: "min/max on interval properties", skill: "find interval with min start (earliest) and max end (latest)",
    statement: "Given a list of intervals, return the interval with the earliest start time and the interval with the latest end time. If multiple have the same start/end, return any.",
    examples: [
      { input: "intervals = [[3,5],[1,4],[2,6]]", output: "([1,4], [2,6])" },
      { input: "intervals = [[0,1],[5,10]]", output: "([0,1], [5,10])" },
    ],
    why: "Finding min start and max end defines the overall temporal span. These extremes are the bounds of merge operations. After merging, all intervals fit between min_start and max_end.",
    starterCode: "def find_extremes(intervals):\n    if not intervals:\n        return None\n    pass",
    hints: [
      "Earliest: min(intervals, key=lambda x: x[0]). Latest end: max(intervals, key=lambda x: x[1]).",
      "This defines the 'span' of the interval set — the overall time window.",
      "The merged result will always start at or after the min start, and end at or before the max end."
    ],
    solution: "def find_extremes(intervals):\n    if not intervals:\n        return None\n    earliest = min(intervals, key=lambda x: x[0])\n    latest = max(intervals, key=lambda x: x[1])\n    return (earliest, latest)",
    walkthrough: "Single pass: track minimum start and maximum end. O(n). This gives the temporal bounds. All other intervals are contained within [min_start, max_end] after merging. The extremes bracket the entire time range.",
    testCode: "assert find_extremes([[3,5],[1,4],[2,6]]) == ([1,4], [2,6])\nassert find_extremes([[0,1],[5,10]]) == ([0,1], [5,10])\nassert find_extremes([]) is None\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 1, title: "Group Overlapping Intervals (Adjacent)", pattern: "adjacent overlap grouping", skill: "after sorting by start, group intervals into overlapping clusters via adjacent check",
    statement: "Given intervals, sort by start and group them into clusters where each cluster is a set of intervals that form a connected overlapping chain (adjacent overlaps). Return list of clusters.",
    examples: [
      { input: "intervals = [[1,3],[2,4],[5,7],[6,8],[10,12]]", output: "[[[1,3],[2,4]],[[5,7],[6,8]],[[10,12]]]" },
      { input: "intervals = [[1,5],[5,10]]", output: "[[[1,5],[5,10]]]", explain: "touch at 5 = same cluster" },
    ],
    why: "Adjacent overlap grouping is merge without the combining step. Sort by start, then break groups when next.start > cur_end (no overlap). This partitions intervals into connected components. Shows that 'does overlap exist?' → yes/no per adjacent pair decides group boundaries.",
    starterCode: "def group_overlapping(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    groups = []\n    cur_group = [intervals[0]]\n    cur_end = intervals[0][1]\n    pass",
    hints: [
      "Sort by start. Start first group with intervals[0]. Track cur_end = max end in current group.",
      "For each next: if start <= cur_end, add to current group, update cur_end = max(cur_end, end).",
      "Else: finalize group (append to groups), start new group with this interval."
    ],
    solution: "def group_overlapping(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    groups = []\n    cur = [intervals[0]]\n    cur_end = intervals[0][1]\n    for s, e in intervals[1:]:\n        if s <= cur_end:\n            cur.append([s, e])\n            cur_end = max(cur_end, e)\n        else:\n            groups.append(cur)\n            cur = [[s, e]]\n            cur_end = e\n    groups.append(cur)\n    return groups",
    walkthrough: "Sort by start. Adjacent overlap = same group. Touching counts as overlap (<=). Each group is a connected component: intervals that can reach each other through a chain of overlaps. This is the pre-merge clustering step — within each group, intervals will be merged into one.",
    testCode: "assert group_overlapping([[1,3],[2,4],[5,7],[6,8],[10,12]]) == [[[1,3],[2,4]],[[5,7],[6,8]],[[10,12]]]\nassert group_overlapping([[1,5],[5,10]]) == [[[1,5],[5,10]]]\nprint('All tests passed!')"
  },

  // ── STAGE 2: Merge ──
  {
    id: 15, stage: 2, title: "Merge Intervals", pattern: "running merged interval", skill: "maintain [cur_start, cur_end]; extend cur_end or finalize",
    statement: "Given list of intervals, merge all overlapping intervals. Return list of non-overlapping intervals covering all input intervals. Sort by start, maintain current merged interval; if next.start <= cur.end, extend cur.end.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
      { input: "intervals = [[1,4],[4,5]]", output: "[[1,5]]" },
    ],
    why: "Merge is THE canonical interval algorithm. Sort by start, walk through, maintaining a 'running interval' that expands as long as the next overlaps. When it doesn't overlap, finalize the running interval and start a new one.",
    starterCode: "def merge(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    merged = []\n    cur_start, cur_end = intervals[0]\n    pass",
    hints: [
      "Sort by start. Init current interval = intervals[0].",
      "For next interval: if next.start <= cur.end, cur_end = max(cur_end, next.end).",
      "Else: finalize current interval (append [cur_start, cur_end]), start new current with next."
    ],
    solution: "def merge(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    merged = []\n    cur_start, cur_end = intervals[0]\n    for start, end in intervals[1:]:\n        if start <= cur_end:\n            cur_end = max(cur_end, end)\n        else:\n            merged.append([cur_start, cur_end])\n            cur_start, cur_end = start, end\n    merged.append([cur_start, cur_end])\n    return merged",
    walkthrough: "Sort by start. Maintain a running interval [cur_start, cur_end]. For each next interval: if it overlaps (start <= cur_end), extend cur_end to max(cur_end, end). If no overlap, finalize the running interval and start a new one. Don't forget to append the last running interval.",
    testCode: "assert merge([[1,3],[2,6],[8,10],[15,18]]) == [[1,6],[8,10],[15,18]]\nassert merge([[1,4],[4,5]]) == [[1,5]]\nassert merge([[1,3]]) == [[1,3]]\nassert merge([]) == []\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Merge with Output List (Alternative)", pattern: "merge using result list", skill: "compare with last merged interval in output list",
    statement: "Alternative merge: instead of tracking cur_start/cur_end, use the output list. Compare each interval with the LAST element of merged list. Extend if overlap, append if not.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[[1,6],[8,10],[15,18]]" },
    ],
    why: "Same result, different code style. Comparing with merged[-1] reads as 'extend or append' — many students find this more intuitive than tracking separate cur_start/cur_end variables.",
    starterCode: "def merge_v2(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    pass",
    hints: [
      "Initialize merged with first interval. For each next: compare start with merged[-1].end.",
      "If start <= merged[-1][1], extend merged[-1][1] = max(merged[-1][1], end).",
      "Else, append [start, end] as a new merged interval."
    ],
    solution: "def merge_v2(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    merged = [intervals[0]]\n    for start, end in intervals[1:]:\n        if start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged",
    walkthrough: "Same logic as P9, but using merged[-1] as the 'current interval' instead of separate variables. Start with first interval in merged. For each next: if overlap (start <= merged[-1].end), extend merged[-1].end. Otherwise, start a new interval by appending. Equivalent to P9.",
    testCode: "assert merge_v2([[1,3],[2,6],[8,10],[15,18]]) == [[1,6],[8,10],[15,18]]\nassert merge_v2([[1,4],[0,2],[3,5]]) == [[0,5]]\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Count Merged Groups", pattern: "count final merged intervals", skill: "apply merge, count resulting intervals",
    statement: "Given intervals, count how many merged groups result after merging all overlaps. Return the number of non-overlapping merged intervals.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "3" },
      { input: "intervals = [[1,4],[0,4]]", output: "1" },
    ],
    why: "Merge's output size = number of distinct connected components in the interval graph. This connects intervals to graph connectivity — each merged group is a connected component.",
    starterCode: "def count_merged_groups(intervals):\n    if not intervals:\n        return 0\n    intervals.sort(key=lambda x: x[0])\n    groups = 0\n    cur_end = intervals[0][1]\n    pass",
    hints: [
      "Sort by start. Track cur_end. Start groups count = 0.",
      "For each interval: if start > cur_end, new group needed (groups++), reset cur_end = end.",
      "Else (overlap): cur_end = max(cur_end, end). Return groups at end."
    ],
    solution: "def count_merged_groups(intervals):\n    if not intervals:\n        return 0\n    intervals.sort(key=lambda x: x[0])\n    groups = 1\n    cur_end = intervals[0][1]\n    for start, end in intervals[1:]:\n        if start > cur_end:\n            groups += 1\n            cur_end = end\n        else:\n            cur_end = max(cur_end, end)\n    return groups",
    walkthrough: "Sort by start. Track cur_end. When next.start > cur_end, we've found a new group (increment groups, reset cur_end). Otherwise, extend cur_end. Each distinct group is a connected component of overlapping intervals.",
    testCode: "assert count_merged_groups([[1,3],[2,6],[8,10],[15,18]]) == 3\nassert count_merged_groups([[1,4],[0,4]]) == 1\nassert count_merged_groups([]) == 0\nassert count_merged_groups([[1,2],[3,4]]) == 2\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Total Covered Length", pattern: "sum of merged interval lengths", skill: "compute sum(max(end-start) for each merged group)",
    statement: "Given intervals, return the total length covered by the union of all intervals. Merge first, then sum the lengths of merged intervals.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10]]", output: "7", explain: "[1,6] covers 5, [8,10] covers 2 → 7" },
      { input: "intervals = [[0,5],[3,7]]", output: "7" },
    ],
    why: "After merging, each resulting interval represents a contiguous covered region. Total coverage = sum of lengths. Useful for measuring coverage in scheduling, genome assembly, etc.",
    starterCode: "def total_covered_length(intervals):\n    if not intervals:\n        return 0\n    intervals.sort(key=lambda x: x[0])\n    total = 0\n    cur_start, cur_end = intervals[0]\n    pass",
    hints: [
      "Merge as in P9. While merging, compute total after finalizing each merged interval.",
      "When starting a new interval (no overlap), add cur_end - cur_start to total.",
      "Don't forget to add the last merged interval's length."
    ],
    solution: "def total_covered_length(intervals):\n    if not intervals:\n        return 0\n    intervals.sort(key=lambda x: x[0])\n    total = 0\n    cur_start, cur_end = intervals[0]\n    for start, end in intervals[1:]:\n        if start <= cur_end:\n            cur_end = max(cur_end, end)\n        else:\n            total += cur_end - cur_start\n            cur_start, cur_end = start, end\n    total += cur_end - cur_start\n    return total",
    walkthrough: "Merge intervals. When a merged interval is finalized (no overlap), add its length to total. At the end, add the last merged interval's length. Each point is counted exactly once because merged intervals are disjoint.",
    testCode: "assert total_covered_length([[1,3],[2,6],[8,10]]) == 7\nassert total_covered_length([[0,5],[3,7]]) == 7\nassert total_covered_length([[1,2],[2,3]]) == 2\nassert total_covered_length([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Merge In-Place", pattern: "in-place array modification", skill: "modify input array to remove merged intervals, return new length",
    statement: "Given a sorted list of intervals (already sorted by start), merge in-place and return the number of non-overlapping intervals. The first k elements of the array should be the merged intervals.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "3", explain: "modified array: [[1,6],[8,10],[15,18],...]" },
    ],
    why: "In-place merging is the 'two-pointer write into same array' pattern. Write position tracks the last finalized interval. Overwrite the array in a single pass.",
    starterCode: "def merge_in_place(intervals):\n    if not intervals:\n        return 0\n    write = 0\n    pass",
    hints: [
      "write pointer = index of last written merged interval. Start at 0.",
      "For each interval from 1 to n-1: if overlaps with intervals[write], extend intervals[write].end. Else, write++ and copy current to intervals[write].",
      "Return write + 1 (number of merged intervals)."
    ],
    solution: "def merge_in_place(intervals):\n    if not intervals:\n        return 0\n    intervals.sort(key=lambda x: x[0])\n    write = 0\n    for i in range(1, len(intervals)):\n        if intervals[i][0] <= intervals[write][1]:\n            intervals[write][1] = max(intervals[write][1], intervals[i][1])\n        else:\n            write += 1\n            intervals[write] = intervals[i]\n    return write + 1",
    walkthrough: "write pointer tracks the position of the last non-overlapping interval. Iterate : if current overlaps with the last written, extend it. Otherwise, advance write and copy the current interval there. The first write+1 elements are the merged result. O(n) time, O(1) extra space.",
    testCode: "arr = [[1,3],[2,6],[8,10],[15,18]]\nk = merge_in_place(arr)\nassert k == 3\nassert arr[:k] == [[1,6],[8,10],[15,18]]\narr2 = [[1,4],[0,2],[3,5]]\nk2 = merge_in_place(arr2)\nassert arr2[:k2] == [[0,5]]\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 2, title: "Merge and Show Overlap Depth", pattern: "merge with depth tracking", skill: "count how many original intervals each merged interval absorbed",
    statement: "Merge intervals (P9), but also return the count of original intervals merged into each final interval. Track a 'depth' counter: when extending cur_end, increment. Start each new merged interval with depth=1.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", output: "[(2, [1,6]), (1, [8,10]), (1, [15,18])]" },
    ],
    why: "Augmenting merge with a statistic: how many original intervals contributed to each merged output. The depth reveals clustering density. Same merge skeleton, one extra variable — pattern for augmenting interval algorithms with analytics.",
    starterCode: "def merge_with_depth(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    result = []\n    cur_start, cur_end = intervals[0]\n    depth = 1\n    pass",
    hints: [
      "Start with depth=1. For next interval: if overlap, cur_end = max(cur_end, end), depth += 1.",
      "If no overlap: append (depth, [cur_start, cur_end]), reset cur_start/cur_end to next, depth=1.",
      "Don't forget the last merged interval."
    ],
    solution: "def merge_with_depth(intervals):\n    if not intervals:\n        return []\n    intervals.sort(key=lambda x: x[0])\n    result = []\n    cs, ce = intervals[0]\n    depth = 1\n    for s, e in intervals[1:]:\n        if s <= ce:\n            ce = max(ce, e)\n            depth += 1\n        else:\n            result.append((depth, [cs, ce]))\n            cs, ce = s, e\n            depth = 1\n    result.append((depth, [cs, ce]))\n    return result",
    walkthrough: "Same merge skeleton. Track depth: initialized to 1 for first interval, incremented each time an interval is absorbed. When a group is finalized, depth tells how dense that merge cluster was. Simple augmentation — proof that the merge skeleton is extensible.",
    testCode: "assert merge_with_depth([[1,3],[2,6],[8,10],[15,18]]) == [(2, [1,6]), (1, [8,10]), (1, [15,18])]\nassert merge_with_depth([[1,4],[2,5],[3,6]]) == [(3, [1,6])]\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 2, title: "Verify Merged Intervals Are Non-Overlapping", pattern: "post-condition check", skill: "verify that merged output has no overlaps between consecutive intervals",
    statement: "Given a list of intervals (should be merged output), verify they are non-overlapping and sorted by start. Check: for each adjacent pair, intervals[i].end < intervals[i+1].start (no touch or overlap). Called a validity check.",
    examples: [
      { input: "intervals = [[1,6],[8,10],[15,18]]", output: "True", explain: "all gaps > 0" },
      { input: "intervals = [[1,6],[5,10]]", output: "False", explain: "overlap at 5-6" },
    ],
    why: "Post-condition verification: after merge, output must be sorted, non-overlapping, and non-touching (strict gaps). This checks the invariant that merge guarantees. Building verification into algorithms makes the invariants explicit.",
    starterCode: "def is_valid_merged(intervals):\n    pass",
    hints: [
      "Check sorted order: intervals[i][0] < intervals[i+1][0] for all i.",
      "Check no overlap: intervals[i][1] < intervals[i+1][0] (strictly less — no touching).",
      "Single interval or empty list is trivially valid. Return True."
    ],
    solution: "def is_valid_merged(intervals):\n    for i in range(len(intervals) - 1):\n        if intervals[i][0] >= intervals[i+1][0]:\n            return False\n        if intervals[i][1] >= intervals[i+1][0]:\n            return False\n    return True",
    walkthrough: "Two checks: (1) starts are strictly increasing (sorted). (2) each interval ends strictly before the next starts — no overlap or touch. This is the invariant merge guarantees: output is a set of disjoint, sorted intervals covering the merged union.",
    testCode: "assert is_valid_merged([[1,6],[8,10],[15,18]]) == True\nassert is_valid_merged([[1,6],[5,10]]) == False\nassert is_valid_merged([[1,3]]) == True\nassert is_valid_merged([]) == True\nprint('All tests passed!')"
  },

  // ── STAGE 3: Insert & Gaps ──
  {
    id: 22, stage: 3, title: "Insert Interval (Three Zones)", pattern: "three-phase traversal: before, overlap, after", skill: "process non-overlapping-before, merge overlapping, append after",
    statement: "Given a sorted, non-overlapping list of intervals and a new interval to insert. Insert and merge if needed. Three zones: (1) intervals wholly before new, (2) overlapping with new, (3) intervals wholly after.",
    examples: [
      { input: "intervals = [[1,3],[6,9]], newInterval = [2,5]", output: "[[1,5],[6,9]]" },
      { input: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,8]", output: "[[1,2],[3,10],[12,16]]" },
    ],
    why: "Insert operates on ALREADY sorted, non-overlapping intervals. The three-zone model (before, overlap-zone, after) partitions the work cleanly. Insert is more constrained than merge from scratch — exploit the pre-sorted property.",
    starterCode: "def insert_interval(intervals, new_interval):\n    result = []\n    i = 0\n    n = len(intervals)\n    pass",
    hints: [
      "Zone 1: while intervals[i].end < new.start, add to result (no overlap possible).",
      "Zone 2: while intervals[i].start <= new.end, merge: update new.start = min(intervals[i].start, new.start), new.end = max(intervals[i].end, new.end).",
      "Zone 3: append merged new_interval, then append all remaining intervals."
    ],
    solution: "def insert_interval(intervals, new_interval):\n    result = []\n    i = 0\n    n = len(intervals)\n    while i < n and intervals[i][1] < new_interval[0]:\n        result.append(intervals[i])\n        i += 1\n    while i < n and intervals[i][0] <= new_interval[1]:\n        new_interval[0] = min(new_interval[0], intervals[i][0])\n        new_interval[1] = max(new_interval[1], intervals[i][1])\n        i += 1\n    result.append(new_interval)\n    while i < n:\n        result.append(intervals[i])\n        i += 1\n    return result",
    walkthrough: "Three phases: (1) copy all intervals ending before new.start — they're completely before. (2) while intervals start <= new.end, merge into new_interval (expand its bounds). (3) append merged new_interval, then copy all remaining intervals (wholly after). O(n) in one pass.",
    testCode: "assert insert_interval([[1,3],[6,9]], [2,5]) == [[1,5],[6,9]]\nassert insert_interval([[1,2],[3,5],[6,7],[8,10],[12,16]], [4,8]) == [[1,2],[3,10],[12,16]]\nassert insert_interval([], [5,7]) == [[5,7]]\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Insert Without Overlap (Pristine Insert)", pattern: "insert into gap", skill: "find insert position, slide in between",
    statement: "Insert a new interval into a sorted non-overlapping list where the new interval does NOT overlap any existing. Return the new list with new interval inserted in sorted position.",
    examples: [
      { input: "intervals = [[1,3],[6,9]], newInterval = [4,5]", output: "[[1,3],[4,5],[6,9]]" },
      { input: "intervals = [[2,3],[7,8]], newInterval = [0,1]", output: "[[0,1],[2,3],[7,8]]" },
    ],
    why: "Simplified version: find the insertion index. Binary search (since non-overlapping) or linear scan. No merging needed — the gap case of P14.",
    starterCode: "def insert_no_overlap(intervals, new_interval):\n    result = []\n    inserted = False\n    pass",
    hints: [
      "Iterate intervals. If new_interval not yet inserted and new.end < curr.start, insert new, then copy remaining.",
      "Otherwise, just copy curr. At end, if still not inserted, append new.",
      "Since no overlap, the relative order is determined by start values."
    ],
    solution: "def insert_no_overlap(intervals, new_interval):\n    result = []\n    inserted = False\n    for start, end in intervals:\n        if not inserted and new_interval[1] < start:\n            result.append(new_interval)\n            inserted = True\n        result.append([start, end])\n    if not inserted:\n        result.append(new_interval)\n    return result",
    walkthrough: "Since no overlap, new_interval goes between two existing intervals. Walk through: if new hasn't been placed yet and new.end < curr.start, the new interval fits before curr. Place it, then copy remaining. If never placed, it goes at end.",
    testCode: "assert insert_no_overlap([[1,3],[6,9]], [4,5]) == [[1,3],[4,5],[6,9]]\nassert insert_no_overlap([[2,3],[7,8]], [0,1]) == [[0,1],[2,3],[7,8]]\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Insert with Full Overlap (Containment)", pattern: "new interval covers existing intervals", skill: "handle the case where new interval subsumes several existing ones",
    statement: "Insert a new interval that completely contains one or more existing intervals. The three-zone algorithm should handle this naturally (phase 2 absorbs all contained intervals). Verify.",
    examples: [
      { input: "intervals = [[1,2],[3,5],[6,7],[8,10],[12,16]], newInterval = [4,13]", output: "[[1,2],[3,16]]" },
      { input: "intervals = [[2,4],[5,7]], newInterval = [1,8]", output: "[[1,8]]" },
    ],
    why: "This tests phase 2 of insert: multiple intervals merge into new_interval when it spans them. The three-zone structure handles this naturally — no special-case logic needed.",
    starterCode: "def insert_full_overlap(intervals, new_interval):\n    return insert_interval(intervals, new_interval)",
    hints: [
      "Reuse the insert_interval function from P14. The three zones handle containment automatically.",
      "Phase 2 absorbs ALL intervals that start before new.end. If new covers them entirely, they're all merged.",
      "Test with new_interval that spans multiple existing intervals."
    ],
    solution: "def insert_full_overlap(intervals, new_interval):\n    result = []\n    i = 0\n    n = len(intervals)\n    while i < n and intervals[i][1] < new_interval[0]:\n        result.append(intervals[i])\n        i += 1\n    while i < n and intervals[i][0] <= new_interval[1]:\n        new_interval[0] = min(new_interval[0], intervals[i][0])\n        new_interval[1] = max(new_interval[1], intervals[i][1])\n        i += 1\n    result.append(new_interval)\n    while i < n:\n        result.append(intervals[i])\n        i += 1\n    return result",
    walkthrough: "Same three-zone algorithm. When new_interval spans multiple existing intervals, phase 2 absorbs them all — each iteration extends new_interval's bounds. The contained intervals are never added to result; only the merged new_interval appears. Natural behavior, no edge case.",
    testCode: "assert insert_full_overlap([[1,2],[3,5],[6,7],[8,10],[12,16]], [4,13]) == [[1,2],[3,16]]\nassert insert_full_overlap([[2,4],[5,7]], [1,8]) == [[1,8]]\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Insert at Boundaries", pattern: "edge cases for insert", skill: "handle new interval at start, at end, or touching",
    statement: "Test insert interval at boundaries: (1) before first interval, (2) after last interval, (3) touching an existing interval (start == existing_end or end == existing_start). Verify all cases.",
    examples: [
      { input: "intervals = [[3,5],[8,10]], newInterval = [0,1]", output: "[[0,1],[3,5],[8,10]]" },
      { input: "intervals = [[3,5],[8,10]], newInterval = [5,8]", output: "[[3,10]]", explain: "touching both → merge" },
    ],
    why: "Edge cases test the robustness of the three-zone insert. Touching intervals (start == existing_end) should merge. New intervals at extremes should prepend/append cleanly.",
    starterCode: "def test_boundary_inserts():\n    pass",
    hints: [
      "Case 1: new.end < first.start → prepend. Case 2: new.start > last.end → append.",
      "Case 3: new touches existing (new.start == existing.end) → should merge due to <= in phase 2.",
      "Write a single test function covering all edge positions."
    ],
    solution: "def test_boundary_inserts():\n    def insert(intervals, new_int):\n        result = []\n        i = 0\n        n = len(intervals)\n        while i < n and intervals[i][1] < new_int[0]:\n            result.append(intervals[i])\n            i += 1\n        while i < n and intervals[i][0] <= new_int[1]:\n            new_int[0] = min(new_int[0], intervals[i][0])\n            new_int[1] = max(new_int[1], intervals[i][1])\n            i += 1\n        result.append(new_int)\n        result.extend(intervals[i:])\n        return result\n    base = [[3,5],[8,10]]\n    assert insert(base, [0,1]) == [[0,1],[3,5],[8,10]]\n    assert insert(base, [11,12]) == [[3,5],[8,10],[11,12]]\n    assert insert(base, [5,8]) == [[3,10]]\n    assert insert(base, [1,3]) == [[1,5],[8,10]]\n    return True",
    walkthrough: "Edge cases: (1) before first → zone 1 never triggers, zone 2 takes all, zone 3 after. (2) after last → zone 1 covers all inputs, zone 2 never triggers. (3) touching (new.start == existing.end or new.end == existing.start) → zone 2 covers (<= on boundaries) → merge.",
    testCode: "assert test_boundary_inserts() == True\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Find Gaps Between Intervals", pattern: "gap detection in sorted disjoint list", skill: "iterate sorted non-overlapping intervals; gap = [prev.end, curr.start]",
    statement: "Given a list of sorted, non-overlapping intervals, find all gaps (empty intervals) between them. For each adjacent pair: gap = [intervals[i].end, intervals[i+1].start]. Only include gaps with positive length.",
    examples: [
      { input: "intervals = [[1,3],[5,7],[8,10]]", output: "[[3,5]]", explain: "gap between 3 and 5" },
      { input: "intervals = [[1,3],[3,5]]", output: "[]", explain: "touching — no gap" },
    ],
    why: "Gap detection is the complement of merge. After merging (covering), the gaps are the uncovered regions. Patterns: gaps = free time (employee free time), uncovered range, possible insertion positions. Builds on sorted + disjoint properties.",
    starterCode: "def find_gaps(intervals):\n    if len(intervals) < 2:\n        return []\n    gaps = []\n    pass",
    hints: [
      "For i in 0..n-2: if intervals[i][1] < intervals[i+1][0]: gap = [intervals[i][1], intervals[i+1][0]].",
      "Only add if start < end (positive width gap).",
      "Touching intervals (end == start of next) produce empty gap — skip."
    ],
    solution: "def find_gaps(intervals):\n    if len(intervals) < 2:\n        return []\n    gaps = []\n    for i in range(len(intervals) - 1):\n        if intervals[i][1] < intervals[i+1][0]:\n            gaps.append([intervals[i][1], intervals[i+1][0]])\n    return gaps",
    walkthrough: "For sorted non-overlapping intervals, gaps are the spaces between consecutive end and start. [1,3],[5,7] → gap [3,5]. [1,3],[3,5] → no gap (touching). The gaps are exactly where new intervals can be inserted without overlap. O(n).",
     testCode: "assert find_gaps([[1,3],[5,7],[8,10]]) == [[3,5],[7,8]]\nassert find_gaps([[1,3],[3,5]]) == []\nassert find_gaps([[1,3]]) == []\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 3, title: "Remove Covered Intervals", pattern: "filter dominated intervals", skill: "interval a covers b if a.start <= b.start and a.end >= b.end",
    statement: "Given intervals, remove all intervals that are completely covered by another interval. An interval a covers b if a.start <= b.start AND a.end >= b.end (a contains b). Return list of remaining intervals.",
    examples: [
      { input: "intervals = [[1,4],[3,6],[2,8]]", output: "[[2,8]]", explain: "[1,4] and [3,6] are both covered by [2,8]" },
      { input: "intervals = [[1,2],[1,2]]", output: "[[1,2]]", explain: "identical intervals — keep one" },
    ],
    why: "Covered-interval removal uses the containment relation (stage 0's 6 cases). After sorting by start and then by end descending, iterate: if current end <= max_end_so_far, it's covered. The 'three zones' concept extends: intervals with larger end dominate.",
    starterCode: "def remove_covered_intervals(intervals):\n    intervals.sort(key=lambda x: (x[0], -x[1]))\n    max_end = 0\n    result = []\n    pass",
    hints: [
      "Sort by start ascending, end descending (longer intervals first when starts tie).",
      "Track max_end. For each interval: if end > max_end, it's NOT covered — add to result, update max_end.",
      "If end <= max_end, a prior interval (with same or earlier start) covers it."
    ],
    solution: "def remove_covered_intervals(intervals):\n    intervals.sort(key=lambda x: (x[0], -x[1]))\n    max_end = 0\n    result = []\n    for s, e in intervals:\n        if e > max_end:\n            result.append([s, e])\n            max_end = e\n    return result",
    walkthrough: "Sort: (start ASC, end DESC) means same-start intervals are ordered longest-first. max_end tracks the farthest end seen. An interval is covered if its end <= max_end (same or earlier start, but some prior interval already reaches at least as far). O(n log n).",
     testCode: "assert remove_covered_intervals([[1,4],[3,6],[2,8]]) == [[1,4],[2,8]]\nassert remove_covered_intervals([[1,2],[1,2]]) == [[1,2]]\nassert remove_covered_intervals([[1,4],[2,3]]) == [[1,4]]\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 3, title: "Insert Without Merging (Pure Insert)", pattern: "binary search + splice", skill: "find insertion index; slide new interval in without modifying others",
    statement: "Given a sorted, non-overlapping interval list and a new interval that does NOT overlap any existing interval, insert it at the correct sorted position. Use binary search to find position, then splice.",
    examples: [
      { input: "intervals = [[1,3],[6,9]], new = [4,5]", output: "[[1,3],[4,5],[6,9]]" },
      { input: "intervals = [[2,3],[7,8]], new = [0,1]", output: "[[0,1],[2,3],[7,8]]" },
    ],
    why: "Pure insert (no merging) is the simplest case of the three-zone model. Find the gap where the new interval fits. This is a prerequisite for understanding the full insert (which adds zone 2 merging). Composes search + splice.",
    starterCode: "def insert_no_merge(intervals, new_int):\n    result = list(intervals)\n    pass",
    hints: [
      "Find index where new_int[0] < intervals[i][0] (first interval starting after new).",
      "Insert at that index. If never found, insert at end.",
      "Since no overlap, the relative order is determined purely by start values."
    ],
    solution: "def insert_no_merge(intervals, new_int):\n    result = list(intervals)\n    for i, (s, e) in enumerate(result):\n        if new_int[0] < s:\n            result.insert(i, new_int)\n            return result\n    result.append(new_int)\n    return result",
    walkthrough: "Linear scan to find first interval with start > new.start. Insert before it. If new.start is larger than all starts, append at end. Since no overlap, this maintains sorted order and non-overlap invariant. O(n). Binary search makes it O(log n) find + O(n) splice.",
    testCode: "assert insert_no_merge([[1,3],[6,9]], [4,5]) == [[1,3],[4,5],[6,9]]\nassert insert_no_merge([[2,3],[7,8]], [0,1]) == [[0,1],[2,3],[7,8]]\nprint('All tests passed!')"
  },

  // ── STAGE 4: Naive ──
  {
    id: 29, stage: 4, title: "Meeting Rooms II — Pairwise Overlap Count", pattern: "for each time, count concurrent meetings via pairwise check", skill: "O(n³) time-scan: for each time unit, count how many intervals contain it",
    statement: "Given meeting intervals [start,end), find minimum rooms needed. Naive O(n²·T): for each possible time point, count how many meetings overlap that point. Return max count.",
    examples: [
      { input: "intervals = [[0,30],[5,10],[15,20]]", output: "2", explain: "at t=6, meetings [0,30] and [5,10] concurrent" },
      { input: "intervals = [[7,10],[2,4]]", output: "1" },
    ],
    why: "The naive approach: for each time point in the range, count how many intervals cover it. The waste is obvious — we check EVERY time unit when we only need to check at start/end boundaries.",
    starterCode: "def min_meeting_rooms_naive(intervals):\n    if not intervals:\n        return 0\n    min_t = min(s for s,e in intervals)\n    max_t = max(e for s,e in intervals)\n    max_rooms = 0\n    pass",
    hints: [
      "Find the overall time range [min_start, max_end]. For each integer time t in that range, count how many meetings contain t (start <= t < end).",
      "Track the max count across all time points.",
      "This is O(T * n) where T is the time range — very wasteful. Only boundaries matter."
    ],
    solution: "def min_meeting_rooms_naive(intervals):\n    if not intervals:\n        return 0\n    min_t = min(s for s,e in intervals)\n    max_t = max(e for s,e in intervals)\n    max_rooms = 0\n    for t in range(min_t, max_t + 1):\n        count = 0\n        for s, e in intervals:\n            if s <= t < e:\n                count += 1\n        max_rooms = max(max_rooms, count)\n    return max_rooms",
    walkthrough: "For each time unit t, scan all meetings and count those with start <= t < end. The max count is the min rooms. O(T * n) where T = range of time values. Waste: we check every second, when rooms only change at meeting start/end boundaries.",
    testCode: "assert min_meeting_rooms_naive([[0,30],[5,10],[15,20]]) == 2\nassert min_meeting_rooms_naive([[7,10],[2,4]]) == 1\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Minimum Arrows — Pairwise Overlap", pattern: "pairwise balloon burst check", skill: "check every balloon against every other for shared arrow point",
    statement: "Given balloons [start,end], find minimum arrows to burst all. Naive: treat each balloon as a node, check pairwise for shared point. Build overlapping groups exhaustively.",
    examples: [
      { input: "points = [[10,16],[2,8],[1,6],[7,12]]", output: "2" },
    ],
    why: "Pairwise check builds overlap groups by testing every pair. This makes visible why grouping by end point (P8) works — all balloons that share an arrow are in a clique of overlapping intervals.",
    starterCode: "def min_arrows_naive(points):\n    n = len(points)\n    visited = [False] * n\n    arrows = 0\n    pass",
    hints: [
      "For each unvisited balloon, find all balloons that overlap with it (share some point). Mark them all visited as one group.",
      "How to check: for each other balloon, if max(start_i, start_j) <= min(end_i, end_j), they overlap.",
      "Count groups. Each group can be burst by one arrow."
    ],
    solution: "def min_arrows_naive(points):\n    n = len(points)\n    visited = [False] * n\n    arrows = 0\n    for i in range(n):\n        if not visited[i]:\n            arrows += 1\n            common_start, common_end = points[i]\n            for j in range(n):\n                if not visited[j]:\n                    new_start = max(common_start, points[j][0])\n                    new_end = min(common_end, points[j][1])\n                    if new_start <= new_end:\n                        visited[j] = True\n                        common_start, common_end = new_start, new_end\n    return arrows",
    walkthrough: "Start with a balloon, find ALL other balloons that share at least one point with the current overlap region. Shrink the overlap region to the intersection. Mark them all visited. Each iteration finds one arrow-group. O(n²) because inner loop checks all unvisited balloons per arrow.",
    testCode: "assert min_arrows_naive([[10,16],[2,8],[1,6],[7,12]]) == 2\nassert min_arrows_naive([[1,2],[2,3],[3,4]]) == 2\nassert min_arrows_naive([[1,2]]) == 1\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Minimum Removals — Pairwise Count", pattern: "remove intervals until no overlaps via pairwise", skill: "for each interval, count conflicts; remove the one with most conflicts",
    statement: "Given intervals, remove minimum count to make rest non-overlapping. Naive: iterate, find interval with most overlaps, remove it. Repeat until no overlaps remain.",
    examples: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: "1" },
    ],
    why: "Greedy by 'most conflicts first' intuitively seems right but is NOT always optimal. The pairwise approach reveals why: the interval with most total overlaps may not be the one to remove.",
    starterCode: "def min_removals_naive(intervals):\n    ints = [list(x) for x in intervals]\n    removed = 0\n    pass",
    hints: [
      "While any overlap: find interval with most overlaps (count pairs it overlaps with). Remove it.",
      "Recalculate overlaps after each removal.",
      "This is O(n³) — expensive and may not be optimal. Compares to the optimal sort-by-end solution."
    ],
    solution: "def min_removals_naive(intervals):\n    ints = [list(x) for x in intervals]\n    removed = 0\n    while True:\n        n = len(ints)\n        conflict_counts = [0] * n\n        for i in range(n):\n            for j in range(i + 1, n):\n                if max(ints[i][0], ints[j][0]) < min(ints[i][1], ints[j][1]):\n                    conflict_counts[i] += 1\n                    conflict_counts[j] += 1\n        if max(conflict_counts) == 0:\n            break\n        idx = conflict_counts.index(max(conflict_counts))\n        ints.pop(idx)\n        removed += 1\n    return removed",
    walkthrough: "Iteratively find the interval with the most pairwise overlaps, remove it, repeat until no overlaps. This is the intuitive 'most conflicting first' strategy. However, it's not guaranteed optimal — counterexample: [0,3],[1,4],[2,5] — removing the middle (2 overlaps) leaves two non-overlapping; removing either edge (1 overlap each) also leaves at most 1. O(n³) due to repeated pairwise scans.",
    testCode: "assert min_removals_naive([[1,2],[2,3],[3,4],[1,3]]) == 1\nassert min_removals_naive([[1,2],[1,2],[1,2]]) == 2\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "Disconnect Check — Pairwise", pattern: "check if any two intervals are separated by gap", skill: "for each pair, check if they're disconnected (gap between them)",
    statement: "Given intervals, return True if there exists ANY pair of intervals that are disconnected (gap > 0 between them). Naive O(n²) check.",
    examples: [
      { input: "intervals = [[1,3],[5,7],[8,10]]", output: "True", explain: "[1,3] and [5,7] have gap" },
      { input: "intervals = [[1,5],[3,7]]", output: "False", explain: "all intervals overlap or touch" },
    ],
    why: "Pairwise disconnect check is the complement of 'all intervals form one connected component.' Each pair is checked for gap. O(n²). Sort-based approach: if max end so far + gap < next start, disconnect found.",
    starterCode: "def has_disconnect(intervals):\n    n = len(intervals)\n    pass",
    hints: [
      "For each pair i,j: they are disconnected if neither overlaps (max(start) >= min(end)).",
      "Disconnected means a gap exists. Overlap/touch means max(start) < min(end). Disconnected = !overlap && !touch.",
      "O(n²) pairwise check. Return as soon as disconnect found."
    ],
    solution: "def has_disconnect(intervals):\n    n = len(intervals)\n    for i in range(n):\n        for j in range(i + 1, n):\n            if max(intervals[i][0], intervals[j][0]) > min(intervals[i][1], intervals[j][1]):\n                return True\n    return False",
    walkthrough: "Disconnected = no overlap AND no touch. Condition: max(start_i, start_j) > min(end_i, end_j). If any pair satisfies this, they're disconnected. O(n²). After sorting, this reduces to checking adjacent intervals only.",
    testCode: "assert has_disconnect([[1,3],[5,7],[8,10]]) == True\nassert has_disconnect([[1,5],[3,7]]) == False\nassert has_disconnect([[1,2],[2,3]]) == False\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Remove Interval — Naive (Split) ", pattern: "interval removal with possible split", skill: "remove an interval region; if any existing interval overlaps the removed region, split it",
    statement: "Given intervals and a region [remove_start, remove_end] to erase, return new intervals with that region removed. For each interval that overlaps the remove region: keep the non-overlapping parts (before and after). Pairwise O(n²) processing.",
    examples: [
      { input: "intervals = [[1,5],[8,10]], remove = [3,9]", output: "[[1,3],[9,10]]", explain: "[1,5]→[1,3]; [8,10]→[9,10]" },
      { input: "intervals = [[1,10]], remove = [3,7]", output: "[[1,3],[7,10]]", explain: "split into two parts" },
    ],
    why: "Interval removal is the inverse of merge. An interval can be: (a) unaffected, (b) partially removed (split), (c) completely removed, (d) interior removed (double split). Naive approach examines each interval individually.",
    starterCode: "def remove_interval_naive(intervals, remove_region):\n    result = []\n    rs, re = remove_region\n    pass",
    hints: [
      "For each [s, e]: if e <= rs or s >= re: keep unchanged. If s < rs: keep left [s, rs]. If e > re: keep right [re, e].",
      "Handle the case where the remove region is entirely inside an interval (both left and right parts kept).",
      "Updates are independent per interval — no sorting required. O(n) if intervals are already sorted."
    ],
    solution: "def remove_interval_naive(intervals, remove_region):\n    rs, re = remove_region\n    result = []\n    for s, e in intervals:\n        if e <= rs or s >= re:\n            result.append([s, e])\n        else:\n            if s < rs:\n                result.append([s, rs])\n            if e > re:\n                result.append([re, e])\n    return result",
    walkthrough: "For each interval: if disjoint (before or after remove region), keep as-is. If overlapping: left non-overlapping part [s, rs] (if s < rs), right non-overlapping part [re, e] (if e > re). An interval fully inside remove region contributes zero parts. O(n) single pass.",
    testCode: "assert remove_interval_naive([[1,5],[8,10]], [3,9]) == [[1,3],[9,10]]\nassert remove_interval_naive([[1,10]], [3,7]) == [[1,3],[7,10]]\nassert remove_interval_naive([[1,3],[5,7]], [4,5]) == [[1,3],[5,7]]\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 4, title: "Overlap Count Per Interval", pattern: "pairwise overlap counting", skill: "for each interval, count how many other intervals it overlaps via pairwise check",
    statement: "Given intervals, for each interval count how many OTHER intervals it overlaps. Return array of counts. Naive: for each pair i < j, if they overlap, increment both counts. O(n²).",
    examples: [
      { input: "intervals = [[1,3],[2,4],[5,7]]", output: "[1,1,0]", explain: "[1,3] and [2,4] overlap each other; [5,7] isolated" },
      { input: "intervals = [[1,5],[3,7]]", output: "[1,1]" },
    ],
    why: "Overlap degree = how many conflicts an interval has. The naive approach computes the overlap matrix. This is the baseline that motivates sort-based optimizations: after sorting by start, each interval only overlaps with a contiguous band, not scattered pairs.",
    starterCode: "def overlap_counts(intervals):\n    n = len(intervals)\n    counts = [0] * n\n    pass",
    hints: [
      "For each pair i < j: if max(start_i, start_j) < min(end_i, end_j), increment counts[i] and counts[j].",
      "O(n²) double loop. The overlap test from P1 is called n*(n-1)/2 times.",
      "After sorting, overlaps become local — but the naive approach gives the exact counts."
    ],
    solution: "def overlap_counts(intervals):\n    n = len(intervals)\n    counts = [0] * n\n    for i in range(n):\n        for j in range(i + 1, n):\n            if max(intervals[i][0], intervals[j][0]) < min(intervals[i][1], intervals[j][1]):\n                counts[i] += 1\n                counts[j] += 1\n    return counts",
    walkthrough: "Compute the overlap incidence matrix (symmetric). For each pair: overlap test, increment both if overlapping. The count represents the degree of that interval in the interval graph. O(n²) — each pair checked once.",
    testCode: "assert overlap_counts([[1,3],[2,4],[5,7]]) == [1,1,0]\nassert overlap_counts([[1,5],[3,7]]) == [1,1]\nassert overlap_counts([[1,2],[3,4]]) == [0,0]\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 4, title: "Find Interval with Most Overlaps (Naive)", pattern: "pairwise then argmax", skill: "find the interval that overlaps with the most other intervals (maximum conflict)",
    statement: "Given intervals, find the interval that overlaps with the MOST other intervals. Naive: compute overlap counts for all (P20-style), return the interval with max count. If tie, return any.",
    examples: [
      { input: "intervals = [[1,5],[2,6],[3,7],[10,12]]", output: "[2,6]", explain: "[2,6] overlaps with [1,5] and [3,7] — 2 conflicts" },
      { input: "intervals = [[1,2],[3,4]]", output: "[1,2]", explain: "no overlaps — any works" },
    ],
    why: "The 'most conflicting interval' is often the one to consider removing (to reduce overlap). Naively computing overlap counts and finding the max teaches the 'conflict density' concept. The sorted optimization: the interval with most overlaps is typically central in the timeline.",
    starterCode: "def most_overlaps(intervals):\n    n = len(intervals)\n    max_count = -1\n    max_int = None\n    pass",
    hints: [
      "For each i: count overlaps with all j != i. Track max count and corresponding interval.",
      "Use the overlap test from P1. O(n²).",
      "After sorting, this becomes local — only adjacent intervals need checking."
    ],
    solution: "def most_overlaps(intervals):\n    n = len(intervals)\n    max_count = -1\n    max_int = None\n    for i in range(n):\n        count = 0\n        for j in range(n):\n            if i != j:\n                si, ei = intervals[i]\n                sj, ej = intervals[j]\n                if max(si, sj) < min(ei, ej):\n                    count += 1\n        if count > max_count:\n            max_count = count\n            max_int = intervals[i]\n    return max_int",
    walkthrough: "For each interval: count overlaps with every other interval (O(n²)). Track the interval with maximum count. This is the naive 'hot spot' detection — the interval causing the most conflicts. Sort-based optimization: the hottest interval is in the densest part of the timeline.",
     testCode: "assert most_overlaps([[1,5],[2,6],[3,7],[10,12]]) in ([1,5], [2,6], [3,7])\nassert most_overlaps([[1,2],[3,4]]) in ([1,2], [3,4])\nprint('All tests passed!')"
  },

  // ── STAGE 5: Optimization ──
  {
    id: 36, stage: 5, title: "Meeting Rooms II — Sweep Line (Start/End Events)", pattern: "sweep line with sorted events", skill: "sort all start and end events, +1 on start, -1 on end, track max",
    statement: "Given meeting intervals [start,end), find min rooms. Sweep line: create events (start, +1) and (end, -1). Sort by time. Traverse: room count += event delta. Track max.",
    examples: [
      { input: "intervals = [[0,30],[5,10],[15,20]]", output: "2" },
      { input: "intervals = [[7,10],[2,4]]", output: "1" },
    ],
    why: "Sweep line replaces O(T*n) with O(n log n). Only boundary points matter — when a meeting starts, rooms+1; when it ends, rooms-1. Sort all boundary events and simulate the timeline.",
    starterCode: "def min_rooms_sweep(intervals):\n    events = []\n    for start, end in intervals:\n        events.append((start, 1))\n        events.append((end, -1))\n    events.sort()\n    pass",
    hints: [
      "Each interval produces two events: (start, +1) and (end, -1). Sort all events by time.",
      "Traverse events: rooms += delta. Track max rooms seen during traversal.",
      "Tie-breaking: if a meeting ends at same time another starts, process end (-1) BEFORE start (+1) to free room first."
    ],
    solution: "def min_rooms_sweep(intervals):\n    events = []\n    for start, end in intervals:\n        events.append((start, 1))\n        events.append((end, -1))\n    events.sort(key=lambda x: (x[0], x[1]))\n    cur_rooms = 0\n    max_rooms = 0\n    for _, delta in events:\n        cur_rooms += delta\n        max_rooms = max(max_rooms, cur_rooms)\n    return max_rooms",
    walkthrough: "Each interval creates start (+1 room) and end (-1 room) events. Sort by time; for same time, end (-1) before start (+1) ensures room is freed before next meeting starts. Traverse: accumulate delta, track peak. This is O(n log n) for sorting the 2n events. Elegant sweep line.",
    testCode: "assert min_rooms_sweep([[0,30],[5,10],[15,20]]) == 2\nassert min_rooms_sweep([[7,10],[2,4]]) == 1\nassert min_rooms_sweep([[1,5],[8,9],[8,12]]) == 2\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Meeting Rooms II — Heap of Ends", pattern: "min-heap of end times", skill: "sort by start; heap tracks earliest ending meeting; pop if ended before new start",
    statement: "Alternative to sweep line: sort by start. Maintain min-heap of end times of ongoing meetings. When a new meeting starts after the earliest-ending meeting ends, pop it from heap. Heap size = rooms needed.",
    examples: [
      { input: "intervals = [[0,30],[5,10],[15,20]]", output: "2" },
      { input: "intervals = [[7,10],[2,4]]", output: "1" },
    ],
    why: "Heap approach: sort by start, maintain heap of end times. Heap size at any point = concurrent meetings. When heap[0] (earliest end) <= next.start, remove it (room freed). Heap never exceeds needed rooms.",
    starterCode: "def min_rooms_heap(intervals):\n    import heapq\n    intervals.sort(key=lambda x: x[0])\n    heap = []\n    max_rooms = 0\n    pass",
    hints: [
      "Sort by start. For each meeting: push end to min-heap.",
      "Before push: while heap[0] <= start, pop (those meetings have ended, rooms freed).",
      "After push: max_rooms = max(max_rooms, len(heap)). Heap size equals concurrent meetings."
    ],
    solution: "def min_rooms_heap(intervals):\n    import heapq\n    intervals.sort(key=lambda x: x[0])\n    heap = []\n    max_rooms = 0\n    for start, end in intervals:\n        while heap and heap[0] <= start:\n            heapq.heappop(heap)\n        heapq.heappush(heap, end)\n        max_rooms = max(max_rooms, len(heap))\n    return max_rooms",
    walkthrough: "Sort by start. Heap tracks end times of meetings currently using rooms. Before adding a new meeting, pop all meetings whose end <= start (they've finished). Push new meeting's end. Len(heap) = concurrent rooms. Track peak. O(n log n). Both sweep line and heap produce the same result — different mechanics, same complexity.",
    testCode: "assert min_rooms_heap([[0,30],[5,10],[15,20]]) == 2\nassert min_rooms_heap([[7,10],[2,4]]) == 1\nassert min_rooms_heap([[1,3],[2,4],[3,5]]) == 2\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Employee Free Time", pattern: "merge gaps between meetings", skill: "merge all employee schedules; gaps = free time",
    statement: "Given k sorted lists of intervals (each employee's busy schedule), return ALL free time intervals common to all employees (any gap in the merged timeline). Merge all intervals, then gaps are between merged intervals.",
    examples: [
      { input: "schedule = [[[1,2],[5,6]],[[1,3]],[[4,10]]]", output: "[[3,4]]", explain: "merged [1,3],[4,10] → gap [3,4]" },
      { input: "schedule = [[[1,3],[6,7]],[[2,4]],[[2,5],[9,12]]]", output: "[[5,6],[7,9]]" },
    ],
    why: "Flatten all intervals across employees, merge them, then the gaps between merged intervals are the common free time. Compose: flatten + merge + gap detection.",
    starterCode: "def employee_free_time(schedule):\n    all_intervals = []\n    for emp in schedule:\n        all_intervals.extend(emp)\n    all_intervals.sort(key=lambda x: x[0])\n    merged = []\n    pass",
    hints: [
      "Flatten all employee intervals into one list. Sort by start.",
      "Merge as in P9. Then for each adjacent pair in merged: gap = [merged[i][1], merged[i+1][0]].",
      "Only add gap if start < end (non-empty)."
    ],
    solution: "def employee_free_time(schedule):\n    all_ints = []\n    for emp in schedule:\n        all_ints.extend(emp)\n    if not all_ints:\n        return []\n    all_ints.sort(key=lambda x: x[0])\n    merged = []\n    cur_start, cur_end = all_ints[0]\n    for start, end in all_ints[1:]:\n        if start <= cur_end:\n            cur_end = max(cur_end, end)\n        else:\n            merged.append([cur_start, cur_end])\n            cur_start, cur_end = start, end\n    merged.append([cur_start, cur_end])\n    gaps = []\n    for i in range(len(merged) - 1):\n        if merged[i][1] < merged[i+1][0]:\n            gaps.append([merged[i][1], merged[i+1][0]])\n    return gaps",
    walkthrough: "Flatten all employee busy times into one list. Merge to get consolidated busy periods. The gaps between consecutive merged intervals are when ALL employees are free. Compose: flatten + merge (P9) + gap scan. O(N log N) where N is total intervals.",
    testCode: "s1 = [[[1,2],[5,6]],[[1,3]],[[4,10]]]\nassert employee_free_time(s1) == [[3,4]]\ns2 = [[[1,3],[6,7]],[[2,4]],[[2,5],[9,12]]]\nassert employee_free_time(s2) == [[5,6],[7,9]]\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Interval Intersection (Two Lists)", pattern: "two pointers on sorted lists", skill: "advance pointer on the interval that ends first",
    statement: "Given two lists of sorted, disjoint intervals A and B, return their intersection. For each pair, intersection = [max(start_a, start_b), min(end_a, end_b)] if start <= end. Advance the pointer with the smaller end.",
    examples: [
      { input: "A = [[0,2],[5,10],[13,23],[24,25]], B = [[1,5],[8,12],[15,24],[25,26]]", output: "[[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]" },
      { input: "A = [[1,3],[5,9]], B = []", output: "[]" },
    ],
    why: "Two-pointer merge variant: at each step, compute intersection of the two current intervals. Advance the pointer for the interval that ends first (it can't intersect further). O(min(n,m)).",
    starterCode: "def interval_intersection(a, b):\n    i = j = 0\n    result = []\n    pass",
    hints: [
      "Two pointers i (for A), j (for B). At each step: compute overlap = [max(a[i].start, b[j].start), min(a[i].end, b[j].end)].",
      "If overlap.start <= overlap.end, add to result.",
      "Advance pointer: whichever interval ends FIRST is done — it can't intersect further intervals in the other list."
    ],
    solution: "def interval_intersection(a, b):\n    i = j = 0\n    result = []\n    while i < len(a) and j < len(b):\n        start = max(a[i][0], b[j][0])\n        end = min(a[i][1], b[j][1])\n        if start <= end:\n            result.append([start, end])\n        if a[i][1] < b[j][1]:\n            i += 1\n        else:\n            j += 1\n    return result",
    walkthrough: "Two pointers on sorted, disjoint lists. At each step, the overlap of the two current intervals is an intersection if non-empty. Advance the pointer with the earlier end — that interval can't overlap any future interval in the other list (since the other list's start times only increase). O(N+M).",
    testCode: "A = [[0,2],[5,10],[13,23],[24,25]]\nB = [[1,5],[8,12],[15,24],[25,26]]\nexpected = [[1,2],[5,5],[8,10],[15,23],[24,24],[25,25]]\nassert interval_intersection(A, B) == expected\nassert interval_intersection([[1,3],[5,9]], []) == []\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "Find Right Interval", pattern: "binary search for next interval", skill: "for each interval, find interval with smallest start >= its end",
    statement: "Given intervals, for each interval i, find interval j with the smallest start such that start_j >= end_i. Return j's index or -1. Sort starts + binary search per interval.",
    examples: [
      { input: "intervals = [[1,2]]", output: "[-1]" },
      { input: "intervals = [[3,4],[2,3],[1,2]]", output: "[-1,0,1]", explain: "[1,2]→[2,3] at idx 1; [2,3]→[3,4] at idx 0; [3,4]→none" },
    ],
    why: "Sort starts with their original indices. For each interval, binary search the first start >= its end. This replaces pairwise scanning with O(log n) per interval.",
    starterCode: "def find_right_interval(intervals):\n    n = len(intervals)\n    starts = sorted((s, i) for i, (s, e) in enumerate(intervals))\n    result = [-1] * n\n    pass",
    hints: [
      "Precompute sorted list of (start, original_index). For each interval: binary search for first start >= end.",
      "Use bisect_left on the start values. If found, use the original index. If not found, -1.",
      "O(n log n) for sorting + O(n log n) for n binary searches."
    ],
    solution: "def find_right_interval(intervals):\n    import bisect\n    n = len(intervals)\n    starts = sorted((s, i) for i, (s, e) in enumerate(intervals))\n    start_vals = [s for s, _ in starts]\n    result = [-1] * n\n    for i, (s, e) in enumerate(intervals):\n        idx = bisect.bisect_left(start_vals, e)\n        if idx < n:\n            result[i] = starts[idx][1]\n    return result",
    walkthrough: "Sort (start, original_index) pairs by start. For each interval: binary search the first start >= its end. If found, record its original index. O(n log n). This is a classic 'augmented interval' problem — enrich intervals with extra data (original indices) to answer queries after sorting.",
    testCode: "assert find_right_interval([[1,2]]) == [-1]\nassert find_right_interval([[3,4],[2,3],[1,2]]) == [-1,0,1]\nassert find_right_interval([[1,4],[2,3],[3,4]]) == [-1,2,-1]\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 5, title: "Remove Covered Intervals — Optimized", pattern: "sort + max_end scan", skill: "sort by start ASC, end DESC; track max_end; if end <= max_end, covered",
    statement: "Optimize covered-interval removal: sort by start ascending, end descending. Iterate once: maintain max_end_so_far. If current interval's end <= max_end, it's covered by some earlier interval (same or earlier start, longer end). O(n log n).",
    examples: [
      { input: "intervals = [[1,4],[3,6],[2,8]]", output: "[[2,8]]" },
      { input: "intervals = [[1,2],[1,3]]", output: "[[1,3]]", explain: "[1,2] covered by [1,3]" },
    ],
    why: "Sort by start ascending, end descending means: for same start, longest interval comes first. Then a single scan with max_end: any interval with end <= max_end is covered. This is O(n log n) — optimization over pairwise O(n²) contain-checking.",
    starterCode: "def remove_covered_optimized(intervals):\n    intervals.sort(key=lambda x: (x[0], -x[1]))\n    result = []\n    max_end = 0\n    pass",
    hints: [
      "Sort key: (start, -end). This puts intervals with same start in descending end order.",
      "For each [s, e]: if e > max_end, it contributes new coverage — add to result, update max_end.",
      "Otherwise (e <= max_end): a prior interval with earlier-or-equal start already covers at least through e."
    ],
    solution: "def remove_covered_optimized(intervals):\n    intervals.sort(key=lambda x: (x[0], -x[1]))\n    result = []\n    max_end = 0\n    for s, e in intervals:\n        if e > max_end:\n            result.append([s, e])\n            max_end = e\n    return result",
    walkthrough: "Sort: start ASC (earlier starts first), end DESC (longest first when starts tie). Scan: max_end tracks farthest reach so far. If current.end > max_end, it extends coverage beyond previous intervals — keep it. If current.end <= max_end, an earlier interval fully contains it. O(n log n).",
     testCode: "assert remove_covered_optimized([[1,4],[3,6],[2,8]]) == [[1,4],[2,8]]\nassert remove_covered_optimized([[1,2],[1,3]]) == [[1,3]]\nassert remove_covered_optimized([[1,4],[2,3],[3,5]]) == [[1,4],[3,5]]\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 5, title: "Data Stream as Disjoint Intervals", pattern: "online interval maintenance", skill: "add numbers one at a time; maintain sorted disjoint merged intervals of all seen numbers",
    statement: "Design a structure that accepts numbers one at a time (via add(val)). After each addition, getIntervals() returns the sorted disjoint intervals representing all numbers seen so far. When a number is added, merge with adjacent intervals if it bridges gaps.",
    examples: [
      { input: "add(1), add(3), add(7), add(2)", output: "[[1,3],[7,7]]", explain: "1,3 isolated; 7 isolated; 2 bridges 1→3" },
      { input: "add(1), add(3), add(5)", output: "[[1,1],[3,3],[5,5]]", explain: "three isolated points" },
    ],
    why: "Online interval maintenance composes insert-interval with dynamic data. Each new number is a zero-length interval [v,v]. On insertion, merge with adjacent intervals if they touch or overlap. The three-zone insert algorithm from Stage 3 adapts: before, merge-with-neighbors, after.",
    starterCode: "def stream_to_intervals(operations):\n    vals = set()\n    pass",
    hints: [
      "Maintain a sorted list of disjoint intervals. Each add(v): insert [v,v] and merge.",
      "Alternatively: keep a set of seen numbers, then periodically convert to intervals by sorting and merging.",
      "Online version: after each add, convert current set to merged intervals. Offline version: batch-process all adds."
    ],
    solution: "def stream_to_intervals(operations):\n    seen = set()\n    results = []\n    for op in operations:\n        if op[0] == 'add':\n            seen.add(op[1])\n        nums = sorted(seen)\n        if not nums:\n            results.append([])\n            continue\n        merged = [[nums[0], nums[0]]]\n        for n in nums[1:]:\n            if n == merged[-1][1] + 1:\n                merged[-1][1] = n\n            else:\n                merged.append([n, n])\n        results.append(list(merged))\n    return results",
    walkthrough: "Maintain a set of seen numbers. After each addition, sort and merge consecutive numbers: if n == last_end + 1, extend; else start new interval. The intervals represent all seen numbers as contiguous ranges. This composes sorting + adjacent merge on point data.",
    testCode: "ops = [('add', 1), ('add', 3), ('add', 7), ('add', 2)]\nresults = stream_to_intervals(ops)\nassert results[-1] == [[1,3],[7,7]]\nops2 = [('add', 1), ('add', 3), ('add', 5)]\nassert stream_to_intervals(ops2)[-1] == [[1,1],[3,3],[5,5]]\nprint('All tests passed!')"
  },

  // ── STAGE 6: Mastery ──
  {
    id: 43, stage: 6, title: "Non-overlapping = Activity Selection Callback", pattern: "greedy intersection with activity selection", skill: "recognize that 'max non-overlapping intervals' = activity selection from Greedy topic",
    statement: "Return max number of non-overlapping intervals from a list. Recognize this is identical to activity selection (Greedy P6). Sort by end, greedily pick earliest-finishing compatible.",
    examples: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: "3", explain: "pick [1,2],[2,3],[3,4]" },
      { input: "intervals = [[1,2],[1,2],[1,2]]", output: "1" },
    ],
    why: "Mastery composes: identify that 'max non-overlapping subsets' from intervals is activity selection from the Greedy topic. The problem hasn't changed — your recognition has.",
    starterCode: "def max_non_overlapping(intervals):\n    intervals.sort(key=lambda x: x[1])\n    count = 0\n    last_end = float('-inf')\n    pass",
    hints: [
      "This IS activity selection. Sort by end time, greedily pick earliest-finishing compatible intervals.",
      "Each pick is the locally earliest-finishing interval that doesn't overlap the previous pick.",
      "The proof from Greedy Stage 2 applies here: earliest-finish leaves maximum remaining space."
    ],
    solution: "def max_non_overlapping(intervals):\n    intervals.sort(key=lambda x: x[1])\n    count = 0\n    last_end = float('-inf')\n    for start, end in intervals:\n        if start >= last_end:\n            count += 1\n            last_end = end\n    return count",
    walkthrough: "This IS activity selection (Greedy P6). Same algorithm: sort by end, pick if start >= last_end. The interval topic and greedy topic converge here — the problem structure is identical. Recognition of cross-topic patterns is the goal of Mastery.",
    testCode: "assert max_non_overlapping([[1,2],[2,3],[3,4],[1,3]]) == 3\nassert max_non_overlapping([[1,2],[1,2],[1,2]]) == 1\nassert max_non_overlapping([[1,3],[2,4],[3,5]]) == 2\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Minimum Arrows = Greedy Overlap Callback", pattern: "interval grouping = activity selection dual", skill: "recognize min arrows = count of non-overlapping groups",
    statement: "Return min arrows to burst balloons. Recognize this as: sort by end, fire an arrow at the earliest end, skip all balloons burst by it. Each arrow is one 'group start' in activity selection terms.",
    examples: [
      { input: "points = [[10,16],[2,8],[1,6],[7,12]]", output: "2" },
    ],
    why: "Subject matter: interval overlap grouping is equivalent to counting the number of 'earliest-finishing' selections in activity selection. Each selected interval (by finish) bursts all overlapping balloons.",
    starterCode: "def min_arrows_mastery(points):\n    points.sort(key=lambda x: x[1])\n    arrows = 0\n    last_end = float('-inf')\n    pass",
    hints: [
      "Sort by end. Each time you encounter a balloon whose start > last_end, you need a new arrow.",
      "Set last_end = current balloon's end. This arrow bursts all balloons with start <= last_end.",
      "This IS the same as activity selection — count groups = count arrows."
    ],
    solution: "def min_arrows_mastery(points):\n    points.sort(key=lambda x: x[1])\n    arrows = 0\n    last_end = float('-inf')\n    for start, end in points:\n        if start > last_end:\n            arrows += 1\n            last_end = end\n    return arrows",
    walkthrough: "Same as Greedy P8. Sort by end. When a balloon starts after the last arrow's position, we need a new arrow at its end. Each arrow bursts a group of overlapping balloons. The count = number of activity-selection-style groups.",
    testCode: "assert min_arrows_mastery([[10,16],[2,8],[1,6],[7,12]]) == 2\nassert min_arrows_mastery([[1,2],[3,4],[5,6]]) == 3\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Merge + Insert Compose", pattern: "merge intervals then insert new", skill: "compose merge and insert into single pipeline",
    statement: "Given a list of intervals (unsorted, possibly overlapping) and a new interval, return the result of FIRST merging the list, THEN inserting the new interval. Compose P9 + P14.",
    examples: [
      { input: "intervals = [[1,3],[2,6],[8,10]], new = [9,15]", output: "[[1,6],[8,15]]" },
      { input: "intervals = [[5,7],[1,3],[2,4]], new = [4,6]", output: "[[1,7]]" },
    ],
    why: "Compose two independent interval operations. First merge (sort + running interval), then insert (three zones). The pipeline pattern: output of merge is sorted, non-overlapping — exactly the precondition for insert.",
    starterCode: "def merge_then_insert(intervals, new_interval):\n    pass",
    hints: [
      "Step 1: merge the list (P9). Result is sorted and non-overlapping.",
      "Step 2: insert new_interval into the merged list (P14).",
      "The output of step 1 is the exact input format step 2 expects — composition is clean."
    ],
    solution: "def merge_then_insert(intervals, new_interval):\n    if not intervals:\n        return [new_interval]\n    intervals.sort(key=lambda x: x[0])\n    merged = []\n    cur_start, cur_end = intervals[0]\n    for start, end in intervals[1:]:\n        if start <= cur_end:\n            cur_end = max(cur_end, end)\n        else:\n            merged.append([cur_start, cur_end])\n            cur_start, cur_end = start, end\n    merged.append([cur_start, cur_end])\n    result = []\n    i = 0\n    while i < len(merged) and merged[i][1] < new_interval[0]:\n        result.append(merged[i])\n        i += 1\n    while i < len(merged) and merged[i][0] <= new_interval[1]:\n        new_interval[0] = min(new_interval[0], merged[i][0])\n        new_interval[1] = max(new_interval[1], merged[i][1])\n        i += 1\n    result.append(new_interval)\n    result.extend(merged[i:])\n    return result",
    walkthrough: "Pipeline: merge first (P9), producing sorted non-overlapping intervals. Then insert (P14) using the three-zone algorithm. The preconditions match: merged output is sorted and non-overlapping — exactly what insert expects. Compose two interval operations.",
    testCode: "assert merge_then_insert([[1,3],[2,6],[8,10]], [9,15]) == [[1,6],[8,15]]\nassert merge_then_insert([[5,7],[1,3],[2,4]], [4,6]) == [[1,7]]\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Interval List Intersection with Two Pointers (Compose)", pattern: "two-pointer intersection of sorted merged lists", skill: "merge each list first, then two-pointer intersection",
    statement: "Given two UNSORTED lists of intervals (each may have overlapping intervals), return their intersection. Strategy: merge each list first, then two-pointer intersection. Compose merge + two-pointer intersection.",
    examples: [
      { input: "A = [[1,3],[2,6],[8,10]], B = [[0,4],[3,7],[9,11]]", output: "[[1,7],[9,10]]", explain: "merged A: [1,6],[8,10]; merged B: [0,7],[9,11]; intersect: [1,6]&[0,7]=[1,6]," },
    ],
    why: "Mastery composes: first normalize each list (merge → sorted, non-overlapping), then apply two-pointer intersection. The pipeline: merge A, merge B, then intersect. Each step uses a previously mastered technique.",
    starterCode: "def intersect_unsorted_lists(a, b):\n    def merge_list(intervals):\n        pass\n    merged_a = merge_list(a)\n    merged_b = merge_list(b)\n    pass",
    hints: [
      "Step 1: write merge_list (P9) to normalize each input into sorted, non-overlapping intervals.",
      "Step 2: apply two-pointer intersection (P25) on the two merged lists.",
      "A and B may be empty — handle base cases."
    ],
    solution: "def intersect_unsorted_lists(a, b):\n    def merge_list(intervals):\n        if not intervals:\n            return []\n        intervals.sort(key=lambda x: x[0])\n        merged = []\n        cs, ce = intervals[0]\n        for s, e in intervals[1:]:\n            if s <= ce:\n                ce = max(ce, e)\n            else:\n                merged.append([cs, ce])\n                cs, ce = s, e\n        merged.append([cs, ce])\n        return merged\n    ma = merge_list(a)\n    mb = merge_list(b)\n    i = j = 0\n    result = []\n    while i < len(ma) and j < len(mb):\n        start = max(ma[i][0], mb[j][0])\n        end = min(ma[i][1], mb[j][1])\n        if start <= end:\n            result.append([start, end])\n        if ma[i][1] < mb[j][1]:\n            i += 1\n        else:\n            j += 1\n    return result",
    walkthrough: "Pipeline: (1) Merge list A — sort + running interval. (2) Merge list B — same. (3) Two-pointer intersection on sorted, non-overlapping lists. Each step is a previously practiced primitive. Mastery = composing 2-3 primitives into a pipeline.",
    testCode: "A = [[1,3],[2,6],[8,10]]\nB = [[0,4],[3,7],[9,11]]\nassert intersect_unsorted_lists(A, B) == [[1,6],[9,10]]\nassert intersect_unsorted_lists([], [[1,2]]) == []\nassert intersect_unsorted_lists([[1,3]], [[4,6]]) == []\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "My Calendar I (No Double Booking)", pattern: "binary search + insert", skill: "maintain sorted non-overlapping bookings; check if new booking would cause overlap",
    statement: "Design a calendar where you can add events [start, end) without double booking. Implement book(start, end): return True if event doesn't overlap existing bookings, False otherwise. Maintain a sorted list of bookings; use binary search to check and insert.",
    examples: [
      { input: "book(10,20) → book(15,25) → book(20,30)", output: "True, False, True", explain: "[10,20) OK; [15,25) conflicts; [20,30) OK (touching at 20)" },
    ],
    why: "Mastery composes: binary search for insertion point, then check adjacent intervals for overlap. After sorting, only the immediate neighbors matter. Teaches the 'binary search + bounded check' pattern for online interval booking.",
    starterCode: "def test_my_calendar():\n    bookings = []\n    def book(start, end):\n        pass\n    results = []\n    for s, e in [(10, 20), (15, 25), (20, 30)]:\n        results.append(book(s, e))\n    return results",
    hints: [
      "Maintain a sorted list of bookings. Use bisect to find insertion position.",
      "Check left neighbor (if exists): left.end > start → overlap. Check right neighbor: right.start < end → overlap.",
      "If no overlap: insert at found position. Return True. Otherwise return False."
    ],
    solution: "def test_my_calendar():\n    import bisect\n    bookings = []\n    def book(start, end):\n        i = bisect.bisect_left([b[0] for b in bookings], start)\n        if i > 0 and bookings[i-1][1] > start:\n            return False\n        if i < len(bookings) and bookings[i][0] < end:\n            return False\n        bookings.insert(i, [start, end])\n        return True\n    results = []\n    for s, e in [(10, 20), (15, 25), (20, 30)]:\n        results.append(book(s, e))\n    return results",
    walkthrough: "Binary search for first booking with start >= new_start. Check left neighbor (if end > new_start → overlap). Check right neighbor (if start < new_end → overlap). Only adjacent neighbors matter after sorting. Insert in sorted order. O(n) insert, O(log n) search with bisect.",
    testCode: "assert test_my_calendar() == [True, False, True]\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Merge Two Sorted Interval Lists", pattern: "two-pointer merge on interval lists", skill: "given two sorted non-overlapping lists, merge them into one sorted non-overlapping list",
    statement: "Given two lists A and B, each sorted by start and non-overlapping, merge into one sorted non-overlapping list. Use two-pointer merge (like merge sort) followed by interval merging. Compose: merge two sorted arrays + then interval-merge the combined result.",
    examples: [
      { input: "A = [[1,5],[10,15]], B = [[3,8],[12,20]]", output: "[[1,8],[10,20]]" },
      { input: "A = [[1,2],[5,6]], B = [[3,4],[7,8]]", output: "[[1,4],[5,8]]" },
    ],
    why: "Compose two-pointer array merge with interval merge. Step 1: merge sorted lists into one sorted list (O(n+m)). Step 2: interval-merge the combined list (O(n+m)). Together: O(n+m). Pipeline: flaten + sort (implicit from two-pointer) + interval merge.",
    starterCode: "def merge_interval_lists(a, b):\n    merged = []\n    i = j = 0\n    pass",
    hints: [
      "Step 1: merge a and b by start (like merge sort). Two pointers i, j; append smaller-start interval.",
      "Step 2: interval-merge the merged list (same as P9). Sort is already done from two-pointer merge.",
      "Edge cases: one list empty. Handle as base case."
    ],
    solution: "def merge_interval_lists(a, b):\n    combined = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i][0] <= b[j][0]:\n            combined.append(a[i])\n            i += 1\n        else:\n            combined.append(b[j])\n            j += 1\n    combined.extend(a[i:])\n    combined.extend(b[j:])\n    if not combined:\n        return []\n    result = []\n    cs, ce = combined[0]\n    for s, e in combined[1:]:\n        if s <= ce:\n            ce = max(ce, e)\n        else:\n            result.append([cs, ce])\n            cs, ce = s, e\n    result.append([cs, ce])\n    return result",
    walkthrough: "Two-phase pipeline: (1) two-pointer merge of sorted lists → combined sorted by start. (2) Interval merge → merge any overlapping intervals in combined result. Each phase is O(n+m). The two-pointer ensures sorting is already done; only interval merge remains. Compose two known patterns.",
     testCode: "assert merge_interval_lists([[1,5],[10,15]], [[3,8],[12,20]]) == [[1,8],[10,20]]\nassert merge_interval_lists([[1,2],[5,6]], [[3,4],[7,8]]) == [[1,2],[3,4],[5,6],[7,8]]\nassert merge_interval_lists([], [[1,2]]) == [[1,2]]\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 6, title: "Count Points Covered by K Intervals", pattern: "sweep line + sliding count", skill: "count number of integer points covered by exactly k intervals using event counts",
    statement: "Given intervals [start, end), count how many integer points are covered by exactly k intervals. Use sweep line: events at start (+1) and end (-1). As we sweep, when the active count == k, the span to the next event adds to the result.",
    examples: [
      { input: "intervals = [[1,4],[2,5],[3,6]], k = 2", output: "2", explain: "points covered by exactly 2 intervals: t=1 has 0→1, t=2 has 1→2, t=3 has 2→3, etc. Need to compute." },
      { input: "intervals = [[1,2],[3,4]], k = 1", output: "2" },
    ],
    why: "Sweep line with a twist: instead of tracking max, track HOW LONG the active count stayed at exactly k. At each event, compute the distance since the previous event. If current_count == k (before update), add distance. Compose sweep line with targeted counting.",
    starterCode: "def points_covered_by_k(intervals, k):\n    events = []\n    for s, e in intervals:\n        events.append((s, 1))\n        events.append((e, -1))\n    events.sort()\n    total = 0\n    active = 0\n    prev_time = None\n    pass",
    hints: [
      "Sort events by time. Track prev_time. For each event: if active == k, add (time - prev_time) to total.",
      "Update active += delta. Update prev_time = time.",
      "Points are counted per integer span between events. O(n log n)."
    ],
    solution: "def points_covered_by_k(intervals, k):\n    events = []\n    for s, e in intervals:\n        events.append((s, 1))\n        events.append((e, -1))\n    events.sort()\n    total = 0\n    active = 0\n    prev = None\n    for time, delta in events:\n        if prev is not None and active == k:\n            total += time - prev\n        active += delta\n        prev = time\n    return total",
    walkthrough: "Sweep line with active count. Before processing each event: if active == k, the interval [prev, current_time] had exactly k active intervals. Add the span length. Then update active count. This generalizes 'meeting rooms II' (max concurrent) to 'how long does concurrency equal exactly k?' O(n log n).",
     testCode: "assert points_covered_by_k([[1,3],[2,5],[3,6]], 2) == 3\nassert points_covered_by_k([[1,2],[3,4]], 1) == 2\nassert points_covered_by_k([[1,5]], 1) == 4\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Minimum Number of Removal Intervals", pattern: "greedy activity selection", skill: "sort by end, greedily select non-overlapping to minimize removals",
    statement: "Given intervals, return minimum number to remove to make the rest non-overlapping. Equivalent: keep max non-overlapping subset (activity selection). Sort by end, pick earliest-finishing compatible intervals; removals = n - kept.",
    examples: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: "1", explain: "remove [1,3], keep 3 intervals" },
      { input: "intervals = [[1,2],[1,2],[1,2]]", output: "2" },
    ],
    why: "Compose: max non-overlapping = activity selection. Min removals = total - max_kept. Sort by end, greedily pick: each selected interval is the earliest-finishing compatible one. O(n log n). This is the interval formulation of a greedy DP: keep the max, remove the rest.",
    starterCode: "def min_removals(intervals):\n    intervals.sort(key=lambda x: x[1])\n    kept = 0\n    last_end = float('-inf')\n    pass",
    hints: [
      "Sort by end. Greedy: pick first compatible interval (start >= last_end), increment kept, update last_end.",
      "Min removals = total length - kept. The intervals NOT selected are the ones to remove.",
      "This IS the dual of max_non_overlapping (P27). Each removal is the complement of a selection."
    ],
    solution: "def min_removals(intervals):\n    intervals.sort(key=lambda x: x[1])\n    kept = 0\n    last_end = float('-inf')\n    for start, end in intervals:\n        if start >= last_end:\n            kept += 1\n            last_end = end\n    return len(intervals) - kept",
    walkthrough: "Greedy activity selection: sort by end. Iterate: pick if start >= last_end (compatible). After selecting max non-overlapping, the remaining intervals are the ones to remove. n - kept = removals. O(n log n). This cross-references with Greedy P6 — same problem, same algorithm.",
    testCode: "assert min_removals([[1,2],[2,3],[3,4],[1,3]]) == 1\nassert min_removals([[1,2],[1,2],[1,2]]) == 2\nassert min_removals([[1,2],[2,3]]) == 0\nprint('All tests passed!')"
  },
]
