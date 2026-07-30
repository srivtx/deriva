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

export const STAGES_MATH = [
  { id: 0, name: "Pattern Reflex", desc: "small cases→table→conjecture" },
  { id: 1, name: "Digit Mechanics", desc: "place value" },
  { id: 2, name: "The GCD Story", desc: "Euclid's invariance" },
  { id: 3, name: "Primes & Factors", desc: "pairing" },
  { id: 4, name: "Naive", desc: "multiply/scan" },
  { id: 5, name: "Optimization", desc: "halve/eliminate" },
  { id: 6, name: "Mastery", desc: "curriculum reunion" },
]

export const PROBLEMS_MATH: Problem[] = [
  // ── STAGE 0: Pattern Reflex ──
  {
    id: 1, stage: 0, title: "Happy Number", pattern: "simulate digit square sum", skill: "replace number by sum of squares of its digits; repeat until 1 (happy) or cycle (unhappy)",
    statement: "A happy number follows: replace n by sum of squares of its digits. Repeat until n=1 (happy) or a cycle forms (unhappy). E.g., 19 → 1²+9²=82 → 8²+2²=68 → ... → 1. Return True if n is happy.",
    examples: [
      { input: "n = 19", output: "True" },
      { input: "n = 2", output: "False" },
    ],
    why: "The pattern reflex: simulate the process and look for patterns. Two ways to detect cycles: (1) store seen numbers in a set (simple), (2) Floyd's cycle detection (linked list callback). Pattern observation → convergence detection.",
    starterCode: "def is_happy(n):\n    seen = set()\n    pass",
    hints: [
      "Compute sum of squares of digits: extract each digit (n%10), square it, add to total. n //= 10.",
      "If n becomes 1, happy. If n appears again (seen set), not happy (cycle).",
      "Floyd's cycle detection from Linked Lists topic also works here."
    ],
    solution: "def is_happy(n):\n    seen = set()\n    while n != 1:\n        if n in seen:\n            return False\n        seen.add(n)\n        total = 0\n        temp = n\n        while temp:\n            digit = temp % 10\n            total += digit * digit\n            temp //= 10\n        n = total\n    return True",
    walkthrough: "Simulate: compute sum of digit squares. Track seen numbers in a set. If we hit 1, happy. If a number repeats (cycle), unhappy. The process always converges to 1 or a cycle — no other outcome possible.",
    testCode: "assert is_happy(19) == True\nassert is_happy(2) == False\nassert is_happy(1) == True\nassert is_happy(7) == True\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Count Digit One in Range", pattern: "count occurrences of digit 1 in 1..n", skill: "for each digit position, compute how many times 1 appears using place value formula",
    statement: "Given n, count total number of digit '1' appearing in all numbers from 1 to n. E.g., n=13 → 1,10,11,12,13 → digit '1' appears 6 times. Compute by digit position.",
    examples: [
      { input: "n = 13", output: "6", explain: "numbers 1,10,11,12,13 contain 1,1,2,1,1 ones = 6" },
      { input: "n = 0", output: "0" },
    ],
    why: "Brute force O(n log n) works for small n. The pattern: at each 10^k position, count how many numbers have digit 1 there. Formula: (n/(10*pos))*pos + clamp(n%(10*pos) - pos + 1, 0, pos).",
    starterCode: "def count_digit_one(n):\n    count = 0\n    factor = 1\n    pass",
    hints: [
      "For each decimal position (factor = 1, 10, 100, ...): the higher part = n // (factor*10), current digit = (n // factor) % 10, lower part = n % factor.",
      "Digit at this position: (higher)*factor + clamp(lower+1, 0, factor). Actual formula depends on current digit being >1, ==1, or ==0.",
      "If current digit > 1: (higher+1)*factor. If ==1: higher*factor + lower + 1. If ==0: higher*factor."
    ],
    solution: "def count_digit_one(n):\n    count = 0\n    factor = 1\n    while factor <= n:\n        higher = n // (factor * 10)\n        curr = (n // factor) % 10\n        lower = n % factor\n        if curr == 0:\n            count += higher * factor\n        elif curr == 1:\n            count += higher * factor + lower + 1\n        else:\n            count += (higher + 1) * factor\n        factor *= 10\n    return count",
    walkthrough: "For each decimal position (units, tens, hundreds...): compute how many times '1' appears at that position. Three cases based on the current digit. O(log n). The pattern emerges from place-value analysis.",
    testCode: "assert count_digit_one(13) == 6\nassert count_digit_one(0) == 0\nassert count_digit_one(100) == 21\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Add Digits (Digital Root)", pattern: "repeated digit sum", skill: "while n >= 10, sum its digits. Or: digital root formula: if n==0→0, else 1+(n-1)%9",
    statement: "Given n, repeatedly sum its digits until the result is a single digit. Return it. E.g., 38→3+8=11→1+1=2. Digital root formula: 1 + (n-1) % 9 (except n=0).",
    examples: [
      { input: "n = 38", output: "2" },
      { input: "n = 0", output: "0" },
    ],
    why: "Pattern: computing small cases reveals that digit root follows mod 9. The pattern observation '1+(n-1)%9' collapses a loop into O(1). Build the table for n=0..20 and see the pattern.",
    starterCode: "def add_digits(n):\n    pass",
    hints: [
      "Loop: while n >= 10: n = sum of digits. Return n. But there's a pattern.",
      "Build a small table for n=0..20. Notice digital root = n%9, except multiples of 9 give 9, not 0.",
      "Formula: if n == 0: 0; else: 1 + (n - 1) % 9."
    ],
    solution: "def add_digits(n):\n    if n == 0:\n        return 0\n    return 1 + (n - 1) % 9",
    walkthrough: "Digital root recurrence: dr(n) = n % 9, with the caveat that dr(9k) = 9 (not 0). Formula 1+(n-1)%9 maps n=9→9, n=18→9, n=1→1. Before the formula, observe: dr(38) = dr(3+8=11) = dr(1+1=2) = 2. 38%9=2. Pattern found.",
    testCode: "assert add_digits(38) == 2\nassert add_digits(0) == 0\nassert add_digits(9) == 9\nassert add_digits(12345) == 6\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Ugly Number Check", pattern: "division by 2,3,5", skill: "repeatedly divide by 2,3,5; if final result is 1, it's ugly",
    statement: "An ugly number is one whose only prime factors are 2, 3, or 5. Check if n is ugly. Repeatedly divide n by 2, then 3, then 5 while divisible. Return n == 1.",
    examples: [
      { input: "n = 6", output: "True", explain: "6=2×3" },
      { input: "n = 14", output: "False", explain: "14=2×7, has prime factor 7" },
      { input: "n = 1", output: "True" },
    ],
    why: "Brute-force factor stripping. The pattern: if a number's only prime factors are 2,3,5, stripping them all leaves 1. Any remaining factor means another prime exists. O(log n).",
    starterCode: "def is_ugly(n):\n    if n <= 0:\n        return False\n    pass",
    hints: [
      "While n % 2 == 0: n //= 2. While n % 3 == 0: n //= 3. While n % 5 == 0: n //= 5.",
      "After removing all factors of 2,3,5: if n == 1, it's ugly. If n > 1, there are other prime factors.",
      "n <= 0 is not ugly (ugly numbers are positive by convention)."
    ],
    solution: "def is_ugly(n):\n    if n <= 0:\n        return False\n    for factor in [2, 3, 5]:\n        while n % factor == 0:\n            n //= factor\n    return n == 1",
    walkthrough: "Strip factors: divide by 2 until odd, by 3 until not divisible by 3, by 5 similarly. If after stripping 2,3,5 the number becomes 1, all prime factors were 2,3,5 → ugly. Otherwise, there's another prime factor. O(log n).",
    testCode: "assert is_ugly(6) == True\nassert is_ugly(14) == False\nassert is_ugly(1) == True\nassert is_ugly(8) == True\nassert is_ugly(0) == False\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Nth Ugly Number (Small via Brute Force)", pattern: "count upward, check each number", skill: "for i=1.., check ugly; count until nth; works for small n",
    statement: "Return the nth ugly number (n <= 1690 for LeetCode). Brute force: from i=1 upward, check is_ugly(i). Count until nth. Works but slow. Motivates the DP/merge approach later.",
    examples: [
      { input: "n = 10", output: "12", explain: "ugly numbers: 1,2,3,4,5,6,8,9,10,12,..." },
      { input: "n = 1", output: "1" },
    ],
    why: "Brute force makes the exponential waste visible — checking every integer. For n=1690, the nth ugly number is ~10^9, so checking every integer is ~10^9 operations. DP merges three sequences (P2-like).",
    starterCode: "def nth_ugly_brute(n):\n    def is_ugly(x):\n        pass\n    count = 0\n    i = 1\n    pass",
    hints: [
      "Reuse is_ugly from P4. While count < n: if is_ugly(i), count++; when count==n, return i.",
      "This is O(answer * log answer) — terrible for large n (answer ≈ 2^n for small constants).",
      "Better: maintain three pointers to merge sequences of *2, *3, *5 of already-found ugly numbers."
    ],
    solution: "def nth_ugly_brute(n):\n    def is_ugly(x):\n        if x <= 0: return False\n        for f in [2,3,5]:\n            while x % f == 0:\n                x //= f\n        return x == 1\n    count = 0\n    i = 1\n    while True:\n        if is_ugly(i):\n            count += 1\n            if count == n:\n                return i\n        i += 1",
    walkthrough: "Count upward from 1, checking each integer for ugly-ness. For n=10: checks 1-12, finds 10 ugly numbers, returns 12. For n=1690: the 1690th ugly number is 2123366400 — checking billions of numbers is infeasible.",
    testCode: "assert nth_ugly_brute(10) == 12\nassert nth_ugly_brute(1) == 1\nassert nth_ugly_brute(7) == 8\nprint('All tests passed!')"
  },

  // ── STAGE 1: Digit Mechanics ──
  {
    id: 6, stage: 1, title: "Reverse Integer (Mod Peel)", pattern: "digit extraction via % and //", skill: "peel off digits with n%10, build reversed with rev*10+digit",
    statement: "Given a signed 32-bit integer, reverse its digits. If reversed overflows 32-bit signed range [-2^31, 2^31-1], return 0. Use: digit = x % 10, rev = rev * 10 + digit, x //= 10.",
    examples: [
      { input: "x = 123", output: "321" },
      { input: "x = -123", output: "-321" },
      { input: "x = 120", output: "21" },
    ],
    why: "Digit peeling: n % 10 extracts the last digit, n // 10 removes it. Building the reversed number: rev * 10 shifts existing digits left, +digit appends the new digit. The core digit mechanics pattern.",
    starterCode: "def reverse_integer(x):\n    INT_MAX = 2**31 - 1\n    INT_MIN = -2**31\n    negative = x < 0\n    x = abs(x)\n    rev = 0\n    pass",
    hints: [
      "While x > 0: digit = x % 10; check overflow before rev = rev * 10 + digit; x //= 10.",
      "Overflow check: if rev > INT_MAX // 10 or (rev == INT_MAX // 10 and digit > 7), overflow.",
      "Apply sign at the end: rev if not negative else -rev."
    ],
    solution: "def reverse_integer(x):\n    INT_MAX = 2**31 - 1\n    INT_MIN = -2**31\n    negative = x < 0\n    x = abs(x)\n    rev = 0\n    while x > 0:\n        digit = x % 10\n        if rev > INT_MAX // 10 or (rev == INT_MAX // 10 and digit > 7):\n            return 0\n        rev = rev * 10 + digit\n        x //= 10\n    return -rev if negative else rev",
    walkthrough: "Peel digits from right to left: 123 % 10 = 3, rev = 3; 12 % 10 = 2, rev = 32; 1 % 10 = 1, rev = 321. Overflow: check before multiplying. The sign is handled by taking absolute value and reapplying at the end.",
    testCode: "assert reverse_integer(123) == 321\nassert reverse_integer(-123) == -321\nassert reverse_integer(120) == 21\nassert reverse_integer(1534236469) == 0\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 1, title: "Palindrome Number (No String Conversion)", pattern: "reverse half the number", skill: "reverse the second half of digits; compare with first half",
    statement: "Check if integer x is a palindrome without converting to string. Reverse the second half of x: while x > rev: rev = rev*10 + x%10; x //= 10. Palindrome if x == rev or x == rev//10 (odd digit case, middle digit doesn't matter).",
    examples: [
      { input: "x = 121", output: "True" },
      { input: "x = -121", output: "False", explain: "negative sign makes it non-palindromic" },
      { input: "x = 10", output: "False" },
    ],
    why: "String conversion is the brute-force. The digit-peel approach (P6) extends naturally: reverse only half the number and compare. Avoids full reversal and overflow concerns.",
    starterCode: "def is_palindrome_number(x):\n    if x < 0 or (x % 10 == 0 and x != 0):\n        return False\n    rev = 0\n    pass",
    hints: [
      "Negative numbers: not palindromes. Numbers ending in 0 (except 0): not palindromes.",
      "While x > rev: rev = rev * 10 + x % 10; x //= 10. This reverses the right half.",
      "Palindrome if x == rev (even digits) or x == rev // 10 (odd digits — middle digit handled)."
    ],
    solution: "def is_palindrome_number(x):\n    if x < 0 or (x % 10 == 0 and x != 0):\n        return False\n    rev = 0\n    while x > rev:\n        rev = rev * 10 + x % 10\n        x //= 10\n    return x == rev or x == rev // 10",
    walkthrough: "Reverse half: 121 → x=12, rev=1; then x=1, rev=12 (x<rev, stop). x (1) == rev//10 (1) → palindrome. For 1221: x=12, rev=12 → equal. The loop stops when x <= rev (we've processed half). Compare.",
    testCode: "assert is_palindrome_number(121) == True\nassert is_palindrome_number(-121) == False\nassert is_palindrome_number(10) == False\nassert is_palindrome_number(0) == True\nassert is_palindrome_number(12321) == True\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Excel Column Number", pattern: "base-26 number conversion", skill: "treat column letters as base-26: A=1..Z=26; value = val*26 + (c-'A'+1)",
    statement: "Given Excel column title (e.g., 'AB'), return its column number (e.g., 28). Treat as base-26: A=1...Z=26. For each char: result = result * 26 + (ord(c) - ord('A') + 1).",
    examples: [
      { input: "columnTitle = 'A'", output: "1" },
      { input: "columnTitle = 'AB'", output: "28", explain: "A*26+B=1*26+2=28" },
      { input: "columnTitle = 'ZY'", output: "701" },
    ],
    why: "Base-26 makes the column system a positional numeral system. The formula is the same as binary-to-decimal or hex-to-decimal — just with base 26. No zero digit (A=1, not A=0) — unique twist.",
    starterCode: "def excel_column_number(s):\n    result = 0\n    pass",
    hints: [
      "For each char: result = result * 26 + (ord(char) - ord('A') + 1).",
      "This is exactly the Horner's method for converting a base-26 number to decimal.",
      "Why +1? Because 'A'=1, not 0. The column system doesn't have a zero digit."
    ],
    solution: "def excel_column_number(s):\n    result = 0\n    for ch in s:\n        result = result * 26 + (ord(ch) - ord('A') + 1)\n    return result",
    walkthrough: "Iterate through characters. Each step: shift existing result by a factor of 26, add the current digit value (1-26). 'AB': result=0; 'A': result=1; 'B': result=1*26+2=28. Base-26 positional system with no zero.",
    testCode: "assert excel_column_number('A') == 1\nassert excel_column_number('AB') == 28\nassert excel_column_number('ZY') == 701\nassert excel_column_number('FXSHRXW') == 2147483647\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Excel Column Title", pattern: "base-26 reverse conversion", skill: "convert column number to title: n--, then while n>=0: chr(ord('A')+n%26), n//=26",
    statement: "Given column number n, return Excel column title. Inverse of P8. While n > 0: n -= 1 (handle 1-indexed), append chr(ord('A') + n % 26), n //= 26. Reverse result.",
    examples: [
      { input: "n = 1", output: "'A'" },
      { input: "n = 28", output: "'AB'" },
      { input: "columnNumber = 701", output: "'ZY'" },
    ],
    why: "Inverse base-26 with the zero-is-not-a-digit trick. Decrement by 1 before modulo to map 1..26 → 0..25 which matches A-Z. The digit peel (Stage 1 core pattern) applied in reverse.",
    starterCode: "def excel_column_title(n):\n    result = []\n    pass",
    hints: [
      "While n > 0: n -= 1; digit = n % 26; result.append(chr(ord('A') + digit)); n //= 26.",
      "The n -= 1 handles the 1-indexed-to-0-indexed conversion. A=0, B=1, ..., Z=25 after decrement.",
      "Reverse the result at the end (LSB first)."
    ],
    solution: "def excel_column_title(n):\n    result = []\n    while n > 0:\n        n -= 1\n        result.append(chr(ord('A') + n % 26))\n        n //= 26\n    return ''.join(result[::-1])",
    walkthrough: "Decrement handles 1-indexing (A=1→0, B=2→1, etc.). Peeling: n%26 gives 0-25 → A-Z. n//=26 shifts to next digit. Reverse since we build LSB first. 28: n=27, 27%26=1→B, n=1; n=0, 0%26=0→A, n=0; reversed → 'AB'.",
    testCode: "assert excel_column_title(1) == 'A'\nassert excel_column_title(28) == 'AB'\nassert excel_column_title(701) == 'ZY'\nassert excel_column_title(2147483647) == 'FXSHRXW'\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Plus One (Array of Digits)", pattern: "carry propagation through digits", skill: "add 1 to MSB side of digit array; propagate carry from right to left",
    statement: "Given array of digits representing a non-negative integer (MSB first), add one to the integer. Handle carry: if digit becomes 10, set to 0 and carry to next. If carry after last digit, prepend 1.",
    examples: [
      { input: "digits = [1,2,3]", output: "[1,2,4]" },
      { input: "digits = [9,9,9]", output: "[1,0,0,0]" },
    ],
    why: "The simplest digit carry problem. Proceeds from LSD (right) to MSD (left). If carry propagates through entire array, prepend a new most significant digit (1). The digit peel pattern in array form.",
    starterCode: "def plus_one(digits):\n    for i in range(len(digits) - 1, -1, -1):\n        pass\n    return digits",
    hints: [
      "Iterate from right to left (least significant digit). Add 1 to current digit.",
      "If digit < 10, carry is done — return early. If digit == 10, set to 0, continue to next digit.",
      "If loop finishes without returning (999 case), prepend 1 to the array."
    ],
    solution: "def plus_one(digits):\n    for i in range(len(digits) - 1, -1, -1):\n        if digits[i] < 9:\n            digits[i] += 1\n            return digits\n        digits[i] = 0\n    return [1] + digits",
    walkthrough: "Add 1 from rightmost digit. If digit < 9, increment and return (no carry beyond). If digit == 9, set to 0 and carry propagates left. If all digits were 9 (e.g., 999), they all become 0, and we prepend 1 → [1,0,0,0]. O(n).",
    testCode: "assert plus_one([1,2,3]) == [1,2,4]\nassert plus_one([9,9,9]) == [1,0,0,0]\nassert plus_one([0]) == [1]\nassert plus_one([4,3,2,1]) == [4,3,2,2]\nprint('All tests passed!')"
  },

  // ── STAGE 2: The GCD Story ──
  {
    id: 11, stage: 2, title: "GCD — Euclidean (Subtraction → Mod)", pattern: "Euclid's algorithm", skill: "gcd(a,b) = gcd(b, a mod b); base case gcd(a,0)=a",
    statement: "Compute GCD of two positive integers. Euclid: if b==0 return a; return gcd(b, a % b). The key: common divisors of (a,b) are same as (b, a mod b).",
    examples: [
      { input: "a = 48, b = 18", output: "6", explain: "gcd(48,18)=gcd(18,12)=gcd(12,6)=gcd(6,0)=6" },
      { input: "a = 17, b = 13", output: "1" },
    ],
    why: "Euclid's algorithm is the oldest and most elegant algorithm. The invariant: gcd(a,b) = gcd(b, a % b). The remainder is always smaller than the divisor, guaranteeing termination in logarithmic steps.",
    starterCode: "def gcd(a, b):\n    pass",
    hints: [
      "Base case: if b == 0, return a. Recursive: gcd(b, a % b).",
      "Why does it work? Any divisor d of a and b also divides a mod b (since a = b*k + r, so r = a - b*k, and d divides both a and b*k).",
      "Iterative: while b: a, b = b, a % b; return a."
    ],
    solution: "def gcd(a, b):\n    while b:\n        a, b = b, a % b\n    return a",
    walkthrough: "Euclid's algorithm iteratively reduces (a,b) → (b, a%b). Each step replaces the larger with the remainder, which is at most half the larger number. O(log min(a,b)). The algorithm is sound because gcd(a,b) = gcd(b, a % b) — the set of common divisors is invariant.",
    testCode: "assert gcd(48, 18) == 6\nassert gcd(17, 13) == 1\nassert gcd(100, 0) == 100\nassert gcd(270, 192) == 6\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 2, title: "GCD of Array", pattern: "reduce array with pairwise GCD", skill: "gcd(arr[0], arr[1], ...) = gcd(gcd(arr[0], arr[1]), arr[2], ...)",
    statement: "Compute GCD of an array of positive integers. GCD is associative: gcd(a,b,c) = gcd(gcd(a,b), c). Reduce the array pairwise.",
    examples: [
      { input: "arr = [2,4,6,8,10]", output: "2" },
      { input: "arr = [2,3,4,5]", output: "1" },
    ],
    why: "GCD is associative and commutative — can reduce pairwise in any order. Reduce: result = arr[0]; for each x: result = gcd(result, x). This is the natural generalization of the pairing pattern from Stage 1 of DP.",
    starterCode: "def gcd_array(arr):\n    from math import gcd\n    result = arr[0]\n    pass",
    hints: [
      "Start with result = arr[0]. For each x in arr[1:]: result = gcd(result, x).",
      "If result becomes 1, GCD of entire array is 1 — can early-return.",
      "Uses the same gcd function from P11. Associativity is the key — order doesn't matter."
    ],
    solution: "def gcd_array(arr):\n    from math import gcd\n    result = arr[0]\n    for x in arr[1:]:\n        result = gcd(result, x)\n        if result == 1:\n            return 1\n    return result",
    walkthrough: "Reduce: gcd(arr[0], arr[1]) → store. Then gcd(previous, arr[2]), etc. If any step yields 1, the GCD is 1 (no common divisor > 1). O(n log max). Associativity allows any reduction order.",
    testCode: "assert gcd_array([2,4,6,8,10]) == 2\nassert gcd_array([2,3,4,5]) == 1\nassert gcd_array([12,18,24]) == 6\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 2, title: "LCM (Least Common Multiple)", pattern: "lcm(a,b) = a*b // gcd(a,b)", skill: "LCM via GCD relationship",
    statement: "Compute LCM of two positive integers. Formula: lcm(a,b) = (a * b) // gcd(a,b). The product of GCD and LCM equals a*b. Extend to array: reduce pairwise.",
    examples: [
      { input: "a = 12, b = 18", output: "36", explain: "12*18//6=36" },
      { input: "a = 7, b = 11", output: "77" },
    ],
    why: "GCD and LCM are dual: gcd × lcm = a × b. This is because a = gcd * a', b = gcd * b' (coprime), so lcm = gcd * a' * b' = a*b / gcd. The pairing of GCD and LCM is fundamental.",
    starterCode: "def lcm(a, b):\n    from math import gcd\n    pass",
    hints: [
      "Compute gcd(a,b) first. Then return (a * b) // gcd(a,b).",
      "Integer division // to avoid floating point. Order: a * b then divide (or a // gcd * b to avoid overflow).",
      "For array LCM: reduce pairwise, same as GCD array."
    ],
    solution: "def lcm(a, b):\n    from math import gcd\n    return (a // gcd(a, b)) * b",
    walkthrough: "LCM = (a * b) / gcd(a,b). Use a // gcd(a,b) * b to avoid overflow (dividing first). For array: reduce pairwise. O(log min(a,b)) for GCD, constant for the multiply-divide.",
    testCode: "assert lcm(12, 18) == 36\nassert lcm(7, 11) == 77\nassert lcm(1, 1) == 1\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 2, title: "Fraction Simplification", pattern: "divide numerator and denominator by GCD", skill: "reduce fraction by dividing both by gcd(num, den)",
    statement: "Given numerator and denominator, return the simplified fraction as [num', den']. E.g., 8/12 → 2/3. Compute g = gcd(|num|, |den|), divide both by g. Preserve sign.",
    examples: [
      { input: "num = 8, den = 12", output: "[2, 3]" },
      { input: "num = -4, den = 6", output: "[-2, 3]" },
      { input: "num = 0, den = 5", output: "[0, 1]" },
    ],
    why: "GCD's most practical use: fraction simplification. Divide both terms by their GCD to get the reduced form. Sign: keep denominator positive, put sign on numerator.",
    starterCode: "def simplify_fraction(num, den):\n    from math import gcd\n    pass",
    hints: [
      "Compute g = gcd(abs(num), abs(den)). num //= g, den //= g.",
      "Ensure denominator is positive: if den < 0, negate both num and den.",
      "Handle zero: if num == 0, return [0, 1]."
    ],
    solution: "def simplify_fraction(num, den):\n    from math import gcd\n    if num == 0:\n        return [0, 1]\n    g = gcd(abs(num), abs(den))\n    num //= g\n    den //= g\n    if den < 0:\n        num = -num\n        den = -den\n    return [num, den]",
    walkthrough: "GCD reduces both numerator and denominator to coprime form. Sign normalization ensures denominator is positive. 0/anything → 0/1. O(log min(|num|,|den|)).",
    testCode: "assert simplify_fraction(8, 12) == [2, 3]\nassert simplify_fraction(-4, 6) == [-2, 3]\nassert simplify_fraction(0, 5) == [0, 1]\nassert simplify_fraction(-6, -9) == [2, 3]\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Water Jug Problem (GCD Invariant)", pattern: "measurable amounts are multiples of GCD", skill: "check if target z is achievable with jugs x,y: z <= x+y and z % gcd(x,y) == 0",
    statement: "Two jugs of capacity x,y. Can you measure exactly z liters by pouring, emptying, filling? The set of measurable amounts = multiples of gcd(x,y) up to x+y. Return True if z <= x+y and z % gcd(x,y) == 0.",
    examples: [
      { input: "x = 3, y = 5, z = 4", output: "True", explain: "fill 5, pour to 3 (2 left), empty 3, pour 2 into 3, fill 5, pour to 3 (1 needed), 4 left in 5-jug" },
      { input: "x = 2, y = 6, z = 5", output: "False" },
    ],
    why: "The Diophantine invariant: the amount in any jug is always a combination ax + by (linear combination). By Bezout's identity, the set of reachable amounts = {k * gcd(x,y) | k >= 0}. So z must be divisible by gcd.",
    starterCode: "def can_measure_water(x, y, z):\n    from math import gcd\n    pass",
    hints: [
      "If z > x + y, impossible (can't measure more than total capacity).",
      "If z == 0, always possible. Otherwise: z must be divisible by gcd(x,y).",
      "Bezout's identity: any ax + by is a multiple of gcd(x,y). All operations preserve this invariant."
    ],
    solution: "def can_measure_water(x, y, z):\n    from math import gcd\n    if z > x + y:\n        return False\n    if z == 0:\n        return True\n    return z % gcd(x, y) == 0",
    walkthrough: "The operations (fill, empty, pour) are linear transformations. The amount in either jug is always of the form ax + by for integers a,b. By Bezout's identity, the reachable values are exactly multiples of gcd(x,y) up to x+y. Check: z <= x+y and z % gcd(x,y) == 0. O(log min(x,y)).",
    testCode: "assert can_measure_water(3, 5, 4) == True\nassert can_measure_water(2, 6, 5) == False\nassert can_measure_water(1, 2, 3) == True\nassert can_measure_water(0, 0, 1) == False\nprint('All tests passed!')"
  },

  // ── STAGE 3: Primes & Factors ──
  {
    id: 16, stage: 3, title: "Count Primes — Sieve of Eratosthenes", pattern: "sieve: boolean array, mark multiples", skill: "for i from 2 to √n: if not marked, mark all multiples of i starting from i*i",
    statement: "Count prime numbers strictly less than n. Sieve of Eratosthenes: create boolean array of size n. For each i from 2 to √n: if is_prime[i], mark all multiples j = i*i, i*i+i, ... as composite.",
    examples: [
      { input: "n = 10", output: "4", explain: "primes < 10: 2,3,5,7" },
      { input: "n = 0", output: "0" },
      { input: "n = 2", output: "0", explain: "2 is not strictly less than itself" },
    ],
    why: "The sieve is the classic prime-counting algorithm. Marking multiples: for each prime p, start marking from p*p (since p*2, p*3, ..., p*(p-1) were already marked by smaller primes). O(n log log n).",
    starterCode: "def count_primes(n):\n    if n < 3:\n        return 0\n    is_prime = [True] * n\n    is_prime[0] = is_prime[1] = False\n    pass",
    hints: [
      "Initialize is_prime[0]=is_prime[1]=False, rest True. For i from 2 to int(sqrt(n))+1:",
      "If is_prime[i]: for j from i*i to n-1 step i: is_prime[j] = False.",
      "Return sum of True values (or count them)."
    ],
    solution: "def count_primes(n):\n    if n < 3:\n        return 0\n    is_prime = [True] * n\n    is_prime[0] = is_prime[1] = False\n    i = 2\n    while i * i < n:\n        if is_prime[i]:\n            for j in range(i * i, n, i):\n                is_prime[j] = False\n        i += 1\n    return sum(is_prime)",
    walkthrough: "Start with all numbers as potentially prime. 0 and 1 are not. For i=2..√n: if i is still marked prime, mark its multiples starting from i*i as composite (smaller multiples already handled). Sum True values = count of primes. O(n log log n).",
    testCode: "assert count_primes(10) == 4\nassert count_primes(0) == 0\nassert count_primes(2) == 0\nassert count_primes(100) == 25\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 3, title: "Nth Prime", pattern: "iterative prime finding with trial division", skill: "for each odd number, test divisibility by primes up to √n",
    statement: "Find the nth prime number (2 is 1st, 3 is 2nd, etc.). Generate primes using trial division: for each odd number, check divisibility by all discovered primes up to √n.",
    examples: [
      { input: "n = 1", output: "2" },
      { input: "n = 6", output: "13", explain: "primes: 2,3,5,7,11,13" },
    ],
    why: "Sieve needs a known bound. For 'nth prime,' we generate sequentially. For each candidate: check divisibility by any known prime <= √candidate. If none, candidate is prime.",
    starterCode: "def nth_prime(n):\n    if n == 1:\n        return 2\n    primes = [2]\n    candidate = 3\n    pass",
    hints: [
      "Start with primes=[2]. Candidate=3. While len(primes) < n: check if candidate is divisible by any prime in primes where prime*prime <= candidate.",
      "If no divisor found, append to primes. Candidate += 2 (only check odd numbers after 2).",
      "The check: for p in primes: if p*p > candidate: break. if candidate % p == 0: not prime."
    ],
    solution: "def nth_prime(n):\n    if n == 1:\n        return 2\n    primes = [2]\n    candidate = 3\n    while len(primes) < n:\n        is_prime = True\n        for p in primes:\n            if p * p > candidate:\n                break\n            if candidate % p == 0:\n                is_prime = False\n                break\n        if is_prime:\n            primes.append(candidate)\n        candidate += 2\n    return primes[-1]",
    walkthrough: "Sequential generation. Skip evens (candidate += 2). For each candidate, test divisibility by known primes up to √candidate. If passes, add to primes. Continue until we have n primes. O(n √(nth prime)).",
    testCode: "assert nth_prime(1) == 2\nassert nth_prime(6) == 13\nassert nth_prime(10) == 29\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 3, title: "Prime Factorization", pattern: "trial division by primes", skill: "divide n by 2, then by odd numbers from 3 to √n; collect factor-count pairs",
    statement: "Return prime factorization of n as list of [factor, count] pairs. E.g., 60 → [[2,2],[3,1],[5,1]]. Divide by 2 until odd, then by odd numbers 3,5,7,... up to √n.",
    examples: [
      { input: "n = 60", output: "[[2,2],[3,1],[5,1]]" },
      { input: "n = 17", output: "[[17,1]]" },
      { input: "n = 1", output: "[]" },
    ],
    why: "Prime factorization is the fingerprint of a number. Trial division: divide by 2 until odd, then odd numbers up to √n. If a factor > √n remains, it's prime (the number itself was prime or the cofactor).",
    starterCode: "def prime_factors(n):\n    factors = []\n    if n <= 1:\n        return factors\n    pass",
    hints: [
      "Count factor 2: while n % 2 == 0: count++, n//=2. If count>0, append [2,count].",
      "For odd i=3 while i*i<=n: while n%i==0: count++, n//=i. if count>0, append, count=0. i+=2.",
      "After loop: if n > 1, n is prime — append [n,1]."
    ],
    solution: "def prime_factors(n):\n    factors = []\n    if n <= 1:\n        return factors\n    count = 0\n    while n % 2 == 0:\n        count += 1\n        n //= 2\n    if count > 0:\n        factors.append([2, count])\n    i = 3\n    while i * i <= n:\n        count = 0\n        while n % i == 0:\n            count += 1\n            n //= i\n        if count > 0:\n            factors.append([i, count])\n        i += 2\n    if n > 1:\n        factors.append([n, 1])\n    return factors",
    walkthrough: "Trial division: handle 2 separately, then odd numbers. For each divisor, count how many times it divides n. After all factors <= √n are extracted, if n > 1, it's the last prime factor. O(√n).",
    testCode: "assert prime_factors(60) == [[2,2],[3,1],[5,1]]\nassert prime_factors(17) == [[17,1]]\nassert prime_factors(1) == []\nassert prime_factors(84) == [[2,2],[3,1],[7,1]]\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 3, title: "Perfect Square Check", pattern: "square root integer check", skill: "check if sqrt(n) is integer: int(sqrt)**2 == n",
    statement: "Given positive integer n, return True if it's a perfect square (exists integer k such that k*k = n). Use integer sqrt: k = int(n ** 0.5); check k*k == n.",
    examples: [
      { input: "n = 16", output: "True" },
      { input: "n = 14", output: "False" },
    ],
    why: "Perfect square = n is k² for some integer k. Integer sqrt check: compute floor(sqrt(n)), verify squaring gives back n. The pairing pattern: factors of a perfect square come in pairs except the square root.",
    starterCode: "def is_perfect_square(n):\n    if n < 0:\n        return False\n    k = int(n ** 0.5)\n    pass",
    hints: [
      "Compute integer square root k = int(n ** 0.5). Check k*k == n and (k+1)**2 > n.",
      "Or use binary search for the integer sqrt (Stage 5).",
      "Negative numbers: not perfect squares (in real numbers)."
    ],
    solution: "def is_perfect_square(n):\n    if n < 0:\n        return False\n    k = int(n ** 0.5)\n    while k * k < n:\n        k += 1\n    while k * k > n:\n        k -= 1\n    return k * k == n",
    walkthrough: "Integer sqrt: compute floor using sqrt, adjust up/down to exact. If k*k == n, perfect square. O(log n) with binary search, O(sqrt(n)) with while loops. For small numbers, Python's int(sqrt) is accurate enough.",
    testCode: "assert is_perfect_square(16) == True\nassert is_perfect_square(14) == False\nassert is_perfect_square(1) == True\nassert is_perfect_square(0) == True\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 3, title: "Closest Prime Numbers", pattern: "find nearest prime", skill: "check downward and upward from n for the nearest prime",
    statement: "Given n, return the closest prime number. If two primes are equally close (left and right), return the smaller one. Use is_prime check for candidates n, n-1, n+1, n-2, n+2, ...",
    examples: [
      { input: "n = 10", output: "11", explain: "primes nearest 10: 7 (distance 3) and 11 (distance 1); 11 is closer" },
      { input: "n = 4", output: "3", explain: "3 distance 1, 5 distance 1; return smaller (3)" },
    ],
    why: "The pairing pattern: check outward from n in both directions. For candidate k = n - d and n + d, test primality. Return first found. For tie (both found at same distance), return smaller (the negative-side candidate).",
    starterCode: "def closest_prime(n):\n    if n <= 2:\n        return 2\n    def is_prime(x):\n        pass\n    pass",
    hints: [
      "Define is_prime(x): if x <= 1 return False; check divisibility by 2..√x.",
      "If n is prime, return n. Otherwise, check n-1, n+1, n-2, n+2, ... until a prime found.",
      "For ties (both sides equally distant), return the smaller (left side)."
    ],
    solution: "def closest_prime(n):\n    if n <= 2:\n        return 2\n    def is_prime(x):\n        if x < 2: return False\n        if x % 2 == 0: return x == 2\n        i = 3\n        while i * i <= x:\n            if x % i == 0: return False\n            i += 2\n        return True\n    if is_prime(n):\n        return n\n    for d in range(1, n):\n        left = n - d\n        if left >= 2 and is_prime(left):\n            return left\n        right = n + d\n        if is_prime(right):\n            return right",
    walkthrough: "Outward search: check n, then n-1, n+1, n-2, n+2, ... First prime found is closest. Check left before right at each distance, so ties return the smaller. O(√n * gap) where gap is distance to nearest prime (typically very small).",
    testCode: "assert closest_prime(10) == 11\nassert closest_prime(4) == 3\nassert closest_prime(2) == 2\nassert closest_prime(1) == 2\nprint('All tests passed!')"
  },

  // ── STAGE 4: Naive ──
  {
    id: 21, stage: 4, title: "Pow(x,n) — Naive Multiplication", pattern: "repeated multiplication", skill: "multiply x by itself n times; O(n)",
    statement: "Compute x^n (x raised to power n, n can be negative). Naive: multiply x by itself abs(n) times. If n < 0, return 1/result.",
    examples: [
      { input: "x = 2.0, n = 10", output: "1024.0" },
      { input: "x = 2.0, n = -2", output: "0.25" },
    ],
    why: "Naive repeated multiplication is O(n). For n = 2^31, this is billions of multiplications — infeasible. The waste motivates fast exponentiation (Stage 5): halve n each recursive step.",
    starterCode: "def my_pow_naive(x, n):\n    if n == 0:\n        return 1.0\n    result = 1.0\n    pass",
    hints: [
      "For n > 0: loop n times, result *= x. For n < 0: compute pow(x, -n), return 1/result.",
      "This is O(n). For n = 2^31, it would take forever.",
      "Fast exponentiation (Stage 5): x^n = (x²)^(n/2) when n even; halving n each step = O(log n)."
    ],
    solution: "def my_pow_naive(x, n):\n    if n == 0:\n        return 1.0\n    if n < 0:\n        x = 1 / x\n        n = -n\n    result = 1.0\n    for _ in range(n):\n        result *= x\n    return result",
    walkthrough: "Repeated multiplication. n multiplications. For n = 2^31 = ~2 billion, this is billions of operations. The inefficient work is visible. Fast exponentiation reduces to log n by halving the exponent at each step.",
    testCode: "assert abs(my_pow_naive(2.0, 10) - 1024.0) < 0.001\nassert abs(my_pow_naive(2.0, -2) - 0.25) < 0.001\nassert abs(my_pow_naive(2.0, 0) - 1.0) < 0.001\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 4, title: "Sqrt — Linear Scan", pattern: "test integers 1,2,3,... until k*k >= x", skill: "O(√x) linear scan for integer square root",
    statement: "Given non-negative integer x, return integer part of sqrt(x) (floor). Naive: scan k=1,2,3,... until k*k > x. Return k-1.",
    examples: [
      { input: "x = 8", output: "2", explain: "2²=4≤8, 3²=9>8 → 2" },
      { input: "x = 0", output: "0" },
    ],
    why: "Linear scan is O(√x). For x = 10^9, √x = 31623 iterations — feasible but slow. Binary search (Stage 5) reduces to O(log x): halve the search space each step.",
    starterCode: "def my_sqrt_naive(x):\n    if x <= 1:\n        return x\n    k = 1\n    pass",
    hints: [
      "Increment k while k*k <= x. Return k-1 (last k whose square was ≤ x).",
      "This scans √x values. For x = 2^31, √x ≈ 46340 iterations — okay but not ideal.",
      "Binary search: lo=0, hi=x; while lo<=hi: mid=(lo+hi)//2; if mid*mid <= x < (mid+1)*(mid+1): return mid."
    ],
    solution: "def my_sqrt_naive(x):\n    k = 0\n    while (k + 1) * (k + 1) <= x:\n        k += 1\n    return k",
    walkthrough: "Increment k until (k+1)² > x. At that point, k is the floor sqrt. For x=8: k=0, 1²=1≤8, k=1; 2²=4≤8, k=2; 3²=9>8, stop → 2. O(√x) iterations.",
    testCode: "assert my_sqrt_naive(8) == 2\nassert my_sqrt_naive(0) == 0\nassert my_sqrt_naive(1) == 1\nassert my_sqrt_naive(100) == 10\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 4, title: "Is Prime — O(n) Trial Division", pattern: "check divisibility by all numbers 2..n-1", skill: "try dividing by every integer up to n-1; return False if any division yields remainder 0",
    statement: "Check if n is prime by trial division from 2 to n-1. If any divides n evenly, it's composite. This is O(n) — unnecessarily checking all numbers.",
    examples: [
      { input: "n = 17", output: "True" },
      { input: "n = 4", output: "False" },
    ],
    why: "O(n) trial division is the brute-force baseline. The waste: factors come in pairs (a * b = n → either a ≤ √n or b ≤ √n). Checking up to n-1 is redundant; checking up to √n suffices.",
    starterCode: "def is_prime_naive(n):\n    if n <= 1:\n        return False\n    pass",
    hints: [
      "For i from 2 to n-1: if n % i == 0, return False. Return True if loop finishes.",
      "This is O(n). For n = 10^9, we'd check a billion divisors.",
      "Factor pairing: if n = a*b, min(a,b) ≤ √n. So we only need to check up to √n."
    ],
    solution: "def is_prime_naive(n):\n    if n <= 1:\n        return False\n    for i in range(2, n):\n        if n % i == 0:\n            return False\n    return True",
    walkthrough: "Check every integer 2..n-1. If any divides n, composite. The waste: for n=97, we check 95 numbers when we only need to check up to 9 (since √97 ≈ 9.8). O(n) vs O(√n).",
    testCode: "assert is_prime_naive(17) == True\nassert is_prime_naive(4) == False\nassert is_prime_naive(2) == True\nassert is_prime_naive(1) == False\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 4, title: "Factorial Trailing Zeroes — Naive", pattern: "compute factorial then count trailing zeros", skill: "multiply 1..n, convert to string, count trailing '0's",
    statement: "Return number of trailing zeroes in n!. Compute n! (big integer), then count trailing zeros. For large n, this is extremely slow and memory-heavy.",
    examples: [
      { input: "n = 5", output: "1", explain: "5! = 120, one trailing zero" },
      { input: "n = 0", output: "0" },
    ],
    why: "Computing n! directly is O(n²) big-integer multiplication and uses O(n log n) memory. The number of trailing zeros = number of factor pairs (2,5) = number of 5s in factors 1..n (since 2s are more abundant). O(log n) formula: n/5 + n/25 + n/125 + ...",
    starterCode: "def trailing_zeroes_naive(n):\n    factorial = 1\n    for i in range(2, n + 1):\n        factorial *= i\n    pass",
    hints: [
      "Compute n! = 1*2*3*...*n. Convert to string. Count trailing '0's from the right.",
      "For n=100, 100! has 158 digits and computing it is heavy.",
      "Better: Each trailing zero comes from a (2,5) pair. Count number of 5s in the factors 1..n."
    ],
    solution: "def trailing_zeroes_naive(n):\n    if n == 0:\n        return 0\n    factorial = 1\n    for i in range(2, n + 1):\n        factorial *= i\n    count = 0\n    s = str(factorial)\n    for ch in s[::-1]:\n        if ch == '0':\n            count += 1\n        else:\n            break\n    return count",
    walkthrough: "Compute n! directly. Count trailing zeros by scanning the decimal string from right. O(n) to compute factorial (each multiplication is O(digits), total O(n²) big-int). For n=10,000, factorial has ~35,000 digits — slow and memory-intensive.",
    testCode: "assert trailing_zeroes_naive(5) == 1\nassert trailing_zeroes_naive(0) == 0\nassert trailing_zeroes_naive(10) == 2\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 4, title: "Count Primes — O(n√n) Naive", pattern: "check each number individually", skill: "for each i < n, run O(√i) primality test; O(n√n)",
    statement: "Count primes < n by testing each number individually with O(√k) trial division. Total O(n√n) — much slower than the sieve (O(n log log n)). Compare.",
    examples: [
      { input: "n = 10", output: "4" },
    ],
    why: "Testing each number independently is O(n√n) because for each k, we test up to √k. Sieve is O(n log log n) — much faster for large n. The waste: recomputing divisibility from scratch for every number.",
    starterCode: "def count_primes_naive(n):\n    if n < 3:\n        return 0\n    def is_prime(k):\n        pass\n    count = 0\n    pass",
    hints: [
      "For each i in range(2, n): run is_prime(i) which checks divisibility by 2..√i.",
      "This is O(n√n). For n = 10^6, this is ~10^9 operations — too slow.",
      "Sieve (Stage 3, P16) does it in O(n log log n) — marking multiples from each prime."
    ],
    solution: "def count_primes_naive(n):\n    if n < 3:\n        return 0\n    count = 0\n    for i in range(2, n):\n        is_p = True\n        j = 2\n        while j * j <= i:\n            if i % j == 0:\n                is_p = False\n                break\n            j += 1\n        if is_p:\n            count += 1\n    return count",
    walkthrough: "For each number i in 2..n-1: test divisibility by 2..√i. O(i√i) per number. Total O(n√n). The waste: for each number, we test freshness from scratch — the sieve shares work across numbers by marking multiples.",
    testCode: "assert count_primes_naive(10) == 4\nassert count_primes_naive(2) == 0\nassert count_primes_naive(20) == 8\nprint('All tests passed!')"
  },

  // ── STAGE 5: Optimization ──
  {
    id: 26, stage: 5, title: "Pow(x,n) — Fast Exponentiation (Binary Exponentiation)", pattern: "halve exponent each step", skill: "x^n = (x²)^(n/2) if n even; if n odd: x * x^(n-1); O(log n)",
    statement: "Compute x^n using binary exponentiation (fast power). If n is even: x^n = (x*x)^(n//2). If odd: x * x^(n-1). Recursive or iterative. Handle negative n.",
    examples: [
      { input: "x = 2.0, n = 10", output: "1024.0" },
      { input: "x = 2.0, n = -2", output: "0.25" },
    ],
    why: "Fast exponentiation halves the exponent at each step. For n = 2^31, log n = 31 steps vs. 2 billion. The halving reflex (elimination reflex!) from BST applies: discard half the work each step.",
    starterCode: "def my_pow(x, n):\n    if n == 0:\n        return 1\n    if n < 0:\n        x = 1 / x\n        n = -n\n    pass",
    hints: [
      "Recursive: if n % 2 == 0: return my_pow(x*x, n//2); else: return x * my_pow(x*x, n//2).",
      "Iterative: result = 1; while n > 0: if n % 2: result *= x; x *= x; n //= 2.",
      "This is O(log n) multiplications. Each step reduces n by half."
    ],
    solution: "def my_pow(x, n):\n    if n == 0:\n        return 1\n    if n < 0:\n        x = 1 / x\n        n = -n\n    result = 1\n    while n:\n        if n % 2:\n            result *= x\n        x *= x\n        n //= 2\n    return result",
    walkthrough: "Binary exponentiation: n's binary bits tell us which powers to multiply. Bit 0 means include current x, bit 1 means skip. x squares each iteration (x, x², x⁴, x⁸...). Result accumulates when bit is set. O(log n) multiplications. Same as binary search — halving each step.",
    testCode: "assert abs(my_pow(2.0, 10) - 1024.0) < 0.001\nassert abs(my_pow(2.0, -2) - 0.25) < 0.001\nassert abs(my_pow(2.0, 0) - 1.0) < 0.001\nassert abs(my_pow(0.00001, 2147483647) - 0.0) < 0.001\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 5, title: "Sqrt — Binary Search (Elimination Reflex!)", pattern: "binary search on answer space", skill: "search integer k in [0,x] such that k*k <= x < (k+1)*(k+1)",
    statement: "Compute integer sqrt floor using binary search. The elimination reflex: if mid*mid <= x, answer is mid or right; else answer is left. Same as BST Stage 0!",
    examples: [
      { input: "x = 8", output: "2" },
      { input: "x = 0", output: "0" },
      { input: "x = 2147395599", output: "46339" },
    ],
    why: "Binary search on the answer space. The condition 'mid² <= x' is monotonic. This is the exact same elimination reflex as BST's binary search on arrays — except we're searching the number line, not an array.",
    starterCode: "def my_sqrt_binsearch(x):\n    if x <= 1:\n        return x\n    lo, hi = 0, x\n    pass",
    hints: [
      "Binary search: lo=0, hi=x. while lo <= hi: mid = (lo+hi)//2; if mid*mid <= x: lo=mid+1, ans=mid; else: hi=mid-1.",
      "Same elimination pattern as BST Stage 0. The 'array' here is the implicit range [0, x].",
      "Watch overflow: mid*mid may overflow for large x. Use mid <= x // mid instead."
    ],
    solution: "def my_sqrt_binsearch(x):\n    if x <= 1:\n        return x\n    lo, hi = 0, x\n    ans = 0\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if mid <= x // mid:\n            ans = mid\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return ans",
    walkthrough: "Binary search on [0,x]. For each mid: if mid*mid <= x, answer is mid or higher → move lo up, save mid as candidate. Else answer is lower → move hi down. Overflow-safe check: mid <= x // mid (division avoids overflow). O(log x). Exactly the BST elimination reflex applied to numbers.",
    testCode: "assert my_sqrt_binsearch(8) == 2\nassert my_sqrt_binsearch(0) == 0\nassert my_sqrt_binsearch(100) == 10\nassert my_sqrt_binsearch(2147395599) == 46339\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 5, title: "Is Prime — O(√n)", pattern: "check divisibility up to √n only", skill: "test divisors from 2 to √n; skip evens after 2",
    statement: "Check primality in O(√n). Only check divisibility up to √n (if n = a*b, min(a,b) ≤ √n). After checking 2, check only odd numbers 3,5,7,... up to √n.",
    examples: [
      { input: "n = 97", output: "True" },
      { input: "n = 100", output: "False" },
    ],
    why: "Factor pairing: if n has a divisor d > √n, then n/d < √n is also a divisor. If no divisor ≤ √n, n is prime. Checking only odd numbers after 2 halves the checks.",
    starterCode: "def is_prime_optimized(n):\n    if n <= 1:\n        return False\n    if n <= 3:\n        return True\n    if n % 2 == 0 or n % 3 == 0:\n        return False\n    pass",
    hints: [
      "Handle 2 and 3 separately. Then check i=5 while i*i <= n: if n%i==0 or n%(i+2)==0: return False; i+=6.",
      "The i,i+2 pattern skips multiples of 2 and 3. Only checks 5,7,11,13,17,19,...",
      "This is O(√n) with ~√n/3 checks instead of √n."
    ],
    solution: "def is_prime_optimized(n):\n    if n <= 1:\n        return False\n    if n <= 3:\n        return True\n    if n % 2 == 0 or n % 3 == 0:\n        return False\n    i = 5\n    while i * i <= n:\n        if n % i == 0 or n % (i + 2) == 0:\n            return False\n        i += 6\n    return True",
    walkthrough: "Factor-pair argument: any divisor > √n pairs with one < √n. Check only up to √n. Skip multiples of 2 and 3 by checking i=5,7,11,13,... (step 6). O(√n/3). For n = 10^12, √n = 10^6, ~333K checks — feasible.",
    testCode: "assert is_prime_optimized(97) == True\nassert is_prime_optimized(100) == False\nassert is_prime_optimized(2) == True\nassert is_prime_optimized(1) == False\nassert is_prime_optimized(999999000001) == True\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 5, title: "Count Primes — Sieve O(n log log n)", pattern: "optimized sieve", skill: "mark multiples from i*i with step i; skip even numbers",
    statement: "Count primes < n using optimized sieve. Only mark odd numbers (reduce array by half). For each prime p, mark from p*p stepping by 2*p (since p*p is odd, p*p+p is even, skip it).",
    examples: [
      { input: "n = 100", output: "25" },
      { input: "n = 0", output: "0" },
    ],
    why: "Standard sieve is O(n log log n). Optimizations: (1) only mark odd numbers (compact array), (2) start from p*p, (3) step by 2*p for odd numbers only. Significantly faster than O(n√n) naive.",
    starterCode: "def count_primes_sieve(n):\n    if n < 3:\n        return 0\n    is_prime = [True] * n\n    is_prime[0] = is_prime[1] = False\n    pass",
    hints: [
      "Sieve as in P16. Optimization: start marking from i*i (P16 already does this).",
      "Further optimization: skip even numbers in the sieve (store only odds). But the basic sieve suffices for LeetCode n ≤ 5*10^6.",
      "After marking, count True values. Return count."
    ],
    solution: "def count_primes_sieve(n):\n    if n < 3:\n        return 0\n    is_prime = [True] * n\n    is_prime[0] = is_prime[1] = False\n    i = 2\n    while i * i < n:\n        if is_prime[i]:\n            for j in range(i * i, n, i):\n                is_prime[j] = False\n        i += 1\n    return sum(is_prime)",
    walkthrough: "Classic sieve: for each prime i, mark its multiples starting from i*i. The inner loop steps by i. O(n log log n) — each prime p marks n/p elements, and Σ 1/p ≈ log log n. Counting is sum of True. For n = 5*10^6, fast enough.",
    testCode: "assert count_primes_sieve(100) == 25\nassert count_primes_sieve(0) == 0\nassert count_primes_sieve(2) == 0\nassert count_primes_sieve(10000) == 1229\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 5, title: "Check Perfect Square — Binary Search", pattern: "binary search for sqrt, verify square", skill: "binary search for integer k where k*k == n or floor sqrt",
    statement: "Check if n is perfect square using binary search. Search k in [0,n]: if k*k == n, True. If k*k > n, go left. If < n, go right. O(log n) instead of O(√n).",
    examples: [
      { input: "n = 16", output: "True" },
      { input: "n = 14", output: "False" },
    ],
    why: "Binary search (elimination reflex!) finds integer sqrt in O(log n). Then check if k*k == n exactly. Same as P27 but with the equality check at the end.",
    starterCode: "def is_perfect_square_bin(n):\n    if n < 0:\n        return False\n    lo, hi = 0, n\n    pass",
    hints: [
      "Binary search: lo=0, hi=n. while lo <= hi: mid = (lo+hi)//2; sq = mid*mid.",
      "If sq == n: return True. If sq < n: lo = mid+1. If sq > n: hi = mid-1.",
      "O(log n). Use mid <= n // mid for overflow-safe comparison."
    ],
    solution: "def is_perfect_square_bin(n):\n    if n < 0:\n        return False\n    lo, hi = 0, n\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        sq = mid * mid\n        if sq == n:\n            return True\n        elif sq < n:\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return False",
    walkthrough: "Binary search on [0,n]. At each step, compute mid*mid. If exact match, perfect square. If < n, answer is higher. If > n, lower. Same elimination reflex as BST. O(log n).",
    testCode: "assert is_perfect_square_bin(16) == True\nassert is_perfect_square_bin(14) == False\nassert is_perfect_square_bin(1) == True\nassert is_perfect_square_bin(0) == True\nprint('All tests passed!')"
  },

  // ── STAGE 6: Mastery ──
  {
    id: 31, stage: 6, title: "Happy Number — Floyd's Cycle Detection (Linked List Callback!)", pattern: "Floyd's tortoise and hare", skill: "use two pointers (slow, fast) to detect cycle in digit-square-sum sequence",
    statement: "Check happy number using Floyd's cycle detection. Compute digit square sum for slow (one step) and fast (two steps). If they meet and are 1, happy. If they meet and not 1, unhappy. Calls back Linked Lists Stage 2!",
    examples: [
      { input: "n = 19", output: "True" },
      { input: "n = 2", output: "False" },
    ],
    why: "Bridge problem: Floyd's cycle detection from Linked Lists (Stage 2) reapplies in a math context. The digit-square-sum defines an implicit linked list where each number points to its square-sum. Cycle = unhappy; 1 = happy.",
    starterCode: "def is_happy_floyd(n):\n    def digit_square_sum(x):\n        pass\n    slow = fast = n\n    pass",
    hints: [
      "Define digit_square_sum(x): compute sum of squares of digits. Same as P1.",
      "Floyd: slow = digit_square_sum(slow); fast = digit_square_sum(digit_square_sum(fast)). Repeat until slow == fast.",
      "If slow == 1, happy. Else, not happy (cycle detected, but not at 1)."
    ],
    solution: "def is_happy_floyd(n):\n    def digit_square_sum(x):\n        total = 0\n        while x:\n            d = x % 10\n            total += d * d\n            x //= 10\n        return total\n    slow = fast = n\n    while True:\n        slow = digit_square_sum(slow)\n        fast = digit_square_sum(digit_square_sum(fast))\n        if slow == fast:\n            break\n    return slow == 1",
    walkthrough: "Treat the sequence as an implicit linked list: each number's next = sum of squares of its digits. Floyd's cycle detector finds if it loops (unhappy) or reaches 1 (happy). At meeting point: 1 means happy, anything else means a cycle without 1. O(log n) steps per detection, same as the set method.",
    testCode: "assert is_happy_floyd(19) == True\nassert is_happy_floyd(2) == False\nassert is_happy_floyd(7) == True\nassert is_happy_floyd(4) == False\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 6, title: "Integer to Roman", pattern: "greedy subtract largest value", skill: "map values [1000,900,500,400,100,90,50,40,10,9,5,4,1]; greedily subtract and append symbol",
    statement: "Convert integer (1-3999) to Roman numeral. Greedy: from largest to smallest value-symbol pairs; while num >= value, append symbol, subtract value.",
    examples: [
      { input: "num = 3", output: "'III'" },
      { input: "num = 58", output: "'LVIII'" },
      { input: "num = 1994", output: "'MCMXCIV'" },
    ],
    why: "Greedy with canonical values: always subtract the largest possible Roman value. This works because Roman numerals have a canonical encoding — the largest-value-first greed is optimal. Compose: digit mechanics + greedy topic.",
    starterCode: "def int_to_roman(num):\n    values = [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),(90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]\n    result = []\n    pass",
    hints: [
      "Use a list of (value, symbol) pairs sorted descending. For each pair: while num >= value: append symbol, num -= value.",
      "The list includes subtractive forms (CM=900, CD=400, etc.) to handle the 4/9 pattern.",
      "Greedy works because Roman numerals have canonical greedy representation."
    ],
    solution: "def int_to_roman(num):\n    values = [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),(100,'C'),(90,'XC'),(50,'L'),(40,'XL'),(10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]\n    result = []\n    for val, sym in values:\n        while num >= val:\n            result.append(sym)\n            num -= val\n    return ''.join(result)",
    walkthrough: "Greedy: for each value-symbol pair (largest first), subtract as many times as possible. Append the corresponding symbol each time. Works because Roman representation is canonical. O(1) — at most a dozen iterations regardless of n (bounded to 3999).",
    testCode: "assert int_to_roman(3) == 'III'\nassert int_to_roman(58) == 'LVIII'\nassert int_to_roman(1994) == 'MCMXCIV'\nassert int_to_roman(3999) == 'MMMCMXCIX'\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 6, title: "Roman to Integer", pattern: "right-to-left accumulation with subtractive rule", skill: "if current symbol value < previous (rightward) value, subtract; else add",
    statement: "Convert Roman numeral string to integer. Process right to left: if current value < previous value (seen on right), subtract; else add. The rule: IV=4 because I < V, so I is subtracted.",
    examples: [
      { input: "s = 'III'", output: "3" },
      { input: "s = 'LVIII'", output: "58" },
      { input: "s = 'MCMXCIV'", output: "1994" },
    ],
    why: "Right-to-left reading: when a smaller symbol appears before a larger one, it's subtracted (IV=4). Processing right-to-left naturally handles subtractive notation: compare current with the previous (right neighbor).",
    starterCode: "def roman_to_int(s):\n    roman_map = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}\n    total = 0\n    prev = 0\n    pass",
    hints: [
      "Iterate right to left. For each char: if roman_map[char] < prev: total -= roman_map[char]; else: total += roman_map[char].",
      "prev = roman_map[char] (track the previous rightward value).",
      "Example: 'IV': right-to-left: V=5, I=1<5 so subtract → 5-1=4."
    ],
    solution: "def roman_to_int(s):\n    roman_map = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}\n    total = 0\n    prev = 0\n    for ch in s[::-1]:\n        val = roman_map[ch]\n        if val < prev:\n            total -= val\n        else:\n            total += val\n        prev = val\n    return total",
    walkthrough: "Process right-to-left. For each symbol: if its value is less than the previously processed (rightward) symbol, subtract. Otherwise, add. 'MCMXCIV': V=5 (+5, prev=5); I=1<5, -1 (+4, prev=1); C=100>C prev → +100 (+104, prev=100); X=10<100, -10 (+94)... Result: 1994.",
    testCode: "assert roman_to_int('III') == 3\nassert roman_to_int('LVIII') == 58\nassert roman_to_int('MCMXCIV') == 1994\nassert roman_to_int('IV') == 4\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 6, title: "Random Pick with Weight (Prefix Sum + Binary Search)", pattern: "prefix sum + binary search on cumulative weights", skill: "build prefix sum array; pick random number in [0,total); binary search to find which bucket it falls into",
    statement: "Given array w of positive weights, implement pickIndex(): returns index i with probability proportional to w[i]. Build prefix sum array. Generate random r in [0, total). Binary search for first index where prefix[i] > r.",
    examples: [
      { input: "w = [1,3]; pickIndex() called many times", output: "index 1 returns 3x more often than index 0" },
    ],
    why: "Prefix sum transforms weight array into cumulative buckets. Binary search (BST callback!) finds which bucket a random number falls into. Compose: prefix sums (DP topic) + binary search (BST topic) + probability.",
    starterCode: "def pick_index(w):\n    import random, bisect\n    prefix = []\n    total = 0\n    for wt in w:\n        total += wt\n        prefix.append(total)\n    rand_val = random.random() * total\n    pass",
    hints: [
      "Build prefix sum array. total = prefix[-1].",
      "Generate random number r = random.random() * total (uniform in [0,total)).",
      "Use bisect.bisect_left(prefix, r) to find the first index where prefix[i] > r. Return that index."
    ],
    solution: "import random\nimport bisect\n\ndef pick_index(w):\n    prefix = []\n    for wt in w:\n        prev = prefix[-1] if prefix else 0\n        prefix.append(prev + wt)\n    total = prefix[-1]\n    r = random.random() * total\n    return bisect.bisect_left(prefix, r)",
    walkthrough: "Prefix sums partition [0, total) into intervals proportional to weights. Random r in [0,total) falls into one interval. Binary search finds the right index. Compose: prefix sums (DP) + binary search (BST). O(log n) per pick.",
    testCode: "w = [1,3]\ncounts = [0,0]\nfor _ in range(10000):\n    idx = pick_index(w)\n    counts[idx] += 1\nassert counts[1] > counts[0] * 1.5\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 6, title: "Multiply Strings", pattern: "digit-by-digit multiplication with carry", skill: "multiply each digit of num1 with each digit of num2; accumulate into result array with position offset",
    statement: "Given two non-negative integers as strings, return their product as a string. Cannot use built-in big integer multiplication. Do digit-by-digit: multiply each digit of num1[i] with num2[j], add to result[i+j+1], propagate carry.",
    examples: [
      { input: "num1 = '123', num2 = '456'", output: "'56088'" },
      { input: "num1 = '2', num2 = '3'", output: "'6'" },
    ],
    why: "Digit mechanics (Stage 1) + array accumulation. Each pair of digits contributes to a specific position in the result. The product of an m-digit and n-digit number is at most m+n digits. Carry propagation unifies the partial products.",
    starterCode: "def multiply_strings(num1, num2):\n    if num1 == '0' or num2 == '0':\n        return '0'\n    m, n = len(num1), len(num2)\n    result = [0] * (m + n)\n    pass",
    hints: [
      "Create result array of size m+n. Iterate i in reversed(m), j in reversed(n): multiply digits, add to result[i+j+1], split into carry and unit.",
      "prod = (ord(num1[i])-48) * (ord(num2[j])-48) + result[i+j+1]; result[i+j+1] = prod % 10; result[i+j] += prod // 10.",
      "Convert result to string, skip leading zeros."
    ],
    solution: "def multiply_strings(num1, num2):\n    if num1 == '0' or num2 == '0':\n        return '0'\n    m, n = len(num1), len(num2)\n    result = [0] * (m + n)\n    for i in range(m - 1, -1, -1):\n        for j in range(n - 1, -1, -1):\n            prod = (ord(num1[i]) - 48) * (ord(num2[j]) - 48)\n            total = prod + result[i + j + 1]\n            result[i + j + 1] = total % 10\n            result[i + j] += total // 10\n    idx = 0\n    while idx < len(result) and result[idx] == 0:\n        idx += 1\n    return ''.join(str(d) for d in result[idx:])",
    walkthrough: "School multiplication: for each digit of num1 (right to left), multiply with each digit of num2. The product contributes to position i+j+1 (units) and i+j (carry). Accumulate into result array. After all pairs processed, skip leading zeros and convert to string. O(m*n). Compose: digit peel + array accumulation.",
    testCode: "assert multiply_strings('123', '456') == '56088'\nassert multiply_strings('2', '3') == '6'\nassert multiply_strings('0', '5') == '0'\nassert multiply_strings('999', '999') == '998001'\nprint('All tests passed!')"
  },

  // ── STAGE 0: Pattern Reflex (extended) ──
  // NEW
  {
    id: 36, stage: 0, title: "Subtract Product and Sum of Digits", pattern: "compute product and sum; return difference", skill: "compute the product and sum of digits of n; return product - sum",
    statement: "Given integer n, compute the product of its digits and the sum of its digits. Return the difference: product - sum.",
    examples: [
      { input: "n = 234", output: "15", explain: "product=2*3*4=24, sum=2+3+4=9; 24-9=15" },
      { input: "n = 4421", output: "21", explain: "product=4*4*2*1=32, sum=11; 32-11=21" }
    ],
    why: "Pattern reflex: this is pure digit mechanics — extract digits, compute two aggregates, subtract. Simple enough to focus on the pattern (digit extraction loop) without distraction.",
    starterCode: "def subtract_product_and_sum(n):\n    product = 1\n    total = 0\n    pass",
    hints: [
      "While n > 0: digit = n % 10; product *= digit; total += digit; n //= 10.",
      "Return product - total. For n=0, the loop doesn't run; product=1, total=0 -> result=1. Handle n==0 by returning 0.",
      "The pattern: peel digits right-to-left, accumulate product and sum in one pass."
    ],
    solution: "def subtract_product_and_sum(n):\n    if n == 0:\n        return 0\n    product = 1\n    total = 0\n    while n > 0:\n        digit = n % 10\n        product *= digit\n        total += digit\n        n //= 10\n    return product - total",
    walkthrough: "Extract digits via modulo 10 and integer division. Accumulate product and sum simultaneously. O(log n). The pattern 'compute two aggregates from digits' appears in multiple forms (happy number, add digits, etc.).",
    testCode: "assert subtract_product_and_sum(234) == 15\nassert subtract_product_and_sum(4421) == 21\nassert subtract_product_and_sum(0) == 0\nassert subtract_product_and_sum(111) == -2\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 37, stage: 0, title: "Number of 1 Bits (Popcount)", pattern: "count set bits with n & (n-1) trick", skill: "while n > 0: n &= n-1; count++; each operation clears the lowest set bit",
    statement: "Given unsigned integer n, return the number of '1' bits (Hamming weight). Use the bit trick: n & (n-1) clears the lowest set bit. Count how many times you can do this until n becomes 0.",
    examples: [
      { input: "n = 11", output: "3", explain: "binary 1011, three 1-bits" },
      { input: "n = 128", output: "1", explain: "binary 10000000" },
      { input: "n = 0", output: "0" }
    ],
    why: "Pattern reflex: small cases (n=0->0, n=1->1, n=2->1, n=3->2...) reveal the pattern of bit counting. The trick n &= n-1 clears the least significant set bit. Counting iterations counts 1-bits. O(number of 1-bits).",
    starterCode: "def hamming_weight(n):\n    count = 0\n    pass",
    hints: [
      "While n > 0: n = n & (n - 1); count += 1.",
      "n & (n-1) flips the lowest 1-bit to 0. Example: n=12 (1100), n-1=11 (1011), 1100 & 1011 = 1000 (8). Lowest 1-bit cleared.",
      "Return count. Alternative: while n: count += n & 1; n >>= 1 (O(number of bits))."
    ],
    solution: "def hamming_weight(n):\n    count = 0\n    while n:\n        n &= n - 1\n        count += 1\n    return count",
    walkthrough: "The pattern: n & (n-1) removes the lowest set bit. For n = 1011 (11): 1011 & 1010 = 1010 (10, -1 bit); 1010 & 1001 = 1000 (8, -1 bit); 1000 & 0111 = 0000 (0, -1 bit). 3 iterations = 3 one-bits. O(k) where k = number of 1-bits.",
    testCode: "assert hamming_weight(11) == 3\nassert hamming_weight(128) == 1\nassert hamming_weight(0) == 0\nassert hamming_weight(7) == 3\nprint('All tests passed!')"
  },

  // ── STAGE 1: Digit Mechanics (extended) ──
  // NEW
  {
    id: 38, stage: 1, title: "Add Strings", pattern: "digit-by-digit decimal addition with carry", skill: "process both strings from right; add digits with carry; build result from LSB to MSB",
    statement: "Given two non-negative integer strings num1 and num2, return their sum as a string. Do not convert to int directly. Traverse both strings from right to left, add corresponding digits with carry, and build the result string.",
    examples: [
      { input: "num1 = '456', num2 = '77'", output: "'533'", explain: "456+77=533" },
      { input: "num1 = '0', num2 = '0'", output: "'0'" },
      { input: "num1 = '999', num2 = '1'", output: "'1000'" }
    ],
    why: "Digit mechanics: the elementary-school addition algorithm. Right-to-left scan with carry. Same pattern as Plus One (P10) but with two numbers. The carry propagates digit by digit.",
    starterCode: "def add_strings(num1, num2):\n    i, j = len(num1) - 1, len(num2) - 1\n    carry = 0\n    result = []\n    pass",
    hints: [
      "While i >= 0 or j >= 0 or carry: digit1 = ord(num1[i]) - 48 if i >= 0 else 0; digit2 similarly.",
      "total = digit1 + digit2 + carry. result.append(str(total % 10)). carry = total // 10.",
      "Reverse result before joining. O(max(m,n))."
    ],
    solution: "def add_strings(num1, num2):\n    i, j = len(num1) - 1, len(num2) - 1\n    carry = 0\n    result = []\n    while i >= 0 or j >= 0 or carry:\n        d1 = ord(num1[i]) - 48 if i >= 0 else 0\n        d2 = ord(num2[j]) - 48 if j >= 0 else 0\n        total = d1 + d2 + carry\n        result.append(str(total % 10))\n        carry = total // 10\n        i -= 1\n        j -= 1\n    return ''.join(result[::-1])",
    walkthrough: "Right-to-left digit addition with carry. For each position: sum both digits (or 0 if exhausted) plus carry. The unit digit goes to the result, the tens digit becomes the next carry. After both strings are processed, if carry remains, append it. Reverse the result (built LSB-first). O(max(m,n)).",
    testCode: "assert add_strings('456', '77') == '533'\nassert add_strings('0', '0') == '0'\nassert add_strings('999', '1') == '1000'\nassert add_strings('123456789', '987654321') == '1111111110'\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 39, stage: 1, title: "Add Binary", pattern: "digit-by-digit binary addition with carry (base 2)", skill: "same skeleton as Add Strings but base 2; carry = sum // 2, digit = sum % 2",
    statement: "Given two binary strings a and b, return their sum as a binary string. Same pattern as Add Strings (P38) but in base 2. Process right to left: digit = total % 2, carry = total // 2.",
    examples: [
      { input: "a = '1010', b = '1011'", output: "'10101'", explain: "1010+1011=10101 (10+11=21)" },
      { input: "a = '11', b = '1'", output: "'100'", explain: "3+1=4" }
    ],
    why: "Same digit mechanics as Add Strings (P38) but with base 2. The identical skeleton — right-to-left scan with carry — reinforces the digit-peel pattern. Only the base changes.",
    starterCode: "def add_binary(a, b):\n    i, j = len(a) - 1, len(b) - 1\n    carry = 0\n    result = []\n    pass",
    hints: [
      "Exact same loop structure as add_strings. Extract digits with ord(c)-48.",
      "total = digit_a + digit_b + carry. result.append(str(total % 2)). carry = total // 2.",
      "Reverse result. Handle the carry at the end. Return '0' for empty result."
    ],
    solution: "def add_binary(a, b):\n    i, j = len(a) - 1, len(b) - 1\n    carry = 0\n    result = []\n    while i >= 0 or j >= 0 or carry:\n        da = ord(a[i]) - 48 if i >= 0 else 0\n        db = ord(b[j]) - 48 if j >= 0 else 0\n        total = da + db + carry\n        result.append(str(total % 2))\n        carry = total // 2\n        i -= 1\n        j -= 1\n    return ''.join(result[::-1])",
    walkthrough: "Same skeleton as Add Strings: right-to-left, digit extraction, carry propagation. Only difference: mod and div by 2 instead of 10. The digit mechanics pattern generalizes to any base. O(max(m,n)).",
    testCode: "assert add_binary('1010', '1011') == '10101'\nassert add_binary('11', '1') == '100'\nassert add_binary('0', '0') == '0'\nassert add_binary('1111', '1111') == '11110'\nprint('All tests passed!')"
  },

  // ── STAGE 2: The GCD Story (extended) ──
  // NEW
  {
    id: 40, stage: 2, title: "Greatest Common Divisor of Strings", pattern: "if s+t == t+s, common root = s[:gcd(len(s), len(t))]", skill: "strings s and t share a common pattern iff s+t == t+s; return s[:gcd(len(s), len(t))]",
    statement: "For two strings s and t, find the largest string x such that x concatenated repeatedly equals both s and t. This exists iff s+t == t+s. If so, the answer is s[:gcd(len(s), len(t))]. Uses gcd of lengths — a callback to GCD.",
    examples: [
      { input: "str1 = 'ABCABC', str2 = 'ABC'", output: "'ABC'", explain: "ABC repeated 2x = s, 1x = t" },
      { input: "str1 = 'ABABAB', str2 = 'ABAB'", output: "'AB'" },
      { input: "str1 = 'LEET', str2 = 'CODE'", output: "''", explain: "s+t != t+s, no common divisor" }
    ],
    why: "If s+t == t+s, both strings are repetitions of the same base string. The length of that base string is gcd(len(s), len(t)). Compose: GCD (Stage 2) with string operations — the mathematical structure of divisibility extends to strings.",
    starterCode: "def gcd_of_strings(str1, str2):\n    from math import gcd\n    if str1 + str2 != str2 + str1:\n        return ''\n    return str1[:gcd(len(str1), len(str2))]",
    hints: [
      "Check if concatenation in both orders is equal: str1 + str2 == str2 + str1. If not, no common divisor.",
      "If equal, compute g = gcd(len(str1), len(str2)). Return str1[:g].",
      "Why? Because if both strings repeat the same base pattern, the base length must divide both string lengths. The gcd gives the longest possible base."
    ],
    solution: "def gcd_of_strings(str1, str2):\n    from math import gcd\n    if str1 + str2 != str2 + str1:\n        return ''\n    return str1[:gcd(len(str1), len(str2))]",
    walkthrough: "The condition s+t == t+s guarantees both strings are repetitions of the same base. The base's length must divide both string lengths — by Bezout's theorem / GCD properties, the longest valid base has length gcd(len(s), len(t)). The prefix of that length is the answer. O(len(s)+len(t)).",
    testCode: "assert gcd_of_strings('ABCABC', 'ABC') == 'ABC'\nassert gcd_of_strings('ABABAB', 'ABAB') == 'AB'\nassert gcd_of_strings('LEET', 'CODE') == ''\nassert gcd_of_strings('AAAA', 'AA') == 'AA'\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 41, stage: 2, title: "Normalize Vector Direction (GCD of Moves)", pattern: "reduce movement vector (dx,dy) by gcd to a primitive direction", skill: "compute g = gcd(|dx|, |dy|); return (dx//g, dy//g) — the irreducible direction",
    statement: "Given a movement vector (dx, dy) on a 2D grid, reduce it to the smallest integer step in the same direction. Compute g = gcd(|dx|, |dy|). The primitive direction is (dx // g, dy // g). This is used in slope normalization and ray-casting algorithms.",
    examples: [
      { input: "dx = 6, dy = 8", output: "(3, 4)", explain: "gcd(6,8)=2; (6//2,8//2)=(3,4)" },
      { input: "dx = -9, dy = 3", output: "(-3, 1)", explain: "gcd(9,3)=3; (-9//3,3//3)=(-3,1)" },
      { input: "dx = 0, dy = 5", output: "(0, 1)", explain: "gcd(0,5)=5; (0,1)" }
    ],
    why: "GCD reduces a vector to its primitive form — the 'greatest common divisor' of the components is the step count to reach the destination in minimal hops. This is the fundamental use of GCD in computational geometry: normalizing slopes and directions.",
    starterCode: "def primitive_direction(dx, dy):\n    from math import gcd\n    g = gcd(abs(dx), abs(dy))\n    if g == 0:\n        return (0, 0)\n    return (dx // g, dy // g)",
    hints: [
      "Compute g = gcd(|dx|, |dy|). If g == 0 (both zero), return (0,0).",
      "Divide both components by g to get the smallest integer direction vector.",
      "Used in slope normalization: slopes 4/6 and 2/3 represent the same line direction."
    ],
    solution: "def primitive_direction(dx, dy):\n    from math import gcd\n    g = gcd(abs(dx), abs(dy))\n    if g == 0:\n        return (0, 0)\n    return (dx // g, dy // g)",
    walkthrough: "GCD reduces (dx, dy) to its simplest integer ratio. For (6,8), gcd=2, primitive=(3,4). This is the smallest integer vector on the same ray from origin. Used for slope normalization: two slopes represent the same line iff their primitive directions match. O(log min(|dx|,|dy|)).",
    testCode: "assert primitive_direction(6, 8) == (3, 4)\nassert primitive_direction(-9, 3) == (-3, 1)\nassert primitive_direction(0, 5) == (0, 1)\nassert primitive_direction(0, 0) == (0, 0)\nprint('All tests passed!')"
  },

  // ── STAGE 3: Primes & Factors (extended) ──
  // NEW
  {
    id: 42, stage: 3, title: "Perfect Number", pattern: "check if sum of proper divisors equals n", skill: "for divisors 1..sqrt(n): if i divides n, add i + n//i; exclude n itself; check sum == n",
    statement: "A perfect number is a positive integer n whose sum of proper divisors (excluding n) equals n. E.g., 28 = 1+2+4+7+14. Iterate i from 1 to sqrt(n): if n % i == 0, add both i and n//i (except when i == n//i or i == n). Compare final sum with n.",
    examples: [
      { input: "n = 28", output: "True", explain: "proper divisors: 1,2,4,7,14 -> sum=28" },
      { input: "n = 7", output: "False" },
      { input: "n = 6", output: "True", explain: "1+2+3=6" }
    ],
    why: "The pairing pattern from primes (Stage 3): divisors come in pairs (i, n//i). Sum proper divisors up to sqrt(n), collecting both pair members. O(sqrt(n)). This is the same pairing as prime checking — just summing instead of checking count.",
    starterCode: "def is_perfect_number(n):\n    if n <= 1:\n        return False\n    total = 1\n    i = 2\n    pass",
    hints: [
      "Start total = 1 (1 is always a proper divisor for n > 1). Loop i from 2 to sqrt(n).",
      "If n % i == 0: total += i. If i != n // i: total += n // i.",
      "Return total == n. O(sqrt(n))."
    ],
    solution: "def is_perfect_number(n):\n    if n <= 1:\n        return False\n    total = 1\n    i = 2\n    while i * i <= n:\n        if n % i == 0:\n            total += i\n            if i != n // i:\n                total += n // i\n        i += 1\n    return total == n",
    walkthrough: "Accumulate sum of proper divisors using the divisor-pairing pattern. Start with 1 (always a divisor). For each i from 2 to sqrt(n): if i divides n, add i and its pair n//i (if different). Exclude n itself (pair of 1). Compare sum to n. O(sqrt(n)).",
    testCode: "assert is_perfect_number(28) == True\nassert is_perfect_number(7) == False\nassert is_perfect_number(6) == True\nassert is_perfect_number(496) == True\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 43, stage: 3, title: "Three Divisors", pattern: "n has exactly 3 divisors iff n = p^2 where p is prime", skill: "check if sqrt(n) is integer and prime; if so, True (divisors: 1, p, n)",
    statement: "Check if n has exactly 3 positive divisors. Observation: a number has exactly 3 divisors iff it is the square of a prime (n = p^2). Divisors would be: 1, p, p^2. Check: (1) sqrt(n) is an integer k, (2) k is prime. Return True if both hold.",
    examples: [
      { input: "n = 4", output: "True", explain: "4=2^2; divisors: 1,2,4 -> 3 divisors" },
      { input: "n = 9", output: "True" },
      { input: "n = 16", output: "False", explain: "16=4^2, but 4 is not prime; divisors: 1,2,4,8,16 -> 5 divisors" }
    ],
    why: "The pairing insight: divisors come in pairs (d, n/d). The ONLY way to get an ODD number of divisors is when one divisor pairs with itself -> n is a perfect square. And exactly 3 divisors means exactly one proper divisor besides 1 and n -> that divisor must be prime. Compose: square check + primality.",
    starterCode: "def has_three_divisors(n):\n    import math\n    if n < 2:\n        return False\n    k = math.isqrt(n)\n    pass",
    hints: [
      "Compute integer sqrt k = isqrt(n). If k*k != n, not a perfect square -> return False.",
      "Check if k is prime: handle k <= 1 -> False. Check divisibility by 2..sqrt(k). If k is prime, n has exactly 3 divisors.",
      "Divisors of n=p^2: 1, p, p^2. Any other form would have a different count."
    ],
    solution: "def has_three_divisors(n):\n    import math\n    if n < 2:\n        return False\n    k = math.isqrt(n)\n    if k * k != n:\n        return False\n    if k <= 1:\n        return False\n    i = 2\n    while i * i <= k:\n        if k % i == 0:\n            return False\n        i += 1\n    return True",
    walkthrough: "A number has exactly 3 divisors iff it's the square of a prime. Check: (1) n is a perfect square (k^2 = n). (2) k is prime. The divisor set would be {1, k, k^2=n} — exactly 3. Any composite k would introduce more divisors. O(n^(1/4)).",
    testCode: "assert has_three_divisors(4) == True\nassert has_three_divisors(9) == True\nassert has_three_divisors(16) == False\nassert has_three_divisors(25) == True\nprint('All tests passed!')"
  },

  // ── STAGE 4: Naive (extended) ──
  // NEW
  {
    id: 44, stage: 4, title: "Power of Three — Naive Multiplication", pattern: "multiply 1 by 3 repeatedly until >= n", skill: "result = 1; while result < n: result *= 3; return result == n",
    statement: "Check if n is a power of three. Naive: repeatedly multiply 1 by 3 until the result is >= n. If result == n, n is a power of three. O(log_3 n) multiplications.",
    examples: [
      { input: "n = 27", output: "True", explain: "1*3=3*3=9*3=27" },
      { input: "n = 0", output: "False" },
      { input: "n = 45", output: "False" }
    ],
    why: "The naive approach works — O(log_3 n) multiplications. But each multiplication takes time (big-int for large n). The optimized formula (Stage 5) uses the fact that 3^19 = 1162261467 is the max power of 3 in 32-bit signed int: check if 3^19 % n == 0 — O(1).",
    starterCode: "def is_power_of_three_naive(n):\n    if n <= 0:\n        return False\n    x = 1\n    pass",
    hints: [
      "x = 1. While x < n: x *= 3. Return x == n.",
      "This is O(log_3 n). For n = 3^19, ~20 iterations. Acceptable but not O(1).",
      "Optimization (Stage 5): max power of 3 in 32-bit int is 3^19. Check n > 0 and 3^19 % n == 0."
    ],
    solution: "def is_power_of_three_naive(n):\n    if n <= 0:\n        return False\n    x = 1\n    while x < n:\n        x *= 3\n    return x == n",
    walkthrough: "Generate powers of three by repeated multiplication: 1, 3, 9, 27, ... until x >= n. Check equality. O(log_3 n). For 32-bit integers, at most 20 iterations. The waste: each iteration recomputes the next power — the formula avoids the loop entirely.",
    testCode: "assert is_power_of_three_naive(27) == True\nassert is_power_of_three_naive(0) == False\nassert is_power_of_three_naive(45) == False\nassert is_power_of_three_naive(1) == True\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 45, stage: 4, title: "Bulb Switcher — Naive Simulation", pattern: "simulate n rounds of toggling bulbs; O(n log n)", skill: "create boolean array; for round i, toggle every i-th bulb; count True after n rounds",
    statement: "There are n bulbs, all initially off. In round i (1-indexed), toggle every i-th bulb. After n rounds, count how many bulbs are on. Naive: simulate with a boolean array. For each round i, toggle bulbs at indices i-1, 2i-1, 3i-1, ... O(n log n).",
    examples: [
      { input: "n = 3", output: "1", explain: "round1: all on; round2: toggle 2->off; round3: toggle 3->on; bulbs: on,off,off -> 1 on" },
      { input: "n = 0", output: "0" },
      { input: "n = 4", output: "2", explain: "bulbs 1 and 4 remain on (square numbers)" }
    ],
    why: "Simulation O(n log n) works for small n. For n = 10^6: ~14M operations — barely passable. The pattern: bulb i is toggled for each divisor of i. Final state = on iff number of divisors is odd, which happens only for perfect squares. Observation enables O(1) formula.",
    starterCode: "def bulb_switch_naive(n):\n    bulbs = [False] * n\n    for rnd in range(1, n + 1):\n        for i in range(rnd - 1, n, rnd):\n            bulbs[i] = not bulbs[i]\n    return sum(bulbs)",
    hints: [
      "Create boolean array of size n (all False). For round from 1 to n: toggle every round-th bulb.",
      "After n rounds, count True values (sum of boolean list).",
      "This is O(n log n). The formula (Stage 5) makes it O(1): just return int(sqrt(n))."
    ],
    solution: "def bulb_switch_naive(n):\n    bulbs = [False] * n\n    for rnd in range(1, n + 1):\n        for i in range(rnd - 1, n, rnd):\n            bulbs[i] = not bulbs[i]\n    return sum(bulbs)",
    walkthrough: "Simulate: round i toggles bulbs at indices i-1, 2i-1, 3i-1... The inner loop runs n/i times. Total = n * sum(1/i) = n * H_n ~ n log n. For n=10^6, ~14M operations. The formula (Stage 5) replaces all simulation with one square root.",
    testCode: "assert bulb_switch_naive(3) == 1\nassert bulb_switch_naive(0) == 0\nassert bulb_switch_naive(4) == 2\nassert bulb_switch_naive(1) == 1\nprint('All tests passed!')"
  },

  // ── STAGE 5: Optimization (extended) ──
  // NEW
  {
    id: 46, stage: 5, title: "Power of Three — O(1) Max Power Check", pattern: "if n > 0 and 3^19 % n == 0, return True", skill: "the largest power of 3 in 32-bit signed int is 3^19 = 1162261467; check if it divides n",
    statement: "Optimize power-of-three check to O(1). The maximum power of 3 within 32-bit signed integer range is 3^19 = 1162261467. If n is a power of three, it must divide this max power. Check: n > 0 and 1162261467 % n == 0.",
    examples: [
      { input: "n = 27", output: "True" },
      { input: "n = 0", output: "False" },
      { input: "n = 45", output: "False" }
    ],
    why: "This is the 'elimination reflex': if n is a power of three, it must be a divisor of the maximum power of three in the integer range. One modulo operation replaces the entire loop. O(1).",
    starterCode: "def is_power_of_three(n):\n    return n > 0 and 3 ** 19 % n == 0",
    hints: [
      "Compute the largest power of 3 in 32-bit int: 3^19 = 1162261467.",
      "If n > 0 and this max power is divisible by n, n must be a power of three.",
      "Why? Any power of three <= MAX_POW divides MAX_POW. If n is not a power of three, MAX_POW won't be divisible by n (since 3 is prime)."
    ],
    solution: "def is_power_of_three(n):\n    return n > 0 and 3 ** 19 % n == 0",
    walkthrough: "The max power of 3 in 32-bit signed int is 3^19 = 1162261467. Every power of three <= this divides 3^19. No non-power-of-three number divides 3^19 (since 3 is prime, 3^19 has only powers of 3 as divisors). O(1) — one modulo check replaces the O(log n) loop.",
    testCode: "assert is_power_of_three(27) == True\nassert is_power_of_three(0) == False\nassert is_power_of_three(45) == False\nassert is_power_of_three(1) == True\nassert is_power_of_three(9) == True\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 47, stage: 5, title: "Bulb Switcher — O(1) Formula", pattern: "only square-numbered bulbs remain on; return int(sqrt(n))", skill: "bulb i is toggled once per divisor; on iff divisor count is odd -> i is a perfect square",
    statement: "Optimize bulb switcher to O(1). Bulb i is toggled for each divisor of i. The final state is ON if the number of divisors is odd. Only perfect squares have an odd number of divisors (since divisors pair up, except when d = i/d). Count perfect squares <= n: floor(sqrt(n)).",
    examples: [
      { input: "n = 3", output: "1" },
      { input: "n = 4", output: "2" },
      { input: "n = 99999", output: "316" }
    ],
    why: "The elimination reflex: the simulation reveals that only square-numbered bulbs end on. The formula eliminates the entire O(n log n) simulation with one square root. This is the same 'observe pattern -> formula' move as Stage 0 but applied to optimization.",
    starterCode: "def bulb_switch(n):\n    import math\n    return math.isqrt(n)",
    hints: [
      "Bulb i toggles when round number divides i. Total toggles = number of divisors of i.",
      "Divisors pair up (d, i/d). If d != i/d, pair contributes 2 toggles (even). Only when d = i/d (i is perfect square) does a divisor pair with itself — making the count odd.",
      "So bulb i stays ON iff i is a perfect square. Count = floor(sqrt(n))."
    ],
    solution: "def bulb_switch(n):\n    import math\n    return math.isqrt(n)",
    walkthrough: "Key insight: for each bulb i, it is toggled in round k if k divides i. Final state ON iff i has odd number of divisors. Divisors come in pairs (d, i/d) — always even count, except when d = i/d, i.e., i = d^2. So ON bulbs = count of squares <= n = floor(sqrt(n)). O(1) replaces O(n log n) simulation.",
    testCode: "assert bulb_switch(3) == 1\nassert bulb_switch(4) == 2\nassert bulb_switch(0) == 0\nassert bulb_switch(1) == 1\nassert bulb_switch(99999) == 316\nprint('All tests passed!')"
  },

  // ── STAGE 6: Mastery (extended) ──
  // NEW
  {
    id: 48, stage: 6, title: "Base 7 Conversion", pattern: "convert integer to base-7 string; handle sign", skill: "repeatedly divide by 7; collect remainders as digits; reverse; prepend '-' if negative",
    statement: "Given an integer num, return its base-7 representation as a string. Handle negative numbers (prepend '-'). Convert by repeatedly dividing by 7: append remainder (abs(num) % 7) as a digit, divide abs(num) by 7. Reverse and handle sign.",
    examples: [
      { input: "num = 100", output: "'202'", explain: "100 = 2*7^2 + 0*7 + 2 -> '202'" },
      { input: "num = -7", output: "'-10'", explain: "7 = 1*7 + 0, with sign -> '-10'" },
      { input: "num = 0", output: "'0'" }
    ],
    why: "Compose: digit mechanics (Stage 1 — peel digits via % and //) with sign handling. Base conversion generalizes the digit-peel pattern to any radix. The modular arithmetic from Stage 2: n % 7 extracts the least significant digit in base 7.",
    starterCode: "def convert_to_base7(num):\n    if num == 0:\n        return '0'\n    negative = num < 0\n    num = abs(num)\n    digits = []\n    pass",
    hints: [
      "Handle 0 (return '0'). Track sign. Work with abs(num).",
      "While num > 0: digits.append(str(num % 7)); num //= 7.",
      "Reverse digits. Prepend '-' if negative. Join and return."
    ],
    solution: "def convert_to_base7(num):\n    if num == 0:\n        return '0'\n    negative = num < 0\n    num = abs(num)\n    digits = []\n    while num > 0:\n        digits.append(str(num % 7))\n        num //= 7\n    if negative:\n        digits.append('-')\n    return ''.join(digits[::-1])",
    walkthrough: "Digit-peel generalized to base 7: n % 7 extracts the least significant base-7 digit, n //= 7 shifts right. Build digits from LSB to MSB. After loop, reverse and handle sign. The same pattern works for any base (2, 8, 16). O(log_7 n). Compose: digit mechanics + modulo.",
    testCode: "assert convert_to_base7(100) == '202'\nassert convert_to_base7(-7) == '-10'\nassert convert_to_base7(0) == '0'\nassert convert_to_base7(49) == '100'\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 49, stage: 6, title: "Complement of Base 10 Integer", pattern: "flip all bits: compute bitmask = (1 << bit_length) - 1; return n ^ mask", skill: "find the smallest power of two greater than n, subtract 1 to get all-ones mask of same bit-length, XOR with n",
    statement: "Given non-negative integer n, return its complement (flip all bits in its binary representation without leading zeros). E.g., 5 (101) -> 2 (010). Compute mask = (1 << bit_length(n)) - 1 (all 1s for the same number of bits). Return n ^ mask.",
    examples: [
      { input: "n = 5", output: "2", explain: "5=101, flip->010=2" },
      { input: "n = 1", output: "0", explain: "1=1, flip->0=0" },
      { input: "n = 0", output: "1" }
    ],
    why: "Compose: bit manipulation (Stage 0 popcount callback) + power-of-two computation. The mask = 2^k - 1 where k = number of bits in n. XORing n with this mask flips all bits. Mastery: combines bit-length finding, power-of-two, and XOR in one elegant formula.",
    starterCode: "def bitwise_complement(n):\n    if n == 0:\n        return 1\n    mask = 1\n    pass",
    hints: [
      "If n == 0, return 1 (special case: complement of 0 is 1).",
      "Compute mask: start mask = 1; while mask <= n: mask <<= 1. Then mask -= 1 to get all 1s of the same bit-length.",
      "Return n ^ mask (XOR). Alternative: mask = (1 << n.bit_length()) - 1."
    ],
    solution: "def bitwise_complement(n):\n    if n == 0:\n        return 1\n    mask = 1\n    while mask <= n:\n        mask <<= 1\n    mask -= 1\n    return n ^ mask",
    walkthrough: "Find bit-length of n. Create a mask of that many 1s: mask = (1 << bitlen) - 1. XOR n with mask to flip all bits within the original bit-width. E.g., n=5 (101), mask=7 (111), 101^111=010=2. Compose: bit-length + power-of-two + XOR. O(log n).",
    testCode: "assert bitwise_complement(5) == 2\nassert bitwise_complement(1) == 0\nassert bitwise_complement(0) == 1\nassert bitwise_complement(7) == 0\nprint('All tests passed!')"
  },
  // NEW
  {
    id: 50, stage: 6, title: "Factorial Trailing Zeroes — Formula", pattern: "count factors of 5: n//5 + n//25 + n//125 + ...", skill: "each trailing zero comes from a (2,5) pair; 2s are abundant, so count 5s in 1..n",
    statement: "Given n, return number of trailing zeroes in n!. Each trailing zero = factor of 10 = one (2,5) pair. Since 2s are more abundant than 5s in 1..n, the limiting factor is the count of 5s. Count: n//5 + n//25 + n//125 + ... (all powers of 5 <= n).",
    examples: [
      { input: "n = 5", output: "1", explain: "5! = 120, one trailing zero" },
      { input: "n = 25", output: "6", explain: "25/5=5, 25/25=1, total=6" },
      { input: "n = 0", output: "0" }
    ],
    why: "Compose: factor counting (primes Stage 3) + logarithmic series. The insight: count = sum floor(n/5^k) for k=1,2,... while 5^k <= n. This replaces the O(n^2) factorial computation with O(log n). Mastery: number theory (factors) + optimization elimination.",
    starterCode: "def trailing_zeroes(n):\n    count = 0\n    power = 5\n    pass",
    hints: [
      "Initialize count = 0, power = 5. While power <= n: count += n // power; power *= 5.",
      "Why 5 and not 2? In 1..n, every other number contributes a factor of 2 (abundant). Factors of 5 come every 5 numbers (scarcer). The bottleneck is 5s.",
      "Why n//25? Numbers like 25 contribute TWO factors of 5. n//5 counts each factor once, n//25 counts the extra factor, etc."
    ],
    solution: "def trailing_zeroes(n):\n    count = 0\n    power = 5\n    while power <= n:\n        count += n // power\n        power *= 5\n    return count",
    walkthrough: "Each trailing zero comes from a factor of 10 = 2x5. In n!, factors of 2 outnumber factors of 5. So 5s are the bottleneck. Count: each multiple of 5 contributes 1 five; each multiple of 25 contributes an extra five; each 125 another, etc. Sum = n/5 + n/25 + n/125 + ... O(log_5 n) — replaces the O(n^2) factorial computation.",
    testCode: "assert trailing_zeroes(5) == 1\nassert trailing_zeroes(25) == 6\nassert trailing_zeroes(0) == 0\nassert trailing_zeroes(100) == 24\nprint('All tests passed!')"
  },

]