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

export const STAGES_HEAP = [
  { id: 0, name: "Repeated-Extreme Reflex", desc: "always need max/min" },
  { id: 1, name: "Two Invariants", desc: "shape + heap property" },
  { id: 2, name: "Bubble Up/Down", desc: "insert and pop" },
  { id: 3, name: "Heapify", desc: "bottom-up O(n)" },
  { id: 4, name: "Naive", desc: "sort for kth" },
  { id: 5, name: "Optimization", desc: "size-k heap" },
  { id: 6, name: "Mastery", desc: "two heaps, merge k" },
]

export const PROBLEMS_HEAP: Problem[] = [
  // ═══ STAGE 0: Repeated-Extreme Reflex ═══
  {
    id: 1, stage: 0, title: "Simulate Task Queue — Need for Repeated Max", pattern: "priority extraction", skill: "model repeated find-max operations",
    statement: "Simulate a task queue where each task has a priority (integer). Process tasks in descending priority order: repeatedly find and remove the highest-priority task. Return the processed order. Use a list and find the max each time.",
    examples: [
      { input: "tasks = [3,1,4,1,5]", output: "[5,4,3,1,1]", explain: "5 highest, remove; then 4; then 3; then two 1's" },
    ],
    why: "This is the heap's origin story. You need the maximum repeatedly. A naive list requires O(n) per extraction — scanning the entire list each time. The heap gives you O(log n) per extraction, which adds up.",
    starterCode: "def process_tasks(tasks):\n    pass",
    hints: [
      "Use while tasks: find max, append to result, remove it.",
      "max() finds the maximum. list.remove() deletes it.",
      "Count: if n=10^5, n scans of O(n) each = O(n^2) = 10^10 operations. Too slow."
    ],
    solution: "def process_tasks(tasks):\n    result = []\n    while tasks:\n        m = max(tasks)\n        result.append(m)\n        tasks.remove(m)\n    return result",
    walkthrough: "The loop iterates n times. Each iteration does max() = O(n) and remove() = O(n). Total O(n^2). For a real-time system with 100k tasks, you'd do 10 billion operations. This is the pain that motivates the heap — O(n log n) total by sacrificing some structure per operation to gain dramatic speed overall.",
    testCode: "assert process_tasks([3,1,4,1,5]) == [5,4,3,1,1]\nassert process_tasks([1]) == [1]\nassert process_tasks([2,2,2]) == [2,2,2]\nassert process_tasks([]) == []\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Array Scan O(n) Pain — Find Max Each Time", pattern: "priority extraction", skill: "quantify the cost of repeated linear scans",
    statement: "Given a list of priorities, compute the total number of element comparisons needed to repeatedly find and remove the max, as in P1. Count each comparison max() makes internally.",
    examples: [
      { input: "tasks = [5,3,8,1]", output: "10", explain: "4 tasks: first scan=4 comps, second=3, third=2, fourth=1 → 4+3+2+1=10" },
    ],
    why: "Quantifying the pain: n + (n-1) + (n-2) + ... + 1 = O(n^2) comparisons. For n=10^5, that's ~5 billion comparisons. The reflex: 'I need the extreme repeatedly' should immediately trigger 'heap.'",
    starterCode: "def count_scan_comparisons(tasks):\n    pass",
    hints: [
      "Calculate sum of (len(tasks), len(tasks)-1, ..., 1).",
      "Formula: n*(n+1)/2 where n = len(tasks).",
      "Each extraction scans the entire remaining list to find max."
    ],
    solution: "def count_scan_comparisons(tasks):\n    n = len(tasks)\n    return n * (n + 1) // 2",
    walkthrough: "First max: check n elements. Remove one. Second max: check n-1 elements. And so on. Sum = n+(n-1)+...+1 = n(n+1)/2. For n=100k: ~5 billion comparisons. A heap's bubble-down for extraction does ~log n comparisons per pop: n * log2(n) ≈ 100k * 17 = 1.7 million. The heap is ~3000x faster.",
    testCode: "assert count_scan_comparisons([5,3,8,1]) == 10\nassert count_scan_comparisons([1]) == 1\nassert count_scan_comparisons([1,2,3]) == 6\nassert count_scan_comparisons([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Sorted Array O(n) Insert Pain", pattern: "priority insertion", skill: "quantify cost of maintaining order on insert",
    statement: "Another approach: keep the task list sorted. Insert a new task (priority) into the correct position to maintain descending order. Implement and count the number of shifts (element moves) per insert.",
    examples: [
      { input: "sorted = [9,5,3,1], new = 6", output: "new list = [9,6,5,3,1], shifts = 3", explain: "values > 6 stay; 5,3,1 shift right; 6 inserts at index 1" },
    ],
    why: "Sorted list: O(1) max extraction (pop first/last), but O(n) insertion. Heap: O(log n) for BOTH insert AND extract. The heap balances the complexity — it doesn't optimize one at the expense of the other.",
    starterCode: "def insert_sorted(arr, val):\n    pass",
    hints: [
      "Find insertion index: iterate until arr[i] < val (for descending).",
      "Shift all elements from that index to the right.",
      "Place val at the insertion index. Count how many elements shifted."
    ],
    solution: "def insert_sorted(arr, val):\n    shifts = 0\n    i = 0\n    while i < len(arr) and arr[i] > val:\n        i += 1\n    arr.insert(i, val)\n    shifts = len(arr) - i - 1\n    return arr, shifts",
    walkthrough: "Find index i where val should go. Everything from i onward shifts right. arr.insert() does this internally, O(n). For a task system processing 100k tasks with new arrivals, the tradeoff: sorted list = O(1) extract + O(n) insert per task = O(n^2) total. Heap = O(log n) both = O(n log n) total.",
    testCode: "a, s = insert_sorted([9,5,3,1], 6)\nassert a == [9,6,5,3,1]\nassert s > 0\na2, s2 = insert_sorted([10], 1)\nassert a2 == [10, 1]\na3, s3 = insert_sorted([], 5)\nassert a3 == [5]\nassert s3 == 0\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Binary Search Insert — Still O(n)", pattern: "priority insertion", skill: "realize find is O(log n) but insert is still O(n)",
    statement: "Improve sorted-array insertion: use binary search (O(log n)) to find the insertion index, then insert (still O(n) for shifting). Show that finding the spot isn't the bottleneck — shifting is.",
    examples: [
      { input: "sorted = [9,5,3,1], new = 6", output: "index = 1, still O(n) shift cost" },
    ],
    why: "Even with O(log n) binary search, inserting into a sorted array requires shifting elements — O(n). The heap avoids shifting entirely: elements stay roughly in place, only the tree's structural relationships are adjusted via swaps. No contiguous storage requirement.",
    starterCode: "def insert_sorted_bs(arr, val):\n    pass",
    hints: [
      "Binary search to find the index where arr[i] > val and arr[i+1] <= val (for descending).",
      "Then insert at that index. The shift cost remains O(n).",
      "Conclusion: binary search helps the find but the insert itself is the bottleneck."
    ],
    solution: "def insert_sorted_bs(arr, val):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] > val:\n            left = mid + 1\n        else:\n            right = mid - 1\n    arr.insert(left, val)\n    return arr, left",
    walkthrough: "Binary search finds the index in O(log n). But arr.insert() must shift ~n/2 elements on average. The heap stores elements in an array where the tree relationships are implicit in the indices, not in physical ordering. Insert just appends to the end (O(1)) and bubbles up (O(log n)) — no shifting.",
    testCode: "a, idx = insert_sorted_bs([9,5,3,1], 6)\nassert a == [9,6,5,3,1]\nassert idx == 1\na2, idx2 = insert_sorted_bs([], 5)\nassert a2 == [5]\nassert idx2 == 0\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Recognize the Pattern — Need Both Min and Max Fast", pattern: "priority extraction", skill: "identify when a heap is the right data structure",
    statement: "Given a stream of operations: 'add N' or 'extract'. Write a decider function that, given the ratio of adds to extracts, decides whether a sorted list or a heap is better. If extracts > adds significantly, what's best? If balanced, what's best?",
    examples: [
      { input: "add_ratio = 0.5, extract_ratio = 0.5, n = 10000", output: "'heap'", explain: "balanced workload = heap wins. Heap: O(n log n). Sorted: O(n^2) inserts or O(n^2) extracts." },
    ],
    why: "The decision rule: sorted list wins only when extracts vastly outnumber inserts (extract=O(1), insert=O(n)). Heap wins when operations are balanced or when both need to be fast (both O(log n)). Real-world task queues are balanced — heap.",
    starterCode: "def pick_ds(add_ratio, extract_ratio, n):\n    pass",
    hints: [
      "Sorted list cost: add_ratio * n * O(n) + extract_ratio * n * O(1) for sorted-list-with-extract. Or add_ratio * n * O(1) + extract_ratio * n * O(n) for unsorted-with-extract.",
      "Heap cost: (add_ratio * n + extract_ratio * n) * O(log n).",
      "Compare total costs. Solve: when is n*(add_ratio * n) < 2*n*log(n)? Almost never at scale."
    ],
    solution: "def pick_ds(add_ratio, extract_ratio, n):\n    sorted_cost = add_ratio * n * n + extract_ratio * n * 1\n    heap_cost = (add_ratio * n + extract_ratio * n) * (n.bit_length() if n > 0 else 0)\n    return 'sorted' if sorted_cost < heap_cost else 'heap'",
    walkthrough: "Sorted list: each add is O(n) (shift), each extract is O(1) (pop last). Heap: both O(log n). For balanced (0.5/0.5): sorted = 0.5n^2, heap = n log n. As n grows, n^2 dominates. Even at 90% extracts: sorted = 0.9n + 0.1n^2, heap = n log n. For large n, the n^2 term from the 10% inserts still crushes log n. Heap wins for all practical ratios at scale.",
    testCode: "assert pick_ds(0.5, 0.5, 10000) == 'heap'\nassert pick_ds(0.01, 0.99, 10000) == 'sorted'\nassert pick_ds(0.9, 0.1, 100000) == 'heap'\nprint('All tests passed!')"
  },
  // +++ STAGE 0 new +++
  {
    id: 6, stage: 0, title: "Top K via Repeated Max Extraction", pattern: "priority extraction", skill: "extract max k times from unsorted list, count comparisons",
    statement: "Given an array and k, return the k largest elements by repeatedly finding and removing the maximum — k times. Also return the total number of comparisons made. This shows the O(k*n) cost of the naive approach to top-k.",
    examples: [
      { input: "arr = [3,1,4,1,5], k = 3", output: "([5,4,3], 12)", explain: "3 extractions: 1st scans 5, 2nd scans 4, 3rd scans 3 → 12 comparisons" },
    ],
    why: "Repeated max extraction is the brute-force for top-k. k scans of ~n elements each = O(k*n). When k is small, this is wasteful — finding all k largest requires sorting the whole array piece by piece. The size-k heap (Stage 5) does it in O(n log k), a massive improvement for large n and small k.",
    starterCode: "def top_k_repeated_max(arr, k):\n    pass",
    hints: [
      "Make a copy of arr. For _ in range(k): find max, append to result, remove it.",
      "Count comparisons: for each max() call, count len(current_list) - 1 comparisons.",
      "Return (result_list, total_comparisons). Track both to measure the cost of brute force."
    ],
    solution: "def top_k_repeated_max(arr, k):\n    nums = arr[:]\n    result = []\n    comps = 0\n    for _ in range(k):\n        if not nums:\n            break\n        m = max(nums)\n        result.append(m)\n        nums.remove(m)\n        comps += len(nums)\n    return (result, comps)",
    walkthrough: "Each max() call does len(nums) comparisons internally. For [3,1,4,1,5], k=3: first max=5 (5 comps), remove → [3,1,4,1]; second max=4 (4 comps), remove → [3,1,1]; third max=3 (3 comps). Result [5,4,3], comps=5+4+3=12. Cost is roughly k*n comparisons. A size-k min-heap would process each of n elements once with O(log k) per element: n*log(k) comparisons — exponentially smaller for large n.",
    testCode: "res, comps = top_k_repeated_max([3,1,4,1,5], 3)\nassert res == [5,4,3]\nassert comps > 0\nres2, _ = top_k_repeated_max([1], 1)\nassert res2 == [1]\nres3, _ = top_k_repeated_max([5,5,5], 2)\nassert res3 == [5,5]\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 0, title: "Track Current Minimum After Each Insert via Scan", pattern: "priority insertion", skill: "after each insert into a list, scan to find current min",
    statement: "Elements arrive one at a time. After each insertion, scan the entire list to find and record the current minimum. Return a list of the minimum value after each insert. This mimics a system that needs the minimum after every update but uses brute force.",
    examples: [
      { input: "stream = [5,3,8,1,6]", output: "[5,3,3,1,1]", explain: "after 5→min=5; after 3→min=3; after 8→min=3; after 1→min=1; after 6→min=1" },
    ],
    why: "This is the dual of P1 (repeated max extraction). Here, inserts drive the cost — each insert triggers a full scan for the minimum. O(n) per insert, O(n^2) total. A heap maintains the minimum at the root in O(1) and updates in O(log n) — eliminating the per-insert scan entirely.",
    starterCode: "def track_min_after_each(stream):\n    pass",
    hints: [
      "Maintain a list. For each value: append to list, then find min by scanning all elements.",
      "Record the minimum after each insert. The first element is both the only element and the minimum.",
      "Count total comparisons: 1+2+...+n = n(n+1)/2 ~ O(n^2). This is the scan-pain that motivates heaps."
    ],
    solution: "def track_min_after_each(stream):\n    arr = []\n    result = []\n    for v in stream:\n        arr.append(v)\n        current_min = v\n        for x in arr:\n            if x < current_min:\n                current_min = x\n        result.append(current_min)\n    return result",
    walkthrough: "Each insertion triggers a full scan. After insert 5: [5], scan → min=5. Insert 3: [5,3], scan → min=3. Insert 8: [5,3,8], scan → min=3. Insert 1: [5,3,8,1], scan → min=1. Insert 6: [5,3,8,1,6], scan → min=1. Total comparisons: 1+2+3+4+5=15. With a heap: insert each in O(log n), min always at index 0 — total O(n log n) comparisons. For n=100k: scan = 5 billion comparisons, heap = 1.7 million.",
    testCode: "assert track_min_after_each([5,3,8,1,6]) == [5,3,3,1,1]\nassert track_min_after_each([2]) == [2]\nassert track_min_after_each([3,2,1]) == [3,2,1]\nassert track_min_after_each([]) == []\nprint('All tests passed!')"
  },
  // ═══ STAGE 1: Two Invariants ═══
  {
    id: 8, stage: 1, title: "Build Heap Array from Tree Representation", pattern: "heap structure", skill: "convert tree visualization to array indices",
    statement: "Given a complete binary tree drawn level by level, write the heap's array representation. The root is at index 0. For node at index i, left child is at 2*i+1, right child at 2*i+2. Convert the tree levels to the array.",
    examples: [
      { input: "tree levels = [[10],[5,8],[2,3,7,6]]", output: "[10,5,8,2,3,7,6]" },
      { input: "tree levels = [[1],[2]]", output: "[1,2]", explain: "incomplete last row is OK — heap stores nulls or shorter array" },
    ],
    why: "The heap's array representation is its superpower. No pointers, no node objects — parent and child are arithmetic. This compactness gives the heap its cache-friendly performance and constant-space navigation.",
    starterCode: "def levels_to_array(levels):\n    pass",
    hints: [
      "Flatten levels into one list: for each level, extend the result list.",
      "Child of index i: left = 2*i+1, right = 2*i+2. Parent of i: (i-1)//2.",
      "The array stores elements in breadth-first order of the complete binary tree."
    ],
    solution: "def levels_to_array(levels):\n    result = []\n    for level in levels:\n        result.extend(level)\n    return result",
    walkthrough: "The heap array stores the tree row by row, left to right. Level 1: [10]. Level 2: [5,8] appended. Level 3: [2,3,7,6] appended. Result: [10,5,8,2,3,7,6]. Index 0 = 10 (root). Index 1 = 5 (root's left). Index 2 = 8 (root's right). Index 3 = 2 (5's left, from 2*1+1=3). The array IS the tree.",
    testCode: "assert levels_to_array([[10],[5,8],[2,3,7,6]]) == [10,5,8,2,3,7,6]\nassert levels_to_array([[1],[2]]) == [1,2]\nassert levels_to_array([[5]]) == [5]\nassert levels_to_array([]) == []\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Check Heap Property — Iterate and Verify", pattern: "heap invariant", skill: "verify parent <= children for all nodes",
    statement: "Write is_min_heap(arr) that verifies a given array satisfies the min-heap property: for every index i, arr[i] <= arr[2*i+1] and arr[i] <= arr[2*i+2] (when those children exist). Return True if valid.",
    examples: [
      { input: "arr = [1,3,2,7,5,4]", output: "True" },
      { input: "arr = [3,1,2]", output: "False", explain: "root 3 > left child 1" },
    ],
    why: "The heap property is a LOCAL constraint: every parent must be <= its children (min-heap). No need to compare with grandchildren — the transitive property guarantees global ordering at the root. This local-to-global property is what makes insert/remove O(log n).",
    starterCode: "def is_min_heap(arr):\n    pass",
    hints: [
      "Loop i from 0 to (len(arr)//2) - 1 (these are the nodes that can have children).",
      "Check: if 2*i+1 < len(arr) and arr[i] > arr[2*i+1]: return False.",
      "Check: if 2*i+2 < len(arr) and arr[i] > arr[2*i+2]: return False."
    ],
    solution: "def is_min_heap(arr):\n    n = len(arr)\n    for i in range(n // 2):\n        left = 2 * i + 1\n        right = 2 * i + 2\n        if left < n and arr[i] > arr[left]:\n            return False\n        if right < n and arr[i] > arr[right]:\n            return False\n    return True",
    walkthrough: "Check only internal nodes (indices 0 to n/2-1). Leaf nodes (indices n/2 to n-1) have no children to compare against. For [1,3,2,7,5,4]: i=0: left=1(3) 1<=3 ok, right=2(2) 1<=2 ok. i=1: left=3(7) 3<=7 ok, right=4(5) 3<=5 ok. i=2: left=5(4) 2<=4 ok. All pass — valid min-heap. For [3,1,2]: i=0: left=1(1) 3>1 → False.",
    testCode: "assert is_min_heap([1,3,2,7,5,4]) == True\nassert is_min_heap([3,1,2]) == False\nassert is_min_heap([1]) == True\nassert is_min_heap([1,2,3]) == True\nassert is_min_heap([3,2,1]) == False\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Find Parent and Child Indices", pattern: "heap navigation", skill: "compute parent(i), left(i), right(i)",
    statement: "Implement parent(i), left_child(i), right_child(i) that return the respective indices for a node at index i in the heap array. Also implement is_leaf(arr, i) that returns True if node i has no children.",
    examples: [
      { input: "parent(1), left_child(0), right_child(0)", output: "parent=0, left=1, right=2" },
      { input: "is_leaf([1,2,3,4], 1)", output: "True", explain: "node 1 (value 2) has children at 3,4 which both exist" },
    ],
    why: "Heap navigation is pure arithmetic. No pointer chasing — a single multiplication or integer division. This is why heaps can be stored in contiguous arrays without node objects: the relationships are implicit in the indices.",
    starterCode: "def parent(i):\n    pass\n\ndef left_child(i):\n    pass\n\ndef right_child(i):\n    pass\n\ndef is_leaf(arr, i):\n    pass",
    hints: [
      "parent = (i-1)//2 (integer division). For root i=0, parent is -1 (no parent).",
      "left = 2*i+1, right = 2*i+2.",
      "is_leaf: left index >= len(arr) means no children at all."
    ],
    solution: "def parent(i):\n    return (i - 1) // 2 if i > 0 else -1\n\ndef left_child(i):\n    return 2 * i + 1\n\ndef right_child(i):\n    return 2 * i + 2\n\ndef is_leaf(arr, i):\n    return left_child(i) >= len(arr)",
    walkthrough: "Root: i=0, parent = (0-1)//2 = -1 (invalid). Left child: 2*0+1=1. Right child: 2*0+2=2. For i=3: parent = (3-1)//2 = 1. Left = 2*3+1=7, right=8. is_leaf: if left_child(i) >= n, both children are out of bounds, node is a leaf. For a node with only a left child (unusual in near-complete heap), is_leaf uses left child check only.",
    testCode: "assert parent(0) == -1\nassert parent(1) == 0\nassert parent(2) == 0\nassert parent(5) == 2\nassert left_child(0) == 1\nassert left_child(1) == 3\nassert right_child(0) == 2\nassert right_child(1) == 4\nassert is_leaf([1,2,3], 1) == True\nassert is_leaf([1,2,3], 0) == False\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Max at Root Proof — Why heap[0] is Always Extremum", pattern: "heap property", skill: "prove by induction that min-element is at root",
    statement: "Prove by writing a verification function: given a valid min-heap, verify that heap[0] is indeed the minimum. Then write the code to find the minimum: it's just arr[0] — O(1). Also prove that the kth smallest is NOT necessarily at any fixed position.",
    examples: [
      { input: "min_heap = [1,3,2,7,5,4]", output: "min = 1 at index 0" },
    ],
    why: "The heap property guarantees root is the minimum (min-heap) or maximum (max-heap) — but NOTHING else about order. The 2nd smallest could be at index 1 or index 2. This partial ordering is the tradeoff: you get O(1) access to the extremum but sacrifice total ordering.",
    starterCode: "def get_min(heap):\n    pass\n\ndef validate_root_is_min(heap):\n    pass",
    hints: [
      "get_min: just return heap[0] if heap else None. O(1).",
      "validate_root_is_min: check heap[0] <= every other element in the heap.",
      "Proof sketch: by the heap property, root <= left child <= left's children <= ... and root <= right child <= right's children <= ... by transitivity, root <= every node."
    ],
    solution: "def get_min(heap):\n    return heap[0] if heap else None\n\ndef validate_root_is_min(heap):\n    if not heap:\n        return True\n    root_val = heap[0]\n    for v in heap:\n        if v < root_val:\n            return False\n    return True",
    walkthrough: "get_min is literally arr[0] — O(1). The heap guarantees this by construction: every parent <= its children, so by induction down any path, root <= every descendant. But note: the 2nd smallest is at index 1 or 2 — you don't know which. The path below root is only partially ordered. The heap trades total order for log-time maintenance of the partial order that matters: the root is always correct.",
    testCode: "h = [1,3,2,7,5,4]\nassert get_min(h) == 1\nassert validate_root_is_min(h) == True\nassert get_min([5]) == 5\nassert get_min([]) is None\nh2 = [3,3,3]\nassert get_min(h2) == 3\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Min-Heap vs Max-Heap Conversion", pattern: "heap property", skill: "negate values to convert between min and max heap",
    statement: "Python's heapq is a min-heap. To use it as a max-heap, negate values on insertion and negate again on extraction. Implement max_heappush(heap, val) and max_heappop(heap) that wrap heapq to produce max-heap behavior.",
    examples: [
      { input: "push 3,1,4,1,5; pop all", output: "[5,4,3,1,1]", explain: "max-heap: always extract largest first" },
    ],
    why: "Min-heap and max-heap are symmetric — negating values flips the comparison. This is the standard Python idiom: heap stores -value, pop returns -(-value) = value. Everything else about the heap remains identical; only the sign changes.",
    starterCode: "import heapq\n\ndef max_heappush(heap, val):\n    pass\n\ndef max_heappop(heap):\n    pass",
    hints: [
      "max_heappush: heapq.heappush(heap, -val).",
      "max_heappop: return -heapq.heappop(heap).",
      "What about max_heappushpop or max_heapreplace? Same pattern: negate on the way in, negate on the way out."
    ],
    solution: "import heapq\n\ndef max_heappush(heap, val):\n    heapq.heappush(heap, -val)\n\ndef max_heappop(heap):\n    return -heapq.heappop(heap)",
    walkthrough: "Negation is a bijection: it maps the natural ordering of integers to its reverse while preserving relative distances (|a-b| = |(-a)-(-b)|). The min-heap sees -5 < -4 < -3 and puts -5 at root. We extract -5, negate to 5 — the original maximum. The heap internals never change; only the values' interpretation flips.",
    testCode: "import heapq\nh = []\nfor v in [3,1,4,1,5]:\n    max_heappush(h, v)\nresult = []\nwhile h:\n    result.append(max_heappop(h))\nassert result == [5,4,3,1,1]\nprint('All tests passed!')"
  },
  // +++ STAGE 1 new +++
  {
    id: 13, stage: 1, title: "Find Tree Level of a Heap Node", pattern: "heap navigation", skill: "compute depth/level from index via parent traversal",
    statement: "Given a valid heap array and an index i, return the tree level (0 = root level) of the node at that index. Level is the number of edges from root: repeatedly jump to parent index until you reach 0, counting steps.",
    examples: [
      { input: "heap = [10,5,8,2,3,7,6], i = 0", output: "0", explain: "root is at level 0" },
      { input: "heap = [10,5,8,2,3,7,6], i = 3", output: "2", explain: "node 2 at index 3: parent(3)=1, parent(1)=0 → 2 steps to root" },
      { input: "heap = [10,5,8,2,3,7,6], i = 6", output: "2" },
    ],
    why: "Node level reveals why heap operations are O(log n): the maximum level is floor(log2(n)). Every bubble-up or bubble-down moves at most (height) levels. Computing level by parent-traversal connects the index arithmetic to tree depth.",
    starterCode: "def node_level(heap, i):\n    pass",
    hints: [
      "Initialize level = 0. While i > 0: i = (i-1)//2, level += 1.",
      "When i reaches 0, you've climbed to the root — level is the number of steps taken.",
      "If i is out of bounds (>= len(heap)), return -1."
    ],
    solution: "def node_level(heap, i):\n    if i >= len(heap):\n        return -1\n    level = 0\n    while i > 0:\n        i = (i - 1) // 2\n        level += 1\n    return level",
    walkthrough: "Climb from the node to the root, counting steps. Index 3 → parent(3)=1 → parent(1)=0. 2 steps = level 2. Index 6 → parent(6)=2 → parent(2)=0. 2 steps = level 2. Index 0 → already root, 0 steps. This shows the heap's tree depth is implicit in array indices. A size-n heap has levels 0 to floor(log2(n)) — at most ~17 levels for n=100k. Bubble operations never exceed this bound.",
    testCode: "h = [10,5,8,2,3,7,6]\nassert node_level(h, 0) == 0\nassert node_level(h, 1) == 1\nassert node_level(h, 2) == 1\nassert node_level(h, 3) == 2\nassert node_level(h, 6) == 2\nassert node_level(h, 10) == -1\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 1, title: "Count Internal Nodes — Nodes with at Least One Child", pattern: "heap structure", skill: "count nodes that are parents (non-leaves)",
    statement: "Given a heap array, return the number of internal nodes — nodes that have at least one child. An internal node is at index i where 2*i+1 < len(arr). Count them directly by iterating or using the formula n // 2.",
    examples: [
      { input: "heap = [1,3,2,7,5,4]", output: "3", explain: "indices 0(1), 1(3), 2(2) have children; indices 3-5 are leaves" },
      { input: "heap = [5]", output: "0", explain: "single node has no children" },
    ],
    why: "Internal nodes are the only nodes that participate in heapify and bubble-down. Leaves are trivial — they're already valid 1-element heaps. The count of internal nodes = n//2 (integer division). This is why heapify processes only n//2 nodes — and why its cost is O(n), not O(n log n).",
    starterCode: "def count_internal_nodes(heap):\n    pass",
    hints: [
      "An internal node has left_child index = 2*i+1 within bounds. Iterate i from 0 to n-1, count where 2*i+1 < n.",
      "Formula: count = n // 2. For n=6: internal nodes=3. For n=5: internal nodes=2.",
      "The last n//2 nodes are leaves — they have no children. The first n//2 nodes are internal."
    ],
    solution: "def count_internal_nodes(heap):\n    n = len(heap)\n    count = 0\n    for i in range(n):\n        if 2 * i + 1 < n:\n            count += 1\n    return count",
    walkthrough: "Iterate all indices, check if left child exists. For [1,3,2,7,5,4]: i=0, left=1<n ✓; i=1, left=3<n ✓; i=2, left=5<n ✓; i=3, left=7≥n ✗. Count=3 = n//2. In a complete binary tree, exactly the last n//2 nodes are leaves. This structural fact makes heapify O(n): sink operations start only from internal nodes, and most internal nodes are near the bottom with small sink heights.",
    testCode: "assert count_internal_nodes([1,3,2,7,5,4]) == 3\nassert count_internal_nodes([5]) == 0\nassert count_internal_nodes([1,2,3]) == 1\nassert count_internal_nodes([1,2]) == 1\nprint('All tests passed!')"
  },
  // ═══ STAGE 2: Bubble Up/Down ═══
  {
    id: 15, stage: 2, title: "Implement heappush — Bubble Up", pattern: "heap insert", skill: "append to end, swap with parent while smaller",
    statement: "Implement heappush(heap, val) WITHOUT using heapq. Append val to the end of the heap array. Then bubble it up: while the node is smaller than its parent, swap them. Continue until the heap property is restored.",
    examples: [
      { input: "heap = [1,3,5], push 0", output: "[0,1,5,3]", explain: "0 added at end, bubbles up past 3, past 1 — lands at root" },
    ],
    why: "Bubble up is the heap's insert algorithm. The new element starts as a leaf (end of array). It may violate the heap property with its parent. Swapping with a violating parent restores the property locally — the violation may reappear one level up. Continue until satisfied or at root.",
    starterCode: "def heappush(heap, val):\n    pass",
    hints: [
      "heap.append(val). Set i = len(heap) - 1 (index of new element).",
      "While i > 0: parent = (i-1)//2. If heap[i] < heap[parent], swap; set i = parent. Else break.",
      "Loop invariant: the subtree rooted at i satisfies the heap property with its children (but may violate with its parent)."
    ],
    solution: "def heappush(heap, val):\n    heap.append(val)\n    i = len(heap) - 1\n    while i > 0:\n        p = (i - 1) // 2\n        if heap[i] < heap[p]:\n            heap[i], heap[p] = heap[p], heap[i]\n            i = p\n        else:\n            break",
    walkthrough: "Append to end (O(1)). Then climb up: compare with parent. If smaller, swap. The violation moves up one level. In the worst case, the new element is the new minimum and bubbles to the root — O(log n) levels, O(log n) swaps. For [1,3,5] push 0: append → [1,3,5,0]; i=3, parent=1(3), 0<3 swap → [1,0,5,3]; i=1, parent=0(1), 0<1 swap → [0,1,5,3]; i=0, stop.",
    testCode: "h = [1,3,5]\nheappush(h, 0)\nassert h == [0,1,5,3]\nassert is_min_heap(h) == True\nh2 = [2]\nheappush(h2, 1)\nassert h2 == [1,2]\nassert is_min_heap(h2) == True\nh3 = []\nheappush(h3, 5)\nassert h3 == [5]\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "Implement heappop — Bubble Down", pattern: "heap extract", skill: "swap root with last, remove last, sink root",
    statement: "Implement heappop(heap) WITHOUT using heapq. Swap root (heap[0]) with the last element. Pop the last element (the original root). Then bubble the new root down: while it's larger than either child, swap with the smallest child.",
    examples: [
      { input: "heap = [1,3,5,7], pop", output: "returns 1, heap becomes [3,7,5]", explain: "1 removed, 7 moved to root, sinks past 3" },
    ],
    why: "Extraction removes the root (the minimum). The last element replaces root to maintain the complete tree shape. Then bubble down restores the heap property by sinking the replacement into its correct position — swapping with the smaller child at each step.",
    starterCode: "def heappop(heap):\n    pass",
    hints: [
      "Swap heap[0] and heap[-1]. Save heap.pop() as the result.",
      "Bubble down from root (i=0): find smallest among i, left child, right child.",
      "If i is not the smallest, swap i with the smallest child; set i to that child's index. Repeat until i has no children or is smaller than both."
    ],
    solution: "def heappop(heap):\n    if not heap:\n        raise IndexError('pop from empty heap')\n    result = heap[0]\n    heap[0] = heap[-1]\n    heap.pop()\n    if heap:\n        i = 0\n        n = len(heap)\n        while True:\n            smallest = i\n            left = 2 * i + 1\n            right = 2 * i + 2\n            if left < n and heap[left] < heap[smallest]:\n                smallest = left\n            if right < n and heap[right] < heap[smallest]:\n                smallest = right\n            if smallest == i:\n                break\n            heap[i], heap[smallest] = heap[smallest], heap[i]\n            i = smallest\n    return result",
    walkthrough: "Save the root (min value). Move last element to root position — this preserves the complete shape but likely violates the heap property. Bubble down: at each step, identify the smallest among parent and its two children. If parent isn't the smallest, swap with the smallest child. The violation sinks down. At most O(log n) levels. For [1,3,5,7]: save 1; move 7 to root → [7,3,5]; i=0, children: left=3(3), right=5(5). Smallest is 3 at index 1. Swap 7↔3 → [3,7,5]; i=1, left=3(out of bounds). Stop. Return 1.",
    testCode: "h = [1,3,5,7]\nval = heappop(h)\nassert val == 1\nassert h == [3,7,5]\nassert is_min_heap(h) == True\nh2 = [2,4,3,5]\nv2 = heappop(h2)\nassert v2 == 2\nassert is_min_heap(h2) == True\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Build Small Heap Step by Step", pattern: "heap construction", skill: "insert values one by one, trace heap shape",
    statement: "Start with an empty heap. Insert values [4,2,7,1,5] one at a time using heappush. Show the heap array after each insertion. Verify the heap property holds at each step.",
    examples: [
      { input: "insert sequence: 4,2,7,1,5", output: "after 4: [4]; after 2: [2,4]; after 7: [2,4,7]; after 1: [1,2,7,4]; after 5: [1,2,7,4,5]" },
    ],
    why: "Step-by-step construction reveals the bubble-up dynamic. Each insertion is O(log n) because the heap is always near-complete. The heap evolves incrementally, always maintaining its invariants — unlike batch construction (heapify), which is one atomic O(n) operation.",
    starterCode: "def build_step_by_step(values):\n    pass",
    hints: [
      "Initialize heap = []. For each v in values, call heappush(heap, v).",
      "Print or collect the heap state after each insertion.",
      "Trace the bubble-up swaps mentally: where does each new value end up?"
    ],
    solution: "def build_step_by_step(values):\n    heap = []\n    states = []\n    for v in values:\n        heappush(heap, v)\n        states.append(heap[:])\n    return states",
    walkthrough: "Insert 4: heap=[4] (root). Insert 2: append → [4,2]; 2<4 swap → [2,4]. Insert 7: append → [2,4,7]; 7>2, no swap. Insert 1: append → [2,4,7,1]; 1<4 swap → [2,1,7,4]; 1<2 swap → [1,2,7,4]. Insert 5: append → [1,2,7,4,5]; 5>2, no swap. Each step is valid — is_min_heap holds after every insertion.",
    testCode: "states = build_step_by_step([4,2,7,1,5])\nassert states[0] == [4]\nassert states[1] == [2,4]\nassert states[2] == [2,4,7]\nassert states[3] == [1,2,7,4]\nassert states[4] == [1,2,7,4,5]\nfor s in states:\n    assert is_min_heap(s) == True\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Bubble Up Trace — Show Each Swap", pattern: "heap insert", skill: "log swaps during bubble up",
    statement: "Augment heappush to return a list of (from_index, to_index, from_val, to_val) tuples representing each swap during bubble up. Insert 0 into [1,3,5] and trace the swaps.",
    examples: [
      { input: "heap = [1,3,5], push 0", output: "swaps = [(3,1,0,3), (1,0,0,1)], result = [0,1,5,3]" },
    ],
    why: "Making the swaps explicit makes the algorithm tangible. You see the new value climbing up level by level, each swap representing a parent that was 'beaten' by the smaller child. The trace IS the proof of correctness.",
    starterCode: "def heappush_with_trace(heap, val):\n    pass",
    hints: [
      "Initialize a trace list. Each swap: record (child_index, parent_index, child_val, parent_val).",
      "After the swap, the child is now at the parent's index. Record the swap details.",
      "Return (original_min, trace). The heap is modified in place."
    ],
    solution: "def heappush_with_trace(heap, val):\n    heap.append(val)\n    i = len(heap) - 1\n    trace = []\n    while i > 0:\n        p = (i - 1) // 2\n        if heap[i] < heap[p]:\n            trace.append((i, p, heap[i], heap[p]))\n            heap[i], heap[p] = heap[p], heap[i]\n            i = p\n        else:\n            break\n    return trace",
    walkthrough: "For [1,3,5] push 0: heap becomes [1,3,5,0]. i=3, parent=1(val=3). 0<3 → swap. trace=[(3,1,0,3)]. After swap: [1,0,5,3], i=1. parent=0(val=1). 0<1 → swap. trace=[(3,1,0,3),(1,0,0,1)]. After swap: [0,1,5,3], i=0. Break. The trace shows the exact vertical movement: index 3→1→0.",
    testCode: "h = [1,3,5]\ntrace = heappush_with_trace(h, 0)\nassert len(trace) == 2\nassert trace[0] == (3,1,0,3)\nassert trace[1] == (1,0,0,1)\nassert h == [0,1,5,3]\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Bubble Down Trace — Show Each Sink Step", pattern: "heap extract", skill: "log swaps during bubble down",
    statement: "Augment heappop to return a list of (parent_index, child_index, parent_val, child_val) tuples representing each swap during bubble down. Pop from [1,3,5,7] and trace the sinking.",
    examples: [
      { input: "heap = [1,3,5,7], pop", output: "result=1, trace=[(0,1,7,3)], heap=[3,7,5]" },
    ],
    why: "Bubble down trace reveals the replacement element sinking into place. Each swap is a parent being 'beaten' by a smaller child — the heap rebalancing. The trace shows how the tree reshapes to restore the invariant.",
    starterCode: "def heappop_with_trace(heap):\n    pass",
    hints: [
      "Save root. Move last element to root. Pop last.",
      "Bubble down: at each swap, record (parent_index, child_index, parent_val, child_val).",
      "Return (popped_value, trace)."
    ],
    solution: "def heappop_with_trace(heap):\n    if not heap:\n        raise IndexError('pop from empty heap')\n    result = heap[0]\n    heap[0] = heap[-1]\n    heap.pop()\n    trace = []\n    if heap:\n        i = 0\n        n = len(heap)\n        while True:\n            smallest = i\n            left = 2 * i + 1\n            right = 2 * i + 2\n            if left < n and heap[left] < heap[smallest]:\n                smallest = left\n            if right < n and heap[right] < heap[smallest]:\n                smallest = right\n            if smallest == i:\n                break\n            trace.append((i, smallest, heap[i], heap[smallest]))\n            heap[i], heap[smallest] = heap[smallest], heap[i]\n            i = smallest\n    return result, trace",
    walkthrough: "For [1,3,5,7]: save 1. Replace root with 7 → [7,3,5]. Bubble down: i=0, left=1(3), right=2(5). Smallest is index 1 (val 3). Swap 0↔1. trace=[(0,1,7,3)]. heap=[3,7,5]. i=1. left=3(out of bounds). Smallest=i. Break. Return (1, [(0,1,7,3)]). The trace shows root 7 sinking past its smaller child 3.",
    testCode: "h = [1,3,5,7]\nval, trace = heappop_with_trace(h)\nassert val == 1\nassert len(trace) == 1\nassert trace[0] == (0,1,7,3)\nassert h == [3,7,5]\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 2, title: "Insert 5 Values — Trace Heap State After Each", pattern: "heap construction", skill: "observe heap shape evolution with multiple inserts",
    statement: "Insert values [7,5,3,1,9] into an initially empty heap. After each insertion, record the heap array, the number of bubble-up swaps that occurred, and the tree shape. Show how the heap converges.",
    examples: [
      { input: "values = [7,5,3,1,9]", output: "final heap = [1,3,5,7,9], total swaps = 6" },
    ],
    why: "Multiple inserts show the statistical pattern: early inserts hit small trees (few swaps), later inserts hit deeper trees. Average insert cost is O(1) amortized — rare deep bubbles balance frequent shallow ones. Total cost across all inserts: O(n log n).",
    starterCode: "def insert_and_trace(values):\n    pass",
    hints: [
      "For each value: heappush, record the heap state and count swaps.",
      "Return (final_heap, states_list, swap_counts_list).",
      "Compute total swaps. Compare to n log n expectation."
    ],
    solution: "def insert_and_trace(values):\n    heap = []\n    states = []\n    swaps = []\n    for v in values:\n        heap.append(v)\n        i = len(heap) - 1\n        count = 0\n        while i > 0:\n            p = (i - 1) // 2\n            if heap[i] < heap[p]:\n                heap[i], heap[p] = heap[p], heap[i]\n                count += 1\n                i = p\n            else:\n                break\n        states.append(heap[:])\n        swaps.append(count)\n    return heap, states, swaps",
    walkthrough: "Insert 7: [7], 0 swaps. Insert 5: [5,7], 1 swap (5<7). Insert 3: [3,7,5], 1 swap (3<5). Insert 1: [1,3,5,7], 2 swaps (1<7, 1<3). Insert 9: [1,3,5,7,9], 0 swaps (9>3). Final: [1,3,5,7,9]. Total swaps: 0+1+1+2+0 = 4. This is well under n log n = 12 for n=5. The amortized cost is low because most insert values aren't extreme enough to bubble far.",
    testCode: "final, states, swaps = insert_and_trace([7,5,3,1,9])\nassert final == [1,3,5,7,9]\nassert len(states) == 5\nassert sum(swaps) == 4\nassert is_min_heap(final) == True\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 2, title: "Pop All Values — Verify Sorted Output", pattern: "heap sort", skill: "repeated heappop produces sorted order",
    statement: "Build a min-heap from [5,2,8,1,9,3]. Then pop all elements using heappop, collecting results. Verify the results come out in ascending sorted order. This IS heapsort.",
    examples: [
      { input: "values = [5,2,8,1,9,3]", output: "[1,2,3,5,8,9]", explain: "popping a min-heap always yields the next smallest element" },
    ],
    why: "Heapsort: build heap (O(n) with heapify, or O(n log n) with inserts), then pop n times (O(n log n)). Total O(n log n). Each heappop returns the current minimum — the sequence of outputs IS the sorted array. No extra passes, no extra space.",
    starterCode: "def heap_sort(values):\n    pass",
    hints: [
      "Build the heap: for each v in values, heappush. Or use heapq.heapify for O(n).",
      "Pop n times: while heap: result.append(heappop(heap)).",
      "result is sorted ascending. For descending, use max-heap (negate values)."
    ],
    solution: "def heap_sort(values):\n    heap = []\n    for v in values:\n        heappush(heap, v)\n    result = []\n    while heap:\n        result.append(heappop(heap))\n    return result",
    walkthrough: "Build: [5]->[2,5]->[2,5,8]->[1,2,8,5]->[1,2,8,5,9]->[1,2,3,5,9,8]. Pop 1→[2,5,3,8,9]. Pop 2→[3,5,9,8]. Pop 3→[5,8,9]. Pop 5→[8,9]. Pop 8→[9]. Pop 9→[]. Output: [1,2,3,5,8,9] = sorted. Heapsort is O(n log n) worst-case, in-place (if you store in the same array), and non-recursive.",
    testCode: "assert heap_sort([5,2,8,1,9,3]) == [1,2,3,5,8,9]\nassert heap_sort([1]) == [1]\nassert heap_sort([]) == []\nassert heap_sort([3,3,3]) == [3,3,3]\nassert heap_sort([5,4,3,2,1]) == [1,2,3,4,5]\nprint('All tests passed!')"
  },
  // ═══ STAGE 3: Heapify ═══
  {
    id: 22, stage: 3, title: "Heapify from Array — O(n) Bottom-Up", pattern: "heap construction", skill: "build heap from unsorted array in O(n) by sinking internal nodes",
    statement: "Implement heapify(arr) that converts an unsorted array into a valid min-heap in O(n) time. Process nodes from the last internal node (index n//2 - 1) down to root (index 0), calling bubble_down at each.",
    examples: [
      { input: "arr = [5,2,8,1,9,3]", output: "[1,2,3,5,9,8]", explain: "valid min-heap built in O(n)" },
    ],
    why: "Naively inserting n elements one by one is O(n log n). Heapify is O(n) by processing nodes bottom-up. Leaves (bottom half) are already valid 1-node heaps. Internal nodes sink — and most nodes are near the bottom, so they sink only a few levels. The sum of sink distances is n, not n log n.",
    starterCode: "def heapify(arr):\n    pass",
    hints: [
      "Start at i = len(arr)//2 - 1 (last internal node). Go down to i=0.",
      "At each i: bubble_down(arr, i) — sink arr[i] until heap property holds.",
      "Leaves (i >= n//2) are already valid 1-element heaps — skip them."
    ],
    solution: "def bubble_down(arr, i):\n    n = len(arr)\n    while True:\n        smallest = i\n        left = 2 * i + 1\n        right = 2 * i + 2\n        if left < n and arr[left] < arr[smallest]:\n            smallest = left\n        if right < n and arr[right] < arr[smallest]:\n            smallest = right\n        if smallest == i:\n            break\n        arr[i], arr[smallest] = arr[smallest], arr[i]\n        i = smallest\n\ndef heapify(arr):\n    for i in range(len(arr)//2 - 1, -1, -1):\n        bubble_down(arr, i)\n    return arr",
    walkthrough: "Only internal nodes need work. For [5,2,8,1,9,3]: n=6, n//2-1=2. Process i=2 (value 8): left=5(3), 3<8 swap → [5,2,3,1,9,8]. i=2 now leaf, stop. i=1 (value 2): left=3(1), 1<2 swap → [5,1,3,2,9,8]; i=3 leaf, stop. i=0 (value 5): left=1(1), 1<5, smallest=1; right=2(3); swap 0↔1 → [1,5,3,2,9,8]; i=1, left=3(2), 2<5 swap → [1,2,3,5,9,8]; i=3 leaf, stop. Done. O(n): most nodes (leaves) sink 0 levels; nodes near bottom sink 1-2 levels; only root sinks log n levels. Weighted sum = O(n).",
    testCode: "assert heapify([5,2,8,1,9,3]) == [1,2,3,5,9,8]\nassert is_min_heap(heapify([5,2,8,1,9,3])) == True\nassert heapify([3,1,2]) == [1,3,2]\nassert heapify([1]) == [1]\nassert heapify([]) == []\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Count Comparisons — Heapify vs n Inserts", pattern: "heap construction", skill: "instrument to count comparisons, compare O(n) vs O(n log n)",
    statement: "Instrument heapify and n-inserts to count element comparisons. Apply both to the same random array of size 100. Show that heapify uses ~100 comparisons vs inserts' ~400+ comparisons.",
    examples: [
      { input: "arr = [i for i in range(100, 0, -1)]", output: "heapify comparisons ~ 100, insert comparisons ~ 400+" },
    ],
    why: "Measuring proves O(n) vs O(n log n) empirically. Heapify's bottom-up strategy works because each sink starts near its final position. Inserts bubble up from leaf to anywhere — the last insert might reach root (O(log n) each). The difference is visible even at modest n.",
    starterCode: "def count_heapify_comparisons(arr):\n    pass\n\ndef count_insert_comparisons(arr):\n    pass",
    hints: [
      "Instrument: add a global counter, increment on each arr[left] < arr[smallest] comparison.",
      "heapify: count comparisons during bubble_down calls.",
      "n-inserts: count comparisons during each bubble_up."
    ],
    solution: "def count_heapify_comparisons(arr):\n    comp = [0]\n    a = arr[:]\n    def sink(idx):\n        n = len(a)\n        i = idx\n        while True:\n            smallest = i\n            left, right = 2*i+1, 2*i+2\n            if left < n:\n                comp[0] += 1\n                if a[left] < a[smallest]:\n                    smallest = left\n            if right < n:\n                comp[0] += 1\n                if a[right] < a[smallest]:\n                    smallest = right\n            if smallest == i:\n                break\n            a[i], a[smallest] = a[smallest], a[i]\n            i = smallest\n    for i in range(len(a)//2 - 1, -1, -1):\n        sink(i)\n    return comp[0]\n\ndef count_insert_comparisons(arr):\n    comp = [0]\n    h = []\n    for v in arr:\n        h.append(v)\n        i = len(h) - 1\n        while i > 0:\n            p = (i - 1) // 2\n            comp[0] += 1\n            if h[i] < h[p]:\n                h[i], h[p] = h[p], h[i]\n                i = p\n            else:\n                break\n    return comp[0]",
    walkthrough: "Heapify: most nodes near leaves sink 0 or 1 level. The root sinks log n levels. Weighted sum across all levels: each level k has ~n/2^(k+1) nodes that might sink ~k levels. ∑ k * n/2^(k+1) = O(n). For n=100, heapify ≈ 100-150 comparisons. Inserts: every element bubbles up from the bottom, potentially to the root. Average insert = O(log 100) ≈ 7 comparisons, total ≈ 700. Even for just n=100, heapify is ~5x fewer comparisons.",
    testCode: "arr = list(range(100, 0, -1))\nhc = count_heapify_comparisons(arr)\nic = count_insert_comparisons(arr)\nassert hc < ic\nassert hc < 300\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Bottom-Up Process — Which Nodes Are Heapified", pattern: "heapify trace", skill: "identify internal nodes, observe sink depth",
    statement: "Given array [9,8,7,6,5,4,3,2,1], trace heapify: for each internal node processed, show its initial position, its value, and how many levels it sank. Show that nodes near the top sink more than near the bottom.",
    examples: [
      { input: "arr = [9,8,7,6,5,4,3,2,1]", output: "i=3(6) sinks 0; i=2(7) sinks 1; i=1(8) sinks 2; i=0(9) sinks 3" },
    ],
    why: "The sink-depths gradient is why heapify is O(n): deep nodes (near root) are rare, shallow nodes (near leaves) are numerous. The total sink depth across all n nodes sums to O(n), not O(n log n).",
    starterCode: "def trace_heapify(arr):\n    pass",
    hints: [
      "Iterate i from n//2-1 down to 0. For each i, record before/after value and sink distance.",
      "Sink distance = final_index - start_index (in terms of tree levels).",
      "Return list of (start_index, value, sink_levels)."
    ],
    solution: "def trace_heapify(arr):\n    a = arr[:]\n    trace = []\n    n = len(a)\n    def sink(i):\n        original_i = i\n        while True:\n            smallest = i\n            left, right = 2*i+1, 2*i+2\n            if left < n and a[left] < a[smallest]:\n                smallest = left\n            if right < n and a[right] < a[smallest]:\n                smallest = right\n            if smallest == i:\n                break\n            a[i], a[smallest] = a[smallest], a[i]\n            i = smallest\n        return i - original_i\n    for idx in range(n//2 - 1, -1, -1):\n        val = a[idx]\n        distance = sink(idx)\n        levels = 0\n        pos = idx\n        while pos > 0:\n            pos = (pos - 1) // 2\n            levels += 1\n        target_levels = 0\n        pos = idx + distance\n        while pos > 0:\n            pos = (pos - 1) // 2\n            target_levels += 1\n        sink_levels = target_levels - levels\n        trace.append((idx, val, max(0, sink_levels)))\n    return trace",
    walkthrough: "For [9,8,7,6,5,4,3,2,1] (n=9, internal indices 3,2,1,0): i=3(6): left=7(2), right=8(1). 1<6, swap→[9,8,7,1,5,4,3,2,6]. i=3 now leaf, sink 0 levels (i stayed 3). i=2(7): children 5(4),6(3). 3<7 swap→[9,8,3,1,5,4,7,2,6]. i=6 leaf, sink 1 step. i=1(8): children 3(1),4(5). 1<8 swap→[9,1,3,8,5,4,7,2,6]. i=3, child 7(2). 2<8 swap→[9,1,3,2,5,4,7,8,6]. i=7 leaf, sink 2 steps. i=0(9): children 1(1),2(3). 1<9 swap→[1,9,3,2,5,4,7,8,6]. i=1, child 3(2). 2<9 swap→[1,2,3,9,5,4,7,8,6]. i=3, child 7(8). 8<9 swap→[1,2,3,8,5,4,7,9,6]. i=7 leaf, sink 3 steps. Deep nodes sink more but there are exponentially fewer of them.",
    testCode: "trace = trace_heapify([9,8,7,6,5,4,3,2,1])\nresult = heapify([9,8,7,6,5,4,3,2,1])\nassert is_min_heap(result) == True\nassert len(trace) == 4\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Verify O(n) by Counting Operations", pattern: "heapify analysis", skill: "count total swap distance, confirm < 2n",
    statement: "Implement heapify_count(arr) that returns the total number of swap operations (not comparisons, but actual element swaps) during heapify. Prove empirically that total swaps < 2n for any input of size n.",
    examples: [
      { input: "random array of size 1000", output: "total_swaps / n < 2", explain: "theoretical bound: total swaps <= n" },
    ],
    why: "The theoretical upper bound for heapify swaps is n — each element moves at most once per level, and the sum of level depths times node count equals n. Empirical verification builds intuition: the cost is truly linear.",
    starterCode: "def heapify_count_swaps(arr):\n    pass",
    hints: [
      "Instrument the swap operation: increment counter on each swap.",
      "Sink one element may cause multiple swaps (one per level). Sum total swaps.",
      "Compare total_swaps to len(arr). For random data, ratio should be well under 1.0."
    ],
    solution: "def heapify_count_swaps(arr):\n    a = arr[:]\n    n = len(a)\n    swaps = 0\n    def sink(i):\n        nonlocal swaps\n        while True:\n            smallest = i\n            left, right = 2*i+1, 2*i+2\n            if left < n and a[left] < a[smallest]:\n                smallest = left\n            if right < n and a[right] < a[smallest]:\n                smallest = right\n            if smallest == i:\n                break\n            a[i], a[smallest] = a[smallest], a[i]\n            swaps += 1\n            i = smallest\n    for i in range(n//2 - 1, -1, -1):\n        sink(i)\n    return swaps",
    walkthrough: "Each swap moves an element down one level. An element starting at level h (root = 0) can sink at most (tree_height - h) levels. The number of nodes at level h is ~n/2^(h+1). Total swaps <= ∑ (h nodes at level h) * (max sink) = ∑ n/2^(h+1) * (H-h). This sum converges to O(n). Empirically, for n=1000, swaps are typically 600-900 — well under n. Not just O(n) asymptotically, but practically efficient.",
    testCode: "import random\narr = list(range(1000))\nrandom.shuffle(arr)\nswaps = heapify_count_swaps(arr)\nassert swaps < 2 * len(arr)\nassert is_min_heap(heapify(arr)) == True\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Convert List to Heap with heapq.heapify", pattern: "heap construction", skill: "use Python's heapq.heapify, verify correctness",
    statement: "Use Python's heapq.heapify to convert a list to a min-heap. Demonstrate three examples: a random list, an already-sorted ascending list, and an already-sorted descending list. Verify each is a valid min-heap after heapify.",
    examples: [
      { input: "arr = [5,3,8,1,2]", output: "heap = [1,2,8,5,3]", explain: "valid min-heap, not fully sorted" },
    ],
    why: "heapq.heapify is the production-grade heapify — implemented in C, O(n), battle-tested. Understanding it replaces manual heapify in real code. But knowing how it works internally (P18) is what makes you trust it.",
    starterCode: "import heapq\n\ndef convert_to_heap(arr):\n    pass",
    hints: [
      "Make a copy: h = arr[:]. Call heapq.heapify(h).",
      "Don't check if it's sorted — check if it's a valid min-heap (P7's is_min_heap).",
      "A heap is NOT a sorted array. It's a partially ordered tree in array form."
    ],
    solution: "import heapq\n\ndef convert_to_heap(arr):\n    h = arr[:]\n    heapq.heapify(h)\n    return h",
    walkthrough: "heapq.heapify modifies in-place in O(n). The result is a valid min-heap: heap[0] is the minimum. The rest follows the heap shape property (complete binary tree) and heap ordering property (parent <= children). For [5,3,8,1,2]: heapify produces [1,2,8,5,3]. Check: 1<=2, 1<=8, 2<=5, 2<=3. All hold. But [1,2,3,5,8] would be fully sorted — this is NOT a heap requirement. heap[1]=2 < heap[2]=8? Yes, but not required by the heap property (siblings are unordered).",
    testCode: "import heapq\nh = convert_to_heap([5,3,8,1,2])\nassert is_min_heap(h) == True\nh2 = convert_to_heap([1,2,3,4,5])\nassert is_min_heap(h2) == True\nh3 = convert_to_heap([5,4,3,2,1])\nassert is_min_heap(h3) == True\nprint('All tests passed!')"
  },
  // +++ STAGE 3 new +++
  {
    id: 27, stage: 3, title: "Heapify an Already-Sorted Array — Zero Swaps", pattern: "heapify analysis", skill: "heapify an ascending array, observe zero swaps needed",
    statement: "Heapify an already-sorted ascending array (min at beginning). Trace and count swaps. Show that heapify on an already-min-heap array does zero swaps — every node already satisfies the heap property. O(n) visits still happen but no work is needed.",
    examples: [
      { input: "arr = [1,2,3,4,5,6,7]", output: "([1,2,3,4,5,6,7], 0)", explain: "already a valid min-heap — no swaps needed" },
    ],
    why: "Heapify on a valid min-heap is a no-op but still visits every internal node. This demonstrates the difference between O(n) visits (always) and O(n) swaps (worst-case). Even in the best case, heapify touches every internal node to verify the property — but doesn't swap. The O(n) guarantee includes verification, not just modifications.",
    starterCode: "def heapify_sorted(arr):\n    pass",
    hints: [
      "Make a copy. Iterate internal nodes from bottom to top. Sink each.",
      "For an ascending array, every parent is already <= children. The sink loop's smallest == i check breaks immediately.",
      "Count swaps during the entire process. Return (heapified_array, swap_count)."
    ],
    solution: "def heapify_sorted(arr):\n    a = arr[:]\n    n = len(a)\n    swaps = 0\n    for i in range(n // 2 - 1, -1, -1):\n        current = i\n        while True:\n            smallest = current\n            left, right = 2*current+1, 2*current+2\n            if left < n and a[left] < a[smallest]:\n                smallest = left\n            if right < n and a[right] < a[smallest]:\n                smallest = right\n            if smallest == current:\n                break\n            a[current], a[smallest] = a[smallest], a[current]\n            swaps += 1\n            current = smallest\n    return (a, swaps)",
    walkthrough: "For [1,2,3,4,5,6,7], n=7, internal nodes = indices 2,1,0. i=2 (value 3): children 6,7. 3<6 and 3<7 → smallest=i, break. No swap. i=1 (value 2): children 4,5. 2<4 and 2<5 → break. i=0 (value 1): children 2,3. 1<2 and 1<3 → break. Total swaps = 0. Heapify checked 3 internal nodes — 3 comparisons, 0 swaps. For a descending array, every internal node would sink — many swaps. But total is still O(n) regardless.",
    testCode: "arr, swaps = heapify_sorted([1,2,3,4,5,6,7])\nassert arr == [1,2,3,4,5,6,7]\nassert swaps == 0\nassert is_min_heap(arr) == True\narr2, s2 = heapify_sorted([1,3,2])\nassert is_min_heap(arr2) == True\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 3, title: "Count Nodes Actually Sunk During Heapify", pattern: "heapify analysis", skill: "instrument heapify to track which internal nodes moved",
    statement: "Given an array, run heapify and count how many internal nodes needed at least one swap (actually sank). Return the count. For random data, roughly n/4 nodes sink. For worst-case (descending sorted), every internal node sinks.",
    examples: [
      { input: "arr = [7,6,5,4,3,2,1]", output: "3", explain: "n=7, internal nodes=3 (indices 2,1,0). All 3 sink because descending is worst-case." },
      { input: "arr = [1,2,3,4,5,6,7]", output: "0", explain: "already a heap — nothing sinks" },
    ],
    why: "Heapify's O(n) cost depends on how many nodes actually sink, not just how many are checked. In random data, only ~n/4 nodes move, and they move an average of ~1 level each. The sum of sink depths is ~n. This problem makes the amortized argument concrete: count the movers.",
    starterCode: "def count_sunk_nodes(arr):\n    pass",
    hints: [
      "Run heapify. Track a boolean per internal node: did it ever swap?",
      "A node 'sinks' if its sink loop executed at least one swap. Increment counter only on first swap per node.",
      "Compare sinking nodes to total internal nodes. For worst case, all sink. For random, ~half sink."
    ],
    solution: "def count_sunk_nodes(arr):\n    a = arr[:]\n    n = len(a)\n    sunk = 0\n    for i in range(n // 2 - 1, -1, -1):\n        moved = False\n        current = i\n        while True:\n            smallest = current\n            left, right = 2*current+1, 2*current+2\n            if left < n and a[left] < a[smallest]:\n                smallest = left\n            if right < n and a[right] < a[smallest]:\n                smallest = right\n            if smallest == current:\n                break\n            a[current], a[smallest] = a[smallest], a[current]\n            moved = True\n            current = smallest\n        if moved:\n            sunk += 1\n    return sunk",
    walkthrough: "For [7,6,5,4,3,2,1] (descending): i=2(5): children 2,1. 1<5 swap→[7,6,1,4,3,2,5]; sunk=1. i=1(6): children 4,3. 3<6 swap→[7,3,1,4,6,2,5]; sunk=2. i=0(7): eventually sinks 3 levels → sunk=3. All 3 internal nodes moved. For [1,2,3,4,5,6,7]: every sink check immediately breaks — sunk=0. For random data, expect ~n/4 movers. This confirms heapify's efficiency: most nodes don't move, and those that do move short distances.",
    testCode: "assert count_sunk_nodes([7,6,5,4,3,2,1]) == 3\nassert count_sunk_nodes([1,2,3,4,5,6,7]) == 0\nassert count_sunk_nodes([5,3,1]) >= 1\nprint('All tests passed!')"
  },
  // ═══ STAGE 4: Naive ═══
  {
    id: 29, stage: 4, title: "Kth Largest via Sort — O(n log n)", pattern: "naive kth", skill: "sort descending, pick index k-1",
    statement: "Given an array and k, return the kth largest element. Naive solution: sort the array in descending order and return arr[k-1]. Analyze the complexity: O(n log n) time, O(1) extra space (in-place sort) or O(n) (sorted copy).",
    examples: [
      { input: "arr = [3,2,1,5,6,4], k = 2", output: "5", explain: "sorted desc: [6,5,4,3,2,1], k=2 → 5" },
      { input: "arr = [3,2,3,1,2,4,5,5,6], k = 4", output: "4" },
    ],
    why: "Sorting is the hammer — it always works but costs O(n log n). For kth-largest queries on static data, this is fine. For streaming data or repeated queries, sorting every time is wasteful. The heap gives you O(n log k), which is better when k << n.",
    starterCode: "def kth_largest_sort(arr, k):\n    pass",
    hints: [
      "Sort descending: sorted(arr, reverse=True).",
      "Return the element at index k-1.",
      "Complexity: sorting dominates at O(n log n). Space: O(n) for sorted copy, O(1) if .sort() in-place."
    ],
    solution: "def kth_largest_sort(arr, k):\n    sorted_arr = sorted(arr, reverse=True)\n    return sorted_arr[k - 1]",
    walkthrough: "Sorting rearranges the entire array just to pick the kth element. The other n-k elements are sorted unnecessarily. For k=1, you sorted the whole array just to find the max — a simple O(n) scan would suffice. For k≈n, sorting is reasonable. The heap approach shines when k is small: O(n log k) vs O(n log n).",
    testCode: "assert kth_largest_sort([3,2,1,5,6,4], 2) == 5\nassert kth_largest_sort([3,2,3,1,2,4,5,5,6], 4) == 4\nassert kth_largest_sort([1], 1) == 1\nassert kth_largest_sort([1,2], 1) == 2\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Top K via Sort — O(n log n)", pattern: "naive top-k", skill: "sort, slice first k",
    statement: "Given an array and k, return the k largest elements in any order. Naive: sort descending, take first k. O(n log n).",
    examples: [
      { input: "arr = [3,2,1,5,6,4], k = 3", output: "[6,5,4]", explain: "sorted desc: [6,5,4,3,2,1], first 3 are [6,5,4]" },
    ],
    why: "Same waste as P23: sorting the entire array to pick k elements. The heap approach with a size-k min-heap gives O(n log k) — much better when k is small. For k=10 and n=10^6, sorting sorts 1M elements; the heap maintains just 10.",
    starterCode: "def top_k_sort(arr, k):\n    pass",
    hints: [
      "Sort descending and slice: return sorted(arr, reverse=True)[:k].",
      "If k >= len(arr), return the whole sorted array.",
      "O(n log n) time, O(n) space for the sorted copy."
    ],
    solution: "def top_k_sort(arr, k):\n    return sorted(arr, reverse=True)[:k]",
    walkthrough: "Sorting rearranges everything. For n=1M, k=3, you pay the full O(n log n) = ~20M comparisons to extract 3 values. The heap solution: maintain a min-heap of size 3, push each of 1M elements, popping the smallest when heap exceeds 3. At the end, the 3 remaining are the 3 largest. Cost: 1M * log(3) = ~2M operations — 10x faster.",
    testCode: "assert sorted(top_k_sort([3,2,1,5,6,4], 3)) == [4,5,6]\nassert top_k_sort([1], 1) == [1]\nassert top_k_sort([1,2,3], 5) == [3,2,1]\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "K Smallest via Sort", pattern: "naive k-smallest", skill: "sort ascending, slice first k",
    statement: "Given an array and k, return the k smallest elements. Sort ascending, take first k. O(n log n). For very small k, even O(n log n) is wasteful — a size-k max-heap achieves O(n log k).",
    examples: [
      { input: "arr = [3,2,1,5,6,4], k = 3", output: "[1,2,3]" },
    ],
    why: "Mirror of P24. The pattern is identical: sort and slice. The heap version in Stage 5 will replace this with a size-k max-heap (negate values in heapq) to maintain the k smallest. Same complexity argument — wins when k << n.",
    starterCode: "def k_smallest_sort(arr, k):\n    return sorted(arr)[:k]",
    hints: [
      "Sort ascending and slice first k.",
      "Heap alternative: max-heap of size k (push -v, maintain size).",
      "For k small relative to n, heap version is faster."
    ],
    solution: "def k_smallest_sort(arr, k):\n    return sorted(arr)[:k]",
    walkthrough: "Pure sort-and-slice. The entire array gets sorted even if k=1. A max-heap of size k tracks the k smallest by kicking out elements larger than the current kth smallest. Push each element through: if heap size < k, push. If element < heap_max, replace max. After processing all n elements, the heap contains the k smallest.",
    testCode: "assert k_smallest_sort([3,2,1,5,6,4], 3) == [1,2,3]\nassert k_smallest_sort([1], 1) == [1]\nassert k_smallest_sort([3,1,2], 2) == [1,2]\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "Median via Sort — O(n log n)", pattern: "naive median", skill: "sort, pick middle element",
    statement: "Find the median of an array by sorting. If n is odd, median = arr[n//2]. If n is even, median = arr[n//2 - 1] (lower median). O(n log n). The heap approach (two heaps, Stage 6) will find medians in O(log n) per element for streams.",
    examples: [
      { input: "arr = [3,1,4,1,5,9,2]", output: "3", explain: "sorted: [1,1,2,3,4,5,9], n=7, median=index 3 → 3" },
      { input: "arr = [1,2,3,4]", output: "2", explain: "even, lower median at n//2-1 = 1" },
    ],
    why: "Median via sort works once. For streaming — elements arriving one by one, need median after each — sorting each time is O(k log k) per element, O(n^2 log n) total. Two heaps (Stage 6) maintain median in O(log n) per element, O(n log n) total.",
    starterCode: "def median_sort(arr):\n    pass",
    hints: [
      "Sort arr. If len(arr) % 2 == 1: return arr[len(arr)//2].",
      "If even: return arr[len(arr)//2 - 1] (lower median, as convention).",
      "The 'upper median' is arr[len(arr)//2] for even case."
    ],
    solution: "def median_sort(arr):\n    s = sorted(arr)\n    n = len(s)\n    return s[(n - 1) // 2]",
    walkthrough: "Sorting O(n log n). For odd n, (n-1)//2 = n//2 = middle index. For even n, (n-1)//2 = n//2 - 1 = lower median. (n-1)//2 handles both cases cleanly. This works once. For streaming: insert each new element into sorted position O(n), then read median O(1) — O(n^2) total. Two heaps do it in O(n log n) total.",
    testCode: "assert median_sort([3,1,4,1,5,9,2]) == 3\nassert median_sort([1,2,3,4]) == 2\nassert median_sort([5]) == 5\nassert median_sort([1,2]) == 1\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Streaming Kth via Sort Per Element", pattern: "naive streaming kth", skill: "sort partial array after each arrival",
    statement: "Elements arrive one at a time. After each arrival, recompute the kth smallest by sorting the seen elements. Return the kth smallest after each step. Show the O(m log m) per step (m = current size) exploding.",
    examples: [
      { input: "stream = [4,5,8,2], k = 3", output: "[−1,−1,5,4]", explain: "after 1 elem: not enough; after 2: not enough; after 3: k=3 → 5; after 4: k=3 → 4" },
    ],
    why: "Per-element sorting is O(1 log 1 + 2 log 2 + ... + n log n) ≈ O(n^2 log n) total. The size-k heap streams in O(n log k) — a massive improvement for large n and small k.",
    starterCode: "def streaming_kth_sort(stream, k):\n    pass",
    hints: [
      "Maintain seen = []. For each val in stream: seen.append(val), sort, return seen[k-1] if len >= k else -1.",
      "Complexity explodes because each step does a full sort.",
      "Heap optimization: maintain a min-heap of size k. After n elements, heap[0] is kth smallest."
    ],
    solution: "def streaming_kth_sort(stream, k):\n    seen = []\n    result = []\n    for val in stream:\n        seen.append(val)\n        if len(seen) >= k:\n            s = sorted(seen, reverse=True)\n            result.append(s[k - 1])\n        else:\n            result.append(-1)\n    return result",
    walkthrough: "Step 1: [4], k=3, insufficient → -1. Step 2: [4,5], insufficient → -1. Step 3: [4,5,8], sorted desc [8,5,4], k=3 → 4. Step 4: [4,5,8,2], sorted desc [8,5,4,2], k=3 → 4. Sorting at step m costs O(m log m). Sum over all m: ≈ O(n^2 log n). The heap streams in O(n log k) — for k=5, n=100k, that's 100k*log(5) ≈ 230k vs 10^10.",
    testCode: "assert streaming_kth_sort([4,5,8,2], 3) == [-1,-1,5,4]\nassert streaming_kth_sort([3,1,4], 1) == [3,1,1]\nassert streaming_kth_sort([1], 2) == [-1]\nprint('All tests passed!')"
  },
  // +++ STAGE 4 new +++
  {
    id: 34, stage: 4, title: "K Closest Points to Origin via Sort", pattern: "naive k-closest", skill: "compute all distances, sort, return first k",
    statement: "Given a list of (x,y) points and k, return the k closest points to origin (0,0). Naive: compute squared distances for all points, sort by distance ascending, return the first k. O(n log n).",
    examples: [
      { input: "points = [[1,3],[-2,2]], k = 1", output: "[[-2,2]]", explain: "distances: 10 vs 8, [-2,2] is closer" },
      { input: "points = [[3,3],[5,-1],[-2,4]], k = 2", output: "[[3,3],[-2,4]]" },
    ],
    why: "Sorting the entire list by distance is brute force. It works but costs O(n log n). For k=1, you sorted everything just to find the single closest point. The heap solution (Stage 5, P30) uses a size-k max-heap to maintain k closest in O(n log k) — much faster when k is small.",
    starterCode: "def k_closest_sort(points, k):\n    pass",
    hints: [
      "Compute distance for each point: x*x + y*y (no sqrt needed — preserves order for comparison).",
      "Sort points by distance: sorted(points, key=lambda p: p[0]**2 + p[1]**2).",
      "Return the first k points. O(n log n) time, O(n) space for the sorted copy."
    ],
    solution: "def k_closest_sort(points, k):\n    return sorted(points, key=lambda p: p[0]**2 + p[1]**2)[:k]",
    walkthrough: "The lambda computes squared distance as the sort key. sorting costs O(n log n). Slicing [:k] extracts the k closest. For n=1M, k=5: sorting costs ~20M comparisons. The heap version: maintain a max-heap of size 5, push each of 1M points, pop when >5. Cost: 1M * log(5) ≈ 2.3M operations. ~10x faster because sorting wasted effort ordering the other 999,995 elements.",
    testCode: "assert k_closest_sort([[1,3],[-2,2]], 1) == [[-2,2]]\nassert sorted(k_closest_sort([[3,3],[5,-1],[-2,4]], 2)) == sorted([[3,3],[-2,4]])\nassert k_closest_sort([[0,1],[1,0]], 2) == [[0,1],[1,0]]\nassert k_closest_sort([[1,1]], 1) == [[1,1]]\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 4, title: "Top K Frequent Elements via Sort + Dict", pattern: "naive top-k frequent", skill: "count with dict, sort by frequency descending, return top k",
    statement: "Given an array and k, return the k most frequent elements. Naive: count frequencies with a dictionary, then sort unique elements by frequency (descending) and return the first k. O(n + u log u) where u = unique elements.",
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]", explain: "1 appears 3 times, 2 appears 2 times — top 2" },
      { input: "nums = [1], k = 1", output: "[1]" },
    ],
    why: "Counting is O(n) with a dict. Sorting unique elements is O(u log u). In the worst case u ≈ n, so sorting costs O(n log n). The heap version (Stage 6, P37) uses a size-k min-heap on frequencies — O(n log k). When k << n, the heap wins decisively.",
    starterCode: "from collections import Counter\n\ndef top_k_frequent_sort(nums, k):\n    pass",
    hints: [
      "Use Counter(nums) to get a frequency dictionary in O(n).",
      "Sort items by frequency descending: sorted(counter.items(), key=lambda x: -x[1]).",
      "Return the first k keys (the elements). O(n + u log u) total."
    ],
    solution: "from collections import Counter\n\ndef top_k_frequent_sort(nums, k):\n    count = Counter(nums)\n    sorted_items = sorted(count.items(), key=lambda x: -x[1])\n    return [item[0] for item in sorted_items[:k]]",
    walkthrough: "Counter builds a frequency map in O(n). sorted() orders by negative frequency (descending) in O(u log u). For nums=[1,1,1,2,2,3]: counter={1:3, 2:2, 3:1}. Sorted by -freq: [(1,3), (2,2), (3,1)]. Keys sliced: [1,2]. Sorting is the bottleneck. The heap approach pushes each (freq, num) through a size-k min-heap — keeping only the k highest frequencies in O(n log k) without sorting all unique elements.",
    testCode: "r = sorted(top_k_frequent_sort([1,1,1,2,2,3], 2))\nassert r == [1,2]\nassert top_k_frequent_sort([1], 1) == [1]\nassert sorted(top_k_frequent_sort([1,2,2,3,3,3], 2)) == [2,3]\nprint('All tests passed!')"
  },
  // ═══ STAGE 5: Optimization ═══
  {
    id: 36, stage: 5, title: "Kth Largest via Size-k Min Heap — O(n log k)", pattern: "size-k heap", skill: "maintain heap of largest k, root is kth largest",
    statement: "Return the kth largest element using a min-heap of size k. Process each element: push to heap; if heap size > k, pop smallest. At the end, heap[0] is the kth largest. O(n log k).",
    examples: [
      { input: "arr = [3,2,1,5,6,4], k = 2", output: "5", explain: "heap maintains top 2; after all, heap=[5,6], heap[0]=5" },
    ],
    why: "This is THE pattern for kth-largest. A min-heap of size k contains the k largest elements seen so far, with the smallest of those at the root (the kth largest overall). Each element costs at most O(log k) to push/pop.",
    starterCode: "import heapq\n\ndef kth_largest_heap(arr, k):\n    pass",
    hints: [
      "Initialize min_heap = []. For each v in arr: heappush(heap, v).",
      "If len(heap) > k: heappop(heap). This discards the smallest among the k+1 largest.",
      "After loop: return heap[0] (the smallest of the k largest = kth largest overall)."
    ],
    solution: "import heapq\n\ndef kth_largest_heap(arr, k):\n    heap = []\n    for v in arr:\n        heapq.heappush(heap, v)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]",
    walkthrough: "The min-heap acts as a filter: if a new value is smaller than the current kth largest (heap[0]), it gets pushed then immediately popped (or never pushed if you check first). If larger, it pushes out the old kth largest. After all elements: heap contains exactly the k largest elements, with the smallest at the root. For arr=[3,2,1,5,6,4], k=2: push 3→[3]; push 2→[2,3]; push 1→[1,3], pop→[2,3]; push 5→[2,3,5], pop→[3,5]; push 6→[3,5,6], pop→[5,6]; push 4→[4,6,5], pop→[5,6]; heap[0]=5. Every element passes through the heap exactly once: O(n log k).",
    testCode: "assert kth_largest_heap([3,2,1,5,6,4], 2) == 5\nassert kth_largest_heap([3,2,3,1,2,4,5,5,6], 4) == 4\nassert kth_largest_heap([1], 1) == 1\nprint('All tests passed!')"
  },
  {
    id: 37, stage: 5, title: "Top K via Size-k Heap", pattern: "size-k heap", skill: "min-heap of k largest, then drain",
    statement: "Return the k largest elements using a size-k min-heap. After processing all elements, the heap contains the k largest. Use heappop to extract them in ascending order (or just return the heap list).",
    examples: [
      { input: "arr = [3,2,1,5,6,4], k = 3", output: "[4,5,6]", explain: "heap contains [4,5,6] at end, any order accepted" },
    ],
    why: "Same min-heap-size-k filter as P28, but collect all k at the end. This transforms the top-k problem from O(n log n) sorting to O(n log k) filtering. For k=10 and n=1M: 1M*log(10) ≈ 3.3M ops vs sorting's 1M*log(1M) ≈ 20M ops.",
    starterCode: "import heapq\n\ndef top_k_heap(arr, k):\n    pass",
    hints: [
      "Use heapq.nlargest(k, arr) for the built-in, or implement manually.",
      "Manual: min-heap of size k. For each v: push, pop if size > k.",
      "Return the heap (any order) or drain with heappop for descending order."
    ],
    solution: "import heapq\n\ndef top_k_heap(arr, k):\n    heap = []\n    for v in arr:\n        heapq.heappush(heap, v)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    result = []\n    while heap:\n        result.append(heapq.heappop(heap))\n    return result",
    walkthrough: "Same filtering loop as P28 but with k=3. Push each element, maintain exactly k in heap (the k largest so far). At the end, pop all — they come out in ascending order. For [3,2,1,5,6,4]: after all, heap=[4,5,6]; pop→4,5,6. The heap acts as an efficient way to discard elements that can't be in the top k without fully sorting.",
    testCode: "assert top_k_heap([3,2,1,5,6,4], 3) == [4,5,6]\nassert top_k_heap([1], 1) == [1]\nassert top_k_heap([1,2,3,4,5], 5) == [1,2,3,4,5]\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "K Closest Points to Origin", pattern: "size-k heap", skill: "distance as heap key, maintain k closest",
    statement: "Given a list of (x, y) points and k, return the k closest points to the origin (0, 0). Distance = x^2 + y^2 (no sqrt needed for comparison). Use a max-heap of size k (negate distances) to keep the k closest.",
    examples: [
      { input: "points = [[1,3],[-2,2]], k = 1", output: "[[-2,2]]", explain: "distance: 10 vs 8, [-2,2] is closer" },
      { input: "points = [[3,3],[5,-1],[-2,4]], k = 2", output: "[[3,3],[-2,4]]" },
    ],
    why: "Distance as heap key. A max-heap of size k keeps the k CLOSEST points: push (-distance, x, y). When heap exceeds k, pop the point with largest distance (most negative = farthest). The remaining k are closest.",
    starterCode: "import heapq\n\ndef k_closest(points, k):\n    pass",
    hints: [
      "Max-heap for 'k closest': push (-(x*x+y*y), x, y). When size > k, pop — removes farthest.",
      "Why max-heap? The heap root is the LARGEST distance among the k closest. If a new point is closer, push it; the old farthest gets popped.",
      "At the end, extract coordinates from heap. Return [[x,y] for _,x,y in heap]."
    ],
    solution: "import heapq\n\ndef k_closest(points, k):\n    heap = []\n    for x, y in points:\n        d = x * x + y * y\n        heapq.heappush(heap, (-d, x, y))\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return [[x, y] for _, x, y in heap]",
    walkthrough: "Max-heap via negation. For each point, compute squared distance (avoid sqrt — expensive and unnecessary for comparison). Push (-dist, x, y). The most negative = largest distance = furthest point. When heap > k, pop removes the furthest among the k+1. The remaining k have the smallest distances. For [[1,3],[-2,2]], k=1: push (-10,1,3)→heap=[...]; push (-8,-2,2)→heap has 2, pop largest neg→(-8,-2,2) remains. Return [[-2,2]].",
    testCode: "r = k_closest([[1,3],[-2,2]], 1)\nassert r == [[-2,2]]\nr2 = sorted(k_closest([[3,3],[5,-1],[-2,4]], 2))\nassert sorted(r2) == sorted([[3,3],[-2,4]])\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Kth Largest in Stream", pattern: "streaming kth", skill: "size-k min-heap on streaming data",
    statement: "Implement a KthLargest class with: constructor(k, nums) initializes with an array, and add(val) appends val and returns the kth largest element. Use a size-k min-heap.",
    examples: [
      { input: "k=3, nums=[4,5,8,2]; add(3)→4; add(5)→5; add(10)→5; add(9)→8", output: "4,5,5,8", explain: "streaming kth largest after each add" },
    ],
    why: "The streaming version exposes the size-k heap's real-time nature. Each add is O(log k). The heap persists across calls — no rebuilding. This is the production pattern for real-time kth-largest metrics.",
    starterCode: "import heapq\n\nclass KthLargest:\n    def __init__(self, k, nums):\n        pass\n    def add(self, val):\n        pass",
    hints: [
      "__init__: self.k = k, self.heap = nums. Heapify, then pop while len > k.",
      "add: push val, if len > k pop, return heap[0].",
      "heap[0] is the kth largest (smallest of the k largest)."
    ],
    solution: "import heapq\n\nclass KthLargest:\n    def __init__(self, k, nums):\n        self.k = k\n        self.heap = nums[:]\n        heapq.heapify(self.heap)\n        while len(self.heap) > k:\n            heapq.heappop(self.heap)\n    def add(self, val):\n        heapq.heappush(self.heap, val)\n        if len(self.heap) > self.k:\n            heapq.heappop(self.heap)\n        return self.heap[0]",
    walkthrough: "Init: build heap from initial data, trim to size k. The heap persists. Each add: push the new value, pop the smallest if we exceed k (that smallest is the (k+1)th largest — out of contention). Return heap[0] — the current kth largest. Trace: k=3, init([4,5,8,2]) → heap=[2,4,8,5], pop(2) → [4,5,8]. add(3) → [3,5,8,4], pop(3) → [4,5,8], return 4. add(5) → [4,5,8,5], pop(4) → [5,5,8], return 5. add(10) → [5,5,8,10], pop(5) → [5,8,10], return 5. add(9) → [5,8,10,9], pop(5) → [8,9,10], return 8.",
    testCode: "kl = KthLargest(3, [4,5,8,2])\nassert kl.add(3) == 4\nassert kl.add(5) == 5\nassert kl.add(10) == 5\nassert kl.add(9) == 8\nkl2 = KthLargest(1, [])\nassert kl2.add(5) == 5\nassert kl2.add(3) == 5\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "Last Stone Weight", pattern: "max-heap simulation", skill: "simulate stone crushing with max-heap",
    statement: "Stones have weights. In each step, pick the 2 heaviest. If equal, both destroyed. If unequal, the lighter is destroyed and the heavier gets weight = heavier - lighter. Stop when <= 1 stone remains. Return its weight or 0. Use a max-heap.",
    examples: [
      { input: "stones = [2,7,4,1,8,1]", output: "1", explain: "8-7→1→[2,4,1,1,1]; 4-2→2→[1,1,1,2]; 2-1→1→[1,1,1]; 1-1→0→[1]; return 1" },
    ],
    why: "Repeated extraction of 2 largest, insertion of difference — exactly the pattern that demands a heap. Two pops, one push per step, O(n log n) total. The max-heap (negate for Python's min-heap) fits perfectly.",
    starterCode: "import heapq\n\ndef last_stone_weight(stones):\n    pass",
    hints: [
      "Negate all values to create a max-heap. heapq.heapify(negated_stones).",
      "While len > 1: pop two largest (negate back), compute difference, push negated difference.",
      "Return -heap[0] if heap else 0."
    ],
    solution: "import heapq\n\ndef last_stone_weight(stones):\n    heap = [-s for s in stones]\n    heapq.heapify(heap)\n    while len(heap) > 1:\n        a = -heapq.heappop(heap)\n        b = -heapq.heappop(heap)\n        if a != b:\n            heapq.heappush(heap, -(a - b))\n    return -heap[0] if heap else 0",
    walkthrough: "Max-heap via negation. Pop two largest: a=8, b=7. 8-7=1, push(-1). heap=[-4,-2,-1,-1,-1]. Pop a=4, b=2. 4-2=2, push(-2). heap=[-2,-1,-1,-1]. Pop a=2, b=1. 2-1=1, push(-1). heap=[-1,-1,-1]. Pop a=1, b=1. Equal, nothing pushed. heap=[-1]. len=1, return -(-1)=1. This is a heap simulation problem — the data structure matches the operation pattern exactly.",
    testCode: "assert last_stone_weight([2,7,4,1,8,1]) == 1\nassert last_stone_weight([1]) == 1\nassert last_stone_weight([2,2]) == 0\nassert last_stone_weight([]) == 0\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 5, title: "K Weakest Rows in Matrix", pattern: "size-k heap + custom key", skill: "heap with tuple key (soldier_count, row_index)",
    statement: "Given a binary matrix where 1=soldier, 0=civilian, each row is sorted (1s then 0s). Return indices of the k weakest rows (fewest soldiers, tie broken by smaller index). Use a min-heap of size k with tuples.",
    examples: [
      { input: "mat = [[1,1,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,0,0,0],[1,1,1,1,1]], k = 3", output: "[2,0,3]" },
    ],
    why: "Heap with compound keys. The heap stores (soldier_count, row_index). For 'k weakest' (smallest), use max-heap of size k (negate count). Tuple comparison handles tie-breaker automatically: heapq compares first element, then second.",
    starterCode: "import heapq\n\ndef k_weakest_rows(mat, k):\n    pass",
    hints: [
      "Count soldiers per row: sum(row) or binary search for first 0.",
      "For 'k weakest' = smallest counts: use max-heap of size k. Push (-count, -index) or (count, index) with size-k logic inverted.",
      "Alternative: heap of all rows, pop k smallest. O(n log n) vs O(n log k)."
    ],
    solution: "import heapq\n\ndef k_weakest_rows(mat, k):\n    heap = []\n    for i, row in enumerate(mat):\n        soldiers = sum(row)\n        heapq.heappush(heap, (-soldiers, -i))\n        if len(heap) > k:\n            heapq.heappop(heap)\n    result = []\n    while heap:\n        _, neg_i = heapq.heappop(heap)\n        result.append(-neg_i)\n    return result[::-1]",
    walkthrough: "Max-heap of size k for 'k weakest' (smallest counts). Push (-count, -index): the most negative = most soldiers = strongest (gets popped when heap overflows). The k remaining have smallest counts, and within ties, larger original index = more negative in heap, so popping gives larger indices first. We reverse at the end for ascending index order. For mat rows: row0=2, row1=4, row2=1, row3=2, row4=5. k=3: keep heap size 3. After all: heap has smallest 3 counts. Popping gives 3,0,2 in some order; reverse for [2,0,3].",
    testCode: "mat = [[1,1,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,0,0,0],[1,1,1,1,1]]\nr = k_weakest_rows(mat, 3)\nassert r == [2,0,3]\nmat2 = [[1,0,0,0],[1,1,1,0],[1,0,0,0]]\nassert k_weakest_rows(mat2, 2) == [0,2]\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 5, title: "Furthest Building You Can Reach", pattern: "greedy + heap", skill: "heap tracks largest climbs, ladders handle worst",
    statement: "Given building heights and bricks+ladders, you can climb a building if next height <= current (no cost), or use (height[i+1] - height[i]) bricks, or 1 ladder. Ladders handle any climb. Return the furthest building index reachable. Use a min-heap for largest climbs that ladders handle.",
    examples: [
      { input: "heights = [4,2,7,6,9,14,12], bricks = 5, ladders = 1", output: "4", explain: "climb 5+3+5+2; ladder handles biggest climb; bricks handle rest" },
    ],
    why: "Greedy with heap backtracking. Use ladders for the LARGEST climbs. Process climbs with a min-heap: allocate bricks first. When bricks run out, replace the largest brick-cost climb with a ladder (free up bricks). This is 'reserve ladders for the worst.'",
    starterCode: "import heapq\n\ndef furthest_building(heights, bricks, ladders):\n    pass",
    hints: [
      "For each step i: compute climb = heights[i+1] - heights[i]. If climb <= 0, advance for free.",
      "If climb > 0: push climb to min-heap representing bricks used. Use bricks to pay.",
      "If bricks < 0: we overspent. Pop the LARGEST climb from heap (via heapq.heappop on negated values, or track max separately), replace with a ladder (add back those bricks). If no ladders left, return i."
    ],
    solution: "import heapq\n\ndef furthest_building(heights, bricks, ladders):\n    heap = []\n    for i in range(len(heights) - 1):\n        diff = heights[i + 1] - heights[i]\n        if diff <= 0:\n            continue\n        heapq.heappush(heap, diff)\n        bricks -= diff\n        if bricks < 0:\n            if ladders > 0:\n                largest = heapq.heappop(heap)\n                bricks += largest\n                ladders -= 1\n            else:\n                return i\n    return len(heights) - 1",
    walkthrough: "Climb 5 at step 0-1: push 5, bricks=-5 (had 5, now 0). Climb 3 at step 1-2: push 3, bricks=-3. Bricks < 0, ladders=1: pop largest (5), bricks+=5 → 2, ladders=0. Now bricks cover the 3-climb. Climb 5 at step 2-3: push 5, bricks=-3. Bricks < 0, ladders=0: return i=2? No — there are more steps. Let me retrace: [4,2,7,6,9,14,12], bricks=5, ladders=1. Step 0→1: 2-4=-2≤0, skip. Step 1→2: 7-2=5, push 5, bricks=0. Step 2→3: 6-7=-1≤0, skip. Step 3→4: 9-6=3, push 3, bricks=-3. Bricks<0, ladders>0: pop 5, bricks+=5=2, ladders=0. Step 4→5: 14-9=5, push 5, bricks=-3. Bricks<0, ladders=0: return 4. Reachable index = 4. The heap tracks climbs paid with bricks. When bricks run out, sacrifice the largest brick-paid climb for a ladder refund. This greedy choice is optimal: ladders should always cover the largest climbs.",
    testCode: "assert furthest_building([4,2,7,6,9,14,12], 5, 1) == 4\nassert furthest_building([4,12,2,7,3,18,20,3,19], 10, 2) == 7\nassert furthest_building([14,3,19,3], 17, 0) == 3\nprint('All tests passed!')"
  },
  // ═══ STAGE 6: Mastery ═══
  {
    id: 43, stage: 6, title: "Merge K Sorted Lists — Heap of Iterators", pattern: "k-way merge", skill: "min-heap of (value, list_index, element_index)",
    statement: "Given k sorted lists, merge them into one sorted list. Use a min-heap initialized with the first element of each list. Repeatedly pop the smallest, add to result, and push the next element from that list. O(N log k) where N = total elements.",
    examples: [
      { input: "lists = [[1,4,5],[1,3,4],[2,6]]", output: "[1,1,2,3,4,4,5,6]" },
      { input: "lists = [[],[1]]", output: "[1]" },
    ],
    why: "K-way merge is the canonical heap pattern for merging. Naively concatenating and sorting is O(N log N). The heap gives O(N log k). When k << N, this is a significant win. The heap always knows which list has the current smallest element.",
    starterCode: "import heapq\n\ndef merge_k_sorted(lists):\n    pass",
    hints: [
      "Heap stores (value, list_index, element_index). Push first element of each non-empty list.",
      "While heap: pop smallest, append value to result. If there's a next element in that list, push it.",
      "Use list_index to find the next element in the source list."
    ],
    solution: "import heapq\n\ndef merge_k_sorted(lists):\n    heap = []\n    for i, lst in enumerate(lists):\n        if lst:\n            heapq.heappush(heap, (lst[0], i, 0))\n    result = []\n    while heap:\n        val, list_idx, elem_idx = heapq.heappop(heap)\n        result.append(val)\n        if elem_idx + 1 < len(lists[list_idx]):\n            nxt = lists[list_idx][elem_idx + 1]\n            heapq.heappush(heap, (nxt, list_idx, elem_idx + 1))\n    return result",
    walkthrough: "Heap tracks the frontier — the smallest unprocessed element from each list. Initially: (1,0,0) from list0, (1,1,0) from list1, (2,2,0) from list2. Heap=[(1,0,0),(1,1,0),(2,2,0)]. Pop 1 from list0, push next from list0: 4 → heap[(1,1,0),(2,2,0),(4,0,1)]. Pop 1 from list1, push 3 → heap[(2,2,0),(3,1,1),(4,0,1)]. Pop 2 from list2, push 6 → heap[(3,1,1),(4,0,1),(6,2,1)]. And so on. Heap size never exceeds k. Total pushes = N. Each push/pop = O(log k). Total = O(N log k).",
    testCode: "assert merge_k_sorted([[1,4,5],[1,3,4],[2,6]]) == [1,1,2,3,4,4,5,6]\nassert merge_k_sorted([[],[1]]) == [1]\nassert merge_k_sorted([]) == []\nassert merge_k_sorted([[1],[2],[3]]) == [1,2,3]\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 6, title: "Find Median from Data Stream — Two Heaps", pattern: "two heaps", skill: "max-heap for lower half, min-heap for upper half",
    statement: "Implement a MedianFinder class that supports add_num(num) and find_median(). Use two heaps: a max-heap for the lower half of numbers and a min-heap for the upper half. Keep them balanced (size difference <= 1). Median is the root of the larger heap (or average of both roots).",
    examples: [
      { input: "add(1),add(2)→median=1.5; add(3)→median=2", output: "1.5 then 2" },
    ],
    why: "Two heaps solve the streaming median problem. The max-heap (small half) tracks the largest of the smaller numbers. The min-heap (large half) tracks the smallest of the larger numbers. Together their roots bracket the median. Each add is O(log n).",
    starterCode: "import heapq\n\nclass MedianFinder:\n    def __init__(self):\n        pass\n    def add_num(self, num):\n        pass\n    def find_median(self):\n        pass",
    hints: [
      "small = max-heap (negate values), large = min-heap. Invariant: every element in small <= every element in large.",
      "add: push to small first (negate), then move small's max to large. If large > small, move large's min to small.",
      "Median: if small == large: avg of max(small) and min(large). If small > large: max(small)."
    ],
    solution: "import heapq\n\nclass MedianFinder:\n    def __init__(self):\n        self.small = []\n        self.large = []\n    def add_num(self, num):\n        heapq.heappush(self.small, -num)\n        heapq.heappush(self.large, -heapq.heappop(self.small))\n        if len(self.large) > len(self.small):\n            heapq.heappush(self.small, -heapq.heappop(self.large))\n    def find_median(self):\n        if len(self.small) > len(self.large):\n            return float(-self.small[0])\n        return (-self.small[0] + self.large[0]) / 2.0",
    walkthrough: "Two-heap balancing: new element always goes through small first. Then small's max (largest of lower half) moves to large. If large now exceeds small, large's min (smallest of upper half) moves back to small. Net effect: if the new element belongs in the lower half, it stays in small. If it belongs in the upper half, it cycles through to large. The heaps stay balanced (same size or small has one extra). Median: odd → root of small (the middle element). Even → average of small's max and large's min (the two middle elements).",
    testCode: "mf = MedianFinder()\nmf.add_num(1)\nmf.add_num(2)\nassert mf.find_median() == 1.5\nmf.add_num(3)\nassert mf.find_median() == 2.0\nmf2 = MedianFinder()\nmf2.add_num(-1)\nassert mf2.find_median() == -1.0\nmf2.add_num(-2)\nassert mf2.find_median() == -1.5\nmf2.add_num(-3)\nassert mf2.find_median() == -2.0\nprint('All tests passed!')"
  },
  {
    id: 45, stage: 6, title: "Top K Frequent Elements — Count + Heap", pattern: "frequency + heap", skill: "count with dict, top-k with size-k min-heap",
    statement: "Given an array and k, return the k most frequent elements. Use a hashmap to count frequencies, then a size-k min-heap (keyed by frequency) to find the top k. Return the elements in any order. O(n log k).",
    examples: [
      { input: "nums = [1,1,1,2,2,3], k = 2", output: "[1,2]", explain: "1 appears 3 times, 2 appears 2 times" },
      { input: "nums = [1], k = 1", output: "[1]" },
    ],
    why: "Decompose into two known patterns: counting (hashmap, O(n)) and top-k finding (size-k heap, O(n log k)). Composition of a hashmap and a heap. The heap compares by frequency, stores elements.",
    starterCode: "import heapq\nfrom collections import Counter\n\ndef top_k_frequent(nums, k):\n    pass",
    hints: [
      "Count frequencies with Counter (or dict). O(n).",
      "Min-heap of size k: push (freq, num). If len > k, heappop. At end, heap has k most frequent.",
      "Heap elements are (freq, num). freq is the sort key. Min-heap keeps k highest freqs."
    ],
    solution: "import heapq\nfrom collections import Counter\n\ndef top_k_frequent(nums, k):\n    count = Counter(nums)\n    heap = []\n    for num, freq in count.items():\n        heapq.heappush(heap, (freq, num))\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return [num for _, num in heap]",
    walkthrough: "Hashmap with O(n). Then filter through a size-k min-heap. The heap's root is the smallest frequency among the current top k. When a new (freq, num) arrives with higher frequency than heap[0][0], it pushes in and the smallest-frequency element pops out. At the end, the heap holds the k elements with highest frequencies. Return just the elements (discard frequencies).",
    testCode: "r = sorted(top_k_frequent([1,1,1,2,2,3], 2))\nassert r == [1,2]\nassert top_k_frequent([1], 1) == [1]\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Task Scheduler — Greedy + Heap", pattern: "scheduling + heap", skill: "max-heap by frequency, cool-down simulation",
    statement: "Given tasks (A-Z) and cool-down n, same task must be separated by n intervals. Each interval executes one task or is idle. Return the minimum intervals needed. Use a max-heap by frequency and a queue for cool-down.",
    examples: [
      { input: "tasks = ['A','A','A','B','B','B'], n = 2", output: "8", explain: "A,B,idle,A,B,idle,A,B" },
      { input: "tasks = ['A','A','A','B','B','B'], n = 0", output: "6", explain: "no cooldown, just execute all" },
    ],
    why: "Heap + queue bridge. The heap picks the most frequent available task (greedy). A queue holds tasks in cooldown with their re-insertion time. This pattern appears in OS schedulers, rate limiters, and interval-based processing.",
    starterCode: "import heapq\nfrom collections import Counter, deque\n\ndef least_interval(tasks, n):\n    pass",
    hints: [
      "Count frequencies. Max-heap: push (-freq) for each unique task.",
      "Queue holds (next_available_time, -freq). Track current time.",
      "Each unit of time: if heap has tasks, pop largest freq, decrement, if >0 push to queue with time=time+n+1. If queue front is ready, push back to heap."
    ],
    solution: "import heapq\nfrom collections import Counter, deque\n\ndef least_interval(tasks, n):\n    count = Counter(tasks)\n    heap = [-f for f in count.values()]\n    heapq.heapify(heap)\n    queue = deque()\n    time = 0\n    while heap or queue:\n        time += 1\n        if heap:\n            freq = -heapq.heappop(heap)\n            if freq > 1:\n                queue.append((time + n, freq - 1))\n        if queue and queue[0][0] <= time:\n            _, freq = queue.popleft()\n            heapq.heappush(heap, -freq)\n    return time",
    walkthrough: "At each time unit: (1) If heap has tasks, pop the most frequent one, execute it, decrement, and if copies remain, enqueue it with cooldown expiry = time + n + 1. (2) After executing (or idling), check if any task's cooldown has expired — push it back to heap. If both heap and queue are empty, all tasks done. For A×3,B×3, n=2: heap=[-3,-3]. t=1: pop A(3→2 exec), queue it to t=4. t=2: pop B(3→2), queue to t=5. t=3: heap empty, idle. t=4: heap gets A(2) from queue, pop A(1), queue to t=7. t=5: heap gets B(2), pop B(1), queue to t=8. t=6: idle. t=7: pop A(1→0), done. t=8: pop B(1→0), done. Total=8.",
    testCode: "assert least_interval(['A','A','A','B','B','B'], 2) == 8\nassert least_interval(['A','A','A','B','B','B'], 0) == 6\nassert least_interval(['A','A','A','A','A','A','B','C','D','E','F','G'], 2) == 16\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Reorganize String — Greedy + Heap", pattern: "scheduling + heap", skill: "place most frequent character first, cooldown=1",
    statement: "Rearrange a string so no two adjacent characters are the same. Return any valid rearrangement, or empty string if impossible. Use a max-heap by frequency: pop two at a time, append them alternatingly, decrement and push back if remaining.",
    examples: [
      { input: "s = 'aab'", output: "'aba'" },
      { input: "s = 'aaab'", output: "''", explain: "3 a's, 1 b — impossible, a's would touch" },
    ],
    why: "This is task scheduler with n=0 but a 'no self-adjacency' constraint. The heap picks the two most frequent characters to interleave. Popping two at a time ensures they alternate. If only the most frequent remains and it can't be placed without adjacency, impossible.",
    starterCode: "import heapq\nfrom collections import Counter\n\ndef reorganize_string(s):\n    pass",
    hints: [
      "Count frequencies. Max-heap: push (-freq, char).",
      "While len(heap) >= 2: pop two most frequent, append both to result. Decrement each, push back if freq > 0.",
      "If one remains: if freq > 1, impossible (return ''). Else append it."
    ],
    solution: "import heapq\nfrom collections import Counter\n\ndef reorganize_string(s):\n    count = Counter(s)\n    heap = [(-freq, ch) for ch, freq in count.items()]\n    heapq.heapify(heap)\n    result = []\n    while len(heap) >= 2:\n        f1, c1 = heapq.heappop(heap)\n        f2, c2 = heapq.heappop(heap)\n        result.append(c1)\n        result.append(c2)\n        if f1 + 1 < 0:\n            heapq.heappush(heap, (f1 + 1, c1))\n        if f2 + 1 < 0:\n            heapq.heappush(heap, (f2 + 1, c2))\n    if heap:\n        freq, ch = heap[0]\n        if -freq > 1:\n            return ''\n        result.append(ch)\n    return ''.join(result)",
    walkthrough: "Max-heap by frequency. Each iteration: pop the two most frequent characters, place them as a pair. This guarantees they alternate. Reinsert if they still have remaining count. At the end, if one character remains with count 1, it can be appended (the last character has no neighbor to conflict with). If count > 1, it would have to appear adjacent to itself — impossible. For 'aab': heap=[(-2,'a'),(-1,'b')]. Pop a,b → result='ab', push back a(-1). heap has [(-1,'a')]. Single char with freq=1, append → 'aba'. For 'aaab': heap=[(-3,'a'),(-1,'b')]. Pop a,b → 'ab', push a(-2). Pop a only (only 1 in heap). Since freq=2>1, impossible → ''.",
    testCode: "assert reorganize_string('aab') == 'aba'\nassert reorganize_string('aaab') == ''\nassert reorganize_string('vvvlo') == 'vlvov'\nassert reorganize_string('') == ''\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Sliding Window Median — Two Heaps + Removal", pattern: "two heaps + lazy deletion", skill: "maintain median in sliding window with lazy removal",
    statement: "Given an array nums and window size k, return the median of each sliding window. Use two heaps (max-heap for lower half, min-heap for upper half). When the window slides, lazily mark removed elements and rebalance. Return an array of medians.",
    examples: [
      { input: "nums = [1,3,-1,-3,5,3,6,7], k = 3", output: "[1.0,-1.0,-1.0,3.0,5.0,6.0]" },
    ],
    why: "Two-heap sliding window is the ultimate heap composition problem. You need: (1) two-heap median, (2) efficient removal of arbitrary elements from a heap. Lazy deletion (hashmap of counts to remove) defers actual removal until the element reaches the heap top. The heap always tells the truth at its root.",
    starterCode: "import heapq\nfrom collections import defaultdict\n\ndef median_sliding_window(nums, k):\n    pass",
    hints: [
      "Two heaps: small (max-heap, negate) for lower half, large (min-heap) for upper half. Lazy deletion dict tracks elements to remove.",
      "Balance heaps: keep len(small) >= len(large). Remove stale tops before comparing.",
      "When window slides: put the outgoing element in the lazy deletion dict for its heap. Add new element normally. Rebalance after pruning stale tops."
    ],
    solution: "import heapq\nfrom collections import defaultdict\n\ndef median_sliding_window(nums, k):\n    small, large = [], []\n    small_del, large_del = defaultdict(int), defaultdict(int)\n    small_size, large_size = [0], [0]\n    def prune():\n        while small and small_del.get(-small[0], 0) > 0:\n            val = -heapq.heappop(small)\n            small_del[val] -= 1\n            small_size[0] -= 1\n        while large and large_del.get(large[0], 0) > 0:\n            val = heapq.heappop(large)\n            large_del[val] -= 1\n            large_size[0] -= 1\n    def balance():\n        prune()\n        while small_size[0] < large_size[0]:\n            v = heapq.heappop(large)\n            heapq.heappush(small, -v)\n            small_size[0] += 1\n            large_size[0] -= 1\n            prune()\n        while small_size[0] > large_size[0] + 1:\n            v = -heapq.heappop(small)\n            heapq.heappush(large, v)\n            small_size[0] -= 1\n            large_size[0] += 1\n            prune()\n    for i in range(k):\n        heapq.heappush(small, -nums[i])\n        small_size[0] += 1\n    balance()\n    result = []\n    result.append(-small[0] if k % 2 == 1 else (-small[0] + large[0]) / 2.0)\n    for i in range(k, len(nums)):\n        outgoing = nums[i - k]\n        if small and outgoing <= -small[0]:\n            small_del[outgoing] += 1\n            small_size[0] -= 1\n        else:\n            large_del[outgoing] += 1\n            large_size[0] -= 1\n        incoming = nums[i]\n        if small and incoming <= -small[0]:\n            heapq.heappush(small, -incoming)\n            small_size[0] += 1\n        else:\n            heapq.heappush(large, incoming)\n            large_size[0] += 1\n        balance()\n        result.append(-small[0] if k % 2 == 1 else (-small[0] + large[0]) / 2.0)\n    return result",
    walkthrough: "Two-heap median + lazy deletion for sliding window removal. Lazy deletion: when an element exits the window, don't search the heap for it — just increment its deletion count. When that element reaches the heap top (during normal peek/pop), it gets actually removed. This makes removal O(1) deferred cost, and only O(log n) when a stale top is encountered. The balance() function maintains the invariant: all small elements <= all large elements, and sizes differ by at most 1. For each window: remove outgoing (lazy), add incoming, balance, compute median. Total: O(n log k).",
    testCode: "r = median_sliding_window([1,3,-1,-3,5,3,6,7], 3)\nexpected = [1.0,-1.0,-1.0,3.0,5.0,6.0]\nfor a, b in zip(r, expected):\n    assert abs(a - b) < 0.001\nr2 = median_sliding_window([1,2,3,4,2,3,1,4,2], 3)\nassert len(r2) == 7\nprint('All tests passed!')"
  },
  // +++ STAGE 6 new +++
  {
    id: 49, stage: 6, title: "Smallest Range Covering Elements from K Lists", pattern: "k-way merge + sliding window", skill: "min-heap tracks current minimum across k lists, maximize coverage",
    statement: "Given k sorted lists of integers, find the smallest range [a, b] that includes at least one number from each list. Use a min-heap initialized with the first element of each list. Track current_max across the heap. At each step, pop the smallest (update a), compute range [a, current_max], then push the next element from the popped list.",
    examples: [
      { input: "lists = [[4,10,15,24,26],[0,9,12,20],[5,18,22,30]]", output: "[20,24]", explain: "range [20,24] contains 24 from list0, 20 from list1, 22 from list2 — covers all 3 lists" },
    ],
    why: "K-way merge meets sliding window. The min-heap tracks the current candidate 'a' (smallest value across active list pointers). cur_max is 'b'. The range [a,b] covers all k lists. By advancing the list that produced 'a', you shrink/expand the window. This pattern bridges heap-merge with two-pointer sliding-window techniques.",
    starterCode: "import heapq\n\ndef smallest_range(lists):\n    pass",
    hints: [
      "Initialize heap with (lists[i][0], i, 0) for each list i. Track cur_max = max of these first elements.",
      "Track best_range = [heap[0][0], cur_max]. While True: pop smallest, update best_range if current range is tighter.",
      "If the popped element was the LAST in its list, break (can't cover all lists anymore). Otherwise push next element from that list, update cur_max if needed."
    ],
    solution: "import heapq\n\ndef smallest_range(lists):\n    heap = []\n    cur_max = float('-inf')\n    for i, lst in enumerate(lists):\n        if lst:\n            heapq.heappush(heap, (lst[0], i, 0))\n            cur_max = max(cur_max, lst[0])\n    best_range = [heap[0][0], cur_max]\n    while heap:\n        val, list_idx, elem_idx = heapq.heappop(heap)\n        if cur_max - val < best_range[1] - best_range[0]:\n            best_range = [val, cur_max]\n        if elem_idx + 1 >= len(lists[list_idx]):\n            break\n        nxt = lists[list_idx][elem_idx + 1]\n        cur_max = max(cur_max, nxt)\n        heapq.heappush(heap, (nxt, list_idx, elem_idx + 1))\n    return best_range",
    walkthrough: "Heap tracks one element from each list (the frontier). cur_max is the largest value in the heap. Range [min_in_heap, cur_max] covers all k lists. Pop the minimum to try shrinking the range. Advance in that list — this may increase cur_max but also increases the minimum, potentially tightening the range. When any list is exhausted, we can no longer cover all k lists. For the example: start [0,5] with heap=[(0,1,0),(4,0,0),(5,2,0)], cur_max=5. Pop 0, range=5, push 9, cur_max=9. Heap=[4,5,9], range=[4,9]. Continue... Eventually range=[20,24] is tightest. Every pop/push is O(log k). Total O(N log k).",
    testCode: "r = smallest_range([[4,10,15,24,26],[0,9,12,20],[5,18,22,30]])\nassert r == [20,24]\nr2 = smallest_range([[1,2,3],[1,2,3],[1,2,3]])\nassert r2 == [1,1]\nr3 = smallest_range([[10],[11]])\nassert r3 == [10,11]\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Maximum Frequency Stack", pattern: "frequency + stack + heap", skill: "max-heap on (freq, push_order, value) for most-frequent-most-recent",
    statement: "Implement FreqStack with push(val) and pop(). pop() returns the most frequent element. Ties broken by most recently pushed. Use a max-heap keyed by (frequency, push_index, value) with a dict tracking current frequencies.",
    examples: [
      { input: "push 5,7,5,7,4,5; then pop()×4", output: "[5,7,5,4]", explain: "freq: 5→3, 7→2, 4→1. pop→5 (highest freq+recent); pop→7; pop→5; pop→4" },
    ],
    why: "Heap + frequency counter + insertion-order tiebreaker. The heap key tuple (frequency, insertion_order, value) sorts by first key, then second — so within equal frequencies, higher insertion order (more recent) wins. Python's heap compares tuples element by element. This pattern: use a heap with a compound key for multi-criteria priority.",
    starterCode: "import heapq\nfrom collections import defaultdict\n\nclass FreqStack:\n    def __init__(self):\n        pass\n    def push(self, val):\n        pass\n    def pop(self):\n        pass",
    hints: [
      "__init__: self.heap = [] (max-heap via negation), self.freq = defaultdict(int), self.order = 0.",
      "push: increment freq[val]. Push (-freq, -order, val) to heap. Increment order.",
      "pop: pop from heap (returns most-frequent, most-recent). Decrement freq[val]. Return val."
    ],
    solution: "import heapq\nfrom collections import defaultdict\n\nclass FreqStack:\n    def __init__(self):\n        self.heap = []\n        self.freq = defaultdict(int)\n        self.order = 0\n    def push(self, val):\n        self.freq[val] += 1\n        self.order += 1\n        heapq.heappush(self.heap, (-self.freq[val], -self.order, val))\n    def pop(self):\n        freq, order, val = heapq.heappop(self.heap)\n        self.freq[val] -= 1\n        return val",
    walkthrough: "Max-heap via negation of both freq and order. Push 5: freq[5]=1, order=1, push(-1,-1,5). Push 7: freq[7]=1, order=2, push(-1,-2,7). Push 5: freq[5]=2, order=3, push(-2,-3,5). Push 7: freq[7]=2, order=4, push(-2,-4,7). Push 4: freq[4]=1, order=5, push(-1,-5,4). Push 5: freq[5]=3, order=6, push(-3,-6,5). Heap pops: (-3,-6,5)→5, (-2,-4,7)→7, (-2,-3,5)→5, (-1,-5,4)→4. The freq dict is decremented on pop — future pushes of the same value build from current freq. The heap naturally keeps the most-frequent-most-recent at top.",
    testCode: "fs = FreqStack()\nfs.push(5)\nfs.push(7)\nfs.push(5)\nfs.push(7)\nfs.push(4)\nfs.push(5)\nassert fs.pop() == 5\nassert fs.pop() == 7\nassert fs.pop() == 5\nassert fs.pop() == 4\nfs2 = FreqStack()\nfs2.push(1)\nfs2.push(1)\nassert fs2.pop() == 1\nassert fs2.pop() == 1\nprint('All tests passed!')"
  },
]

export const buildHeapCode = `
import heapq

def is_min_heap(arr):
    n = len(arr)
    for i in range(n // 2):
        left = 2 * i + 1
        right = 2 * i + 2
        if left < n and arr[i] > arr[left]:
            return False
        if right < n and arr[i] > arr[right]:
            return False
    return True
`
