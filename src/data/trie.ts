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

export const STAGES_TRIE = [
  { id: 0, name: "Compression Reflex", desc: "prefix sharing" },
  { id: 1, name: "Node = Map + Flag", desc: "children + terminal" },
  { id: 2, name: "Insert & Search", desc: "walk and build" },
  { id: 3, name: "The Payload", desc: "counts at nodes" },
  { id: 4, name: "Naive", desc: "scan list" },
  { id: 5, name: "Optimization", desc: "descend once" },
  { id: 6, name: "Mastery", desc: "bridge problems" },
]

export const PROBLEMS_TRIE: Problem[] = [
  // ═══ STAGE 0: Compression Reflex ═══
  {
    id: 1, stage: 0, title: "Count Shared Prefix Letters", pattern: "prefix sharing", skill: "compare two words character by character",
    statement: "Given two words word1 and word2, return the number of leading characters they share. For example, 'apple' and 'apply' share 4 letters ('a','p','p','l').",
    examples: [
      { input: "word1 = 'apple', word2 = 'apply'", output: "4" },
      { input: "word1 = 'cat', word2 = 'car'", output: "2" },
      { input: "word1 = 'dog', word2 = 'cat'", output: "0" },
    ],
    why: "Prefix sharing is the core insight that motivates a trie. When words share a prefix, we can store that prefix once and branch only where words diverge. This problem plants the seed — how much do two words overlap?",
    starterCode: "def shared_prefix(w1, w2):\n    pass",
    hints: [
      "Use a loop that runs while i < min(len(w1), len(w2)) and w1[i] == w2[i].",
      "Keep a counter that increments each time characters match.",
      "Stop on the first mismatch. Return the count of matching characters."
    ],
    solution: "def shared_prefix(w1, w2):\n    count = 0\n    for i in range(min(len(w1), len(w2))):\n        if w1[i] == w2[i]:\n            count += 1\n        else:\n            break\n    return count",
    walkthrough: "Walk both words side by side. Compare w1[0] with w2[0], w1[1] with w2[1], and so on. As soon as characters differ, stop — everything after diverges too. The count of matches IS the shared prefix length.",
    testCode: "assert shared_prefix('apple', 'apply') == 4\nassert shared_prefix('cat', 'car') == 2\nassert shared_prefix('dog', 'cat') == 0\nassert shared_prefix('abc', 'abc') == 3\nassert shared_prefix('a', 'ab') == 1\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Find Common Prefix of Word List", pattern: "prefix sharing", skill: "scan all words, shrink prefix",
    statement: "Given a list of words, return the longest common prefix shared by ALL words. If none, return empty string. Do this WITHOUT building a trie.",
    examples: [
      { input: "words = ['flower', 'flow', 'flight']", output: "'fl'" },
      { input: "words = ['dog', 'racecar', 'car']", output: "''" },
      { input: "words = ['interspecies', 'interstellar', 'interstate']", output: "'inters'" },
    ],
    why: "Common prefix across an entire list is an extreme case of P1's idea. Start with the first word as your candidate prefix. Shrink it against each subsequent word. This is the problem a trie will later solve in a single descent.",
    starterCode: "def common_prefix(words):\n    pass",
    hints: [
      "Start with the first word as your candidate prefix.",
      "For each subsequent word, shorten the candidate to the shared prefix with that word.",
      "If the candidate ever becomes empty, return '' — no common prefix exists."
    ],
    solution: "def common_prefix(words):\n    if not words:\n        return ''\n    prefix = words[0]\n    for w in words[1:]:\n        i = 0\n        while i < len(prefix) and i < len(w) and prefix[i] == w[i]:\n            i += 1\n        prefix = prefix[:i]\n        if not prefix:\n            return ''\n    return prefix",
    walkthrough: "Prefix acts as a shrinking lens. Start with the full first word. Against each new word, slide a pointer until characters mismatch, then trim the prefix to that index. Each word can only shrink it, never grow it. An empty prefix means no common ground — the empty string is the shared ancestor of all words.",
    testCode: "assert common_prefix(['flower','flow','flight']) == 'fl'\nassert common_prefix(['dog','racecar','car']) == ''\nassert common_prefix(['interspecies','interstellar','interstate']) == 'inters'\nassert common_prefix(['a']) == 'a'\nassert common_prefix(['aa','aa']) == 'aa'\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Naive Word List Search", pattern: "prefix sharing", skill: "scan every word, count comparisons",
    statement: "Given a word list and a query, return True if the query is in the list. Count and return the number of character comparisons made. Show the inefficiency — scanning every word character by character.",
    examples: [
      { input: "words = ['apple','apply','apricot','banana'], query = 'apricot'", output: "(True, 18)", explain: "scanned 'a','p','p','l','e' (5), then 'a','p','p','l','y' (5), then 'a','p','r','i','c','o','t' (7) — matched after 5+5+2=12 but prefix overlap wasted comparisons" },
    ],
    why: "With n words of length m, a naive search checks up to n*m characters. The shared prefix 'app' in 'apple' and 'apply' gets checked twice. A trie eliminates this redundancy — each prefix character is checked exactly once per search.",
    starterCode: "def search_words(words, query):\n    pass",
    hints: [
      "For each word in the list, compare character by character with the query.",
      "Count every character comparison. Stop early if a mismatch or full match is found.",
      "Return (found, comparisons). The inefficiency is in the redundant prefix checks."
    ],
    solution: "def search_words(words, query):\n    comparisons = 0\n    for w in words:\n        i = 0\n        while i < len(w) and i < len(query):\n            comparisons += 1\n            if w[i] != query[i]:\n                break\n            i += 1\n        if i == len(w) == len(query):\n            return (True, comparisons)\n    return (False, comparisons)",
    walkthrough: "For each word, compare letters one by one with the query. Track total comparisons. The waste is visible: 'apple' checks a-p-p-l then fails on 'l' vs 'r', then 'apply' rechecks a-p-p from scratch. A trie would check 'a' once at the root, 'p' once at the next node, and so on.",
    testCode: "found, comps = search_words(['apple','apply','apricot','banana'], 'apricot')\nassert found == True\nassert comps > 0\nfound, comps = search_words(['apple','apply','apricot','banana'], 'zzz')\nassert found == False\nassert comps > 0\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Group Words by First Letter", pattern: "prefix sharing", skill: "dictionary of lists by first char",
    statement: "Given a list of words, group them by their first letter. Return a dictionary mapping first letter to list of remaining suffixes (the word minus the first letter). This is a one-level trie.",
    examples: [
      { input: "words = ['apple','ant','banana','bat','cat']", output: "{'a': ['pple','nt'], 'b': ['anana','at'], 'c': ['at']}" },
    ],
    why: "This IS a one-level trie. Each key in the dictionary is a trie node. Each suffix list is the remaining path. The insight: we can do this recursively — grouping by the first unreconciled letter at each level — to build the full trie.",
    starterCode: "def group_by_first(words):\n    pass",
    hints: [
      "Initialize an empty default dict of lists. For each word, slice off the first character.",
      "Use word[0] as key, append word[1:] to the list.",
      "If word[1:] is '', append '' to the list. An empty suffix marks a terminal word boundary."
    ],
    solution: "def group_by_first(words):\n    groups = {}\n    for w in words:\n        key = w[0]\n        suffix = w[1:]\n        if key not in groups:\n            groups[key] = []\n        groups[key].append(suffix if suffix else '/')\n    return groups",
    walkthrough: "Each first letter becomes a bucket. The remaining suffix is what's left to organize. If we recursively group each bucket's suffixes by THEIR first letter, we build a trie. The empty suffix (shown as '/') marks where a word ends — this is the is_end flag in a trie node.",
    testCode: "g = group_by_first(['apple','ant','banana','bat','cat'])\nassert 'a' in g\nassert 'b' in g\nassert 'c' in g\nassert len(g['a']) == 2\nassert len(g['b']) == 2\nassert len(g['c']) == 1\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Count Prefix Redundancy", pattern: "prefix sharing", skill: "count wasted comparisons in word list",
    statement: "Given a word list, count how many character comparisons would be wasted if we searched for every word in the list (n searches, one per word) using naive scan. Compare to the ideal of one comparison per unique prefix edge.",
    examples: [
      { input: "words = ['aa','ab','ba']", output: "wasted = 2", explain: "naive: each word scans 2 comparisons against itself = 6 total. ideal: 2 unique edges shared. O(6) vs O(4)." },
    ],
    why: "This is the financial case for a trie. It quantifies the redundancy. For a dense dataset, redundancy explodes. The trie collapses all shared prefixes into shared edges — the savings is combinatorial.",
    starterCode: "def prefix_redundancy(words):\n    pass",
    hints: [
      "Naive cost: each word compared with itself = sum of all word lengths. Simulate: for each word w, if we prefix-matched against all previous words, how many comparisons get repeated?",
      "A simpler approach: ideal cost = total unique prefix edges across all words (count distinct (i, ch) pairs). Naive cost = sum of word lengths.",
      "Return naive_cost - ideal_cost. The ideal is the count of character-position pairs where that character first appears at that position across all words."
    ],
    solution: "def prefix_redundancy(words):\n    naive = sum(len(w) for w in words)\n    seen = set()\n    for w in words:\n        for i, ch in enumerate(w):\n            seen.add((i, ch))\n    ideal = len(seen)\n    return naive - ideal",
    walkthrough: "Naive cost: every character of every word checked every time. Ideal cost: each unique (position, character) pair stored once. For ['aa','ab']: naive = 4, ideal = { (0,'a'), (1,'a'), (1,'b') } = 3. Waste = 1 comparison. The trie stores exactly the ideal representation.",
    testCode: "assert prefix_redundancy(['aa','ab','ba']) == 2\nassert prefix_redundancy(['a','a','a']) == 2\nassert prefix_redundancy(['abc']) == 0\nprint('All tests passed!')"
  },
  // +++ STAGE 0 new +++
  {
    id: 6, stage: 0, title: "Is One Word a Prefix of Another?", pattern: "prefix sharing", skill: "detect prefix relationship between two words",
    statement: "Given two words a and b, return the shorter word if one is a prefix of the other. If neither is a prefix, return an empty string. 'app' is a prefix of 'apple' → return 'app'. If identical, return either word.",
    examples: [
      { input: "a = 'app', b = 'apple'", output: "'app'", explain: "'app' is a prefix of 'apple' — return shorter word" },
      { input: "a = 'cat', b = 'car'", output: "''", explain: "differ at index 1 — neither is a prefix" },
      { input: "a = 'hello', b = 'hello'", output: "'hello'", explain: "identical — each is trivially a prefix of the other" },
    ],
    why: "The prefix-of relation is the atom of prefix sharing: one word sits inside the start of another. In a trie, this appears as a terminal node on the path to a deeper terminal — a short word nested inside a longer one. Recognizing this relationship prepares you to see the trie as a nesting structure.",
    starterCode: "def prefix_of(a, b):\n    pass",
    hints: [
      "Compare characters up to min(len(a), len(b)). If they all match, the shorter word is a prefix of the longer one.",
      "Python trick: a[:k] == b[:k] where k = min(len(a), len(b)). If equal and lengths differ, return the shorter.",
      "Edge case: identical words. Either qualifies — return either one. Empty string is a prefix of everything (return '')."
    ],
    solution: "def prefix_of(a, b):\n    if a == b:\n        return a\n    k = min(len(a), len(b))\n    if a[:k] == b[:k]:\n        return a if len(a) < len(b) else b\n    return ''",
    walkthrough: "Overlap the words at their shortest length. If a='carpet' and b='car': k=3. a[:3]='car', b[:3]='car' — match! 'car' is the shorter, so it's a prefix of 'carpet'. Return 'car'. If a='dog' and b='dot': k=3, 'dog' vs 'dot' mismatch at 'g' vs 't'. Return ''. The prefix relationship is directional: the shorter word must match the longer word's beginning entirely.",
    testCode: "assert prefix_of('app', 'apple') == 'app'\nassert prefix_of('apple', 'app') == 'app'\nassert prefix_of('cat', 'car') == ''\nassert prefix_of('hello', 'hello') == 'hello'\nassert prefix_of('a', '') == ''\nassert prefix_of('abc', 'abcd') == 'abc'\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 0, title: "Longest Shared Prefix Between Any Two Words", pattern: "prefix sharing", skill: "pairwise scan for maximum prefix overlap",
    statement: "Given a word list, find the length of the longest shared prefix between ANY two distinct words. Use O(n^2 * L) pairwise scan: compare every pair character-by-character. This is the naive 'best compression candidate' finder.",
    examples: [
      { input: "words = ['apple', 'apply', 'apricot', 'banana']", output: "4", explain: "'apple' and 'apply' share 'appl' → 4 characters" },
      { input: "words = ['cat', 'dog', 'fish']", output: "0", explain: "no pair shares any leading character" },
      { input: "words = ['interspecies', 'interstellar', 'interstate']", output: "5", explain: "any pair among these three shares 'inter' → 5" },
    ],
    why: "Before a trie can compress, you need to know WHERE the best overlap is. Naively finding the best overlap requires checking every pair — O(n^2 * L). The trie naturally clusters words by shared prefix during insertion: the deepest branching node IS the best overlap. This naive scan shows the pain of not having the structure.",
    starterCode: "def max_pairwise_prefix(words):\n    pass",
    hints: [
      "Double loop: for i in range(n), for j in range(i+1, n). Compare words[i] and words[j] character by character.",
      "For each pair, count matching leading characters until mismatch or end of either word.",
      "Track the maximum count across all pairs. Return it. For a single word or empty list, return 0."
    ],
    solution: "def max_pairwise_prefix(words):\n    n = len(words)\n    best = 0\n    for i in range(n):\n        for j in range(i + 1, n):\n            k = 0\n            while k < len(words[i]) and k < len(words[j]) and words[i][k] == words[j][k]:\n                k += 1\n            best = max(best, k)\n    return best",
    walkthrough: "Check every unordered pair exactly once. For ['apple', 'apply', 'apricot']: i=0,j=1 → 'apple' vs 'apply': a-p-p-l all match (4). i=0,j=2 → 'apple' vs 'apricot': a-p match, then l≠r (2). i=1,j=2 → 'apply' vs 'apricot': a-p match, p≠r (2). Best=4. Cost: n*(n-1)/2 pairs, each up to L comparisons → O(n^2 * L). A trie would reveal this as the deepest node with ≥2 children — no pairwise comparison needed.",
    testCode: "assert max_pairwise_prefix(['apple','apply','apricot','banana']) == 4\nassert max_pairwise_prefix(['cat','dog','fish']) == 0\nassert max_pairwise_prefix(['interspecies','interstellar','interstate']) == 5\nassert max_pairwise_prefix(['a','a','a']) == 1\nassert max_pairwise_prefix(['abc']) == 0\nprint('All tests passed!')"
  },
  // ═══ STAGE 1: Node = Map + Flag ═══
  {
    id: 8, stage: 1, title: "Create a TrieNode", pattern: "trie structure", skill: "define node with children dict and is_end flag",
    statement: "Design the TrieNode class. A node needs: (1) a dictionary mapping characters to child nodes — children, (2) a boolean flag is_end — True if a word ends at this node. Create the class and instantiate a root node.",
    examples: [
      { input: "no input — define TrieNode", output: "TrieNode with children={}, is_end=False" },
    ],
    why: "Every data structure starts with its atoms. A trie node is breathtakingly simple: a map of next-letter to next-node, and a yes/no flag for 'does a word end here?' This duality — map for navigation, flag for termination — powers everything.",
    starterCode: "class TrieNode:\n    def __init__(self):\n        pass",
    hints: [
      "Initialize self.children as an empty dictionary {}.",
      "Initialize self.is_end = False. This is the terminal flag.",
      "Create an instance: root = TrieNode(). Verify root.children == {} and root.is_end == False."
    ],
    solution: "class TrieNode:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False",
    walkthrough: "Two fields. children maps each next character to a child TrieNode. is_end answers: 'does some word in the trie stop exactly at this node?' Without is_end, 'app' inside 'apple' would be invisible — there'd be no way to know 'app' is its own word, not just a prefix.",
    testCode: "root = TrieNode()\nassert root.children == {}\nassert root.is_end == False\nchild = TrieNode()\nroot.children['a'] = child\nassert 'a' in root.children\nassert root.children['a'].is_end == False\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Understand the is_end Flag", pattern: "trie structure", skill: "differentiate word from prefix",
    statement: "A trie contains the words 'app' and 'apple'. Without the is_end flag, how do you know they're both valid words and not just 'apple'? Write a function has_word(trie_root, word) that checks a path exists AND the last node's is_end is True.",
    examples: [
      { input: "trie with 'app' and 'apple', word = 'app'", output: "True", explain: "'app' is a complete word, is_end=True" },
      { input: "trie with 'apple' only (no 'app'), word = 'app'", output: "False", explain: "'app' node exists as prefix but is_end=False" },
    ],
    why: "is_end IS the difference between 'the characters appear in the trie' and 'those characters form a word we stored.' Without it, a prefix equals a word. With it, they're distinct. This flag is the trie's memory of insertion.",
    starterCode: "def has_word(root, word):\n    pass",
    hints: [
      "Walk the trie following word's characters. If a character has no child, word doesn't exist.",
      "After walking all characters to reach the final node, check that node's is_end flag.",
      "Reaching the node is not enough — 'app' in a trie that only built 'apple' reaches a node, but is_end=False."
    ],
    solution: "def has_word(root, word):\n    node = root\n    for ch in word:\n        if ch not in node.children:\n            return False\n        node = node.children[ch]\n    return node.is_end",
    walkthrough: "Two checks. First: can we walk the entire word without hitting a dead end? If any character is missing from children, the path doesn't exist. Second: at the terminal node, is is_end True? This disambiguates 'prefix only' from 'full word.' 'app' requires both steps to pass.",
    testCode: "root = TrieNode()\nnode = root.children.setdefault('a', TrieNode())\nnode = node.children.setdefault('p', TrieNode())\nnode = node.children.setdefault('p', TrieNode())\nnode.is_end = True\nnode2 = node.children.setdefault('l', TrieNode())\nnode2 = node2.children.setdefault('e', TrieNode())\nnode2.is_end = True\nassert has_word(root, 'app') == True\nassert has_word(root, 'apple') == True\nassert has_word(root, 'ap') == False\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Insert 'app' — Build First Path", pattern: "trie insertion", skill: "create nodes along path, mark terminal",
    statement: "Write insert(root, word) that adds a word into the trie. Start with an empty root. Insert 'app'. Each character creates a node in children if it doesn't exist. After the last character, set is_end = True.",
    examples: [
      { input: "root = empty trie, insert 'app'", output: "root.children['a'].children['p'].children['p'].is_end == True" },
    ],
    why: "Insertion is the trie's constructor. You walk the word, creating missing children as you go. At the last character, you plant the flag. This is the operation that turns abstract nodes into a dictionary of words.",
    starterCode: "def insert(root, word):\n    pass",
    hints: [
      "Start at root. For each character ch in word: if ch not in node.children, create a new TrieNode and add it.",
      "Move node to node.children[ch] after each character.",
      "After the loop, set node.is_end = True."
    ],
    solution: "def insert(root, word):\n    node = root\n    for ch in word:\n        if ch not in node.children:\n            node.children[ch] = TrieNode()\n        node = node.children[ch]\n    node.is_end = True",
    walkthrough: "Walk and build. Each character is either already a path (follow it) or a new path (create it). At 'p'-'p', the first 'p' creates a child 'p' of the existing 'p' node. The final 'p' gets is_end = True. The trie now knows 'app' is a word.",
    testCode: "root = TrieNode()\ninsert(root, 'app')\nassert root.children['a'].children['p'].children['p'].is_end == True\nassert root.is_end == False\nassert root.children['a'].is_end == False\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Insert 'apple' After 'app' — Prefix Reuse", pattern: "trie insertion", skill: "extend existing path, distinguish terminals",
    statement: "Start with a trie containing 'app'. Now insert 'apple'. Demonstrate that 'a','p','p' do NOT create new nodes — they reuse the existing path. Only 'l','e' are new. Both 'app' and 'apple' must be recognized as words.",
    examples: [
      { input: "trie has 'app', insert 'apple'", output: "'app' node: is_end=True, has child 'l'. 'apple' node: is_end=True, no children" },
    ],
    why: "This is THE moment the trie earns its name (reTRIEval). The shared prefix 'app' is stored exactly once. Inserting a longer word extends the path without duplicating the prefix. The trie remembers both as words by setting is_end on two different nodes.",
    starterCode: "def insert_apple(root):\n    pass",
    hints: [
      "Call insert(root, 'app') first to set up the initial trie.",
      "Call insert(root, 'apple'). Trace the walk: 'a' exists, 'p' exists, 'p' exists — no new nodes. Then 'l' and 'e' are new.",
      "Verify: the node at 'app' path has is_end=True AND 'l' in its children."
    ],
    solution: "def insert_apple(root):\n    insert(root, 'app')\n    insert(root, 'apple')",
    walkthrough: "Trace insert('apple') after 'app': node=root; ch='a', exists, node=child_a; ch='p', exists, node=child_p; ch='p', exists, node=child_pp. Now node is at the same node where 'app' ends. is_end is already True from before. ch='l', NOT in children — create new node, add; node=child_l. ch='e', NOT in children — create, add; node=child_e. After loop, set node.is_end=True. The trie now has two terminal nodes on one shared spine.",
    testCode: "root = TrieNode()\ninsert(root, 'app')\ninsert(root, 'apple')\nnode_app = root.children['a'].children['p'].children['p']\nassert node_app.is_end == True\nassert 'l' in node_app.children\nnode_apple = node_app.children['l'].children['e']\nassert node_apple.is_end == True\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "Build Complete Trie from Word List", pattern: "trie construction", skill: "insert all words, trace structure",
    statement: "Given a list of words, build a complete trie. Insert each word using your insert function. Return the root. Then write a helper count_nodes(root) that returns the total number of nodes in the trie.",
    examples: [
      { input: "words = ['cat','car','bat']", output: "trie with 6 nodes (root + c,a,t,r + b,a,t)" },
      { input: "words = ['a','ab','abc']", output: "trie with 4 nodes", explain: "root + a(terminal) + b(terminal) + c(terminal)" },
    ],
    why: "Construction puts it all together. The node count reveals the compression: 6 nodes for 9 characters ('cat','car','bat' = 9 chars, 6 nodes). The longer the common prefixes, the more dramatic the savings.",
    starterCode: "def build_trie(words):\n    pass\n\ndef count_nodes(root):\n    pass",
    hints: [
      "build_trie: create root, loop through words and call insert(root, word). Return root.",
      "count_nodes: DFS from root. Base: return 0 for None. For each child: accumulate 1 + count_nodes(child).",
      "Think about: is the root a node? Yes. Does root represent a character? No — root is the sentinel before any character."
    ],
    solution: "def build_trie(words):\n    root = TrieNode()\n    for word in words:\n        insert(root, word)\n    return root\n\ndef count_nodes(root):\n    count = 1\n    for child in root.children.values():\n        count += count_nodes(child)\n    return count",
    walkthrough: "build_trie delegates to insert for each word — it's a one-liner. count_nodes recurses through every child. The root counts as 1 (non-character node). Each child node represents a character in some word's path. The total shows how much we compressed vs. the character-by-character representation.",
    testCode: "root = build_trie(['cat','car','bat'])\nassert count_nodes(root) == 6\nroot2 = build_trie(['a','ab','abc'])\nassert count_nodes(root2) == 4\nroot3 = build_trie([])\nassert count_nodes(root3) == 1\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 1, title: "Visualize Trie Structure", pattern: "trie traversal", skill: "print all paths with terminal markers",
    statement: "Write a function print_trie(root, prefix='') that prints all words stored in the trie by traversing it. Print '*' after words where is_end is True, and for non-terminal nodes, print the path so far. The output shows the trie's shape.",
    examples: [
      { input: "trie with ['cat','car']", output: "c\na*\nt*\nr*\n", explain: "root->c, c->a, a->t(*), a->r(*)" },
    ],
    why: "Visualizing a trie reveals its structure: shared prefixes form linear chains, divergences create branches, and terminal markers light up the words. This is the trie's 'X-ray' — seeing the map tells you what words it stores.",
    starterCode: "def print_trie(node, prefix='', depth=0):\n    pass",
    hints: [
      "Use DFS with indentation proportional to depth. Print prefix or '  '*depth then the character.",
      "If node.is_end, append ' *' to mark a complete word.",
      "Recurse into each child in node.children, updating prefix or using a new path string."
    ],
    solution: "def print_trie(node, prefix=''):\n    if node.is_end:\n        print(prefix[:] + ' *')\n    for ch, child in sorted(node.children.items()):\n        print_trie(child, prefix + ch)",
    walkthrough: "DFS with path accumulation. As you descend, append each character to the path string. When you hit a node with is_end=True, print the accumulated path plus '*'. Then recurse into children. The sorted iteration ensures alphabetical order. For ['cat','car']: c, then a, then split: t* and r*.",
    testCode: "root = build_trie(['cat','car','bat'])\nimport io, sys\ncapture = io.StringIO()\nsys.stdout = capture\nprint_trie(root)\nsys.stdout = sys.__stdout__\noutput = capture.getvalue()\nassert 'cat' in output or 'ca' in output\nassert 'car' in output\nassert 'bat' in output\nprint('All tests passed!')"
  },
  // ═══ STAGE 2: Insert & Search ═══
  {
    id: 14, stage: 2, title: "Insert Word — Iterative", pattern: "trie insertion", skill: "walk + create missing children + flag",
    statement: "Consolidate: write insert(root, word) as the definitive iterative insert function. For each character, descend or create. After the loop, mark is_end = True. This is the exact function you'll use for every subsequent problem.",
    examples: [
      { input: "root = empty, insert 'hello'", output: "has_word(root, 'hello') == True" },
      { input: "root has 'hi', insert 'hi' again", output: "has_word(root, 'hi') == True", explain: "idempotent — inserting again changes nothing" },
    ],
    why: "Deliberate repetition to automate the motor pattern. Insert is a 4-line function you should be able to write in your sleep. The loop body does one thing: ensure the next character exists, then step into it. That's it.",
    starterCode: "def insert(root, word):\n    pass",
    hints: [
      "node = root. For each character ch: if ch not in node.children, create TrieNode().",
      "Always advance: node = node.children[ch].",
      "After loop: node.is_end = True. That's the entire function."
    ],
    solution: "def insert(root, word):\n    node = root\n    for ch in word:\n        if ch not in node.children:\n            node.children[ch] = TrieNode()\n        node = node.children[ch]\n    node.is_end = True",
    walkthrough: "A straight line through the word. Each step extends the path by at most one new node. The node variable tracks your position. At the end, you're at the word's terminal node — flip the is_end switch. Inserting 'hi' a second time is harmless: the nodes exist, is_end is already True, nothing changes.",
    testCode: "root = TrieNode()\ninsert(root, 'hello')\nnode = root\nfor ch in 'hello':\n    assert ch in node.children\n    node = node.children[ch]\nassert node.is_end == True\ninsert(root, 'hi')\nnode = root\nfor ch in 'hi':\n    assert ch in node.children\n    node = node.children[ch]\nassert node.is_end == True\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Search Exact Word", pattern: "trie search", skill: "walk and check is_end",
    statement: "Write search(root, word) that returns True if and only if the exact word was inserted into the trie. Must walk the full path AND check the terminal flag.",
    examples: [
      { input: "trie = ['app','apple'], search 'app'", output: "True" },
      { input: "trie = ['app','apple'], search 'ap'", output: "False", explain: "path exists but is_end=False" },
      { input: "trie = ['app','apple'], search 'apricot'", output: "False", explain: "dead end at 'r'" },
    ],
    why: "Search is the trie's fundamental read operation. Path existence alone is not enough — the terminal flag must be True. This is the difference between 'the letters appear somewhere' and 'they form a word we stored.'",
    starterCode: "def search(root, word):\n    pass",
    hints: [
      "Walk the trie: for each ch in word, if ch not in node.children, return False immediately.",
      "If you complete the walk, check if the final node's is_end is True.",
      "Return node.is_end — not just True."
    ],
    solution: "def search(root, word):\n    node = root\n    for ch in word:\n        if ch not in node.children:\n            return False\n        node = node.children[ch]\n    return node.is_end",
    walkthrough: "A linear walk from root following word's letters. Three outcomes: (1) dead end — a character has no child, return False. (2) reached the end but is_end=False — the path exists as a prefix but isn't a stored word. (3) reached the end and is_end=True — exact match. The return statement itself is the 'and': we reached the node AND it's terminal.",
    testCode: "root = build_trie(['app','apple','bat'])\nassert search(root, 'app') == True\nassert search(root, 'apple') == True\nassert search(root, 'bat') == True\nassert search(root, 'ap') == False\nassert search(root, 'apricot') == False\nassert search(root, '') == False\nassert search(root, 'appl') == False\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "startsWith — Prefix Exists", pattern: "trie search", skill: "walk only, ignore is_end",
    statement: "Write starts_with(root, prefix) that returns True if any word in the trie starts with the given prefix. Unlike search, you do NOT need the terminal flag — just that the path exists.",
    examples: [
      { input: "trie = ['app','apple'], prefix = 'ap'", output: "True" },
      { input: "trie = ['app','apple'], prefix = 'app'", output: "True" },
      { input: "trie = ['app','apple'], prefix = 'bat'", output: "False" },
    ],
    why: "Search checks terminality; startsWith checks path existence. They differ by one line: the final is_end check. Understanding this difference is understanding when the terminal flag matters and when it doesn't.",
    starterCode: "def starts_with(root, prefix):\n    pass",
    hints: [
      "Same walk as search, but don't check is_end at the end.",
      "If you complete the walk without hitting a dead end, return True.",
      "What about empty prefix ''? Walk 0 characters — always True if root exists."
    ],
    solution: "def starts_with(root, prefix):\n    node = root\n    for ch in prefix:\n        if ch not in node.children:\n            return False\n        node = node.children[ch]\n    return True",
    walkthrough: "Identical body to search, but return True instead of node.is_end. The empty prefix is a special case: the loop runs zero times, node stays root, return True. Every trie starts with '' by definition. For 'ap' in [app, apple]: walk a→p, both exist, return True. is_end never enters the picture.",
    testCode: "root = build_trie(['app','apple','bat'])\nassert starts_with(root, '') == True\nassert starts_with(root, 'a') == True\nassert starts_with(root, 'ap') == True\nassert starts_with(root, 'app') == True\nassert starts_with(root, 'appl') == True\nassert starts_with(root, 'b') == True\nassert starts_with(root, 'c') == False\nassert starts_with(root, 'ba') == True\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Delete Word from Trie", pattern: "trie deletion", skill: "unset is_end, optionally prune dead nodes",
    statement: "Write delete(root, word) that removes a word from the trie. At minimum, unset is_end on the terminal node. For bonus points (but not required), remove nodes that have no children and are not terminals — prune dead branches.",
    examples: [
      { input: "trie = ['app','apple'], delete 'app'", output: "'app' gone, 'apple' still there. 'apple' node path intact." },
      { input: "trie = ['cat'], delete 'cat'", output: "trie empty. root.children is {}." },
    ],
    why: "Deletion is the inverse of insertion. Unflagging the terminal is enough to make search return False. Pruning is optional but teaches you to think bottom-up about the trie as a shared structure — you can only delete nodes that no word depends on.",
    starterCode: "def delete(root, word):\n    if not search(root, word):\n        return\n    pass",
    hints: [
      "First check: if the word doesn't exist, do nothing.",
      "Walk to the terminal node and set is_end = False.",
      "Optional prune: use a recursive helper that returns whether a node should be kept (has children or is_end). Delete children from the bottom up."
    ],
    solution: "def delete(root, word):\n    if not search(root, word):\n        return\n    def prune(node, i):\n        if i == len(word):\n            node.is_end = False\n            return len(node.children) == 0\n        ch = word[i]\n        if prune(node.children[ch], i + 1):\n            del node.children[ch]\n            return len(node.children) == 0 and not node.is_end\n        return False\n    prune(root, 0)",
    walkthrough: "First, guard: if the word isn't there, stop. The prune helper recurses to the terminal (i == len(word)), unsets is_end, and returns whether the now-terminal node is orphaned (no children). On the way back up, if a child returned True (child is dead), delete it from children. A parent becomes dead if it now has 0 children AND is not itself a terminal.",
    testCode: "root = build_trie(['app','apple'])\nassert search(root, 'app') == True\ndelete(root, 'app')\nassert search(root, 'app') == False\nassert search(root, 'apple') == True\nroot2 = build_trie(['cat'])\ndelete(root2, 'cat')\nassert search(root2, 'cat') == False\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "Count Words in Trie", pattern: "trie traversal", skill: "DFS counting terminal nodes",
    statement: "Write count_words(root) that returns the total number of distinct words stored in the trie — the number of nodes with is_end == True.",
    examples: [
      { input: "trie = ['app','apple','bat']", output: "3" },
      { input: "trie = ['a','a','a']", output: "1", explain: "duplicate inserts don't create new words" },
    ],
    why: "The word count is the number of terminal flags that are True. Duplicate insertions flip an already-True flag to True — no net change. This property makes the trie a natural deduplicator.",
    starterCode: "def count_words(root):\n    pass",
    hints: [
      "Use DFS or recursion. For each node: start count at 1 if is_end else 0.",
      "Add the counts from all children.",
      "Duplicate insertions don't matter: is_end is boolean, setting it twice changes nothing."
    ],
    solution: "def count_words(root):\n    count = 1 if root.is_end else 0\n    for child in root.children.values():\n        count += count_words(child)\n    return count",
    walkthrough: "Recursion sums terminal nodes. Each node contributes 1 if is_end is True, otherwise 0, plus whatever its children contribute. Even though we count the root (which is never terminal), the base case handles this gracefully. For ['a','a','a'], the 'a' node's is_end is set to True three times — but it only counts once.",
    testCode: "root = build_trie(['app','apple','bat'])\nassert count_words(root) == 3\nroot2 = build_trie(['a','a','a'])\nassert count_words(root2) == 1\nroot3 = build_trie([])\nassert count_words(root3) == 0\nroot4 = build_trie(['cat','car','bat','bar'])\nassert count_words(root4) == 4\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Iterative Search and startsWith", pattern: "trie search", skill: "while loop skeleton, consolidate",
    statement: "Consolidate: write iterative versions of both search and starts_with in a single function. The only difference in the two outputs is whether you return True or node.is_end at the end. Make the skeleton automatic.",
    examples: [
      { input: "trie = ['cat'], search 'cat', startsWith 'ca'", output: "search=True, startsWith=True" },
    ],
    why: "By now the walk skeleton should be muscle memory. This consolidation problem cements it: a while/for loop, a dead-end check, an advancement step. The only variable is the return value after the loop.",
    starterCode: "def search_iter(root, word):\n    pass\n\ndef starts_with_iter(root, prefix):\n    pass",
    hints: [
      "Both use the exact same walk: node = root; for ch in text: if ch not in children: return False; node = node.children[ch].",
      "search returns node.is_end after the loop.",
      "starts_with returns True after the loop."
    ],
    solution: "def search_iter(root, word):\n    node = root\n    for ch in word:\n        if ch not in node.children:\n            return False\n        node = node.children[ch]\n    return node.is_end\n\ndef starts_with_iter(root, prefix):\n    node = root\n    for ch in prefix:\n        if ch not in node.children:\n            return False\n        node = node.children[ch]\n    return True",
    walkthrough: "Two functions, one skeleton. The 4-line walk is identical. search returns node.is_end (only True for full words). starts_with returns True (any path that reaches the end is valid). The difference, one line, encodes the entire distinction between 'exact word' and 'any extension.'",
    testCode: "root = build_trie(['cat','car'])\nassert search_iter(root, 'cat') == True\nassert search_iter(root, 'car') == True\nassert search_iter(root, 'ca') == False\nassert starts_with_iter(root, 'ca') == True\nassert starts_with_iter(root, 'c') == True\nassert starts_with_iter(root, 'd') == False\nprint('All tests passed!')"
  },
  // +++ STAGE 2 new +++
  {
    id: 20, stage: 2, title: "Insert Batch and Verify All Present", pattern: "trie insertion", skill: "insert word list, search each to confirm round-trip",
    statement: "Write insert_batch_and_verify(words) that: (1) builds a trie from the word list by inserting each word, (2) for each word, calls search to verify it exists, (3) returns a list of booleans — True for every word successfully found. This closes the insert-search loop.",
    examples: [
      { input: "words = ['cat', 'car', 'bat']", output: "[True, True, True]", explain: "all three words inserted and verified present" },
      { input: "words = ['a', 'ab', 'abc']", output: "[True, True, True]" },
    ],
    why: "Insert and search are two sides of one operation. Insert builds; search confirms. Running search immediately after insert on the same data is the round-trip test — it proves the trie faithfully stores what was given. No silent data loss.",
    starterCode: "def insert_batch_and_verify(words):\n    if not words:\n        return []\n    root = TrieNode()\n    pass",
    hints: [
      "Phase 1: build trie. For each word, walk/create nodes, mark is_end. Use the insert skeleton from P12.",
      "Phase 2: verify. For each word, walk the path and check node.is_end. Use the search skeleton from P13.",
      "The two phases share the same walk pattern — the only difference is Phase 1 creates missing nodes, Phase 2 returns False on missing nodes."
    ],
    solution: "def insert_batch_and_verify(words):\n    if not words:\n        return []\n    root = TrieNode()\n    for w in words:\n        node = root\n        for ch in w:\n            if ch not in node.children:\n                node.children[ch] = TrieNode()\n            node = node.children[ch]\n        node.is_end = True\n    result = []\n    for w in words:\n        node = root\n        found = True\n        for ch in w:\n            if ch not in node.children:\n                found = False\n                break\n            node = node.children[ch]\n        result.append(found and node.is_end)\n    return result",
    walkthrough: "Phase 1 builds the trie. Phase 2 tests it: for 'cat', walk c→a→t, node.is_end is True → True. For 'ab' when the trie only has 'abc' inserted (hypothetically): walk a→b, node.is_end is False → False. The verify loop is the search function inlined. Every word in the input should produce True — this pattern catches insert errors before they propagate.",
    testCode: "assert insert_batch_and_verify(['cat','car','bat']) == [True,True,True]\nassert insert_batch_and_verify(['a','ab','abc']) == [True,True,True]\nassert insert_batch_and_verify(['test']) == [True]\nassert insert_batch_and_verify([]) == []\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 2, title: "Count Nodes and Compute Compression Ratio", pattern: "trie structure", skill: "count nodes after insert, compare to total characters",
    statement: "Build a trie from a word list. Count total nodes (including root). Also compute total characters across all words. Return (node_count, total_chars). The compression ratio = total_chars / node_count — how many raw characters each trie node represents.",
    examples: [
      { input: "words = ['cat','car','bat']", output: "(6, 9)", explain: "6 nodes for 9 raw characters. Compression ratio = 9/6 = 1.5x" },
      { input: "words = ['a','a','a']", output: "(2, 3)", explain: "root + 'a' = 2 nodes for 3 chars (duplicates compressed away)" },
    ],
    why: "The trie's value proposition in one number: node_count < total_chars. The difference is the saved space from shared prefixes. For a real dataset like 10k English words, the ratio can be 3x–5x — the trie stores 3–5 characters per node on average.",
    starterCode: "def trie_compression(words):\n    pass",
    hints: [
      "Build the trie as usual. Track total_chars = sum(len(w) for w in words) during insertion.",
      "Write a recursive node counter: 1 + sum(count(child) for each child in node.children).",
      "Return (node_count, total_chars). The waste eliminated is total_chars - (node_count - 1)."
    ],
    solution: "def trie_compression(words):\n    root = TrieNode()\n    total_chars = 0\n    for w in words:\n        total_chars += len(w)\n        node = root\n        for ch in w:\n            if ch not in node.children:\n                node.children[ch] = TrieNode()\n            node = node.children[ch]\n        node.is_end = True\n    def count_nodes(n):\n        c = 1\n        for child in n.children.values():\n            c += count_nodes(child)\n        return c\n    return (count_nodes(root), total_chars)",
    walkthrough: "Insert all words, tracking total character count. Then DFS-count nodes: root + every unique character-position pair ever seen. For ['cat','car']: nodes = root + c + a + t + r = 5. Total chars = 6. Ratio = 6/5 = 1.2x (saved 1 character). For ['prefix','prepare']: p-r-e shared, then diverge. Savings are modest for tiny lists but compound massively for large dictionaries where thousands of words share prefixes.",
    testCode: "nodes, chars = trie_compression(['cat','car','bat'])\nassert nodes == 6\nassert chars == 9\nnodes2, chars2 = trie_compression(['a','a','a'])\nassert nodes2 == 2\nassert chars2 == 3\nnodes3, chars3 = trie_compression([])\nassert nodes3 == 1\nassert chars3 == 0\nprint('All tests passed!')"
  },
  // ═══ STAGE 3: The Payload ═══
  {
    id: 22, stage: 3, title: "Count Words with Prefix", pattern: "trie counts", skill: "walk to prefix, then DFS count terminals",
    statement: "Write count_prefix(root, prefix) that returns the number of words in the trie that start with the given prefix. Walk to the prefix node, then count all terminal nodes in that subtree.",
    examples: [
      { input: "trie = ['app','apple','apricot','bat'], prefix = 'ap'", output: "3" },
      { input: "trie = ['app','apple','apricot','bat'], prefix = 'app'", output: "2" },
      { input: "trie = ['app','apple','apricot','bat'], prefix = 'z'", output: "0" },
    ],
    why: "The payload on a node — its subtree's word count — turns the trie from a membership tester into a statistics engine. First, descend to the prefix node. Then, DFS the subtree counting terminals.",
    starterCode: "def count_prefix(root, prefix):\n    pass",
    hints: [
      "First, walk to the node corresponding to the prefix. If the prefix doesn't exist, return 0.",
      "From the prefix node, DFS and count all nodes where is_end == True.",
      "The walk is starts_with without the True return — you need the node itself."
    ],
    solution: "def count_prefix(root, prefix):\n    node = root\n    for ch in prefix:\n        if ch not in node.children:\n            return 0\n        node = node.children[ch]\n    def count_terminals(n):\n        c = 1 if n.is_end else 0\n        for child in n.children.values():\n            c += count_terminals(child)\n        return c\n    return count_terminals(node)",
    walkthrough: "Phase 1: descend to the node at the end of the prefix path. If 'ap' reaches the 'p' node under 'a', you're now standing where all 'ap*' words converge. Phase 2: count terminal nodes in the subtree rooted here. Recursion: current node counts 1 if terminal, plus all children's terminal counts.",
    testCode: "root = build_trie(['app','apple','apricot','bat'])\nassert count_prefix(root, 'ap') == 3\nassert count_prefix(root, 'app') == 2\nassert count_prefix(root, 'b') == 1\nassert count_prefix(root, 'z') == 0\nassert count_prefix(root, '') == 4\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Autocomplete — Top 3 Words", pattern: "trie counts", skill: "DFS from prefix, collect top 3 terminals",
    statement: "Write autocomplete(root, prefix, k=3) that returns up to k words starting with the given prefix, in lexicographic order. Walk to prefix, then DFS collecting completed words. Return a list of strings.",
    examples: [
      { input: "trie = ['app','apple','apricot','apt'], prefix = 'ap', k = 3", output: "['app','apple','apricot']" },
      { input: "trie = ['cat','car','cab'], prefix = 'ca', k = 2", output: "['cab','car']" },
    ],
    why: "Autocomplete is the killer app of tries. Descend to the prefix, then explore every path in the subtree, collecting words. Sorting by alphabetical order is natural because DFS visits children in sorted key order.",
    starterCode: "def autocomplete(root, prefix, k=3):\n    pass",
    hints: [
      "Walk to the prefix node. If prefix doesn't exist, return [].",
      "DFS from there: maintain a path string. When is_end: append path to results.",
      "Sort children by key for lexicographic order. Stop when results reach k."
    ],
    solution: "def autocomplete(root, prefix, k=3):\n    node = root\n    for ch in prefix:\n        if ch not in node.children:\n            return []\n        node = node.children[ch]\n    result = []\n    def collect(n, path):\n        if len(result) >= k:\n            return\n        if n.is_end:\n            result.append(path)\n        for ch in sorted(n.children.keys()):\n            collect(n.children[ch], path + ch)\n    collect(node, prefix)\n    return result",
    walkthrough: "Phase 1: reach the prefix subtree. Phase 2: DFS with lexicographic ordering (sorted keys). Each time is_end is True, the accumulated path is a complete word — add it. Stop collecting once you have k results. For prefix 'ap' in [app, apple, apricot, apt], the DFS visits: app*, apple*, apricot*, apt* in that order. Top 3: app, apple, apricot.",
    testCode: "root = build_trie(['app','apple','apricot','apt'])\nassert autocomplete(root, 'ap', 3) == ['app','apple','apricot']\nassert autocomplete(root, 'ap', 1) == ['app']\nassert autocomplete(root, 'c', 3) == []\nroot2 = build_trie(['cat','car','cab'])\nassert autocomplete(root2, 'ca', 2) == ['cab','car']\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Longest Common Prefix via Trie", pattern: "trie counts", skill: "walk the only child path",
    statement: "Given a list of words, build a trie and find the longest common prefix of all words by walking from root while there is exactly one child and no terminal flag along the path.",
    examples: [
      { input: "words = ['flower','flow','flight']", output: "'fl'" },
      { input: "words = ['dog','racecar','car']", output: "''" },
      { input: "words = ['interspecies','interstellar','interstate']", output: "'inters'" },
    ],
    why: "The longest common prefix in a trie is the longest path from root where there is exactly ONE child at each step AND no node is terminal (except possibly the last). A branch or a terminal word means the commonality ends.",
    starterCode: "def longest_common_prefix_trie(words):\n    pass",
    hints: [
      "Build the trie from words. Start from root with empty prefix string.",
      "While the current node has exactly one child and not is_end: follow that child, append its character.",
      "If node is_end: a word ends here. If there are other words, they diverge — stop."
    ],
    solution: "def longest_common_prefix_trie(words):\n    if not words:\n        return ''\n    root = build_trie(words)\n    node = root\n    prefix = ''\n    while len(node.children) == 1 and not node.is_end:\n        ch = next(iter(node.children))\n        prefix += ch\n        node = node.children[ch]\n    return prefix",
    walkthrough: "The trie's root holds all words. If there's exactly one child, that single letter starts every word — it's common. Continue down that child. If at any point the node has multiple children or is terminal (a word ends here while others continue), the common prefix stops. For ['flower','flow','flight']: f (1 child), l (1 child), then o/w/i (3 children) — stop, result: 'fl'.",
    testCode: "assert longest_common_prefix_trie(['flower','flow','flight']) == 'fl'\nassert longest_common_prefix_trie(['dog','racecar','car']) == ''\nassert longest_common_prefix_trie(['interspecies','interstellar','interstate']) == 'inters'\nassert longest_common_prefix_trie(['a']) == 'a'\nassert longest_common_prefix_trie([]) == ''\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "All Words with Prefix", pattern: "trie counts", skill: "DFS from prefix, collect all terminals",
    statement: "Write words_with_prefix(root, prefix) that returns a list of ALL words in the trie that start with the given prefix. This is autocomplete without a k limit. Return them in lexicographic order.",
    examples: [
      { input: "trie = ['app','apple','apricot','bat'], prefix = 'ap'", output: "['app','apple','apricot']" },
      { input: "trie = ['app','apple','apricot','bat'], prefix = 'b'", output: "['bat']" },
    ],
    why: "Generalized autocomplete. Same pattern: descend, then DFS the subtree. No k limit means you collect every terminal in the subtree. This is the complete enumeration that autocomplete samples from.",
    starterCode: "def words_with_prefix(root, prefix):\n    pass",
    hints: [
      "Walk to the prefix node. Return [] if prefix doesn't exist.",
      "DFS collecting every is_end=True node's accumulated path string.",
      "Sort children keys for lexicographic order in results."
    ],
    solution: "def words_with_prefix(root, prefix):\n    node = root\n    for ch in prefix:\n        if ch not in node.children:\n            return []\n        node = node.children[ch]\n    result = []\n    def dfs(n, path):\n        if n.is_end:\n            result.append(path)\n        for ch in sorted(n.children.keys()):\n            dfs(n.children[ch], path + ch)\n    dfs(node, prefix)\n    return result",
    walkthrough: "Descend to the prefix node. From there, DFS enumerates every path to a terminal. Sorted keys ensure alphabetical order. For prefix 'ap': the subtree contains 'p' (terminal → 'app'), 'p'-'l'-'e' (terminal → 'apple'), 'r'-'i'-'c'-'o'-'t' (terminal → 'apricot').",
    testCode: "root = build_trie(['app','apple','apricot','bat'])\nassert words_with_prefix(root, 'ap') == ['app','apple','apricot']\nassert words_with_prefix(root, 'b') == ['bat']\nassert words_with_prefix(root, 'z') == []\nassert words_with_prefix(root, '') == ['app','apple','apricot','bat']\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Unique Prefixes — Shortest Identifying Prefix", pattern: "trie counts", skill: "walk until subtree has only one word",
    statement: "For each word in a list, find the shortest prefix that uniquely identifies it — no other word starts with that prefix. Return a dict mapping each word to its unique prefix.",
    examples: [
      { input: "words = ['cat','car','bat']", output: "{'cat':'cat', 'car':'car', 'bat':'b'}" },
      { input: "words = ['dog','dot','dove']", output: "{'dog':'dog', 'dot':'dot', 'dove':'dov'}" },
      { input: "words = ['abc','def']", output: "{'abc':'a', 'def':'d'}" },
    ],
    why: "Unique prefixes are useful for autocomplete (show the shortest disambiguating string) and compression (use fewer characters when context is clear). The idea: for each word, walk down character by character. Stop when the current subtree contains exactly one word (or you hit the end).",
    starterCode: "def unique_prefixes(words):\n    pass",
    hints: [
      "Build the trie. For each word, walk down, accumulating prefix chars.",
      "At each step, count total terminal nodes in the current node's subtree.",
      "Stop when the subtree word count is 1 — this prefix uniquely identifies exactly this word."
    ],
    solution: "def unique_prefixes(words):\n    root = build_trie(words)\n    def subtree_count(node):\n        c = 1 if node.is_end else 0\n        for child in node.children.values():\n            c += subtree_count(child)\n        return c\n    result = {}\n    for w in words:\n        node = root\n        for i, ch in enumerate(w):\n            node = node.children[ch]\n            if subtree_count(node) == 1:\n                result[w] = w[:i+1]\n                break\n    return result",
    walkthrough: "For each word, follow its path. At each node, count how many words exist in the entire subtree. When that count drops to 1, you've uniquely identified the word — the characters so far are its fingerprint. For 'bat' in ['cat','car','bat']: at 'b', subtree count is 1 (only 'bat' starts with 'b'), so unique prefix is 'b'.",
    testCode: "r = unique_prefixes(['cat','car','bat'])\nassert r['bat'] == 'b'\nassert r['cat'] == 'cat'\nr2 = unique_prefixes(['dog','dot','dove'])\nassert r2['dove'] == 'dov'\nr3 = unique_prefixes(['abc','def'])\nassert r3['abc'] == 'a'\nassert r3['def'] == 'd'\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 3, title: "Word Frequency — Store and Query Frequencies", pattern: "trie counts", skill: "augment node with count field",
    statement: "Augment the TrieNode to include a count field. When inserting a word, increment its terminal node's count. Write get_frequency(root, word) that returns how many times that word was inserted.",
    examples: [
      { input: "insert 'dog' twice, 'cat' once, query 'dog'", output: "2" },
      { input: "insert 'dog' twice, 'cat' once, query 'bird'", output: "0" },
    ],
    why: "Adding a payload to the terminal node transforms the trie from a set to a multiset. Counts at nodes track frequency. This generalizes to any per-word metadata — the node can carry as much data as needed.",
    starterCode: "class TrieNodeFreq:\n    def __init__(self):\n        pass\n\ndef insert_freq(root, word):\n    pass\n\ndef get_frequency(root, word):\n    pass",
    hints: [
      "TrieNodeFreq: children dict, is_end bool, and count int (default 0).",
      "insert_freq: walk/create nodes. At terminal, increment node.count and set is_end=True.",
      "get_frequency: walk to word's node. If found and is_end, return node.count. Otherwise 0."
    ],
    solution: "class TrieNodeFreq:\n    def __init__(self):\n        self.children = {}\n        self.is_end = False\n        self.count = 0\n\ndef insert_freq(root, word):\n    node = root\n    for ch in word:\n        if ch not in node.children:\n            node.children[ch] = TrieNodeFreq()\n        node = node.children[ch]\n    node.is_end = True\n    node.count += 1\n\ndef get_frequency(root, word):\n    node = root\n    for ch in word:\n        if ch not in node.children:\n            return 0\n        node = node.children[ch]\n    return node.count if node.is_end else 0",
    walkthrough: "The node now has three fields: children (navigation), is_end (terminality), count (frequency). Insert walks the same path, but at the terminal node, counts up instead of just flipping a boolean. Query walks to the terminal and reads count. For 'dog' inserted twice: the 'g' node has count=2. For 'bird' never inserted: walk fails or is_end=False, return 0.",
    testCode: "root = TrieNodeFreq()\ninsert_freq(root, 'dog')\ninsert_freq(root, 'dog')\ninsert_freq(root, 'cat')\nassert get_frequency(root, 'dog') == 2\nassert get_frequency(root, 'cat') == 1\nassert get_frequency(root, 'bird') == 0\nassert get_frequency(root, 'do') == 0\nprint('All tests passed!')"
  },
  // +++ STAGE 3 new +++
  {
    id: 28, stage: 3, title: "Shortest Word Starting with Given Prefix", pattern: "trie counts", skill: "walk to prefix, DFS find min-length terminal",
    statement: "Given a trie and a prefix, find the shortest complete word that starts with the prefix. Walk to the prefix node, then DFS the subtree to find the terminal node with the minimum path length from the prefix node. Return the full word or '' if none exists.",
    examples: [
      { input: "trie = ['app','apple','apricot'], prefix = 'ap'", output: "'app'", explain: "'app' (3 total) is shorter than 'apple' (5) and 'apricot' (7)" },
      { input: "trie = ['cat','car','cab'], prefix = 'ca'", output: "'cab'", explain: "all length 3, ties broken lexicographically" },
      { input: "trie = ['dog','cat'], prefix = 'z'", output: "''" },
    ],
    why: "The payload isn't just counts — it can be any derived property of the subtree. Shortest word uses a comparison at each terminal node. The trie descends to the prefix in O(p), then explores only the relevant subtree, not the entire dictionary.",
    starterCode: "def shortest_with_prefix(root, prefix):\n    pass",
    hints: [
      "Walk to the prefix node (O(p)). If prefix doesn't exist, return ''.",
      "DFS from there: track current path. On terminal nodes, compare path length to the best found so far.",
      "Prune: you can skip recursing deeper in a branch once its length already exceeds the best terminal found."
    ],
    solution: "def shortest_with_prefix(root, prefix):\n    node = root\n    for ch in prefix:\n        if ch not in node.children:\n            return ''\n        node = node.children[ch]\n    best = [None]\n    def dfs(n, path):\n        if n.is_end:\n            if best[0] is None or len(path) < len(best[0]):\n                best[0] = path\n        for ch in sorted(n.children.keys()):\n            dfs(n.children[ch], path + ch)\n    dfs(node, prefix)\n    return best[0] if best[0] is not None else ''",
    walkthrough: "Phase 1: descend to the node at the end of the prefix. Phase 2: DFS the subtree, tracking the shortest terminal path. For prefix 'ap' in ['app','apple','apricot']: node is at 'p' under 'a'. DFS finds 'p' (terminal → 'app', len=3), 'p'-'l'-'e' (terminal → 'apple', len=5), 'r'-'i'-'c'-'o'-'t' (terminal → 'apricot', len=7). Best is 'app'. The trie limits search to only words with this prefix — no whole-dictionary scan.",
    testCode: "root = build_trie(['app','apple','apricot','bat'])\nassert shortest_with_prefix(root, 'ap') == 'app'\nassert shortest_with_prefix(root, 'b') == 'bat'\nassert shortest_with_prefix(root, 'z') == ''\nassert shortest_with_prefix(root, '') == 'app'\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 3, title: "Kth Word in Lexicographic Order", pattern: "trie counts", skill: "DFS with rank counter to find kth word alphabetically",
    statement: "Given a trie and an integer k (1-indexed), return the kth word in lexicographic order. DFS the trie in sorted child order, counting terminal nodes. When the count reaches k, return the accumulated path. Return '' if k exceeds the total word count.",
    examples: [
      { input: "trie = ['cat','car','bat','apple'], k = 2", output: "'bat'", explain: "sorted: apple, bat, car, cat. k=2 → bat" },
      { input: "trie = ['a','ab','abc'], k = 1", output: "'a'" },
      { input: "trie = ['a','ab','abc'], k = 5", output: "''" },
    ],
    why: "Lexicographic ordering is deeply integrated with the trie: a DFS visiting children in sorted order naturally produces words alphabetically. Counting terminals along this ordered walk gives you the kth word without sorting — the trie's structure IS the sort. This generalizes autocomplete: instead of 'top k from a prefix,' it's 'kth from the entire dictionary.'",
    starterCode: "def kth_word(root, k):\n    pass",
    hints: [
      "DFS with sorted children keys. Maintain a rank counter (list or nonlocal int).",
      "At each terminal node, increment rank. If rank == k, record the current path and stop all recursion.",
      "Early termination: once the kth word is found, no need to explore further branches."
    ],
    solution: "def kth_word(root, k):\n    rank = [0]\n    result = [None]\n    def dfs(node, path):\n        if result[0] is not None:\n            return\n        if node.is_end:\n            rank[0] += 1\n            if rank[0] == k:\n                result[0] = path\n                return\n        for ch in sorted(node.children.keys()):\n            dfs(node.children[ch], path + ch)\n    dfs(root, '')\n    return result[0] if result[0] is not None else ''",
    walkthrough: "DFS visits children in alphabetical order. Terminal nodes encountered in order: apple (rank=1), bat (rank=2=k) → record 'bat', stop. For frontier = [apple, bat, car, cat], the trie's ordered traversal IS the alphabetical enumeration. No separate sort step needed — the trie structure serves as the sort index. Each terminal node is exactly one word in its correct lexicographic position.",
    testCode: "root = build_trie(['cat','car','bat','apple'])\nassert kth_word(root, 1) == 'apple'\nassert kth_word(root, 2) == 'bat'\nassert kth_word(root, 3) == 'car'\nassert kth_word(root, 4) == 'cat'\nassert kth_word(root, 5) == ''\nroot2 = build_trie(['a','ab','abc'])\nassert kth_word(root2, 3) == 'abc'\nprint('All tests passed!')"
  },
  // ═══ STAGE 4: Naive ═══
  {
    id: 30, stage: 4, title: "Prefix Search via List Scan", pattern: "naive prefix search", skill: "iterate word list, check startswith",
    statement: "Given a list of words and a prefix, return all words that start with the prefix. Use a simple list scan — no trie. Count how many comparisons are made against the prefix characters.",
    examples: [
      { input: "words = ['apple','apply','apricot','banana'], prefix = 'app'", output: "['apple','apply'] (checked 'app' against 4 words = 12 comparisons)" },
    ],
    why: "Naive prefix search checks every word's first p characters against the prefix. For n words of prefix length p: O(n*p) comparisons. The trie's descent achieves O(p+results) — a massive improvement when n is large and results are small.",
    starterCode: "def prefix_scan(words, prefix):\n    pass",
    hints: [
      "Iterate through words. For each, check if word.startswith(prefix).",
      "If yes, add to results. Count how many prefix characters you'd need to check.",
      "Return (results, comparisons). comparisons = n * len(prefix) if checking every word."
    ],
    solution: "def prefix_scan(words, prefix):\n    results = []\n    comparisons = 0\n    for w in words:\n        match = True\n        for j in range(len(prefix)):\n            comparisons += 1\n            if j >= len(w) or w[j] != prefix[j]:\n                match = False\n                break\n        if match:\n            results.append(w)\n    return (results, comparisons)",
    walkthrough: "Naive: every word gets its first p letters compared. For 'apple', a-p-p matches. For 'apply', a-p-p matches. For 'apricot', a-p-p-r fails at the 4th character — but we still checked 3. For 'banana', 'b' fails at first character. Total comparisons = all prefix letters checked across all words. A trie checks 'a' once, 'p' once, 'p' once — total 3 comparisons regardless of word count.",
    testCode: "results, comps = prefix_scan(['apple','apply','apricot','banana'], 'app')\nassert results == ['apple','apply']\nassert comps > 0\nresults2, _ = prefix_scan(['apple','apply','apricot','banana'], 'zz')\nassert results2 == []\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Wildcard Matching via Regex on Word List", pattern: "naive wildcard", skill: "convert pattern to regex, match each word",
    statement: "Given a word list and a pattern with '.' wildcards (each '.' matches any single letter), return all words matching the pattern using regex. Pattern 'c.t' should match 'cat', 'cot', 'cut', etc.",
    examples: [
      { input: "words = ['cat','cot','cut','car'], pattern = 'c.t'", output: "['cat','cot','cut']" },
      { input: "words = ['apple','apply','april'], pattern = 'app..'", output: "['apple','apply']" },
    ],
    why: "Regex matching on a word list is O(n*p) — scan every word, match each. A trie can do wildcard DFS in O(26^dots * p) worst case, but pruning makes it O(branches * p), often much faster when the word list is large.",
    starterCode: "def wildcard_naive(words, pattern):\n    pass",
    hints: [
      "Build a regex from pattern: replace '.' with '[a-z]'. Use re.fullmatch.",
      "Filter the word list: iterate words, keep those where regex matches.",
      "Note: O(n*p) complexity. The trie version will skip entire branches."
    ],
    solution: "def wildcard_naive(words, pattern):\n    results = []\n    for w in words:\n        if len(w) != len(pattern):\n            continue\n        match = True\n        for i, ch in enumerate(pattern):\n            if ch != '.' and ch != w[i]:\n                match = False\n                break\n        if match:\n            results.append(w)\n    return results",
    walkthrough: "For each word: first check length equality (a quick prune). Then walk character by character. If pattern[i] is not '.' and doesn't match word[i], skip. Otherwise continue. The '.' wildcard is a pass — it matches any character. All words are checked. For large lists (100k words), this linear scan against a 10-char pattern does 1 million comparisons.",
    testCode: "assert wildcard_naive(['cat','cot','cut','car'], 'c.t') == ['cat','cot','cut']\nassert wildcard_naive(['apple','apply','april'], 'app..') == ['apple','apply']\nassert wildcard_naive(['a','ab','abc'], '.') == ['a']\nassert wildcard_naive([], 'a') == []\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "Autocomplete via Sort on Word List", pattern: "naive autocomplete", skill: "sort words, filter by prefix",
    statement: "Given a word list and a prefix, return the top k words starting with that prefix in lexicographic order. Sort the entire list, then filter by prefix. Analyze the complexity.",
    examples: [
      { input: "words = ['apple','apply','apricot','banana'], prefix = 'ap', k = 2", output: "['apple','apply']" },
    ],
    why: "Sorting O(n log n) plus filtering O(n) works but doesn't scale for repeated queries. The trie pays O(n*p) upfront to build, then each query is O(p+results). For m queries, trie wins when m > log n.",
    starterCode: "def autocomplete_sort(words, prefix, k):\n    pass",
    hints: [
      "Sort the entire word list lexicographically.",
      "Filter: iterate sorted words, keep those that start with prefix.",
      "Return the first k matches."
    ],
    solution: "def autocomplete_sort(words, prefix, k):\n    sorted_words = sorted(words)\n    results = []\n    for w in sorted_words:\n        if w.startswith(prefix):\n            results.append(w)\n            if len(results) == k:\n                break\n    return results",
    walkthrough: "Sort all words (O(n log n)). Then linear scan: for each word, check startswith(prefix). Since sorted_words is alphabetical, words with the same prefix are contiguous. Stop at k. The issue: sorting costs O(n log n) even if k=1 and you only need one word. Trie queries are O(p + k) regardless of n.",
    testCode: "assert autocomplete_sort(['apple','apply','apricot','banana'], 'ap', 2) == ['apple','apply']\nassert autocomplete_sort(['cat','car','cab'], 'ca', 2) == ['cab','car']\nassert autocomplete_sort(['dog','cat'], 'z', 3) == []\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Find All Words Starting with Prefix via Scan", pattern: "naive prefix search", skill: "scan + filter with startswith",
    statement: "Given a word list and a prefix, return ALL words starting with the prefix using a scan. No trie, no sorting — just iterate and collect.",
    examples: [
      { input: "words = ['car','cat','cab','dog','deer'], prefix = 'ca'", output: "['car','cat','cab']" },
    ],
    why: "The dumbest possible prefix search. It works, it's simple, and it's the baseline against which we measure the trie. When n=10, scan is fine. When n=10^5 with 10^4 queries per second, the trie's O(p) descent vs O(n*p) scan is the difference between responsive and broken.",
    starterCode: "def prefix_scan_all(words, prefix):\n    pass",
    hints: [
      "Iterate words, use str.startswith(prefix) to filter.",
      "Collect matches into a list. Return the list.",
      "Bonus: note the complexity. O(n * p) character comparisons worst case."
    ],
    solution: "def prefix_scan_all(words, prefix):\n    results = []\n    for w in words:\n        if w.startswith(prefix):\n            results.append(w)\n    return results",
    walkthrough: "One loop, one conditional. Python's startswith() is optimized C, but still must check p characters for each word — O(n*p). For 100k words and prefix length 5, that's 500k character comparisons per query. A trie's descent: 5 comparisons at most. The gap widens with every additional query.",
    testCode: "assert prefix_scan_all(['car','cat','cab','dog','deer'], 'ca') == ['car','cat','cab']\nassert prefix_scan_all(['car','cat','cab','dog','deer'], 'd') == ['dog','deer']\nassert prefix_scan_all(['car','cat'], 'z') == []\nassert prefix_scan_all([], 'a') == []\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 4, title: "Count Words with Prefix via Scan", pattern: "naive prefix count", skill: "count startswith occurrences",
    statement: "Given a word list and a prefix, count how many words start with the prefix. Use a linear scan with startswith.",
    examples: [
      { input: "words = ['car','cat','cab','dog','deer'], prefix = 'ca'", output: "3" },
      { input: "words = ['car','cat','cab','dog','deer'], prefix = 'z'", output: "0" },
    ],
    why: "Scanning to count is O(n*p). The trie version descends to the prefix node in O(p) and returns a precomputed count in O(1) — if you store subtree counts. The difference is the cost of recomputation vs caching.",
    starterCode: "def count_prefix_scan(words, prefix):\n    pass",
    hints: [
      "Count words where w.startswith(prefix) is True.",
      "Use a simple counter and iterate the list.",
      "Compare to trie approach: walk O(p), answer O(1)."
    ],
    solution: "def count_prefix_scan(words, prefix):\n    count = 0\n    for w in words:\n        if w.startswith(prefix):\n            count += 1\n    return count",
    walkthrough: "Count what startswith says. Pure O(n*p) — every word is probed. For repeated queries on the same word list, you're recomputing the same prefix checks. The trie bakes this count into its structure: after the initial O(total_chars) build, each count_prefix query is just a descent and a lookup.",
    testCode: "assert count_prefix_scan(['car','cat','cab','dog','deer'], 'ca') == 3\nassert count_prefix_scan(['car','cat','cab','dog','deer'], 'c') == 3\nassert count_prefix_scan(['car','cat','cab','dog','deer'], 'z') == 0\nassert count_prefix_scan([], 'a') == 0\nprint('All tests passed!')"
  },
  // +++ STAGE 4 new +++
  {
    id: 35, stage: 4, title: "Multiple Prefix Queries via Repeated Scans", pattern: "naive prefix search", skill: "for each query prefix, scan entire word list fresh",
    statement: "Given a word list and a list of query prefixes, for each prefix count how many words start with it. Use a FRESH scan of the entire word list for each query — no caching, no trie. Return a list of counts and total character comparisons made. Show that m queries cost m * n * p comparisons.",
    examples: [
      { input: "words = ['apple','apply','apricot','banana'], queries = ['ap','b','z']", output: "([3, 1, 0], 20)", explain: "3 scans: ap checks 4 words, b checks 4, z checks 4" },
    ],
    why: "Multiple queries on the same word list expose the fundamental waste of scanning. Each query re-examines every word. With m queries of avg length p: total cost = m * n * p. The trie pays O(total_chars) once to build, then O(p + subtree_size) per query — effectively splitting the cost into build-once + query-cheap.",
    starterCode: "def multi_prefix_scan(words, queries):\n    pass",
    hints: [
      "For each query prefix, loop through all words and count startswith matches character by character.",
      "Track total character comparisons. For each word+query pair, compare up to len(query) characters.",
      "Return (counts_list, total_comparisons). The comparisons quantify the waste vs. a trie."
    ],
    solution: "def multi_prefix_scan(words, queries):\n    results = []\n    comparisons = 0\n    for q in queries:\n        count = 0\n        for w in words:\n            match = True\n            for j in range(len(q)):\n                comparisons += 1\n                if j >= len(w) or w[j] != q[j]:\n                    match = False\n                    break\n            if match:\n                count += 1\n        results.append(count)\n    return (results, comparisons)",
    walkthrough: "For each query, a fresh scan of every word. Query 'ap': check 'apple' (3 comparisons, match), 'apply' (3, match), 'apricot' (3, match), 'banana' (1 comparison at 'b' vs 'a', mismatch). Count=3. Then query 'b': start from scratch — 4 words × ~1 comparison each. Then 'z': 4 more. Total comparisons: ~20. A trie would do ~6 comparisons total for all three queries combined. The gap grows multiplicatively with m and n.",
    testCode: "counts, comps = multi_prefix_scan(['apple','apply','apricot','banana'], ['ap','b','z'])\nassert counts == [3,1,0]\nassert comps > 0\ncounts2, _ = multi_prefix_scan(['cat','car'], ['ca','d'])\nassert counts2 == [2,0]\nprint('All tests passed!')"
  },
  {
    id: 36, stage: 4, title: "Find Maximum Prefix Overlap via Pairwise Scan", pattern: "naive prefix search", skill: "O(n^2) pairwise comparison for max overlap",
    statement: "Given a word list, find the length of the longest shared prefix among all pairs of words AND return one pair achieving it. Use O(n^2) pairwise comparison. This is the naive answer to 'which two words are most similar?' Return (max_length, word_a, word_b).",
    examples: [
      { input: "words = ['interspecies','interstellar','interstate','banana']", output: "(5, 'interspecies', 'interstellar')", explain: "both start with 'inter' → length 5" },
      { input: "words = ['a','b','c']", output: "(0, 'a', 'b')", explain: "no overlapping prefix — return any pair" },
    ],
    why: "Finding the 'most similar pair' is a building block for clustering. The naive O(n^2) scan is simple and works for small lists. But for n=100k, it's ~5 billion comparisons. A trie can find this by walking its structure: the deepest node with ≥2 children identifies the best overlap — O(total_chars) total.",
    starterCode: "def max_overlap_pair(words):\n    pass",
    hints: [
      "Double loop over all pairs (i, j where i < j). For each, count matching leading chars.",
      "Track max_len, best_i, best_j. Update whenever a longer prefix is found.",
      "If max_len stays 0, return any pair (e.g., first two words). For n < 2, return (0, '', '')."
    ],
    solution: "def max_overlap_pair(words):\n    n = len(words)\n    if n < 2:\n        return (0, '', '')\n    max_len = 0\n    best_pair = (0, 1)\n    for i in range(n):\n        for j in range(i + 1, n):\n            k = 0\n            while k < len(words[i]) and k < len(words[j]) and words[i][k] == words[j][k]:\n                k += 1\n            if k > max_len:\n                max_len = k\n                best_pair = (i, j)\n    return (max_len, words[best_pair[0]], words[best_pair[1]])",
    walkthrough: "Check every unordered pair once. Track the running maximum. For ['interspecies','interstellar','interstate']: pair 0-1: i-n-t-e-r-s (6 matching). pair 0-2: i-n-t-e-r-s (6 matching). pair 1-2: i-n-t-e-r-s (6 matching). Best = 6, pair = (0,1). The trie equivalent: insert all words, then the deepest node with ≥2 children reveals the max overlap position — no pairwise loops needed. The trie structure itself answers the question.",
    testCode: "length, w1, w2 = max_overlap_pair(['interspecies','interstellar','interstate','banana'])\nassert length == 5\nlength2, w1b, w2b = max_overlap_pair(['a','b','c'])\nassert length2 == 0\nlength3, w1c, w2c = max_overlap_pair(['abc','abd','xyz'])\nassert length3 == 2\nprint('All tests passed!')"
  },
  // ═══ STAGE 5: Optimization ═══
  {
    id: 37, stage: 5, title: "Prefix Search O(p + results)", pattern: "trie prefix search", skill: "descend once, then DFS collect",
    statement: "Reimplement words_with_prefix as the optimized O(p + results) trie search. Descend to the prefix node in O(p), then DFS collects all terminal nodes in the subtree. Every result costs exactly the characters to output it.",
    examples: [
      { input: "trie of ['app','apple','apricot'], prefix = 'ap'", output: "['app','apple','apricot'] in O(p+results)" },
    ],
    why: "The O(p+results) guarantee is the trie's performance contract. Descent is p characters. Collection is proportional to output size. No scanning, no sorting, no work proportional to the total dictionary size.",
    starterCode: "def prefix_trie_search(root, prefix):\n    pass",
    hints: [
      "Walk to prefix node (O(p)). If doesn't exist, return [].",
      "DFS from the prefix node, appending terminal nodes' accumulated strings.",
      "The complexity: p steps down + output_size * avg_word_length. No dependency on total trie size."
    ],
    solution: "def prefix_trie_search(root, prefix):\n    node = root\n    for ch in prefix:\n        if ch not in node.children:\n            return []\n        node = node.children[ch]\n    results = []\n    def collect(n, path):\n        if n.is_end:\n            results.append(path)\n        for ch, child in n.children.items():\n            collect(child, path + ch)\n    collect(node, prefix)\n    return results",
    walkthrough: "Phase 1 (O(p)): navigate the spine of the trie following the prefix. You land at a node that represents the entire subtree of words with this prefix. Phase 2 (O(results)): DFS the subtree. Every terminal node contributes one word to results. The total work is the sum of output word lengths, plus p — independent of how many other words exist in the trie.",
    testCode: "root = build_trie(['app','apple','apricot','bat','ball'])\nassert prefix_trie_search(root, 'ap') == ['app','apple','apricot']\nassert prefix_trie_search(root, 'b') == ['ball','bat']\nassert prefix_trie_search(root, 'z') == []\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Wildcard DFS on Trie", pattern: "trie wildcard", skill: "DFS with '.' branching to all children",
    statement: "Implement wildcard_search(root, pattern) that searches a trie using DFS. Wildcard '.' matches any single letter. At a '.', branch into ALL children of the current node. This is the trie-optimized version of P25.",
    examples: [
      { input: "trie of ['cat','cot','cut','car'], pattern = 'c.t'", output: "['cat','cot','cut']" },
      { input: "trie of ['cat','cot','bat'], pattern = '.at'", output: "['bat','cat']" },
    ],
    why: "The trie prunes wildcard search: at a '.' character, instead of checking all possible letters (26), branch only into letters that actually appear as children. This turns O(26^dots) into O(branches^dots) — the trie's existing children dict IS the pruning.",
    starterCode: "def wildcard_trie(root, pattern):\n    pass",
    hints: [
      "DFS: state = (node, index in pattern, path so far).",
      "If pattern[i] != '.': if that char in children, recurse with i+1. Else dead end.",
      "If pattern[i] == '.': recurse into EVERY child in node.children — these are all valid next letters.",
      "At len(pattern): if node.is_end, add path to results."
    ],
    solution: "def wildcard_trie(root, pattern):\n    results = []\n    def dfs(node, i, path):\n        if i == len(pattern):\n            if node.is_end:\n                results.append(''.join(path))\n            return\n        ch = pattern[i]\n        if ch == '.':\n            for c in sorted(node.children.keys()):\n                path.append(c)\n                dfs(node.children[c], i + 1, path)\n                path.pop()\n        elif ch in node.children:\n            path.append(ch)\n            dfs(node.children[ch], i + 1, path)\n            path.pop()\n    dfs(root, 0, [])\n    return results",
    walkthrough: "DFS with branching at '.'. For pattern 'c.t': at 'c', go to child 'c' (one path). At '.', iterate ALL children of the 'c' node — if 'c' has children 'a' and 'o', try both. At 't': from 'a' node, check if 't' is a child. From 'o' node, check if 't' is a child. Paths that reach length 3 with is_end=True yield words: 'cat', 'cot'. 'cut' comes from 'c'→'u'→'t' (wait, 'u' isn't a child of 'c', this is different). Actually for ['cat','cot','cut'], 'c' has children 'a','o','u'. At position 2 (after '.'), each of 'a','o','u' is probed for child 't'. 'a' has 't' (cat), 'o' has 't' (cot), 'u' has 't' (cut).",
    testCode: "root = build_trie(['cat','cot','cut','car','bat'])\nassert sorted(wildcard_trie(root, 'c.t')) == ['cat','cot','cut']\nassert sorted(wildcard_trie(root, '.at')) == ['bat','cat']\nassert sorted(wildcard_trie(root, 'c..')) == ['car','cat','cot','cut']\nassert wildcard_trie(root, '...') == ['bat','car','cat','cot','cut']\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Autocomplete O(p + k)", pattern: "trie autocomplete", skill: "descend + DFS limit k",
    statement: "Implement autocomplete_trie(root, prefix, k) with O(p + k) output. Walk to prefix node, then DFS collecting up to k terminal words. Stop early once k results are found. Compare to the naive O(n log n) sort approach.",
    examples: [
      { input: "trie with 10000 words starting with 'a', prefix='a', k=3", output: "3 results, descent=1 char, collect=3 words" },
    ],
    why: "The trie's autocomplete cost is independent of dictionary size. Even with 1 million words, if the prefix subtree has k words, cost is O(p + k). The naive sort is O(n log n) every time, even for tiny k.",
    starterCode: "def autocomplete_trie(root, prefix, k):\n    pass",
    hints: [
      "Walk to prefix node O(p).",
      "DFS with early termination: if len(results) >= k, stop recursing.",
      "Lexicographic order via sorted(children.keys())."
    ],
    solution: "def autocomplete_trie(root, prefix, k):\n    node = root\n    for ch in prefix:\n        if ch not in node.children:\n            return []\n        node = node.children[ch]\n    results = []\n    def collect(n, path):\n        if len(results) >= k:\n            return\n        if n.is_end:\n            results.append(path)\n        for ch in sorted(n.children.keys()):\n            collect(n.children[ch], path + ch)\n    collect(node, prefix)\n    return results",
    walkthrough: "The k-cap early termination is the key optimization. Once results reach k, all recursive calls bail immediately — no more work. For a subtree with 100k words but k=3, you stop after finding the first 3 lexicographic terminal nodes. Descent: p steps. Collection: exactly k words of output length. Total: O(p + k * avg_word_len).",
    testCode: "root = build_trie(['a','aa','aaa','b','bb'])\nassert autocomplete_trie(root, 'a', 2) == ['a','aa']\nassert autocomplete_trie(root, 'a', 10) == ['a','aa','aaa']\nassert autocomplete_trie(root, 'b', 1) == ['b']\nassert autocomplete_trie(root, 'z', 3) == []\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "Longest Common Prefix O(total chars)", pattern: "trie LCP", skill: "build trie, walk single-child path",
    statement: "Implement longest common prefix of all words using a trie. Building the trie is O(total chars). Then walk from root while exactly one child and not terminal: O(p) where p is the prefix length. Total: O(total chars).",
    examples: [
      { input: "words = ['interspecies','interstellar','interstate']", output: "'inters'" },
    ],
    why: "The trie approach is O(N) total build + O(LCP) query. The scan approach from Stage 0 is O(N * LCP) for scanning word by word. The trie pays for itself across multiple LCP queries on the same dataset.",
    starterCode: "def lcp_trie(words):\n    pass",
    hints: [
      "Build the trie: O(total chars).",
      "Walk from root: while one child and not is_end, follow the single child, accumulate.",
      "If root has 0 children or >1 children, LCP is ''."
    ],
    solution: "def lcp_trie(words):\n    if not words:\n        return ''\n    root = build_trie(words)\n    node = root\n    lcp = ''\n    while len(node.children) == 1 and not node.is_end:\n        ch = next(iter(node.children))\n        lcp += ch\n        node = node.children[ch]\n    return lcp",
    walkthrough: "The trie naturally coalesces common prefixes into shared paths. After building, the longest common prefix is the longest path from root where exactly ONE child exists at each node (meaning all words agree on that character) AND no node is terminal (a word ending means divergence — shorter words don't share the full prefix). This is pure structural property, no counting needed.",
    testCode: "assert lcp_trie(['interspecies','interstellar','interstate']) == 'inters'\nassert lcp_trie(['flower','flow','flight']) == 'fl'\nassert lcp_trie(['dog','racecar','car']) == ''\nassert lcp_trie(['a','ab']) == 'a'\nassert lcp_trie([]) == ''\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 5, title: "Word Search with Trie Pruning", pattern: "trie + grid", skill: "DFS grid, prune paths not in trie",
    statement: "Given a 2D grid of letters and a trie of valid words, find if any word from the trie exists in the grid (moving adjacent horizontally/vertically). Use the trie to prune the DFS: if the current path prefix isn't in the trie, backtrack immediately.",
    examples: [
      { input: "grid = [['a','b'],['c','d']], words = ['ab','abd','ac']", output: "True, 'ab' found: (0,0)->(0,1)" },
      { input: "grid = [['a','b'],['c','d']], words = ['xyz']", output: "False" },
    ],
    why: "Grid word search explodes combinatorially (4^max_path). A trie prunes aggressively: if the prefix formed so far doesn't exist in the trie, the DFS stops. This is the same idea as wildcard search — use the trie to limit branching.",
    starterCode: "def word_search_grid(grid, root):\n    pass",
    hints: [
      "DFS from each cell: pass current node in trie. Only continue if grid[i][j] exists in node.children.",
      "If node.children[char].is_end: a word is found — return True or collect.",
      "Mark cell visited during path to avoid reuse."
    ],
    solution: "def word_search_grid(grid, root):\n    rows, cols = len(grid), len(grid[0])\n    def dfs(r, c, node):\n        ch = grid[r][c]\n        if ch not in node.children:\n            return False\n        next_node = node.children[ch]\n        if next_node.is_end:\n            return True\n        grid[r][c] = '#'\n        for dr, dc in [(0,1),(1,0),(0,-1),(-1,0)]:\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != '#':\n                if dfs(nr, nc, next_node):\n                    return True\n        grid[r][c] = ch\n        return False\n    for r in range(rows):\n        for c in range(cols):\n            if dfs(r, c, root):\n                return True\n    return False",
    walkthrough: "The trie cuts dead ends. Starting from a cell, check if its letter is a child of the current trie node. If not? The path won't lead to any word — backtrack. If yes, descend into the trie. If you hit is_end=True, a word is found. The visited marker prevents reusing cells. The trie turns an exponential grid DFS into a deeply pruned search.",
    testCode: "root = build_trie(['ab','abd','ac'])\ngrid = [['a','b'],['c','d']]\nassert word_search_grid(grid, root) == True\nroot2 = build_trie(['xyz'])\nassert word_search_grid(grid, root2) == False\nroot3 = build_trie(['acd','ac'])\ngrid2 = [['a','b'],['c','d']]\nassert word_search_grid(grid2, root3) == True\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 5, title: "Count Distinct Substrings via Trie", pattern: "trie substrings", skill: "insert all suffixes, count nodes",
    statement: "Given a string s, count the number of distinct substrings by inserting every suffix of s into a trie. The number of nodes (excluding root) equals the number of distinct substrings.",
    examples: [
      { input: "s = 'ababa'", output: "9", explain: "distinct substrings: a,b,ab,ba,aba,bab,abab,baba,ababa" },
      { input: "s = 'aaa'", output: "3", explain: "a,aa,aaa" },
    ],
    why: "Every distinct substring corresponds to a unique path from root in the suffix trie. Inserting all suffixes and counting nodes gives the answer. Time: O(n^2), space O(n^2) — but the connection to tries is profound: any string's substructure is a trie of its suffixes.",
    starterCode: "def count_distinct_substrings(s):\n    pass",
    hints: [
      "For each starting index i, insert the suffix s[i:] into the trie.",
      "Count total nodes in the trie (excluding root). Each node = one distinct substring.",
      "O(n^2) time and space. There are n(n+1)/2 possible substrings."
    ],
    solution: "def count_distinct_substrings(s):\n    root = TrieNode()\n    nodes = 0\n    for i in range(len(s)):\n        node = root\n        for j in range(i, len(s)):\n            ch = s[j]\n            if ch not in node.children:\n                node.children[ch] = TrieNode()\n                nodes += 1\n            node = node.children[ch]\n    return nodes",
    walkthrough: "Insert s[0:] ('ababa'): creates nodes a,b,a,b,a. Insert s[1:] ('baba'): creates nodes b,a,b,a (but some exist). Insert s[2:] ('aba'): nodes a,b,a (some exist). Continue. Each node created = one substring first seen. Total nodes = distinct substrings. For 'aaa': a, aa, aaa = 3. For 'ababa': 9 distinct.",
    testCode: "assert count_distinct_substrings('ababa') == 9\nassert count_distinct_substrings('aaa') == 3\nassert count_distinct_substrings('abc') == 6\nassert count_distinct_substrings('') == 0\nprint('All tests passed!')"
  },
  // +++ STAGE 5 new +++
  {
    id: 43, stage: 5, title: "Multiple Prefix Queries via Trie — Descend Once Per Query", pattern: "trie prefix search", skill: "pre-build trie, answer multiple prefix-count queries in O(p) each",
    statement: "Given a word list and a list of query prefixes, count how many words start with each prefix using a pre-built trie. For each query, walk to the prefix node in O(p), then DFS-count terminals in the subtree. This is the trie-optimized version of the Stage 4 naive multiple-scan approach.",
    examples: [
      { input: "words = ['apple','apply','apricot','banana','ball'], queries = ['ap','b','ba','z']", output: '[3, 2, 2, 0]' },
    ],
    why: "The trie converts m queries from O(m * n * p) to O(m * p + results). Build the trie once (O(total_chars)). Each query descends in O(p). The subtree DFS cost depends on output size, not dictionary size. This is the optimization that makes prefix search scalable to millions of queries.",
    starterCode: "def multi_prefix_trie(words, queries):\n    pass",
    hints: [
      "Build the trie from words once. For each query, walk to the prefix node.",
      "If the path exists, DFS the subtree to count terminal nodes. If not, count = 0.",
      "Return the list of counts. No precomputation needed beyond the trie itself."
    ],
    solution: "def multi_prefix_trie(words, queries):\n    root = build_trie(words)\n    result = []\n    for q in queries:\n        node = root\n        exists = True\n        for ch in q:\n            if ch not in node.children:\n                exists = False\n                break\n            node = node.children[ch]\n        if not exists:\n            result.append(0)\n            continue\n        def count_terminals(n):\n            c = 1 if n.is_end else 0\n            for child in n.children.values():\n                c += count_terminals(child)\n            return c\n        result.append(count_terminals(node))\n    return result",
    walkthrough: "Build once (O(total_chars)). Query 'ap': walk a→p (2 steps), DFS subtree counts 3 terminals ('app','apple','apricot'). Query 'b': walk b (1 step), DFS counts 2 terminals ('banana','ball'). Query 'ba': walk b→a (2 steps), same subtree → 2. Query 'z': dead end at root → 0. Per-query cost is independent of n=100k — only the prefix node's subtree size matters. The build cost is amortized across all queries.",
    testCode: "assert multi_prefix_trie(['apple','apply','apricot','banana','ball'], ['ap','b','ba','z']) == [3,2,2,0]\nassert multi_prefix_trie(['cat','car','cab'], ['ca','c','d']) == [3,3,0]\nassert multi_prefix_trie([], ['a']) == [0]\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 5, title: "Find All Words That Are Prefixes of Another Word", pattern: "trie prefix search", skill: "walk each word's path, check intermediate terminal nodes",
    statement: "Given a word list, find all words that appear as a prefix of another word in the list. Build a trie. For each word, walk its character path: if any INTERMEDIATE node (before the last character) has is_end=True, that prefix is a word AND a prefix of the current longer word. Return the qualifying words sorted.",
    examples: [
      { input: "words = ['a','ab','abc','abcd']", output: "['a','ab','abc']", explain: "'a' is prefix of 'ab','abc','abcd'; 'ab' is prefix of 'abc','abcd'; 'abc' is prefix of 'abcd'" },
      { input: "words = ['cat','dog']", output: "[]", explain: "neither is a prefix of the other" },
    ],
    why: "A word is a prefix of another if its terminal node sits on the path to the longer word's terminal. Walking each word, if any intermediate node has is_end=True, the word fragment so far is a prefix-word. The trie makes this check O(L) per word — no pairwise comparison. Compare to naive: O(n^2 * L) checking every pair.",
    starterCode: "def prefix_words(words):\n    pass",
    hints: [
      "Build the trie. Then for each word, walk character by character.",
      "At each step before the last character: if the current node has is_end=True, the prefix-so-far is a valid word — add it to results.",
      "Deduplicate: a word may be a prefix of multiple longer words. Use a set for results, then sort."
    ],
    solution: "def prefix_words(words):\n    if not words:\n        return []\n    root = build_trie(words)\n    result = set()\n    for w in words:\n        node = root\n        for i, ch in enumerate(w):\n            node = node.children[ch]\n            if node.is_end and i < len(w) - 1:\n                result.add(w[:i+1])\n    return sorted(result)",
    walkthrough: "Build trie. Walk each word: for 'abcd' — a (not terminal), ab (terminal! is_end=True at 'b' node, i=1 < 3 → 'ab' is a prefix of 'abcd'), abc (terminal! i=2 < 3 → 'abc' is a prefix), abcd (terminal but i=3 = last, skip). Add 'ab','abc'. Walk 'abc': ab (terminal, i=1 < 2 → add), abc (i=2, skip). Walk 'ab': a (terminal, i=0 < 1 → add 'a'). Walk 'a': only 1 char, no intermediate check. Result: {'ab','abc','a'} → sorted: ['a','ab','abc']. The trie replaces pairwise comparison with a single walk per word.",
    testCode: "assert prefix_words(['a','ab','abc','abcd']) == ['a','ab','abc']\nassert prefix_words(['cat','dog']) == []\nassert prefix_words(['app','apple','bat','banana']) == ['app']\nassert prefix_words(['abc','abc']) == []\nprint('All tests passed!')"
  },
  // ═══ STAGE 6: Mastery ═══
  {
    id: 45, stage: 6, title: "Word Search II — Trie + Grid Bridge", pattern: "trie + grid + backtracking", skill: "build trie, DFS grid with trie pruning",
    statement: "Given a 2D board of letters and a list of words, return all words from the list that can be formed by adjacent letters (horizontally/vertically). Use a trie built from the word list to prune the DFS. This is the canonical trie+backtracking problem.",
    examples: [
      { input: "board = [['o','a','a','n'],['e','t','a','e'],['i','h','k','r'],['i','f','l','v']], words = ['oath','pea','eat','rain']", output: "['oath','eat']" },
    ],
    why: "Trie meets grid. Without a trie, you'd DFS for each word individually — O(W * 4^L). With a trie, you DFS the grid once, following trie branches: O(4^L) but pruned to only paths in the trie. This is the canonical bridge between tries and backtracking.",
    starterCode: "def word_search_ii(board, words):\n    pass",
    hints: [
      "Build a trie from words. Mark is_end and store word at the node (or build path).",
      "DFS from each cell: check if character in node.children. If yes, descend. If node has word, add to result and clear to avoid duplicates.",
      "Mark visited cells with '#', restore after recursion."
    ],
    solution: "def word_search_ii(board, words):\n    root = TrieNode()\n    for w in words:\n        node = root\n        for ch in w:\n            if ch not in node.children:\n                node.children[ch] = TrieNode()\n            node = node.children[ch]\n        node.is_end = True\n    result = []\n    rows, cols = len(board), len(board[0])\n    def dfs(r, c, node, path):\n        ch = board[r][c]\n        if ch not in node.children:\n            return\n        node = node.children[ch]\n        path.append(ch)\n        if node.is_end:\n            result.append(''.join(path))\n            node.is_end = False\n        board[r][c] = '#'\n        for dr, dc in [(0,1),(1,0),(0,-1),(-1,0)]:\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < rows and 0 <= nc < cols and board[nr][nc] != '#':\n                dfs(nr, nc, node, path)\n        board[r][c] = ch\n        path.pop()\n    for r in range(rows):\n        for c in range(cols):\n            dfs(r, c, root, [])\n    return result",
    walkthrough: "Build trie from words (O(W * L)). DFS from every cell, using the trie as a prefix filter. The trie's children dict tells you which directions are worth exploring. When is_end hits, a word is found — record it and clear is_end (dedup). Path tracking assembles the word. Backtracking restores board and path state. The trie compresses all words into one search tree; the grid explores once.",
    testCode: "b = [['o','a','a','n'],['e','t','a','e'],['i','h','k','r'],['i','f','l','v']]\nwords = ['oath','pea','eat','rain']\nr = sorted(word_search_ii(b, words))\nassert r == ['eat','oath']\nb2 = [['a','b'],['c','d']]\nassert word_search_ii(b2, ['ab','cd','ac']) == ['ab','ac']\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Maximum XOR Pair — Binary Trie + Bit Bridge", pattern: "trie + bit manipulation", skill: "build binary trie, greedy complement search",
    statement: "Given an array of integers, find two numbers whose XOR is maximum. Build a binary trie (base 2, each node has at most children[0] and children[1]). For each number, search for its bitwise complement in the trie to maximize XOR.",
    examples: [
      { input: "nums = [3,10,5,25,2,8]", output: "28", explain: "5 XOR 25 = 28" },
      { input: "nums = [0]", output: "0" },
    ],
    why: "XOR maximization via binary trie is a brilliant bridge: each bit tries to go the opposite direction of the current number's bit. If that path exists, it adds 2^bit_position to the result. The trie turns O(n^2) brute force into O(n * bits) — typically O(31*n).",
    starterCode: "def max_xor(nums):\n    pass",
    hints: [
      "Build a binary trie: each number's 31 bits (MSB first) inserted as a path of 0/1 children.",
      "For each number: walk the trie, preferring the opposite bit at each step for maximum XOR.",
      "If the opposite bit's child exists, add 2^(bit_pos) to the running XOR and go that way. Otherwise, go the same bit's direction (adding 0)."
    ],
    solution: "class BitNode:\n    def __init__(self):\n        self.children = {}\n\ndef max_xor(nums):\n    root = BitNode()\n    for n in nums:\n        node = root\n        for i in range(31, -1, -1):\n            bit = (n >> i) & 1\n            if bit not in node.children:\n                node.children[bit] = BitNode()\n            node = node.children[bit]\n    max_val = 0\n    for n in nums:\n        node = root\n        curr = 0\n        for i in range(31, -1, -1):\n            bit = (n >> i) & 1\n            opposite = 1 - bit\n            if opposite in node.children:\n                curr += (1 << i)\n                node = node.children[opposite]\n            else:\n                node = node.children[bit]\n        max_val = max(max_val, curr)\n    return max_val",
    walkthrough: "Insert each number as a 32-bit path (MSB→LSB). Then for each number, traverse the trie greedily: at each bit position, try to take the OPPOSITE bit's child first (maximizes XOR at that position). If the opposite child exists, you add 2^i to the XOR and go that way. If not, take the same bit (adds 0). By bit 31 being most significant, the greedy choice is optimal — maximizing higher bits dominates lower bits.",
    testCode: "assert max_xor([3,10,5,25,2,8]) == 28\nassert max_xor([0]) == 0\nassert max_xor([2,4]) == 6\nassert max_xor([8,10,2]) == 10\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Replace Words — Trie for Prefix Replacement", pattern: "trie + string processing", skill: "build trie of roots, replace words with shortest matching prefix",
    statement: "Given a list of root words and a sentence string, replace each word in the sentence with the shortest root that is a prefix of that word. If no root matches, keep the word. Use a trie built from the roots.",
    examples: [
      { input: "roots = ['cat','bat','rat'], sentence = 'the cattle was rattled by the battery'", output: "'the cat was rat by the bat'" },
    ],
    why: "This is a prefix replacement problem — search for the shortest matching root prefix for each word. A trie stores all roots and finds the shortest match in one descent. Compose: trie prefix search + string tokenization.",
    starterCode: "def replace_words(roots, sentence):\n    pass",
    hints: [
      "Build a trie from roots. For each word in sentence, walk the trie character by character.",
      "As soon as you hit is_end, you've found the shortest root prefix — use that.",
      "If you fall off the trie mid-word, no root matches — keep the original word."
    ],
    solution: "def replace_words(roots, sentence):\n    root = TrieNode()\n    for r in roots:\n        node = root\n        for ch in r:\n            if ch not in node.children:\n                node.children[ch] = TrieNode()\n            node = node.children[ch]\n        node.is_end = True\n    words = sentence.split()\n    result = []\n    for w in words:\n        node = root\n        replacement = None\n        for i, ch in enumerate(w):\n            if ch not in node.children:\n                break\n            node = node.children[ch]\n            if node.is_end:\n                replacement = w[:i+1]\n                break\n        result.append(replacement if replacement else w)\n    return ' '.join(result)",
    walkthrough: "For each word in the sentence, walk the trie. The moment you encounter is_end=True, stop — that's the shortest matching root. 'cattle': walk c→a→t, at 't' is_end=True if 'cat' is a root → replace with 'cat'. 'rattled': r→a→t, 't' marks 'rat' → replace. 'battery': b→a→t, 't' marks 'bat' → replace. 'the': walk 't', no path continues, keep 'the'.",
    testCode: "roots = ['cat','bat','rat']\nsentence = 'the cattle was rattled by the battery'\nexpected = 'the cat was rat by the bat'\nassert replace_words(roots, sentence) == expected\nassert replace_words(['a','aa'], 'aa aab') == 'a a'\nassert replace_words(['z'], 'hello world') == 'hello world'\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "Top K Frequent Words — Trie + Heap Bridge", pattern: "trie + heap", skill: "count frequencies with trie, top-k with heap",
    statement: "Given a list of words, return the k most frequent words, sorted by frequency (descending) then lexicographically (ascending). Use the frequency-augmented trie to count, then a heap (or sorting) to select the top k.",
    examples: [
      { input: "words = ['i','love','leetcode','i','love','coding'], k = 2", output: "['i','love']" },
      { input: "words = ['the','day','is','sunny','the','the','the','sunny','is','is'], k = 4", output: "['the','is','sunny','day']" },
    ],
    why: "Trie handles counting (O(total chars)). Heap finds top k in O(n log k). Together: composition. The trie provides frequency data, the heap ranks it. Two data structures, one solution — the hallmark of mastery problems.",
    starterCode: "def top_k_frequent(words, k):\n    import heapq\n    pass",
    hints: [
      "Use the frequency-augmented trie from P23 to count word frequencies.",
      "DFS the trie to collect (frequency, word) pairs.",
      "Use a min-heap of size k (or sort with custom key). For heap: push (-freq, word) and pop k times, or push (freq, word) and keep size k."
    ],
    solution: "def top_k_frequent(words, k):\n    import heapq\n    root = TrieNodeFreq()\n    for w in words:\n        insert_freq(root, w)\n    pairs = []\n    def collect(node, path):\n        if node.is_end:\n            pairs.append((-node.count, path))\n        for ch in sorted(node.children.keys()):\n            collect(node.children[ch], path + ch)\n    collect(root, '')\n    heapq.heapify(pairs)\n    result = []\n    for _ in range(k):\n        if pairs:\n            _, word = heapq.heappop(pairs)\n            result.append(word)\n    return result",
    walkthrough: "Insert all words into frequency trie (O(total chars)). DFS collects (-count, word) pairs — negating count makes it a min-heap that sorts by most frequent. heapify is O(n). Pop k times for O(k log n). Result is frequency descending, and because DFS visited alphabetically and heapq is stable for equal values, lexicographic order within same frequency is maintained.",
    testCode: "r = top_k_frequent(['i','love','leetcode','i','love','coding'], 2)\nassert r == ['i','love']\nr2 = top_k_frequent(['the','day','is','sunny','the','the','the','sunny','is','is'], 4)\nassert r2 == ['the','is','sunny','day']\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 6, title: "Implement Magic Dictionary", pattern: "trie + fuzzy search", skill: "search with exactly one character mismatch",
    statement: "Implement a Magic Dictionary that stores words and can return True if there exists a word in the dictionary that differs from the query by exactly one character (same length). Use a trie to support the search efficiently.",
    examples: [
      { input: "dictionary = ['hello','leetcode'], search 'hhllo'", output: "True", explain: "'hello' differs by 1 char (e→h)" },
      { input: "dictionary = ['hello','leetcode'], search 'hell'", output: "False", explain: "different length" },
      { input: "dictionary = ['hello','leetcode'], search 'leetcoded'", output: "False" },
    ],
    why: "Fuzzy search with exactly one error via trie: DFS with a 'mismatch budget' of 1. At each character, try the exact match path AND (if budget > 0) the alternative character paths. The trie's children dict makes alternative-branching natural.",
    starterCode: "def magic_dict_search(root, word):\n    pass",
    hints: [
      "DFS(node, index, mismatch_used). Base: if index == len(word), return mismatch_used == 1 and node.is_end.",
      "At word[index]: first try the exact match if it exists in children.",
      "If mismatch_used == 0: try ALL other children (any character != word[index]) with mismatch_used=1.",
      "Length must be equal — extra chars or missing chars = False."
    ],
    solution: "def magic_dict_search(root, word):\n    def dfs(node, i, used):\n        if i == len(word):\n            return used == 1 and node.is_end\n        ch = word[i]\n        if ch in node.children:\n            if dfs(node.children[ch], i + 1, used):\n                return True\n        if used == 0:\n            for c in node.children:\n                if c != ch:\n                    if dfs(node.children[c], i + 1, 1):\n                        return True\n        return False\n    return dfs(root, 0, 0)",
    walkthrough: "DFS with a boolean flag used tracking whether we've already consumed our one mismatch. At each level: first try the exact path (no mismatch consumed), then if we haven't used our budget yet, try ALL alternative children with used=1. For 'hhllo': h→e? Used=1 (budget spent), e→h? No match, backtrack; try r at position 0? No 'r' child of root. Eventually path h(alt)→h→l→l→o with exactly one substitution reaches is_end=True.",
    testCode: "root = build_trie(['hello','leetcode'])\nassert magic_dict_search(root, 'hhllo') == True\nassert magic_dict_search(root, 'hell') == False\nassert magic_dict_search(root, 'leetcoded') == False\nassert magic_dict_search(root, 'hello') == False\nroot2 = build_trie(['hello','hallo'])\nassert magic_dict_search(root2, 'hallo') == True\nassert magic_dict_search(root2, 'hello') == True\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Concatenated Words", pattern: "trie + DP", skill: "trie for prefix lookup, DP to check concatenation",
    statement: "Given a list of words, find all words that can be formed by concatenating two or more other words from the list (each word can be reused). Build a trie of all words, then for each word use DP (or DFS) with the trie to check if it's a concatenation.",
    examples: [
      { input: "words = ['cat','cats','dog','catsdog']", output: "['catsdog']", explain: "'catsdog' = 'cats' + 'dog'" },
      { input: "words = ['a','b','ab','abc']", output: "['ab','abc']", explain: "'ab' = 'a'+'b', 'abc' = 'a'+'b'+'c' or 'ab'+'c'" },
    ],
    why: "Trie provides O(L) prefix lookup for the DP. For each word, DP[i] = can word[0:i] be formed? Check all j < i where word[j:i] is in the trie and DP[j] is True. The trie turns substring lookup from O(L^2) to O(L^2) with O(1) per check.",
    starterCode: "def concatenated_words(words):\n    pass",
    hints: [
      "Build a trie with all words. Mark is_end for each.",
      "Sort words by length. For each word, use DP: can_break[i] = there exists j < i where word[j:i] in trie and can_break[j].",
      "Exclude the word itself as a match — if DP checks count only shorter words, or set a minimum of 2+ words."
    ],
    solution: "def concatenated_words(words):\n    root = build_trie(words)\n    result = []\n    words.sort(key=len)\n    for w in words:\n        if not w:\n            continue\n        dp = [False] * (len(w) + 1)\n        dp[0] = True\n        for i in range(1, len(w) + 1):\n            node = root\n            for j in range(i - 1, -1, -1):\n                ch = w[j]\n                if ch not in node.children:\n                    break\n                node = node.children[ch]\n                if node.is_end and dp[j]:\n                    dp[i] = True\n                    break\n        if dp[len(w)]:\n            result.append(w)\n    return result",
    walkthrough: "Sort words by length — shorter words can form longer ones. For each word, DP: can_break[i] is True if word[0:i] can be segmented into dictionary words. The inner loop checks from i-1 backward: follow the trie from word[j] to word[i-1]. If that substring is a word (is_end) AND prefix can_break[j] is True, segment is valid. A concatenated word must use 2+ pieces — the DP naturally enforces this since the full word itself doesn't trigger a single-piece solution (exclude self-check).",
    testCode: "r = concatenated_words(['cat','cats','dog','catsdog'])\nassert 'catsdog' in r\nr2 = concatenated_words(['a','b','ab','abc'])\nassert sorted(r2) == ['ab','abc']\nr3 = concatenated_words(['cat','dog','catdog'])\nassert 'catdog' in r3\nprint('All tests passed!')"
  },
]

export const buildTrieCode = `
class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

def build_trie(words):
    root = TrieNode()
    for word in words:
        node = root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True
    return root
`
