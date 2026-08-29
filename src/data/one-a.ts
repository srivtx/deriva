import type { OneProblem } from "./one"

export const PROBLEMS_ONE_A: OneProblem[] = [
  {
    id: 1, stage: 0, title: "Count The Steps", pattern: "counting loop iterations", skill: "see linear cost", difficulty: "Easy",
    statement: "A loop starts at i = 0 and repeats while i < n, adding 2 to i each time. Count how many times the loop body runs.",
    examples: [
      { input: "n = 10", output: "5", explain: "i takes 0, 2, 4, 6, 8 — five body runs" },
      { input: "n = 7", output: "4", explain: "i takes 0, 2, 4, 6" },
    ],
    why: "Big-O starts as counting. Step size 2 does not change the class of cost — iterations are still proportional to n. Seeing that ceil(n/2) is 'still linear' is the first act of complexity thinking.",
    starterCode: "def steps(n):\n    pass",
    hints: [
      "Simulate honestly: keep i and a counter.",
      "The loop runs while i < n, so the last body run may overshoot with i landing below n but next i at or above.",
      "One counter increments in lockstep with i += 2."
    ],
    solution: "def steps(n):\n    i = 0\n    count = 0\n    while i < n:\n        i += 2\n        count += 1\n    return count",
    walkthrough: "Track (i, count) exactly as the machine does. The count lands on ceil(n/2) — the constant 1/2 is exactly why Big-O throws constants away: it stays O(n) even though the loop is twice as fast.",
    testCode: "assert steps(10) == 5\nassert steps(7) == 4\nassert steps(1) == 1\nassert steps(0) == 0\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Pair Count", pattern: "nested loops, closed form", skill: "see quadratic cost", difficulty: "Easy",
    statement: "Count the pairs (i, j) with i < j among n items. Do it with a nested loop first, then realize the closed form — your function should return the count for n items.",
    examples: [
      { input: "n = 4", output: "6", explain: "12 13 14 23 24 34" },
      { input: "n = 10", output: "45" },
    ],
    why: "Nested loops are the shape of O(n²). Counting their iterations once — n(n-1)/2 — lets you predict cost before running anything, which is how you decide an approach is dead at n = 10⁵.",
    starterCode: "def count_pairs(n):\n    pass",
    hints: [
      "The inner loop for i = 0 runs n-1 times, for i = 1 runs n-2 times, ...",
      "1 + 2 + ... + (n-1) is a famous sum — Gauss counted it as a schoolboy.",
      "Return n * (n - 1) // 2 and check it against the loop for small n."
    ],
    solution: "def count_pairs(n):\n    total = 0\n    for i in range(n):\n        for j in range(i + 1, n):\n            total += 1\n    return total",
    walkthrough: "The honest nested loop gives total = n(n-1)/2 — but the point is that you never need to run it again. For n = 10⁵ that is five billion pair visits: quadratic cost dies by arithmetic, not by clever code.",
    testCode: "assert count_pairs(4) == 6\nassert count_pairs(1) == 0\nassert count_pairs(10) == 45\nassert count_pairs(100) == 4950\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Halving Count", pattern: "repeated halving", skill: "see logarithmic cost", difficulty: "Easy",
    statement: "Starting from n, repeatedly replace n with n // 2 until n becomes 0. Count how many halvings happen — this is the cost of binary search's shape.",
    examples: [
      { input: "n = 8", output: "4", explain: "8, 4, 2, 1, 0 — four halvings" },
      { input: "n = 1", output: "1", explain: "1, 0 — one halving" },
    ],
    why: "Logarithmic cost is halving until exhausted. Binary search, fast exponentiation, and every divide-and-conquer inherit this shape: doubling the input adds exactly one more step.",
    starterCode: "def halves(n):\n    pass",
    hints: [
      "Keep halving with integer division while n > 0.",
      "Count each division.",
      "The answer is the number of bits in n's binary form (for n >= 1)."
    ],
    solution: "def halves(n):\n    count = 0\n    while n > 0:\n        n //= 2\n        count += 1\n    return count",
    walkthrough: "Each halving removes one binary digit, so the count is n's bit length. From 8 to 10⁹ is only ~30 steps — that collapse from a million to thirty is the entire power of logarithmic algorithms.",
    testCode: "assert halves(8) == 4\nassert halves(1) == 1\nassert halves(100) == 7\nassert halves(0) == 0\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Exists Zero Pair", pattern: "brute force vs hash set", skill: "trade memory for speed", difficulty: "Medium",
    statement: "Given a list of integers, return True if some two distinct positions hold values summing to 0. Write it the nested-loop way first in your head — then make it linear with a set.",
    examples: [
      { input: "nums = [3, -3]", output: "True" },
      { input: "nums = [1, 2, 3]", output: "False" },
      { input: "nums = [0]", output: "False", explain: "a pair needs two positions" },
    ],
    why: "The quadratic brute force checks every pair; the linear version remembers what it has seen. Remembering is the fundamental move that converts O(n²) to O(n) — hash maps and sets are the whole trick.",
    starterCode: "def has_zero_sum_pair(nums):\n    pass",
    hints: [
      "Walk left to right; for the current value x, the partner you need is -x.",
      "If -x was seen among earlier positions, answer True.",
      "Add x to the seen set after checking — never before, or x could pair with itself."
    ],
    solution: "def has_zero_sum_pair(nums):\n    seen = set()\n    for x in nums:\n        if -x in seen:\n            return True\n        seen.add(x)\n    return False",
    walkthrough: "At each step the set holds exactly the values to the left. The question 'is my partner among them?' is one hash lookup instead of a scan of all previous positions. Same answer, billion times less work at n = 10⁶.",
    testCode: "assert has_zero_sum_pair([3, -3]) == True\nassert has_zero_sum_pair([1, 2, 3]) == False\nassert has_zero_sum_pair([0]) == False\nassert has_zero_sum_pair([5, -5, 7]) == True\nassert has_zero_sum_pair([]) == False\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Amortized Doubling", pattern: "dynamic array growth", skill: "understand amortized O(1)", difficulty: "Hard",
    statement: "A dynamic array starts with capacity 1. Each append when full first copies all existing elements into a doubled array, then inserts. For m appends, return the total number of elements copied.",
    examples: [
      { input: "m = 2", output: "1", explain: "second append copies the 1 old element" },
      { input: "m = 5", output: "7", explain: "copies of 1, then 2, then 4" },
    ],
    why: "This is why list.append is 'O(1)' even though sometimes it copies everything. Individual operations vary, but the total over m operations is under 2m — the definition of amortized O(1). Deriving the schedule yourself is the only way to believe it.",
    starterCode: "def copies(m):\n    pass",
    hints: [
      "Track (capacity, size, total_copies) across appends.",
      "A copy happens exactly when size == capacity before the insert.",
      "The copy moves all size elements, then capacity doubles."
    ],
    solution: "def copies(m):\n    cap = 1\n    size = 0\n    total = 0\n    for _ in range(m):\n        if size == cap:\n            total += size\n            cap *= 2\n        size += 1\n    return total",
    walkthrough: "Full-capacity appends happen at sizes 1, 2, 4, 8, ... — powers of two below m — so total copies are 1 + 2 + ... + 2^k < 2m. The expensive appends become exponentially rare, which is the entire amortized argument.",
    testCode: "assert copies(1) == 0\nassert copies(2) == 1\nassert copies(3) == 3\nassert copies(4) == 3\nassert copies(9) == 15\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 1, title: "Reverse In Place", pattern: "converging two pointers", skill: "swap from both ends", difficulty: "Easy",
    statement: "Reverse a list in place using two pointers and return it. Constant extra memory — no slicing, no reversed().",
    examples: [
      { input: "nums = [1, 2, 3, 4]", output: "[4, 3, 2, 1]" },
      { input: "nums = [7]", output: "[7]" },
    ],
    why: "Two converging pointers are the simplest symmetric transform on arrays. Every later squeeze — pair sums, palindromes, container walls — is this pattern wearing a different condition.",
    starterCode: "def reverse_list(nums):\n    pass",
    hints: [
      "Put lo at index 0 and hi at the last index.",
      "Swap nums[lo] and nums[hi], then move lo right and hi left.",
      "Stop when lo >= hi — the middle needs no swap."
    ],
    solution: "def reverse_list(nums):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        nums[lo], nums[hi] = nums[hi], nums[lo]\n        lo += 1\n        hi -= 1\n    return nums",
    walkthrough: "The pointers meet in the middle after n/2 swaps. The invariant is clean: everything left of lo and right of hi is already in final position.",
    testCode: "assert reverse_list([1, 2, 3, 4]) == [4, 3, 2, 1]\nassert reverse_list([7]) == [7]\nassert reverse_list([]) == []\nassert reverse_list([1, 2]) == [2, 1]\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 1, title: "Sorted Pair Sum", pattern: "two-pointer squeeze", skill: "exploit sorted order", difficulty: "Easy",
    statement: "Given a sorted list and a target, return True if two distinct positions sum to the target. One pass, two pointers, no extra memory.",
    examples: [
      { input: "nums = [1, 3, 4, 6, 8], target = 10", output: "True", explain: "4 + 6" },
      { input: "nums = [1, 3, 4, 6, 8], target = 13", output: "False" },
    ],
    why: "Sorted order lets each comparison eliminate a whole row of possibilities: too small means the left end is unusable with anything larger, too big means the right end is unusable. That elimination is what a hash set cannot give you in O(1) memory.",
    starterCode: "def pair_sum(nums, target):\n    pass",
    hints: [
      "Start lo = 0, hi = last index.",
      "If the sum is too small, only moving lo up can help; if too big, only moving hi down.",
      "Stop when the pointers meet — every useful pair has been considered."
    ],
    solution: "def pair_sum(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        s = nums[lo] + nums[hi]\n        if s == target:\n            return True\n        if s < target:\n            lo += 1\n        else:\n            hi -= 1\n    return False",
    walkthrough: "Each step discards one element permanently: nums[lo] (if the sum is low, it pairs with nothing remaining) or nums[hi] (if high). n steps of total elimination — linear, no set needed, because order told you which side was safe to throw away.",
    testCode: "assert pair_sum([1, 3, 4, 6, 8], 10) == True\nassert pair_sum([1, 3, 4, 6, 8], 13) == False\nassert pair_sum([2, 4], 8) == False\nassert pair_sum([5, 5], 10) == True\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Dedup Sorted", pattern: "read/write pointers", skill: "overwrite in place", difficulty: "Medium",
    statement: "Given a sorted list, remove duplicates in place so each value appears once. Return the count k of unique values; the first k positions hold the answer.",
    examples: [
      { input: "nums = [1, 1, 2]", output: "2", explain: "nums becomes [1, 2, ...]" },
      { input: "nums = [0, 0, 1, 1, 1, 2, 2, 3]", output: "4" },
    ],
    why: "The read/write pair is how in-place array surgery works everywhere: one pointer reads every element, the other marks where verified output goes. Sorting first is what makes 'same as previous' the only check you need.",
    starterCode: "def dedup(nums):\n    pass",
    hints: [
      "w is the next free output slot; start w = 1 (the first element always stays).",
      "Read with r: when nums[r] != nums[w-1], copy it to nums[w] and advance w.",
      "Return w."
    ],
    solution: "def dedup(nums):\n    if not nums:\n        return 0\n    w = 1\n    for r in range(1, len(nums)):\n        if nums[r] != nums[w - 1]:\n            nums[w] = nums[r]\n            w += 1\n    return w",
    walkthrough: "w never overtakes r, so writes never destroy unread data. The invariant: nums[0:w] is the deduplicated prefix of everything read so far. One pass, O(1) space — sorting bought all of it.",
    testCode: "assert dedup([1, 1, 2]) == 2\nassert dedup([0, 0, 1, 1, 1, 2, 2, 3]) == 4\nassert dedup([]) == 0\nassert dedup([5, 5, 5]) == 1\nassert dedup([1, 2, 3]) == 3\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Squares Of Sorted", pattern: "two pointers from both ends", skill: "fill output from the back", difficulty: "Medium",
    statement: "Given a sorted list (possibly with negatives), return the list of squares in sorted order — in one pass.",
    examples: [
      { input: "nums = [-4, -1, 0, 3, 10]", output: "[0, 1, 9, 16, 100]" },
      { input: "nums = [-7, -3, 2, 3, 11]", output: "[4, 9, 9, 49, 121]" },
    ],
    why: "Squaring flips order for negatives, which scrambles the array — unless you notice the largest square must come from one of the two ends. Filling the output from the back turns 'find the largest' into the same end-comparison every step.",
    starterCode: "def sorted_squares(nums):\n    pass",
    hints: [
      "lo = 0, hi = last; write results into a result array from the last slot backward.",
      "The larger absolute value wins: compare abs(nums[lo]) and abs(nums[hi]).",
      "Advance whichever pointer produced the placed square."
    ],
    solution: "def sorted_squares(nums):\n    n = len(nums)\n    out = [0] * n\n    lo, hi = 0, n - 1\n    for pos in range(n - 1, -1, -1):\n        if abs(nums[lo]) > abs(nums[hi]):\n            out[pos] = nums[lo] * nums[lo]\n            lo += 1\n        else:\n            out[pos] = nums[hi] * nums[hi]\n            hi -= 1\n    return out",
    walkthrough: "The largest remaining square is always at one of the two fronts, because the array is sorted and squaring reverses only the negative side. Each placement consumes one pointer step, so n comparisons build the whole answer — versus O(n log n) to square-then-sort.",
    testCode: "assert sorted_squares([-4, -1, 0, 3, 10]) == [0, 1, 9, 16, 100]\nassert sorted_squares([-7, -3, 2, 3, 11]) == [4, 9, 9, 49, 121]\nassert sorted_squares([5]) == [25]\nassert sorted_squares([-2, -1]) == [1, 4]\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Three Sum Zero", pattern: "sort + inner squeeze", skill: "fix one, squeeze two", difficulty: "Medium",
    statement: "Given a list of distinct integers, count how many triples of distinct positions sum to 0. Values are distinct, so each value-triplet counts once.",
    examples: [
      { input: "nums = [-3, 0, 1, 2, -1, 4]", output: "3", explain: "(-3, -1, 4), (-3, 1, 2), (-1, 0, 1)" },
      { input: "nums = [5, -2, 3, 8]", output: "0" },
    ],
    why: "Three nested loops is O(n³). Fixing the smallest element and running problem 7's squeeze on the rest is the template for every k-sum: sort, fix k-2 elements, squeeze the last two. Layering a known pattern inside a loop is how complexity classes fall.",
    starterCode: "def three_sum_count(nums):\n    pass",
    hints: [
      "Sort first. For each index i, search for pairs summing to -nums[i] in nums[i+1:].",
      "Reuse the lo/hi squeeze from problem 7 inside the loop.",
      "Sum too small: lo += 1. Sum too big: hi -= 1. Equal: count it and move both."
    ],
    solution: "def three_sum_count(nums):\n    nums = sorted(nums)\n    n = len(nums)\n    count = 0\n    for i in range(n - 2):\n        lo, hi = i + 1, n - 1\n        need = -nums[i]\n        while lo < hi:\n            s = nums[lo] + nums[hi]\n            if s == need:\n                count += 1\n                lo += 1\n                hi -= 1\n            elif s < need:\n                lo += 1\n            else:\n                hi -= 1\n    return count",
    walkthrough: "Sorting costs O(n log n) once; then each of the n fixed anchors runs a linear squeeze — O(n²) total against the brute force's O(n³). The squeeze is trustworthy because sorted order guarantees no missed pair inside nums[i+1:].",
    testCode: "assert three_sum_count([-3, 0, 1, 2, -1, 4]) == 3\nassert three_sum_count([5, -2, 3, 8]) == 0\nassert three_sum_count([-2, 0, 2, 1]) == 1\nassert three_sum_count([1, 2, 3]) == 0\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Container With Most Water", pattern: "greedy pointer elimination", skill: "prove which end to move", difficulty: "Hard",
    statement: " heights[i] is a vertical line at x = i. Pick two lines with the most water between them: area = min(height) × gap. Return the maximum area.",
    examples: [
      { input: "heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]", output: "49", explain: "lines at 8 and 7, gap 7" },
      { input: "heights = [4, 3, 2, 1, 4]", output: "16" },
    ],
    why: "Checking all pairs is O(n²). The greedy pointer move needs a one-line proof: with the current pair, the shorter wall caps the area, so keeping the shorter wall and moving the other can never beat what you just measured. Discard it forever. That 'which side is now provably useless' argument is the heart of every two-pointer greedy.",
    starterCode: "def max_water(heights):\n    pass",
    hints: [
      "Start with the widest container: lo = 0, hi = last.",
      "Record its area; then move the pointer at the shorter wall inward.",
      "The wider wall cannot form a better container with a shorter partner than it just had."
    ],
    solution: "def max_water(heights):\n    lo, hi = 0, len(heights) - 1\n    best = 0\n    while lo < hi:\n        area = min(heights[lo], heights[hi]) * (hi - lo)\n        if area > best:\n            best = area\n        if heights[lo] < heights[hi]:\n            lo += 1\n        else:\n            hi -= 1\n    return best",
    walkthrough: "Every step throws away one wall with a written justification: bounded by the shorter wall, any narrower container using it is smaller than the one just measured. n steps, each eliminating exactly one candidate — the area of all discarded pairs is covered by the best-so-far.",
    testCode: "assert max_water([1, 8, 6, 2, 5, 4, 8, 3, 7]) == 49\nassert max_water([4, 3, 2, 1, 4]) == 16\nassert max_water([1, 1]) == 1\nassert max_water([2, 3, 4, 5, 18, 17, 6]) == 17\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 2, title: "Fixed Window Max Sum", pattern: "sliding window, fixed size", skill: "add one, drop one", difficulty: "Easy",
    statement: "Given a list and window size k, return the maximum sum over all windows of exactly k consecutive elements.",
    examples: [
      { input: "nums = [1, 4, 2, 10, 2, 3, 1, 0, 20], k = 4", output: "24", explain: "windows sum to 17, 18, 16, 16, 6, 24 — the last window [2, 3, 1, 0]... no: [10, 2, 3, 1] no — the max is [3, 1, 0, 20] = 24" },
      { input: "nums = [5, 1, 3], k = 2", output: "6" },
    ],
    why: "Recomputing each window is O(n·k). Sliding is the first amortized insight: entering one element and leaving one element updates the sum in O(1). Windows turn 'recompute' into 'diff'.",
    starterCode: "def max_window_sum(nums, k):\n    pass",
    hints: [
      "Sum the first k elements once.",
      "For each new position, add the entering element and subtract the leaving one.",
      "Track the max across all n - k + 1 positions."
    ],
    solution: "def max_window_sum(nums, k):\n    window = sum(nums[:k])\n    best = window\n    for i in range(k, len(nums)):\n        window += nums[i] - nums[i - k]\n        if window > best:\n            best = window\n    return best",
    walkthrough: "The sum is maintained, not recomputed: nums[i] enters, nums[i-k] leaves, O(1) per slide. For the example, windows are 17, 18, 16, 16, 6, 24 — max 24. This add-one-drop-one frame returns in every window problem ahead.",
    testCode: "assert max_window_sum([1, 4, 2, 10, 2, 3, 1, 0, 20], 4) == 24\nassert max_window_sum([5, 1, 3], 2) == 6\nassert max_window_sum([2, 3], 2) == 5\nassert max_window_sum([4, -1, 2, 1], 2) == 3\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 2, title: "Two Sum Exists", pattern: "hash map lookup", skill: "remember values, not positions", difficulty: "Easy",
    statement: "Given an unsorted list and a target, return True if two distinct positions sum to the target. One pass.",
    examples: [
      { input: "nums = [2, 7, 11, 15], target = 9", output: "True" },
      { input: "nums = [3, 3], target = 6", output: "True" },
    ],
    why: "Unsorted kills the squeeze from problem 7 — but memory restores linearity. This is problem 4's zero-pair generalized to any target: the set of 'partners I still owe' is the entire algorithm.",
    starterCode: "def two_sum(nums, target):\n    pass",
    hints: [
      "For each x, the needed partner is target - x.",
      "Check the partner against what you have already seen, then add x.",
      "Checking before inserting keeps two distinct positions guaranteed."
    ],
    solution: "def two_sum(nums, target):\n    seen = set()\n    for x in nums:\n        if target - x in seen:\n            return True\n        seen.add(x)\n    return False",
    walkthrough: "Same one-pass skeleton as problem 4 with a parameterized need. The lesson to carry: whenever brute force compares all pairs, ask 'what would let me look up my partner instead of scanning for it?'",
    testCode: "assert two_sum([2, 7, 11, 15], 9) == True\nassert two_sum([3, 2, 4], 6) == True\nassert two_sum([3, 3], 6) == True\nassert two_sum([1, 2], 5) == False\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 2, title: "Longest Unique Window", pattern: "variable window with set", skill: "grow right, shrink left", difficulty: "Medium",
    statement: "Return the length of the longest substring of s containing no repeated characters.",
    examples: [
      { input: "s = 'abcabcbb'", output: "3", explain: "'abc'" },
      { input: "s = 'pwwkew'", output: "3", explain: "'wke' — 'pw' stops at the second w" },
    ],
    why: "The first variable window. Two rules make it work: the right end always grows, and the left end only ever moves forward — because a duplicate means every window starting before the left shrink is equally broken. Monotone pointers are why this is O(n) and not O(n²).",
    starterCode: "def longest_unique(s):\n    pass",
    hints: [
      "Keep a set of characters currently in the window and a left index.",
      "When s[right] is already in the set, remove s[left] and advance left until it is not.",
      "After the window is valid, update the best length with right - left + 1."
    ],
    solution: "def longest_unique(s):\n    seen = set()\n    left = 0\n    best = 0\n    for right, ch in enumerate(s):\n        while ch in seen:\n            seen.remove(s[left])\n            left += 1\n        seen.add(ch)\n        if right - left + 1 > best:\n            best = right - left + 1\n    return best",
    walkthrough: "Each character enters the window once and leaves at most once — 2n pointer moves total, so O(n) despite the nested while. For 'dvdf' the window correctly sheds 'd' from the left rather than restarting: left is a floor, never a reset.",
    testCode: "assert longest_unique('abcabcbb') == 3\nassert longest_unique('bbbbb') == 1\nassert longest_unique('pwwkew') == 3\nassert longest_unique('') == 0\nassert longest_unique('dvdf') == 3\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "At Most K Distinct", pattern: "window with counter map", skill: "shrink on the count, not the char", difficulty: "Medium",
    statement: "Return the length of the longest substring containing at most k distinct characters.",
    examples: [
      { input: "s = 'eceba', k = 2", output: "3", explain: "'ece'" },
      { input: "s = 'aabbcc', k = 1", output: "2" },
    ],
    why: "Problem 14's window tracked one illegal condition (a repeat); here the condition is aggregate — 'more than k kinds' — so the set becomes a counter map. Learning when the window state needs a count per character (not just membership) generalizes to nearly every window problem that exists.",
    starterCode: "def longest_k_distinct(s, k):\n    pass",
    hints: [
      "A dict maps char -> occurrences inside the window.",
      "After adding s[right], while the dict has more than k keys, drop s[left] and decrement — delete the key at zero.",
      "len(count) is the current number of distinct chars."
    ],
    solution: "def longest_k_distinct(s, k):\n    count = {}\n    left = 0\n    best = 0\n    for right, ch in enumerate(s):\n        count[ch] = count.get(ch, 0) + 1\n        while len(count) > k:\n            left_ch = s[left]\n            count[left_ch] -= 1\n            if count[left_ch] == 0:\n                del count[left_ch]\n            left += 1\n        if right - left + 1 > best:\n            best = right - left + 1\n    return best",
    walkthrough: "Same monotone left pointer; the shrink condition is now a size test on the map. Each char still enters and leaves once. 'At most k' is the master form — 'exactly k' and 'longest with k unique' are small deltas on this exact code.",
    testCode: "assert longest_k_distinct('eceba', 2) == 3\nassert longest_k_distinct('aa', 1) == 2\nassert longest_k_distinct('aabbcc', 1) == 2\nassert longest_k_distinct('aabbcc', 2) == 4\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Minimum Covering Window", pattern: "window covering a multiset", skill: "need vs have counters", difficulty: "Hard",
    statement: "Given strings s and t, return the shortest substring of s containing every character of t (with multiplicity), or '' if none exists.",
    examples: [
      { input: "s = 'ADOBECODEBANC', t = 'ABC'", output: "'BANC'" },
      { input: "s = 'a', t = 'aa'", output: "''" },
    ],
    why: "The window condition inverts: instead of forbidding something (duplicates, excess kinds), the window must contain something. Two counters — how much you need and how much you have — plus a running 'satisfied' count keep validity checks O(1). This is the hardest common window problem; after it, the whole family is yours.",
    starterCode: "def min_window(s, t):\n    pass",
    hints: [
      "need = count of each char in t; missing = number of chars still unsatisfied.",
      "Grow right: adding a char decrements its need; when a need hits 0, missing decreases.",
      "When missing == 0, shrink from the left as far as validity holds, recording the best."
    ],
    solution: "def min_window(s, t):\n    need = {}\n    for ch in t:\n        need[ch] = need.get(ch, 0) + 1\n    missing = len(t)\n    left = 0\n    best = (float('inf'), 0, 0)\n    for right, ch in enumerate(s):\n        if need.get(ch, 0) > 0:\n            missing -= 1\n        need[ch] = need.get(ch, 0) - 1\n        while missing == 0:\n            if right - left + 1 < best[0]:\n                best = (right - left + 1, left, right)\n            need[s[left]] += 1\n            if need[s[left]] > 0:\n                missing += 1\n            left += 1\n    if best[0] == float('inf'):\n        return ''\n    return s[best[1]:best[2] + 1]",
    walkthrough: "need going negative means 'surplus' — that is why chars absent from t just sink below zero harmlessly. The shrink loop stops at the exact moment validity would break, so each expansion/shrink pair is amortized O(1). Grow to cover, shrink to minimize: the two-phase rhythm of every covering window.",
    testCode: "assert min_window('ADOBECODEBANC', 'ABC') == 'BANC'\nassert min_window('a', 'a') == 'a'\nassert min_window('a', 'aa') == ''\nassert min_window('aa', 'aa') == 'aa'\nprint('All tests passed!')"
  },
]
