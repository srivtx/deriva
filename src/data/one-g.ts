import type { OneProblem } from "./one"

export const PROBLEMS_ONE_G: OneProblem[] = [
  {
    id: 101, stage: 18, title: "Two City Scheduling", pattern: "cost-difference sort", skill: "rank the switches", difficulty: "Easy",
    statement: "2n people; flying person i to city A costs a, to city B costs b. Exactly n must go to each city. Return the minimum total cost.",
    examples: [
      { input: "costs = [[10, 20], [30, 200], [400, 50], [30, 20]]", output: "110", explain: "A, A, B, B: 10 + 30 + 50 + 20" },
      { input: "costs = [[259, 770], [448, 54], [926, 667], [184, 139], [840, 118], [577, 469]]", output: "1859" },
    ],
    why: "The greedy needs one reframing to become obvious: send EVERYONE to A first, then 'buy back' the n switches to B. The price of switching person i is a - b, so sort by that difference and switch the n cheapest. Reframing an assignment problem as 'baseline + corrections' is the trick that makes a hundred greedy proofs one-line short.",
    starterCode: "def two_city_cost(costs):\n    pass",
    hints: [
      "Sort people by a - b ascending: most A-leaning first.",
      "First n go to A, last n go to B.",
      "Sum the chosen halves."
    ],
    solution: "def two_city_cost(costs):\n    ordered = sorted(costs, key=lambda c: c[0] - c[1])\n    n = len(costs) // 2\n    return sum(c[0] for c in ordered[:n]) + sum(c[1] for c in ordered[n:])",
    walkthrough: "Any split with n per city is feasible; the question is which. The exchange argument: if two people violate the sorted order across cities, swapping them never costs more — so the sorted order is optimal. 470 (all A) − 350 (switch 400,50) − 10 (switch 30,20) = 110.",
    testCode: "assert two_city_cost([[10, 20], [30, 200], [400, 50], [30, 20]]) == 110\nassert two_city_cost([[259, 770], [448, 54], [926, 667], [184, 139], [840, 118], [577, 469]]) == 1859\nassert two_city_cost([[5, 5], [5, 5]]) == 10\nprint('All tests passed!')"
  },
  {
    id: 102, stage: 18, title: "Jump Game", pattern: "reachability frontier", skill: "one sweep, one frontier", difficulty: "Medium",
    statement: "nums[i] is the maximum jump length from index i. Return True if the last index is reachable from index 0.",
    examples: [
      { input: "nums = [2, 3, 1, 1, 4]", output: "True" },
      { input: "nums = [3, 2, 1, 0, 4]", output: "False", explain: "everything funnels into the 0 at index 3" },
    ],
    why: "DFS over jump choices is exponential with memoization overhead; the greedy insight is that reachability has a FRONTIER — the farthest index reachable so far. Scan left to right: if your current index passes the frontier, you are stranded. One variable replaces the entire search. This 'maintain the boundary, not the set' move returns in problem 103 and in every interval-reachability problem.",
    starterCode: "def can_jump(nums):\n    pass",
    hints: [
      "Track farthest = the largest index reachable so far.",
      "If i > farthest at any point, return False — index i is unreachable.",
      "farthest = max(farthest, i + nums[i]); the end is reached when farthest >= last index."
    ],
    solution: "def can_jump(nums):\n    farthest = 0\n    for i, jump in enumerate(nums):\n        if i > farthest:\n            return False\n        if i + jump > farthest:\n            farthest = i + jump\n    return True",
    walkthrough: "The frontier only grows, and every reachable index is <= it by induction. The False case is precise: the first index beyond the frontier proves no earlier jump could cross the gap. [3,2,1,0,4]: frontier stalls at 4 = index 3's position, and index 4 arrives beyond it.",
    testCode: "assert can_jump([2, 3, 1, 1, 4]) == True\nassert can_jump([3, 2, 1, 0, 4]) == False\nassert can_jump([0]) == True\nassert can_jump([2, 0, 0]) == True\nprint('All tests passed!')"
  },
  {
    id: 103, stage: 18, title: "Jump Game II", pattern: "greedy BFS layers", skill: "windows of equal jump count", difficulty: "Medium",
    statement: "Return the minimum number of jumps to reach the last index (guaranteed reachable).",
    examples: [
      { input: "nums = [2, 3, 1, 1, 4]", output: "2", explain: "0 -> 1 -> 4" },
      { input: "nums = [2, 3, 0, 1, 4]", output: "2" },
      { input: "nums = [1, 1, 1, 1]", output: "3" },
    ],
    why: "This is BFS (stage 11) with the queue collapsed: all indices reachable in k jumps form a window, and the next window is the max frontier within it. The greedy inherits BFS's optimality — same layer argument, zero queue. Recognizing when a level-BFS compresses into two variables is a recurring stage-10-style revelation.",
    starterCode: "def min_jumps(nums):\n    pass",
    hints: [
      "current_end = the boundary of the current BFS layer; farthest = best reach seen inside it.",
      "When i reaches current_end, that layer is done: jumps += 1, current_end = farthest.",
      "Stop early when current_end >= last index."
    ],
    solution: "def min_jumps(nums):\n    jumps = 0\n    current_end = 0\n    farthest = 0\n    for i in range(len(nums) - 1):\n        if i + nums[i] > farthest:\n            farthest = i + nums[i]\n        if i == current_end:\n            jumps += 1\n            current_end = farthest\n            if current_end >= len(nums) - 1:\n                break\n    return jumps",
    walkthrough: "Indices [0..current_end] cost `jumps`; scanning the layer extends farthest; crossing the boundary promotes the whole next layer at once. The loop runs to len - 1 (not len) so finishing on the last index never counts an extra jump. Optimal because layers ARE the BFS distance function.",
    testCode: "assert min_jumps([2, 3, 1, 1, 4]) == 2\nassert min_jumps([2, 3, 0, 1, 4]) == 2\nassert min_jumps([1]) == 0\nassert min_jumps([1, 1, 1, 1]) == 3\nprint('All tests passed!')"
  },
  {
    id: 104, stage: 18, title: "Gas Station", pattern: "local deficit reset", skill: "the total decides, the prefix finds", difficulty: "Medium",
    statement: "Circular route: gas[i] at station i, cost[i] to drive to i+1. Return the starting station index from which you can complete the circuit, or -1. Exactly one solution exists when possible.",
    examples: [
      { input: "gas = [1, 2, 3, 4, 5], cost = [3, 4, 5, 1, 2]", output: "3" },
      { input: "gas = [2, 3, 4], cost = [3, 4, 3]", output: "-1" },
    ],
    why: "Two facts fuse into a linear algorithm: (1) if total gas >= total cost, a solution exists; (2) if you run dry after starting at s, NO station between s and the failure point can work either — every prefix of that stretch is negative. So on dry-out, jump the start past the failure. Each station is passed once: the 'abandon the prefix, never revisit' logic mirrors stage 2's monotone windows.",
    starterCode: "def gas_station(gas, cost):\n    pass",
    hints: [
      "diff[i] = gas[i] - cost[i]. Track the running tank from the current start.",
      "When the tank goes negative, the next candidate start is i + 1; reset the tank to 0.",
      "If total diff < 0, return -1 — no start exists."
    ],
    solution: "def gas_station(gas, cost):\n    total = 0\n    tank = 0\n    start = 0\n    for i in range(len(gas)):\n        diff = gas[i] - cost[i]\n        total += diff\n        tank += diff\n        if tank < 0:\n            start = i + 1\n            tank = 0\n    return start if total >= 0 else -1",
    walkthrough: "The dry-out at i proves stations start..i are all dead as starting points (their prefixes sum negative from any of them) — a whole range eliminated per failure, which is why no restart loop is needed. The final start is validated by the total: sum >= 0 guarantees completion. Two invariants, zero simulation of the circle.",
    testCode: "assert gas_station([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]) == 3\nassert gas_station([2, 3, 4], [3, 4, 3]) == -1\nassert gas_station([5], [4]) == 0\nassert gas_station([3, 1, 1], [1, 2, 2]) == 0\nprint('All tests passed!')"
  },
  {
    id: 105, stage: 18, title: "Task Scheduler", pattern: "counting formula greedy", skill: "the busiest task dictates", difficulty: "Medium",
    statement: "Tasks (letters), cooldown n: identical tasks must be n apart. Each slot runs one task or idles. Return the minimum total time to finish all tasks.",
    examples: [
      { input: "tasks = ['A', 'A', 'A', 'B', 'B', 'B'], n = 2", output: "8", explain: "A B idle A B idle A B" },
      { input: "tasks = ['A', 'A', 'A', 'B', 'B', 'B'], n = 0", output: "6" },
      { input: "tasks = ['A', 'A', 'A', 'A', 'A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], n = 2", output: "16" },
    ],
    why: "Simulation (heaps of ready tasks, stage 10 style) works but misses the punchline: the answer has a FORMULA. The max-count task builds a scaffold of (count - 1) blocks of width (n + 1) plus itself; every other task fills the gaps for free. The only correction: when tasks outnumber the gaps, no idling is needed and the answer is just len(tasks). Formula derivation beats simulation when you can see the scaffold.",
    starterCode: "def min_time(tasks, n):\n    pass",
    hints: [
      "Count occurrences; let max_count be the largest, ties = how many tasks have it.",
      "Scaffold: (max_count - 1) * (n + 1) + ties.",
      "Return max(scaffold, len(tasks)) — the gap-filling correction."
    ],
    solution: "def min_time(tasks, n):\n    counts = {}\n    for t in tasks:\n        counts[t] = counts.get(t, 0) + 1\n    max_count = max(counts.values())\n    ties = sum(1 for c in counts.values() if c == max_count)\n    scaffold = (max_count - 1) * (n + 1) + ties\n    return max(scaffold, len(tasks))",
    walkthrough: "The max task MUST occupy (max_count - 1) gaps of size >= n each — nothing can shrink that skeleton. Other tasks slot into the skeleton's free cells; if there are more tasks than cells, the cooldown never binds and time = task count. Check the third example: (6-1)*3 + 1 = 16 ✓. Compare with a heap simulation: same answer, ten times the code — knowing when a formula exists is a skill of its own.",
    testCode: "assert min_time(['A', 'A', 'A', 'B', 'B', 'B'], 2) == 8\nassert min_time(['A', 'A', 'A', 'B', 'B', 'B'], 0) == 6\nassert min_time(['A', 'A', 'A', 'A', 'A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], 2) == 16\nassert min_time(['A'], 3) == 1\nprint('All tests passed!')"
  },
  {
    id: 106, stage: 18, title: "Candy", pattern: "two-pass greedy", skill: "satisfy each constraint direction alone", difficulty: "Hard",
    statement: "n children in a line with ratings; each child gets at least 1 candy, and a child with a higher rating than an immediate neighbor gets more candies than that neighbor. Return the minimum total candies.",
    examples: [
      { input: "ratings = [1, 0, 2]", output: "5", explain: "[2, 1, 2]" },
      { input: "ratings = [1, 2, 87, 87, 87, 2, 1]", output: "13" },
    ],
    why: "One pass cannot satisfy left-facing AND right-facing constraints simultaneously — so satisfy them INDEPENDENTLY: a left pass gives each child candies above their left neighbor, a right pass does the mirror, and taking the max per child satisfies both with provable minimality. Decomposing coupled constraints into directional passes is the standard cure for 'greedy that keeps getting it wrong'.",
    starterCode: "def candy(ratings):\n    pass",
    hints: [
      "left[i]: candies if only the left-neighbor rule existed — 1, or left[i-1] + 1 when rising.",
      "right[i]: the mirror from the right.",
      "Answer: sum of max(left[i], right[i]) — the smallest value satisfying both rules."
    ],
    solution: "def candy(ratings):\n    n = len(ratings)\n    left = [1] * n\n    right = [1] * n\n    for i in range(1, n):\n        if ratings[i] > ratings[i - 1]:\n            left[i] = left[i - 1] + 1\n    for i in range(n - 2, -1, -1):\n        if ratings[i] > ratings[i + 1]:\n            right[i] = right[i + 1] + 1\n    return sum(max(left[i], right[i]) for i in range(n))",
    walkthrough: "max(left, right) is feasible (satisfies both neighbor rules — each rule only demands dominance over ITS side) and minimal (any valid assignment must be >= left[i] and >= right[i], hence >= their max). [1,2,87,87,87,2,1]: left = [1,2,3,1,1,1,1], right = [1,1,1,1,3,2,1], max-sum = 13. Two passes instead of a fragile one-pass with state — clarity that generalizes.",
    testCode: "assert candy([1, 0, 2]) == 5\nassert candy([1, 2, 2]) == 4\nassert candy([1, 2, 87, 87, 87, 2, 1]) == 13\nassert candy([5]) == 1\nprint('All tests passed!')"
  },
  {
    id: 107, stage: 19, title: "Single Number", pattern: "XOR cancellation", skill: "x ^ x = 0", difficulty: "Easy",
    statement: "Every element appears twice except one. Find it in O(n) time and O(1) space.",
    examples: [
      { input: "nums = [2, 2, 1]", output: "1" },
      { input: "nums = [4, 1, 2, 1, 2]", output: "4" },
    ],
    why: "The hash-set answer costs O(n) memory; XOR costs none. Three identities do everything: x^x = 0 (pairs annihilate), x^0 = x (the survivor stands), commutativity (order irrelevant). Bit manipulation's first lesson: some algebra on bits replaces an entire data structure.",
    starterCode: "def single_number(nums):\n    pass",
    hints: [
      "Fold XOR across the list.",
      "Pairs cancel to zero regardless of position.",
      "What remains is the unique element."
    ],
    solution: "def single_number(nums):\n    result = 0\n    for x in nums:\n        result ^= x\n    return result",
    walkthrough: "Associativity + commutativity let you pretend identical values sit next to each other; they XOR to 0 and the answer is the last one standing. The entire 'appears twice' structure is consumed by one operator — a preview of how bits encode state cheaply (the two-heaps median of stage 10 suddenly looks expensive).",
    testCode: "assert single_number([2, 2, 1]) == 1\nassert single_number([4, 1, 2, 1, 2]) == 4\nassert single_number([1]) == 1\nprint('All tests passed!')"
  },
  {
    id: 108, stage: 19, title: "Counting Bits", pattern: "DP over the binary structure", skill: "the answer of a prefix", difficulty: "Easy",
    statement: "Return an array bits where bits[i] is the number of 1s in i's binary form, for 0..n — without converting each number to a string.",
    examples: [
      { input: "n = 5", output: "[0, 1, 1, 2, 1, 2]" },
      { input: "n = 2", output: "[0, 1, 1]" },
    ],
    why: "Brute force counts bits per number — O(n log n). The DP: i's bits are (i >> 1)'s bits plus i's last bit — the answer of a SHIFTED PREFIX plus one bit. This is stage 14's DP ritual applied to the structure of binary numbers themselves, and it is the same 'build from a smaller self' move as climb-stairs.",
    starterCode: "def count_bits(n):\n    pass",
    hints: [
      "bits[0] = 0.",
      "For i >= 1: bits[i] = bits[i >> 1] + (i & 1).",
      "i >> 1 < i, so the table is already filled when you read it."
    ],
    solution: "def count_bits(n):\n    bits = [0] * (n + 1)\n    for i in range(1, n + 1):\n        bits[i] = bits[i >> 1] + (i & 1)\n    return bits",
    walkthrough: "Appending one binary digit either leaves the count (bit 0) or adds one (bit 1) — the recurrence is just that observation. i >> 1 is strictly smaller, so a single left-to-right pass fills the table: O(n) instead of O(n log n). Recognizing 'my problem is DP over representations' is the stage's core insight.",
    testCode: "assert count_bits(5) == [0, 1, 1, 2, 1, 2]\nassert count_bits(2) == [0, 1, 1]\nassert count_bits(0) == [0]\nprint('All tests passed!')"
  },
  {
    id: 109, stage: 19, title: "Power Of Two", pattern: "bit subtraction trick", skill: "n & (n - 1)", difficulty: "Easy",
    statement: "Return True if n is a power of two — one set bit, nothing else.",
    examples: [
      { input: "n = 16", output: "True" },
      { input: "n = 3", output: "False" },
      { input: "n = 0", output: "False" },
    ],
    why: "n & (n - 1) clears the LOWEST set bit (borrowing flips the lowest 1 to 0 and everything below to 1s, which AND away). A power of two has exactly one bit, so the expression lands on 0 — a one-instruction definition of the property. This trick returns in stage 16's Fenwick tree (i & -i is its signed sibling) — the bit vocabulary compounds.",
    starterCode: "def is_power_of_two(n):\n    pass",
    hints: [
      "Guard n > 0 first.",
      "n & (n - 1) removes the lowest set bit.",
      "One set bit means the removal leaves zero."
    ],
    solution: "def is_power_of_two(n):\n    return n > 0 and n & (n - 1) == 0",
    walkthrough: "Trace 16: 10000 & 01111 = 0 → power of two. Trace 6: 110 & 101 = 100 ≠ 0 → not. The guard kills 0 (0 & -1 = 0, a false positive) and negatives. One AND replaces a loop of divisions — the entire stage in miniature.",
    testCode: "assert is_power_of_two(16) == True\nassert is_power_of_two(3) == False\nassert is_power_of_two(0) == False\nassert is_power_of_two(1) == True\nassert is_power_of_two(-16) == False\nprint('All tests passed!')"
  },
  {
    id: 110, stage: 19, title: "Single Number II", pattern: "bit state machine", skill: "count mod 3 with two registers", difficulty: "Medium",
    statement: "Every element appears exactly three times except one, which appears once. Find it in O(n) time and O(1) space.",
    examples: [
      { input: "nums = [2, 2, 3, 2]", output: "3" },
      { input: "nums = [0, 1, 0, 1, 0, 1, 99]", output: "99" },
    ],
    why: "XOR cancels pairs — but triples need a counter that cycles 0, 1, 2, 0. Two registers (ones, twos) encode that counter per bit: a bit enters ones, promotes to twos, then leaves both on the third sighting. Designing a finite state machine over bits — instead of an array of 32 counters — is the stage's step up in sophistication.",
    starterCode: "def single_number_ii(nums):\n    pass",
    hints: [
      "ones holds bits seen 1 mod 3 times; twos holds bits seen 2 mod 3 times.",
      "Update order matters: ones = (ones ^ x) & ~twos; THEN twos = (twos ^ x) & ~ones.",
      "After the loop, ones is the answer."
    ],
    solution: "def single_number_ii(nums):\n    ones = 0\n    twos = 0\n    for x in nums:\n        ones = (ones ^ x) & ~twos\n        twos = (twos ^ x) & ~ones\n    return ones",
    walkthrough: "Per bit, the pair (ones, twos) is a 2-bit counter: 00 → 10 → 01 → 00 (one → three sightings). The masks (~twos, ~ones) are what force the third sighting to reset rather than accumulate. The unique number's bits end in state 10 = ones. Same shape solves 'every element appears k times' — the register count is the state machine size.",
    testCode: "assert single_number_ii([2, 2, 3, 2]) == 3\nassert single_number_ii([0, 1, 0, 1, 0, 1, 99]) == 99\nassert single_number_ii([7]) == 7\nprint('All tests passed!')"
  },
  {
    id: 111, stage: 19, title: "Sum Without Plus", pattern: "carry loop", skill: "addition IS xor plus carry", difficulty: "Medium",
    statement: "Return a + b without using + or - (bitwise only). Both are non-negative.",
    examples: [
      { input: "a = 12, b = 30", output: "42" },
      { input: "a = 0, b = 7", output: "7" },
      { input: "a = 5, b = 5", output: "10" },
    ],
    why: "Half-add the whole numbers: XOR gives the sum-without-carry, AND-shifted gives the carry — repeat until no carry remains. This decomposes the most fundamental operation into the two gates it is actually made of, and the loop's termination (carries strictly move left, 32 bits bound them) is the same halving argument as stage 0's problem 3.",
    starterCode: "def bitwise_sum(a, b):\n    pass",
    hints: [
      "sum_without_carry = a ^ b; carry = (a & b) << 1.",
      "Repeat with a = sum_without_carry, b = carry, until b == 0.",
      "Each round moves every carry at least one bit left — termination guaranteed for bounded ints."
    ],
    solution: "def bitwise_sum(a, b):\n    while b:\n        carry = (a & b) << 1\n        a = a ^ b\n        b = carry\n    return a",
    walkthrough: "5 + 5: 101 ^ 101 = 000, (101 & 101) << 1 = 1010 → next round 0000 ^ 1010 with carry 0 → 10. The identity x + y = (x ^ y) + ((x & y) << 1) is exact — the loop just moves the '+' onto smaller numbers until it vanishes. Carries strictly left-shift each round, so at most ~32 iterations.",
    testCode: "assert bitwise_sum(12, 30) == 42\nassert bitwise_sum(0, 7) == 7\nassert bitwise_sum(5, 5) == 10\nassert bitwise_sum(1, 2) == 3\nprint('All tests passed!')"
  },
  {
    id: 112, stage: 19, title: "Bitwise AND Range", pattern: "common prefix of bits", skill: "the answer survives only shared bits", difficulty: "Hard",
    statement: "Return the bitwise AND of all integers in [m, n] inclusive — without looping over the range (it can be huge).",
    examples: [
      { input: "m = 5, n = 7", output: "4", explain: "101 & 110 & 111" },
      { input: "m = 12, n = 15", output: "12" },
      { input: "m = 1, n = 1", output: "1" },
    ],
    why: "ANDing a range annihilates every bit that EVER changes inside it — the survivor is exactly the common binary prefix of m and n. Each mismatched low bit implies a carry boundary somewhere in the range, and a carry boundary zeroes that bit in some member. Shifting both ends right until they meet, then shifting back, strips the differing tail in O(bits) instead of O(range).",
    starterCode: "def range_and(m, n):\n    pass",
    hints: [
      "While m < n: shift both right by one, counting the shifts.",
      "When they meet, you hold the common prefix.",
      "Shift it back left by the counted amount."
    ],
    solution: "def range_and(m, n):\n    shifts = 0\n    while m < n:\n        m >>= 1\n        n >>= 1\n        shifts += 1\n    return m << shifts",
    walkthrough: "[5, 7] = 101, 110, 111: the two ends differ in bits 0-1, so two shift rounds leave 1; shifting back gives 100 = 4. Every bit below the first difference is zeroed by SOME number in the range (the one where its carry propagates), so only the shared prefix survives — the observation that turns a potentially billion-iteration loop into 30 steps.",
    testCode: "assert range_and(5, 7) == 4\nassert range_and(12, 15) == 12\nassert range_and(1, 1) == 1\nassert range_and(0, 0) == 0\nassert range_and(10, 11) == 10\nprint('All tests passed!')"
  },
]
