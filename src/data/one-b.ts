import type { OneProblem } from "./one"

export const PROBLEMS_ONE_B: OneProblem[] = [
  {
    id: 17, stage: 3, title: "Sort By Two Keys", pattern: "composite sort key", skill: "order as data", difficulty: "Easy",
    statement: "Given students as (name, grade) pairs, return the names sorted by grade ascending, breaking ties by name ascending.",
    examples: [
      { input: "students = [('ze', 2), ('al', 2), ('bo', 1)]", output: "['bo', 'al', 'ze']" },
      { input: "students = [('ada', 3), ('lin', 1)]", output: "['lin', 'ada']" },
    ],
    why: "Sorting is only useful when you can say precisely what 'before' means. Composite keys — tuple comparison, or a key function — encode an entire tie-breaking policy in one line, and stability (Python's guarantee) means later sorts refine earlier ones.",
    starterCode: "def order_students(students):\n    pass",
    hints: [
      "Python compares tuples element by element: (grade, name) sorts by grade, then name.",
      "sorted(students, key=...) — build the key tuple inside a lambda.",
      "Extract the name from each sorted pair."
    ],
    solution: "def order_students(students):\n    ranked = sorted(students, key=lambda p: (p[1], p[0]))\n    return [name for name, grade in ranked]",
    walkthrough: "The key (grade, name) is the whole algorithm — lexicographic tuple order IS 'by grade, ties by name'. For descending keys you negate numbers or reverse the sort; that vocabulary covers every custom comparator you will ever write in contests.",
    testCode: "assert order_students([('ze', 2), ('al', 2), ('bo', 1)]) == ['bo', 'al', 'ze']\nassert order_students([('ada', 3), ('lin', 1)]) == ['lin', 'ada']\nassert order_students([('x', 1)]) == ['x']\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 3, title: "Merge Intervals", pattern: "sort by start, fold", skill: "grow the last interval", difficulty: "Medium",
    statement: "Given a list of intervals [start, end], merge all overlapping intervals and return them sorted. Touching intervals (end == next start) merge.",
    examples: [
      { input: "intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]", output: "[[1, 6], [8, 10], [15, 18]]" },
      { input: "intervals = [[1, 4], [4, 5]]", output: "[[1, 5]]" },
    ],
    why: "Unsorted intervals have no structure; sorted by start, overlaps are always adjacent in the list. That is the sweep-line idea in miniature: sort once, then each new element only interacts with the current running state — never with all previous ones.",
    starterCode: "def merge_intervals(intervals):\n    pass",
    hints: [
      "Sort by start.",
      "Keep the current merged run; if the next interval starts at or before its end, extend the end with max().",
      "max matters: [1, 10], [2, 3] must keep end 10."
    ],
    solution: "def merge_intervals(intervals):\n    ivs = sorted(intervals)\n    out = []\n    for start, end in ivs:\n        if out and start <= out[-1][1]:\n            out[-1][1] = max(out[-1][1], end)\n        else:\n            out.append([start, end])\n    return out",
    walkthrough: "After sorting, each interval can only overlap the most recent merged block — proof: anything earlier ended before that block's start. One comparison per interval, O(n log n) total, all of it paid to the sort.",
    testCode: "assert merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]) == [[1, 6], [8, 10], [15, 18]]\nassert merge_intervals([[1, 4], [4, 5]]) == [[1, 5]]\nassert merge_intervals([[1, 10], [2, 3]]) == [[1, 10]]\nassert merge_intervals([[5, 6]]) == [[5, 6]]\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 3, title: "Meeting Rooms", pattern: "event sweep", skill: "starts and ends as events", difficulty: "Medium",
    statement: "Given meeting intervals, return the minimum number of rooms needed so no two meetings overlap in the same room.",
    examples: [
      { input: "intervals = [[0, 30], [5, 10], [15, 20]]", output: "2" },
      { input: "intervals = [[7, 10], [2, 4]]", output: "1" },
    ],
    why: "The maximum number of simultaneously open intervals is the answer, and sweeps measure exactly that: +1 at every start, -1 at every end, track the running peak. Half of all interval problems are this sweep wearing a costume.",
    starterCode: "def min_rooms(intervals):\n    pass",
    hints: [
      "Build one event list: (start, +1) and (end, -1) for every interval.",
      "Sort events; at equal times process ends before starts (an ending meeting frees its room).",
      "Walk the events keeping a running count; the max it ever reaches is the answer."
    ],
    solution: "def min_rooms(intervals):\n    events = []\n    for start, end in intervals:\n        events.append((start, 1))\n        events.append((end, -1))\n    events.sort()\n    rooms = 0\n    peak = 0\n    for _, delta in events:\n        rooms += delta\n        if rooms > peak:\n            peak = rooms\n    return peak",
    walkthrough: "Sorting (time, delta) pairs puts -1 before +1 at the same timestamp because -1 < 1 — the end frees the room just as the start needs it. The running count is 'rooms in use right now'; its peak over time is the answer by definition.",
    testCode: "assert min_rooms([[0, 30], [5, 10], [15, 20]]) == 2\nassert min_rooms([[7, 10], [2, 4]]) == 1\nassert min_rooms([[0, 10], [5, 20], [11, 30]]) == 2\nassert min_rooms([[1, 5], [2, 6], [3, 7]]) == 3\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 3, title: "Erase Overlap", pattern: "greedy by earliest end", skill: "keep what leaves soonest", difficulty: "Medium",
    statement: "Return the minimum number of intervals to remove so the rest are pairwise non-overlapping (touching endpoints are fine).",
    examples: [
      { input: "intervals = [[1, 2], [2, 3], [3, 4], [1, 3]]", output: "1", explain: "remove [1, 3]" },
      { input: "intervals = [[1, 2], [1, 2], [1, 2]]", output: "2" },
    ],
    why: "Minimizing removals equals maximizing what you keep — and the greedy rule is the classic activity selection proof: among choices, keeping the interval that ends earliest leaves the most room. Greedy correctness is exactly this kind of exchange argument; learn to write the sentence.",
    starterCode: "def erase_overlaps(intervals):\n    pass",
    hints: [
      "Sort by end.",
      "Keep an interval if it starts at or after the end of the last kept one.",
      "Count the intervals you had to skip."
    ],
    solution: "def erase_overlaps(intervals):\n    ivs = sorted(intervals, key=lambda iv: iv[1])\n    kept_end = None\n    removed = 0\n    for start, end in ivs:\n        if kept_end is not None and start < kept_end:\n            removed += 1\n        else:\n            kept_end = end\n    return removed",
    walkthrough: "Greedy by earliest end is safe by exchange: any optimal solution can swap its first kept interval for the globally earliest-ending one without losing count. Sorting by start (instead of end) breaks — a late-ending early-starter blocks the rest, which is why the sort key is the whole proof.",
    testCode: "assert erase_overlaps([[1, 2], [2, 3], [3, 4], [1, 3]]) == 1\nassert erase_overlaps([[1, 2], [1, 2], [1, 2]]) == 2\nassert erase_overlaps([[1, 2], [2, 3]]) == 0\nassert erase_overlaps([[1, 100], [2, 3], [4, 5]]) == 1\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 3, title: "Count Inversions", pattern: "merge sort counting", skill: "count during the merge", difficulty: "Hard",
    statement: "An inversion is a pair i < j with nums[i] > nums[j]. Count inversions in a list — in O(n log n), not O(n²).",
    examples: [
      { input: "nums = [2, 4, 1, 3, 5]", output: "3", explain: "(2,1), (4,1), (4,3)" },
      { input: "nums = [5, 4, 3, 2, 1]", output: "10" },
    ],
    why: "Divide and conquer pays rent exactly when the merge step can answer a global question from two sorted halves. When the left half's element jumps ahead of the right's, every remaining left element forms an inversion with it — a whole block counted in one comparison. This 'batch counting at the merge' idea recurs in every advanced D&C algorithm.",
    starterCode: "def count_inversions(nums):\n    pass",
    hints: [
      "Modify merge sort: sort and count in the same recursion.",
      "When taking from the right half during the merge, add (elements left in the left half) to the count.",
      "Sort a copy so the recursion does not fight itself over indices."
    ],
    solution: "def count_inversions(nums):\n    def sort_count(arr):\n        if len(arr) <= 1:\n            return arr, 0\n        mid = len(arr) // 2\n        left, cl = sort_count(arr[:mid])\n        right, cr = sort_count(arr[mid:])\n        merged = []\n        count = cl + cr\n        i = j = 0\n        while i < len(left) and j < len(right):\n            if left[i] <= right[j]:\n                merged.append(left[i])\n                i += 1\n            else:\n                count += len(left) - i\n                merged.append(right[j])\n                j += 1\n        merged.extend(left[i:])\n        merged.extend(right[j:])\n        return merged, count\n    return sort_count(nums)[1]",
    walkthrough: "Inversions split into left-internal + right-internal + crossing. The merge counts all crossing inversions at once: picking right[j] while left still holds len(left) - i elements proves each of them inverts with right[j]. Same O(n log n) as plain merge sort — the counting was free.",
    testCode: "assert count_inversions([2, 4, 1, 3, 5]) == 3\nassert count_inversions([5, 4, 3, 2, 1]) == 10\nassert count_inversions([1, 2, 3]) == 0\nassert count_inversions([1, 20, 6, 4, 5]) == 5\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 3, title: "Car Fleet", pattern: "stack of arrival times", skill: "time, not position", difficulty: "Hard",
    statement: "Cars drive to target along one lane. Car i starts at position[i] with speed[i]. A faster car behind a slower one catches it and they become one fleet moving at the slower speed. Return the number of fleets that reach the target.",
    examples: [
      { input: "target = 12, pos = [10, 8, 0, 5, 3], speed = [2, 4, 1, 1, 3]", output: "3" },
      { input: "target = 100, pos = [0, 2, 4], speed = [4, 2, 1]", output: "1" },
    ],
    why: "The trap is simulating motion — the insight is that only arrival time matters, and only the car directly ahead constrains you. Processing positions from the front, a stack of fleet arrival times does the whole job: this is 'sort by geometry, reason with a stack' — two patterns from this stage fusing into one.",
    starterCode: "def car_fleet(target, pos, speed):\n    pass",
    hints: [
      "Compute each car's arrival time: (target - position) / speed.",
      "Walk cars from closest to target backward.",
      "A car catches the fleet ahead iff its arrival time is <= the fleet ahead's — keep a stack of fleet times; pop-free count is the answer."
    ],
    solution: "def car_fleet(target, pos, speed):\n    cars = sorted(zip(pos, speed), reverse=True)\n    fleets = 0\n    lead_time = 0.0\n    for p, s in cars:\n        t = (target - p) / s\n        if t > lead_time:\n            fleets += 1\n            lead_time = t\n    return fleets",
    walkthrough: "Sorted by position descending, each car either arrives strictly later than everything ahead (new fleet) or catches up (absorbed — its slower fleet time governs). No stack needed once you see only the latest lead time matters; the stack version is this with an explicit list. Watch the strictly-greater: equal arrival times merge.",
    testCode: "assert car_fleet(12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]) == 3\nassert car_fleet(10, [3], [3]) == 1\nassert car_fleet(100, [0, 2, 4], [4, 2, 1]) == 1\nassert car_fleet(10, [0, 4, 2], [2, 2, 1]) == 2\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 4, title: "Exact Search", pattern: "binary search, classic", skill: "lo, hi, mid discipline", difficulty: "Easy",
    statement: "Return the index of target in a sorted list, or -1 if absent. Write the loop yourself — no index() or bisect.",
    examples: [
      { input: "nums = [1, 3, 5, 7, 9], target = 7", output: "3" },
      { input: "nums = [1, 3, 5], target = 4", output: "-1" },
    ],
    why: "Binary search is the most-deadly-when-buggy algorithm in existence — every variant differs only in its invariant. Locking the plain form first (search in [lo, hi], shrink by half, exit when empty) makes every later variant a one-line mutation.",
    starterCode: "def binary_search(nums, target):\n    pass",
    hints: [
      "lo = 0, hi = len(nums) - 1; loop while lo <= hi.",
      "mid = (lo + hi) // 2; compare nums[mid] to target.",
      "Move lo = mid + 1 or hi = mid - 1 — never mid itself, or you can loop forever."
    ],
    solution: "def binary_search(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return -1",
    walkthrough: "The invariant: if target exists, it lives in nums[lo..hi]. Each comparison halves that range, so ~log₂(n) steps. The two classic bugs — hi = mid (stall) and off-by-one exits — are both avoided by the +1/-1 rule; memorize the shape, not a particular problem.",
    testCode: "assert binary_search([1, 3, 5, 7, 9], 7) == 3\nassert binary_search([1, 3, 5], 4) == -1\nassert binary_search([], 1) == -1\nassert binary_search([2], 2) == 0\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 4, title: "First True", pattern: "boundary binary search", skill: "search the predicate edge", difficulty: "Easy",
    statement: "You are given a list of booleans, all False followed by all True. Return the index of the first True, or -1 if there is none. One pass of binary search.",
    examples: [
      { input: "flags = [False, False, True, True]", output: "2" },
      { input: "flags = [False, False]", output: "-1" },
    ],
    why: "This is the real binary search — the answer is not a value but a boundary. 'Find first index where predicate turns true' subsumes lower_bound, insertion points, first bad version, and half of all binary-search problems; the value-equality version of problem 23 is the special case.",
    starterCode: "def first_true(flags):\n    pass",
    hints: [
      "lo = 0, hi = len(flags) - 1; keep track of the best True index seen so far, or -1.",
      "When flags[mid] is True, record mid and search left (hi = mid - 1) — an earlier True may exist.",
      "When False, search right (lo = mid + 1)."
    ],
    solution: "def first_true(flags):\n    lo, hi = 0, len(flags) - 1\n    ans = -1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if flags[mid]:\n            ans = mid\n            hi = mid - 1\n        else:\n            lo = mid + 1\n    return ans",
    walkthrough: "On a hit you do not stop — you record and keep pushing left, because 'first' means an earlier edge may exist. The recorded answer only moves leftward; when the range empties it is exact. This asymmetric record-and-continue is the fingerprint of all boundary searches.",
    testCode: "assert first_true([False, False, True, True]) == 2\nassert first_true([False, False]) == -1\nassert first_true([True]) == 0\nassert first_true([False, True]) == 1\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 4, title: "Rotated Minimum", pattern: "binary search, pivot shape", skill: "which half is sorted", difficulty: "Medium",
    statement: "A sorted list of distinct values was rotated some number of times. Return its minimum element in O(log n).",
    examples: [
      { input: "nums = [3, 4, 5, 1, 2]", output: "1" },
      { input: "nums = [4, 5, 6, 7, 0, 1, 2]", output: "0" },
    ],
    why: "Rotation breaks total order but preserves a local fact: comparing mid to the right end tells you which half contains the pivot. Finding an invariant inside broken order — instead of restoring order first — is the skill this problem teaches.",
    starterCode: "def find_min(nums):\n    pass",
    hints: [
      "lo = 0, hi = last; if nums[mid] > nums[hi], the minimum is strictly right of mid.",
      "Otherwise the minimum is at mid or to its left — hi = mid (do not skip mid itself).",
      "When the range shrinks to one element, that is the answer."
    ],
    solution: "def find_min(nums):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] > nums[hi]:\n            lo = mid + 1\n        else:\n            hi = mid\n    return nums[lo]",
    walkthrough: "nums[mid] > nums[hi] means the drop (pivot) is in (mid, hi], so lo = mid + 1 is safe. Otherwise the right side is sorted, so the pivot is at mid or left of it — hi = mid, keeping mid because it might be the minimum. Note the exit is lo == hi with hi = mid retention: the other classic loop shape, mastered here because it must keep mid.",
    testCode: "assert find_min([3, 4, 5, 1, 2]) == 1\nassert find_min([4, 5, 6, 7, 0, 1, 2]) == 0\nassert find_min([11, 13, 15, 17]) == 11\nassert find_min([2, 1]) == 1\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 4, title: "Eating Speed", pattern: "binary search on the answer", skill: "monotone feasibility", difficulty: "Medium",
    statement: "Koko eats banana piles; at speed k she spends ceil(pile / k) hours per pile. Return the minimum integer speed that finishes all piles within h hours.",
    examples: [
      { input: "piles = [3, 6, 7, 11], h = 8", output: "4" },
      { input: "piles = [30, 11, 23, 4, 20], h = 6", output: "23" },
    ],
    why: "Nothing here is sorted — but the answer space is. Faster is never worse, so 'feasible(speed)' is a monotone predicate over speeds 1..max(piles), and problem 24's first-true finds the boundary. Binary search on the answer, not on the data: the single most transferable search idea in competitive programming.",
    starterCode: "def min_eating_speed(piles, h):\n    pass",
    hints: [
      "Feasibility at speed k: sum of ceil(p / k) over piles <= h.",
      "Search speeds in [1, max(piles)] — the boundary form with answer recording.",
      "ceil(p / k) in integers is (p + k - 1) // k."
    ],
    solution: "def min_eating_speed(piles, h):\n    def hours(k):\n        return sum((p + k - 1) // k for p in piles)\n    lo, hi = 1, max(piles)\n    ans = hi\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if hours(mid) <= h:\n            ans = mid\n            hi = mid - 1\n        else:\n            lo = mid + 1\n    return ans",
    walkthrough: "The predicate hours(k) <= h is monotone: true for all speeds above the threshold, false below — exactly a False...False True...True array. Each probe costs O(n) to evaluate, total O(n log(max)). Recognizing 'the answer itself is searchable' doubles the reach of everything in this stage.",
    testCode: "assert min_eating_speed([3, 6, 7, 11], 8) == 4\nassert min_eating_speed([30, 11, 23, 4, 20], 5) == 30\nassert min_eating_speed([30, 11, 23, 4, 20], 6) == 23\nassert min_eating_speed([312884470], 312884469) == 2\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 4, title: "Real Precision", pattern: "binary search on reals", skill: "fixed-iteration bisection", difficulty: "Medium",
    statement: "Return the square root of x to within 0.001, for x >= 0 — using bisection on the real line, no sqrt().",
    examples: [
      { input: "x = 2", output: "1.414213...", explain: "answer within 0.001 of the true root" },
      { input: "x = 0.25", output: "0.5" },
    ],
    why: "Continuous binary search: no mid ± 1 bookkeeping, just halve the interval a fixed number of times. Care for x < 1 (the root is bigger than x!) is the classic bug — the search bracket must be chosen by thought, not habit.",
    starterCode: "def isqrt_real(x):\n    pass",
    hints: [
      "Bracket the root: lo = 0, hi = max(1.0, x).",
      "Each step: mid = (lo + hi) / 2; if mid * mid < x, lo = mid, else hi = mid.",
      "Run a fixed 100 iterations — the interval shrinks by 2¹⁰⁰, far past any tolerance."
    ],
    solution: "def isqrt_real(x):\n    lo, hi = 0.0, max(1.0, x)\n    for _ in range(100):\n        mid = (lo + hi) / 2\n        if mid * mid < x:\n            lo = mid\n        else:\n            hi = mid\n    return (lo + hi) / 2",
    walkthrough: "For x >= 1 the root lies in [0, x]; for 0 <= x < 1 it lies in [x's root..., 1] — hence hi = max(1, x) covers both. Fixed iteration count sidesteps float-epsilon loop conditions entirely: 100 halvings leave an interval of width ~1e-30, and either endpoint is your answer.",
    testCode: "assert abs(isqrt_real(2) - 1.41421356) < 0.001\nassert abs(isqrt_real(9) - 3.0) < 0.001\nassert abs(isqrt_real(0.25) - 0.5) < 0.001\nassert abs(isqrt_real(0) - 0.0) < 0.001\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 4, title: "Split Array Largest Sum", pattern: "binary search + greedy check", skill: "minimize the maximum", difficulty: "Hard",
    statement: "Split nums (in order) into m consecutive non-empty parts. Minimize the largest part-sum; return that minimum possible maximum.",
    examples: [
      { input: "nums = [7, 2, 5, 10, 8], m = 2", output: "18", explain: "[7, 2, 5, 8]-ish no — [7,2,5] and [10, 8] → 18" },
      { input: "nums = [1, 4, 4], m = 3", output: "4" },
    ],
    why: "The flagship 'minimize the maximum' pattern: a candidate cap C is feasible iff a greedy left-to-right fill uses at most m parts — a monotone predicate, so the answer is a first-true over caps. Two patterns stack: greedy feasibility (this stage's problem 26 idea) on top of boundary search.",
    starterCode: "def split_array(nums, m):\n    pass",
    hints: [
      "Feasibility of cap C: sweep left to right, start a new part when adding would exceed C; count parts.",
      "Search C in [max(nums), sum(nums)] — a cap below the largest element is impossible.",
      "Record the smallest feasible C and keep pushing hi down, first-true style."
    ],
    solution: "def split_array(nums, m):\n    def parts_fit(cap):\n        count = 1\n        running = 0\n        for x in nums:\n            if running + x > cap:\n                count += 1\n                running = x\n            else:\n                running += x\n        return count <= m\n    lo, hi = max(nums), sum(nums)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if parts_fit(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo",
    walkthrough: "Greedy filling is optimal for feasibility: putting as much as possible in each part never increases the part count. parts_fit is monotone in cap (roomier caps never need more parts), so binary search over [max, sum] converges — O(n log(sum)). The answer space was invisible until you asked 'what would a feasible cap look like?'",
    testCode: "assert split_array([7, 2, 5, 10, 8], 2) == 18\nassert split_array([1, 2, 3, 4, 5], 2) == 9\nassert split_array([1, 4, 4], 3) == 4\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 5, title: "Range Sums", pattern: "prefix sum array", skill: "precompute once", difficulty: "Easy",
    statement: "Given nums and a list of inclusive range queries (l, r), return each query's sum. Build the prefix array once; each query must be O(1).",
    examples: [
      { input: "nums = [1, 2, 3, 4, 5], queries = [(0, 2), (1, 3), (2, 2)]", output: "[6, 9, 3]" },
      { input: "nums = [5], queries = [(0, 0)]", output: "[5]" },
    ],
    why: "The founding trade of algorithm design: pay O(n) once to make every future question free. Prefix sums are the simplest instance of preprocessing-as-algorithm — the idea that scales up to 2D sums, BITs, and sparse tables later in this ladder.",
    starterCode: "def range_sums(nums, queries):\n    pass",
    hints: [
      "prefix[i] = sum of nums[0..i-1], with prefix[0] = 0 — the padded form kills off-by-ones.",
      "sum(l..r) = prefix[r + 1] - prefix[l].",
      "Check: for l = 0 the formula must give the whole prefix."
    ],
    solution: "def range_sums(nums, queries):\n    prefix = [0]\n    for x in nums:\n        prefix.append(prefix[-1] + x)\n    return [prefix[r + 1] - prefix[l] for l, r in queries]",
    walkthrough: "The zero-padded prefix means 'sum of first i elements' needs no special case, and every range is a subtraction of two stored sums. The pattern generalizes to min/max/counts/xors — anything associative — not just addition.",
    testCode: "assert range_sums([1, 2, 3, 4, 5], [(0, 2), (1, 3), (2, 2)]) == [6, 9, 3]\nassert range_sums([5], [(0, 0)]) == [5]\nassert range_sums([1, 2], [(0, 1), (1, 1), (0, 0)]) == [3, 2, 1]\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 5, title: "Subarray Sum K", pattern: "prefix + hash map", skill: "prefixes that differ by k", difficulty: "Medium",
    statement: "Count the subarrays whose elements sum exactly to k. Negative numbers are allowed, so sliding windows are dead — prefixes and a map are alive.",
    examples: [
      { input: "nums = [1, 1, 1], k = 2", output: "2" },
      { input: "nums = [1, 2, 3], k = 3", output: "2", explain: "[1, 2] and [3]" },
    ],
    why: "Subarray sum(l..r) = prefix[r] - prefix[l-1]: so counting sum-k subarrays is counting prefix pairs that differ by k — a two-sum problem in disguise (stage 2). The map remembers how many times each prefix value occurred. 'Translate the new problem into one you already own' is the whole move.",
    starterCode: "def subarray_sum(nums, k):\n    pass",
    hints: [
      "Walk once, maintaining the running prefix p.",
      "Before recording p, add how many earlier prefixes equal p - k.",
      "Seed the map with {0: 1} — the empty prefix — or you will miss subarrays starting at index 0."
    ],
    solution: "def subarray_sum(nums, k):\n    seen = {0: 1}\n    p = 0\n    count = 0\n    for x in nums:\n        p += x\n        count += seen.get(p - k, 0)\n        seen[p] = seen.get(p, 0) + 1\n    return count",
    walkthrough: "At each position, seen holds the multiplicity of every prefix before it; p - k lookups count all valid starts at once. The {0: 1} seed is the empty prefix — forgetting it is the classic bug, and noticing why it is needed is the lesson. O(n) where the honest alternative (all subarrays) is O(n²).",
    testCode: "assert subarray_sum([1, 1, 1], 2) == 2\nassert subarray_sum([1, 2, 3], 3) == 2\nassert subarray_sum([3, 4, 7, 2, -3, 1, 4, 2], 7) == 4\nassert subarray_sum([1], 0) == 0\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 5, title: "2D Block Sums", pattern: "2D prefix sums", skill: "inclusion-exclusion", difficulty: "Medium",
    statement: "Given a matrix, build it so any axis-aligned block sum is one lookup: implement block_sum(m, r1, c1, r2, c2) with a 2D prefix array (padded with an extra row and column of zeros).",
    examples: [
      { input: "m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]], region (1, 1, 2, 2)", output: "28", explain: "5 + 6 + 8 + 9" },
      { input: "same matrix, region (0, 0, 0, 0)", output: "1" },
    ],
    why: "Inclusion–exclusion in its most visual form: a block is two big rectangles minus two strips plus the double-subtracted corner. Sums over any dimension generalize this exact algebra, and it returns as a counting tool in combinatorics later in the ladder.",
    starterCode: "def block_sum(mat, r1, c1, r2, c2):\n    pass",
    hints: [
      "Build P with dimensions (rows+1) x (cols+1), P[0][*] and P[*][0] all zero.",
      "P[i][j] = mat[i-1][j-1] + P[i-1][j] + P[i][j-1] - P[i-1][j-1].",
      "Answer = P[r2+1][c2+1] - P[r1][c2+1] - P[r2+1][c1] + P[r1][c1]."
    ],
    solution: "def block_sum(mat, r1, c1, r2, c2):\n    rows, cols = len(mat), len(mat[0])\n    P = [[0] * (cols + 1) for _ in range(rows + 1)]\n    for i in range(1, rows + 1):\n        for j in range(1, cols + 1):\n            P[i][j] = mat[i - 1][j - 1] + P[i - 1][j] + P[i][j - 1] - P[i - 1][j - 1]\n    return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]",
    walkthrough: "Build and query are the same inclusion-exclusion formula pointed in opposite directions: building adds the cell back in, querying subtracts the strips out. The padded zeros make every formula boundary-safe — one convention, zero special cases.",
    testCode: "assert block_sum([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 1, 1, 2, 2) == 28\nassert block_sum([[1, 2, 3], [4, 5, 6], [7, 8, 9]], 0, 0, 0, 0) == 1\nassert block_sum([[1, 2], [3, 4]], 0, 0, 1, 1) == 10\nassert block_sum([[5]], 0, 0, 0, 0) == 5\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 5, title: "Booking Spikes", pattern: "difference array", skill: "defer the update", difficulty: "Medium",
    statement: "Given booking intervals [start, end), return the maximum number of bookings active at the same moment.",
    examples: [
      { input: "bookings = [[0, 30], [5, 10], [15, 20]]", output: "2" },
      { input: "bookings = [[1, 5], [2, 6], [3, 7]]", output: "3" },
    ],
    why: "The difference array is the lazy prefix sum: mark +1 at starts and -1 at ends, then one sweep reconstructs every intermediate value. It is the offline twin of the sweep in problem 19 — same answer, different trade — and it becomes a formal tool (range updates in O(1)) the moment updates and queries interleave.",
    starterCode: "def max_concurrent(bookings):\n    pass",
    hints: [
      "Use a dict: delta[start] += 1, delta[end] -= 1 (end is exclusive, so no tie-breaking needed).",
      "Sort the keys and sweep, keeping a running count.",
      "The running count's peak is the answer."
    ],
    solution: "def max_concurrent(bookings):\n    delta = {}\n    for start, end in bookings:\n        delta[start] = delta.get(start, 0) + 1\n        delta[end] = delta.get(end, 0) - 1\n    count = 0\n    peak = 0\n    for t in sorted(delta):\n        count += delta[t]\n        if count > peak:\n            peak = count\n    return peak",
    walkthrough: "Instead of touching a whole range, you touch two endpoints — O(1) per update — and pay one sort at the end. [start, end) semantics means the -1 lands exactly when the room frees; no event-tie subtlety. Contrast with problem 19's sweep: same math, this form wins when there are many updates and few questions.",
    testCode: "assert max_concurrent([[0, 30], [5, 10], [15, 20]]) == 2\nassert max_concurrent([[7, 10], [2, 4]]) == 1\nassert max_concurrent([[1, 5], [2, 6], [3, 7]]) == 3\nassert max_concurrent([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 5, title: "Product Except Self", pattern: "prefix and suffix products", skill: "two sweeps, no division", difficulty: "Hard",
    statement: "Return an array where out[i] is the product of every element except nums[i]. Division is banned (zeros exist). O(n), no extra arrays beyond the output.",
    examples: [
      { input: "nums = [1, 2, 3, 4]", output: "[24, 12, 8, 6]" },
      { input: "nums = [-1, 1, 0, -3, 3]", output: "[0, 0, 9, 0, 0]" },
    ],
    why: "Division would be the naive shortcut, and zeros destroy it. The real lesson: out[i] is the product of a prefix times a suffix — stage 5's two directions meeting. Two sweeps through one output array (store prefix products forward, multiply suffix products backward) achieves 'no extra space' by reusing the answer array itself.",
    starterCode: "def product_except_self(nums):\n    pass",
    hints: [
      "First sweep left to right: out[i] = product of everything left of i.",
      "Second sweep right to left carrying a running suffix product S: out[i] *= S.",
      "The running suffix needs no array — it is one scalar updated as you go."
    ],
    solution: "def product_except_self(nums):\n    n = len(nums)\n    out = [1] * n\n    for i in range(1, n):\n        out[i] = out[i - 1] * nums[i - 1]\n    suffix = 1\n    for i in range(n - 1, -1, -1):\n        out[i] *= suffix\n        suffix *= nums[i]\n    return out",
    walkthrough: "After sweep one, out[i] holds the left product; multiplying by the live suffix scalar completes it. Each sweep is independent of zeros and negatives — no cases. The 'reuse the output as scratch' trick is a standard space optimization worth recognizing on sight.",
    testCode: "assert product_except_self([1, 2, 3, 4]) == [24, 12, 8, 6]\nassert product_except_self([-1, 1, 0, -3, 3]) == [0, 0, 9, 0, 0]\nassert product_except_self([2, 3]) == [3, 2]\nassert product_except_self([1, 1]) == [1, 1]\nprint('All tests passed!')"
  },
]
