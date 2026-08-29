export interface ICPCProblem {
  id: number
  stage: number
  title: string
  pattern: string
  skill: string
  difficulty: "Easy" | "Medium" | "Hard"
  statement: string
  examples: { input: string; output: string; explain?: string }[]
  why: string
  starterCode: string
  hints: string[]
  solution: string
  walkthrough: string
  testCode: string
}

export const PROBLEMS_ICPC_A: ICPCProblem[] = [
  {
    id: 1, stage: 0, title: "Digit Sum Parity", pattern: "ad-hoc digit math", skill: "decompose numbers", difficulty: "Easy",
    statement: "Given a list of positive integers, count how many have an even digit sum. The digit sum of 47 is 4+7=11.",
    examples: [
      { input: "nums = [12, 21, 34, 7]", output: "0", explain: "digit sums 3, 3, 7, 7 — all odd" },
      { input: "nums = [2, 11, 20]", output: "3", explain: "digit sums 2, 2, 2 — all even" },
    ],
    why: "Contest warmups reward exact reading. 'Even digit sum' decomposes into two tiny moves: extract digits, test parity. Speed here is pure accuracy.",
    starterCode: "def count_even_digit_sum(nums):\n    pass",
    hints: [
      "str(n) gives you the digits; sum the int of each character.",
      "n % 2 == 0 tests parity of the digit sum.",
      "Count with a generator: sum(1 for n in nums if digit_sum(n) % 2 == 0)."
    ],
    solution: "def count_even_digit_sum(nums):\n    def digit_sum(n):\n        return sum(int(c) for c in str(n))\n    return sum(1 for n in nums if digit_sum(n) % 2 == 0)",
    walkthrough: "One helper extracts the digit sum, one pass counts parity hits. No data structure needed — the whole problem is careful arithmetic.",
    testCode: "assert count_even_digit_sum([12, 21, 34, 7]) == 0\nassert count_even_digit_sum([2, 11, 20]) == 3\nassert count_even_digit_sum([1]) == 0\nassert count_even_digit_sum([100, 11]) == 1\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Balanced Brackets", pattern: "stack scan", skill: "last-open-first-closed", difficulty: "Easy",
    statement: "Given a string of '(' and ')' only, return True if it is balanced: every close has a matching earlier open.",
    examples: [
      { input: "s = '(())()'", output: "True" },
      { input: "s = '())('", output: "False", explain: "second ')' closes nothing" },
    ],
    why: "The stack counter is the seed of every bracket problem in ICPC (expressions, parsing, nesting). Here it degenerates to one integer — see that degeneration.",
    starterCode: "def is_balanced(s):\n    pass",
    hints: [
      "Track depth: '(' adds 1, ')' subtracts 1.",
      "Depth must never go negative, and must end at exactly 0.",
      "for c in s: depth += 1 if c == '(' else -1; if depth < 0: return False. Return depth == 0."
    ],
    solution: "def is_balanced(s):\n    depth = 0\n    for c in s:\n        depth += 1 if c == '(' else -1\n        if depth < 0:\n            return False\n    return depth == 0",
    walkthrough: "One counter replaces a stack because all brackets are identical. Negative depth means a close arrived before any open — fail fast. Ending at zero means every open was closed.",
    testCode: "assert is_balanced('(())()') == True\nassert is_balanced('())(') == False\nassert is_balanced('') == True\nassert is_balanced('((') == False\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Run-Length Encode", pattern: "linear scan simulation", skill: "track current run", difficulty: "Easy",
    statement: "Encode a string by replacing each run of repeated characters with the character followed by its count: 'aaabb' becomes 'a3b2'. Single characters keep count 1: 'abc' becomes 'a1b1c1'.",
    examples: [
      { input: "s = 'aaabb'", output: "'a3b2'" },
      { input: "s = 'abc'", output: "'a1b1c1'" },
    ],
    why: "Simulation problems are won by defining exactly one loop invariant: the run you are currently inside. This is the template for every 'process the input in one sweep' ICPC warmup.",
    starterCode: "def rle(s):\n    pass",
    hints: [
      "Keep the current character and its count; flush when the character changes.",
      "Do not forget the final run after the loop ends.",
      "Append f'{cur}{count}' on each flush and once after the loop."
    ],
    solution: "def rle(s):\n    if not s:\n        return ''\n    out = []\n    cur, count = s[0], 0\n    for c in s:\n        if c == cur:\n            count += 1\n        else:\n            out.append(f'{cur}{count}')\n            cur, count = c, 1\n    out.append(f'{cur}{count}')\n    return ''.join(out)",
    walkthrough: "Walk the string holding (current char, current count). On change, flush the pair and restart. The loop ends mid-run, so one final flush is required — forgetting it is the classic off-by-one.",
    testCode: "assert rle('aaabb') == 'a3b2'\nassert rle('abc') == 'a1b1c1'\nassert rle('') == ''\nassert rle('zzzz') == 'z4'\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Josephus Survivor", pattern: "circular simulation", skill: "index arithmetic", difficulty: "Medium",
    statement: "n people stand in a circle, numbered 1..n. Counting starts at person 1 and every k-th person is eliminated; counting resumes at the next person. Return the number of the last survivor.",
    examples: [
      { input: "n = 5, k = 2", output: "3", explain: "eliminated 2,4,1,5 — survivor 3" },
      { input: "n = 6, k = 3", output: "1" },
    ],
    why: "Josephus is the canonical ICPC circle-simulation. The index arithmetic (mod current size) is the skill: no fancy structure, just precise bookkeeping.",
    starterCode: "def josephus(n, k):\n    pass",
    hints: [
      "Keep a list of alive people and an index pointing at the next person to count.",
      "idx = (idx + k - 1) % len(people) selects the eliminated person.",
      "After removing, do not advance idx — the next element slid into its slot."
    ],
    solution: "def josephus(n, k):\n    people = list(range(1, n + 1))\n    idx = 0\n    while len(people) > 1:\n        idx = (idx + k - 1) % len(people)\n        people.pop(idx)\n    return people[0]",
    walkthrough: "The list is the circle. Adding k-1 to the current index lands on the k-th person modulo the current length. Popping shifts everyone after it left, so the same index now points at the next counting start.",
    testCode: "assert josephus(5, 2) == 3\nassert josephus(6, 3) == 1\nassert josephus(1, 5) == 1\nassert josephus(7, 3) == 4\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Weekday of a Date", pattern: "closed-form formula", skill: "apply Zeller correctly", difficulty: "Medium",
    statement: "Given a valid date as integers year, month, day (Gregorian calendar), return the weekday name: one of 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'.",
    examples: [
      { input: "y=2026, m=8, d=25", output: "'Tuesday'" },
      { input: "y=2000, m=1, d=1", output: "'Saturday'" },
    ],
    why: "Many ICPC warmups hide a known formula (calendar, geometry, combinatorics). The contest skill is implementing the formula exactly — especially its January/February year adjustment.",
    starterCode: "def weekday(y, m, d):\n    pass",
    hints: [
      "Zeller: treat January and February as months 13 and 14 of the previous year.",
      "h = (d + 13*(m+1)//5 + K + K//4 + J//4 + 5*J) % 7 with K = year%100, J = year//100 (after adjustment).",
      "h = 0 is Saturday, 1 Sunday, 2 Monday, 3 Tuesday, and so on."
    ],
    solution: "def weekday(y, m, d):\n    if m < 3:\n        m += 12\n        y -= 1\n    K, J = y % 100, y // 100\n    h = (d + 13 * (m + 1) // 5 + K + K // 4 + J // 4 + 5 * J) % 7\n    names = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']\n    return names[h]",
    walkthrough: "Shift Jan/Feb into the previous year, compute Zeller's h from the day, split year, and the two leap corrections. The only failure modes are skipping the month shift or mis-mapping h to names.",
    testCode: "assert weekday(2026, 8, 25) == 'Tuesday'\nassert weekday(2000, 1, 1) == 'Saturday'\nassert weekday(1900, 3, 1) == 'Thursday'\nassert weekday(2024, 2, 29) == 'Thursday'\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 0, title: "1D Cellular Automaton", pattern: "step simulation", skill: "build next state from neighbors", difficulty: "Medium",
    statement: "A row of cells holds 0s and 1s. Each step, every cell becomes the XOR of its two neighbors (the cell's own value is ignored); cells outside the row are treated as 0. Given the starting row and a number of steps, return the final row.",
    examples: [
      { input: "cells = [0,1,0,1,0], steps = 1", output: "[1, 0, 0, 0, 1]", explain: "each cell becomes left XOR right" },
      { input: "cells = [1,1,1], steps = 2", output: "[0, 0, 0]" },
    ],
    why: "Grid/automaton simulation is an ICPC staple. The transferable skill: compute the next state from a snapshot — never mutate while reading neighbors.",
    starterCode: "def evolve(cells, steps):\n    pass",
    hints: [
      "For each step, build a brand-new row from the old one.",
      "Neighbor of cell i: old[i-1] if i > 0 else 0, and old[i+1] if i+1 < n else 0.",
      "new[i] = left ^ right; repeat steps times."
    ],
    solution: "def evolve(cells, steps):\n    row = list(cells)\n    n = len(row)\n    for _ in range(steps):\n        row = [(row[i - 1] if i > 0 else 0) ^ (row[i + 1] if i + 1 < n else 0) for i in range(n)]\n    return row",
    walkthrough: "Each generation is a pure function of the previous one. Building a fresh list per step guarantees neighbors are read from the old state — in-place mutation is the bug that ruins simulations.",
    testCode: "assert evolve([0,1,0,1,0], 1) == [1,0,0,0,1]\nassert evolve([1,1,1], 2) == [0,0,0]\nassert evolve([1], 5) == [0]\nassert evolve([0,0], 3) == [0,0]\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 1, title: "Closest Pair Values", pattern: "sort + adjacent scan", skill: "order exposes locality", difficulty: "Easy",
    statement: "Given a list of integers, return the smallest absolute difference between any two elements.",
    examples: [
      { input: "nums = [3, 8, 5, 1]", output: "2", explain: "sorted 1,3,5,8 — closest pair 3,5" },
      { input: "nums = [10, 30, 20]", output: "10" },
    ],
    why: "Sorting converts 'any pair' into 'adjacent pairs'. This one observation powers dozens of ICPC problems — internalize that order creates locality.",
    starterCode: "def min_pair_diff(nums):\n    pass",
    hints: [
      "After sorting, the closest pair must be adjacent.",
      "Scan consecutive pairs and track the minimum of nums[i+1] - nums[i].",
      "min(nums[i+1] - nums[i] for i in range(len(nums)-1)) after sorting."
    ],
    solution: "def min_pair_diff(nums):\n    nums = sorted(nums)\n    return min(nums[i + 1] - nums[i] for i in range(len(nums) - 1))",
    walkthrough: "If a and b are non-adjacent after sorting, everything between them is at least as close to each of them as they are to each other. So adjacent differences cover the optimum.",
    testCode: "assert min_pair_diff([3, 8, 5, 1]) == 2\nassert min_pair_diff([10, 30, 20]) == 10\nassert min_pair_diff([5, 5, 5]) == 0\nassert min_pair_diff([1, 100]) == 99\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Attend All Meetings", pattern: "sort + sweep", skill: "detect overlap by ordering", difficulty: "Easy",
    statement: "Given meeting times as [start, end] pairs, return True if a single person could attend every meeting — that is, no two meetings overlap. A meeting ending exactly when another starts is fine.",
    examples: [
      { input: "meetings = [[0, 30], [35, 40], [30, 32]]", output: "True", explain: "[0,30] ends exactly when [30,32] begins" },
      { input: "meetings = [[5, 10], [8, 12]]", output: "False" },
    ],
    why: "Interval problems almost always begin 'sort by start'. The sweep then only ever compares the previous interval with the current one.",
    starterCode: "def can_attend(meetings):\n    pass",
    hints: [
      "Sort meetings by start time.",
      "Overlap exists iff current start < previous end (strict, because touching is allowed).",
      "Track prev_end and compare as you sweep."
    ],
    solution: "def can_attend(meetings):\n    meetings = sorted(meetings)\n    prev_end = meetings[0][1]\n    for start, end in meetings[1:]:\n        if start < prev_end:\n            return False\n        prev_end = end\n    return True",
    walkthrough: "After sorting by start, any conflict must be between a meeting and the earliest-ending one before it. Keeping just prev_end is enough because starts are non-decreasing.",
    testCode: "assert can_attend([[0,30],[35,40],[30,32]]) == True\nassert can_attend([[5,10],[8,12]]) == False\nassert can_attend([[1,2]]) == True\nassert can_attend([[1,4],[2,3]]) == False\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Pair With Target Sum", pattern: "two pointers", skill: "squeeze from both ends", difficulty: "Easy",
    statement: "Given a list sorted in non-decreasing order and a target, return the two 0-based indices whose values add to the target, or [-1, -1] if none exists. The input has exactly one solution when it exists.",
    examples: [
      { input: "nums = [1, 2, 4, 7, 11], target = 9", output: "[1, 3]", explain: "2 + 7 = 9" },
      { input: "nums = [1, 3, 5], target = 20", output: "[-1, -1]" },
    ],
    why: "Sorted order lets two pointers eliminate one candidate per step, turning O(n^2) into O(n). This exchange argument is the most reused proof in contest two-pointers.",
    starterCode: "def two_sum_sorted(nums, target):\n    pass",
    hints: [
      "Start lo at the beginning and hi at the end.",
      "If the sum is too small only lo can grow; if too big only hi can shrink.",
      "Move exactly one pointer per iteration; they meet in at most n steps."
    ],
    solution: "def two_sum_sorted(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        s = nums[lo] + nums[hi]\n        if s == target:\n            return [lo, hi]\n        if s < target:\n            lo += 1\n        else:\n            hi -= 1\n    return [-1, -1]",
    walkthrough: "If sum < target, nums[hi] paired with anything left of lo is even smaller, so lo can safely advance — and symmetrically for hi. Each step permanently discards one index.",
    testCode: "assert two_sum_sorted([1,2,4,7,11], 9) == [1, 3]\nassert two_sum_sorted([1,3,5], 20) == [-1, -1]\nassert two_sum_sorted([2, 7], 9) == [0, 1]\nassert two_sum_sorted([0, 0, 3], 0) == [0, 1]\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Rescue Boats", pattern: "greedy two pointers", skill: "pair heaviest with lightest", difficulty: "Medium",
    statement: "Each boat carries at most two people and has a weight limit. Given people's weights and the limit, return the minimum number of boats. Every person must get a boat.",
    examples: [
      { input: "people = [3, 2, 2, 1], limit = 3", output: "3", explain: "pair (1,2) and singles 2, 3" },
      { input: "people = [1, 2], limit = 3", output: "1" },
    ],
    why: "The greedy exchange argument: if the heaviest person can share, pairing them with the lightest is never worse. Two pointers make the argument executable.",
    starterCode: "def num_boats(people, limit):\n    pass",
    hints: [
      "Sort, then point lo at the lightest and hi at the heaviest.",
      "Heaviest always boards; take the lightest too only if the sum fits.",
      "Each iteration launches exactly one boat."
    ],
    solution: "def num_boats(people, limit):\n    people = sorted(people)\n    lo, hi = 0, len(people) - 1\n    boats = 0\n    while lo <= hi:\n        if people[lo] + people[hi] <= limit:\n            lo += 1\n        hi -= 1\n        boats += 1\n    return boats",
    walkthrough: "The heaviest remaining person must board now. The best possible companion is the lightest remaining, so try to add them; either way one boat is spent and hi retires.",
    testCode: "assert num_boats([3,2,2,1], 3) == 3\nassert num_boats([1,2], 3) == 1\nassert num_boats([5,5,5], 5) == 3\nassert num_boats([2,2,2,2], 4) == 2\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Merge Overlapping Intervals", pattern: "sort + sweep merge", skill: "extend or flush", difficulty: "Medium",
    statement: "Given intervals [start, end], merge all overlapping ones and return them sorted by start. Touching intervals ([1,4] and [4,5]) count as overlapping.",
    examples: [
      { input: "intervals = [[1, 3], [2, 6], [8, 10]]", output: "[[1, 6], [8, 10]]" },
      { input: "intervals = [[1, 4], [4, 5]]", output: "[[1, 5]]" },
    ],
    why: "The extend-or-flush sweep is the workhorse behind calendar merging, range unions, and coverage problems across every ICPC regional.",
    starterCode: "def merge_intervals(intervals):\n    pass",
    hints: [
      "Sort by start; keep a list of merged intervals.",
      "If current start <= last merged end, extend that end.",
      "Otherwise append the current interval as new."
    ],
    solution: "def merge_intervals(intervals):\n    intervals = sorted(intervals)\n    merged = [list(intervals[0])]\n    for start, end in intervals[1:]:\n        if start <= merged[-1][1]:\n            merged[-1][1] = max(merged[-1][1], end)\n        else:\n            merged.append([start, end])\n    return merged",
    walkthrough: "With starts sorted, the current interval either reaches into the last merged block (extend its end) or begins after it (start a new block). The max() guards nested intervals.",
    testCode: "assert merge_intervals([[1,3],[2,6],[8,10]]) == [[1, 6], [8, 10]]\nassert merge_intervals([[1,4],[4,5]]) == [[1, 5]]\nassert merge_intervals([[2,3],[1,4],[5,6]]) == [[1, 4], [5, 6]]\nassert merge_intervals([[1, 1]]) == [[1, 1]]\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "K-th Smallest Pair Distance", pattern: "binary search + two pointers", skill: "count pairs under bound", difficulty: "Hard",
    statement: "Given a list of integers, the distance of a pair (i, j) is |nums[i] - nums[j]|. Return the k-th smallest pair distance (1-indexed, k <= n*(n-1)/2).",
    examples: [
      { input: "nums = [1, 3, 1], k = 1", output: "0", explain: "distances 0, 2, 2" },
      { input: "nums = [1, 6, 1], k = 3", output: "5" },
    ],
    why: "Binary search on the answer + a linear feasibility count is the signature pattern of hard ICPC binaries. You never construct the k-th item — you count how many fit under a guess.",
    starterCode: "def kth_pair_distance(nums, k):\n    pass",
    hints: [
      "Sort the array; candidate answers live in [0, max - min].",
      "For a guess d, count pairs with distance <= d using a sliding right pointer — for each left index, count = right - left - 1 style windows.",
      "If the count >= k the answer is <= d, else it is larger."
    ],
    solution: "def kth_pair_distance(nums, k):\n    nums = sorted(nums)\n    n = len(nums)\n    def count_within(d):\n        total, left = 0, 0\n        for right in range(n):\n            while nums[right] - nums[left] > d:\n                left += 1\n            total += right - left\n        return total\n    lo, hi = 0, nums[-1] - nums[0]\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if count_within(mid) >= k:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo",
    walkthrough: "count_within(d) is monotone in d, so binary search finds the smallest d with at least k pairs — exactly the k-th distance. The two-pointer window keeps each count O(n).",
    testCode: "assert kth_pair_distance([1,3,1], 1) == 0\nassert kth_pair_distance([1,6,1], 3) == 5\nassert kth_pair_distance([1, 2], 1) == 1\nassert kth_pair_distance([9, 10, 7, 10, 6, 1, 5, 4, 9, 8], 18) == 2\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 2, title: "Wood Cutting", pattern: "binary search on answer", skill: "monotone feasibility", difficulty: "Medium",
    statement: "You have trees with given heights and a saw set at height H: a tree taller than H yields its excess. Given a required amount of wood m, return the maximum cut height H (an integer, at least 0) that still yields at least m wood.",
    examples: [
      { input: "trees = [20, 15, 10, 17], m = 7", output: "15", explain: "cutting at 15 yields 5+0+0+2 = 7" },
      { input: "trees = [4, 42, 40, 26, 46], m = 20", output: "36" },
    ],
    why: "The classic 'maximize a threshold subject to a monotone yield' problem — the template for every ICPC binary search on answer, from machine scheduling to bandwidth allocation.",
    starterCode: "def max_cut_height(trees, m):\n    pass",
    hints: [
      "Wood yielded at H is sum(max(0, h - H)) — strictly non-increasing as H grows.",
      "Binary search H in [0, max(trees)].",
      "Feasible H means yield >= m; keep the largest feasible."
    ],
    solution: "def max_cut_height(trees, m):\n    lo, hi = 0, max(trees)\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if sum(max(0, h - mid) for h in trees) >= m:\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo",
    walkthrough: "Yield decreases as H rises, so feasibility is monotone. Search the boundary: mid biased upward (+1) so the 'feasible' branch can converge to the maximum H.",
    testCode: "assert max_cut_height([20,15,10,17], 7) == 15\nassert max_cut_height([4,42,40,26,46], 20) == 36\nassert max_cut_height([5], 5) == 0\nassert max_cut_height([10, 10], 3) == 8\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 2, title: "Ship Packages in D Days", pattern: "binary search on capacity", skill: "greedy feasibility count", difficulty: "Medium",
    statement: "Packages must ship in order over at most D days; one ship per day carries a contiguous run whose total weight is its capacity. Return the least capacity that finishes within D days.",
    examples: [
      { input: "weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], d = 5", output: "15" },
      { input: "weights = [3, 2, 2, 4, 1, 4], d = 3", output: "6" },
    ],
    why: "Same monotone-feasibility skeleton as wood cutting, but the feasibility test is a greedy simulation — learn to separate the search (binary) from the check (greedy).",
    starterCode: "def min_capacity(weights, d):\n    pass",
    hints: [
      "Capacity is feasible iff a greedy packing (load until the next package overflows) needs <= d days.",
      "Search in [max(weights), sum(weights)].",
      "Days needed is non-increasing in capacity — binary search the boundary."
    ],
    solution: "def min_capacity(weights, d):\n    def days_needed(cap):\n        days, load = 1, 0\n        for w in weights:\n            if load + w > cap:\n                days += 1\n                load = w\n            else:\n                load += w\n        return days\n    lo, hi = max(weights), sum(weights)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if days_needed(mid) <= d:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo",
    walkthrough: "Greedy packing is optimal for a fixed capacity (delaying a package never helps), so days_needed is exact. Its monotonicity makes the capacity a clean binary search.",
    testCode: "assert min_capacity(list(range(1, 11)), 5) == 15\nassert min_capacity([3,2,2,4,1,4], 3) == 6\nassert min_capacity([5], 1) == 5\nassert min_capacity([1,2,3], 1) == 6\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Aggressive Cows", pattern: "binary search on min gap", skill: "maximize the minimum", difficulty: "Hard",
    statement: "Place c cows in stalls at the given positions so that the minimum distance between any two cows is as large as possible. Return that maximum minimum distance.",
    examples: [
      { input: "stalls = [1, 2, 8, 4, 9], c = 3", output: "3", explain: "place at 1, 4, 9" },
      { input: "stalls = [1, 2, 4], c = 3", output: "1" },
    ],
    why: "'Maximize the minimum' (and its twin 'minimize the maximum') is a whole ICPC genre. Recognizing that the feasibility check is greedy is the entire difficulty.",
    starterCode: "def aggressive_cows(stalls, c):\n    pass",
    hints: [
      "Sort stalls; binary search the gap d in [1, max - min].",
      "Feasible(d): place a cow at the first stall, then greedily at the next stall at least d away.",
      "Count placed cows; feasible iff count >= c."
    ],
    solution: "def aggressive_cows(stalls, c):\n    stalls = sorted(stalls)\n    def can_place(d):\n        count, last = 1, stalls[0]\n        for pos in stalls[1:]:\n            if pos - last >= d:\n                count += 1\n                last = pos\n        return count >= c\n    lo, hi = 1, stalls[-1] - stalls[0]\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if can_place(mid):\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo",
    walkthrough: "Larger required gap means fewer placeable cows — monotone. The greedy (earliest valid stall each time) maximizes cows for any fixed d, so the count test is exact.",
    testCode: "assert aggressive_cows([1,2,8,4,9], 3) == 3\nassert aggressive_cows([1,2,4], 3) == 1\nassert aggressive_cows([10, 1, 2], 2) == 9\nassert aggressive_cows([5, 4, 3, 2, 1], 5) == 1\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Split Array Largest Sum", pattern: "binary search on max load", skill: "minimize the maximum", difficulty: "Hard",
    statement: "Split a list of non-negative integers into exactly k consecutive subarrays so that the largest subarray sum is minimized. Return that minimized maximum sum.",
    examples: [
      { input: "nums = [7, 2, 5, 10, 8], k = 2", output: "18", explain: "[7,2,5] and [10,8]" },
      { input: "nums = [1, 2, 3, 4], k = 4", output: "4" },
    ],
    why: "The mirror of ship-packages: here you minimize the maximum. Same binary search, same greedy count — the pattern transfers with the inequality flipped.",
    starterCode: "def split_largest_sum(nums, k):\n    pass",
    hints: [
      "A cap is feasible if a greedy sweep (close a block before exceeding the cap) needs at most k blocks.",
      "Search caps in [max(nums), sum(nums)].",
      "Feasible means the answer is <= cap."
    ],
    solution: "def split_largest_sum(nums, k):\n    def blocks_fit(cap):\n        blocks, load = 1, 0\n        for x in nums:\n            if load + x > cap:\n                blocks += 1\n                load = x\n            else:\n                load += x\n        return blocks <= k\n    lo, hi = max(nums), sum(nums)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if blocks_fit(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo",
    walkthrough: "Fewer blocks are needed as the cap rises, so feasibility is monotone. The greedy packs each block as full as possible, which minimizes the block count for that cap.",
    testCode: "assert split_largest_sum([7,2,5,10,8], 2) == 18\nassert split_largest_sum([1,2,3,4], 4) == 4\nassert split_largest_sum([1, 4, 4], 3) == 4\nassert split_largest_sum([2, 2], 1) == 4\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Koko Eating Bananas", pattern: "binary search on rate", skill: "ceil-based feasibility", difficulty: "Medium",
    statement: "Koko eats banana piles at a fixed speed of k pile-units per hour (a partial pile still costs a whole hour). Given piles and h hours, return the minimum integer speed that finishes all piles within h hours.",
    examples: [
      { input: "piles = [3, 6, 7, 11], h = 8", output: "4" },
      { input: "piles = [30, 11, 23, 4, 20], h = 5", output: "30" },
    ],
    why: "The ceiling function makes hours(speed) a step function — still monotone, so binary search survives. Handling ceil-with-integers cleanly is the micro-skill.",
    starterCode: "def min_eating_speed(piles, h):\n    pass",
    hints: [
      "Hours at speed k = sum((p + k - 1) // k for p in piles) — integer ceiling.",
      "Search k in [1, max(piles)].",
      "Feasible means hours <= h; keep the smallest feasible k."
    ],
    solution: "def min_eating_speed(piles, h):\n    def hours(k):\n        return sum((p + k - 1) // k for p in piles)\n    lo, hi = 1, max(piles)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if hours(mid) <= h:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo",
    walkthrough: "Faster eating never needs more hours, so the feasibility boundary is well defined. (p + k - 1) // k computes the ceiling without floats — the standard contest idiom.",
    testCode: "assert min_eating_speed([3,6,7,11], 8) == 4\nassert min_eating_speed([30,11,23,4,20], 5) == 30\nassert min_eating_speed([5], 10) == 1\nassert min_eating_speed([1000000], 2) == 500000\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Cube Root, Exactly", pattern: "binary search on reals", skill: "precision as a stopping rule", difficulty: "Medium",
    statement: "Given a non-negative real number x, return its cube root rounded to 6 decimal places. You may use only multiplication and comparison — no exponent operator, no math.pow.",
    examples: [
      { input: "x = 27", output: "3.0", explain: "3 × 3 × 3 = 27 exactly" },
      { input: "x = 2", output: "1.259921", explain: "1.259921³ ≈ 1.9999998 — within 6 decimals of the true root" },
      { input: "x = 0.027", output: "0.3", explain: "0.3³ = 0.027 — the answer is LARGER than x when x < 1" },
    ],
    why: "Binary search on integers steps by ±1 because 1 is the smallest unit. Reals have no next value, so the stopping rule changes: run until the interval is smaller than the error you tolerate. Same loop as Koko Eating Bananas — new termination physics.",
    starterCode: "def cube_root(x):\n    pass",
    hints: [
      "Bounds: lo = 0, hi = max(1.0, x). The max matters when x < 1 — the root of 0.027 is 0.3, bigger than x.",
      "Shrink by half every iteration: if mid³ < x the root lies right of mid, else left.",
      "100 iterations turns any hi ≤ 1e9 into an interval far below 1e-6. Prefer a fixed count over 'while hi - lo > eps' — adjacent floats can make that loop spin.",
    ],
    solution: "def cube_root(x):\n    lo, hi = 0.0, max(1.0, x)\n    for _ in range(100):\n        mid = (lo + hi) / 2\n        if mid * mid * mid < x:\n            lo = mid\n        else:\n            hi = mid\n    return round(hi, 6)",
    walkthrough: "The invariant is 'the root is always in [lo, hi]'. Each iteration halves the interval, so after k iterations it is (hi−lo)/2^k wide — 100 halvings of 1e9 is astronomically past 1e-6. Rounding at the end is presentation; the search already guaranteed 6 correct decimals.",
    testCode: "assert abs(cube_root(27) - 3.0) < 1e-5\nassert abs(cube_root(2) - 1.259921) < 1e-5\nassert abs(cube_root(0.027) - 0.3) < 1e-5\nassert abs(cube_root(64) - 4.0) < 1e-5\nassert abs(cube_root(1000000000) - 1000.0) < 1e-4\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Integer Square Root", pattern: "binary search boundary", skill: "hand-rolled bisection", difficulty: "Easy",
    statement: "Return the largest integer r such that r*r <= n, for a non-negative integer n, without using any square-root function.",
    examples: [
      { input: "n = 17", output: "4" },
      { input: "n = 0", output: "0" },
    ],
    why: "The purest binary search on a monotone predicate (r*r <= n). Every overflow-safe contest bisection is this loop wearing a costume.",
    starterCode: "def isqrt(n):\n    pass",
    hints: [
      "Search r in [0, n].",
      "If mid*mid <= n the answer is at least mid — move lo up; else shrink hi.",
      "Bias mid upward ((lo + hi + 1) // 2) so the feasible branch progresses."
    ],
    solution: "def isqrt(n):\n    lo, hi = 0, n\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if mid * mid <= n:\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo",
    walkthrough: "The predicate r*r <= n is true up to some boundary and false after it. Upward-biased mid plus 'lo = mid on true' converges exactly to the boundary.",
    testCode: "assert isqrt(17) == 4\nassert isqrt(0) == 0\nassert isqrt(1) == 1\nassert isqrt(10**12) == 10**6\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 3, title: "Range Sum Queries", pattern: "prefix sums", skill: "precompute once, query O(1)", difficulty: "Easy",
    statement: "Given an array and q queries (l, r), 0-indexed inclusive, return the list of sums of nums[l..r]. Precompute so each query is O(1).",
    examples: [
      { input: "nums = [1, 2, 3, 4], queries = [(0, 2), (1, 3), (2, 2)]", output: "[6, 9, 3]" },
      { input: "nums = [5], queries = [(0, 0)]", output: "[5]" },
    ],
    why: "Prefix sums are the first 'pay preprocessing to answer queries' trade every contestant must own. The inclusive/exclusive bookkeeping must be automatic.",
    starterCode: "def range_sums(nums, queries):\n    pass",
    hints: [
      "Build prefix where prefix[i] = sum of the first i elements (prefix[0] = 0).",
      "Sum of nums[l..r] = prefix[r+1] - prefix[l].",
      "Build the prefix with a running total in one pass."
    ],
    solution: "def range_sums(nums, queries):\n    prefix = [0]\n    for x in nums:\n        prefix.append(prefix[-1] + x)\n    return [prefix[r + 1] - prefix[l] for l, r in queries]",
    walkthrough: "prefix[i] stores the sum before index i, so any range is a subtraction of two prefixes. The empty slot at index 0 removes every special case.",
    testCode: "assert range_sums([1,2,3,4], [(0,2),(1,3),(2,2)]) == [6, 9, 3]\nassert range_sums([5], [(0, 0)]) == [5]\nassert range_sums([2, -1, 3], [(0, 1), (1, 2)]) == [1, 2]\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 3, title: "Subarrays Divisible by K", pattern: "prefix mod counting", skill: "count residue pairs", difficulty: "Medium",
    statement: "Given an integer array (may contain negatives) and k, return the number of contiguous subarrays whose sum is divisible by k.",
    examples: [
      { input: "nums = [4, 5, 0, -2, -3, 7], k = 9", output: "7" },
      { input: "nums = [5], k = 9", output: "0" },
    ],
    why: "The prefix-mod trick (sum(l..r) divisible by k iff prefix[l] ≡ prefix[r+1] mod k) is a permanent ICPC tool — and negatives force the proper modulo fix.",
    starterCode: "def count_divisible_subarrays(nums, k):\n    pass",
    hints: [
      "Track running prefix mod k; subarray (l, r] is divisible iff the two prefix mods match.",
      "Count occurrences of each residue; pairs from residue c contribute c*(c-1)/2.",
      "In Python, (x mod k) is already non-negative for negative x — use it directly."
    ],
    solution: "def count_divisible_subarrays(nums, k):\n    from collections import defaultdict\n    counts = defaultdict(int)\n    counts[0] = 1\n    prefix, total = 0, 0\n    for x in nums:\n        prefix = (prefix + x) % k\n        total += counts[prefix]\n        counts[prefix] += 1\n    return total",
    walkthrough: "Every prefix leaves a residue; two equal residues bracket a divisible subarray. Counting matches on the fly (adding counts[prefix] before incrementing) counts each pair exactly once.",
    testCode: "assert count_divisible_subarrays([4,5,0,-2,-3,7], 9) == 4\nassert count_divisible_subarrays([5], 9) == 0\nassert count_divisible_subarrays([1, 2, 3], 3) == 3\nassert count_divisible_subarrays([-1, -2], 3) == 1\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 3, title: "Matrix Block Sum", pattern: "2D prefix sums", skill: "inclusion-exclusion", difficulty: "Medium",
    statement: "Given an m x n matrix and integer k, return a matrix where each cell (i, j) is the sum of all matrix cells (r, c) with i-k <= r <= i+k and j-k <= c <= j+k (clamped to the matrix).",
    examples: [
      { input: "mat = [[1,2,3],[4,5,6],[7,8,9]], k = 1", output: "[[12,21,16],[27,45,33],[24,39,28]]" },
      { input: "mat = [[5]], k = 1", output: "[[5]]" },
    ],
    why: "2D prefixes with inclusion–exclusion appear in image/heatmap ICPC problems. The four-corner subtraction must be muscle memory.",
    starterCode: "def matrix_block_sum(mat, k):\n    pass",
    hints: [
      "Build P of size (m+1) x (n+1) where P[i][j] = sum of mat[0..i-1][0..j-1].",
      "Rectangle sum = P[b][r] - P[t][r] - P[b][l] + P[t][l].",
      "Clamp indices: rows i-k..i+k become t = max(0, i-k), b = min(m, i+k+1); same for columns."
    ],
    solution: "def matrix_block_sum(mat, k):\n    m, n = len(mat), len(mat[0])\n    P = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(m):\n        for j in range(n):\n            P[i + 1][j + 1] = mat[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]\n    out = [[0] * n for _ in range(m)]\n    for i in range(m):\n        for j in range(n):\n            t, b = max(0, i - k), min(m, i + k + 1)\n            l, r = max(0, j - k), min(n, j + k + 1)\n            out[i][j] = P[b][r] - P[t][r] - P[b][l] + P[t][l]\n    return out",
    walkthrough: "P is padded with a zero row and column so every rectangle is one subtraction formula with no boundary cases. Clamping the query corners handles the edges.",
    testCode: "assert matrix_block_sum([[1,2,3],[4,5,6],[7,8,9]], 1) == [[12,21,16],[27,45,33],[24,39,28]]\nassert matrix_block_sum([[5]], 1) == [[5]]\nassert matrix_block_sum([[1,2],[3,4]], 0) == [[1,2],[3,4]]\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Flight Bookings", pattern: "difference array", skill: "defer range updates", difficulty: "Medium",
    statement: "There are n flights numbered 1..n. Each booking books `seats` seats on every flight from i to j inclusive. Given the booking list, return the seats booked on each flight.",
    examples: [
      { input: "bookings = [[1, 3, 2], [2, 3, 1]], n = 3", output: "[2, 3, 3]" },
      { input: "bookings = [[1, 2, 1]], n = 3", output: "[1, 1, 0]" },
    ],
    why: "The difference array answers 'add a constant to a whole range' in O(1) per update. Sweep-line thinking starts here.",
    starterCode: "def flight_bookings(bookings, n):\n    pass",
    hints: [
      "delta[i] += seats at the start of the range, delta[j+1] -= seats just past the end.",
      "Take the running prefix sum of delta to reconstruct actual values.",
      "Index j+1 may be n — size the delta array n+1 to absorb it."
    ],
    solution: "def flight_bookings(bookings, n):\n    delta = [0] * (n + 1)\n    for i, j, seats in bookings:\n        delta[i - 1] += seats\n        delta[j] -= seats\n    out, running = [], 0\n    for i in range(n):\n        running += delta[i]\n        out.append(running)\n    return out",
    walkthrough: "Mark where a booking begins and where it stops applying; one prefix pass rebuilds every flight's load. n+1 slots let the subtraction land safely past the end.",
    testCode: "assert flight_bookings([[1,3,2],[2,3,1]], 3) == [2, 3, 3]\nassert flight_bookings([[1,2,1]], 3) == [1, 1, 0]\nassert flight_bookings([], 2) == [0, 0]\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "XOR of Range Queries", pattern: "prefix XOR", skill: "XOR cancels pairs", difficulty: "Easy",
    statement: "Given an array and queries (l, r) inclusive 0-indexed, return the XOR of nums[l..r] for each query, using precomputation.",
    examples: [
      { input: "nums = [1, 3, 4, 8], queries = [(0, 1), (1, 3), (0, 3)]", output: "[2, 15, 14]" },
      { input: "nums = [4, 8, 2], queries = [(0, 0), (2, 2)]", output: "[4, 2]" },
    ],
    why: "XOR is its own inverse, so prefix[X] works for range XOR exactly like prefix sums. Seeing which operations admit 'prefix' generalization is the real lesson.",
    starterCode: "def xor_queries(nums, queries):\n    pass",
    hints: [
      "Build prefix where prefix[i] = nums[0] ^ ... ^ nums[i-1].",
      "XOR of nums[l..r] = prefix[r+1] ^ prefix[l].",
      "Elements appearing in both prefixes cancel out."
    ],
    solution: "def xor_queries(nums, queries):\n    prefix = [0]\n    for x in nums:\n        prefix.append(prefix[-1] ^ x)\n    return [prefix[r + 1] ^ prefix[l] for l, r in queries]",
    walkthrough: "Because a ^ a = 0, subtracting becomes XOR-ing: the shared prefix cancels and only the range survives. Identical shape to range sums.",
    testCode: "assert xor_queries([1,3,4,8], [(0,1),(1,3),(0,3)]) == [2, 15, 14]\nassert xor_queries([4,8,2], [(0,0),(2,2)]) == [4, 2]\nassert xor_queries([7], [(0, 0)]) == [7]\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Static Range Minimum", pattern: "sparse table", skill: "precompute overlapping powers", difficulty: "Medium",
    statement: "Given an array of n integers and q queries (l, r), return the minimum of arr[l..r] inclusive for each query. n, q up to 2×10⁵ — you need O(n log n) build and O(1) query.",
    examples: [
      { input: "arr = [4, 1, 7, 2, 9], queries = [(1,3), (0,4), (2,3)]", output: "[1, 1, 2]", explain: "min([1,7,2])=1, min(whole)=1, min([7,2])=2" },
      { input: "arr = [-5], queries = [(0,0)]", output: "[-5]", explain: "single element ranges are their own answer" },
    ],
    why: "Prefix sums answer ranges because subtraction undoes addition — but min has no inverse, so that trick dies. Scanning each range costs O(n·q) = 4×10¹⁰. The fix exploits an algebraic accident: min(a, a) = a. Idempotent folds may OVERLAP two precomputed blocks, so two power-of-two blocks cover any range in O(1).",
    starterCode: "def build_sparse(arr):\n    pass\n\ndef range_min(table, l, r):\n    pass",
    hints: [
      "table[j][i] = min of the block starting at i with length 2^j. Build row j from row j−1: two half-blocks side by side.",
      "Query [l, r]: let k = floor(log2(r − l + 1)). Answer = min(table[k][l], table[k][r − 2^k + 1]).",
      "The two covering blocks may overlap — harmless for min, fatal for sum. That is exactly why prefix sums exist for sums.",
    ],
    solution: "def build_sparse(arr):\n    n = len(arr)\n    table = [arr[:]]\n    j = 1\n    while (1 << j) <= n:\n        prev = table[-1]\n        half = 1 << (j - 1)\n        table.append([min(prev[i], prev[i + half]) for i in range(n - (1 << j) + 1)])\n        j += 1\n    return table\n\ndef range_min(table, l, r):\n    k = (r - l + 1).bit_length() - 1\n    return min(table[k][l], table[k][r - (1 << k) + 1])",
    walkthrough: "Each table row doubles the block size, so there are log₂n rows: O(n log n) build. A query covers its range with at most two blocks of the largest fitting power of two — the overlap vanishes because min ignores duplicates. Remember: this trick ONLY works for idempotent folds; sum needs the Fenwick tree coming next.",
    testCode: "t = build_sparse([4, 1, 7, 2, 9])\nassert range_min(t, 1, 3) == 1\nassert range_min(t, 0, 4) == 1\nassert range_min(t, 2, 3) == 2\nassert range_min(t, 4, 4) == 9\nt2 = build_sparse([-5])\nassert range_min(t2, 0, 0) == -5\nt3 = build_sparse([3, 3, 3])\nassert range_min(t3, 0, 2) == 3\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Prefix Sums That Update", pattern: "Fenwick tree", skill: "index arithmetic i & -i", difficulty: "Hard",
    statement: "Start with an array of n zeros. Process operations: ('add', i, d) adds d to element i; ('sum', i) returns the prefix sum arr[0..i]. n and operations up to 2×10⁵. Return the list of 'sum' answers.",
    examples: [
      { input: "n = 5, ops = [('add',0,5), ('add',2,3), ('sum',2), ('add',1,2), ('sum',2)]", output: "[8, 10]", explain: "[5,0,3,0,0] → prefix 2 = 8; then [5,2,3,0,0] → prefix 2 = 10" },
    ],
    why: "The prefix array queries in O(1) but one add forces an O(n) rebuild — 2×10⁵ adds cost 4×10¹⁰. The Fenwick tree makes the trade explicit: give up O(1) queries, gain O(log n) updates. Every index i stores the block of length i & -i ending at i; both operations then walk O(log n) blocks by flipping that bit.",
    starterCode: "def fenwick_ops(n, ops):\n    pass",
    hints: [
      "i & -i isolates the lowest set bit of i — exactly the length of the block tree[i] covers.",
      "Update: tree[i] += d, then i += i & -i climbs to every block containing position i.",
      "Query: peel from the top — s += tree[i], then i -= i & -i, until i = 0. Mind the 1-indexing: shift +1 on the way in.",
    ],
    solution: "def fenwick_ops(n, ops):\n    tree = [0] * (n + 1)\n    out = []\n    def add(i, d):\n        i += 1\n        while i <= n:\n            tree[i] += d\n            i += i & -i\n    def pref(i):\n        i += 1\n        s = 0\n        while i > 0:\n            s += tree[i]\n            i -= i & -i\n        return s\n    for op in ops:\n        if op[0] == 'add':\n            add(op[1], op[2])\n        else:\n            out.append(pref(op[1]))\n    return out",
    walkthrough: "Why does i & -i work? Write i in binary: prefix(i) = block ending at i (size lowbit) + block ending at i − lowbit + … Each peel removes the lowest set bit — O(log n) blocks. Updates climb the same ladder upward: every block whose range contains i has i on its ladder. This is the bridge from static prefix sums to the segment tree next stage, which generalizes to any fold.",
    testCode: "assert fenwick_ops(5, [('add',0,5),('add',2,3),('sum',2),('add',1,2),('sum',2)]) == [8, 10]\nimport random\nrandom.seed(7)\narr = [0]*12\nops = []\nexpected = []\nfor _ in range(60):\n    if random.random() < 0.5:\n        i, d = random.randrange(12), random.randrange(-5, 6)\n        arr[i] += d\n        ops.append(('add', i, d))\n    else:\n        i = random.randrange(12)\n        ops.append(('sum', i))\n        expected.append(sum(arr[:i+1]))\nassert fenwick_ops(12, ops) == expected\nprint('All tests passed!')"
  },
]
