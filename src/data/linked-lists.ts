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

export const STAGES_LINKED_LISTS = [
  { id: 0, name: "Pointer Reflex", desc: "boxes and arrows" },
  { id: 1, name: "The Runner", desc: "while cur: cur=cur.next" },
  { id: 2, name: "Pointer Surgery", desc: "relinking" },
  { id: 3, name: "Fast & Slow", desc: "relative motion" },
  { id: 4, name: "Naive", desc: "extra space" },
  { id: 5, name: "Optimization", desc: "O(1) space" },
  { id: 6, name: "Mastery", desc: "compose" },
]

export const PROBLEMS_LINKED_LISTS: Problem[] = [
  // ═══════════════════════════════════════════════════════════════
  // STAGE 0 — Pointer Reflex (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 1, stage: 0, title: "Trace Assignments", pattern: "pointer basics", skill: "variable-to-node mapping",
    statement: "Given two nodes a and b where a.next points to b. After the code runs, return the val of the node that variable x points to. Trace the assignments on paper first, then write the tracing function.",
    examples: [
      { input: "a=1, b=2", output: "1", explain: "x=a gives x→1; a=a.next gives a→2; x still→1" },
    ],
    why: "Installs the mental model that variables are ARROWS pointing to boxes. Changing where one arrow points does not move the other.",
    starterCode: "def trace_assignments(a, b):\n    x = a\n    a = a.next\n    return x.val",
    hints: [
      "Draw two boxes (a=1, b=2) with an arrow from a.next to b.",
      "After x = a, both x and a point to the first box.",
      "a = a.next moves ONLY a's arrow. x stays pointing at the original box. Return x.val."
    ],
    solution: "def trace_assignments(a, b):\n    x = a\n    a = a.next\n    return x.val",
    walkthrough: "Variables are arrows to boxes. When you write x = a, you make x point to whatever a points to (not to a itself!). When a is reassigned, x doesn't move. This distinction is the entire linked list mental model.",
    testCode: "n2 = ListNode(2)\nn1 = ListNode(1, n2)\nassert trace_assignments(n1, n2) == 1\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Alias vs Copy", pattern: "pointer basics", skill: "reference identity",
    statement: "Given a node head, write code that creates a second variable pointing to the same node. Then modify node.val through the second variable. Return (original_variable_value, head.val) to prove they reference the same object.",
    examples: [
      { input: "head.val = 5", output: "(10, 10)", explain: "changing via alias changed the original" },
    ],
    why: "Same arrow model as P1, new insight: two variables can point to the SAME box. Mutating through either affects both. No copy is created.",
    starterCode: "def alias_demo(head):\n    alias = head\n    head.val = 10\n    return (alias.val, head.val)",
    hints: [
      "Create alias = head. What does this actually do?",
      "It copies the arrow (reference), NOT the box (object).",
      "Change head.val to 10. Both alias.val and head.val are 10 — they're the same box."
    ],
    solution: "def alias_demo(head):\n    alias = head\n    head.val = 10\n    return (alias.val, head.val)",
    walkthrough: "alias = head copies the ARROW, not the node. Both variables now point to the same ListNode object. Changing node.val through one variable is visible through the other. This is why prev and cur in reversal can manipulate the same list.",
    testCode: "n = ListNode(5)\nassert alias_demo(n) == (10, 10)\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Predict After Relinks", pattern: "pointer basics", skill: "follow .next chains",
    statement: "Given a 3-node list 1→2→3. After executing the following relinks, return the list as an array: `head.next = head.next.next`. Trace the effect on the .next chain.",
    examples: [
      { input: "list = 1→2→3", output: "[1, 3]", explain: "head.next now skips node 2" },
    ],
    why: "First time MODIFYING the .next chain. Same arrow model: changing a .next is like redirecting an arrow to a different box.",
    starterCode: "def skip_second(head):\n    pass",
    hints: [
      "Draw three boxes: 1→2→3. head.next points to 2.",
      "head.next.next = 3. head.next = head.next.next means head.next now points to 3.",
      "Node 2 is orphaned. head.next = head.next.next"
    ],
    solution: "def skip_second(head):\n    head.next = head.next.next\n    result = []\n    cur = head\n    while cur:\n        result.append(cur.val)\n        cur = cur.next\n    return result",
    walkthrough: "head.next = head.next.next redirects the arrow from node 2 to node 3. Node 2 still exists in memory but nothing points to it. This is deletion by pointer surgery — the foundation of Stage 2.",
    testCode: "n3 = ListNode(3)\nn2 = ListNode(2, n3)\nn1 = ListNode(1, n2)\nassert skip_second(n1) == [1, 3]\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Build from Array", pattern: "iteration", skill: "create and link nodes",
    statement: "Given an array of integers, build and return a singly-linked list where each element becomes a node. Return the head node.",
    examples: [
      { input: "arr = [1, 2, 3]", output: "1→2→3" },
      { input: "arr = []", output: "None" },
    ],
    why: "First time CREATING nodes and linking them. This is the factory that makes all later problems possible. Cement the pattern: create head, keep cur, walk forward attaching.",
    starterCode: "def build_from_array(arr):\n    pass",
    hints: [
      "Guard: if arr is empty, return None.",
      "Create head from first element. Use a cur pointer starting at head.",
      "For each remaining val: cur.next = ListNode(val); cur = cur.next. Return head."
    ],
    solution: "def build_from_array(arr):\n    if not arr:\n        return None\n    head = ListNode(arr[0])\n    cur = head\n    for val in arr[1:]:\n        cur.next = ListNode(val)\n        cur = cur.next\n    return head",
    walkthrough: "The constructor pattern: create head once, then iterate with cur ALWAYS pointing to the last node. Each iteration: create new node, attach to cur.next, advance cur. This pattern appears in merge-two-lists, add-two-numbers, and every result-building problem.",
    testCode: "h = build_from_array([1,2,3])\nassert list_to_arr(h) == [1,2,3]\nassert build_from_array([]) is None\nassert list_to_arr(build_from_array([5])) == [5]\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Print with While", pattern: "iteration", skill: "while cur: cur = cur.next",
    statement: "Given head of a linked list, print each node's value on its own line. The skeleton `cur=head; while cur: print(cur.val); cur=cur.next` will power every list traversal.",
    examples: [
      { input: "list = 1→2→3", output: "1\\n2\\n3\\n" },
    ],
    why: "Same build-from-array walk but in reverse: instead of building, we're reading. The while-cur skeleton is IDENTICAL to P4 but the body prints instead of constructing.",
    starterCode: "def print_list(head):\n    pass",
    hints: [
      "What loop condition stops when there are no more nodes?",
      "cur = head; while cur is not None: do something, then cur = cur.next.",
      "while cur: print(cur.val); cur = cur.next"
    ],
    solution: "def print_list(head):\n    cur = head\n    while cur:\n        print(cur.val)\n        cur = cur.next",
    walkthrough: "The traversal skeleton: cur starts at head, at each step prints cur.val, then follows cur.next to the next node. When cur becomes None (past the tail), the loop ends. This is THE linked list loop.",
    testCode: "import sys,io\nbuf=io.StringIO()\nold=sys.stdout\nsys.stdout=buf\nprint_list(build_list([1,2,3]))\nsys.stdout=old\nassert buf.getvalue()=='1\\n2\\n3\\n'\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 0, title: "Count Length", pattern: "iteration", skill: "accumulator in while loop",
    statement: "Given head, return the number of nodes in the list. Use the same while-cur skeleton as P5 but with a counter instead of a print.",
    examples: [
      { input: "list = 1→2→3", output: "3" },
      { input: "list = []", output: "0" },
    ],
    why: "Same walk as P5, different objective. The skeleton `cur=head; while cur: ...; cur=cur.next` is unchanged. Only the body changes: counter += 1 instead of print.",
    starterCode: "def count_nodes(head):\n    pass",
    hints: [
      "What variable starts at 0 and grows by 1 each iteration?",
      "Same loop as P5: while cur: counter += 1; cur = cur.next.",
      "count = 0; cur = head; while cur: count += 1; cur = cur.next; return count"
    ],
    solution: "def count_nodes(head):\n    count = 0\n    cur = head\n    while cur:\n        count += 1\n        cur = cur.next\n    return count",
    walkthrough: "Identical skeleton to P5. Difference: count += 1 instead of print. The loop shape doesn't change — only what you DO inside each iteration changes. This 'same skeleton, different payload' is the entire Stage 0 pattern.",
    testCode: "assert count_nodes(build_list([1,2,3])) == 3\nassert count_nodes(build_list([])) == 0\nassert count_nodes(build_list([5])) == 1\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 0, title: "Sum Values", pattern: "iteration", skill: "accumulator in while loop",
    statement: "Given head, return the sum of all node values. Use the identical while-cur skeleton from P5 and P6.",
    examples: [
      { input: "list = 1→2→3→4", output: "10" },
      { input: "list = []", output: "0" },
    ],
    why: "Same walk as P5 and P6. The while-cur skeleton is now automatic. Only the payload changes: total += cur.val instead of count += 1.",
    starterCode: "def sum_list(head):\n    pass",
    hints: [
      "What variable starts at 0 and accumulates cur.val each iteration?",
      "Same loop: while cur: total += cur.val; cur = cur.next.",
      "total = 0; cur = head; while cur: total += cur.val; cur = cur.next; return total"
    ],
    solution: "def sum_list(head):\n    total = 0\n    cur = head\n    while cur:\n        total += cur.val\n        cur = cur.next\n    return total",
    walkthrough: "The while-cur skeleton should feel like breathing now: cur = head, while cur:, operate, cur = cur.next, return. Three problems (P5, P6, P7) with the identical skeleton, three different payloads. This is fluency.",
    testCode: "assert sum_list(build_list([1,2,3,4])) == 10\nassert sum_list(build_list([])) == 0\nassert sum_list(build_list([-1, 2, -3])) == -2\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 1 — The Runner (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 8, stage: 1, title: "Search Target", pattern: "traversal", skill: "early-exit from while loop",
    statement: "Given head and a target value, return True if the target exists in the list, False otherwise. Stop early if found.",
    examples: [
      { input: "list=1→2→3→4, target=3", output: "True" },
      { input: "list=1→2→3→4, target=5", output: "False" },
    ],
    why: "Same walk as P5-P7 but with an early exit. The while-cur skeleton now has a second exit condition: found the target. Still the same skeleton.",
    starterCode: "def search_list(head, target):\n    pass",
    hints: [
      "What condition inside the loop lets you return immediately?",
      "while cur: if cur.val == target: return True; cur = cur.next.",
      "After the loop, return False — you walked the whole list without finding it."
    ],
    solution: "def search_list(head, target):\n    cur = head\n    while cur:\n        if cur.val == target:\n            return True\n        cur = cur.next\n    return False",
    walkthrough: "Same skeleton. New idea: early-exit inside the loop. If you find the target, don't walk the rest. If the loop exhausts, the target wasn't there. The while-cur skeleton supports both patterns.",
    testCode: "assert search_list(build_list([1,2,3,4]), 3) == True\nassert search_list(build_list([1,2,3,4]), 5) == False\nassert search_list(build_list([]), 1) == False\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Find Last Node", pattern: "traversal", skill: "walk to None sentinel",
    statement: "Given head of non-empty list, return the last node (the one whose .next is None). Use the while-cur skeleton.",
    examples: [
      { input: "list=1→2→3", output: "3" },
      { input: "list=5", output: "5" },
    ],
    why: "Same walk as P8 but the target is structural: a node whose .next is None. The while condition shifts: walk UNTIL the next node is None, not past it.",
    starterCode: "def get_tail(head):\n    pass",
    hints: [
      "If you walk until cur is None, you lose the last node. What condition keeps the last node?",
      "while cur.next: walk. That way cur stops at the LAST node, not past it.",
      "cur = head; while cur.next: cur = cur.next; return cur"
    ],
    solution: "def get_tail(head):\n    cur = head\n    while cur.next:\n        cur = cur.next\n    return cur",
    walkthrough: "Subtle shift: `while cur` walks PAST the tail (to None). `while cur.next` stops AT the tail (last real node). Same skeleton, different loop condition. This distinction matters for all insertion-at-tail problems.",
    testCode: "assert get_tail(build_list([1,2,3])).val == 3\nassert get_tail(build_list([5])).val == 5\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Node at Index", pattern: "traversal", skill: "index tracking in while loop",
    statement: "Given head and 0-based index i, return the node at that position. If index is out of bounds, return None.",
    examples: [
      { input: "list=1→2→3→4, i=2", output: "3" },
      { input: "list=1→2→3, i=5", output: "None" },
    ],
    why: "Same walk as P6 (count length) but now the count IS the exit condition. The counter drives the loop: stop when counter reaches i.",
    starterCode: "def get_node_at(head, i):\n    pass",
    hints: [
      "Track position with a counter that starts at 0.",
      "while cur and pos < i: pos += 1; cur = cur.next.",
      "After the loop, if pos == i and cur exists, return cur. Otherwise return None."
    ],
    solution: "def get_node_at(head, i):\n    cur = head\n    pos = 0\n    while cur and pos < i:\n        cur = cur.next\n        pos += 1\n    return cur if pos == i and cur else None",
    walkthrough: "Same runner pattern as P6 but now the counter is the exit condition. The loop walks i steps forward. If the list is shorter, cur becomes None before pos reaches i. Both cases handled by the final check.",
    testCode: "assert get_node_at(build_list([1,2,3,4]), 2).val == 3\nassert get_node_at(build_list([1,2,3]), 5) is None\nassert get_node_at(build_list([1,2,3]), 0).val == 1\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Sum Values Recursively", pattern: "recursion", skill: "void traversal as recursion",
    statement: "Given head, return sum of all node values using recursion instead of a while loop.",
    examples: [
      { input: "list=1→2→3→4", output: "10" },
    ],
    why: "Same objective as P7 (sum) but recursion instead of iteration. The 'walk to end' becomes the recursive call stack. head.val + sum_of_rest expresses the same idea as the while loop but in a different language.",
    starterCode: "def sum_recursive(head):\n    pass",
    hints: [
      "Base case: what does an empty list contribute to the sum?",
      "This node contributes head.val + the sum of the rest of the list.",
      "return 0 if head is None else head.val + sum_recursive(head.next)"
    ],
    solution: "def sum_recursive(head):\n    if head is None:\n        return 0\n    return head.val + sum_recursive(head.next)",
    walkthrough: "Recursion is just another way to express 'walk the list.' Base: empty list returns 0. Recursive: this node's value + sum of everything after. The call stack walks forward; the return values accumulate backward. Same idea as P7, different language.",
    testCode: "assert sum_recursive(build_list([1,2,3,4])) == 10\nassert sum_recursive(build_list([])) == 0\nassert sum_recursive(build_list([-1, 5])) == 4\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Count Recursively", pattern: "recursion", skill: "1 + recurse pattern",
    statement: "Given head, return the number of nodes using recursion.",
    examples: [
      { input: "list=1→2→3", output: "3" },
    ],
    why: "Same skeleton as P11 (recursive sum) but the contribution is 1 instead of head.val. Identical shape: base returns 0, recursive returns contribution + recurse(rest).",
    starterCode: "def count_recursive(head):\n    pass",
    hints: [
      "Base case: empty list has 0 nodes.",
      "This node counts as 1 + the number of nodes in the rest.",
      "return 0 if head is None else 1 + count_recursive(head.next)"
    ],
    solution: "def count_recursive(head):\n    if head is None:\n        return 0\n    return 1 + count_recursive(head.next)",
    walkthrough: "Compare to P11 line by line. Only difference: 1 instead of head.val. The recursive shape (base=0, combine head contribution + recurse) is identical. This is the '1 + recurse' skeleton — it generalizes across linked lists and trees.",
    testCode: "assert count_recursive(build_list([1,2,3])) == 3\nassert count_recursive(build_list([])) == 0\nassert count_recursive(build_list([5,4,3,2,1])) == 5\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 1, title: "Reverse Print Recursively", pattern: "recursion", skill: "post-order traversal",
    statement: "Given head, print node values in REVERSE order (tail first) using recursion. Do not create a second list.",
    examples: [
      { input: "list=1→2→3", output: "3\\n2\\n1\\n" },
    ],
    why: "First time recursion ORDER matters. Print AFTER the recursive call, not before. The call stack naturally reverses the order: deepest call (tail) prints first.",
    starterCode: "def reverse_print(head):\n    pass",
    hints: [
      "Recurse first, then print. What order does that produce?",
      "The call stack unwinds from tail to head — print during the unwind.",
      "if head is None: return; reverse_print(head.next); print(head.val)"
    ],
    solution: "def reverse_print(head):\n    if head is None:\n        return\n    reverse_print(head.next)\n    print(head.val)",
    walkthrough: "The magic of post-order: recurse all the way to the end (None), then as each call unwinds, print head.val. The deepest call prints tail first because it's the first to unwind. Pre-order would print head first; post-order prints head last.",
    testCode: "import sys,io\nbuf=io.StringIO()\nold=sys.stdout\nsys.stdout=buf\nreverse_print(build_list([1,2,3]))\nsys.stdout=old\nassert buf.getvalue()=='3\\n2\\n1\\n'\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 2 — Pointer Surgery (8 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 14, stage: 2, title: "Reverse List (3-Pointer) ★", pattern: "relinking", skill: "prev-cur-nxt choreography",
    statement: "Reverse a singly-linked list IN PLACE. Use three pointers: prev, cur, nxt. Return the new head (old tail). This is the single most important linked list function.",
    examples: [
      { input: "list=1→2→3→4", output: "4→3→2→1" },
      { input: "list=[]", output: "None" },
    ],
    why: "★★★ THE KEY PRIMITIVE. Every relinking problem (insert, delete, rotate, swap) is a variation of this 3-pointer dance. If you cannot reverse a list in your sleep, you cannot solve any surgical problem.",
    starterCode: "def reverse_list(head):\n    prev = None\n    cur = head\n    pass",
    hints: [
      "Before breaking cur.next, what must you save?",
      "Sequence: save cur.next, redirect cur.next to prev, advance prev and cur.",
      "while cur: nxt = cur.next; cur.next = prev; prev = cur; cur = nxt; return prev"
    ],
    solution: "def reverse_list(head):\n    prev = None\n    cur = head\n    while cur:\n        nxt = cur.next\n        cur.next = prev\n        prev = cur\n        cur = nxt\n    return prev",
    walkthrough: "Four lines inside the loop. (1) Save the next node (nxt=cur.next) so you don't lose it. (2) Flip cur's arrow backward (cur.next=prev). (3) Advance prev to cur. (4) Advance cur to nxt. When cur hits None, prev is the old tail — the new head. The dance is: save, flip, advance.",
    testCode: "assert list_to_arr(reverse_list(build_list([1,2,3,4]))) == [4,3,2,1]\nassert list_to_arr(reverse_list(build_list([1]))) == [1]\nassert reverse_list(build_list([])) is None\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Insert Head", pattern: "relinking", skill: "new-node.next = head",
    statement: "Insert a new node with given value at the HEAD of the list. Return the new head.",
    examples: [
      { input: "list=2→3, val=1", output: "1→2→3" },
      { input: "list=[], val=5", output: "5" },
    ],
    why: "Simplest relink: new node's next points to old head. New node IS the new head. Two lines: create, point, return.",
    starterCode: "def insert_head(head, val):\n    pass",
    hints: [
      "Create a new ListNode(val). Where should its .next point?",
      "new_node.next = head.",
      "return ListNode(val, head) — one line or two explicit lines."
    ],
    solution: "def insert_head(head, val):\n    new_node = ListNode(val)\n    new_node.next = head\n    return new_node",
    walkthrough: "Simplest surgery. Create a new node. Its .next points to the current head (which could be None for empty list). The new node is now the head. This is the building block for all insertions.",
    testCode: "assert list_to_arr(insert_head(build_list([2,3]), 1)) == [1,2,3]\nassert list_to_arr(insert_head(build_list([]), 5)) == [5]\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Insert Tail", pattern: "relinking", skill: "walk to end then attach",
    statement: "Insert a new node with given value at the TAIL of the list. Return the head (may be unchanged unless list was empty).",
    examples: [
      { input: "list=1→2, val=3", output: "1→2→3" },
      { input: "list=[], val=1", output: "1" },
    ],
    why: "Composes P9 (find last node) and P15 (attach pointer). Walk to tail using while cur.next, then tail.next = new_node.",
    starterCode: "def insert_tail(head, val):\n    pass",
    hints: [
      "If list is empty, insertion is the same as insert_head.",
      "Otherwise, find tail: cur=head; while cur.next: cur=cur.next.",
      "Tail found. Create new node: cur.next = ListNode(val). Return head."
    ],
    solution: "def insert_tail(head, val):\n    if head is None:\n        return ListNode(val)\n    cur = head\n    while cur.next:\n        cur = cur.next\n    cur.next = ListNode(val)\n    return head",
    walkthrough: "Two cases: empty list → new node is the whole list. Non-empty → walk to tail (P9's while cur.next pattern), then attach. The head stays the same, but the tail node's .next changes from None to the new node.",
    testCode: "assert list_to_arr(insert_tail(build_list([1,2]), 3)) == [1,2,3]\nassert list_to_arr(insert_tail(build_list([]), 1)) == [1]\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Delete by Value", pattern: "relinking", skill: "skip one node via relink",
    statement: "Delete the FIRST node with the given value. If value doesn't exist, return head unchanged. Return new head.",
    examples: [
      { input: "list=1→2→3→4, val=3", output: "1→2→4" },
      { input: "list=1→2→3, val=1", output: "2→3", explain: "deleting head is a special case" },
    ],
    why: "Surgery with an edge case. Deleting the head requires changing what gets returned. Deleting internal nodes requires a prev pointer to relink around the deleted node.",
    starterCode: "def delete_by_value(head, val):\n    pass",
    hints: [
      "If head.val == val, return head.next (delete head).",
      "Otherwise, walk with prev and cur: while cur and cur.val != val: prev=cur; cur=cur.next.",
      "If cur found: prev.next = cur.next (skip cur). If not found: return head unchanged."
    ],
    solution: "def delete_by_value(head, val):\n    if head is None:\n        return None\n    if head.val == val:\n        return head.next\n    prev = head\n    cur = head.next\n    while cur:\n        if cur.val == val:\n            prev.next = cur.next\n            return head\n        prev = cur\n        cur = cur.next\n    return head",
    walkthrough: "Two cases: (1) delete head — simply return head.next. (2) delete internal node — walk with prev trailing one step behind cur. When cur.val matches, relink: prev.next = cur.next. The skipped node is orphaned. This prev-cur pair is the universal deletion pattern.",
    testCode: "assert list_to_arr(delete_by_value(build_list([1,2,3,4]), 3)) == [1,2,4]\nassert list_to_arr(delete_by_value(build_list([1,2,3]), 1)) == [2,3]\nassert list_to_arr(delete_by_value(build_list([1,2,3]), 5)) == [1,2,3]\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Delete at Position", pattern: "relinking", skill: "walk to position then skip",
    statement: "Delete the node at 0-based position i. If i is invalid (negative or ≥ length), return head unchanged.",
    examples: [
      { input: "list=1→2→3→4, i=2", output: "1→2→4" },
      { input: "list=1→2, i=0", output: "2" },
    ],
    why: "Same surgery as P17 but target found by POSITION instead of VALUE. Composes P10 (walk to index) with P17 (relink around deleted node).",
    starterCode: "def delete_at_position(head, i):\n    pass",
    hints: [
      "i < 0 or empty list: return head unchanged.",
      "i == 0: return head.next (delete head).",
      "Walk to position i-1: cur=head; for _ in range(i-1): cur=cur.next. Then cur.next = cur.next.next."
    ],
    solution: "def delete_at_position(head, i):\n    if head is None or i < 0:\n        return head\n    if i == 0:\n        return head.next\n    cur = head\n    for _ in range(i - 1):\n        if cur.next is None:\n            return head\n        cur = cur.next\n    if cur.next:\n        cur.next = cur.next.next\n    return head",
    walkthrough: "Position-based surgery. Walk to the node BEFORE the target (position i-1). Then skip over: cur.next = cur.next.next. The head case (i=0) returns head.next. Guard against out-of-bounds: if cur.next is None during the walk, position is invalid.",
    testCode: "assert list_to_arr(delete_at_position(build_list([1,2,3,4]), 2)) == [1,2,4]\nassert list_to_arr(delete_at_position(build_list([1,2]), 0)) == [2]\nassert list_to_arr(delete_at_position(build_list([1,2,3]), 5)) == [1,2,3]\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Remove All Matching (Dummy)", pattern: "relinking", skill: "dummy node unifies edge cases",
    statement: "Remove ALL nodes matching val. Return new head. Use a dummy head node so the head deletion case is identical to internal deletion.",
    examples: [
      { input: "list=1→2→6→3→4→5→6, val=6", output: "1→2→3→4→5" },
      { input: "list=7→7→7, val=7", output: "None" },
    ],
    why: "The dummy node pattern. Instead of handling 'delete head' as a special case, create a fake node before head. Now head is just another internal node. This pattern appears in merge, partition, and all multi-deletion problems.",
    starterCode: "def remove_all(head, val):\n    dummy = ListNode(0)\n    dummy.next = head\n    pass",
    hints: [
      "Walk with prev starting at dummy, cur at head. If cur.val == val: skip it.",
      "If cur.val == val: prev.next = cur.next. Otherwise: prev = cur.",
      "return dummy.next (the real head, which may have changed)."
    ],
    solution: "def remove_all(head, val):\n    dummy = ListNode(0)\n    dummy.next = head\n    prev = dummy\n    cur = head\n    while cur:\n        if cur.val == val:\n            prev.next = cur.next\n        else:\n            prev = cur\n        cur = cur.next\n    return dummy.next",
    walkthrough: "Dummy node is a fake node before head. It makes head just like any other node. prev starts at dummy. When cur matches val, prev.next skips it. When cur doesn't match, prev advances. The dummy node never moves. Return dummy.next (the potentially-new head).",
    testCode: "assert list_to_arr(remove_all(build_list([1,2,6,3,4,5,6]), 6)) == [1,2,3,4,5]\nassert list_to_arr(remove_all(build_list([7,7,7]), 7)) == []\nassert remove_all(build_list([7,7,7]), 7) is None\nassert list_to_arr(remove_all(build_list([1,2,3]), 5)) == [1,2,3]\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 2, title: "Insert at Position", pattern: "relinking", skill: "walk to pos-1 then splice",
    statement: "Insert a new node with given value at 0-based position i. If i ≤ 0, insert at head. If i ≥ length, insert at tail.",
    examples: [
      { input: "list=1→3, val=2, i=1", output: "1→2→3" },
      { input: "list=1→2, val=0, i=0", output: "0→1→2" },
    ],
    why: "Composes P15 (insert head), P16 (insert tail), and P18 (walk to position). All insertions are: walk to node BEFORE target, then splice new node between that node and its .next.",
    starterCode: "def insert_at(head, val, i):\n    pass",
    hints: [
      "i <= 0: same as insert_head. Empty list: return new node.",
      "Walk to position i-1 using counter. If you reach the end first, attach at tail.",
      "At position: new_node.next = cur.next; cur.next = new_node; return head."
    ],
    solution: "def insert_at(head, val, i):\n    if i <= 0:\n        return ListNode(val, head)\n    if head is None:\n        return ListNode(val)\n    cur = head\n    for _ in range(i - 1):\n        if cur.next is None:\n            break\n        cur = cur.next\n    new_node = ListNode(val, cur.next)\n    cur.next = new_node\n    return head",
    walkthrough: "Walk to the node BEFORE insertion point (position i-1). Then splice: new_node.next = cur.next, cur.next = new_node. Edge cases: i ≤ 0 → insert head; i beyond end → insert tail. The splice pattern (attach new.next to cur.next, then redirect cur.next to new) is the same for all insertions.",
    testCode: "assert list_to_arr(insert_at(build_list([1,3]), 2, 1)) == [1,2,3]\nassert list_to_arr(insert_at(build_list([1,2]), 0, 0)) == [0,1,2]\nassert list_to_arr(insert_at(build_list([1,2]), 5, 5)) == [1,2,5]\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 2, title: "Swap First Two Nodes", pattern: "relinking", skill: "multi-node pointer dance",
    statement: "Swap the first two nodes of the list. If list has fewer than 2 nodes, return head unchanged.",
    examples: [
      { input: "list=1→2→3→4", output: "2→1→3→4" },
      { input: "list=1→2", output: "2→1" },
    ],
    why: "First multi-node relink: three .next assignments must be ordered correctly. If you do them in the wrong order, you lose nodes. Teaches 'save before overwrite.'",
    starterCode: "def swap_first_two(head):\n    pass",
    hints: [
      "If head is None or head.next is None, return head (nothing to swap).",
      "Save head.next as new_head. Then relink: head.next = new_head.next, new_head.next = head.",
      "Order matters: save the pointer you're about to overwrite BEFORE overwriting it."
    ],
    solution: "def swap_first_two(head):\n    if head is None or head.next is None:\n        return head\n    new_head = head.next\n    head.next = new_head.next\n    new_head.next = head\n    return new_head",
    walkthrough: "Four assignments. (1) Save head.next as new_head (future head). (2) Redirect head.next to what was new_head.next (the third node). (3) Redirect new_head.next to head (now head is second). (4) Return new_head. This 'save then redirect' ordering is the core of multi-node surgery.",
    testCode: "assert list_to_arr(swap_first_two(build_list([1,2,3,4]))) == [2,1,3,4]\nassert list_to_arr(swap_first_two(build_list([1,2]))) == [2,1]\nassert list_to_arr(swap_first_two(build_list([1]))) == [1]\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 3 — Fast & Slow (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 22, stage: 3, title: "Find Middle (Fast=2x)", pattern: "fast-slow", skill: "fast moves 2x slow",
    statement: "Given head, return the MIDDLE node. If even length, return the second middle node. Do it in ONE pass using two pointers: slow moves 1 step, fast moves 2 steps.",
    examples: [
      { input: "list=1→2→3→4→5", output: "3", explain: "3 is the middle" },
      { input: "list=1→2→3→4→5→6", output: "4", explain: "second middle of 6 nodes" },
    ],
    why: "THE fast-and-slow skeleton. while fast and fast.next: slow = slow.next; fast = fast.next.next. When fast reaches end, slow is at middle. Every relative-motion problem (cycle, reorder, kth-from-end) builds on this choreography.",
    starterCode: "def find_middle(head):\n    slow = head\n    fast = head\n    pass",
    hints: [
      "Move slow 1 step and fast 2 steps until fast can't move anymore.",
      "while fast and fast.next: slow = slow.next; fast = fast.next.next.",
      "When fast reaches end (or fast.next is None), slow is at middle. Return slow."
    ],
    solution: "def find_middle(head):\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n    return slow",
    walkthrough: "Fast pointer moves twice as fast. When fast reaches the end (fast is None or fast.next is None), slow has covered exactly half the distance. For odd length, slow is the exact middle. For even length, slow is the second middle (because the loop terminates when fast hits None after passing the tail).",
    testCode: "assert find_middle(build_list([1,2,3,4,5])).val == 3\nassert find_middle(build_list([1,2,3,4,5,6])).val == 4\nassert find_middle(build_list([1])).val == 1\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Detect Cycle (Floyd) ★", pattern: "fast-slow", skill: "meeting = cycle exists",
    statement: "Return True if the linked list has a cycle. Use Floyd's algorithm: fast moves 2 steps, slow moves 1. If they meet, there's a cycle. If fast reaches None, no cycle.",
    examples: [
      { input: "list=1→2→3→4→2 (cycle at 2)", output: "True" },
      { input: "list=1→2→3→4", output: "False" },
    ],
    why: "★★★ THE classic fast-and-slow problem. Same skeleton as P22 (middle) but the loop condition gains a second meaning: meeting = cycle. This is the door into cycle detection, cycle start, and reorder problems.",
    starterCode: "def has_cycle(head):\n    slow = head\n    fast = head\n    pass",
    hints: [
      "Same skeleton as P22: while fast and fast.next, slow += 1, fast += 2.",
      "If slow == fast at any point, the fast pointer lapped the slow pointer — cycle!",
      "Move first, then check if they match. If loop exits without meeting: no cycle."
    ],
    solution: "def has_cycle(head):\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow == fast:\n            return True\n    return False",
    walkthrough: "Same two-pointer choreography as P22. New check: if slow and fast are the SAME node, fast must have lapped slow from behind — impossible in a straight list, only possible with a cycle. If the while loop exits normally, fast hit None (no cycle).",
    testCode: "assert has_cycle(create_cycle([1,2,3,4], 1)) == True\nassert has_cycle(build_list([1,2,3,4])) == False\nassert has_cycle(build_list([])) == False\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Find Cycle Start", pattern: "fast-slow", skill: "meet then reset one ptr",
    statement: "Given a linked list with a cycle, return the node where the cycle BEGINS. After slow and fast meet, reset one pointer to head, then move both 1 step at a time until they meet again. That meeting point is the cycle start.",
    examples: [
      { input: "list=1→2→3→4→2 (cycle at 2)", output: "2" },
      { input: "list=1→2→1 (cycle at 1)", output: "1" },
    ],
    why: "Composes P23 (detect cycle) and P22 (fast-slow). After detecting a cycle, the math: distance from head to cycle start equals distance from meeting point to cycle start (along the cycle). Reset one pointer to head, walk both at same speed.",
    starterCode: "def find_cycle_start(head):\n    slow = head\n    fast = head\n    pass",
    hints: [
      "First, detect cycle using P23's algorithm. Get the meeting point.",
      "After they meet, reset slow to head. Walk slow and fast BOTH one step at a time.",
      "They will meet at the cycle start node. This is the Floyd cycle-start theorem."
    ],
    solution: "def find_cycle_start(head):\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow == fast:\n            break\n    else:\n        return None\n    slow = head\n    while slow != fast:\n        slow = slow.next\n        fast = fast.next\n    return slow",
    walkthrough: "Phase 1: detect cycle (P23). Phase 2: reset slow to head, move both 1 step at a time. The meeting point is the cycle start. The insight: after k steps from head, you reach the cycle start; after k steps from the meeting point (going forward along the cycle), you also reach the cycle start.",
    testCode: "c1 = create_cycle([1,2,3,4], 1)\nassert find_cycle_start(c1).val == 2\nc2 = create_cycle([1,2], 0)\nassert find_cycle_start(c2).val == 1\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Kth from End (Gap)", pattern: "fast-slow", skill: "fixed-offset two pointers",
    statement: "Return the node that is k positions from the END. Use two pointers with a GAP of k: advance one pointer k steps ahead, then move both together until the leader hits None.",
    examples: [
      { input: "list=1→2→3→4→5, k=2", output: "4", explain: "2nd from end is 4" },
    ],
    why: "Variation of fast-and-slow: instead of speed difference, use a POSITION gap. The leader walks k steps first, then both walk together. When leader reaches None, follower is at the kth-from-end node.",
    starterCode: "def kth_from_end(head, k):\n    pass",
    hints: [
      "Advance first pointer k steps ahead. If list is too short, return None.",
      "Then advance both first and second together until first reaches None.",
      "Second pointer is now at kth-from-end."
    ],
    solution: "def kth_from_end(head, k):\n    first = head\n    second = head\n    for _ in range(k):\n        if first is None:\n            return None\n        first = first.next\n    while first:\n        first = first.next\n        second = second.next\n    return second",
    walkthrough: "Two phases. Phase 1: create a gap of k by advancing first k steps. Phase 2: maintain the gap by advancing both together. When first falls off the end (None), second is exactly k from the end. This 'fixed-gap two-pointer' pattern extends to rotate, remove-nth-from-end, and any offset-based problem.",
    testCode: "assert kth_from_end(build_list([1,2,3,4,5]), 2).val == 4\nassert kth_from_end(build_list([1,2,3,4,5]), 1).val == 5\nassert kth_from_end(build_list([1,2,3]), 4) is None\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Remove Nth from End", pattern: "fast-slow", skill: "gap pointer + dummy + relink",
    statement: "Remove the nth node from the END of the list. Use the gap-pointer technique from P25 plus a dummy node from P19. Return new head.",
    examples: [
      { input: "list=1→2→3→4→5, n=2", output: "1→2→3→5", explain: "remove 4 (2nd from end)" },
      { input: "list=1, n=1", output: "None", explain: "remove the only node" },
    ],
    why: "Composes P25 (gap pointer to find target), P19 (dummy node for unified deletion), and P17 (prev.next = cur.next relink). Three patterns in one problem.",
    starterCode: "def remove_nth_from_end(head, n):\n    dummy = ListNode(0)\n    dummy.next = head\n    pass",
    hints: [
      "Use dummy node (P19). Use gap pointer (P25) to find node BEFORE the target.",
      "First, walk fast n+1 steps from dummy (gap of n+1 so slow stops at prev of target).",
      "Then walk both. When fast is None, slow is at the node BEFORE target. slow.next = slow.next.next."
    ],
    solution: "def remove_nth_from_end(head, n):\n    dummy = ListNode(0, head)\n    first = dummy\n    second = dummy\n    for _ in range(n + 1):\n        first = first.next\n    while first:\n        first = first.next\n        second = second.next\n    second.next = second.next.next\n    return dummy.next",
    walkthrough: "Gap of n+1 (not n) so second lands on the node BEFORE the deletion target. Then second.next = second.next.next skips over the target. Dummy makes the head deletion case identical to internal deletion. Three patterns composed: gap-pointer + dummy + relink.",
    testCode: "assert list_to_arr(remove_nth_from_end(build_list([1,2,3,4,5]), 2)) == [1,2,3,5]\nassert list_to_arr(remove_nth_from_end(build_list([1]), 1)) == []\nassert list_to_arr(remove_nth_from_end(build_list([1,2]), 1)) == [1]\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 3, title: "Find Loop Length", pattern: "fast-slow", skill: "meet then count cycle nodes",
    statement: "Given a linked list with a cycle, return the LENGTH of the cycle (number of nodes in the loop). If no cycle, return 0.",
    examples: [
      { input: "list=1→2→3→4→2 (cycle at 2)", output: "3", explain: "cycle: 2→3→4→2, 3 nodes" },
    ],
    why: "Composes P23 (detect cycle) and P6 (count nodes). After detecting a cycle, fix one pointer at the meeting point and walk the other around the cycle counting until they meet again.",
    starterCode: "def loop_length(head):\n    pass",
    hints: [
      "First detect cycle (P23) to find a meeting point. If no cycle, return 0.",
      "From the meeting point, walk one pointer around the cycle counting steps.",
      "Stop when you return to the meeting point. The count is the cycle length."
    ],
    solution: "def loop_length(head):\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow == fast:\n            break\n    else:\n        return 0\n    count = 1\n    cur = slow.next\n    while cur != slow:\n        count += 1\n        cur = cur.next\n    return count",
    walkthrough: "Phase 1: detect cycle (P23). Phase 2: from the meeting point, walk around the cycle once by following .next until you return to the meeting point. Count each step. This is just P6 (count nodes) applied to the cycle sublist.",
    testCode: "c1 = create_cycle([1,2,3,4], 1)\nassert loop_length(c1) == 3\nc2 = create_cycle([1,2], 0)\nassert loop_length(c2) == 2\nassert loop_length(build_list([1,2,3])) == 0\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 3, title: "Reorder L0→Ln→L1→Ln-1", pattern: "fast-slow", skill: "find middle + reverse + merge",
    statement: "Reorder list: given 1→2→3→4→5, produce 1→5→2→4→3. Pattern: L0→Ln→L1→Ln-1→L2→Ln-2...",
    examples: [
      { input: "list=1→2→3→4", output: "1→4→2→3" },
      { input: "list=1→2→3→4→5", output: "1→5→2→4→3" },
    ],
    why: "Composes P22 (find middle), P14 (reverse list), and an interleave merge. Three patterns from three stages combined. This is the first 'compose' — a preview of Stage 6 Mastery.",
    starterCode: "def reorder_list(head):\n    pass",
    hints: [
      "Find middle (P22). Split into two halves. Reverse second half (P14).",
      "Merge by alternating: take one from first half, one from second half.",
      "Use cur pointers on both halves, alternating .next assignments."
    ],
    solution: "def reorder_list(head):\n    if head is None or head.next is None:\n        return head\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n    second = slow.next\n    slow.next = None\n    prev = None\n    cur = second\n    while cur:\n        nxt = cur.next\n        cur.next = prev\n        prev = cur\n        cur = nxt\n    second = prev\n    first = head\n    while second:\n        f_next = first.next\n        s_next = second.next\n        first.next = second\n        second.next = f_next\n        first = f_next\n        second = s_next\n    return head",
    walkthrough: "Three phases. (1) Find middle with fast/slow (P22), split at middle. (2) Reverse second half (P14). (3) Interleave: first.next = second; second.next = first's old next; advance both. Each phase is a previously mastered primitive. The novelty is composing them.",
    testCode: "assert list_to_arr(reorder_list(build_list([1,2,3,4]))) == [1,4,2,3]\nassert list_to_arr(reorder_list(build_list([1,2,3,4,5]))) == [1,5,2,4,3]\nassert list_to_arr(reorder_list(build_list([1]))) == [1]\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 4 — Naive (extra space) (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 29, stage: 4, title: "Detect Cycle with HashSet", pattern: "naive", skill: "store visited nodes in hash set",
    statement: "Detect if a linked list has a cycle by storing visited nodes in a hash set. Return True if a node is seen twice.",
    examples: [
      { input: "list=1→2→3→4→2 (cycle at 2)", output: "True" },
    ],
    why: "CONNECTION: P23 solved this in O(1) space with fast/slow. Now solve it naively with O(n) extra space. The hash set approach is the 'obvious' one — seeing it makes you appreciate Floyd's elegance in Stage 5.",
    starterCode: "def has_cycle_hash(head):\n    seen = set()\n    pass",
    hints: [
      "Walk with while cur. At each node, check: is this node already in the set?",
      "If cur in seen: return True (cycle detected). Otherwise: add to set, advance.",
      "If the loop ends normally: return False (no cycle)."
    ],
    solution: "def has_cycle_hash(head):\n    seen = set()\n    cur = head\n    while cur:\n        if cur in seen:\n            return True\n        seen.add(cur)\n        cur = cur.next\n    return False",
    walkthrough: "Simplest possible cycle detection: remember every node you visit. If you see the same node twice, there's a cycle. Works perfectly, uses O(n) memory. The while-cur skeleton (P5) + a set. Contrast with Floyd (P23) which uses O(1) memory by exploiting relative motion.",
    testCode: "assert has_cycle_hash(create_cycle([1,2,3,4], 1)) == True\nassert has_cycle_hash(build_list([1,2,3,4])) == False\nassert has_cycle_hash(build_list([])) == False\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Remove Duplicates with HashSet", pattern: "naive", skill: "hash set to track seen values",
    statement: "Remove all duplicate values from an unsorted linked list. Keep the FIRST occurrence. Use a hash set to track seen values.",
    examples: [
      { input: "list=1→2→3→3→2→4", output: "1→2→3→4" },
      { input: "list=5→5→5", output: "5" },
    ],
    why: "Same hash-set pattern as P29 but tracking VALUES instead of NODE references. The dummy-prev-cur deletion pattern from P19 combines with the set lookup.",
    starterCode: "def remove_duplicates(head):\n    seen = set()\n    pass",
    hints: [
      "Use dummy + prev (P19) for deletion. Walk with cur.",
      "If cur.val in seen: prev.next = cur.next. Otherwise: seen.add(cur.val); prev = cur.",
      "return dummy.next"
    ],
    solution: "def remove_duplicates(head):\n    dummy = ListNode(0, head)\n    prev = dummy\n    seen = set()\n    cur = head\n    while cur:\n        if cur.val in seen:\n            prev.next = cur.next\n        else:\n            seen.add(cur.val)\n            prev = cur\n        cur = cur.next\n    return dummy.next",
    walkthrough: "Hash set tracks values, not nodes. When a value repeats, skip the node using P19's dummy-prev-cur deletion. The set gives O(1) lookup for 'have I seen this value before?' Same deletion pattern as P17/P19 with a new lookup mechanism.",
    testCode: "assert list_to_arr(remove_duplicates(build_list([1,2,3,3,2,4]))) == [1,2,3,4]\nassert list_to_arr(remove_duplicates(build_list([5,5,5]))) == [5]\nassert list_to_arr(remove_duplicates(build_list([1,2,3]))) == [1,2,3]\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Palindrome with Stack", pattern: "naive", skill: "push all to stack, compare",
    statement: "Return True if the linked list is a palindrome (reads the same forward and backward). Use a stack: push all values, then compare from head against popped values.",
    examples: [
      { input: "list=1→2→2→1", output: "True" },
      { input: "list=1→2→3", output: "False" },
    ],
    why: "Stack naturally reverses order. Push all values, then walk from head comparing against stack.pop(). O(n) time and O(n) space. This is the warm-up: Stage 5 solves it in O(1) space.",
    starterCode: "def is_palindrome(head):\n    stack = []\n    pass",
    hints: [
      "First pass: push all values to stack. Second pass: walk from head, compare cur.val with stack.pop().",
      "Stack is LIFO — popping gives values in REVERSE order.",
      "If all matched, return True. If any mismatch, return False."
    ],
    solution: "def is_palindrome(head):\n    stack = []\n    cur = head\n    while cur:\n        stack.append(cur.val)\n        cur = cur.next\n    cur = head\n    while cur:\n        if cur.val != stack.pop():\n            return False\n        cur = cur.next\n    return True",
    walkthrough: "Two passes. Pass 1: push all values to stack (forward order). Pass 2: walk head again, compare each value with stack.pop() (reverse order). If all match, forward == reverse → palindrome. O(n) time, O(n) space. The stack IS the reverse copy.",
    testCode: "assert is_palindrome(build_list([1,2,2,1])) == True\nassert is_palindrome(build_list([1,2,3])) == False\nassert is_palindrome(build_list([1])) == True\nassert is_palindrome(build_list([])) == True\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "Find Intersection with HashSet", pattern: "naive", skill: "store nodes of one list in hash set",
    statement: "Given heads of two singly-linked lists that MAY intersect (merge at a node), return the intersection node. Use a hash set: store all nodes of list A, then walk list B checking for matches.",
    examples: [
      { input: "listA=4→1, listB=5→6→1, intersect at 8→4→5", output: "8" },
    ],
    why: "Hash set gives O(n+m) time with O(n) space. The 'obvious' approach. Stage 5 solves it in O(1) space by computing length difference.",
    starterCode: "def get_intersection_hash(headA, headB):\n    seen = set()\n    pass",
    hints: [
      "Walk list A: add each node to the set.",
      "Walk list B: if a node is in the set, that's the intersection.",
      "If walk B completes without finding a match, no intersection → return None."
    ],
    solution: "def get_intersection_hash(headA, headB):\n    seen = set()\n    cur = headA\n    while cur:\n        seen.add(cur)\n        cur = cur.next\n    cur = headB\n    while cur:\n        if cur in seen:\n            return cur\n        cur = cur.next\n    return None",
    walkthrough: "Store every node reference from list A in a set. Then walk list B looking for a node that's already in the set. The FIRST such node is the intersection. Uses the while-cur skeleton (P5) twice. Simple, clear, uses O(n) extra space.",
    testCode: "shared = build_list([8,4,5])\na = build_list([4,1])\nb = build_list([5,6,1])\ntail_a = a\nwhile tail_a.next: tail_a = tail_a.next\ntail_a.next = shared\ntail_b = b\nwhile tail_b.next: tail_b = tail_b.next\ntail_b.next = shared\nassert get_intersection_hash(a, b).val == 8\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Deep Copy with HashMap", pattern: "naive", skill: "map original nodes to their copies",
    statement: "Deep copy a linked list where each node has an additional `random` pointer that may point to any node (or None). Use a hashmap to map original nodes to their copies.",
    examples: [
      { input: "list with random pointers", output: "deep copy with same structure" },
    ],
    why: "Hashmap provides the mapping from original→copy. First pass: create copies, store in map. Second pass: wire up .next and .random from the map. The brute-force clarity makes the interleaved O(1)-space solution (P48) accessible.",
    starterCode: "def copy_random_list_hash(head):\n    if head is None:\n        return None\n    old_to_new = {}\n    pass",
    hints: [
      "First pass: for each original node, create a copy and store in map[old] = copy.",
      "Second pass: for each old node, wire copy.next = map[old.next], copy.random = map[old.random].",
      "Return map[head]."
    ],
    solution: "def copy_random_list_hash(head):\n    if head is None:\n        return None\n    old_to_new = {}\n    cur = head\n    while cur:\n        old_to_new[cur] = RandomNode(cur.val)\n        cur = cur.next\n    cur = head\n    while cur:\n        if cur.next:\n            old_to_new[cur].next = old_to_new[cur.next]\n        if cur.random:\n            old_to_new[cur].random = old_to_new[cur.random]\n        cur = cur.next\n    return old_to_new[head]",
    walkthrough: "Two-pass hashmap pattern. Pass 1: create all copies (clone nodes with values only, no links). Pass 2: for each original node, wire its copy's .next and .random to the copies of original.next and original.random (looked up from the map). The map IS the bridge.",
    testCode: "n2 = RandomNode(2)\nn1 = RandomNode(1, n2, n2)\nn2.random = n2\ncp = copy_random_list_hash(n1)\nassert cp.val == 1\nassert cp.next.val == 2\nassert cp.random.val == 2\nassert cp.next.random.val == 2\nassert cp != n1\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 4, title: "Middle via Count-then-Walk", pattern: "naive", skill: "two-pass: count then walk half",
    statement: "Find the middle node by counting total length first, then walking to length//2. This is the two-pass approach. Contrast with P22's one-pass fast/slow.",
    examples: [
      { input: "list=1→2→3→4→5", output: "3" },
    ],
    why: "CONNECTION: P22 solved this in one pass. Now do it in two passes: first count, then walk half. This is what happens when you don't know fast/slow. Seeing the extra work makes you value the one-pass approach.",
    starterCode: "def find_middle_two_pass(head):\n    pass",
    hints: [
      "First pass (P6): count total nodes.",
      "Walk to count // 2 position (P10).",
      "Return the node at that position."
    ],
    solution: "def find_middle_two_pass(head):\n    count = 0\n    cur = head\n    while cur:\n        count += 1\n        cur = cur.next\n    mid = count // 2\n    cur = head\n    for _ in range(mid):\n        cur = cur.next\n    return cur",
    walkthrough: "Two passes. Pass 1 (P6): count length. Pass 2 (P10): walk to mid position. O(n) time, but TWO traversals vs P22's one. For small lists the difference is negligible, but the habit of 'count first, then index' is what fast/slow eliminates.",
    testCode: "assert find_middle_two_pass(build_list([1,2,3,4,5])).val == 3\nassert find_middle_two_pass(build_list([1,2,3,4,5,6])).val == 4\nassert find_middle_two_pass(build_list([1])).val == 1\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 4, title: "Detect Cycle Start with HashSet", pattern: "naive", skill: "first node seen twice = cycle start",
    statement: "Find the cycle start node using a hash set. The first node that appears in the set twice is the cycle entrance.",
    examples: [
      { input: "list=1→2→3→4→2 (cycle at 2)", output: "2" },
    ],
    why: "CONNECTION: P24 found cycle start with Floyd's O(1) algorithm. Now do it with a hash set. The naive approach makes the math behind Floyd's algorithm feel like magic rather than memorization.",
    starterCode: "def cycle_start_hash(head):\n    seen = set()\n    pass",
    hints: [
      "Walk with while cur. At each node, check if cur in seen.",
      "First node that IS in seen: that's the cycle start.",
      "If walk completes without match: no cycle → return None."
    ],
    solution: "def cycle_start_hash(head):\n    seen = set()\n    cur = head\n    while cur:\n        if cur in seen:\n            return cur\n        seen.add(cur)\n        cur = cur.next\n    return None",
    walkthrough: "Almost identical to P29 (hash set cycle detection) but returns the first duplicate node instead of True/False. The first node we see twice is the cycle entrance — it's the node that the cycle loops back to. O(n) space, perfectly correct, zero insight required. This is what Floyd eliminated.",
    testCode: "c = create_cycle([1,2,3,4], 1)\nassert cycle_start_hash(c).val == 2\nc2 = create_cycle([1,2], 0)\nassert cycle_start_hash(c2).val == 1\nassert cycle_start_hash(build_list([1,2,3])) is None\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 5 — Optimization (O(1) space) (7 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 36, stage: 5, title: "Detect Cycle O(1) — Floyd Revisited", pattern: "optimization", skill: "the full Floyd with proof",
    statement: "Implement Floyd's cycle detection WITHOUT any extra data structure. Use only the fast/slow pointers. This is the O(1) space solution you contrasted with P29.",
    examples: [
      { input: "list=1→2→3→4→2 (cycle at 2)", output: "True" },
    ],
    why: "Same algorithm as P23. Now it lands AFTER you saw the hash-set way (P29). The contrast is the point: P29 needed a set; this needs TWO variables. The 'aha' is that relative motion encodes what the hash set stored.",
    starterCode: "def has_cycle_floyd(head):\n    pass",
    hints: [
      "Two pointers: slow (1 step), fast (2 steps). Same as P23.",
      "If they meet, cycle exists. If fast or fast.next is None, no cycle.",
      "No hash set. No visited tracking. Just two pointers and relative speed."
    ],
    solution: "def has_cycle_floyd(head):\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow == fast:\n            return True\n    return False",
    walkthrough: "The exact same code as P23, but now you UNDERSTAND why it's clever: the hash set from P29 stored 'which nodes have I visited?' while Floyd uses RELATIVE MOTION — fast pointer lapping slow pointer. No storage needed. The movement ITSELF detects the cycle.",
    testCode: "assert has_cycle_floyd(create_cycle([1,2,3,4], 1)) == True\nassert has_cycle_floyd(build_list([1,2,3,4])) == False\nassert has_cycle_floyd(build_list([])) == False\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Palindrome O(1) — Reverse Half", pattern: "optimization", skill: "find middle + reverse + compare",
    statement: "Check if list is palindrome in O(1) space. Find middle, reverse second half, compare both halves, (optionally restore list).",
    examples: [
      { input: "list=1→2→2→1", output: "True" },
      { input: "list=1→2→3", output: "False" },
    ],
    why: "CONNECTION: P31 used a stack (O(n) space). This eliminates the stack: the reversed second half IS the reverse copy. Composes P22 (fast/slow middle) and P14 (reverse list). The optimization is that reversal reuses existing nodes as the 'stack.'",
    starterCode: "def is_palindrome_optimized(head):\n    pass",
    hints: [
      "Find middle with fast/slow (P22). Split into two halves.",
      "Reverse the second half (P14).",
      "Compare first half and reversed second half node by node."
    ],
    solution: "def is_palindrome_optimized(head):\n    if head is None or head.next is None:\n        return True\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n    prev = None\n    cur = slow\n    while cur:\n        nxt = cur.next\n        cur.next = prev\n        prev = cur\n        cur = nxt\n    second = prev\n    first = head\n    while second:\n        if first.val != second.val:\n            return False\n        first = first.next\n        second = second.next\n    return True",
    walkthrough: "Three phases. (1) Find middle (P22). (2) Reverse second half (P14). (3) Compare: walk first from head, second from reversed-half head. If values match all the way, it's a palindrome. The reversed second half takes the place of the stack from P31 — same order, but built in-place by relinking.",
    testCode: "assert is_palindrome_optimized(build_list([1,2,2,1])) == True\nassert is_palindrome_optimized(build_list([1,2,3])) == False\nassert is_palindrome_optimized(build_list([1])) == True\nassert is_palindrome_optimized(build_list([])) == True\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Intersection O(1) — Length Diff", pattern: "optimization", skill: "align ends by skipping diff",
    statement: "Find intersection node of two lists in O(1) space. Compute lengths, align the longer list's start by skipping the difference, then walk both together until they meet.",
    examples: [
      { input: "A=4→1→8→4→5, B=5→6→1→8→4→5", output: "8" },
    ],
    why: "CONNECTION: P32 used a hash set (O(n) space). Now compute lengths — the extra nodes at the start of the longer list cannot contain the intersection. Skip them, then walk together. O(n+m) time, O(1) space.",
    starterCode: "def get_intersection(headA, headB):\n    pass",
    hints: [
      "Compute lengths of both lists (P6).",
      "Advance the longer list's pointer by |lenA - lenB| positions.",
      "Walk both together. First node where they're equal is the intersection."
    ],
    solution: "def get_intersection(headA, headB):\n    def get_len(head):\n        count = 0\n        while head:\n            count += 1\n            head = head.next\n        return count\n    lenA = get_len(headA)\n    lenB = get_len(headB)\n    a = headA\n    b = headB\n    while lenA > lenB:\n        a = a.next\n        lenA -= 1\n    while lenB > lenA:\n        b = b.next\n        lenB -= 1\n    while a and b:\n        if a == b:\n            return a\n        a = a.next\n        b = b.next\n    return None",
    walkthrough: "Key insight: if lists intersect, they share the SAME tail. The longer list just has extra nodes at the start. Skip those extra nodes, then walk both together. The first common node is the intersection. No hash set. Just lengths + alignment. P6 + while walk.",
    testCode: "shared = build_list([8,4,5])\na = build_list([4,1])\nb = build_list([5,6,1])\ntail_a = a\nwhile tail_a.next: tail_a = tail_a.next\ntail_a.next = shared\ntail_b = b\nwhile tail_b.next: tail_b = tail_b.next\ntail_b.next = shared\nassert get_intersection(a, b).val == 8\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Remove Nth from End — One Pass", pattern: "optimization", skill: "gap pointer instead of two passes",
    statement: "Remove the nth node from end in ONE pass using the gap-pointer technique. No counting first, no extra array. Just two pointers with a gap of n+1.",
    examples: [
      { input: "list=1→2→3→4→5, n=2", output: "1→2→3→5" },
    ],
    why: "CONNECTION: P26 already used gap-pointer but with a dummy node. Now reframe it as the O(1)-space, one-pass optimization over 'count total, then walk to L-n' (which would be two passes).",
    starterCode: "def remove_nth_one_pass(head, n):\n    dummy = ListNode(0, head)\n    pass",
    hints: [
      "Gap of n+1: first walks n+1 steps from dummy. Then both walk together.",
      "When first falls off (None), second is at the node BEFORE the target.",
      "second.next = second.next.next. Return dummy.next."
    ],
    solution: "def remove_nth_one_pass(head, n):\n    dummy = ListNode(0, head)\n    first = dummy\n    second = dummy\n    for _ in range(n + 1):\n        first = first.next\n    while first:\n        first = first.next\n        second = second.next\n    second.next = second.next.next\n    return dummy.next",
    walkthrough: "Gap-pointer makes this one-pass. The two-pass approach would be: count length L, then walk to L-n-1, delete. Instead, the gap of n+1 means second stops at exactly L-n-1 position when first hits None. Same effect, one traversal. The gap encodes the length.",
    testCode: "assert list_to_arr(remove_nth_one_pass(build_list([1,2,3,4,5]), 2)) == [1,2,3,5]\nassert list_to_arr(remove_nth_one_pass(build_list([1]), 1)) == []\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "Rotate Right by K", pattern: "optimization", skill: "find new tail, relink circle",
    statement: "Rotate the list to the RIGHT by k positions. k can be larger than list length. O(1) space. Example: 1→2→3→4→5, k=2 → 4→5→1→2→3.",
    examples: [
      { input: "list=1→2→3→4→5, k=2", output: "4→5→1→2→3" },
      { input: "list=0→1→2, k=4", output: "2→0→1", explain: "k=4 mod 3 = 1" },
    ],
    why: "Composes P6 (count length), P9 (find tail), and P25 (find position from end). The insight: rotation = find new head (at position L - k%L), make it circular, then break at the right place.",
    starterCode: "def rotate_right(head, k):\n    pass",
    hints: [
      "If head is None or k == 0: return head.",
      "Find length and tail (P6 + P9). k = k % length.",
      "Make it circular: tail.next = head. Walk to new tail (length - k - 1 steps). New head = new_tail.next. Break: new_tail.next = None."
    ],
    solution: "def rotate_right(head, k):\n    if head is None or head.next is None:\n        return head\n    length = 1\n    tail = head\n    while tail.next:\n        tail = tail.next\n        length += 1\n    k = k % length\n    if k == 0:\n        return head\n    tail.next = head\n    steps_to_new_tail = length - k - 1\n    new_tail = head\n    for _ in range(steps_to_new_tail):\n        new_tail = new_tail.next\n    new_head = new_tail.next\n    new_tail.next = None\n    return new_head",
    walkthrough: "Rotation = ring manipulation. (1) Count length and find tail (P6 + P9). (2) Mod k. (3) Make circle: tail.next = head. (4) Walk to new tail position (length - k - 1 from head). (5) New head = new_tail.next. (6) Break circle: new_tail.next = None. The circle-then-break pattern makes rotation O(n) with O(1) space.",
    testCode: "assert list_to_arr(rotate_right(build_list([1,2,3,4,5]), 2)) == [4,5,1,2,3]\nassert list_to_arr(rotate_right(build_list([0,1,2]), 4)) == [2,0,1]\nassert list_to_arr(rotate_right(build_list([1,2]), 0)) == [1,2]\nassert list_to_arr(rotate_right(build_list([1,2]), 2)) == [1,2]\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 5, title: "Swap Nodes in Pairs", pattern: "optimization", skill: "pairwise swap with prev pointer",
    statement: "Swap every two adjacent nodes. 1→2→3→4 becomes 2→1→4→3. O(1) space by relinking in place.",
    examples: [
      { input: "list=1→2→3→4", output: "2→1→4→3" },
      { input: "list=1→2→3", output: "2→1→3", explain: "last node stays if odd length" },
    ],
    why: "Extends P21 (swap first two) to the entire list. The loop body is identical to P21 but a prev pointer connects each swapped pair to the previous pair. Same surgery, repeated.",
    starterCode: "def swap_pairs(head):\n    pass",
    hints: [
      "Use dummy node (P19) to handle head uniformly.",
      "Each iteration: first = cur.next; second = cur.next.next. Then relink: cur.next = second; first.next = second.next; second.next = first.",
      "Advance cur to first (which is now the second node in the pair)."
    ],
    solution: "def swap_pairs(head):\n    dummy = ListNode(0, head)\n    prev = dummy\n    while prev.next and prev.next.next:\n        first = prev.next\n        second = first.next\n        first.next = second.next\n        second.next = first\n        prev.next = second\n        prev = first\n    return dummy.next",
    walkthrough: "Same surgery as P21 (swap first two) but iterated. Dummy-prev pattern (P19) handles the head uniformly. Each swap: (1) identify first and second, (2) first.next = second.next (skip second), (3) second.next = first (second now points to first), (4) prev.next = second (attach pair to previous segment). Advance prev to first (now second in pair).",
    testCode: "assert list_to_arr(swap_pairs(build_list([1,2,3,4]))) == [2,1,4,3]\nassert list_to_arr(swap_pairs(build_list([1,2,3]))) == [2,1,3]\nassert list_to_arr(swap_pairs(build_list([1]))) == [1]\nassert swap_pairs(build_list([])) is None\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 5, title: "Odd-Even Group", pattern: "optimization", skill: "maintain two tail pointers",
    statement: "Reorder list so all odd-indexed nodes come first, then even-indexed nodes. 1-indexed. O(1) space, O(n) time.",
    examples: [
      { input: "list=1→2→3→4→5", output: "1→3→5→2→4", explain: "odd positions: 1,3,5; even: 2,4" },
    ],
    why: "Maintain two chains (odd and even) with two tail pointers. Walk through the list, append each node to the appropriate chain. Then connect odd tail to even head. No extra nodes created — pure relinking.",
    starterCode: "def odd_even_list(head):\n    pass",
    hints: [
      "If empty or single node: return head. Create odd = head, even = head.next, even_head = head.next.",
      "While even and even.next: odd.next = even.next (skip to next odd); odd = odd.next; even.next = odd.next (skip to next even); even = even.next.",
      "After loop: odd.next = even_head to connect chains. Return head."
    ],
    solution: "def odd_even_list(head):\n    if head is None or head.next is None:\n        return head\n    odd = head\n    even = head.next\n    even_head = even\n    while even and even.next:\n        odd.next = even.next\n        odd = odd.next\n        even.next = odd.next\n        even = even.next\n    odd.next = even_head\n    return head",
    walkthrough: "Two chains growing in parallel. odd.next skips over the even node to the next odd; even.next skips over the just-placed odd to the next even. After the loop, connect odd's tail to even's head. The list is reordered without creating any new nodes — just relinking existing ones into two groups.",
    testCode: "assert list_to_arr(odd_even_list(build_list([1,2,3,4,5]))) == [1,3,5,2,4]\nassert list_to_arr(odd_even_list(build_list([2,1,3,5,6,4,7]))) == [2,3,6,7,1,5,4]\nassert list_to_arr(odd_even_list(build_list([1]))) == [1]\nprint('All tests passed!')"
  },

  // ═══════════════════════════════════════════════════════════════
  // STAGE 6 — Mastery (8 problems)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 43, stage: 6, title: "Reverse K-Group ★", pattern: "mastery", skill: "reverse segments + reconnect",
    statement: "Reverse nodes in groups of k. If remaining nodes < k, leave them as-is. 1→2→3→4→5, k=2 → 2→1→4→3→5. k=3 → 3→2→1→4→5.",
    examples: [
      { input: "list=1→2→3→4→5, k=2", output: "2→1→4→3→5" },
      { input: "list=1→2→3→4→5, k=3", output: "3→2→1→4→5" },
    ],
    why: "Composes P14 (reverse sublist) + P6 (count remaining nodes) + P19 (dummy node for head). The loop: count k nodes, reverse that segment, reconnect prev segment to reversed segment. Each phase is a previously mastered primitive.",
    starterCode: "def reverse_k_group(head, k):\n    pass",
    hints: [
      "Use dummy node (P19). Maintain prev_group_end. For each group: check if k nodes remain (P6 walk).",
      "Reverse the k nodes (P14 applied to sublist). Reconnect: prev_group_end.next = reversed_head; group_start.next = next_group_start.",
      "Update prev_group_end to the end of the just-reversed group (the original start node)."
    ],
    solution: "def reverse_k_group(head, k):\n    dummy = ListNode(0, head)\n    prev_group = dummy\n    while True:\n        kth = prev_group\n        for _ in range(k):\n            kth = kth.next\n            if kth is None:\n                return dummy.next\n        next_group = kth.next\n        prev = kth.next\n        cur = prev_group.next\n        while cur != next_group:\n            nxt = cur.next\n            cur.next = prev\n            prev = cur\n            cur = nxt\n        temp = prev_group.next\n        prev_group.next = kth\n        prev_group = temp\n    return dummy.next",
    walkthrough: "For each group: (1) Check k nodes exist by walking k steps (P6). (2) Reverse the k nodes (P14 applied to sublist — reverse until you hit next_group). (3) Reconnect: prev_group.next = reversed_head; original_group_start.next = next_group. The pattern: count → reverse → reconnect → advance. Three primitives composed.",
    testCode: "assert list_to_arr(reverse_k_group(build_list([1,2,3,4,5]), 2)) == [2,1,4,3,5]\nassert list_to_arr(reverse_k_group(build_list([1,2,3,4,5]), 3)) == [3,2,1,4,5]\nassert list_to_arr(reverse_k_group(build_list([1,2,3,4,5]), 1)) == [1,2,3,4,5]\nassert list_to_arr(reverse_k_group(build_list([1,2]), 3)) == [1,2]\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Merge Two Sorted Lists", pattern: "mastery", skill: "dummy + two-finger merge",
    statement: "Given heads of two sorted linked lists, merge them into ONE sorted list. Use a dummy node and two pointers.",
    examples: [
      { input: "l1=1→2→4, l2=1→3→4", output: "1→1→2→3→4→4" },
      { input: "l1=[], l2=0", output: "0" },
    ],
    why: "Composes P4 (build from scratch) + P19 (dummy node). The 'two-finger' merge: compare heads, attach smaller, advance. This is the building block for merge-sort (P46) and merge-k-sorted (P45).",
    starterCode: "def merge_two(l1, l2):\n    dummy = ListNode(0)\n    cur = dummy\n    pass",
    hints: [
      "While both lists have nodes: compare l1.val and l2.val. Attach the smaller to cur.next.",
      "Advance the list you took from. Advance cur.",
      "After one list is exhausted, attach the remaining list."
    ],
    solution: "def merge_two(l1, l2):\n    dummy = ListNode(0)\n    cur = dummy\n    while l1 and l2:\n        if l1.val <= l2.val:\n            cur.next = l1\n            l1 = l1.next\n        else:\n            cur.next = l2\n            l2 = l2.next\n        cur = cur.next\n    cur.next = l1 or l2\n    return dummy.next",
    walkthrough: "Dummy node (P19) starts the merged list. At each step: pick the smaller head, attach it, advance that list's pointer (like P4 building a list). When one list is empty, attach the rest of the other. The 'two-finger' pattern — comparing heads and advancing the winner — powers all merge-based algorithms.",
    testCode: "assert list_to_arr(merge_two(build_list([1,2,4]), build_list([1,3,4]))) == [1,1,2,3,4,4]\nassert list_to_arr(merge_two(build_list([]), build_list([0]))) == [0]\nassert list_to_arr(merge_two(build_list([]), build_list([]))) == []\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Merge K Sorted Lists", pattern: "mastery", skill: "divide-and-conquer merging",
    statement: "Given a list of k sorted linked lists, merge them into one sorted list. Use divide-and-conquer: merge pairs, then merge results, repeatedly.",
    examples: [
      { input: "lists=[[1→4→5],[1→3→4],[2→6]]", output: "1→1→2→3→4→4→5→6" },
    ],
    why: "Composes P44 (merge two lists) with divide-and-conquer. Instead of merging all k at once, repeatedly merge pairs until one list remains. Each merge is P44. The pairing structure is like a tournament bracket.",
    starterCode: "def merge_k_lists(lists):\n    pass",
    hints: [
      "If lists is empty: return None. Repeatedly merge adjacent pairs.",
      "Use a while loop: while len(lists) > 1: merge pairs into a new list.",
      "Each pair merge uses P44 (merge_two)."
    ],
    solution: "def merge_k_lists(lists):\n    if not lists:\n        return None\n    def merge_two(l1, l2):\n        dummy = ListNode(0)\n        cur = dummy\n        while l1 and l2:\n            if l1.val <= l2.val:\n                cur.next = l1\n                l1 = l1.next\n            else:\n                cur.next = l2\n                l2 = l2.next\n            cur = cur.next\n        cur.next = l1 or l2\n        return dummy.next\n    while len(lists) > 1:\n        merged = []\n        for i in range(0, len(lists), 2):\n            l1 = lists[i]\n            l2 = lists[i + 1] if i + 1 < len(lists) else None\n            merged.append(merge_two(l1, l2))\n        lists = merged\n    return lists[0]",
    walkthrough: "Tournament merging. Each round: merge adjacent pairs using P44. The number of lists halves each round. After log(k) rounds, one list remains. This is merge-sort's merge phase generalized to k starting lists. Each merge is exactly P44 — reuse, don't rewrite.",
    testCode: "l1 = build_list([1,4,5])\nl2 = build_list([1,3,4])\nl3 = build_list([2,6])\nassert list_to_arr(merge_k_lists([l1,l2,l3])) == [1,1,2,3,4,4,5,6]\nassert merge_k_lists([]) is None\nassert list_to_arr(merge_k_lists([build_list([]), build_list([1])])) == [1]\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Sort List (Merge Sort)", pattern: "mastery", skill: "find middle + split + merge + recurse",
    statement: "Sort a linked list in O(n log n) using merge sort. Find middle (P22), split, recursively sort both halves, merge (P44).",
    examples: [
      { input: "list=4→2→1→3", output: "1→2→3→4" },
      { input: "list=-1→5→3→4→0", output: "-1→0→3→4→5" },
    ],
    why: "The capstone composition: P22 (fast/slow middle) + P44 (merge two) + recursive divide-and-conquer. Every primitive from Stages 0-5 combines into one algorithm.",
    starterCode: "def sort_list(head):\n    pass",
    hints: [
      "Base case: if head is None or head.next is None, return head.",
      "Find middle (P22), split list into two halves.",
      "Recursively sort each half, then merge (P44)."
    ],
    solution: "def sort_list(head):\n    if head is None or head.next is None:\n        return head\n    slow = head\n    fast = head\n    prev = None\n    while fast and fast.next:\n        prev = slow\n        slow = slow.next\n        fast = fast.next.next\n    prev.next = None\n    left = sort_list(head)\n    right = sort_list(slow)\n    dummy = ListNode(0)\n    cur = dummy\n    while left and right:\n        if left.val <= right.val:\n            cur.next = left\n            left = left.next\n        else:\n            cur.next = right\n            right = right.next\n        cur = cur.next\n    cur.next = left or right\n    return dummy.next",
    walkthrough: "Divide (P22): fast/slow finds middle, prev splits list. Conquer: recursively sort each half. Combine (P44): merge two sorted halves. Each piece is a previously mastered primitive. The algorithm is: find_middle → split → sort_left → sort_right → merge_two. Same pieces, orchestrated together.",
    testCode: "assert list_to_arr(sort_list(build_list([4,2,1,3]))) == [1,2,3,4]\nassert list_to_arr(sort_list(build_list([-1,5,3,4,0]))) == [-1,0,3,4,5]\nassert list_to_arr(sort_list(build_list([]))) == []\nassert list_to_arr(sort_list(build_list([1]))) == [1]\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Add Two Numbers", pattern: "mastery", skill: "digit-by-digit sum with carry",
    statement: "Given two linked lists representing numbers in reverse order (each node is a digit), add them and return the sum as a linked list. 2→4→3 + 5→6→4 = 7→0→8 (342 + 465 = 807).",
    examples: [
      { input: "l1=2→4→3, l2=5→6→4", output: "7→0→8", explain: "342+465=807" },
      { input: "l1=9→9, l2=1", output: "0→0→1", explain: "99+1=100" },
    ],
    why: "Composes P4 (build list from scratch) + P7 (sum accumulator). Walk both lists simultaneously, sum digits with carry, build result list node by node. The carry = sum // 10, digit = sum % 10.",
    starterCode: "def add_two_numbers(l1, l2):\n    dummy = ListNode(0)\n    cur = dummy\n    carry = 0\n    pass",
    hints: [
      "While l1 or l2 or carry: compute sum = (l1.val if l1 else 0) + (l2.val if l2 else 0) + carry.",
      "digit = sum % 10; carry = sum // 10. Create new node with digit.",
      "Advance l1, l2, and cur. Return dummy.next."
    ],
    solution: "def add_two_numbers(l1, l2):\n    dummy = ListNode(0)\n    cur = dummy\n    carry = 0\n    while l1 or l2 or carry:\n        val1 = l1.val if l1 else 0\n        val2 = l2.val if l2 else 0\n        total = val1 + val2 + carry\n        carry = total // 10\n        cur.next = ListNode(total % 10)\n        cur = cur.next\n        if l1:\n            l1 = l1.next\n        if l2:\n            l2 = l2.next\n    return dummy.next",
    walkthrough: "Digit-by-digit addition. Walk both lists simultaneously (like two runners). At each position: sum the two digits (or 0 if a list is exhausted) plus the carry. The result digit = total % 10; new carry = total // 10. Build the result list using the create-and-attach pattern from P4. The dummy node (P19) simplifies head creation.",
    testCode: "assert list_to_arr(add_two_numbers(build_list([2,4,3]), build_list([5,6,4]))) == [7,0,8]\nassert list_to_arr(add_two_numbers(build_list([9,9]), build_list([1]))) == [0,0,1]\nassert list_to_arr(add_two_numbers(build_list([0]), build_list([0]))) == [0]\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Copy with Random Pointer", pattern: "mastery", skill: "interleave + wire + unwire",
    statement: "Deep copy a linked list where each node has a `random` pointer. O(1) extra space by interleaving copies between originals: A→A'→B→B'→C→C'. Wire random pointers, then unwire.",
    examples: [
      { input: "list with random pointers", output: "deep copy" },
    ],
    why: "CONNECTION: P33 used a hashmap (O(n) space). Now do it in O(1) space by interleaving. The copy of node A sits right after A. A'.random = A.random.next. The interleaved structure IS the map. A preview of the 'structure-as-data' insight that returns in graphs.",
    starterCode: "def copy_random_list(head):\n    pass",
    hints: [
      "Phase 1: interleave — for each node, insert a copy right after it: A→A'→B→B'.",
      "Phase 2: wire random — cur.next.random = cur.random.next if cur.random exists.",
      "Phase 3: unwire — separate original and copy chains."
    ],
    solution: "def copy_random_list(head):\n    if head is None:\n        return None\n    cur = head\n    while cur:\n        copy = RandomNode(cur.val, cur.next)\n        cur.next = copy\n        cur = copy.next\n    cur = head\n    while cur:\n        if cur.random:\n            cur.next.random = cur.random.next\n        cur = cur.next.next\n    dummy = RandomNode(0)\n    cur_copy = dummy\n    cur = head\n    while cur:\n        cur_copy.next = cur.next\n        cur_copy = cur_copy.next\n        cur.next = cur.next.next\n        cur = cur.next\n    return dummy.next",
    walkthrough: "Three phases, no hashmap. Phase 1: insert a copy of each node right after it (A→A'→B→B'). Phase 2: wire random pointers — since A' is after A, and A.random's copy is after A.random, A'.random = A.random.next. Phase 3: unwire — separate the interleaved list into original and copy chains. The interleaving IS the lookup structure.",
    testCode: "n2 = RandomNode(2)\nn1 = RandomNode(1, n2, n2)\nn2.random = n2\ncp = copy_random_list(n1)\nassert cp.val == 1\nassert cp.next.val == 2\nassert cp.random.val == 2\nassert cp != n1\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 6, title: "Flatten Multilevel", pattern: "mastery", skill: "child pointer + tail recursion",
    statement: "Each node has .next and .child (points to another list). Flatten: child list comes after current node, before node.next. Process depth-first, return flattened head.",
    examples: [
      { input: "A→B→C, B.child=D→E, D.child=F", output: "A→B→D→F→E→C" },
    ],
    why: "Traversal crosses into child lists (like DFS into subtrees). Compose P9 (find tail) + P19 (dummy) + the while-cur skeleton. The child pointer creates a nested structure; flattening walks the structure in DFS order.",
    starterCode: "class MultiNode:\n    def __init__(self, val=0, next=None, child=None):\n        self.val = val\n        self.next = next\n        self.child = child\n\ndef flatten_multilevel(head):\n    pass",
    hints: [
      "Walk with cur. If cur has a child: save cur.next, insert child list, find tail of child list.",
      "Connect child tail to saved next. Set cur.child = None.",
      "Continue walking. This is iterative DFS."
    ],
    solution: "def flatten_multilevel(head):\n    if head is None:\n        return None\n    cur = head\n    while cur:\n        if cur.child:\n            saved_next = cur.next\n            cur.next = cur.child\n            cur.child = None\n            tail = cur.next\n            while tail.next:\n                tail = tail.next\n            tail.next = saved_next\n        cur = cur.next\n    return head",
    walkthrough: "Iterative DFS. Walk the main chain. When a node has a child: (1) save cur.next, (2) attach child list as cur.next, (3) find tail of child list (P9), (4) connect tail.next to saved_next. The child becomes the 'next' in flattened order. Continue from the attached child's head. This is the iterative equivalent of recursive tree flattening.",
    testCode: "f = MultiNode(6)\ne = MultiNode(5)\nd = MultiNode(4, e, f)\nc = MultiNode(3)\nb = MultiNode(2, c, d)\na = MultiNode(1, b)\nflat = flatten_multilevel(a)\nvals = []\nwhile flat:\n    vals.append(flat.val)\n    flat = flat.next\nassert vals == [1,2,4,6,5,3]\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Reorder List (Full)", pattern: "mastery", skill: "middle + reverse + merge — compose all three",
    statement: "Reorder list to L0→Ln→L1→Ln-1→L2→Ln-2... as in P28. This is the definitive composition: find middle (P22), reverse second half (P14), interleave merge (like P44 merge pattern but alternating).",
    examples: [
      { input: "list=1→2→3→4→5", output: "1→5→2→4→3" },
      { input: "list=1→2→3→4", output: "1→4→2→3" },
    ],
    why: "The final composition. Every major pattern from the curriculum converges: fast/slow (Stage 3), reverse (Stage 2), interleave merge (Stage 1 with Stage 2 relinking). This is the transfer demonstration — you don't need new ideas; you need to SEE that this is three known solutions in sequence.",
    starterCode: "def reorder_list_full(head):\n    pass",
    hints: [
      "Phase 1: find middle with fast/slow (P22). Split: set middle.next = None.",
      "Phase 2: reverse second half (P14).",
      "Phase 3: merge by alternating — take one from first, one from second, advance both."
    ],
    solution: "def reorder_list_full(head):\n    if head is None or head.next is None:\n        return head\n    slow = head\n    fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n    second = slow.next\n    slow.next = None\n    prev = None\n    cur = second\n    while cur:\n        nxt = cur.next\n        cur.next = prev\n        prev = cur\n        cur = nxt\n    second = prev\n    first = head\n    while second:\n        f_next = first.next\n        s_next = second.next\n        first.next = second\n        second.next = f_next\n        first = f_next\n        second = s_next\n    return head",
    walkthrough: "Three phases, each a previously mastered solution. (1) Find and split at middle: fast/slow walk (P22), break the link. (2) Reverse second half: three-pointer dance (P14). (3) Interleave: alternate attaching from first and second chains. This is the transfer demonstration: three known tools, applied in sequence, solving a problem none of them could solve alone.",
    testCode: "assert list_to_arr(reorder_list_full(build_list([1,2,3,4,5]))) == [1,5,2,4,3]\nassert list_to_arr(reorder_list_full(build_list([1,2,3,4]))) == [1,4,2,3]\nassert list_to_arr(reorder_list_full(build_list([1]))) == [1]\nassert reorder_list_full(build_list([])) is None\nprint('All tests passed!')"
  },
]

export const linkedListHelperCode = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class RandomNode:
    def __init__(self, val=0, next=None, random=None):
        self.val = val
        self.next = next
        self.random = random

class MultiNode:
    def __init__(self, val=0, next=None, child=None):
        self.val = val
        self.next = next
        self.child = child

def build_list(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    cur = head
    for val in arr[1:]:
        cur.next = ListNode(val)
        cur = cur.next
    return head

def list_to_arr(head):
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result

def create_cycle(arr, pos):
    head = build_list(arr)
    if pos < 0 or head is None:
        return head
    cycle_node = None
    cur = head
    i = 0
    while cur.next:
        if i == pos:
            cycle_node = cur
        cur = cur.next
        i += 1
    if i == pos:
        cycle_node = cur
    cur.next = cycle_node
    return head
`
