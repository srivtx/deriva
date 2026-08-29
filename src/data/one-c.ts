import type { OneProblem } from "./one"

export const PROBLEMS_ONE_C: OneProblem[] = [
  {
    id: 34, stage: 6, title: "Valid Brackets", pattern: "stack scan", skill: "last open, first closed", difficulty: "Easy",
    statement: "Given a string of the brackets () [] {}, return True if it is balanced — every close matches the most recent unclosed open, of the same kind.",
    examples: [
      { input: "s = '{[()]}'", output: "True" },
      { input: "s = '([)]'", output: "False", explain: "the '(' closed by ']' is the wrong kind" },
    ],
    why: "The stack's LIFO property is exactly the nesting rule of brackets. Problem 1 counted one depth; here the stack must remember WHICH kind opened, because the most recent context is the one that must close first. Every parser you will ever meet begins with this scan.",
    starterCode: "def valid_brackets(s):\n    pass",
    hints: [
      "Push every opening bracket; on a closing one, the stack top must be its matching opener.",
      "A close on an empty stack fails; leftovers on the stack at the end fail.",
      "Map closers to openers with a dict: {')': '(', ']': '[', '}': '{'}."
    ],
    solution: "def valid_brackets(s):\n    pairs = {')': '(', ']': '[', '}': '{'}\n    stack = []\n    for ch in s:\n        if ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n        else:\n            stack.append(ch)\n    return not stack",
    walkthrough: "The stack holds all currently-open contexts; popping checks the innermost one — precisely what 'last open, first closed' means. Two failure modes cover everything: mismatched kind (pop check) and unclosed leftovers (final emptiness test).",
    testCode: "assert valid_brackets('{[()]}') == True\nassert valid_brackets('([)]') == False\nassert valid_brackets('(]') == False\nassert valid_brackets('') == True\nassert valid_brackets('((') == False\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 6, title: "Min Stack", pattern: "auxiliary stack of minima", skill: "remember the state of bests", difficulty: "Medium",
    statement: "Design a stack with push, pop, top, and get_min — all O(1). Implement class MinStack with those four methods.",
    examples: [
      { input: "push 2, push 1, push 3, get_min, pop, get_min", output: "1, then 1... wait: push 2, push 1, get_min = 1, push 3, get_min = 1, pop, get_min = 1, pop, get_min = 2" },
      { input: "push 5, push 7, get_min", output: "5" },
    ],
    why: "A stack cannot be scanned for its min without destroying itself — so remember the min as part of the state. The auxiliary stack stores 'the min of everything below me', and because each level's min only changes on push, pops restore older minima automatically. Augmented state instead of recomputation: the idea behind every fancy tree structure you will meet.",
    starterCode: "class MinStack:\n    def __init__(self):\n        pass",
    hints: [
      "Keep two stacks: values, and minima where minima[i] is the min of values[0..i].",
      "On push x: minima.append(min(x, minima[-1])) — or x itself if empty.",
      "pop from both; get_min reads minima[-1]."
    ],
    solution: "class MinStack:\n    def __init__(self):\n        self.vals = []\n        self.mins = []\n    def push(self, x):\n        self.vals.append(x)\n        self.mins.append(x if not self.mins else min(x, self.mins[-1]))\n    def pop(self):\n        self.vals.pop()\n        self.mins.pop()\n    def top(self):\n        return self.vals[-1]\n    def get_min(self):\n        return self.mins[-1]",
    walkthrough: "mins is a monotone snapshot history: it never increases and pops unwind to exactly the min of the shorter stack. Space O(n) for O(1) queries — the standard exchange, and the reason 'min of a range/stack/window' questions are all answerable without rescanning.",
    testCode: "s = MinStack()\ns.push(2)\ns.push(1)\nassert s.get_min() == 1\ns.push(3)\nassert s.get_min() == 1\ns.pop()\nassert s.top() == 1\ns.pop()\nassert s.get_min() == 2\nprint('All tests passed!')"
  },
  {
    id: 36, stage: 6, title: "Next Greater Element", pattern: "monotonic stack", skill: "keep candidates in order", difficulty: "Medium",
    statement: "For each element of nums (distinct values), find the first element to its right that is greater; output -1 where none exists.",
    examples: [
      { input: "nums = [1, 3, 2, 4]", output: "[3, 4, 4, -1]" },
      { input: "nums = [5, 4, 3, 2, 1]", output: "[-1, -1, -1, -1, -1]" },
    ],
    why: "The naive answer scans right from each element — O(n²). The monotonic stack keeps a shortlist of 'waiting elements' in decreasing order; when a big element arrives, it resolves ALL waiting elements smaller than it at once. Amortized O(n): each index is pushed and popped once. This is the single most reused stack pattern in existence.",
    starterCode: "def next_greater(nums):\n    pass",
    hints: [
      "Walk left to right holding a stack of indices whose next-greater is still unknown.",
      "While the stack top's value < current value, the current value IS its next greater — pop and record.",
      "Push the current index; anything left on the stack at the end gets -1."
    ],
    solution: "def next_greater(nums):\n    out = [-1] * len(nums)\n    stack = []\n    for i, x in enumerate(nums):\n        while stack and nums[stack[-1]] < x:\n            out[stack.pop()] = x\n        stack.append(i)\n    return out",
    walkthrough: "The stack always holds indices with decreasing values — a monotone invariant. A new element pops everyone it dominates, answering multiple queries in one step; total pops ≤ total pushes, so linear despite the nested while. Compare with 'Next Greater' via sorted suffixes — this is the shape to memorize.",
    testCode: "assert next_greater([1, 3, 2, 4]) == [3, 4, 4, -1]\nassert next_greater([5, 4, 3, 2, 1]) == [-1, -1, -1, -1, -1]\nassert next_greater([2, 1, 3]) == [3, 3, -1]\nassert next_greater([7]) == [-1]\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 6, title: "Daily Temperatures", pattern: "monotonic stack, distance form", skill: "next greater, in disguise", difficulty: "Medium",
    statement: "temperatures[i] is day i's temperature. For each day, output how many days until a warmer one — 0 if never.",
    examples: [
      { input: "temps = [73, 74, 75, 71, 69, 72, 76, 73]", output: "[1, 1, 4, 2, 1, 1, 0, 0]" },
      { input: "temps = [30, 40, 50, 60]", output: "[1, 1, 1, 0]" },
    ],
    why: "This IS problem 36 — 'next strictly greater' — with the answer being a distance instead of a value. Pattern transfer is the actual skill being trained: once you can name a problem as a known pattern's variant, the code writes itself.",
    starterCode: "def daily_temps(temps):\n    pass",
    hints: [
      "Identical skeleton to next-greater, but output positions not values.",
      "On pop (day j resolved by warmer day i), out[j] = i - j.",
      "Unresolved days keep out[j] = 0."
    ],
    solution: "def daily_temps(temps):\n    n = len(temps)\n    out = [0] * n\n    stack = []\n    for i, t in enumerate(temps):\n        while stack and temps[stack[-1]] < t:\n            j = stack.pop()\n            out[j] = i - j\n        stack.append(i)\n    return out",
    walkthrough: "Same monotone stack; the only change is what gets written on pop. The stack holds days still waiting for warmth, in decreasing temperature. Note the strict < — equal temperatures do not resolve each other.",
    testCode: "assert daily_temps([73, 74, 75, 71, 69, 72, 76, 73]) == [1, 1, 4, 2, 1, 1, 0, 0]\nassert daily_temps([30, 40, 50, 60]) == [1, 1, 1, 0]\nassert daily_temps([70]) == [0]\nassert daily_temps([70, 70]) == [0, 0]\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 6, title: "Decode String", pattern: "stack of contexts", skill: "suspend and resume", difficulty: "Medium",
    statement: "Encoded string k[inner] means 'repeat inner k times'. Decode a string with nested repetitions: '3[a2[c]]' means 'accaccacc'.",
    examples: [
      { input: "s = '3[a]2[bc]'", output: "'aaabcbc'" },
      { input: "s = '3[a2[c]]'", output: "'accaccacc'" },
    ],
    why: "Nesting means the parser must suspend one context and start another — exactly what a stack is for. Each '[' saves (current string, repeat count) and each ']' resumes it. This suspend/resume shape is recursion implemented with an explicit stack, and seeing that equivalence is worth the problem by itself.",
    starterCode: "def decode(s):\n    pass",
    hints: [
      "Hold: current string, current number, and a stack of saved (string, number) pairs.",
      "On digit: extend the number (digits can be multi-digit). On '[': push and reset. On ']': pop (prev, k), set current = prev + current * k.",
      "Letters append to current."
    ],
    solution: "def decode(s):\n    cur = []\n    num = 0\n    stack = []\n    for ch in s:\n        if ch.isdigit():\n            num = num * 10 + int(ch)\n        elif ch == '[':\n            stack.append((cur, num))\n            cur = []\n            num = 0\n        elif ch == ']':\n            prev, k = stack.pop()\n            cur = prev + cur * k\n        else:\n            cur.append(ch)\n    return ''.join(cur)",
    walkthrough: "cur is the string being built at the current nesting depth. '[' snapshots (cur, num) and starts fresh; ']' multiplies and splices back. Python's cur * k on a list is the repeat; keeping cur as a list avoids quadratic string concatenation.",
    testCode: "assert decode('3[a]2[bc]') == 'aaabcbc'\nassert decode('3[a2[c]]') == 'accaccacc'\nassert decode('2[abc]3[cd]ef') == 'abcabccdcdcdef'\nassert decode('abc') == 'abc'\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 6, title: "Largest Rectangle", pattern: "monotonic stack, area form", skill: "widths from the stack", difficulty: "Hard",
    statement: "Given histogram bar heights (width 1 each), find the largest rectangle that fits under the skyline.",
    examples: [
      { input: "heights = [2, 1, 5, 6, 2, 3]", output: "10", explain: "bars 5 and 6 give height 5 × width 2" },
      { input: "heights = [1, 1, 1, 1]", output: "4" },
    ],
    why: "For each bar: how far can it extend left and right as the minimum? The monotonic stack answers both boundaries for every bar in one pass — the third and hardest dress of the same stack: distances (problem 37), values (36), now areas. Hard problems in this domain are rarely new patterns; they are known patterns with a harder quantity to extract.",
    starterCode: "def largest_rectangle(heights):\n    pass",
    hints: [
      "Append a sentinel 0 to the end — it forces every bar to be resolved.",
      "Pop when current height < stack top's height: the popped bar's rectangle has height h and width (current index) - (new stack top's index) - 1.",
      "Max over all pops."
    ],
    solution: "def largest_rectangle(heights):\n    stack = []\n    best = 0\n    extended = heights + [0]\n    for i, h in enumerate(extended):\n        while stack and extended[stack[-1]] > h:\n            height = extended[stack.pop()]\n            left = stack[-1] if stack else -1\n            width = i - left - 1\n            area = height * width\n            if area > best:\n                best = area\n        stack.append(i)\n    return best",
    walkthrough: "When bar j is popped by a shorter bar i, i is j's right boundary and the new stack top is j's left boundary — so width = i - left - 1 exactly. The sentinel 0 guarantees every bar eventually gets popped and measured. Each index pushes and pops once: O(n) for a question that looks quadratic.",
    testCode: "assert largest_rectangle([2, 1, 5, 6, 2, 3]) == 10\nassert largest_rectangle([2, 4]) == 4\nassert largest_rectangle([1, 1, 1, 1]) == 4\nassert largest_rectangle([5]) == 5\nassert largest_rectangle([2, 1, 2]) == 3\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 7, title: "Reverse Linked List", pattern: "pointer rewiring", skill: "three pointers, one sweep", difficulty: "Easy",
    statement: "Reverse a singly linked list iteratively and return the new head. Lists are built with ListNode(val, next) — helpers make_list(values) and to_pylist(head) are provided in the solution.",
    examples: [
      { input: "1 -> 2 -> 3", output: "3 -> 2 -> 1" },
      { input: "7", output: "7" },
    ],
    why: "Pointer surgery is the fundamental linked-list skill: the loop reverses one arrow per iteration while saving the next node before overwriting. No allocation, O(1) space — and the exact same loop appears inside k-group reversal and list reordering problems.",
    starterCode: "class ListNode:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\ndef make_list(values):\n    head = None\n    for v in reversed(values):\n        head = ListNode(v, head)\n    return head\n\ndef to_pylist(head):\n    out = []\n    while head:\n        out.append(head.val)\n        head = head.next\n    return out\n\ndef reverse_list(head):\n    pass",
    hints: [
      "prev = None; curr = head.",
      "Save nxt = curr.next BEFORE rewiring, then curr.next = prev.",
      "Slide: prev = curr; curr = nxt. Return prev at the end."
    ],
    solution: "class ListNode:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\ndef make_list(values):\n    head = None\n    for v in reversed(values):\n        head = ListNode(v, head)\n    return head\n\ndef to_pylist(head):\n    out = []\n    while head:\n        out.append(head.val)\n        head = head.next\n    return out\n\ndef reverse_list(head):\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev",
    walkthrough: "Three roles march along the list: done (prev), current, and the unexplored rest. Saving nxt before flipping is the whole game — flip first and the rest of the list is unreachable. Invariant: prev is the head of the reversed prefix.",
    testCode: "assert to_pylist(reverse_list(make_list([1, 2, 3]))) == [3, 2, 1]\nassert to_pylist(reverse_list(make_list([7]))) == [7]\nassert to_pylist(reverse_list(make_list([]))) == []\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 7, title: "Middle Of List", pattern: "fast and slow pointers", skill: "two speeds, one ruler", difficulty: "Easy",
    statement: "Return the middle node's value of a linked list. For even length, return the second middle.",
    examples: [
      { input: "1 -> 2 -> 3 -> 4 -> 5", output: "3" },
      { input: "1 -> 2 -> 3 -> 4", output: "3" },
    ],
    why: "Fast/slow is the trick that makes linked lists measurable without knowing their length: the fast pointer covers 2n while slow covers n, landing slow exactly mid-list. The same pair detects cycles (problem 43) and finds cycle starts — one trick, three problems.",
    starterCode: "def middle_value(head):\n    pass",
    hints: [
      "slow advances one node per step, fast advances two.",
      "Loop while fast and fast.next both exist.",
      "For even lengths, the loop's exit condition puts slow on the second middle."
    ],
    solution: "class ListNode:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\ndef make_list(values):\n    head = None\n    for v in reversed(values):\n        head = ListNode(v, head)\n    return head\n\ndef middle_value(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n    return slow.val",
    walkthrough: "When fast hits the end, slow has traveled half the distance — by definition the middle. Trace even n = 4: fast visits nodes 1, 3, then fast.next is node 4's next... fast stops after two double-steps with slow at node 3, the second middle. One pass, zero counters.",
    testCode: "assert middle_value(make_list([1, 2, 3, 4, 5])) == 3\nassert middle_value(make_list([1, 2, 3, 4])) == 3\nassert middle_value(make_list([9])) == 9\nassert middle_value(make_list([1, 2])) == 2\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 7, title: "Merge Two Sorted", pattern: "dummy head, two fingers", skill: "the dummy node trick", difficulty: "Medium",
    statement: "Merge two sorted linked lists into one sorted list and return its head (nodes reused, not copied).",
    examples: [
      { input: "1 -> 2 -> 4 and 1 -> 3 -> 4", output: "1 -> 1 -> 2 -> 3 -> 4 -> 4" },
      { input: "empty and 0 -> 1", output: "0 -> 1" },
    ],
    why: "The dummy node eliminates the 'which node is the head?' special case: attach to a fake head, return dummy.next. This trick sanitizes every list-building algorithm — merging, partitioning, deleting — and merges are the engine of merge sort, which returns in stage 3's inversions and stage 16's structures.",
    starterCode: "def merge_two(a, b):\n    pass",
    hints: [
      "dummy = ListNode(0); tail = dummy.",
      "While both lists live, attach the smaller head and advance that list.",
      "Attach whichever list remains, then return dummy.next."
    ],
    solution: "class ListNode:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\ndef make_list(values):\n    head = None\n    for v in reversed(values):\n        head = ListNode(v, head)\n    return head\n\ndef to_pylist(head):\n    out = []\n    while head:\n        out.append(head.val)\n        head = head.next\n    return out\n\ndef merge_two(a, b):\n    dummy = ListNode(0)\n    tail = dummy\n    while a and b:\n        if a.val <= b.val:\n            tail.next = a\n            a = a.next\n        else:\n            tail.next = b\n            b = b.next\n        tail = tail.next\n    tail.next = a if a else b\n    return dummy.next",
    walkthrough: "Two-finger merge from arrays, transplanted to pointers. Each step attaches one node — total O(n + m). The dummy means no branch for 'first node'; the final splice appends the leftover run in one assignment.",
    testCode: "assert to_pylist(merge_two(make_list([1, 2, 4]), make_list([1, 3, 4]))) == [1, 1, 2, 3, 4, 4]\nassert to_pylist(merge_two(None, make_list([0, 1]))) == [0, 1]\nassert to_pylist(merge_two(make_list([5]), make_list([2]))) == [2, 5]\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 7, title: "Detect Cycle", pattern: "Floyd's tortoise and hare", skill: "relative speed catches up", difficulty: "Medium",
    statement: "Return True if the linked list contains a cycle. To build one, nodes may be linked manually in the test — but your function only sees a head pointer.",
    examples: [
      { input: "1 -> 2 -> 3 -> (back to 2)", output: "True" },
      { input: "1 -> 2 -> 3", output: "False" },
    ],
    why: "You cannot mark visited nodes (no field, O(1) space required). The tortoise-and-hare argument: inside a cycle, the gap between fast and slow shrinks by one each step, so they must meet. It is a two-line algorithm resting on a one-paragraph proof — and the same runners find the cycle's entry point next.",
    starterCode: "def has_cycle(head):\n    pass",
    hints: [
      "slow moves 1, fast moves 2 per step.",
      "If fast reaches None (or fast.next is None), the list ends — no cycle.",
      "If slow == fast at any point, they are both inside the cycle."
    ],
    solution: "class ListNode:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\ndef has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            return True\n    return False",
    walkthrough: "Once both runners are in the cycle, the distance from fast to slow (measured forward) decreases by exactly 1 each step — so it hits 0. The None checks handle acyclic tails. Note the identity test (is, not ==) and that slow must be advanced before comparing.",
    testCode: "a, b, c = ListNode(1), ListNode(2), ListNode(3)\na.next = b\nb.next = c\nc.next = b\nassert has_cycle(a) == True\nx, y = ListNode(1), ListNode(2)\nx.next = y\nassert has_cycle(x) == False\nassert has_cycle(None) == False\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 7, title: "Remove Nth From End", pattern: "gap two pointers", skill: "fixed-width lag", difficulty: "Medium",
    statement: "Remove the n-th node from the end of the list in one pass and return the new head (as values).",
    examples: [
      { input: "1 -> 2 -> 3 -> 4 -> 5, n = 2", output: "[1, 2, 3, 5]" },
      { input: "1 -> 2, n = 1", output: "[1]" },
    ],
    why: "One pass requires knowing 'n from the end' without the length — so send a scout n nodes ahead and march both together. The scout hits the end exactly when the follower stands before the victim. The dummy node (problem 42) covers the 'delete the head' case for free.",
    starterCode: "def remove_nth(values, n):\n    pass",
    hints: [
      "Build the list, put a dummy in front, and advance first n + 1 nodes from dummy.",
      "Move first and second together until first is None.",
      "second.next = second.next.next — return the values after dummy."
    ],
    solution: "class ListNode:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next\n\ndef make_list(values):\n    head = None\n    for v in reversed(values):\n        head = ListNode(v, head)\n    return head\n\ndef to_pylist(head):\n    out = []\n    while head:\n        out.append(head.val)\n        head = head.next\n    return out\n\ndef remove_nth(values, n):\n    head = make_list(values)\n    dummy = ListNode(0, head)\n    first = dummy\n    for _ in range(n + 1):\n        first = first.next\n    second = dummy\n    while first:\n        first = first.next\n        second = second.next\n    second.next = second.next.next\n    return to_pylist(dummy.next)",
    walkthrough: "The n + 1 gap (counting from dummy) makes second the node BEFORE the target — exactly where rewiring must happen. The dummy removes the head-deletion special case. Two pointers with a constant gap is a recurring frame: it also finds cycle starts and middle nodes.",
    testCode: "assert remove_nth([1, 2, 3, 4, 5], 2) == [1, 2, 3, 5]\nassert remove_nth([1, 2], 1) == [1]\nassert remove_nth([1], 1) == []\nassert remove_nth([1, 2], 2) == [2]\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 7, title: "LRU Cache", pattern: "hash map + doubly linked list", skill: "O(1) for everything", difficulty: "Hard",
    statement: "Design an LRU (least recently used) cache with capacity cap: get(key) returns the value or -1, put(key, value) inserts/updates; when over capacity, evict the least recently used entry. Both operations must be O(1). Implement class LRUCache with __init__(self, cap), get, put.",
    examples: [
      { input: "cap = 2: put(1,1), put(2,2), get(1), put(3,3), get(2), get(3)", output: "1, -1, 3" },
      { input: "cap = 1: put(1,1), put(2,2), get(1)", output: "-1" },
    ],
    why: "The dictionary gives O(1) lookup but no order; the linked list gives O(1) reordering but no lookup. Gluing them — each node also lives in the dict — gives both. This fusion of two simple structures into one composite is THE design pattern for caches, and the interview classic that proves you can reason about invariants under eviction.",
    starterCode: "class LRUCache:\n    def __init__(self, cap):\n        pass",
    hints: [
      "Keep a dict key -> node, plus head/tail sentinels for a doubly linked list ordered by recency.",
      "On get/put of an existing key: unlink the node, relink at the front (most recent).",
      "On insert over capacity: unlink the node before the tail sentinel and delete its key from the dict."
    ],
    solution: "class _Node:\n    def __init__(self, k=0, v=0):\n        self.k = k\n        self.v = v\n        self.prev = None\n        self.next = None\n\nclass LRUCache:\n    def __init__(self, cap):\n        self.cap = cap\n        self.map = {}\n        self.head = _Node()\n        self.tail = _Node()\n        self.head.next = self.tail\n        self.tail.prev = self.head\n    def _unlink(self, node):\n        node.prev.next = node.next\n        node.next.prev = node.prev\n    def _to_front(self, node):\n        node.next = self.head.next\n        node.prev = self.head\n        self.head.next.prev = node\n        self.head.next = node\n    def get(self, key):\n        if key not in self.map:\n            return -1\n        node = self.map[key]\n        self._unlink(node)\n        self._to_front(node)\n        return node.v\n    def put(self, key, value):\n        if key in self.map:\n            node = self.map[key]\n            node.v = value\n            self._unlink(node)\n            self._to_front(node)\n            return\n        if len(self.map) == self.cap:\n            lru = self.tail.prev\n            self._unlink(lru)\n            del self.map[lru.k]\n        node = _Node(key, value)\n        self.map[key] = node\n        self._to_front(node)",
    walkthrough: "Sentinel head/tail mean every unlink/relink is pure pointer rewiring with no edge cases; the dict stores the key so eviction can find what to delete. Trace the example: after get(1) the order is [1, 2]; put(3) evicts 2; get(2) is -1. Every operation O(1) — the cache is the proof that combining structures can beat either alone.",
    testCode: "c = LRUCache(2)\nc.put(1, 1)\nc.put(2, 2)\nassert c.get(1) == 1\nc.put(3, 3)\nassert c.get(2) == -1\nassert c.get(3) == 3\nc.put(4, 4)\nassert c.get(1) == -1\nassert c.get(3) == 3\nassert c.get(4) == 4\nc2 = LRUCache(1)\nc2.put(1, 1)\nc2.put(2, 2)\nassert c2.get(1) == -1\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 8, title: "Subsets", pattern: "backtracking, include or not", skill: "choose, explore, unchoose", difficulty: "Easy",
    statement: "Given distinct integers, return all subsets (the power set). Return them sorted: each subset sorted, then the list of subsets sorted.",
    examples: [
      { input: "nums = [1, 2, 3]", output: "[[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]" },
      { input: "nums = [0]", output: "[[], [0]]" },
    ],
    why: "Backtracking in its purest form: at each element you make a binary choice — include or skip — recurse, and undo. The 2ⁿ leaves ARE the power set. Every search-with-undo algorithm (permutations, sudokus, queens) is this skeleton with a bigger choice set and a stronger prune.",
    starterCode: "def subsets(nums):\n    pass",
    hints: [
      "Recurse with a start index and a current path.",
      "At every call, record a copy of the path — every prefix is a valid subset.",
      "Loop i from start to n: append nums[i], recurse(i + 1), pop."
    ],
    solution: "def subsets(nums):\n    out = []\n    path = []\n    def backtrack(start):\n        out.append(path[:])\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            backtrack(i + 1)\n            path.pop()\n    backtrack(0)\n    return sorted(out)",
    walkthrough: "The recursion tree has one node per subset — recording at entry (before any choice) collects them all. path.pop() is the undo that returns the shared path to its previous state; copying on record is what makes each snapshot independent. Sorted output keeps tests deterministic.",
    testCode: "assert subsets([1, 2, 3]) == [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]\nassert subsets([0]) == [[], [0]]\nassert subsets([]) == [[]]\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 8, title: "Permutations", pattern: "backtracking with used flags", skill: "order matters now", difficulty: "Medium",
    statement: "Given distinct integers, return all permutations. Each permutation sorted internally, and the full list sorted.",
    examples: [
      { input: "nums = [1, 2, 3]", output: "[[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]" },
      { input: "nums = [0, 1]", output: "[[0, 1], [1, 0]]" },
    ],
    why: "Subsets chose 'in or out'; permutations choose 'which unused element goes next' — the choice set shrinks as you descend. n! leaves instead of 2ⁿ. The used[] flag replaces the start index as the dedup mechanism: same skeleton, different bookkeeping, and you should feel how little changed.",
    starterCode: "def permutations(nums):\n    pass",
    hints: [
      "Keep path and used, one boolean per element.",
      "At each level, try every element with used False.",
      "Mark used True, recurse, unmark — the unmark is what lets the next branch use it."
    ],
    solution: "def permutations(nums):\n    out = []\n    path = []\n    used = [False] * len(nums)\n    def backtrack():\n        if len(path) == len(nums):\n            out.append(path[:])\n            return\n        for i in range(len(nums)):\n            if used[i]:\n                continue\n            used[i] = True\n            path.append(nums[i])\n            backtrack()\n            path.pop()\n            used[i] = False\n    backtrack()\n    return sorted(out)",
    walkthrough: "Depth = permutation length; the used array defines the available choices at each node. n! results for n elements — the search tree IS the answer space. Comparing with problem 46: backtracking's parameterization (what defines 'used up', what defines 'next choices') is the reusable part.",
    testCode: "assert permutations([1, 2, 3]) == [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]]\nassert permutations([0, 1]) == [[0, 1], [1, 0]]\nassert permutations([5]) == [[5]]\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 8, title: "Combination Sum", pattern: "backtracking with reuse and pruning", skill: "unbounded choices, ordered search", difficulty: "Medium",
    statement: "Given distinct candidate values (each usable unlimited times) and a target, return all unique combinations summing to target. Each combination sorted, full list sorted.",
    examples: [
      { input: "candidates = [2, 3, 6, 7], target = 7", output: "[[2, 2, 3], [7]]" },
      { input: "candidates = [2, 3, 5], target = 8", output: "[[2, 2, 2, 2], [2, 3, 3], [3, 5]]" },
    ],
    why: "Reuse without duplicate outputs is the subtle part: recurse with start = i (not i + 1) so combinations are generated in non-decreasing candidate order — every multiset appears exactly once. Sorting candidates first also enables pruning: once a candidate overshoots, all later ones do too.",
    starterCode: "def combination_sum(candidates, target):\n    pass",
    hints: [
      "Sort candidates. Backtrack(start, remaining).",
      "For i from start: if candidates[i] > remaining, break (prune the whole tail).",
      "Otherwise append, recurse(i, remaining - candidates[i]) — note i, not i + 1: reuse allowed — then pop."
    ],
    solution: "def combination_sum(candidates, target):\n    cands = sorted(candidates)\n    out = []\n    path = []\n    def backtrack(start, remaining):\n        if remaining == 0:\n            out.append(path[:])\n            return\n        for i in range(start, len(cands)):\n            if cands[i] > remaining:\n                break\n            path.append(cands[i])\n            backtrack(i, remaining - cands[i])\n            path.pop()\n    backtrack(0, target)\n    return sorted(out)",
    walkthrough: "The start index encodes 'no candidate before i may appear again in this branch' — which kills permutation-duplicates while allowing repeats of i itself. The sorted break-prune turns dead branches into O(1) exits. Two backtracking refinements in one problem: ordered generation and monotone pruning.",
    testCode: "assert combination_sum([2, 3, 6, 7], 7) == [[2, 2, 3], [7]]\nassert combination_sum([2, 3, 5], 8) == [[2, 2, 2, 2], [2, 3, 3], [3, 5]]\nassert combination_sum([2], 1) == []\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 8, title: "Word Search", pattern: "grid backtracking", skill: "explore four ways, mark and unmark", difficulty: "Medium",
    statement: "Given a grid of letters and a word, return True if the word can be traced by moving between adjacent cells (up/down/left/right), using each cell at most once per path.",
    examples: [
      { input: "board = [['A','B','C','E'], ['S','F','C','S'], ['A','D','E','E']], word = 'ABCCED'", output: "True" },
      { input: "same board, word = 'ABCB'", output: "False", explain: "would need to reuse B" },
    ],
    why: "Backtracking leaves the 1-D world: the state is (position, progress) and choices are the four directions, with the visited mark preventing loops. Mark-visit-unmark on the board itself avoids allocating a visited set — and the unmark is what allows the same cell in a different path attempt.",
    starterCode: "def word_search(board, word):\n    pass",
    hints: [
      "Recurse from each cell as a potential start.",
      "At (r, c, i): out-of-bounds or board[r][c] != word[i] means fail; i == last means success.",
      "Mark board[r][c] = '#', try the four neighbors, then restore the original letter."
    ],
    solution: "def word_search(board, word):\n    rows, cols = len(board), len(board[0])\n    def dfs(r, c, i):\n        if i == len(word):\n            return True\n        if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != word[i]:\n            return False\n        saved = board[r][c]\n        board[r][c] = '#'\n        found = dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1)\n        board[r][c] = saved\n        return found\n    for r in range(rows):\n        for c in range(cols):\n            if dfs(r, c, 0):\n                return True\n    return False",
    walkthrough: "The mark turns the cell impassable for the rest of this path and the restore reopens it for sibling branches — the grid version of used[] flags. The i == len check placed first handles the empty-word edge cleanly. Exponential worst case, but pruning by first-letter mismatch keeps real grids tractable.",
    testCode: "b1 = [['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']]\nassert word_search(b1, 'ABCCED') == True\nassert word_search(b1, 'SEE') == True\nassert word_search(b1, 'ABCB') == False\nassert word_search([['A']], 'A') == True\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 8, title: "Palindrome Partitioning", pattern: "backtracking over cut points", skill: "the choice is where to cut", difficulty: "Hard",
    statement: "Split a string into parts where every part is a palindrome; return all such partitions. Each partition is a list of parts; return the full list sorted.",
    examples: [
      { input: "s = 'aab'", output: "[['a', 'a', 'b'], ['aa', 'b']]" },
      { input: "s = 'a'", output: "[['a']]" },
    ],
    why: "The choice is no longer 'which element' but 'where does the next piece end' — backtracking over cut positions. The validity check (palindrome) is applied at push time, pruning whole subtrees; and this problem is DP-on-intervals in disguise, foreshadowing the interval DP of stage 15.",
    starterCode: "def palindrome_partitions(s):\n    pass",
    hints: [
      "backtrack(start, path): if start == len(s), record path.",
      "For end from start+1 to len(s): if s[start:end] is a palindrome, append it, recurse(end), pop.",
      "A plain is_palindrome check is fine at this size."
    ],
    solution: "def palindrome_partitions(s):\n    out = []\n    path = []\n    def is_pal(lo, hi):\n        while lo < hi:\n            if s[lo] != s[hi]:\n                return False\n            lo += 1\n            hi -= 1\n        return True\n    def backtrack(start):\n        if start == len(s):\n            out.append(path[:])\n            return\n        for end in range(start + 1, len(s) + 1):\n            if is_pal(start, end - 1):\n                path.append(s[start:end])\n                backtrack(end)\n                path.pop()\n    backtrack(0)\n    return sorted(out)",
    walkthrough: "Each level of the tree fixes the next cut: try every palindromic prefix of the remainder. The palindrome test before recursing is a push-time prune — invalid cuts never spawn subtrees. Sorted output; and note how start-to-end indexing makes 'cut here' concrete.",
    testCode: "assert palindrome_partitions('aab') == [['a', 'a', 'b'], ['aa', 'b']]\nassert palindrome_partitions('a') == [['a']]\nassert palindrome_partitions('ab') == [['a', 'b']]\nassert palindrome_partitions('aa') == [['a', 'a'], ['aa']]\nprint('All tests passed!')"
  },
  {
    id: 51, stage: 8, title: "N Queens", pattern: "backtracking with constraint sets", skill: "prune with marks, not scans", difficulty: "Hard",
    statement: "Place n queens on an n×n board so no two attack each other. Return the number of distinct solutions for n.",
    examples: [
      { input: "n = 4", output: "2" },
      { input: "n = 8", output: "92" },
    ],
    why: "The classic constraint-satisfaction backtracker. The engineering lesson is in the marks: three boolean sets (columns, and the two diagonal families indexed by r+c and r-c) make each placement test O(1) instead of scanning prior rows. Choosing data structures so that pruning is cheap is what makes exponential search survivable.",
    starterCode: "def n_queens(n):\n    pass",
    hints: [
      "Place one queen per row, left to right — rows can never conflict by construction.",
      "Track used columns; used diagonals via r + c and r - c (the r - c key needs a set, it can go negative).",
      "On success in the last row, count += 1; otherwise recurse to the next row and undo the marks."
    ],
    solution: "def n_queens(n):\n    cols = set()\n    diag1 = set()\n    diag2 = set()\n    count = 0\n    def place(r):\n        nonlocal count\n        if r == n:\n            count += 1\n            return\n        for c in range(n):\n            if c in cols or (r + c) in diag1 or (r - c) in diag2:\n                continue\n            cols.add(c)\n            diag1.add(r + c)\n            diag2.add(r - c)\n            place(r + 1)\n            cols.remove(c)\n            diag1.remove(r + c)\n            diag2.remove(r - c)\n    place(0)\n    return count",
    walkthrough: "Every queen on the same anti-diagonal shares r + c; every queen on the same main diagonal shares r - c — two integer keys collapse 2D attacks into set membership. The search tries only columns that survive three O(1) checks. n = 8's 92 solutions cost milliseconds only because pruning happens before recursion.",
    testCode: "assert n_queens(1) == 1\nassert n_queens(4) == 2\nassert n_queens(5) == 10\nassert n_queens(6) == 4\nassert n_queens(8) == 92\nprint('All tests passed!')"
  },
]
