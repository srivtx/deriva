import type { OneProblem } from "./one"

export const PROBLEMS_ONE_H: OneProblem[] = [
  {
    id: 113, stage: 20, title: "GCD And LCM", pattern: "Euclid's algorithm", skill: "the oldest algorithm still running", difficulty: "Easy",
    statement: "Implement gcd(a, b) with the subtraction-free Euclid recurrence and lcm(a, b) built on top of it.",
    examples: [
      { input: "gcd(48, 18)", output: "6" },
      { input: "lcm(4, 6)", output: "12" },
    ],
    why: "gcd(a, b) = gcd(b, a mod b) works because any common divisor of a and b divides a mod b too — the divisor set literally shrinks with the numbers, terminating in O(log min) steps. This is the seed of modular arithmetic, ext-gcd, and every 'divisibility' contest problem; knowing WHY it terminates is worth more than the two lines.",
    starterCode: "def gcd(a, b):\n    pass",
    hints: [
      "While b != 0: a, b = b, a % b.",
      "lcm(a, b) * gcd(a, b) == a * b — so lcm = a // gcd * b (divide first to avoid huge intermediates).",
      "gcd(x, 0) == x is the base case the loop lands on."
    ],
    solution: "def gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a\n\ndef lcm(a, b):\n    return a // gcd(a, b) * b",
    walkthrough: "gcd(48, 18): (48,18) → (18,12) → (12,6) → (6,0) → 6. Each remainder is smaller than the previous b, so the pair strictly shrinks — at worst Fibonacci-slow, which is still logarithmic. lcm built as a // gcd * b reuses one pass instead of factoring both numbers.",
    testCode: "assert gcd(48, 18) == 6\nassert gcd(17, 5) == 1\nassert gcd(0, 5) == 5\nassert lcm(4, 6) == 12\nassert lcm(3, 7) == 21\nprint('All tests passed!')"
  },
  {
    id: 114, stage: 20, title: "Count Primes", pattern: "sieve of Eratosthenes", skill: "kill composites by their smallest factor", difficulty: "Medium",
    statement: "Return the number of primes strictly below n. Do better than testing each number — cross out composites in bulk.",
    examples: [
      { input: "n = 10", output: "4", explain: "2, 3, 5, 7" },
      { input: "n = 20", output: "8" },
    ],
    why: "Trial division per number is O(n·sqrt(n)). The sieve inverts the question: instead of asking 'is this prime?', mark everything composite — and the key optimization is starting each strike-through at p² (smaller multiples were already killed by smaller primes). O(n log log n): the oldest algorithm in the book is still near-linear.",
    starterCode: "def primes_below(n):\n    pass",
    hints: [
      "Make a boolean array is_prime[0..n-1], all True except 0 and 1.",
      "For each p from 2 while p * p < n: if is_prime[p], mark multiples p*p, p*p + p, ... False.",
      "Count the survivors."
    ],
    solution: "def primes_below(n):\n    if n <= 2:\n        return 0\n    is_prime = [True] * n\n    is_prime[0] = is_prime[1] = False\n    p = 2\n    while p * p < n:\n        if is_prime[p]:\n            for multiple in range(p * p, n, p):\n                is_prime[multiple] = False\n        p += 1\n    return sum(is_prime)",
    walkthrough: "Every composite < n has a prime factor <= sqrt(n), so the outer loop stops at p*p — everything else is already handled. Starting strikes at p² is safe because 2p, 3p, ... were struck by earlier primes. The count is just the sum of the boolean array — sieves answer COUNTING questions as a side effect.",
    testCode: "assert primes_below(10) == 4\nassert primes_below(20) == 8\nassert primes_below(2) == 0\nassert primes_below(3) == 1\nprint('All tests passed!')"
  },
  {
    id: 115, stage: 20, title: "Fast Power", pattern: "binary exponentiation", skill: "square the halved exponent", difficulty: "Medium",
    statement: "Compute base^exponent mod m without looping exponent times. Both fits in normal integers.",
    examples: [
      { input: "base = 2, exponent = 10, m = 1000", output: "24", explain: "1024 mod 1000" },
      { input: "base = 3, exponent = 7, m = 50", output: "37", explain: "2187 mod 50" },
    ],
    why: "x^10 = (x²)⁵ — squaring halves the exponent, which is stage 0's halving shape hiding inside arithmetic. O(log e) multiplications instead of O(e): this is what makes modular exponentiation usable when the exponent is a 9-digit number, and it is the engine behind RSA, diffie-hellman, and problem 15's Fibonacci matrix power on the ICPC ladder.",
    starterCode: "def pow_mod(base, exponent, m):\n    pass",
    hints: [
      "Keep result = 1. While exponent > 0:",
      "If the lowest bit is set, multiply result by base (mod m).",
      "Square base and shift the exponent right: base = base * base % m; exponent >>= 1."
    ],
    solution: "def pow_mod(base, exponent, m):\n    result = 1\n    base %= m\n    while exponent > 0:\n        if exponent & 1:\n            result = result * base % m\n        base = base * base % m\n        exponent >>= 1\n    return result",
    walkthrough: "Reading the exponent in binary: 10 = 1010₂, so x^10 = x^8 · x^2 — the loop multiplies in exactly the set bits' powers, each obtained by squaring the previous. Taking mod at every step keeps numbers small (the modular reduction is legal because (a·b) mod m = (a mod m · b mod m) mod m). Eight squarings reach exponent 10⁹.",
    testCode: "assert pow_mod(2, 10, 1000) == 24\nassert pow_mod(3, 7, 50) == 37\nassert pow_mod(2, 0, 13) == 1\nassert pow_mod(5, 3, 7) == 6\nprint('All tests passed!')"
  },
  {
    id: 116, stage: 20, title: "Happy Number", pattern: "cycle detection on digits", skill: "the sequence must eventually repeat", difficulty: "Easy",
    statement: "Repeatedly replace n with the sum of the squares of its digits. Return True if this process reaches 1 (and stays there), False if it cycles forever without reaching 1.",
    examples: [
      { input: "n = 19", output: "True", explain: "19 -> 82 -> 68 -> 100 -> 1" },
      { input: "n = 2", output: "False" },
    ],
    why: "You cannot loop 'until it reaches 1' — unhappy numbers never do. The escape: the digit-square sum of any number below 1000 stays below 1000, so the sequence MUST repeat — it is a functional graph, and 'unhappy' means stuck in a cycle not containing 1. A set detects the repeat; Floyd's tortoise-and-hare from problem 43 detects it with O(1) memory. Same linked-list trick, new linked list.",
    starterCode: "def is_happy(n):\n    pass",
    hints: [
      "next_num(n) = sum of int(d) ** 2 over the digits.",
      "Keep a set of seen values; if next_num lands on a repeat, return False.",
      "If you reach 1, return True."
    ],
    solution: "def is_happy(n):\n    seen = set()\n    while n != 1 and n not in seen:\n        seen.add(n)\n        n = sum(int(d) ** 2 for d in str(n))\n    return n == 1",
    walkthrough: "The pigeonhole forces a repeat: finitely many possible values, infinitely many steps. 19 chains to 1; 2 falls into the 4 → 16 → 37 → 58 → 89 → 145 → 42 → 20 → 4 cycle. The set version is clean; the Floyd version (slow = one step, fast = two, meet inside the cycle) is the same code as problem 43 with next_num as the .next pointer.",
    testCode: "assert is_happy(19) == True\nassert is_happy(1) == True\nassert is_happy(7) == True\nassert is_happy(2) == False\nassert is_happy(4) == False\nprint('All tests passed!')"
  },
  {
    id: 117, stage: 20, title: "Trailing Zeroes", pattern: "count the limiting factor", skill: "fives are rarer than twos", difficulty: "Medium",
    statement: "Return the number of trailing zeroes in n! — without computing n! (it can have millions of digits).",
    examples: [
      { input: "n = 25", output: "6" },
      { input: "n = 100", output: "24" },
    ],
    why: "A trailing zero is a factor of 10 = 2 × 5, and fives are always scarcer in a factorial. So the answer is the total power of 5 dividing n! — floor(n/5) + floor(n/25) + floor(n/125) + ... (Legendre's formula): multiples of 25 contribute a SECOND five, multiples of 125 a third. 'Find the scarce resource' converts an uncomputable product into a three-term sum.",
    starterCode: "def trailing_zeroes(n):\n    pass",
    hints: [
      "Count = n // 5, then keep dividing: n //= 5 and add, until n is 0.",
      "25 contributes two fives — the second loop iteration catches it.",
      "Never compute the factorial."
    ],
    solution: "def trailing_zeroes(n):\n    count = 0\n    power = 5\n    while power <= n:\n        count += n // power\n        power *= 5\n    return count",
    walkthrough: "25! has 25/5 = 5 multiples of 5 plus 25/25 = 1 extra (25 = 5²) → 6 zeroes. The loop is floor-division by growing powers of five — at most log₅(n) rounds. The general lesson: when a product's property depends on prime factorization, count each prime's contribution separately and take the minimum.",
    testCode: "assert trailing_zeroes(25) == 6\nassert trailing_zeroes(100) == 24\nassert trailing_zeroes(5) == 1\nassert trailing_zeroes(4) == 0\nassert trailing_zeroes(0) == 0\nprint('All tests passed!')"
  },
  {
    id: 118, stage: 20, title: "Unique BST Count", pattern: "Catalan recurrence", skill: "split at the root", difficulty: "Hard",
    statement: "Given n distinct values 1..n, return how many structurally distinct binary search trees they can form.",
    examples: [
      { input: "n = 3", output: "5" },
      { input: "n = 4", output: "14" },
      { input: "n = 10", output: "16796" },
    ],
    why: "Fix the root at value r: the left subtree is a BST on r−1 smaller values, the right on n−r larger — independent subproblems whose counts MULTIPLY. Summing over r gives the Catalan recurrence C(n) = Σ C(i)·C(n−1−i). This 'root splits the problem' move is tree DP (stage 15's #90) in counting form, and Catalan numbers ambush a third of all combinatorial problems.",
    starterCode: "def num_trees(n):\n    pass",
    hints: [
      "count[0] = 1 (the empty tree — one way to build nothing).",
      "count[n] = sum over root size i of count[i] * count[n - 1 - i].",
      "The values only matter as COUNTS — 1..n and any n distinct values give the same shape count."
    ],
    solution: "def num_trees(n):\n    count = [0] * (n + 1)\n    count[0] = 1\n    for size in range(1, n + 1):\n        for left in range(size):\n            count[size] += count[left] * count[size - 1 - left]\n    return count[n]",
    walkthrough: "count[size] is built bottom-up: every tree of size `size` is (some left shape) × (some right shape) around a root, and the products partition the possibilities with no double counting. n = 3: C(0)C(2) + C(1)C(1) + C(2)C(0) = 2 + 1 + 2 = 5. The same recurrence counts balanced parentheses, triangulations, and mountain ranges — meet it once, recognize it forever.",
    testCode: "assert num_trees(3) == 5\nassert num_trees(1) == 1\nassert num_trees(4) == 14\nassert num_trees(10) == 16796\nassert num_trees(0) == 1\nprint('All tests passed!')"
  },
  {
    id: 119, stage: 21, title: "Valid Anagram", pattern: "counting map", skill: "multiset equality", difficulty: "Easy",
    statement: "Return True if t is an anagram of s — same letters, same multiplicities, any order.",
    examples: [
      { input: "s = 'anagram', t = 'nagaram'", output: "True" },
      { input: "s = 'rat', t = 'car'", output: "False" },
    ],
    why: "Sorting both strings works in O(n log n); the counting map does it in O(n) — and the map generalizes where sorting does not (unicode, streaming, 'can I form t from letters of s?' with leftovers). The humble counter is the right tool; knowing both answers and WHY the map is better is the point.",
    starterCode: "def is_anagram(s, t):\n    pass",
    hints: [
      "Lengths must match — check first.",
      "Count letters of s; decrement for t.",
      "Anagram iff no count ever goes negative and ends all zero — the decrement loop makes both automatic."
    ],
    solution: "def is_anagram(s, t):\n    if len(s) != len(t):\n        return False\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    for ch in t:\n        if counts.get(ch, 0) == 0:\n            return False\n        counts[ch] -= 1\n    return True",
    walkthrough: "Equal lengths + every decrement succeeds ⟹ all counts hit exactly zero (they started summing to len(s) and len(t) decrements were absorbed). The early exit on an exhausted letter catches 'rat'/'car' instantly. This multiset-diff pattern powers minimum-window (problem 16) and group-anagram next.",
    testCode: "assert is_anagram('anagram', 'nagaram') == True\nassert is_anagram('rat', 'car') == False\nassert is_anagram('a', 'ab') == False\nassert is_anagram('', '') == True\nprint('All tests passed!')"
  },
  {
    id: 120, stage: 21, title: "Group Anagrams", pattern: "canonical key", skill: "collapse to the representative", difficulty: "Medium",
    statement: "Group a list of words into anagram classes. Return the groups with each group's words sorted, and the list of groups sorted.",
    examples: [
      { input: "words = ['eat', 'tea', 'tan', 'ate', 'nat', 'bat']", output: "[['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']]" },
      { input: "words = ['a']", output: "[['a']]" },
    ],
    why: "One idea does everything: find a CANONICAL FORM — a function f where f(x) = f(y) iff x and y are anagrams (sorted letters, or a 26-count tuple). Then grouping is a dict keyed by the form. Choosing the right equivalence-class representative is the whole design move; hash the signature, not the data.",
    starterCode: "def group_anagrams(words):\n    pass",
    hints: [
      "key = ''.join(sorted(word)).",
      "groups[key].append(word) with a defaultdict-style dict.",
      "Return sorted(sorted(group) for each group) for deterministic output."
    ],
    solution: "def group_anagrams(words):\n    groups = {}\n    for word in words:\n        key = ''.join(sorted(word))\n        groups.setdefault(key, []).append(word)\n    return sorted(sorted(g) for g in groups.values())",
    walkthrough: "'eat', 'tea', 'ate' all hash to 'aet' — one dict entry, three members. Sorted-letter keys cost O(k log k) per word; a 26-slot count tuple costs O(k) and wins for very long words. The deterministic double sort is presentation, not algorithm — but in testing it is the difference between a flaky and a provable answer.",
    testCode: "assert group_anagrams(['eat', 'tea', 'tan', 'ate', 'nat', 'bat']) == [['ate', 'eat', 'tea'], ['bat'], ['nat', 'tan']]\nassert group_anagrams(['a']) == [['a']]\nassert group_anagrams([]) == []\nprint('All tests passed!')"
  },
  {
    id: 121, stage: 21, title: "Longest Palindrome Build", pattern: "pair counting", skill: "pairs plus maybe a center", difficulty: "Medium",
    statement: "Return the length of the longest palindrome that can be BUILT by rearranging (a subset of) the letters of s.",
    examples: [
      { input: "s = 'abccccdd'", output: "7", explain: "'dccaccd'" },
      { input: "s = 'a'", output: "1" },
    ],
    why: "You do not need to construct the palindrome — just count its parts: every pair of identical letters contributes 2, and if any letter has an odd count left over, exactly one can sit in the middle. The greedy is forced, not chosen: pairs are unconditionally usable. Counting what a structure is MADE OF instead of building it is a recurring simplification.",
    starterCode: "def longest_pal_len(s):\n    pass",
    hints: [
      "Count letters. For each count, add count // 2 * 2 (the even part).",
      "If ANY count is odd, one extra center character can be added — but only one.",
      "Track a flag while summing."
    ],
    solution: "def longest_pal_len(s):\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    length = 0\n    has_odd = False\n    for c in counts.values():\n        length += c // 2 * 2\n        if c % 2 == 1:\n            has_odd = True\n    return length + 1 if has_odd else length",
    walkthrough: "'abccccdd': pairs give 2 + 4 + 2 = 8? No — 'a' gives 0 pairs (count 1), 'b' gives 0, 'c' gives 4, 'd' gives 2 → 6, plus one odd letter as center → 7. The construction never matters; the arithmetic of pairs is the answer. O(n) with a dict — versus O(n²) to try every arrangement.",
    testCode: "assert longest_pal_len('abccccdd') == 7\nassert longest_pal_len('a') == 1\nassert longest_pal_len('Aa') == 1\nassert longest_pal_len('') == 0\nassert longest_pal_len('aaa') == 3\nprint('All tests passed!')"
  },
  {
    id: 122, stage: 21, title: "Rolling Hash Search", pattern: "Rabin-Karp", skill: "hash the window, slide the hash", difficulty: "Hard",
    statement: "Return all starting indices where pattern occurs in text — using a rolling hash (Rabin-Karp), not KMP.",
    examples: [
      { input: "text = 'aabaabaaa', pattern = 'aab'", output: "[0, 3]" },
      { input: "text = 'aaaa', pattern = 'aa'", output: "[0, 1, 2]" },
    ],
    why: "KMP (problem 94) compares intelligently; Rabin-Karp compares CHEAPLY: a window's hash updates in O(1) per slide (remove the leading character's contribution, add the trailing one), so all windows hash in O(n) and full comparisons run only on hash hits. Same problem, opposite philosophy — and when searching for MANY patterns at once, Rabin-Karp's hash-set of fingerprints wins outright. Two search families, chosen by context.",
    starterCode: "def rabin_karp(text, pattern):\n    pass",
    hints: [
      "Hash = sum of ord(c) * B^i over the window, mod a large prime; B = 256.",
      "Precompute B^(m-1) to know what to subtract when the window slides.",
      "On hash match, verify with a direct slice compare (guards against collisions)."
    ],
    solution: "def rabin_karp(text, pattern):\n    n, m = len(text), len(pattern)\n    if m == 0 or m > n:\n        return []\n    B = 256\n    MOD = (1 << 61) - 1\n    power = pow(B, m - 1, MOD)\n    phash = 0\n    whash = 0\n    for i in range(m):\n        phash = (phash * B + ord(pattern[i])) % MOD\n        whash = (whash * B + ord(text[i])) % MOD\n    hits = []\n    for i in range(n - m + 1):\n        if whash == phash and text[i:i + m] == pattern:\n            hits.append(i)\n        if i < n - m:\n            whash = ((whash - ord(text[i]) * power) * B + ord(text[i + m])) % MOD\n    return hits",
    walkthrough: "The slide is algebra: new_hash = (old − leading·B^(m−1)) · B + trailing. Python's big-int mod keeps the arithmetic exact; the slice check makes a collision impossible to report (hashing is a filter, not a verdict). Average O(n + m); the same fingerprint idea powers plagiarism detection and substring dedup.",
    testCode: "assert rabin_karp('aabaabaaa', 'aab') == [0, 3]\nassert rabin_karp('aaaa', 'aa') == [0, 1, 2]\nassert rabin_karp('abc', 'x') == []\nassert rabin_karp('hello', 'hello') == [0]\nprint('All tests passed!')"
  },
  {
    id: 123, stage: 21, title: "Z Function", pattern: "longest common prefix array", skill: "reuse the box you already matched", difficulty: "Hard",
    statement: "Compute the Z-array of a string: z[i] = the length of the longest prefix of s that is also a prefix of s[i:].",
    examples: [
      { input: "s = 'aabxaab'", output: "[0, 1, 0, 0, 3, 1, 0]", explain: "z[4] = 3 because 'aab' restarts at index 4" },
      { input: "s = 'aaaa'", output: "[0, 3, 2, 1]" },
    ],
    why: "The Z-function is KMP's failure function seen from the text's side — 'how much of the prefix matches HERE'. The clever part is the maintained box [l, r]: a previously discovered match segment. If i sits inside it, s[i] equals s[i − l], so z[i] starts at min(r − i + 1, z[i − l]) instead of 0 — amortized linear, the same 'never re-examine' discipline as KMP. Search = z-array of pattern + separator + text.",
    starterCode: "def z_function(s):\n    pass",
    hints: [
      "z[0] = 0 by convention. Maintain [l, r], the rightmost match box seen.",
      "If i <= r: z[i] = min(r - i + 1, z[i - l]) — trust the box, then extend by direct compare.",
      "Whenever the comparison extends past r, update the box to the new [i, match_end]."
    ],
    solution: "def z_function(s):\n    n = len(s)\n    z = [0] * n\n    l = r = 0\n    for i in range(1, n):\n        if i <= r:\n            z[i] = min(r - i + 1, z[i - l])\n        while i + z[i] < n and s[z[i]] == s[i + z[i]]:\n            z[i] += 1\n        if i + z[i] - 1 > r:\n            l, r = i, i + z[i] - 1\n    return z",
    walkthrough: "'aabxaab': at i = 4 the box from nothing is empty, direct compare finds 'aab' → z[4] = 3, box becomes [4, 6]. At i = 5, inside the box: mirror position z[1] = 1 caps the guess, confirmed by one compare. Total comparisons amortize to O(n) because each extension past r moves r permanently forward. Concatenate 'aab$aabxaab' and positions with z == 3 are exactly the matches.",
    testCode: "assert z_function('aabxaab') == [0, 1, 0, 0, 3, 1, 0]\nassert z_function('aaaa') == [0, 3, 2, 1]\nassert z_function('abc') == [0, 0, 0]\nassert z_function('') == []\nprint('All tests passed!')"
  },
  {
    id: 124, stage: 21, title: "Basic Calculator II", pattern: "stack of signed terms", skill: "precedence as immediate evaluation", difficulty: "Hard",
    statement: "Evaluate a string expression with +, -, *, / and spaces (non-negative integers; division truncates toward zero). No parentheses.",
    examples: [
      { input: "s = '3+2*2'", output: "7" },
      { input: "s = ' 3/2 '", output: "1" },
      { input: "s = '14-3/2'", output: "13" },
    ],
    why: "The stack (stage 6) eats operator precedence: push +terms and −terms as signed; on * or /, POP the last term and replace it with the product/quotient — high-precedence work happens immediately, so the answer is just the stack's sum. This 'evaluate eagerly what binds tightly, defer the rest' pattern is the standard two-tier parser, and it is the stepping stone to full recursive-descent.",
    starterCode: "def calculate(s):\n    pass",
    hints: [
      "Walk characters, building the current number digit by digit.",
      "On an operator (or end), apply the PREVIOUS operator: '+' push num, '-' push -num, '*' push stack.pop() * num, '/' push int(stack.pop() / num).",
      "Track the previous operator in a variable, initialized '+' so the first number pushes."
    ],
    solution: "def calculate(s):\n    stack = []\n    num = 0\n    prev_op = '+'\n    for i, ch in enumerate(s):\n        if ch.isdigit():\n            num = num * 10 + int(ch)\n        if (not ch.isdigit() and ch != ' ') or i == len(s) - 1:\n            if prev_op == '+':\n                stack.append(num)\n            elif prev_op == '-':\n                stack.append(-num)\n            elif prev_op == '*':\n                stack.append(stack.pop() * num)\n            else:\n                stack.append(int(stack.pop() / num))\n            prev_op = ch\n            num = 0\n    return sum(stack)",
    walkthrough: "'3+2*2': push 3 ('+'), push 2 ('+'), then '*2' pops 2 pushes 4 → stack [3, 4] → 7. '14-3/2': push 14, push -3, then '/2' pops -3 pushes int(-1.5) = -1 → 14 − 1 = 13 — int() truncates toward zero, matching the problem. The end-of-string flush (i == len − 1) is the classic boundary catch; multi-digit numbers live in num's accumulator.",
    testCode: "assert calculate('3+2*2') == 7\nassert calculate(' 3/2 ') == 1\nassert calculate(' 3+5 / 2 ') == 5\nassert calculate('14-3/2') == 13\nassert calculate('100') == 100\nprint('All tests passed!')"
  },
]
