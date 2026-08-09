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

export const STAGES_GREEDY = [
  { id: 0, name: "Local-Choice Reflex", desc: "when best now never regretted" },
  { id: 1, name: "Sorting as Enabler", desc: "key design" },
  { id: 2, name: "The Proof Habit", desc: "exchange arguments" },
  { id: 3, name: "Frontier Patterns", desc: "reachable set" },
  { id: 4, name: "Naive", desc: "DP where greedy works" },
  { id: 5, name: "Optimization", desc: "greedy replaces DP" },
  { id: 6, name: "Mastery", desc: "two-step insights" },
]

export const PROBLEMS_GREEDY: Problem[] = [
  // ── STAGE 0: Local-Choice Reflex ──
  {
    id: 1, stage: 0, title: "Coin Change — Canonical Denominations", pattern: "largest-first coin pickup", skill: "always pick the largest coin that fits",
    statement: "Given an amount and coin denominations [1,5,10,25] (US cents), return the minimum number of coins to make the amount. Use the greedy: always take the largest coin <= remaining amount.",
    examples: [
      { input: "amount = 47", output: "5", explain: "25+10+10+1+1=47, 5 coins" },
      { input: "amount = 30", output: "2", explain: "25+5=30" },
      { input: "amount = 0", output: "0" },
    ],
    why: "The first greedy reflex: at each step, make the locally best choice (largest coin). For CANONICAL coin systems (like US), this actually yields the global optimum. The reflex is: what decision can I make right now that I'll never regret?",
    starterCode: "def coin_change(coins, amount):\n    coins.sort(reverse=True)\n    count = 0\n    pass",
    hints: [
      "Sort coins descending. For each coin, take as many as possible: amount // coin times.",
      "Subtract coin * count from remaining amount, add count to total coins.",
      "This works for canonical systems. The test: can taking a larger coin ever force a suboptimal result? For [1,5,10,25], no."
    ],
    solution: "def coin_change(coins, amount):\n    coins.sort(reverse=True)\n    count = 0\n    for coin in coins:\n        if amount >= coin:\n            take = amount // coin\n            count += take\n            amount -= take * coin\n    return count",
    walkthrough: "Sort by largest first. For each coin, take floor(amount / coin) — the maximum we can pick without exceeding. Subtract and continue to smaller coins. For canonical systems, each step's optimum composes into the global optimum. O(k) where k is number of denominations.",
    testCode: "assert coin_change([1,5,10,25], 47) == 5\nassert coin_change([1,5,10,25], 30) == 2\nassert coin_change([1,5,10,25], 0) == 0\nassert coin_change([1,5,10,25], 99) == 9\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Coin Change — Non-Canonical Failure", pattern: "greedy failure demonstration", skill: "recognize when local-best does NOT lead to global-best",
    statement: "Given coins [1,3,4] and amount 6, the greedy algorithm (take largest coin first) gives 4+1+1 = 3 coins. But the optimal is 3+3 = 2 coins. Demonstrate that greedy fails here.",
    examples: [
      { input: "coins = [1,3,4], amount = 6", output: "2", explain: "3+3=2 coins. Greedy: 4+1+1=3" },
      { input: "coins = [1,3,4], amount = 8", output: "2", explain: "4+4=2 coins. Greedy: 4+3+1=3" },
    ],
    why: "Greedy is not magic — it has a condition: the problem must have the 'greedy-choice property.' Counterexamples build the reflex to QUESTION whether greedy applies, not just apply it blindly.",
     starterCode: "def optimal_coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    pass\n\ndef greedy_coin_change(coins, amount):\n    pass",
    hints: [
      "For non-canonical systems, DP is needed. dp[i] = min coins to make amount i.",
      "For each amount 1..target: dp[i] = min(dp[i - coin] + 1) for each coin <= i.",
      "Compare greedy output vs DP output for [1,3,4] and amount 6."
    ],
    solution: "def optimal_coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for i in range(1, amount + 1):\n        for coin in coins:\n            if coin <= i:\n                dp[i] = min(dp[i], dp[i - coin] + 1)\n    return dp[amount]\n\ndef greedy_coin_change(coins, amount):\n    coins.sort(reverse=True)\n    count = 0\n    for coin in coins:\n        take = amount // coin\n        count += take\n        amount -= take * coin\n    return count",
    walkthrough: "DP finds optimal: dp[6] with [1,3,4] = min(dp[5]+1, dp[3]+1, dp[2]+1) = 2. Greedy gives 3. The counterexample proves greedy doesn't always work — the proof habit (Stage 2) exists because you need to verify the greedy-choice property.",
    testCode: "assert optimal_coin_change([1,3,4], 6) == 2\nassert greedy_coin_change([1,3,4], 6) == 3\nassert optimal_coin_change([1,3,4], 8) == 2\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Container With Most Water", pattern: "two-pointer greedy shrink", skill: "move the shorter wall inward",
    statement: "Given array height where height[i] is wall height at position i, find two walls that (with the floor) form a container holding the most water. Area = min(h[i], h[j]) * (j - i).",
    examples: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", output: "49", explain: "walls at 8 and 7, distance 7, area=7*7=49" },
      { input: "height = [1,1]", output: "1" },
    ],
    why: "The greedy choice: the shorter wall limits area. Moving the shorter wall inward is the only move that COULD increase area — moving the taller wall never helps. Pure local reasoning.",
    starterCode: "def max_area(height):\n    l, r = 0, len(height) - 1\n    max_water = 0\n    pass",
    hints: [
      "Area = min(height[l], height[r]) * (r - l). The min controls the area.",
      "To potentially increase area, you must increase the min height. How? Move the SHORTER wall inward.",
      "Moving the taller wall inward CANNOT increase the min height — it will only decrease distance."
    ],
    solution: "def max_area(height):\n    l, r = 0, len(height) - 1\n    max_water = 0\n    while l < r:\n        area = min(height[l], height[r]) * (r - l)\n        max_water = max(max_water, area)\n        if height[l] < height[r]:\n            l += 1\n        else:\n            r -= 1\n    return max_water",
    walkthrough: "Two pointers at ends. Area = min(walls) * distance. The greed insight: the shorter wall is the bottleneck. Moving it inward might find a taller wall; moving the taller wall inward guarantees no improvement. At each step, move the shorter wall. O(n).",
    testCode: "assert max_area([1,8,6,2,5,4,8,3,7]) == 49\nassert max_area([1,1]) == 1\nassert max_area([4,3,2,1,4]) == 16\nassert max_area([1,2,1]) == 2\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Lemonade Change", pattern: "on-the-fly resource allocation", skill: "always give back the largest bill possible as change",
    statement: "Customers queue to buy lemonade at $5 each. Each pays with $5, $10, or $20. You start with $0. Return True if you can give correct change to everyone. Greedy: when someone pays $20, prefer giving $10+$5 over three $5s.",
    examples: [
      { input: "bills = [5,5,5,10,20]", output: "True", explain: "3 fives for first 3, give $5 change for $10, give $10+$5 for $20" },
      { input: "bills = [5,5,10,10,20]", output: "False", explain: "after two $10s, only one $5 left; $20 needs $10+$5 or 3x$5 — neither possible" },
    ],
    why: "The greedy choice: when a $20 arrives, give $10+$5 rather than three $5s. $10s are 'useless' for $5 customers, but $5s are always useful. Hoarding $5s is always better.",
    starterCode: "def lemonade_change(bills):\n    fives = tens = 0\n    pass",
    hints: [
      "$5: just accept it (fives++). $10: need a $5 for change (if fives == 0, return False).",
      "$20: prefer $10+$5 (if possible). Otherwise, need 3*$5. If neither, return False.",
      "Why prefer $10+$5? Because $10s can only help $20 customers. $5s help both $10 and $20 customers."
    ],
    solution: "def lemonade_change(bills):\n    fives = tens = 0\n    for bill in bills:\n        if bill == 5:\n            fives += 1\n        elif bill == 10:\n            if fives == 0:\n                return False\n            fives -= 1\n            tens += 1\n        else:\n            if tens > 0 and fives > 0:\n                tens -= 1\n                fives -= 1\n            elif fives >= 3:\n                fives -= 3\n            else:\n                return False\n    return True",
    walkthrough: "Simulate each transaction. $5: accumulate. $10: need a $5. $20: prefer $10+$5; if not, three $5s; if neither, fail. The greedy principle: hoard the most versatile resource ($5 bills). $10s are only useful for $20 change, so spend them when you can.",
    testCode: "assert lemonade_change([5,5,5,10,20]) == True\nassert lemonade_change([5,5,10,10,20]) == False\nassert lemonade_change([5,5,10]) == True\nassert lemonade_change([10,10]) == False\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Largest Number", pattern: "custom sort comparator", skill: "sort by concatenated comparison a+b vs b+a",
    statement: "Given list of non-negative integers, arrange them to form the largest possible number (as string). E.g., [3,30,34,5,9] -> '9534330'. Greedy: at each position, choose the number that makes the result lexicographically largest.",
    examples: [
      { input: "nums = [10,2]", output: "'210'" },
      { input: "nums = [3,30,34,5,9]", output: "'9534330'" },
    ],
    why: "The greedy choice at each position: pick the number x such that (current_result + x) yields the largest string. Sorting with comparator a+b > b+a encodes this greed globally into a single sort.",
    starterCode: "def largest_number(nums):\n    from functools import cmp_to_key\n    pass",
    hints: [
      "Convert all numbers to strings. Sort with custom comparator: a before b if a+b > b+a.",
      "For [3,30]: '330' > '303', so 3 goes before 30. For [3,34]: '343' > '334', so 34 goes before 3.",
      "After sorting, join strings. Handle the edge case where result starts with '0' (all zeros)."
    ],
    solution: "def largest_number(nums):\n    from functools import cmp_to_key\n    def compare(a, b):\n        if a + b > b + a:\n            return -1\n        elif a + b < b + a:\n            return 1\n        return 0\n    strs = [str(n) for n in nums]\n    strs.sort(key=cmp_to_key(compare))\n    result = ''.join(strs)\n    return '0' if result[0] == '0' else result",
    walkthrough: "Key insight: for any two numbers x,y, if xy > yx (string concatenation), x should come before y. This comparator sorts the entire array such that the concatenation is maximized. The greedy is implicit: the sort ensures each adjacent pair is optimally ordered, and this local consistency produces the global optimum.",
    testCode: "assert largest_number([10,2]) == '210'\nassert largest_number([3,30,34,5,9]) == '9534330'\nassert largest_number([0,0]) == '0'\nassert largest_number([1]) == '1'\nprint('All tests passed!')"
  },

  // ── STAGE 1: Sorting as Enabler ──
  {
    id: 6, stage: 1, title: "Activity Selection", pattern: "sort by finish, pick earliest-finishing", skill: "sort by finish time, greedily pick non-overlapping",
    statement: "Given N activities with start and finish times, select maximum number of non-overlapping activities. Sort by finish time, then greedily pick the earliest-finishing activity that starts after the last picked activity ends.",
    examples: [
      { input: "activities = [(1,3),(2,5),(4,6),(6,7),(5,8),(8,9)]", output: "4", explain: "pick (1,3),(4,6),(6,7),(8,9)" },
      { input: "activities = [(1,2),(3,4),(2,3)]", output: "3" },
    ],
    why: "Sort by finish time enables the greedy: the earliest-finishing activity leaves the MOST remaining time for other activities. This is the canonical sorting-enabled greedy problem.",
    starterCode: "def activity_selection(activities):\n    activities.sort(key=lambda x: x[1])\n    count = 0\n    last_end = -1\n    pass",
    hints: [
      "Sort by finish time (second element). Initialize last_end = -inf. For each activity: if start >= last_end, pick it, update last_end = finish.",
      "Why NOT sort by start? [1,100],[2,3],[4,5] — start-sorted picks [1,100] and misses the other two. Count-sorted (shortest first) also fails.",
      "Earliest finish maximizes remaining time. Proof in Stage 2."
    ],
    solution: "def activity_selection(activities):\n    activities.sort(key=lambda x: x[1])\n    count = 0\n    last_end = float('-inf')\n    for start, end in activities:\n        if start >= last_end:\n            count += 1\n            last_end = end\n    return count",
    walkthrough: "Sort by end time ascending. The earliest-finishing activity is always a safe pick — taking it leaves maximum room for future activities. Iterate: if current start >= last_end, accept it. This single linear scan after sorting produces the optimal selection. O(n log n).",
    testCode: "assert activity_selection([(1,3),(2,5),(4,6),(6,7),(5,8),(8,9)]) == 4\nassert activity_selection([(1,2),(3,4),(2,3)]) == 3\nassert activity_selection([(1,4),(2,3),(3,5)]) == 2\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 1, title: "N Meetings in One Room", pattern: "sort by end, count compatible", skill: "same skeleton as activity selection",
    statement: "Given N meetings with start,end times and one room, find max number of meetings that can be held. Same pattern: sort by end, greedily pick.",
    examples: [
      { input: "meetings = [(1,2),(3,4),(0,6),(5,7),(8,9),(5,9)]", output: "4" },
      { input: "meetings = [(2,4),(1,3),(3,6),(5,6)]", output: "2", explain: "pick (1,3) and (3,6) or (2,4) and (4,5)" },
    ],
    why: "Identical to P6 with a different story (meetings instead of activities). Same thinking-move, different surface. This reinforces that the pattern is about the structure (intervals), not the story.",
    starterCode: "def max_meetings(meetings):\n    meetings.sort(key=lambda x: x[1])\n    count = 0\n    last_end = -1\n    pass",
    hints: [
      "Exact same code as activity selection. Sort by end time.",
      "Can you hold a meeting that starts at exactly the same time the previous ends? Yes — they don't overlap.",
      "Each meeting is (start, end). Pick if start >= last_end."
    ],
    solution: "def max_meetings(meetings):\n    meetings.sort(key=lambda x: x[1])\n    count = 0\n    last_end = -1\n    for start, end in meetings:\n        if start >= last_end:\n            count += 1\n            last_end = end\n    return count",
    walkthrough: "Same skeleton as P6. Sort by end. Scan linearly. The underlying structure (interval non-overlap maximization) is identical regardless of whether you call them activities or meetings. Surface variation with deep-structure constancy.",
    testCode: "assert max_meetings([(1,2),(3,4),(0,6),(5,7),(8,9),(5,9)]) == 4\nassert max_meetings([(2,4),(1,3),(3,6),(5,6)]) == 2\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Minimum Arrows to Burst Balloons", pattern: "sort by end, count bursts", skill: "greedy overlap grouping by end point",
    statement: "Balloons on a number line, each [start, end]. One arrow at x bursts all balloons with start <= x <= end. Find minimum arrows. Sort by end: fire arrow at earliest end; all balloons overlapping at that point burst together.",
    examples: [
      { input: "points = [[10,16],[2,8],[1,6],[7,12]]", output: "2", explain: "arrow at 6 bursts [1,6],[2,8]; arrow at 12 bursts [10,16],[7,12]" },
      { input: "points = [[1,2],[3,4],[5,6],[7,8]]", output: "4" },
    ],
    why: "Sort by end again. The greedy: fire an arrow at the earliest end point. All balloons with start <= arrow_pos burst. Move to the next unburst balloon's end. Same sorting trick, different 'count groups' logic.",
    starterCode: "def min_arrows(points):\n    points.sort(key=lambda x: x[1])\n    arrows = 0\n    arrow_pos = float('-inf')\n    pass",
    hints: [
      "Sort by end coordinate. Fire arrow at the earliest balloon's end. How many balloons does this burst?",
      "All balloons whose start <= arrow_pos will burst at this position.",
      "Skip burst balloons. Move to the next unburst balloon, fire at its end. Repeat."
    ],
    solution: "def min_arrows(points):\n    points.sort(key=lambda x: x[1])\n    arrows = 0\n    arrow_pos = float('-inf')\n    for start, end in points:\n        if start > arrow_pos:\n            arrows += 1\n            arrow_pos = end\n    return arrows",
    walkthrough: "Sort by end. Track arrow_pos (last arrow's x-coordinate). For each balloon: if start > arrow_pos, this balloon isn't burst yet — fire a new arrow at its end. All balloons that start <= current end will be burst by previous arrows. O(n log n).",
    testCode: "assert min_arrows([[10,16],[2,8],[1,6],[7,12]]) == 2\nassert min_arrows([[1,2],[3,4],[5,6],[7,8]]) == 4\nassert min_arrows([[1,2],[2,3],[3,4],[4,5]]) == 2\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Erase Overlapping Intervals", pattern: "sort by end, remove overlapping", skill: "remove the longer/conflicting interval",
    statement: "Given intervals, return minimum number to remove to make the rest non-overlapping. Sort by end: when two intervals overlap, remove the one that ends LATER (it's more likely to overlap with others).",
    examples: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: "1", explain: "remove [1,3]" },
      { input: "intervals = [[1,2],[1,2],[1,2]]", output: "2" },
    ],
    why: "Sort by end. When curr.start < prev.end (overlap), remove the later-ending one. This is the same greed: keep the earliest-finisher to maximize remaining space.",
    starterCode: "def erase_overlaps(intervals):\n    intervals.sort(key=lambda x: x[1])\n    count = 0\n    end = float('-inf')\n    pass",
    hints: [
      "Sort by end. Iterate: if start < end, there's an overlap — count it (remove current).",
      "If start >= end, no overlap — update end to current's end.",
      "Removing the later-ending interval maximizes remaining space. Equivalent to: keep the earliest-finishing when there's a conflict."
    ],
    solution: "def erase_overlaps(intervals):\n    intervals.sort(key=lambda x: x[1])\n    count = 0\n    end = float('-inf')\n    for start, e in intervals:\n        if start < end:\n            count += 1\n        else:\n            end = e\n    return count",
    walkthrough: "Sort by end. Track 'end' = end of last kept interval. If current.start < end, overlap — this current interval must be removed (count++). Why remove THIS and not the previous? Because sorted by end, current ends later — it's the worse choice for future space. O(n log n).",
    testCode: "assert erase_overlaps([[1,2],[2,3],[3,4],[1,3]]) == 1\nassert erase_overlaps([[1,2],[1,2],[1,2]]) == 2\nassert erase_overlaps([[1,2],[2,3]]) == 0\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Maximum Units on a Truck", pattern: "sort by value density", skill: "take boxes with most units first",
    statement: "You have boxTypes[i] = [numBoxes, unitsPerBox] and truckSize capacity. Maximize total units. Greedy: sort by unitsPerBox descending, take as many boxes as fit.",
    examples: [
      { input: "boxTypes = [[1,3],[2,2],[3,1]], truckSize = 4", output: "8", explain: "take 1 box of type 0 (3 units) + 2 boxes of type 1 (4 units) + 1 box of type 2 (1 unit) = 8" },
      { input: "boxTypes = [[5,10],[2,5],[4,7],[3,9]], truckSize = 10", output: "91" },
    ],
    why: "Sort by value-per-unit (unitsPerBox) descending. Always take the most valuable boxes first. This is the fractional knapsack greedy applied to discrete items with identical items per type.",
    starterCode: "def maximum_units(box_types, truck_size):\n    box_types.sort(key=lambda x: x[1], reverse=True)\n    total = 0\n    pass",
    hints: [
      "Sort descending by unitsPerBox. For each type: take = min(numBoxes, remaining_capacity).",
      "Add take * unitsPerBox to total. Subtract take from capacity.",
      "Stop when capacity reaches 0."
    ],
    solution: "def maximum_units(box_types, truck_size):\n    box_types.sort(key=lambda x: x[1], reverse=True)\n    total = 0\n    for count, units in box_types:\n        take = min(count, truck_size)\n        total += take * units\n        truck_size -= take\n        if truck_size == 0:\n            break\n    return total",
    walkthrough: "Sort descending by units-per-box. Iterate: take as many boxes of current type as fit. Add units to total, subtract from capacity. When truck full, stop. This works because taking a box with fewer units when a higher-unit box is available is never beneficial.",
    testCode: "assert maximum_units([[1,3],[2,2],[3,1]], 4) == 8\nassert maximum_units([[5,10],[2,5],[4,7],[3,9]], 10) == 91\nprint('All tests passed!')"
  },

  // ── STAGE 2: The Proof Habit ──
  {
    id: 11, stage: 2, title: "Why Earliest Finish Wins", pattern: "exchange argument", skill: "prove that swapping any optimal solution to include earliest-finishing never hurts",
    statement: "Prove: in activity selection, there exists an optimal solution that includes the earliest-finishing activity. Write code to verify: among all optimal solutions, check that one uses earliest finish.",
    examples: [
      { input: "activities = [(1,4),(3,5),(0,6),(5,7),(3,9),(5,9),(6,10),(8,11),(8,12),(2,14),(12,16)]", output: "True", explain: "demonstrate that an optimal includes earliest finish" },
    ],
    why: "Proof builds conviction. Exchange argument: take any optimal solution O. If O's first activity is NOT the earliest-finishing a1, replace O[0] with a1. a1 finishes <= O[0]'s finish, so no new overlaps introduced.",
    starterCode: "def verify_earliest_finish_proof(activities):\n    def find_optimal_sets(acts):\n        pass\n    pass",
    hints: [
      "Write exhaustive search to find ALL optimal solutions (all max-size non-overlapping subsets).",
      "Check if at least one optimal solution includes the globally earliest-finishing activity.",
      "The exchange argument: replace first activity in any optimal with earliest-finishing; set remains valid and same size."
    ],
    solution: "def verify_earliest_finish_proof(activities):\n    n = len(activities)\n    acts = sorted(activities, key=lambda x: x[1])\n    earliest = acts[0]\n    best_size = 0\n    best_sets = []\n    def backtrack(idx, chosen, last_end):\n        nonlocal best_size, best_sets\n        if idx == n:\n            if len(chosen) > best_size:\n                best_size = len(chosen)\n                best_sets = [chosen[:]]\n            elif len(chosen) == best_size:\n                best_sets.append(chosen[:])\n            return\n        start, end = acts[idx]\n        if start >= last_end:\n            backtrack(idx + 1, chosen + [acts[idx]], end)\n        backtrack(idx + 1, chosen, last_end)\n    backtrack(0, [], float('-inf'))\n    for opt in best_sets:\n        if earliest in opt:\n            return True\n    return False",
    walkthrough: "Exhaustively enumerate all non-overlapping subsets to find all optimal (max-size) solutions. Then check: does at least one optimal solution contain the earliest-finishing activity? The exchange argument proves yes — we can always swap without loss.",
    testCode: "acts = [(1,4),(3,5),(0,6),(5,7),(3,9),(5,9),(6,10),(8,11),(8,12),(2,14),(12,16)]\nassert verify_earliest_finish_proof(acts) == True\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 2, title: "Exchange Proof Step by Step", pattern: "proof walkthrough", skill: "formalize: (1) take optimal O, (2) replace with greedy, (3) show no loss",
    statement: "Formally describe the exchange argument for activity selection. Then implement a function that, given activities and an optimal solution, PRODUCES another optimal solution that starts with the earliest-finishing activity.",
    examples: [
      { input: "activities = [(1,5),(3,6),(2,4)]", output: "solution using earliest-finish (2,4)" },
    ],
    why: "Making the proof constructive (code that transforms one optimal into another) deepens understanding beyond verbal argument. The code IS the proof.",
    starterCode: "def exchange_transform(activities, optimal_solution):\n    earliest = min(activities, key=lambda x: x[1])\n    pass",
    hints: [
      "Find the globally earliest-finishing activity. If optimal already contains it, return optimal unchanged.",
      "Otherwise: swap out optimal's first activity for the earliest-finishing one.",
      "Show the new set is still valid (earliest finishes earlier, so no new overlaps) and still optimal (same size, valid)."
    ],
    solution: "def exchange_transform(activities, optimal_solution):\n    earliest = min(activities, key=lambda x: x[1])\n    if optimal_solution[0] == earliest:\n        return optimal_solution\n    new_sol = [earliest] + optimal_solution[1:]\n    for i in range(1, len(new_sol)):\n        if new_sol[i-1][1] > new_sol[i][0]:\n            return None\n    return new_sol",
    walkthrough: "Step 1: identify earliest-finishing activity. Step 2: replace the first element of the optimal solution with it. Step 3: verify the new sequence is still non-overlapping (earliest finishes earlier or equal, so any overlap it had with original[1] is now smaller). Same size, still valid → optimal.",
    testCode: "acts = [(1,5),(3,6),(2,4)]\nopt = [(1,5)]\nnew_opt = exchange_transform(acts, opt)\nassert new_opt == [(2,4)]\nassert all(new_opt[i-1][1] <= new_opt[i][0] for i in range(1, len(new_opt)))\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 2, title: "Can We Replace First? Induction Sketch", pattern: "inductive proof", skill: "prove that after picking earliest-finish, the subproblem is activity selection on compatible remaining activities",
    statement: "After picking the earliest-finishing activity a1, the remaining problem is: select max activities from those starting after a1.finish. Prove by induction: the greedy choice + optimal solution to the remainder = optimal solution to the whole.",
    examples: [
      { input: "activities = [(1,3),(2,5),(4,6)]", output: "True", explain: "earliest finish (1,3) + optimal of remainder [(4,6)] = optimal" },
    ],
    why: "The inductive structure guarantees correctness: after the first greedy choice, the remaining problem has the same structure as the original. Induction on problem size closes the proof.",
    starterCode: "def verify_induction_step(activities):\n    acts = sorted(activities, key=lambda x: x[1])\n    pass",
    hints: [
      "Pick a1 = earliest-finishing. Remove all activities that overlap with a1. The remainder is a smaller activity selection problem.",
      "By induction hypothesis, greedy on remainder is optimal. So greedy on original = a1 + greedy(remainder).",
      "Code it: greedy_pick = [a1] + optimal_greedy(remaining). Compare against exhaustive optimal."
    ],
    solution: "def verify_induction_step(activities):\n    def greedy(acts):\n        acts = sorted(acts, key=lambda x: x[1])\n        res = []\n        end = float('-inf')\n        for s, e in acts:\n            if s >= end:\n                res.append((s, e))\n                end = e\n        return res\n    def optimal_size(acts):\n        if not acts:\n            return 0\n        acts = sorted(acts, key=lambda x: x[1])\n        n = len(acts)\n        def backtrack(i, last_end):\n            if i == n:\n                return 0\n            s, e = acts[i]\n            take = 0\n            if s >= last_end:\n                take = 1 + backtrack(i + 1, e)\n            skip = backtrack(i + 1, last_end)\n            return max(take, skip)\n        return backtrack(0, float('-inf'))\n    return len(greedy(activities)) == optimal_size(activities)",
    walkthrough: "Induction: (1) greedy picks a1 (earliest finish). (2) The remaining subproblem is activity selection on compatible activities — exactly the same problem structure, smaller instance. (3) By induction, greedy is optimal on the smaller instance. (4) Therefore greedy on original is optimal.",
    testCode: "assert verify_induction_step([(1,3),(2,5),(4,6)]) == True\nassert verify_induction_step([(1,2),(3,4),(2,3)]) == True\nassert verify_induction_step([(5,9),(1,2),(3,4),(0,6)]) == True\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 2, title: "Why Sort by Finish (Not Start, Not Duration)", pattern: "counterexample analysis", skill: "demonstrate why start-sort and duration-sort fail with minimal counterexamples",
    statement: "Show minimal counterexamples for (a) sort by start time, and (b) sort by duration (shortest first). Prove neither works for activity selection.",
    examples: [
      { input: "activities = [(1,10),(2,3),(4,5)]", output: "start-sort picks (1,10), optimal picks (2,3),(4,5)" },
      { input: "activities = [(1,4),(3,5),(4,6)]", output: "duration-sort picks (3,5) or (4,6) length 2, optimal is (1,4),(4,6) length 2 — actually tie here" },
    ],
    why: "Negative examples seal the proof. Seeing WHY alternatives fail makes the correct choice memorable. The key: finish time is the right bottleneck because it determines remaining capacity.",
    starterCode: "def demonstrate_sort_failures(activities):\n    def greedy_by_start(acts):\n        pass\n    def greedy_by_duration(acts):\n        pass\n    pass",
    hints: [
      "Start-sort: pick (1,10), eat all time, fail. Counterexample: [(1,10), (2,3), (4,5)].",
      "Duration-sort: pick (7,8) from [(1,3),(2,4),(7,8)] — 1 activity. Optimal: (1,3),(7,8) — 2 activities.",
      "Sort-by-finish always finds the optimum. The counterexamples prove the other sorts are insufficient."
    ],
    solution: "def demonstrate_sort_failures(activities):\n    def pick_by_sort(acts, sort_key):\n        acts = sorted(acts, key=sort_key)\n        res = []\n        end = float('-inf')\n        for a in acts:\n            if a[0] >= end:\n                res.append(a)\n                end = a[1]\n        return len(res)\n    def optimal_count(acts):\n        acts = sorted(acts, key=lambda x: x[1])\n        n = len(acts)\n        def dfs(i, last_end):\n            if i == n:\n                return 0\n            s, e = acts[i]\n            take = 0 if s < last_end else 1 + dfs(i + 1, e)\n            return max(take, dfs(i + 1, last_end))\n        return dfs(0, float('-inf'))\n    start_score = pick_by_sort(activities, lambda x: x[0])\n    duration_score = pick_by_sort(activities, lambda x: x[1] - x[0])\n    finish_score = pick_by_sort(activities, lambda x: x[1])\n    opt = optimal_count(activities)\n    return {'start': start_score, 'duration': duration_score, 'finish': finish_score, 'optimal': opt}",
    walkthrough: "Three greedy strategies compared against optimal: start-sort, duration-sort, finish-sort. Only finish-sort matches optimal for all inputs. The counterexamples show: start-sort blocks future activities; duration-sort ignores positioning. Finish-time directly encodes 'how much future remains.'",
    testCode: "result = demonstrate_sort_failures([(1,10),(2,3),(4,5)])\nassert result['finish'] == result['optimal']\nassert result['start'] < result['optimal'] or result['start'] == result['optimal']\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Greedy Stays Ahead (Formal)", pattern: "greedy-stays-ahead argument", skill: "prove that at each step, greedy's choice is at least as good as any alternative",
    statement: "For activity selection, prove greed stays ahead: let G be greedy picks, O be any optimal with same size. Prove that for each i, end_time(G[i]) <= end_time(O[i]). Write code to verify this invariant holds.",
    examples: [
      { input: "activities = [(1,3),(2,4),(3,5),(4,6)]", output: "True", explain: "G=[1,3],[3,5]; O=(same); invariant holds trivially" },
    ],
    why: "'Greedy stays ahead' is the standard proof technique: at each step, the greedy solution is no worse than the optimal. Code that checks the invariant at each step makes the proof tangible.",
    starterCode: "def verify_stays_ahead(activities):\n    acts = sorted(activities, key=lambda x: x[1])\n    pass",
    hints: [
      "Run greedy to get G (the activities picked). Find ANY optimal O of same size via exhaustive search.",
      "Compare end times: for i in range(len(G)), check end(G[i]) <= end(O[i]).",
      "If the invariant holds for all i, greedy is correct. This is the 'stays ahead' proof."
    ],
    solution: "def verify_stays_ahead(activities):\n    acts = sorted(activities, key=lambda x: x[1])\n    def greedy(act_list):\n        res = []\n        end = float('-inf')\n        for a in act_list:\n            if a[0] >= end:\n                res.append(a)\n                end = a[1]\n        return res\n    G = greedy(acts)\n    n = len(acts)\n    def find_optimal(i, last_end, chosen):\n        if i == n:\n            return [chosen[:]] if len(chosen) == len(G) else []\n        results = []\n        s, e = acts[i]\n        if s >= last_end:\n            results.extend(find_optimal(i + 1, e, chosen + [acts[i]]))\n        results.extend(find_optimal(i + 1, last_end, chosen))\n        return results\n    optimals = find_optimal(0, float('-inf'), [])\n    for O in optimals:\n        if len(O) == len(G):\n            ok = all(G[i][1] <= O[i][1] for i in range(len(G)))\n            if ok:\n                return True\n    return len(G) == 0",
    walkthrough: "Greedy stays ahead: by construction, G[i] is the earliest-finishing activity among all activities compatible with G[0..i-1]. Any optimal O of same size must have O[i] finishing no earlier than G[i]. If true for all i, greedy is optimal. Code enumerates optimal sets and checks the invariant.",
    testCode: "assert verify_stays_ahead([(1,3),(2,4),(3,5),(4,6)]) == True\nassert verify_stays_ahead([(1,2),(3,4),(2,3)]) == True\nprint('All tests passed!')"
  },

  // ── STAGE 3: Frontier Patterns ──
  {
    id: 16, stage: 3, title: "Jump Game I — Can Reach Last", pattern: "frontier expansion", skill: "track reachable frontier; if frontier >= last, success",
    statement: "Given array nums where nums[i] = max jump length from i, return True if you can reach the last index starting from index 0. Greedy: track the furthest index reachable at each step.",
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "True", explain: "jump 0->1->4" },
      { input: "nums = [3,2,1,0,4]", output: "False", explain: "gets stuck at index 3 (can't jump from 0)" },
    ],
    why: "The frontier pattern: maintain 'max reach so far.' At each position, if you can GET there (i <= reach), update reach = max(reach, i + nums[i]). If reach >= last, success.",
    starterCode: "def can_jump(nums):\n    reach = 0\n    pass",
    hints: [
      "reach = maximum index achievable from visited positions. Start at 0.",
      "For each position i <= reach: update reach = max(reach, i + nums[i]). If reach >= last, return True.",
      "This is O(n) because you only visit positions within reach."
    ],
    solution: "def can_jump(nums):\n    reach = 0\n    n = len(nums)\n    for i in range(n):\n        if i > reach:\n            return False\n        reach = max(reach, i + nums[i])\n        if reach >= n - 1:\n            return True\n    return True",
    walkthrough: "Track the furthest reachable index (frontier). At step i: if i > frontier, we're stuck — can't reach i. Otherwise, expand frontier = max(frontier, i + nums[i]). If frontier ever reaches/passes last index, success. O(n) single pass.",
    testCode: "assert can_jump([2,3,1,1,4]) == True\nassert can_jump([3,2,1,0,4]) == False\nassert can_jump([0]) == True\nassert can_jump([1,0,1,0]) == False\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 3, title: "Jump Game II — Minimum Jumps", pattern: "greedy BFS layers", skill: "count BFS levels on implicit graph; at each level, track furthest reachable in next level",
    statement: "Given nums (guaranteed reachable last index), return minimum number of jumps. Greedy BFS: each jump defines a BFS level. Track current_level_end and furthest_next. When i == current_level_end, increment jumps.",
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "2", explain: "0->1->4 (jump 2 from 0 to index 1, then jump 3 to index 4)" },
      { input: "nums = [2,3,0,1,4]", output: "2" },
    ],
    why: "Each 'jump' is a BFS level. All indices reachable in the current number of jumps form a contiguous range. When you exhaust that range, you increment jumps and the next range is everything the frontier can reach.",
    starterCode: "def jump_game_min(nums):\n    jumps = 0\n    cur_end = 0\n    farthest = 0\n    pass",
    hints: [
      "Three variables: jumps (count), cur_end (end of current BFS level), farthest (furthest reach from current level).",
      "Iterate i from 0 to n-2 (last index doesn't need a jump from it). At each i: farthest = max(farthest, i + nums[i]).",
      "When i == cur_end: we've exhausted current level. jumps++. cur_end = farthest."
    ],
    solution: "def jump_game_min(nums):\n    jumps = 0\n    cur_end = 0\n    farthest = 0\n    n = len(nums)\n    for i in range(n - 1):\n        farthest = max(farthest, i + nums[i])\n        if i == cur_end:\n            jumps += 1\n            cur_end = farthest\n    return jumps",
    walkthrough: "Implicit BFS on reachability graph. cur_end marks the boundary of 'all positions reachable in current jumps.' farthest tracks the most distant position reachable from within the current BFS level. When i hits cur_end, all positions in the current level are processed — jump count increments, and the next level's boundary becomes farthest. O(n).",
    testCode: "assert jump_game_min([2,3,1,1,4]) == 2\nassert jump_game_min([2,3,0,1,4]) == 2\nassert jump_game_min([1,2,3]) == 2\nassert jump_game_min([0]) == 0\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 3, title: "Gas Station", pattern: "tank balance + restart", skill: "if tank < 0, restart from next station; track total deficit",
    statement: "Gas stations on a circle: gas[i] available, cost[i] to go from i to i+1 (mod n). Return starting index to complete circuit, or -1 if impossible. Greedy: if tank becomes negative, restart from i+1 and reset tank. At end, if total >= 0, restart index works.",
    examples: [
      { input: "gas = [1,2,3,4,5], cost = [3,4,5,1,2]", output: "3", explain: "start at 3: 4-1=3; 5-2=6; 1-3=4; 2-4=2; 3-5=0" },
      { input: "gas = [2,3,4], cost = [3,4,3]", output: "-1" },
    ],
    why: "If total gas >= total cost, a solution exists. The greedy: if from A to B the tank goes negative, no station between A and B can be the start (arriving with >= 0 tank is impossible). Restart from B+1.",
    starterCode: "def can_complete_circuit(gas, cost):\n    total = tank = start = 0\n    pass",
    hints: [
      "Track total gas - total cost (must be >= 0). Track current tank from the start candidate.",
      "If tank < 0 at any point: the start candidate fails. Set start = i + 1, reset tank = 0.",
      "Why can we skip all stations from start to i? Because reaching each required tank >= 0; if it fails at i, earlier starts fail earlier."
    ],
    solution: "def can_complete_circuit(gas, cost):\n    total = tank = start = 0\n    for i in range(len(gas)):\n        net = gas[i] - cost[i]\n        total += net\n        tank += net\n        if tank < 0:\n            start = i + 1\n            tank = 0\n    return start if total >= 0 else -1",
    walkthrough: "Two variables: total (global gas-cost balance) and tank (since current start). When tank < 0, reset: start = i+1, tank = 0. After loop: if total < 0, impossible. Otherwise, start is valid. O(n) single pass.",
    testCode: "assert can_complete_circuit([1,2,3,4,5], [3,4,5,1,2]) == 3\nassert can_complete_circuit([2,3,4], [3,4,3]) == -1\nassert can_complete_circuit([5,1,2,3,4], [4,4,1,5,1]) == 4\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 3, title: "Candy Distribution (Two Pass)", pattern: "left-to-right then right-to-left pass", skill: "satisfy left-neighbor and right-neighbor constraints separately",
    statement: "N children with ratings. Give each at least 1 candy. If rating[i] > rating[i-1], child[i] gets more than child[i-1]. Same for i+1. Minimize total candy. Two-pass greedy: left->right ensures right-constraint, right->left ensures left-constraint.",
    examples: [
      { input: "ratings = [1,0,2]", output: "5", explain: "child 0=2, child 1=1, child 2=2 -> 5" },
      { input: "ratings = [1,2,2]", output: "4", explain: "1+2+1=4" },
    ],
    why: "Two independent constraints (left neighbor, right neighbor). Solve separately: left pass ensures 'higher rating > higher on left' constraint; right pass does the same for right neighbor. The max at each position satisfies both.",
    starterCode: "def min_candy(ratings):\n    n = len(ratings)\n    candies = [1] * n\n    pass",
    hints: [
      "Left pass (1 to n-1): if ratings[i] > ratings[i-1], candies[i] = candies[i-1] + 1.",
      "Right pass (n-2 to 0): if ratings[i] > ratings[i+1], candies[i] = max(candies[i], candies[i+1] + 1).",
      "Sum candies. The max ensures both constraints are satisfied."
    ],
    solution: "def min_candy(ratings):\n    n = len(ratings)\n    candies = [1] * n\n    for i in range(1, n):\n        if ratings[i] > ratings[i - 1]:\n            candies[i] = candies[i - 1] + 1\n    for i in range(n - 2, -1, -1):\n        if ratings[i] > ratings[i + 1]:\n            candies[i] = max(candies[i], candies[i + 1] + 1)\n    return sum(candies)",
    walkthrough: "Left pass: if rating goes up from left, give one more candy than left neighbor. Right pass: if rating goes up from right, take max(current, right+1). Each position now satisfies both constraints. O(n). The two passes are independent — the max operation merges them without conflict.",
    testCode: "assert min_candy([1,0,2]) == 5\nassert min_candy([1,2,2]) == 4\nassert min_candy([1,3,2,2,1]) == 7\nassert min_candy([1]) == 1\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 3, title: "Assign Cookies", pattern: "sort both, assign smallest cookie to least greedy child", skill: "match sorted arrays greedily",
    statement: "Children have greed factors g[]. Cookies have sizes s[]. A child is content if s[j] >= g[i]. Maximize content children. Greedy: sort both, assign smallest sufficient cookie to the least greedy child.",
    examples: [
      { input: "g = [1,2,3], s = [1,1]", output: "1", explain: "cookie size 1 satisfies child greed 1" },
      { input: "g = [1,2], s = [1,2,3]", output: "2" },
    ],
    why: "Sorting enables matching: give the smallest cookie that satisfies the least greedy child. This leaves larger cookies for greedier children — the same 'hoard expensive resources' pattern as lemonade change.",
    starterCode: "def find_content_children(g, s):\n    g.sort()\n    s.sort()\n    child = cookie = 0\n    pass",
    hints: [
      "Sort both arrays. Use two pointers: child and cookie.",
      "If s[cookie] >= g[child]: child is satisfied, advance both pointers.",
      "Otherwise: cookie too small, try next cookie (advance cookie pointer)."
    ],
    solution: "def find_content_children(g, s):\n    g.sort()\n    s.sort()\n    child = cookie = 0\n    while child < len(g) and cookie < len(s):\n        if s[cookie] >= g[child]:\n            child += 1\n        cookie += 1\n    return child",
    walkthrough: "Two-pointer matching. Both sorted ascending. Smallest greed gets smallest sufficient cookie. If cookie too small for current child, discard it — it won't help greedier children either. The pointer advancing counts content children. O(n log n) for sorts.",
    testCode: "assert find_content_children([1,2,3], [1,1]) == 1\nassert find_content_children([1,2], [1,2,3]) == 2\nassert find_content_children([10,9,8,7], [5,6,7,8]) == 2\nprint('All tests passed!')"
  },

  // ── STAGE 4: Naive ──
  {
    id: 21, stage: 4, title: "Jump Game II — DP Solution (Naive)", pattern: "DP: dp[i] = min jumps to i", skill: "dp[i] = 1 + min(dp[j]) for all j that can reach i",
    statement: "Solve Jump Game II with DP: dp[i] = minimum jumps to reach i. For each i, check all previous j: if j + nums[j] >= i, dp[i] = min(dp[i], dp[j] + 1). O(n²).",
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "2" },
      { input: "nums = [2,3,0,1,4]", output: "2" },
    ],
    why: "The DP approach is O(n²) — for each position, scan all previous positions. This makes the redundancy visible: many positions are checked but most can never be optimal starts for later positions.",
    starterCode: "def jump_dp(nums):\n    n = len(nums)\n    dp = [float('inf')] * n\n    dp[0] = 0\n    pass",
    hints: [
      "dp[i] = min jumps to reach index i. dp[0] = 0.",
      "For each i: for each j < i, if j + nums[j] >= i (j can reach i), dp[i] = min(dp[i], dp[j] + 1).",
      "This is O(n²). The waste: scanning every j < i even when not needed."
    ],
    solution: "def jump_dp(nums):\n    n = len(nums)\n    dp = [float('inf')] * n\n    dp[0] = 0\n    for i in range(1, n):\n        for j in range(i):\n            if j + nums[j] >= i:\n                dp[i] = min(dp[i], dp[j] + 1)\n    return dp[n - 1]",
    walkthrough: "DP fills dp[i] = minimum jumps to i. For each i, scan j from 0 to i-1. If j can jump to i (j + nums[j] >= i), consider dp[j] + 1. This is exhaustive but wasteful — it scans positions that are far behind and can never be useful starts.",
    testCode: "assert jump_dp([2,3,1,1,4]) == 2\nassert jump_dp([2,3,0,1,4]) == 2\nassert jump_dp([1,2,3]) == 2\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 4, title: "Activity Selection — DP Solution", pattern: "DP: dp[i] = max activities ending at or before i", skill: "exhaustive DP then contrast with greedy",
    statement: "Solve activity selection with DP: sort by end time. dp[i] = max(dp[i-1], 1 + dp[last_non_overlapping(i)]). O(n log n) for binary search + DP. Compare output and time with greedy O(n).",
    examples: [
      { input: "activities = [(1,3),(2,5),(4,6),(6,7)]", output: "3" },
    ],
    why: "The DP solution is valid but heavier. Greedy achieves O(n) after sorting. Comparing the two makes the 'waste' of DP visible — tracking overlapping via binary search when a single pointer suffices.",
    starterCode: "def activity_selection_dp(activities):\n    acts = sorted(activities, key=lambda x: x[1])\n    n = len(acts)\n    dp = [0] * n\n    pass",
    hints: [
      "Sort by end. dp[i] = max activities using first i+1 activities.",
      "For each activity i: binary search the latest activity j whose end <= start_i. If found, dp[i] = max(dp[i-1], 1 + dp[j]).",
      "This is the classic 'weighted interval scheduling' DP. Compare with greedy's simple linear scan."
    ],
    solution: "def activity_selection_dp(activities):\n    acts = sorted(activities, key=lambda x: x[1])\n    n = len(acts)\n    dp = [0] * n\n    ends = [a[1] for a in acts]\n    import bisect\n    for i in range(n):\n        j = bisect.bisect_right(ends, acts[i][0]) - 1\n        take = 1 + (dp[j] if j >= 0 else 0)\n        skip = dp[i - 1] if i > 0 else 0\n        dp[i] = max(take, skip)\n    return dp[-1] if n > 0 else 0",
    walkthrough: "DP with binary search: for activity i, find the last activity j that doesn't overlap (end_j <= start_i). dp[i] = max(taking i (1 + dp[j]) or skipping i (dp[i-1])). O(n log n). Greedy: same sort, then linear scan — O(n log n) for sort but simpler code.",
    testCode: "acts = [(1,3),(2,5),(4,6),(6,7)]\nassert activity_selection_dp(acts) == 3\nacts2 = [(1,2),(3,4),(2,3)]\nassert activity_selection_dp(acts2) == 3\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 4, title: "Maximum Profit — DP Stock Trading", pattern: "DP: max profit from one transaction", skill: "dp[i] = max profit ending at i; scan all prior prices",
    statement: "Given prices array, find max profit from one buy-sell transaction. Naive DP: for each day i, check all previous days j < i, profit = prices[i] - prices[j], track max. O(n²).",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5", explain: "buy at 1, sell at 6" },
      { input: "prices = [7,6,4,3,1]", output: "0" },
    ],
    why: "The O(n²) scan reveals the waste: we recompute the minimum price so far at each i. A single variable tracking min_so_far eliminates the inner loop — the greedy replacement.",
    starterCode: "def max_profit_dp(prices):\n    max_p = 0\n    for i in range(len(prices)):\n        pass\n    return max_p",
    hints: [
      "For each sell day i, try all buy days j < i. max_p = max(max_p, prices[i] - prices[j]).",
      "This is O(n²). The inner loop recomputes min_price — waste visible.",
      "The greedy version: single pass with min_price_so_far gives O(n)."
    ],
    solution: "def max_profit_dp(prices):\n    max_p = 0\n    n = len(prices)\n    for i in range(n):\n        for j in range(i):\n            profit = prices[i] - prices[j]\n            if profit > max_p:\n                max_p = profit\n    return max_p",
    walkthrough: "For each day i (sell), iterate j < i (buy) and compute profit. Track maximum. O(n²). The waste: we scan ALL previous days when only the minimum matters. Greedy replacement: maintain min_price_so_far in a single pass.",
    testCode: "assert max_profit_dp([7,1,5,3,6,4]) == 5\nassert max_profit_dp([7,6,4,3,1]) == 0\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 4, title: "Partition Labels — DP Solution", pattern: "DP: cut string where each char appears in only one partition", skill: "exhaustive DP then contrast with greedy last-occurrence",
    statement: "Given string s, partition into max number of parts where each letter appears in at most one part. Naive DP: for each possible cut point, check if partition is valid. O(n²) with set comparisons.",
    examples: [
      { input: "s = 'ababcbacadefegdehijhklij'", output: "[9,7,8]", explain: "parts: 'ababcbaca', 'defegde', 'hijhklij'" },
    ],
    why: "DP solution checks every possible cut, tracking character sets to validate partitions. The greed solution (Stage 5) uses last-occurrence map in O(n) — much cleaner.",
    starterCode: "def partition_labels_dp(s):\n    n = len(s)\n    pass",
    hints: [
      "DP: dp[i] = max partitions possible for s[i:]. For each cut j >= i, if s[i:j+1] is valid (no char appears outside this range), dp[i] = max(1 + dp[j+1]).",
      "A partition is valid if for every char in it, its first and last occurrence are within the partition.",
      "Precompute first and last positions of each character for O(1) validity check."
    ],
    solution: "def partition_labels_dp(s):\n    n = len(s)\n    first = {}\n    last = {}\n    for i, c in enumerate(s):\n        if c not in first:\n            first[c] = i\n        last[c] = i\n    dp = [0] * (n + 1)\n    cuts = [[] for _ in range(n + 1)]\n    for i in range(n - 1, -1, -1):\n        dp[i] = 0\n        cur_last = i\n        for j in range(i, n):\n            cur_last = max(cur_last, last[s[j]])\n            if cur_last == j:\n                if 1 + dp[j + 1] > dp[i]:\n                    dp[i] = 1 + dp[j + 1]\n                    cuts[i] = [j - i + 1] + cuts[j + 1]\n    return cuts[0] if n > 0 else []",
    walkthrough: "DP: try each possible end j for a partition starting at i. A partition s[i:j+1] is valid if the last occurrence of every character inside it is <= j. Precompute last occurrences. This is O(n²) but understandable. The greedy version (O(n)) updates current_end = max(current_end, last[s[i]]) as it iterates.",
    testCode: "assert partition_labels_dp('ababcbacadefegdehijhklij') == [9,7,8]\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 4, title: "Maximum Chain — DP", pattern: "DP on sorted pairs", skill: "dp[i] = 1 + max(dp[j] for j where end_j < start_i)",
    statement: "Given pairs of integers [a,b], form longest chain where each pair has end_i < start_{i+1}. Naive DP: sort by end, dp[i] = 1 + max(dp[j] where end_j < start_i). O(n²).",
    examples: [
      { input: "pairs = [[1,2],[2,3],[3,4]]", output: "2", explain: "[1,2]->[3,4]" },
      { input: "pairs = [[1,2],[7,8],[4,5]]", output: "3" },
    ],
    why: "Same structure as activity selection. DP: for each pair, scan ALL previous non-overlapping pairs. Waste: we re-check all pairs when greedy's 'pick earliest finish compatible' would give O(n log n).",
    starterCode: "def max_chain_dp(pairs):\n    pairs.sort(key=lambda x: x[1])\n    n = len(pairs)\n    dp = [1] * n\n    pass",
    hints: [
      "Sort by end. dp[i] = longest chain ending at pair i. Initialize all dp[i] = 1.",
      "For each i, check all j < i: if pairs[j][1] < pairs[i][0], dp[i] = max(dp[i], dp[j] + 1).",
      "The waste: for each i, O(i) checks yields O(n²). Greedy gives O(n log n)."
    ],
    solution: "def max_chain_dp(pairs):\n    pairs.sort(key=lambda x: x[1])\n    n = len(pairs)\n    dp = [1] * n\n    for i in range(n):\n        for j in range(i):\n            if pairs[j][1] < pairs[i][0]:\n                dp[i] = max(dp[i], dp[j] + 1)\n    return max(dp) if n > 0 else 0",
    walkthrough: "DP: sort by end, then for each pair i, scan all previous j that end before i starts. dp[i] = longest chain ending at i. This is O(n²) — the LIS-style DP for pairs. Greedy alternative: sort by end, always pick the earliest-finishing compatible pair (1 pass).",
    testCode: "assert max_chain_dp([[1,2],[2,3],[3,4]]) == 2\nassert max_chain_dp([[1,2],[7,8],[4,5]]) == 3\nassert max_chain_dp([[5,9],[1,2],[4,6]]) == 2\nprint('All tests passed!')"
  },

  // ── STAGE 5: Optimization ──
  {
    id: 26, stage: 5, title: "Jump Game II — Greedy O(n)", pattern: "BFS levels with frontier greed", skill: "O(n) with cur_end and farthest tracking",
    statement: "Optimize Jump Game II to O(n). Replace DP's inner loop with greedy BFS levels: track cur_end (boundary of current BFS level) and farthest. When i == cur_end, increment jumps.",
    examples: [
      { input: "nums = [2,3,1,1,4]", output: "2" },
      { input: "nums = [2,3,0,1,4]", output: "2" },
    ],
    why: "DP wastes time scanning all previous positions. The forest of BFS levels replaces the inner loop with O(1) boundary checks. When i hits cur_end, we've exhausted the current BFS level.",
    starterCode: "def jump_game_greedy(nums):\n    jumps = 0\n    cur_end = 0\n    farthest = 0\n    pass",
    hints: [
      "Three variables: jumps count, cur_end (end of reachable region with current jumps), farthest (max reach from current level).",
      "For i in 0..n-2: farthest = max(farthest, i + nums[i]). When i == cur_end: jumps++, cur_end = farthest.",
      "This is O(n) because each element is visited once."
    ],
    solution: "def jump_game_greedy(nums):\n    jumps = 0\n    cur_end = 0\n    farthest = 0\n    n = len(nums)\n    for i in range(n - 1):\n        farthest = max(farthest, i + nums[i])\n        if i == cur_end:\n            jumps += 1\n            cur_end = farthest\n    return jumps",
    walkthrough: "The BFS implicit graph: positions 0..cur_end are reachable in 'jumps' jumps. As we iterate within the current level, farthest tracks the boundary of the NEXT level. When we hit cur_end, the level is exhausted — increment jumps, set cur_end = farthest. O(n). The DP's inner O(n) scan is replaced by O(1) boundary updates.",
    testCode: "assert jump_game_greedy([2,3,1,1,4]) == 2\nassert jump_game_greedy([2,3,0,1,4]) == 2\nassert jump_game_greedy([1,2,3,4,5]) == 3\nassert jump_game_greedy([0]) == 0\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 5, title: "Max Profit — One Pass Greedy", pattern: "track minimum so far", skill: "replace DP inner loop with min_so_far variable",
    statement: "Optimize max profit to O(n). Single pass: track min_price_so_far. At each day, profit_if_sell_today = price - min_price. Update max profit.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "5" },
      { input: "prices = [7,6,4,3,1]", output: "0" },
    ],
    why: "The O(n²) DP recalculates minimum price from scratch each day. min_price_so_far is a running track — updated in O(1) per step. The greed: the best buy for today is always the lowest price seen so far.",
    starterCode: "def max_profit_greedy(prices):\n    min_price = float('inf')\n    max_profit = 0\n    pass",
    hints: [
      "At day i: the best sell price is prices[i], the best buy price is min(prices[0..i-1]).",
      "Track min_price_so_far. For each price: profit = price - min_so_far; update max_profit. Update min_so_far = min(min_so_far, price).",
      "O(n) single pass. The greedy choice: always buy at the lowest price seen at the time of selling."
    ],
    solution: "def max_profit_greedy(prices):\n    min_price = float('inf')\n    max_profit = 0\n    for price in prices:\n        if price < min_price:\n            min_price = price\n        elif price - min_price > max_profit:\n            max_profit = price - min_price\n    return max_profit",
    walkthrough: "Single pass. min_price tracks the best buy price seen so far. At each day, potential profit = current price - min_price. Update max. The greedy insight: the optimal buy for any sell is the absolute minimum price before that day. One variable replaces the DP's inner loop.",
    testCode: "assert max_profit_greedy([7,1,5,3,6,4]) == 5\nassert max_profit_greedy([7,6,4,3,1]) == 0\nassert max_profit_greedy([1,2,3,4,5]) == 4\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 5, title: "Partition Labels — Last-Occurrence Greedy", pattern: "expand partition until the furthest last-occurrence", skill: "track current_end = max(last[s[i]]), cut when i == current_end",
    statement: "Given string s, partition into max number of parts where each letter in at most one part. Greedy: track last occurrence of each char. Iterate, expand current_end to max(last[char]). When i == current_end, cut partition. O(n).",
    examples: [
      { input: "s = 'ababcbacadefegdehijhklij'", output: "[9,7,8]" },
      { input: "s = 'eccbbbbdec'", output: "[10]" },
    ],
    why: "Replace DP's O(n²) with O(n). The greedy insight: a partition can only end at the furthest last-occurrence of all characters seen so far. When i reaches that furthest position, cut.",
    starterCode: "def partition_labels_greedy(s):\n    last = {c: i for i, c in enumerate(s)}\n    result = []\n    cur_end = 0\n    start = 0\n    pass",
    hints: [
      "Precompute last[c] = last index of character c. Iterate through string.",
      "At each position i, cur_end = max(cur_end, last[s[i]]).",
      "When i == cur_end, all characters in current partition stay within [start, i]. Cut: append i-start+1, set start = i+1."
    ],
    solution: "def partition_labels_greedy(s):\n    last = {c: i for i, c in enumerate(s)}\n    result = []\n    cur_end = 0\n    start = 0\n    for i, c in enumerate(s):\n        cur_end = max(cur_end, last[c])\n        if i == cur_end:\n            result.append(i - start + 1)\n            start = i + 1\n    return result",
    walkthrough: "Precompute last occurrence of each char. Iterate, expanding cur_end to furthest last-occurrence seen. When i reaches cur_end, all chars in the current window have their last occurrence <= i — meaning they don't appear outside this partition. Cut and continue. O(n) single pass.",
    testCode: "assert partition_labels_greedy('ababcbacadefegdehijhklij') == [9,7,8]\nassert partition_labels_greedy('eccbbbbdec') == [10]\nassert partition_labels_greedy('abc') == [1,1,1]\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 5, title: "Maximum Chain — Sort + Greedy Selection", pattern: "sort by end, pick earliest-finishing compatible", skill: "O(n log n) greed: sort by end, one-pass select",
    statement: "Optimize max chain to O(n log n). Sort pairs by end. Greedy: always pick the earliest-ending pair that is compatible (start > last_end). Same as activity selection.",
    examples: [
      { input: "pairs = [[1,2],[2,3],[3,4],[4,5]]", output: "4" },
      { input: "pairs = [[1,2],[7,8],[4,5]]", output: "3" },
    ],
    why: "Same pattern as activity selection (P6). DP O(n²) wastes inner loop. Greedy O(n log n): sort by end, single linear scan. The 'earliest finish' greed is optimal here too.",
    starterCode: "def max_chain_greedy(pairs):\n    pairs.sort(key=lambda x: x[1])\n    count = 0\n    last_end = float('-inf')\n    pass",
    hints: [
      "Sort by end (second element). Track last_end = end of last picked pair.",
      "For each pair: if start > last_end, pick it (count++, last_end = end).",
      "Same as activity selection (P6). The LIS-like DP was overkill — the greedy-choice property holds."
    ],
    solution: "def max_chain_greedy(pairs):\n    pairs.sort(key=lambda x: x[1])\n    count = 0\n    last_end = float('-inf')\n    for start, end in pairs:\n        if start > last_end:\n            count += 1\n            last_end = end\n    return count",
    walkthrough: "Sort by end. Iterate: if current pair starts after last_end, pick it and update last_end. This is the exact same greedy as activity selection — the earliest-finishing compatible pair leaves maximum room. O(n log n).",
     testCode: "assert max_chain_greedy([[1,2],[2,3],[3,4],[4,5]]) == 2\nassert max_chain_greedy([[1,2],[7,8],[4,5]]) == 3\nassert max_chain_greedy([[5,9],[1,2],[4,6]]) == 2\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 5, title: "Minimum Deletions to Make Non-Overlapping", pattern: "sort by end, count overlaps to remove", skill: "greedy selection of non-overlapping intervals",
    statement: "Given intervals, return min removals so rest are non-overlapping. Greedy O(n log n): sort by end, keep earliest-finishing, remove any interval that conflicts (start < prev_end).",
    examples: [
      { input: "intervals = [[1,2],[2,3],[3,4],[1,3]]", output: "1", explain: "remove [1,3]" },
      { input: "intervals = [[1,2],[1,2],[1,2]]", output: "2" },
    ],
    why: "Same as P9 but framed as 'removals = total - max_non_overlapping'. Compute max non-overlapping via activity selection, then removals = n - max.",
    starterCode: "def min_removals(intervals):\n    intervals.sort(key=lambda x: x[1])\n    keep = 0\n    last_end = float('-inf')\n    pass",
    hints: [
      "Maximum non-overlapping intervals = activity selection. Removals = total - kept.",
      "Sort by end. Count kept intervals (start >= last_end).",
      "Return len(intervals) - keep."
    ],
    solution: "def min_removals(intervals):\n    intervals.sort(key=lambda x: x[1])\n    keep = 0\n    last_end = float('-inf')\n    for start, end in intervals:\n        if start >= last_end:\n            keep += 1\n            last_end = end\n    return len(intervals) - keep",
    walkthrough: "Maximum non-overlapping intervals (activity selection) gives the number we CAN keep. Minimum to remove = total - kept. Sort by end, greedily select compatible intervals. O(n log n).",
    testCode: "assert min_removals([[1,2],[2,3],[3,4],[1,3]]) == 1\nassert min_removals([[1,2],[1,2],[1,2]]) == 2\nassert min_removals([[1,2],[2,3]]) == 0\nprint('All tests passed!')"
  },

  // ── STAGE 6: Mastery ──
  {
    id: 31, stage: 6, title: "Task Scheduler (Greedy + Heap)", pattern: "most-frequent-first scheduling with cooldown", skill: "use max-heap to always schedule the highest-frequency task available",
    statement: "Given tasks (A-Z) and cooldown n between same tasks, find minimum time to finish all. Greedy: use max-heap by frequency. At each time unit, schedule the highest-frequency available task. Use a cooldown queue for tasks in cooldown.",
    examples: [
      { input: "tasks = ['A','A','A','B','B','B'], n = 2", output: "8", explain: "A→B→idle→A→B→idle→A→B" },
      { input: "tasks = ['A','A','A','B','B','B'], n = 0", output: "6" },
    ],
    why: "Compose: greedy (largest-first from Stage 0) + heap data structure (for dynamic max retrieval). At each step, the greedy choice is task with highest remaining frequency. Heap maintains highest-freq, cooldown queue manages n-wait.",
    starterCode: "def task_scheduler(tasks, n):\n    import heapq\n    from collections import Counter, deque\n    freq = Counter(tasks)\n    heap = [-f for f in freq.values()]\n    heapq.heapify(heap)\n    cool = deque()\n    time = 0\n    pass",
    hints: [
      "Max-heap stores negative frequencies. At each time unit: pop the most frequent available task, decrement frequency, enqueue it in cooldown with (time + n).",
      "Coldown queue holds (ready_time, remaining_freq). When time == ready_time, push back to heap.",
      "If heap empty and cooldown not empty, add idle time (just increment time)."
    ],
    solution: "def task_scheduler(tasks, n):\n    import heapq\n    from collections import Counter, deque\n    freq = Counter(tasks)\n    heap = [-f for f in freq.values()]\n    heapq.heapify(heap)\n    cool = deque()\n    time = 0\n    while heap or cool:\n        time += 1\n        if heap:\n            f = -heapq.heappop(heap)\n            if f > 1:\n                cool.append((time + n, f - 1))\n        if cool and cool[0][0] == time:\n            heapq.heappush(heap, -cool.popleft()[1])\n    return time",
    walkthrough: "Max-heap by frequency. At each time unit: (1) if heap non-empty, schedule highest-freq task, reduce its count, add to cooldown with return time. (2) If cooldown front has tasks ready (time == ready_time), push back to heap. (3) If heap empty but cooldown not, idle time counts as 1 unit. Repeat until all tasks done. Compose: largest-first greed + heap + queue.",
    testCode: "assert task_scheduler(['A','A','A','B','B','B'], 2) == 8\nassert task_scheduler(['A','A','A','B','B','B'], 0) == 6\nassert task_scheduler(['A','A','A','A','A','A','B','C','D','E','F','G'], 2) == 16\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 6, title: "Reorganize String (Greedy + Heap)", pattern: "no-adjacent same char; always pick most-frequent different char", skill: "heap maintains max count; alternate with second-most if needed",
    statement: "Given string s, rearrange such that no two adjacent characters are the same. Return any valid string or '' if impossible. Greedy: always append the highest-frequency character that is NOT the last appended. Use heap.",
    examples: [
      { input: "s = 'aab'", output: "'aba'" },
      { input: "s = 'aaab'", output: "''", explain: "impossible — 3 'a's but only 1 'b'" },
    ],
    why: "Compose: largest-first greed (Stage 0) + adjacency constraint. At each step, pick the most-frequent char different from the last. Heap gives O(log k) for max retrieval. Need prev char tracking to avoid adjacency violation.",
    starterCode: "def reorganize_string(s):\n    from collections import Counter\n    import heapq\n    freq = Counter(s)\n    heap = [(-cnt, ch) for ch, cnt in freq.items()]\n    heapq.heapify(heap)\n    result = []\n    pass",
    hints: [
      "Pop most frequent char. If it matches the last appended, pop the NEXT most frequent instead (and push first back).",
      "After appending a char, if its remaining count > 0, push back to heap.",
      "If only one char remains and it matches the last, impossible — return ''."
    ],
    solution: "def reorganize_string(s):\n    from collections import Counter\n    import heapq\n    freq = Counter(s)\n    heap = [(-cnt, ch) for ch, cnt in freq.items()]\n    heapq.heapify(heap)\n    result = []\n    prev_cnt, prev_ch = 0, ''\n    while heap:\n        cnt, ch = heapq.heappop(heap)\n        result.append(ch)\n        if prev_cnt < 0:\n            heapq.heappush(heap, (prev_cnt, prev_ch))\n        prev_cnt, prev_ch = cnt + 1, ch\n    result = ''.join(result)\n    return result if len(result) == len(s) else ''",
    walkthrough: "Max-heap by frequency. Pop most frequent. If it matches the prev char (can't place adjacent), we'd pop the second-most instead — but the 'prev hold' technique: hold the previous char one step, push it back next iteration. This ensures no adjacency conflict. Compose: largest-first greed + adjacency awareness + heap.",
    testCode: "assert reorganize_string('aab') == 'aba'\nassert reorganize_string('aaab') == ''\nassert len(reorganize_string('aabbcc')) == 6\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 6, title: "Split Array into Consecutive Subsequences", pattern: "greedy allocation with frequency+append maps", skill: "at each number, decide whether to start new group or append to existing",
    statement: "Given sorted array nums, determine if it can be split into subsequences of consecutive integers, each length >= 3. Greedy: maintain count of subsequences ending at each value. Prefer appending to shorter groups first.",
    examples: [
      { input: "nums = [1,2,3,3,4,5]", output: "True", explain: "groups: [1,2,3], [3,4,5]" },
      { input: "nums = [1,2,3,3,4,4,5,5]", output: "True", explain: "[1,2,3,4,5], [3,4,5]" },
      { input: "nums = [1,2,3,4,4,5]", output: "False" },
    ],
    why: "Compose: greedy allocation + frequency maps. At each number: if it can extend an existing group ending at x-1, do that. Otherwise, start a new group requiring x+1 and x+2. The greed: extend before starting new.",
    starterCode: "def is_possible(nums):\n    from collections import Counter\n    freq = Counter(nums)\n    need = Counter()\n    pass",
    hints: [
      "freq = count of remaining occurrences. need = count of groups that need this number as their next element.",
      "For each num: if freq[num] == 0, skip. If need[num] > 0, extend existing group: need[num]--, need[num+1]++. freq[num]--.",
      "Else: start new group needing num+1, num+2: freq[num+1]--, freq[num+2]--, need[num+3]++. If any freq < 0, return False."
    ],
    solution: "def is_possible(nums):\n    from collections import Counter\n    freq = Counter(nums)\n    need = Counter()\n    for num in nums:\n        if freq[num] == 0:\n            continue\n        if need[num] > 0:\n            need[num] -= 1\n            need[num + 1] += 1\n        elif freq[num + 1] > 0 and freq[num + 2] > 0:\n            freq[num + 1] -= 1\n            freq[num + 2] -= 1\n            need[num + 3] += 1\n        else:\n            return False\n        freq[num] -= 1\n    return True",
    walkthrough: "Two maps: freq (remaining copies) and need (how many groups need a given number next). For each num: prefer extending existing groups (need[num] > 0) over starting new (which consumes 3 numbers). This greed works because extending never makes things worse — it satisfies a waiting group without consuming extra numbers.",
    testCode: "assert is_possible([1,2,3,3,4,5]) == True\nassert is_possible([1,2,3,3,4,4,5,5]) == True\nassert is_possible([1,2,3,4,4,5]) == False\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 6, title: "Maximum Performance of a Team", pattern: "sort + heap for top-k selection", skill: "sort by efficiency desc; maintain heap of k fastest engineers by speed",
    statement: "Given engineers (speed, efficiency) and k, pick at most k to form a team. Performance = sum(speeds) * min(efficiencies). Greedy: sort by efficiency descending, maintain min-heap of k largest speeds; at each iteration, compute performance with current efficiency as bottleneck.",
    examples: [
      { input: "n = 6, speed = [2,10,3,1,5,8], efficiency = [5,4,3,9,7,2], k = 2", output: "60", explain: "engineers at index 1 and 4: (10+5)*min(4,7)=60" },
      { input: "n = 3, speed = [2,8,2], efficiency = [2,7,1], k = 2", output: "56" },
    ],
    why: "Compose: sort as enabler (Stage 1) + heap (top-k maintenance). Sort by efficiency desc ensures the current engineer is always the bottleneck (min efficiency). Heap tracks the top k speeds. Performance = sum_of_k_speeds * current_efficiency.",
    starterCode: "def max_performance(n, speed, efficiency, k):\n    import heapq\n    engineers = sorted(zip(efficiency, speed), reverse=True)\n    heap = []\n    speed_sum = 0\n    max_perf = 0\n    pass",
    hints: [
      "Sort by efficiency descending. As you iterate, the current engineer's efficiency is the bottleneck (since all previous have higher or equal efficiency).",
      "Maintain min-heap of speeds (size <= k). Keep running sum of speeds in heap.",
      "When heap size > k, pop the smallest speed (remove the slowest engineer). Compute performance = speed_sum * current_efficiency."
    ],
    solution: "def max_performance(n, speed, efficiency, k):\n    import heapq\n    engineers = sorted(zip(efficiency, speed), reverse=True)\n    heap = []\n    speed_sum = 0\n    max_perf = 0\n    MOD = 10**9 + 7\n    for eff, spd in engineers:\n        heapq.heappush(heap, spd)\n        speed_sum += spd\n        if len(heap) > k:\n            speed_sum -= heapq.heappop(heap)\n        max_perf = max(max_perf, speed_sum * eff)\n    return max_perf % MOD",
    walkthrough: "Sort by efficiency desc. Iterate: add current engineer's speed to heap, update speed_sum. If > k engineers, remove slowest (heap pop). The current engineer's efficiency is the min so far (bottleneck), so performance = sum(top_k_speeds) * current_efficiency. Track max. Compose: sort + heap + running sum.",
    testCode: "assert max_performance(6, [2,10,3,1,5,8], [5,4,3,9,7,2], 2) == 60\nassert max_performance(3, [2,8,2], [2,7,1], 2) == 56\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 6, title: "Reconstruct Queue by Height", pattern: "sort by height desc, insert at k", skill: "process tallest first; insert each person at index = k (their position in remaining group)",
    statement: "People have (h, k): h=height, k=number of taller people in front. Reconstruct the queue. Greedy: sort by height descending (tallest first), then by k ascending. Insert each at position k.",
    examples: [
      { input: "people = [[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]]", output: "[[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]" },
      { input: "people = [[6,0],[5,0],[4,0],[3,2],[2,2],[1,4]]", output: "[[4,0],[5,0],[2,2],[3,2],[1,4],[6,0]]" },
    ],
    why: "Two-step insight: (1) sort tallest first by height desc, then k asc. (2) Insert each at position k. Since taller people are already placed, k correctly counts the number of taller people in front. Compose: sort + positional insert.",
    starterCode: "def reconstruct_queue(people):\n    people.sort(key=lambda x: (-x[0], x[1]))\n    result = []\n    pass",
    hints: [
      "Sort descending by height, then ascending by k. Process tallest first.",
      "For each person (h,k): insert into result at position k. Since all already-inserted are taller or equal height, k correctly counts taller people in front.",
      "This works because the relative ordering of taller people among themselves is already correct."
    ],
    solution: "def reconstruct_queue(people):\n    people.sort(key=lambda x: (-x[0], x[1]))\n    result = []\n    for h, k in people:\n        result.insert(k, [h, k])\n    return result",
    walkthrough: "Sort: tallest first, then smallest k first. Iterate: insert each person at index k in result. Since we process tallest first, shorter people inserted later are invisible to taller people's k count. Inserting at k ensures exactly k taller (already-inserted) people are in front. O(n²) due to list insertion.",
    testCode: "assert reconstruct_queue([[7,0],[4,4],[7,1],[5,0],[6,1],[5,2]]) == [[5,0],[7,0],[5,2],[6,1],[4,4],[7,1]]\nassert reconstruct_queue([[6,0],[5,0],[4,0],[3,2],[2,2],[1,4]]) == [[4,0],[5,0],[2,2],[3,2],[1,4],[6,0]]\nprint('All tests passed!')"
  },

  // ── STAGE 0: Local-Choice Reflex (extended) ──
  // NEW
  {
    id: 36, stage: 0, title: "Kadane's Maximum Subarray", pattern: "local-choice: extend or restart", skill: "at each element, choose max(nums[i], current_sum + nums[i])",
    statement: "Given an integer array nums, find the contiguous subarray (at least one element) with the largest sum. Greedy: at each position i, the best subarray ending at i either extends the previous best (current_sum + nums[i]) or starts fresh (nums[i]). Track the maximum seen.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explain: "[4,-1,2,1] has sum 6" },
      { input: "nums = [1]", output: "1" },
      { input: "nums = [5,4,-1,7,8]", output: "23", explain: "entire array, sum 23" }
    ],
    why: "The local-choice reflex: at each element, the best subarray ending here either extends the previous subarray or starts fresh. This is a classic greedy that feels like DP — the 'extend or restart' decision at each step never needs to be revised.",
    starterCode: "def max_subarray(nums):\n    cur_sum = nums[0]\n    max_sum = nums[0]\n    for i in range(1, len(nums)):\n        pass",
    hints: [
      "Initialize cur_sum = max_sum = nums[0]. For i from 1 to n-1: cur_sum = max(nums[i], cur_sum + nums[i]).",
      "After updating cur_sum, update max_sum = max(max_sum, cur_sum). The greedy choice: should I extend or start fresh?",
      "This is O(n). Kadane proved that the locally optimal decision (extend if cur_sum > 0, else restart) composes into global optimum."
    ],
    solution: "def max_subarray(nums):\n    cur_sum = max_sum = nums[0]\n    for i in range(1, len(nums)):\n        cur_sum = max(nums[i], cur_sum + nums[i])\n        max_sum = max(max_sum, cur_sum)\n    return max_sum",
    walkthrough: "At each element nums[i], the best subarray ending at i is either: (a) nums[i] alone (start fresh), or (b) nums[i] + best_subarray_ending_at_i-1 (extend). Track cur_sum = best ending here, max_sum = best overall. O(n) single pass. This is pure local-reasoning greed — at each step, we never second-guess.",
    testCode: "assert max_subarray([-2,1,-3,4,-1,2,1,-5,4]) == 6\nassert max_subarray([1]) == 1\nassert max_subarray([5,4,-1,7,8]) == 23\nassert max_subarray([-1,-2,-3]) == -1\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 37, stage: 0, title: "Best Time to Buy and Sell Stock II", pattern: "sum all ascending segments", skill: "add price[i] - price[i-1] whenever positive — every local rise is profit",
    statement: "Given array prices where prices[i] is the stock price on day i, find max profit with unlimited transactions (buy at most one share at a time, sell before buying again). Greedy: whenever prices[i] > prices[i-1], add the difference. Every upward segment is profit.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "7", explain: "buy 1 sell 5 (+4), buy 3 sell 6 (+3) = 7" },
      { input: "prices = [1,2,3,4,5]", output: "4", explain: "buy 1 sell 5, same as summing daily rises: 1+1+1+1=4" },
      { input: "prices = [7,6,4,3,1]", output: "0" }
    ],
    why: "The local-choice: at each day, if tomorrow's price is higher, 'buy' today and 'sell' tomorrow. Summing all positive adjacent differences captures the same total as optimal buy-low-sell-high sequences. The greed: capture every upward slope immediately.",
    starterCode: "def max_profit_ii(prices):\n    profit = 0\n    for i in range(1, len(prices)):\n        pass\n    return profit",
    hints: [
      "For each day i (starting from 1): if prices[i] > prices[i-1], add prices[i] - prices[i-1] to profit.",
      "Why does this work? A series of positive daily changes sums to the same as one big buy at the valley and sell at the peak.",
      "This is O(n). Each upward tick is independent profit — the greedy sums all positive returns."
    ],
    solution: "def max_profit_ii(prices):\n    profit = 0\n    for i in range(1, len(prices)):\n        if prices[i] > prices[i - 1]:\n            profit += prices[i] - prices[i - 1]\n    return profit",
    walkthrough: "The greedy insight: [1,2,3,4,5] — buying at 1 and selling at 5 gives profit 4. But summing daily rises (1+1+1+1) also gives 4. This equivalence holds for any monotonic rise. So at each day, if price went up, capture that difference immediately. O(n).",
    testCode: "assert max_profit_ii([7,1,5,3,6,4]) == 7\nassert max_profit_ii([1,2,3,4,5]) == 4\nassert max_profit_ii([7,6,4,3,1]) == 0\nassert max_profit_ii([1,2]) == 1\nprint('All tests passed!')"
  },

  // ── STAGE 1: Sorting as Enabler (extended) ──
  // NEW
  {
    id: 38, stage: 1, title: "Boats to Save People", pattern: "sort + two-pointer pairing", skill: "sort weights; pair heaviest with lightest if they fit; otherwise heaviest alone",
    statement: "Given an array people of weights and a boat limit, each boat carries at most 2 people and total weight <= limit. Find minimum boats. Sort weights, then two-pointer: try to pair the heaviest remaining person with the lightest remaining. If they fit, both go. Otherwise, heaviest goes alone.",
    examples: [
      { input: "people = [3,2,2,1], limit = 3", output: "3", explain: "boats: [1,2], [2], [3]" },
      { input: "people = [3,5,3,4], limit = 5", output: "4", explain: "boats: [3], [3], [4], [5] — none can pair" },
      { input: "people = [1,2], limit = 3", output: "1" }
    ],
    why: "Sorting unlocks the greedy pairing: after sorting, we know exactly who is heaviest and lightest. The greed: always try to pair the heaviest with the lightest — if they fit, bonus; if not, heaviest must go alone regardless.",
    starterCode: "def num_rescue_boats(people, limit):\n    people.sort()\n    boats = 0\n    left, right = 0, len(people) - 1\n    pass",
    hints: [
      "Sort people ascending. Two pointers: left = 0 (lightest), right = n-1 (heaviest).",
      "If people[left] + people[right] <= limit: both go (left++, right--). Else: heaviest goes alone (right--).",
      "Each boat takes at most 2 people. The heaviest remaining always needs a boat; pairing with the lightest is the greediest way to fill the second seat."
    ],
    solution: "def num_rescue_boats(people, limit):\n    people.sort()\n    boats = 0\n    left, right = 0, len(people) - 1\n    while left <= right:\n        if people[left] + people[right] <= limit:\n            left += 1\n        right -= 1\n        boats += 1\n    return boats",
    walkthrough: "Sort ascending. Two-pointer: heaviest (right) always consumes a boat. If lightest (left) can join, great — both board. If not, heaviest goes solo. Each iteration places one boat. Why heaviest+lightest? Because heaviest is the hardest to pair; if even the lightest can't accompany, no one can. O(n log n).",
    testCode: "assert num_rescue_boats([3,2,2,1], 3) == 3\nassert num_rescue_boats([3,5,3,4], 5) == 4\nassert num_rescue_boats([1,2], 3) == 1\nassert num_rescue_boats([5,1,4,2], 6) == 2\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 39, stage: 1, title: "Wiggle Sort", pattern: "one-pass adjacent swap for wiggle property", skill: "for every odd index, ensure nums[i] >= nums[i-1]; if not, swap; for every even index (non-zero), ensure nums[i] <= nums[i-1]; if not, swap",
    statement: "Given unsorted array nums, reorder in-place such that nums[0] <= nums[1] >= nums[2] <= nums[3] >= ... (wiggle sort). Greedy one-pass: for i=1..n-1, if i is odd and nums[i] < nums[i-1], swap; if i is even and nums[i] > nums[i-1], swap.",
    examples: [
      { input: "nums = [3,5,2,1,6,4]", output: "[3,5,1,6,2,4] — valid wiggle" },
      { input: "nums = [1,2,3,4]", output: "[1,3,2,4] — valid wiggle" }
    ],
    why: "Sorting enables patterns, but here we DON'T sort full — we fix one adjacent pair at a time. The insight: each index only needs to satisfy a local constraint with its left neighbor. Fixing locally composes into global wiggle. O(n).",
    starterCode: "def wiggle_sort(nums):\n    for i in range(1, len(nums)):\n        if (i % 2 == 1 and nums[i] < nums[i-1]) or (i % 2 == 0 and nums[i] > nums[i-1]):\n            nums[i], nums[i-1] = nums[i-1], nums[i]\n    return nums",
    hints: [
      "Iterate i from 1 to n-1. If i is odd (peak): ensure nums[i] >= nums[i-1]. If not, swap.",
      "If i is even (valley): ensure nums[i] <= nums[i-1]. If not, swap.",
      "Why does this work? Swapping doesn't violate previously fixed constraints because a swap only improves the wiggle property for positions i-1 and i."
    ],
    solution: "def wiggle_sort(nums):\n    for i in range(1, len(nums)):\n        if (i % 2 == 1 and nums[i] < nums[i-1]) or (i % 2 == 0 and nums[i] > nums[i-1]):\n            nums[i], nums[i-1] = nums[i-1], nums[i]\n    return nums",
    walkthrough: "Single pass: for each i, check the wiggle condition with nums[i-1]. If violated, swap. The swap fixes the current pair without breaking earlier pairs because: for odd i (peak), after swap, nums[i-1] gets a larger value (still fine as a valley). For even i (valley), after swap, nums[i-1] gets a smaller value (still fine as a peak). O(n).",
    testCode: "def check_wiggle(arr):\n    for i in range(1, len(arr)):\n        if i % 2 == 1:\n            if arr[i] < arr[i-1]: return False\n        else:\n            if arr[i] > arr[i-1]: return False\n    return True\nassert check_wiggle(wiggle_sort([3,5,2,1,6,4]))\nassert check_wiggle(wiggle_sort([1,2,3,4]))\nprint('All tests passed!')"
  },

  // ── STAGE 2: The Proof Habit (extended) ──
  // NEW
  {
    id: 40, stage: 2, title: "Prove Kadane's by Induction", pattern: "induction: base case + optimal substructure", skill: "prove cur_sum[i] = max subarray sum ending at i holds for all i via induction",
    statement: "Prove Kadane's algorithm is optimal. The invariant: at each index i, cur_sum is the maximum subarray sum ending at i. Proof by induction: base i=0 trivial. Assume true for i-1. At i: the best subarray ending at i either starts at i (nums[i]) or extends the best ending at i-1 (cur_sum + nums[i]). Kadane picks the max — provably optimal for position i.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explain: "verify Kadane's output == optimal via exhaustive search" }
    ],
    why: "Proof builds conviction. The invariant 'cur_sum[i] = max subarray sum ending at i' is maintained via induction. If a better subarray ending at i existed, it would contradict the induction hypothesis that cur_sum[i-1] was already optimal.",
    starterCode: "def verify_kadane(nums):\n    def kadane(arr):\n        cur = mx = arr[0]\n        for x in arr[1:]:\n            cur = max(x, cur + x)\n            mx = max(mx, cur)\n        return mx\n    def brute(arr):\n        best = float('-inf')\n        for i in range(len(arr)):\n            s = 0\n            for j in range(i, len(arr)):\n                s += arr[j]\n                best = max(best, s)\n        return best\n    return kadane(nums) == brute(nums)",
    hints: [
      "Define optimal subarray sum ending at i. Prove by induction: base case i=0 is trivial (only one subarray).",
      "Inductive step: assume cur_sum[i-1] is optimal for position i-1. Any subarray ending at i either starts at i or extends an optimal one ending at i-1.",
      "Write brute-force O(n^2) to verify Kadane's on random arrays — the proof in code."
    ],
    solution: "def verify_kadane(nums):\n    def kadane(arr):\n        cur = mx = arr[0]\n        for x in arr[1:]:\n            cur = max(x, cur + x)\n            mx = max(mx, cur)\n        return mx\n    def brute(arr):\n        best = float('-inf')\n        for i in range(len(arr)):\n            s = 0\n            for j in range(i, len(arr)):\n                s += arr[j]\n                best = max(best, s)\n        return best\n    return kadane(nums) == brute(nums)",
    walkthrough: "Induction: base — at i=0, cur_sum = nums[0], trivially optimal. Inductive step: assume cur_sum[i-1] is the max subarray sum ending at i-1. Any subarray ending at i must either be [i] alone (sum = nums[i]) or extend some subarray ending at i-1. The best extension is cur_sum[i-1] + nums[i]. So max = max(nums[i], cur_sum[i-1]+nums[i]) = cur_sum[i]. Global max = max(cur_sum[0..n-1]). QED.",
    testCode: "assert verify_kadane([-2,1,-3,4,-1,2,1,-5,4]) == True\nassert verify_kadane([1]) == True\nassert verify_kadane([-1,-2,-3]) == True\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 41, stage: 2, title: "Exchange Argument for Array Partition", pattern: "exchange: swap pair assignments to show no loss", skill: "prove pairing adjacent elements after sorting maximizes sum of mins; exchange argument shows any alternative pairing is suboptimal",
    statement: "Prove the array partition greedy (P39) is optimal. Exchange argument: after sorting [a1,a2,...,a2n], the greedy pairs (a1,a2),(a3,a4),... giving sum = a1+a3+...+a(2n-1). Assume optimal solution pairs differently. If any pair crosses (e.g., a1 with ak where k>2, and a2 with aj where j>k), then a1+ak >= a1+a2 and a2+aj >= a1+a2 (since sorted), so swapping to greedy reduces or keeps sum equal. Therefore greedy is optimal.",
    examples: [
      { input: "nums = [1,4,3,2]", output: "4", explain: "verify greedy output matches optimal via brute force on small arrays" }
    ],
    why: "The exchange argument: if optimal pairs don't match the greedy pairing, we can swap elements between pairs without decreasing the total min-sum. Because a1 is the smallest, pairing it with anything larger than a2 wastes more of a2's value.",
    starterCode: "def verify_partition_greedy(nums):\n    def greedy(arr):\n        a = sorted(arr)\n        return sum(a[::2])\n    def brute(arr):\n        from itertools import permutations\n        n = len(arr) // 2\n        best = 0\n        for perm in permutations(arr):\n            total = sum(min(perm[2*i], perm[2*i+1]) for i in range(n))\n            best = max(best, total)\n        return best\n    return greedy(nums) == brute(nums)",
    hints: [
      "Sort the array. Greedy pairs adjacent elements. Brute-force: try all permutations (pairings).",
      "Exchange: take any optimal pairing. If a1 is paired with ak (k>2) and a2 with aj, swap to pair a1 with a2 — sum of mins doesn't decrease.",
      "The sorted order ensures that for any i<j, min(ai, aj) = ai. Pairing smallest with smallest preserves larger values for other pairs."
    ],
    solution: "def verify_partition_greedy(nums):\n    def greedy(arr):\n        a = sorted(arr)\n        return sum(a[::2])\n    def brute(arr):\n        from itertools import permutations\n        n = len(arr) // 2\n        best = 0\n        for perm in permutations(arr):\n            total = sum(min(perm[2*i], perm[2*i+1]) for i in range(n))\n            best = max(best, total)\n        return best\n    return greedy(nums) == brute(nums)",
    walkthrough: "Exchange: after sorting, adjacent pairing minimizes waste. Any alternative pairing has at least one 'cross' where a smaller element is paired with a larger one that could be paired with a smaller one. Swapping never decreases sum of mins because the min function already picks the smaller in each pair. O(n log n) for verification (brute force on small arrays).",
    testCode: "assert verify_partition_greedy([1,4,3,2]) == True\nassert verify_partition_greedy([6,2,6,5,1,2]) == True\nprint('All tests passed!')"
  },

  // ── STAGE 3: Frontier Patterns (extended) ──
  // NEW
  {
    id: 42, stage: 3, title: "Video Stitching", pattern: "frontier expansion: sort by start, grow reach up to T", skill: "sort clips by start; iterate expanding reach = max(reach, clip.end) while clip.start <= current_reach",
    statement: "Given clips [start, end] and time T, find minimum number of clips to cover [0, T]. Sort by start. At each step, while clips' start <= current_reach, extend reach as far as possible. Increment count when we advance to a new furthest reach.",
    examples: [
      { input: "clips = [[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]], T = 10", output: "3", explain: "pick [0,2],[1,9],[8,10] or [0,2],[1,9],[5,9]" },
      { input: "clips = [[0,1],[1,2]], T = 2", output: "2" },
      { input: "clips = [[0,1],[6,8],[0,2],[5,6],[0,4],[0,3],[6,7],[1,3],[4,5],[1,4],[2,5],[4,7],[1,6],[6,8],[2,8]], T = 5", output: "2" }
    ],
    why: "Frontier expansion: sort by start. Track furthest reachable point. At each iteration, among all clips that start <= current reach, pick the one that extends furthest. When we advance the frontier, increment clip count. Same mental model as Jump Game II.",
    starterCode: "def video_stitching(clips, T):\n    clips.sort()\n    count = 0\n    cur_end = 0\n    i = 0\n    n = len(clips)\n    pass",
    hints: [
      "Sort clips by start time. Initialize cur_end = 0, i = 0, count = 0.",
      "While cur_end < T: among all clips with start <= cur_end, find the furthest end. Let farthest = max(end of clips[i..j] where start <= cur_end).",
      "If farthest <= cur_end (no progress), return -1. Otherwise: count++, cur_end = farthest. Repeat."
    ],
    solution: "def video_stitching(clips, T):\n    clips.sort()\n    count = 0\n    cur_end = 0\n    i = 0\n    n = len(clips)\n    while cur_end < T:\n        farthest = cur_end\n        while i < n and clips[i][0] <= cur_end:\n            farthest = max(farthest, clips[i][1])\n            i += 1\n        if farthest == cur_end:\n            return -1\n        count += 1\n        cur_end = farthest\n    return count",
    walkthrough: "Sort clips by start. At each step, from current position cur_end, scan all clips that start <= cur_end and find the one that extends the reach furthest. Set cur_end = farthest and increment clip count. This is frontier expansion — same as Jump Game II's BFS levels, but with explicit clip selection. O(n log n).",
    testCode: "assert video_stitching([[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]], 10) == 3\nassert video_stitching([[0,1],[1,2]], 2) == 2\nassert video_stitching([[0,1],[6,8],[0,2],[5,6],[0,4],[0,3],[6,7],[1,3],[4,5],[1,4],[2,5],[4,7],[1,6],[6,8],[2,8]], 5) == 2\nassert video_stitching([[0,4],[2,8]], 5) == 2\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 43, stage: 3, title: "Minimum Taps to Water Garden", pattern: "convert to interval coverage, greed by reach", skill: "each tap at i with range r covers [i-r, i+r]; find min intervals to cover [0,n]",
    statement: "Given garden length n (positions 0..n) and ranges array where ranges[i] = range of tap at position i, find minimum taps to water the whole garden [0, n]. Convert each tap to interval [max(0,i-ranges[i]), min(n,i+ranges[i])]. Then use the interval-cover frontier greed: at each step, among taps covering current position, pick the one extending furthest.",
    examples: [
      { input: "n = 5, ranges = [3,4,1,1,0,0]", output: "1", explain: "tap at index 1 with range 4 covers [0,5]" },
      { input: "n = 3, ranges = [0,0,0,0]", output: "-1", explain: "no tap has range > 0, impossible" }
    ],
    why: "Convert to interval numbers: a tap at position i with range r covers [i-r, i+r] intersected with [0,n]. The problem reduces to minimum intervals to cover [0,n]. Same frontier expansion as Video Stitching (P42).",
    starterCode: "def min_taps(n, ranges):\n    intervals = []\n    for i, r in enumerate(ranges):\n        if r > 0:\n            intervals.append([max(0, i - r), min(n, i + r)])\n    intervals.sort()\n    count = 0\n    cur_end = 0\n    i = 0\n    pass",
    hints: [
      "Convert each tap to an interval [max(0, i-range), min(n, i+range)]. Sort by start.",
      "Same frontier expansion as video stitching: while cur_end < n, among intervals with start <= cur_end, find the furthest end. If no progress, impossible.",
      "Each interval found advances the frontier by one tap. O(n log n)."
    ],
    solution: "def min_taps(n, ranges):\n    intervals = []\n    for i, r in enumerate(ranges):\n        if r > 0:\n            intervals.append([max(0, i - r), min(n, i + r)])\n    intervals.sort()\n    count = 0\n    cur_end = 0\n    i = 0\n    m = len(intervals)\n    while cur_end < n:\n        farthest = cur_end\n        while i < m and intervals[i][0] <= cur_end:\n            farthest = max(farthest, intervals[i][1])\n            i += 1\n        if farthest == cur_end:\n            return -1\n        count += 1\n        cur_end = farthest\n    return count",
    walkthrough: "Transform taps -> intervals -> same pattern as Video Stitching (P42). Sort by start. At each position cur_end, scan all intervals whose start <= cur_end, pick the one extending furthest. Increment count. If at any point we can't advance, return -1. O(n log n). Same frontier model, different surface.",
     testCode: "assert min_taps(5, [3,4,1,1,0,0]) == 1\nassert min_taps(3, [0,0,0,0]) == -1\nassert min_taps(5, [3,3,1,1,0,0]) == -1\nprint('All tests passed!')"
  },

  // ── STAGE 4: Naive (extended) ──
  // NEW
  {
    id: 44, stage: 4, title: "Maximum Subarray — O(n^2) Naive", pattern: "iterate all subarrays, track max sum", skill: "for each start i, accumulate sum to j; track max; O(n^2)",
    statement: "Solve Maximum Subarray with O(n^2) brute force. For each starting index i, extend to j = i..n-1, accumulating the sum. Track the maximum sum seen. This is the naive baseline that Kadane's algorithm optimizes from O(n^2) to O(n).",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6" },
      { input: "nums = [1]", output: "1" }
    ],
    why: "The O(n^2) solution makes the waste visible: for each start i, we recompute the entire subarray sum from scratch. Kadane's (Stage 5) eliminates the outer loop by tracking cur_sum in one pass. Before optimizing, feel the O(n^2) weight.",
    starterCode: "def max_subarray_naive(nums):\n    best = float('-inf')\n    n = len(nums)\n    for i in range(n):\n        s = 0\n        for j in range(i, n):\n            pass\n    return best",
    hints: [
      "For each i (0..n-1): initialize sum = 0. For each j (i..n-1): sum += nums[j]; update best = max(best, sum).",
      "This is O(n^2). For n=10^5, it's 10^10 operations — too slow.",
      "The inner loop recomputes the sum from i each time. Kadane's reuses the computation across positions."
    ],
    solution: "def max_subarray_naive(nums):\n    best = float('-inf')\n    n = len(nums)\n    for i in range(n):\n        s = 0\n        for j in range(i, n):\n            s += nums[j]\n            if s > best:\n                best = s\n    return best",
    walkthrough: "Enumerate all subarrays: for each start i, extend j, summing as we go. Track the maximum. O(n^2) because for each of n starts, we extend up to n endings. The repeated work is glaring — subarrays starting at i share prefixes with those starting at i+1.",
    testCode: "assert max_subarray_naive([-2,1,-3,4,-1,2,1,-5,4]) == 6\nassert max_subarray_naive([1]) == 1\nassert max_subarray_naive([-1,-2,-3]) == -1\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 45, stage: 4, title: "Buy/Sell II — Brute Force Recursion", pattern: "enumerate all buy-sell sequences via recursion", skill: "for each day, either hold, buy, or sell; backtrack all possibilities; O(2^n)",
    statement: "Solve Best Time to Buy and Sell Stock II by brute-force recursion. At each day, with a state (holding stock or not), try both actions. Track maximum profit. This exponential solution reveals why the greedy alternative is necessary.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "7" },
      { input: "prices = [1,2,3,4,5]", output: "4" }
    ],
    why: "The recursion explores every possible buy-sell sequence, O(2^n). For n days, 2^n possibilities. The waste: most branches are equivalent or suboptimal. The greedy sum-of-positive-diffs solution collapses this to O(n) by noting that every upward segment is independent profit.",
    starterCode: "def max_profit_ii_brute(prices):\n    n = len(prices)\n    def dfs(day, holding):\n        if day >= n:\n            return 0\n        pass\n    return dfs(0, False)",
    hints: [
      "State: (day, holding). At each day: if not holding, can buy (-price[day] + dfs(day+1, True)). If holding, can sell (price[day] + dfs(day+1, False)). Or do nothing (dfs(day+1, holding)).",
      "Recursion explores all possibilities: max(sell, do_nothing) or max(buy, do_nothing).",
      "This is exponential O(2^n). The greedy does O(n) by summing all positive daily diffs."
    ],
    solution: "def max_profit_ii_brute(prices):\n    n = len(prices)\n    def dfs(day, holding):\n        if day >= n:\n            return 0\n        do_nothing = dfs(day + 1, holding)\n        if holding:\n            sell = prices[day] + dfs(day + 1, False)\n            return max(sell, do_nothing)\n        else:\n            buy = -prices[day] + dfs(day + 1, True)\n            return max(buy, do_nothing)\n    return dfs(0, False)",
    walkthrough: "Recursion with state. Two choices per day -> 2^n paths. Each path represents a valid sequence of buys and sells (at most one share at a time). The optimal is found, but at exponential cost. For n=30, this is already 1 billion paths. Motivates the O(n) greedy.",
    testCode: "assert max_profit_ii_brute([7,1,5,3,6,4]) == 7\nassert max_profit_ii_brute([1,2,3,4,5]) == 4\nassert max_profit_ii_brute([7,6,4,3,1]) == 0\nprint('All tests passed!')"
  },

  // ── STAGE 5: Optimization (extended) ──
  // NEW
  {
    id: 46, stage: 5, title: "Maximum Subarray — Kadane O(n) Optimized", pattern: "replace O(n^2) with O(n) single pass", skill: "cur_sum = max(nums[i], cur_sum + nums[i]); track overall max; O(n)",
    statement: "Optimize Maximum Subarray from O(n^2) to O(n) using Kadane's algorithm. Single pass: maintain cur_sum = best subarray sum ending at current position. At each i: cur_sum = max(nums[i], cur_sum + nums[i]). Update global max. This replaces the inner loop with a single O(1) decision.",
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6" },
      { input: "nums = [5,4,-1,7,8]", output: "23" }
    ],
    why: "Kadane's replaces the O(n^2) inner loop with an O(1) choice per element. The DP recurrence 'dp[i] = max(nums[i], dp[i-1] + nums[i])' hints at DP, but the greedy nature — 'should I extend or restart?' — is a local choice that never needs revision.",
    starterCode: "def max_subarray_kadane(nums):\n    cur_sum = max_sum = nums[0]\n    for i in range(1, len(nums)):\n        cur_sum = max(nums[i], cur_sum + nums[i])\n        max_sum = max(max_sum, cur_sum)\n    return max_sum",
    hints: [
      "Initialize cur_sum = max_sum = nums[0]. For each subsequent element: cur_sum = max(num, cur_sum + num).",
      "The decision 'extend or restart' is greedy: if cur_sum is negative, starting fresh with just nums[i] is better.",
      "Update max_sum after each step. O(n) single pass vs O(n^2) naive."
    ],
    solution: "def max_subarray_kadane(nums):\n    cur_sum = max_sum = nums[0]\n    for i in range(1, len(nums)):\n        cur_sum = max(nums[i], cur_sum + nums[i])\n        max_sum = max(max_sum, cur_sum)\n    return max_sum",
    walkthrough: "One-pass Kadane's: cur_sum tracks the maximum subarray sum ending at the current position. At each step, the greedy: should I extend the existing subarray or start a new one? The local best composes into global best because any optimal subarray ends at some position i and is captured as cur_sum at that moment. O(n).",
    testCode: "assert max_subarray_kadane([-2,1,-3,4,-1,2,1,-5,4]) == 6\nassert max_subarray_kadane([5,4,-1,7,8]) == 23\nassert max_subarray_kadane([-1]) == -1\nassert max_subarray_kadane([1,2]) == 3\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 47, stage: 5, title: "Buy/Sell II — Greedy O(n) Optimized", pattern: "replace O(2^n) recursion with O(n) sum of positive diffs", skill: "single pass: add price[i] - price[i-1] whenever positive; O(n)",
    statement: "Optimize Stock II from exponential recursion to O(n). The insight: every upward movement between consecutive days can be captured independently. Traverse once: if prices[i] > prices[i-1], add the difference to profit. This captures all possible profit without exponential search.",
    examples: [
      { input: "prices = [7,1,5,3,6,4]", output: "7" },
      { input: "prices = [1,2,3,4,5]", output: "4" }
    ],
    why: "The greedy replaces O(2^n) recursion with a single O(n) pass. Why is summing positive diffs equivalent to optimal buy-sell? Because buying at a valley and selling at a peak gives the same total as summing each individual step along the way. [1->5] profit 4 = (1+1+1+1) of daily rises.",
    starterCode: "def max_profit_ii_greedy(prices):\n    profit = 0\n    for i in range(1, len(prices)):\n        if prices[i] > prices[i - 1]:\n            profit += prices[i] - prices[i - 1]\n    return profit",
    hints: [
      "Iterate from day 1 to n-1. If price went up from yesterday, add the rise to profit.",
      "This is equivalent to: buy at every valley, sell at every peak. The sum of all positive segments = total profit.",
      "O(n) single pass. No recursion, no state. Pure greed: capture every upward move immediately."
    ],
    solution: "def max_profit_ii_greedy(prices):\n    profit = 0\n    for i in range(1, len(prices)):\n        if prices[i] > prices[i - 1]:\n            profit += prices[i] - prices[i - 1]\n    return profit",
    walkthrough: "The greedy equivalence: for any buy-sell pair, profit = sum of all positive daily diffs within that range. Skipping negative diffs and summing all positives gives the optimal unlimited-transaction profit. O(n) replaces O(2^n).",
    testCode: "assert max_profit_ii_greedy([7,1,5,3,6,4]) == 7\nassert max_profit_ii_greedy([1,2,3,4,5]) == 4\nassert max_profit_ii_greedy([7,6,4,3,1]) == 0\nassert max_profit_ii_greedy([3,3,5,0,0,3,1,4]) == 8\nprint('All tests passed!')"
  },

  // ── STAGE 6: Mastery (extended) ──
  // NEW
  {
    id: 48, stage: 6, title: "Remove K Digits", pattern: "monotonic stack greed: remove larger left digits", skill: "build result with stack; while k>0 and stack[-1] > current digit, pop; append current",
    statement: "Given string num representing a non-negative integer, remove k digits to make the smallest possible number. Greedy: traverse digits left to right. Use a stack. While k > 0 and the top of stack is larger than the current digit, pop (remove the larger digit). After traversal, if k remains, remove from the end. Strip leading zeros.",
    examples: [
      { input: "num = '1432219', k = 3", output: "'1219'", explain: "remove 4,3,2 -> 1219" },
      { input: "num = '10200', k = 1", output: "'200'", explain: "remove 1, leading zero stripped" },
      { input: "num = '10', k = 2", output: "'0'" }
    ],
    why: "Compose: greed (prefer smaller left digits, same as the 'lexicographically smallest' concept from Largest Number P5) + stack (monotonic). At each digit, we prefer removing larger preceding digits because a smaller digit earlier makes the whole number smaller. Stack enforces the monotonic property.",
    starterCode: "def remove_k_digits(num, k):\n    stack = []\n    for digit in num:\n        while k > 0 and stack and stack[-1] > digit:\n            stack.pop()\n            k -= 1\n        stack.append(digit)\n    pass",
    hints: [
      "Use a stack. For each digit: while k > 0 and stack not empty and stack[-1] > digit: pop from stack, k--. Then push current digit.",
      "After the loop: if k > 0, remove k more digits from the end (stack[:-k] or equivalent).",
      "Strip leading zeros from the result. If result is empty, return '0'."
    ],
    solution: "def remove_k_digits(num, k):\n    stack = []\n    for digit in num:\n        while k > 0 and stack and stack[-1] > digit:\n            stack.pop()\n            k -= 1\n        stack.append(digit)\n    while k > 0:\n        stack.pop()\n        k -= 1\n    result = ''.join(stack).lstrip('0')\n    return result if result else '0'",
    walkthrough: "Greedy monotonic stack: at each digit, if a preceding digit is larger, removing it makes the remaining number smaller (since a smaller digit will occupy a more significant position). Stack maintains the invariant of non-decreasing digits. If k digits remain to be removed after traversal, they come from the end (largest remaining digits). Compose: greed + stack = monotonic stack. O(n).",
    testCode: "assert remove_k_digits('1432219', 3) == '1219'\nassert remove_k_digits('10200', 1) == '200'\nassert remove_k_digits('10', 2) == '0'\nassert remove_k_digits('9', 1) == '0'\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 49, stage: 6, title: "Wiggle Subsequence", pattern: "greedy peak-valley counter", skill: "track up/down state; count transitions; skip monotonic/equal segments",
    statement: "Given an integer array nums, return the length of the longest wiggle subsequence (differences alternate positive/negative). Greedy: iterate, track the expected next direction (up or down). When a valid wiggle transition occurs, flip direction and increment length. Equivalent to counting peaks and valleys.",
    examples: [
      { input: "nums = [1,7,4,9,2,5]", output: "6", explain: "entire sequence: 1<7>4<9>2<5, all wiggle" },
      { input: "nums = [1,17,5,10,13,15,10,5,16,8]", output: "7", explain: "1,17,5,15,5,16,8 (skipping flat/same-direction segments)" },
      { input: "nums = [1,2,3,4,5]", output: "2", explain: "monotonic — pick 1 and 5" }
    ],
    why: "Two-step insight: (1) wiggle = peaks and valleys. (2) Greed: skip monotonic segments — only count direction changes. The longest wiggle subsequence equals number of local extrema + 1. Compose: local-choice greed (count changes) + sequence analysis.",
    starterCode: "def wiggle_max_length(nums):\n    if len(nums) < 2:\n        return len(nums)\n    length = 1\n    prev_diff = 0\n    pass",
    hints: [
      "Traverse i=1..n-1. Compute diff = nums[i] - nums[i-1].",
      "If prev_diff >= 0 and diff < 0 (was going up, now down): wiggle! length++, prev_diff = diff.",
      "If prev_diff <= 0 and diff > 0 (was going down, now up): wiggle! length++, prev_diff = diff. Skip equal elements."
    ],
    solution: "def wiggle_max_length(nums):\n    if len(nums) < 2:\n        return len(nums)\n    length = 1\n    prev_diff = 0\n    for i in range(1, len(nums)):\n        diff = nums[i] - nums[i - 1]\n        if diff > 0 and prev_diff <= 0:\n            length += 1\n            prev_diff = diff\n        elif diff < 0 and prev_diff >= 0:\n            length += 1\n            prev_diff = diff\n    return length",
    walkthrough: "Count peaks and valleys: start with length 1 (first element). For each pair, if direction changes from the previous, count another element. Equal numbers are skipped. The greedy: only count elements that create a wiggle — monotonic segments are collapsed. O(n). Compose: local direction detection + sequence greed.",
    testCode: "assert wiggle_max_length([1,7,4,9,2,5]) == 6\nassert wiggle_max_length([1,17,5,10,13,15,10,5,16,8]) == 7\nassert wiggle_max_length([1,2,3,4,5]) == 2\nassert wiggle_max_length([0,0]) == 1\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 50, stage: 6, title: "Maximum Swap", pattern: "rightward scan: find leftmost digit with a larger digit to its right", skill: "precompute last position of each digit (0-9); scan left to right; for each digit, check if any larger digit appears later; swap with the rightmost",
    statement: "Given a non-negative integer, swap at most two digits to get the maximum value. Greedy: for each digit (left to right), check if any larger digit (9 down to digit+1) appears later. If found, swap with the rightmost occurrence of that larger digit. Return the number after at most one swap.",
    examples: [
      { input: "num = 2736", output: "7236", explain: "swap 2 and 7 -> 7236" },
      { input: "num = 9973", output: "9973", explain: "already max — no larger digit to the right of any position" }
    ],
    why: "Two-step: (1) precompute last occurrence of each digit. (2) Scan left to right: for each digit d, check if any digit larger than d appears later. If so, swap with the rightmost such larger digit. Compose: digit tracking + left-to-right greedy.",
    starterCode: "def maximum_swap(num):\n    digits = [int(c) for c in str(num)]\n    last = {}\n    for i, d in enumerate(digits):\n        last[d] = i\n    pass",
    hints: [
      "Convert num to list of digits. Build last[d] = rightmost index of digit d.",
      "For each position i, check digits 9 down to digits[i]+1: if any has last[d] > i, swap digits[i] with that position and return.",
      "At most one swap. Scan left to right: the first improvable position gives the maximum result."
    ],
    solution: "def maximum_swap(num):\n    digits = [int(c) for c in str(num)]\n    last = {}\n    for i, d in enumerate(digits):\n        last[d] = i\n    for i, d in enumerate(digits):\n        for bigger in range(9, d, -1):\n            if bigger in last and last[bigger] > i:\n                j = last[bigger]\n                digits[i], digits[j] = digits[j], digits[i]\n                return int(''.join(map(str, digits)))\n    return num",
    walkthrough: "Precompute last positions of digits 0-9. Scan left to right: for digit d at position i, check if any larger digit (9,8,...,d+1) appears to the right. If found, swap with its rightmost occurrence (to maximize the resulting number). One swap, O(n). Compose: digit tracking + significance-order greed.",
    testCode: "assert maximum_swap(2736) == 7236\nassert maximum_swap(9973) == 9973\nassert maximum_swap(98368) == 98863\nassert maximum_swap(1993) == 9913\nprint('All tests passed!')"
  },

]
