import type { ICPCProblem } from "./icpc-a"

export const PROBLEMS_ICPC_D: ICPCProblem[] = [
  {
    id: 59, stage: 10, title: "Polynomial Hash", pattern: "rolling hash", skill: "encode strings as numbers", difficulty: "Medium",
    statement: "Implement string_hash(s): treat the string as a base-31 number where 'a'=97 (the character's code), and return the value modulo 1_000_000_007.",
    examples: [
      { input: "s = 'a'", output: "97" },
      { input: "s = 'ab'", output: "3105", explain: "97*31 + 98" },
    ],
    why: "Hashing turns string equality into integer equality — the engine behind substring search, distinct-substring counting, and pattern sets in ICPC rounds.",
    starterCode: "MOD = 1_000_000_007\n\ndef string_hash(s):\n    pass",
    hints: [
      "h = 0; for each character: h = (h * 31 + ord(c)) % MOD.",
      "ord(c) gives the character code directly.",
      "Reduce mod after every step to keep numbers small."
    ],
    solution: "MOD = 1_000_000_007\n\ndef string_hash(s):\n    h = 0\n    for c in s:\n        h = (h * 31 + ord(c)) % MOD\n    return h",
    walkthrough: "Horner's rule folds the polynomial left to right: each step multiplies the accumulated prefix by the base and adds one character. Modding each step keeps arithmetic in machine-word range.",
    testCode: "assert string_hash('a') == 97\nassert string_hash('ab') == 3105\nassert string_hash('') == 0\nassert string_hash('abc') == (97 * 31 + 98) * 31 + 99\nprint('All tests passed!')"
  },
  {
    id: 60, stage: 10, title: "KMP Prefix Function", pattern: "KMP preprocessing", skill: "longest border per prefix", difficulty: "Hard",
    statement: "Compute the prefix function of string s: for each position i, the length of the longest proper prefix of s[0..i] that is also a suffix of it.",
    examples: [
      { input: "s = 'abacaba'", output: "[0, 0, 1, 0, 1, 2, 3]" },
      { input: "s = 'aaaa'", output: "[0, 1, 2, 3]" },
    ],
    why: "The prefix function is the heart of KMP and of every 'period/border' problem. Its amortized O(n) argument (the border can only grow by one per step) is a favorite interview probe too.",
    starterCode: "def prefix_function(s):\n    pass",
    hints: [
      "pi[0] = 0; for each i, start with k = pi[i-1].",
      "While k > 0 and s[i] != s[k], fall back: k = pi[k-1].",
      "If s[i] == s[k], extend (k += 1); store pi[i] = k."
    ],
    solution: "def prefix_function(s):\n    pi = [0] * len(s)\n    for i in range(1, len(s)):\n        k = pi[i - 1]\n        while k > 0 and s[i] != s[k]:\n            k = pi[k - 1]\n        if s[i] == s[k]:\n            k += 1\n        pi[i] = k\n    return pi",
    walkthrough: "pi[i-1] is the best border so far; if the next character breaks it, the next-shorter border (pi of that border minus one) is the only candidate — each failed comparison shortens the border, so total work is linear.",
    testCode: "assert prefix_function('abacaba') == [0, 0, 1, 0, 1, 2, 3]\nassert prefix_function('aaaa') == [0, 1, 2, 3]\nassert prefix_function('abc') == [0, 0, 0]\nassert prefix_function('a') == [0]\nprint('All tests passed!')"
  },
  {
    id: 61, stage: 10, title: "Z-Function", pattern: "Z-algorithm", skill: "longest match at each position", difficulty: "Hard",
    statement: "Compute the Z-function of s: for each position i > 0, the length of the longest substring starting at i that matches a prefix of s.",
    examples: [
      { input: "s = 'abacaba'", output: "[7, 0, 1, 0, 3, 0, 1]" },
      { input: "s = 'aaaa'", output: "[4, 3, 2, 1]" },
    ],
    why: "Z and prefix functions are two views of the same structure. Z shines when matching a pattern against text via p + '#' + t — a one-liner once the function exists.",
    starterCode: "def z_function(s):\n    pass",
    hints: [
      "Maintain the window [l, r] of the rightmost match to the prefix.",
      "For a new i inside the window, start from min(z[i - l], r - i + 1) and extend by brute comparison.",
      "If i + z[i] - 1 > r, update the window to [i, i + z[i] - 1]."
    ],
    solution: "def z_function(s):\n    n = len(s)\n    z = [0] * n\n    z[0] = n\n    l, r = 0, 0\n    for i in range(1, n):\n        if i <= r:\n            z[i] = min(r - i + 1, z[i - l])\n        while i + z[i] < n and s[z[i]] == s[i + z[i]]:\n            z[i] += 1\n        if i + z[i] - 1 > r:\n            l, r = i, i + z[i] - 1\n    return z",
    walkthrough: "Inside a known match window, position i mirrors position i-l, so its Z-value starts pre-filled (clamped to the window edge). Only genuine extensions advance r, keeping the algorithm linear.",
    testCode: "assert z_function('abacaba') == [7, 0, 1, 0, 3, 0, 1]\nassert z_function('aaaa') == [4, 3, 2, 1]\nassert z_function('ab') == [2, 0]\nassert z_function('a') == [1]\nprint('All tests passed!')"
  },
  {
    id: 62, stage: 10, title: "Count Pattern Occurrences", pattern: "KMP search", skill: "match with fallback", difficulty: "Medium",
    statement: "Count how many times pattern p occurs in text t, including overlapping occurrences.",
    examples: [
      { input: "p = 'aba', t = 'ababa'", output: "2", explain: "positions 0 and 2" },
      { input: "p = 'aa', t = 'aaaa'", output: "3", explain: "overlapping counts" },
    ],
    why: "This is the payoff of the prefix function: search becomes a single scan where a full match falls back to pi[m-1] instead of restarting — the difference between TLE and AC.",
    starterCode: "def count_occurrences(p, t):\n    pass",
    hints: [
      "Build pi for pattern p.",
      "Scan text with position k = length of matched pattern prefix so far.",
      "On full match (k == len(p)), count it and set k = pi[k - 1] to allow overlaps."
    ],
    solution: "def count_occurrences(p, t):\n    pi = [0] * len(p)\n    for i in range(1, len(p)):\n        k = pi[i - 1]\n        while k > 0 and p[i] != p[k]:\n            k = pi[k - 1]\n        if p[i] == p[k]:\n            k += 1\n        pi[i] = k\n    k, count = 0, 0\n    for c in t:\n        while k > 0 and c != p[k]:\n            k = pi[k - 1]\n        if c == p[k]:\n            k += 1\n        if k == len(p):\n            count += 1\n            k = pi[k - 1]\n    return count",
    walkthrough: "The text pointer never moves backward; only the match length k falls back along the border chain. Counting then resetting k by one border keeps overlapping hits.",
    testCode: "assert count_occurrences('aba', 'ababa') == 2\nassert count_occurrences('aa', 'aaaa') == 3\nassert count_occurrences('xyz', 'abc') == 0\nassert count_occurrences('a', 'aaa') == 3\nprint('All tests passed!')"
  },
  {
    id: 63, stage: 10, title: "Longest Palindromic Substring", pattern: "expand around center", skill: "2n-1 centers", difficulty: "Medium",
    statement: "Return the longest palindromic substring of s. If several share the maximum length, return the leftmost one.",
    examples: [
      { input: "s = 'babad'", output: "'bab'", explain: "'aba' is equally long but starts later" },
      { input: "s = 'cbbd'", output: "'bb'" },
    ],
    why: "Center expansion is the O(n^2) baseline every contestant writes in five minutes; Manacher's O(n) exists, but knowing when O(n^2) suffices is equally a contest skill.",
    starterCode: "def longest_palindrome(s):\n    pass",
    hints: [
      "Every palindrome has a center: a character (odd) or a gap (even) — 2n-1 centers total.",
      "expand(l, r): walk outward while s[l] == s[r]; return the final length.",
      "Track best by (length, start); update only on strictly longer to keep the leftmost."
    ],
    solution: "def longest_palindrome(s):\n    def expand(l, r):\n        while l >= 0 and r < len(s) and s[l] == s[r]:\n            l -= 1\n            r += 1\n        return r - l - 1\n    best_start, best_len = 0, 0\n    for center in range(len(s)):\n        for length in (expand(center, center), expand(center, center + 1)):\n            if length > best_len:\n                best_len = length\n                best_start = center - (length - 1) // 2\n    return s[best_start:best_start + best_len]",
    walkthrough: "Each center yields the maximal palindrome around it in O(n). Odd and even centers are both tried; strictly-greater updates preserve leftmost-ness because centers are scanned left to right.",
    testCode: "assert longest_palindrome('babad') == 'bab'\nassert longest_palindrome('cbbd') == 'bb'\nassert longest_palindrome('a') == 'a'\nassert longest_palindrome('racecar') == 'racecar'\nprint('All tests passed!')"
  },
  {
    id: 64, stage: 10, title: "Trie Prefix Count", pattern: "trie", skill: "shared-prefix tree", difficulty: "Medium",
    statement: "Implement a Trie class with insert(word) and count_prefix(p) returning how many inserted words start with the prefix p.",
    examples: [
      { input: "insert 'apple', 'app', 'application'; count_prefix('app')", output: "3" },
      { input: "count_prefix('b')", output: "0" },
    ],
    why: "The trie is the go-to structure for prefix queries, autocomplete, and XOR-maximization (binary trie) in ICPC — here you build the counting variant from scratch.",
    starterCode: "class Trie:\n    def __init__(self):\n        pass\n    def insert(self, word):\n        pass\n    def count_prefix(self, prefix):\n        pass",
    hints: [
      "Each node: a dict of children plus a counter of words passing through it.",
      "On insert, increment the counter at every node along the path.",
      "count_prefix walks to the prefix's end node and reads its counter."
    ],
    solution: "class Trie:\n    def __init__(self):\n        self.children = {}\n        self.through = 0\n    def insert(self, word):\n        node = self\n        for c in word:\n            node = node.children.setdefault(c, Trie())\n            node.through += 1\n    def count_prefix(self, prefix):\n        node = self\n        for c in prefix:\n            if c not in node.children:\n                return 0\n            node = node.children[c]\n        return node.through",
    walkthrough: "Incrementing 'through' on descent means every node knows how many words pass over it. Prefix count is then a plain walk with no extra storage or traversal.",
    testCode: "t = Trie()\nt.insert('apple'); t.insert('app'); t.insert('application')\nassert t.count_prefix('app') == 3\nassert t.count_prefix('appl') == 2\nassert t.count_prefix('b') == 0\nassert t.count_prefix('apple') == 1\nprint('All tests passed!')"
  },
  {
    id: 65, stage: 11, title: "Sieve Prime Count", pattern: "sieve of Eratosthenes", skill: "mark composites by multiples", difficulty: "Easy",
    statement: "Count the primes strictly less than n.",
    examples: [
      { input: "n = 10", output: "4", explain: "2, 3, 5, 7" },
      { input: "n = 2", output: "0" },
    ],
    why: "The sieve is the standard O(n log log n) prime table. Its inner loop starting at p*p (smaller multiples already marked) is the optimization interviewers and judges both expect.",
    starterCode: "def count_primes(n):\n    pass",
    hints: [
      "is_prime array of size n, all True except indices 0 and 1.",
      "For each p from 2 while p*p < n: if prime, mark multiples starting at p*p.",
      "Sum the array at the end."
    ],
    solution: "def count_primes(n):\n    if n < 2:\n        return 0\n    is_prime = [True] * n\n    is_prime[0] = is_prime[1] = False\n    p = 2\n    while p * p < n:\n        if is_prime[p]:\n            for multiple in range(p * p, n, p):\n                is_prime[multiple] = False\n        p += 1\n    return sum(is_prime)",
    walkthrough: "Every composite has a prime factor <= its square root, so scanning p only up to sqrt(n) suffices. Starting marks at p*p skips work already done by smaller primes.",
    testCode: "assert count_primes(10) == 4\nassert count_primes(2) == 0\nassert count_primes(20) == 8\nassert count_primes(100) == 25\nprint('All tests passed!')"
  },
  {
    id: 66, stage: 11, title: "Fast Modular Power", pattern: "binary exponentiation", skill: "square the base, halve the exponent", difficulty: "Easy",
    statement: "Compute base^exp mod m without calling any built-in power function, in O(log exp) multiplications.",
    examples: [
      { input: "base = 2, exp = 10, m = 1000", output: "24", explain: "1024 mod 1000" },
      { input: "base = 5, exp = 3, m = 13", output: "8", explain: "125 mod 13" },
    ],
    why: "Binary exponentiation underpins every modular-arithmetic problem: inverses, geometric sums, matrix power, and the entire 'compute huge numbers mod p' family.",
    starterCode: "def powmod(base, exp, m):\n    pass",
    hints: [
      "Keep result = 1; square the base each loop iteration.",
      "When the current low bit of exp is 1, multiply result by the base.",
      "Halve exp by shifting right; reduce mod m each step."
    ],
    solution: "def powmod(base, exp, m):\n    result = 1\n    base %= m\n    while exp > 0:\n        if exp & 1:\n            result = result * base % m\n        base = base * base % m\n        exp >>= 1\n    return result",
    walkthrough: "The exponent in binary says exactly which squared powers multiply into the result. Processing bits low-to-high needs one squaring per bit — 60 iterations covers 64-bit exponents.",
    testCode: "assert powmod(2, 10, 1000) == 24\nassert powmod(5, 3, 13) == 8\nassert powmod(7, 0, 13) == 1\nassert powmod(2, 62, 10**9 + 7) == pow(2, 62, 10**9 + 7)\nprint('All tests passed!')"
  },
  {
    id: 67, stage: 11, title: "Modular Inverse", pattern: "Fermat little theorem", skill: "a^(p-2) is 1/a", difficulty: "Medium",
    statement: "Given a positive integer a and a prime modulus p (a not divisible by p), return the modular inverse of a mod p — the x with a*x ≡ 1 (mod p).",
    examples: [
      { input: "a = 3, p = 7", output: "5", explain: "3*5 = 15 ≡ 1 (mod 7)" },
      { input: "a = 10, p = 17", output: "12", explain: "10*12 = 120 ≡ 1 (mod 17)" },
    ],
    why: "Division does not exist mod p; the inverse replaces it in every counting formula. Fermat's theorem converts the inverse into one fast-power call.",
    starterCode: "def mod_inverse(a, p):\n    pass",
    hints: [
      "Fermat: a^(p-1) ≡ 1 (mod p) for prime p with gcd(a, p) = 1.",
      "Therefore a^(p-2) ≡ a^(-1) (mod p).",
      "Reuse binary exponentiation from the previous problem."
    ],
    solution: "def mod_inverse(a, p):\n    result = 1\n    base = a % p\n    exp = p - 2\n    while exp > 0:\n        if exp & 1:\n            result = result * base % p\n        base = base * base % p\n        exp >>= 1\n    return result",
    walkthrough: "Raising a to p-2 leaves exactly one factor of a short of a^(p-1) ≡ 1, so the result multiplies a back to 1. The exponent is fixed, so one O(log p) power does it.",
    testCode: "assert mod_inverse(3, 7) == 5\nassert mod_inverse(10, 17) == 12\nassert mod_inverse(1, 13) == 1\nassert mod_inverse(3, 7) * 3 % 7 == 1\nprint('All tests passed!')"
  },
  {
    id: 68, stage: 11, title: "Binomial Coefficient mod p", pattern: "factorial precompute", skill: "n! / (k!(n-k)!) with inverses", difficulty: "Medium",
    statement: "Precompute factorials to answer n choose k modulo the prime p = 1_000_000_007. Implement nCr(n, k) for 0 <= k <= n <= 10**6.",
    examples: [
      { input: "n = 5, k = 2", output: "10" },
      { input: "n = 10, k = 3", output: "120" },
    ],
    why: "Combinatorics answers in ICPC are almost always 'mod 1e9+7', and this factorial + inverse-factorial pattern is the universal machinery behind them.",
    starterCode: "MOD = 1_000_000_007\nMAX_N = 1_000_001\n\ndef nCr(n, k):\n    pass",
    hints: [
      "Precompute fact[i] and inv_fact[i] once; inverse via pow(fact[i], p-2, p) or a backward recurrence.",
      "nCr = fact[n] * inv_fact[k] * inv_fact[n-k] mod p.",
      "k < 0 or k > n means the answer is 0."
    ],
    solution: "MOD = 1_000_000_007\nMAX_N = 1_000_001\n\nfact = [1] * MAX_N\nfor i in range(1, MAX_N):\n    fact[i] = fact[i - 1] * i % MOD\ninv_fact = [1] * MAX_N\ninv_fact[MAX_N - 1] = pow(fact[MAX_N - 1], MOD - 2, MOD)\nfor i in range(MAX_N - 1, 0, -1):\n    inv_fact[i - 1] = inv_fact[i] * i % MOD\n\ndef nCr(n, k):\n    if k < 0 or k > n:\n        return 0\n    return fact[n] * inv_fact[k] % MOD * inv_fact[n - k] % MOD",
    walkthrough: "Division mod p becomes multiplication by inverse factorials. The backward recurrence inv_fact[i-1] = inv_fact[i] * i derives all inverses from a single fast power.",
    testCode: "assert nCr(5, 2) == 10\nassert nCr(10, 3) == 120\nassert nCr(4, 0) == 1\nassert nCr(3, 5) == 0\nprint('All tests passed!')"
  },
  {
    id: 69, stage: 11, title: "Euler's Totient", pattern: "prime factorization", skill: "count coprime residues", difficulty: "Medium",
    statement: "Compute Euler's totient of n: the count of integers in [1, n] coprime to n.",
    examples: [
      { input: "n = 10", output: "4", explain: "1, 3, 7, 9" },
      { input: "n = 13", output: "12", explain: "13 is prime" },
    ],
    why: "Totients drive multiplicative-order and cycle-counting arguments (how many keys, how many generators). Trial division to sqrt(n) is fast enough for contest bounds.",
    starterCode: "def euler_phi(n):\n    pass",
    hints: [
      "phi = n; for each prime p dividing n: phi -= phi // p (equivalently phi *= (1 - 1/p)).",
      "Trial divide p from 2 while p*p <= n; strip the factor completely each time.",
      "A leftover factor > 1 after the loop is itself prime — apply the formula once more."
    ],
    solution: "def euler_phi(n):\n    result = n\n    p = 2\n    while p * p <= n:\n        if n % p == 0:\n            while n % p == 0:\n                n //= p\n            result -= result // p\n        p += 1\n    if n > 1:\n        result -= result // n\n    return result",
    walkthrough: "Each distinct prime contributes the factor (1 - 1/p) exactly once, so the factor is stripped fully before applying the update. The surviving n > 1 is the last prime factor.",
    testCode: "assert euler_phi(10) == 4\nassert euler_phi(13) == 12\nassert euler_phi(1) == 1\nassert euler_phi(36) == 12\nprint('All tests passed!')"
  },
  {
    id: 70, stage: 12, title: "Orientation Test", pattern: "cross product sign", skill: "left/right of a ray", difficulty: "Easy",
    statement: "Given points a, b, c as (x, y) tuples, return 'LEFT' if c lies to the left of the directed line a->b, 'RIGHT' if to the right, and 'COLLINEAR' if on the line.",
    examples: [
      { input: "a = (0, 0), b = (1, 0), c = (1, 1)", output: "'LEFT'" },
      { input: "a = (0, 0), b = (1, 1), c = (2, 0)", output: "'RIGHT'" },
    ],
    why: "The cross-product sign is the atom of computational geometry: hulls, intersections, point-in-polygon, and rotation tests are all built from it.",
    starterCode: "def orientation(a, b, c):\n    pass",
    hints: [
      "cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x).",
      "Positive cross means counter-clockwise (left).",
      "Zero means collinear."
    ],
    solution: "def orientation(a, b, c):\n    cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])\n    if cross > 0:\n        return 'LEFT'\n    if cross < 0:\n        return 'RIGHT'\n    return 'COLLINEAR'",
    walkthrough: "The 2D cross product of vectors ab and ac is twice the signed area of triangle abc. Its sign is exactly the side of the line — no angles, no division, exact in integers.",
    testCode: "assert orientation((0,0),(1,0),(1,1)) == 'LEFT'\nassert orientation((0,0),(1,1),(2,0)) == 'RIGHT'\nassert orientation((0,0),(1,1),(2,2)) == 'COLLINEAR'\nassert orientation((2,2),(2,5),(2,9)) == 'COLLINEAR'\nprint('All tests passed!')"
  },
  {
    id: 71, stage: 12, title: "Point in Polygon", pattern: "ray casting", skill: "count edge crossings", difficulty: "Medium",
    statement: "Given a polygon as a list of (x, y) vertices (in order) and a query point, return True if the point is strictly inside the polygon.",
    examples: [
      { input: "poly = [(0,0), (4,0), (4,4), (0,4)], point = (2, 2)", output: "True" },
      { input: "poly = [(0,0), (4,0), (4,4), (0,4)], point = (5, 5)", output: "False" },
    ],
    why: "Ray casting (even-odd rule) is the general point-location method for arbitrary polygons — convex or not — and appears in map/region ICPC problems.",
    starterCode: "def point_in_polygon(poly, point):\n    pass",
    hints: [
      "Cast a ray to the right; count edges it crosses. Odd = inside.",
      "An edge (x1,y1)-(x2,y2) crosses the horizontal ray when one endpoint is strictly above and the other at-or-below the point's y.",
      "Compute the intersection x and compare with the point's x."
    ],
    solution: "def point_in_polygon(poly, point):\n    x, y = point\n    inside = False\n    n = len(poly)\n    for i in range(n):\n        x1, y1 = poly[i]\n        x2, y2 = poly[(i + 1) % n]\n        if (y1 > y) != (y2 > y):\n            cross_x = x1 + (y - y1) * (x2 - x1) / (y2 - y1)\n            if cross_x > x:\n                inside = not inside\n    return inside",
    walkthrough: "Each edge straddling the ray's height contributes exactly one crossing; toggling a boolean accumulates parity. The strict/non-strict split on y1 > y handles vertices consistently.",
    testCode: "sq = [(0,0),(4,0),(4,4),(0,4)]\nassert point_in_polygon(sq, (2, 2)) == True\nassert point_in_polygon(sq, (5, 5)) == False\ntri = [(0,0),(4,0),(2,3)]\nassert point_in_polygon(tri, (2, 1)) == True\nassert point_in_polygon(tri, (3.9, 2.9)) == False\nprint('All tests passed!')"
  },
  {
    id: 72, stage: 12, title: "Convex Hull", pattern: "monotone chain", skill: "lower then upper hull", difficulty: "Hard",
    statement: "Given points as (x, y) tuples, return the convex hull in counter-clockwise order starting from the leftmost-lowest point. Collinear points on hull edges are excluded.",
    examples: [
      { input: "points = [(0,0), (2,0), (2,2), (0,2), (1,1)]", output: "[(0, 0), (2, 0), (2, 2), (0, 2)]" },
      { input: "points = [(0,0), (1,0), (2,0)]", output: "[(0, 0), (2, 0)]" },
    ],
    why: "Monotone chain is the standard hull: sort once, build two chains with a cross-product turn test. It is the gateway to rotating-calipers problems.",
    starterCode: "def convex_hull(points):\n    pass",
    hints: [
      "Sort points lexicographically.",
      "Build the lower hull: keep popping while the last three points make a non-left turn (cross <= 0).",
      "Build the upper hull on the reversed order; concatenate lower[:-1] + upper[:-1]."
    ],
    solution: "def convex_hull(points):\n    pts = sorted(set(points))\n    if len(pts) <= 2:\n        return pts\n    def cross(o, a, b):\n        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])\n    lower = []\n    for p in pts:\n        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:\n            lower.pop()\n        lower.append(p)\n    upper = []\n    for p in reversed(pts):\n        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:\n            upper.pop()\n        upper.append(p)\n    return lower[:-1] + upper[:-1]",
    walkthrough: "Sorting gives a scan order; the stack keeps a strictly convex chain because any clockwise (or straight) turn means the middle point is not on the hull. Reversed scan mirrors the logic for the top.",
    testCode: "assert convex_hull([(0,0),(2,0),(2,2),(0,2),(1,1)]) == [(0, 0), (2, 0), (2, 2), (0, 2)]\nassert convex_hull([(0,0),(1,0),(2,0)]) == [(0, 0), (2, 0)]\nassert convex_hull([(1, 1)]) == [(1, 1)]\nassert convex_hull([(0,0),(1,1)]) == [(0, 0), (1, 1)]\nprint('All tests passed!')"
  },
  {
    id: 73, stage: 12, title: "Polygon Area", pattern: "shoelace formula", skill: "signed area sum", difficulty: "Easy",
    statement: "Return the area of a simple polygon given its vertices in order (either orientation), as a float.",
    examples: [
      { input: "poly = [(0,0), (2,0), (2,2), (0,2)]", output: "4.0" },
      { input: "poly = [(0,0), (4,0), (0,3)]", output: "6.0" },
    ],
    why: "The shoelace formula is two lines and exact with integer inputs (keep the doubled area). It powers 'which side is bigger', centroid, and picking problems.",
    starterCode: "def polygon_area(poly):\n    pass",
    hints: [
      "Sum x_i * y_{i+1} - x_{i+1} * y_i over consecutive vertex pairs (wrap at the end).",
      "The sum is twice the signed area; take abs and halve.",
      "Use modulo indexing for the wrap-around."
    ],
    solution: "def polygon_area(poly):\n    total = 0\n    n = len(poly)\n    for i in range(n):\n        x1, y1 = poly[i]\n        x2, y2 = poly[(i + 1) % n]\n        total += x1 * y2 - x2 * y1\n    return abs(total) / 2",
    walkthrough: "Each edge contributes the signed area of its trapezoid to the origin; walking the boundary cancels everything outside the polygon. Orientation only affects the sign, which abs removes.",
    testCode: "assert polygon_area([(0,0),(2,0),(2,2),(0,2)]) == 4.0\nassert polygon_area([(0,0),(4,0),(0,3)]) == 6.0\nassert polygon_area([(0,0),(0,2),(2,2),(2,0)]) == 4.0\nassert polygon_area([(0, 0), (1, 0), (1, 1)]) == 0.5\nprint('All tests passed!')"
  },
  {
    id: 74, stage: 12, title: "Nim Game Winner", pattern: "game theory XOR", skill: "xor of piles", difficulty: "Easy",
    statement: "Several piles of stones exist; two players alternate taking any positive number of stones from exactly one pile; the player taking the last stone wins. Given pile sizes, return True if the first player wins with perfect play.",
    examples: [
      { input: "piles = [3, 4, 5]", output: "True", explain: "3^4^5 = 2 != 0" },
      { input: "piles = [4, 4]", output: "False", explain: "XOR is 0 — second player mirrors" },
    ],
    why: "The Bouton's theorem XOR criterion is the entry point to all impartial games; Grundy numbers (next problem) are its generalization to arbitrary move sets.",
    starterCode: "def first_player_wins(piles):\n    pass",
    hints: [
      "A position is losing for the mover iff the XOR of all pile sizes is 0.",
      "Compute xor = 0; xor ^= pile for each pile.",
      "First player wins iff xor != 0."
    ],
    solution: "def first_player_wins(piles):\n    xor = 0\n    for pile in piles:\n        xor ^= pile\n    return xor != 0",
    walkthrough: "From any nonzero-XOR position you can move to zero (clear the highest set bit's pile below it); from zero every move lands on nonzero. Zero is therefore exactly the set of P-positions.",
    testCode: "assert first_player_wins([3, 4, 5]) == True\nassert first_player_wins([4, 4]) == False\nassert first_player_wins([7]) == True\nassert first_player_wins([]) == False\nprint('All tests passed!')"
  },
  {
    id: 75, stage: 12, title: "Grundy's Game", pattern: "Grundy numbers / mex", skill: "mex over move options", difficulty: "Hard",
    statement: "A pile of n stones may be split into two piles of unequal positive sizes. Two players alternate splits across any pile; whoever cannot move loses. Given starting piles, return True if the first player wins.",
    examples: [
      { input: "piles = [3, 4]", output: "True", explain: "grundy 1 xor 0 = 1" },
      { input: "piles = [7]", output: "False", explain: "grundy(7) = 0 — losing for the mover" },
    ],
    why: "When the game is not plain Nim, Grundy numbers restore the XOR criterion: compute each pile's mex-value and combine. This is the standard 'impartial game' machinery in ICPC.",
    starterCode: "def grundy_game_winner(piles):\n    pass",
    hints: [
      "g(0) = g(1) = g(2) = 0 (no valid split).",
      "g(n) = mex over splits n = a + b (a < b) of g(a) ^ g(b).",
      "First player wins iff XOR of g(pile) over all piles is nonzero."
    ],
    solution: "def grundy_game_winner(piles):\n    from functools import lru_cache\n    @lru_cache(maxsize=None)\n    def grundy(n):\n        options = set()\n        for a in range(1, n // 2 + 1):\n            b = n - a\n            if a != b:\n                options.add(grundy(a) ^ grundy(b))\n        mex = 0\n        while mex in options:\n            mex += 1\n        return mex\n    xor = 0\n    for pile in piles:\n        xor ^= grundy(pile)\n    return xor != 0",
    walkthrough: "Each split's option value is the XOR of the two resulting piles' Grundy numbers; mex of those options is this pile's value. Sums of independent games combine exactly like Nim — by XOR.",
    testCode: "assert grundy_game_winner([3, 4]) == True\nassert grundy_game_winner([7]) == False\nassert grundy_game_winner([1]) == False\nassert grundy_game_winner([3, 5, 6]) == True\nprint('All tests passed!')"
  }
]
