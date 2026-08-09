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

export const STAGES_BIT = [
  { id: 0, name: "Binary Reflex", desc: "bits as arrays" },
  { id: 1, name: "The Toolkit", desc: "masks as stencils" },
  { id: 2, name: "XOR Algebra", desc: "parity as cancellation" },
  { id: 3, name: "Naive", desc: "loop 32 per number" },
  { id: 4, name: "Optimization", desc: "DP on bits" },
  { id: 5, name: "Mastery", desc: "mod-k, bitmask enum" },
  { id: 6, name: "Compose", desc: "compose all techniques" },
]

export const PROBLEMS_BIT: Problem[] = [
  // ── STAGE 0: Binary Reflex ──
  {
    id: 1, stage: 0, title: "AND/OR/XOR Truth Tables", pattern: "bitwise operations", skill: "apply &, |, ^ to pairs of bits; understand truth tables",
    statement: "Given two integers a and b, return the result of a & b, a | b, and a ^ b. Verify against manual truth table calculation.",
    examples: [
      { input: "a = 5 (101), b = 3 (011)", output: "a&b=1 (001), a|b=7 (111), a^b=6 (110)", explain: "bitwise operations" },
      { input: "a = 0, b = 7 (111)", output: "a&b=0, a|b=7, a^b=7" },
    ],
    why: "Bits are the letters of the binary alphabet. AND (both 1), OR (either 1), XOR (exactly one 1). These three operations (plus NOT) are the complete toolkit. Apply them to integers and they operate on all bits in parallel.",
    starterCode: "def bitwise_ops(a, b):\n    return {'and': a & b, 'or': a | b, 'xor': a ^ b}",
    hints: [
      "& (AND): bit is 1 only if BOTH bits are 1. | (OR): bit is 1 if EITHER bit is 1.",
      "^ (XOR): bit is 1 if EXACTLY ONE bit is 1 (different). ~ (NOT): flip all bits.",
      "Write the two numbers in binary, apply the operation bit by bit, convert back to decimal."
    ],
    solution: "def bitwise_ops(a, b):\n    return {'and': a & b, 'or': a | b, 'xor': a ^ b}",
    walkthrough: "For 5 (101) and 3 (011): AND=001=1 (both bits 1 only at position 0). OR=111=7 (any bit 1). XOR=110=6 (bits differ at positions 1 and 2). Each operation applies independently to each bit position.",
    testCode: "assert bitwise_ops(5, 3) == {'and': 1, 'or': 7, 'xor': 6}\nassert bitwise_ops(0, 7) == {'and': 0, 'or': 7, 'xor': 7}\nassert bitwise_ops(3, 3) == {'and': 3, 'or': 3, 'xor': 0}\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Binary to Decimal Conversion", pattern: "positional value", skill: "convert binary string to integer using place values",
    statement: "Given a binary string (e.g., '1011'), convert it to decimal. Each bit at position i (from right, 0-indexed) contributes bit * 2^i.",
    examples: [
      { input: "binary = '1011'", output: "11", explain: "1*8+0*4+1*2+1*1=11" },
      { input: "binary = '0'", output: "0" },
    ],
    why: "Binary-to-decimal is the bridge from bits to numbers. Each position is a power of 2. This formula is the foundation for understanding why bit masks work.",
    starterCode: "def binary_to_decimal(bin_str):\n    result = 0\n    pass",
    hints: [
      "Iterate from right to left. For position i, if char is '1', add 2^i to result.",
      "Or: iterate left to right, result = result * 2 + int(char). Same as Horner's method.",
      "Python has int(bin_str, 2) — implement it manually to understand."
    ],
    solution: "def binary_to_decimal(bin_str):\n    result = 0\n    for i, ch in enumerate(bin_str[::-1]):\n        if ch == '1':\n            result += 2 ** i\n    return result",
    walkthrough: "Traverse right-to-left (least significant first). For each '1' at position i, add 2^i. '1011': position 0='1'→1, pos 1='1'→2, pos 2='0'→0, pos 3='1'→8. Total=11.",
    testCode: "assert binary_to_decimal('1011') == 11\nassert binary_to_decimal('0') == 0\nassert binary_to_decimal('11111111') == 255\nassert binary_to_decimal('10000000') == 128\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Decimal to Binary Conversion", pattern: "repeated division by 2", skill: "extract bits via % 2 and // 2",
    statement: "Given a non-negative integer, return its binary representation as a string (no leading zeros, except '0' for 0).",
    examples: [
      { input: "n = 11", output: "'1011'" },
      { input: "n = 0", output: "'0'" },
    ],
    why: "The inverse of P2. Repeated division by 2 extracts bits from least significant to most. n % 2 gives the rightmost bit; n // 2 shifts right. This extraction pattern is the manual version of bit operations.",
    starterCode: "def decimal_to_binary(n):\n    if n == 0:\n        return '0'\n    bits = []\n    pass",
    hints: [
      "While n > 0: append str(n % 2), then n = n // 2. Reverse at the end.",
      "n % 2 tells you the LSB (least significant bit). n // 2 shifts right by one bit.",
      "This is the manual version of the >> operator."
    ],
    solution: "def decimal_to_binary(n):\n    if n == 0:\n        return '0'\n    bits = []\n    while n > 0:\n        bits.append(str(n % 2))\n        n = n // 2\n    return ''.join(bits[::-1])",
    walkthrough: "Repeated division: 11 % 2 = 1 (LSB), 11//2=5. 5%2=1, 5//2=2. 2%2=0, 2//2=1. 1%2=1, 1//2=0. Bits collected: [1,1,0,1]. Reverse → '1011'. Each modulus extracts one bit; division shifts.",
    testCode: "assert decimal_to_binary(11) == '1011'\nassert decimal_to_binary(0) == '0'\nassert decimal_to_binary(255) == '11111111'\nassert decimal_to_binary(128) == '10000000'\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "MSB and LSB Location", pattern: "most/least significant bit", skill: "find position of MSB (leftmost 1) and LSB (rightmost 1) in an integer",
    statement: "Given n > 0, return (msb_position, lsb_position) where msb is the index of the highest set bit, lsb is the index of the lowest set bit. 0-indexed from right.",
    examples: [
      { input: "n = 18 (10010)", output: "(4, 1)", explain: "MSB at position 4 (16), LSB at position 1 (2)" },
      { input: "n = 1 (00001)", output: "(0, 0)" },
    ],
    why: "MSB = floor(log2(n)); LSB = position of rightmost 1-bit. MSB tells you the power-of-two range. LSB tells you divisibility by powers of 2. These are the boundaries of a number's binary representation.",
    starterCode: "def msb_lsb(n):\n    msb = lsb = 0\n    pass",
    hints: [
      "MSB: repeatedly divide n by 2, track position where n becomes 0. Or use n.bit_length() - 1.",
      "LSB: while n % 2 == 0, shift right (n //= 2), increment position. Or use: lsb = (n & -n).bit_length() - 1.",
      "For n=1: MSB and LSB are both at position 0."
    ],
    solution: "def msb_lsb(n):\n    msb = n.bit_length() - 1\n    lsb = 0\n    temp = n\n    while temp % 2 == 0:\n        temp >>= 1\n        lsb += 1\n    return (msb, lsb)",
    walkthrough: "MSB: bit_length() - 1 gives the position of the highest set bit. LSB: count trailing zeros (divide by 2 until odd). For 18 (10010): msb=4 (2^4=16), lsb=1 (position of rightmost 1).",
    testCode: "assert msb_lsb(18) == (4, 1)\nassert msb_lsb(1) == (0, 0)\nassert msb_lsb(8) == (3, 3)\nassert msb_lsb(12) == (3, 2)\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Bit Count by Eye", pattern: "count set bits in binary representation", skill: "count the 1s in a binary number by examining each position",
    statement: "Given n, count the number of 1-bits (popcount, Hamming weight). Write the binary form and count manually. Implement the naive loop.",
    examples: [
      { input: "n = 11 (1011)", output: "3" },
      { input: "n = 0", output: "0" },
      { input: "n = 255 (11111111)", output: "8" },
    ],
    why: "Popcount is the most fundamental bit statistic. The naive method — check each of 32 bits — is the baseline. Later stages optimize this to O(popcount) and O(1).",
    starterCode: "def count_bits(n):\n    count = 0\n    pass",
    hints: [
      "While n > 0: if n & 1 == 1 (last bit is 1), increment count. Then n >>= 1.",
      "This iterates 32 times for a 32-bit integer. Can we do better?",
      "The operation n & 1 checks the LSB. n >> 1 shifts right, exposing the next bit."
    ],
    solution: "def count_bits(n):\n    count = 0\n    while n > 0:\n        if n & 1:\n            count += 1\n        n >>= 1\n    return count",
    walkthrough: "Examine each bit: use n & 1 to check LSB, shift right to move to next bit. O(number of bits in n) = O(32) for 32-bit int. Count = number of 1s. This is the baseline that kernel-based popcount and Brian Kernighan's algorithm improve upon.",
    testCode: "assert count_bits(11) == 3\nassert count_bits(0) == 0\nassert count_bits(255) == 8\nassert count_bits(7) == 3\nprint('All tests passed!')"
  },
  {
    id: 6, stage: 0, title: "Number of Bits (Bit Length)", pattern: "bit counting", skill: "determine how many bits needed to represent a number",
    statement: "Given a non-negative integer n, return the number of bits required to represent n in binary (its bit length). For n=0, bit length is 1. Use repeated right-shift until n becomes 0, counting shifts.",
    examples: [
      { input: "n = 5", output: "3", explain: "5 in binary is 101 — 3 bits" },
      { input: "n = 256", output: "9", explain: "256 = 100000000 — 9 bits" },
    ],
    why: "Bit length = floor(log2(n)) + 1 = position of MSB + 1. Tells you how many position slots a number occupies. Needed for creating full-width masks and computing complements.",
    starterCode: "def bit_length(n):\n    pass",
    hints: [
      "For n == 0, return 1 (need at least one bit for zero).",
      "While n > 0: count += 1; n >>= 1. Each shift removes one bit, count tracks them.",
      "Equivalently: n.bit_length() — but implement manually to internalize."
    ],
    solution: "def bit_length(n):\n    if n == 0:\n        return 1\n    count = 0\n    while n > 0:\n        count += 1\n        n >>= 1\n    return count",
    walkthrough: "Shift n right until it becomes 0, counting each shift. For n=5 (101): shift1→2, shift2→1, shift3→0 → 3 bits. Each shift removes the LSB. The count is ceil(log2(n+1)).",
    testCode: "assert bit_length(5) == 3\nassert bit_length(256) == 9\nassert bit_length(0) == 1\nassert bit_length(1) == 1\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 0, title: "Opposite Signs Check", pattern: "sign bit XOR", skill: "check if two numbers have opposite signs using (a ^ b) < 0",
    statement: "Given two integers a and b, return True if they have opposite signs (one positive, one negative). Zero is non-negative. Use bit operation: (a ^ b) < 0. XOR reveals differing sign bits; if MSB differs, result appears negative.",
    examples: [
      { input: "a = 10, b = -5", output: "True", explain: "10 (MSB=0), -5 (MSB=1) — opposite signs" },
      { input: "a = -3, b = -7", output: "False", explain: "both negative — same sign" },
      { input: "a = 0, b = 5", output: "False", explain: "0 and 5 — both non-negative" },
    ],
    why: "In two's complement, the MSB is the sign bit: 0 for non-negative, 1 for negative. a ^ b has MSB=1 iff a and b have different sign bits. (a ^ b) < 0 catches this in one O(1) operation.",
    starterCode: "def opposite_signs(a, b):\n    pass",
    hints: [
      "XOR a and b: a ^ b. Check if result < 0.",
      "If signs differ, MSB of XOR is 1 (result is negative in two's complement).",
      "If signs are same, MSB of XOR is 0 (both 0→0 or both 1→0), result >= 0."
    ],
    solution: "def opposite_signs(a, b):\n    return (a ^ b) < 0",
    walkthrough: "MSB determines sign. XOR compares: same sign → MSB XOR = 0 → result >= 0. Opposite signs → MSB XOR = 1 → result < 0 (interpreted as negative in two's complement). O(1), one operation.",
    testCode: "assert opposite_signs(10, -5) == True\nassert opposite_signs(-3, -7) == False\nassert opposite_signs(0, 5) == False\nassert opposite_signs(-1, 1) == True\nprint('All tests passed!')"
  },

  // ── STAGE 1: The Toolkit ──
  {
    id: 8, stage: 1, title: "Get Bit i", pattern: "mask-and-shift", skill: "(n >> i) & 1 to extract bit i",
    statement: "Given integer n and position i (0-indexed from right), return the bit value at position i (0 or 1). Use (n >> i) & 1.",
    examples: [
      { input: "n = 10 (1010), i = 1", output: "1", explain: "bit at position 1 is 1" },
      { input: "n = 10 (1010), i = 2", output: "0" },
    ],
    why: "Extracting a single bit is the atomic read operation of bit manipulation. Shift right to bring bit i to position 0, then mask with 1. Everything builds on this.",
    starterCode: "def get_bit(n, i):\n    pass",
    hints: [
      "Shift n right by i (n >> i). Now the target bit is at position 0.",
      "AND with 1: (n >> i) & 1. If the result is 1, bit i was set. If 0, it was clear.",
      "This is the read operation. Write operations (set, clear, toggle) follow the same pattern."
    ],
    solution: "def get_bit(n, i):\n    return (n >> i) & 1",
    walkthrough: "n >> i moves bit i to position 0 (LSB). & 1 masks everything except that bit. Returns 1 if bit was set, 0 if not. Example: 10 (1010), i=1: 10>>1=5 (0101), 5&1=1.",
    testCode: "assert get_bit(10, 1) == 1\nassert get_bit(10, 2) == 0\nassert get_bit(10, 3) == 1\nassert get_bit(0, 0) == 0\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "Set Bit i", pattern: "OR with mask", skill: "n | (1 << i) to set bit i to 1",
    statement: "Given n and position i, return n with bit i set to 1 (regardless of its current value). Use n | (1 << i).",
    examples: [
      { input: "n = 10 (1010), i = 2", output: "14 (1110)", explain: "set bit 2 from 0 to 1" },
      { input: "n = 10 (1010), i = 1", output: "10 (1010)", explain: "bit 1 already 1, no change" },
    ],
    why: "Setting a bit turns it ON while leaving other bits unchanged. 1 << i creates a mask with 1 at position i and 0s elsewhere. OR imposes that 1 onto n at position i.",
    starterCode: "def set_bit(n, i):\n    pass",
    hints: [
      "Create mask = 1 << i (1 at position i, 0s elsewhere).",
      "n | mask: OR sets the i-th bit to 1 (if it was 0) or leaves it 1 (if already 1).",
      "Other bits: 0 | 0 = 0, 1 | 0 = 1 — the mask preserves all other bits."
    ],
    solution: "def set_bit(n, i):\n    return n | (1 << i)",
    walkthrough: "1 << i creates a number with only bit i set. n | mask ORs them. Since OR: 0|1=1, 1|1=1, for bit i it becomes 1. For all other positions (mask has 0), result = original bit. Pure write: set to 1, idempotent.",
    testCode: "assert set_bit(10, 2) == 14\nassert set_bit(10, 1) == 10\nassert set_bit(0, 3) == 8\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "Clear Bit i", pattern: "AND with inverted mask", skill: "n & ~(1 << i) to clear bit i to 0",
    statement: "Given n and position i, return n with bit i cleared (set to 0). Use n & ~(1 << i).",
    examples: [
      { input: "n = 10 (1010), i = 1", output: "8 (1000)", explain: "clear bit 1 from 1 to 0" },
      { input: "n = 10 (1010), i = 2", output: "10 (1010)", explain: "bit 2 already 0, no change" },
    ],
    why: "Clearing a bit uses AND with a mask that has 0 at position i and 1s everywhere else. ~(1 << i) creates that mask by inverting the set-bit mask.",
    starterCode: "def clear_bit(n, i):\n    pass",
    hints: [
      "mask = 1 << i (1 at position i). Invert: ~mask (0 at position i, 1s elsewhere).",
      "n & ~mask: AND with 0 at position i forces that bit to 0. AND with 1 elsewhere preserves bits.",
      "Remember: ~ in Python on integers gives negative due to two's complement. Use mask = ~(1 << i) which works fine since Python integers are infinite-width conceptually."
    ],
    solution: "def clear_bit(n, i):\n    return n & ~(1 << i)",
    walkthrough: "AND clears: 1 & 0 = 0 (force clear), 0 & 0 = 0 (already clear). Other bits: 1 & 1 = 1, 0 & 1 = 0 (preserved). So n & ~(1<<i) zeros out exactly bit i, leaving everything else intact.",
    testCode: "assert clear_bit(10, 1) == 8\nassert clear_bit(10, 2) == 10\nassert clear_bit(15, 0) == 14\nprint('All tests passed!')"
  },
  {
    id: 11, stage: 1, title: "Toggle Bit i", pattern: "XOR with mask", skill: "n ^ (1 << i) to flip bit i",
    statement: "Given n and position i, return n with bit i toggled (0→1, 1→0). Use n ^ (1 << i).",
    examples: [
      { input: "n = 10 (1010), i = 2", output: "14 (1110)", explain: "0→1" },
      { input: "n = 10 (1010), i = 1", output: "8 (1000)", explain: "1→0" },
    ],
    why: "XOR with 1 flips a bit: 0^1=1, 1^1=0. XOR with 0 preserves: 0^0=0, 1^0=1. So n ^ (1<<i) flips exactly bit i.",
    starterCode: "def toggle_bit(n, i):\n    pass",
    hints: [
      "mask = 1 << i. n ^ mask flips bit i. Other bits XOR with 0 → unchanged.",
      "If bit i is 0: 0 ^ 1 = 1 (flipped to 1). If bit i is 1: 1 ^ 1 = 0 (flipped to 0).",
      "Toggle is its own inverse: toggling twice returns the original value."
    ],
    solution: "def toggle_bit(n, i):\n    return n ^ (1 << i)",
    walkthrough: "XOR is the complement operator: with 1 it flips, with 0 it passes through. n ^ (1<<i) XORs a 1 at position i — flipping that bit. All other positions XOR with 0, unchanged. Double-toggle: (n^(1<<i))^(1<<i) = n.",
    testCode: "assert toggle_bit(10, 2) == 14\nassert toggle_bit(10, 1) == 8\nassert toggle_bit(toggle_bit(10, 1), 1) == 10\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 1, title: "x & (x-1) Drops Lowest Set Bit", pattern: "Brian Kernighan's trick", skill: "x & (x-1) clears the least significant set bit",
    statement: "Given positive integer x, compute x & (x-1) and explain why it drops the lowest set bit. Demonstrate: 12 (1100) & 11 (1011) = 8 (1000).",
    examples: [
      { input: "x = 12 (1100)", output: "8 (1000)", explain: "lowest set bit at position 2 cleared" },
      { input: "x = 7 (0111)", output: "6 (0110)", explain: "LSB at position 0 cleared" },
    ],
    why: "This is THE most important bit trick. x-1 flips all bits from LSB up to (and including) the lowest set bit. ANDing with x clears that lowest set bit. This powers popcount, power-of-two checks, and subset enumeration.",
    starterCode: "def drop_lowest_set_bit(x):\n    pass",
    hints: [
      "Write x and x-1 in binary. x-1: the lowest 1 in x becomes 0, and all lower 0s become 1s.",
      "x & (x-1): the common prefix of bits above the lowest 1 are unchanged. The lowest 1 ANDed with 0 → 0. Lower bits: 0 & anything → 0.",
      "Result: x with its lowest set bit turned off."
    ],
    solution: "def drop_lowest_set_bit(x):\n    return x & (x - 1)",
    walkthrough: "12 (1100): LSB at position 2. 12-1=11 (1011): bit 2 becomes 0, bits 1,0 become 1. 12&11 = 1100 & 1011 = 1000 = 8. The lowest set bit is cleared. Repeating this operation counts set bits in O(popcount) time.",
    testCode: "assert drop_lowest_set_bit(12) == 8\nassert drop_lowest_set_bit(7) == 6\nassert drop_lowest_set_bit(1) == 0\nassert drop_lowest_set_bit(10) == 8\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 1, title: "Update Bit i to Value v", pattern: "clear then set", skill: "set bit i to specific value 0 or 1 by composing clear and set",
    statement: "Given n, position i, and value v (0 or 1), return n with bit i set to v. Compose: first clear bit i (n & ~(1<<i)), then OR with (v << i). One-liner.",
    examples: [
      { input: "n = 10 (1010), i = 2, v = 1", output: "14 (1110)", explain: "clear bit 2, set it to 1" },
      { input: "n = 14 (1110), i = 2, v = 0", output: "10 (1010)", explain: "clear bit 2 back to 0" },
    ],
    why: "Update composes clear + set. First force bit i to 0 (clear), then OR with (v<<i) to set desired value. Shows that bit operations compose: a complex operation is just two primitives chained.",
    starterCode: "def update_bit(n, i, v):\n    pass",
    hints: [
      "Step 1: clear bit i using n & ~(1 << i). This forces bit i to 0 regardless of current value.",
      "Step 2: OR with (v << i). If v=1, this sets bit i to 1. If v=0, stays 0 (already 0 from step 1).",
      "One-liner: (n & ~(1 << i)) | (v << i)."
    ],
    solution: "def update_bit(n, i, v):\n    return (n & ~(1 << i)) | (v << i)",
    walkthrough: "Clear first: n & ~(1<<i) zeros out position i. Then set: | (v<<i) puts v at position i. If v=0: already 0, stays 0. If v=1: becomes 1. Clear-before-set guarantees correctness regardless of original bit value.",
    testCode: "assert update_bit(10, 2, 1) == 14\nassert update_bit(14, 2, 0) == 10\nassert update_bit(5, 0, 0) == 4\nassert update_bit(0, 3, 1) == 8\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 1, title: "Isolate Lowest Set Bit Value", pattern: "n & -n", skill: "extract the value of the lowest set bit as a power of two",
    statement: "Given n > 0, return the value of its lowest set bit. Use n & -n. Example: 12 (1100) & -12 = 4 (0100). Returns the power-of-two value (1, 2, 4, 8, ...), not the bit position (0, 1, 2, 3, ...).",
    examples: [
      { input: "n = 12", output: "4", explain: "12 (1100) & -12 = 4 — LSB is at value 4" },
      { input: "n = 7", output: "1", explain: "7 (0111) & -7 = 1 — LSB is at value 1" },
    ],
    why: "n & -n is the second most important bit trick after n & (n-1). In two's complement, -n = ~n + 1 flips bits then adds 1, which propagates carry to the first 0 (which was the first 1 in n). So n & -n isolates exactly that first 1.",
    starterCode: "def lsb_value(n):\n    pass",
    hints: [
      "Return n & -n. For n=12 (1100): -12 is ...10100. 1100 & ...10100 = 0100 = 4.",
      "Returns the VALUE (1, 2, 4, 8, ...), not the position (0, 1, 2, 3, ...).",
      "Used in Fenwick trees (Binary Indexed Trees) for lowest-set-bit range queries."
    ],
    solution: "def lsb_value(n):\n    return n & -n",
    walkthrough: "Two's complement: -n = ~n + 1. ~n flips all bits. +1 propagates through trailing 1s until hitting first 0 (which was the first 1 in n). The lowest 1-bit stays 1 in both n and -n; all other bits differ. AND isolates that shared bit. Returns 2^pos.",
    testCode: "assert lsb_value(12) == 4\nassert lsb_value(7) == 1\nassert lsb_value(16) == 16\nassert lsb_value(10) == 2\nprint('All tests passed!')"
  },

  // ── STAGE 2: XOR Algebra ──
  {
    id: 15, stage: 2, title: "Single Number (Every Appears Twice)", pattern: "XOR cancellation", skill: "XOR all numbers; duplicates cancel (a^a=0), single remains",
    statement: "Given array where every element appears exactly twice except one which appears once. Find the single number using XOR: XOR all elements. Duplicates cancel (x^x=0), lone element remains.",
    examples: [
      { input: "nums = [2,2,1]", output: "1" },
      { input: "nums = [4,1,2,1,2]", output: "4" },
    ],
    why: "XOR's magic: a ^ a = 0 (self-cancellation). a ^ 0 = a (identity). Order doesn't matter (commutative, associative). XOR all numbers — duplicates pair-cancel, leaving the loner.",
    starterCode: "def single_number(nums):\n    result = 0\n    pass",
    hints: [
      "XOR all numbers: start with 0, XOR each element. result = 0 ^ nums[0] ^ nums[1] ^ ...",
      "Since a^a=0 and a^0=a, pairs cancel. The remaining value is the single element.",
      "XOR is commutative and associative — order doesn't matter."
    ],
    solution: "def single_number(nums):\n    result = 0\n    for n in nums:\n        result ^= n\n    return result",
    walkthrough: "XOR all elements. Each pair produces 0. The singleton XOR whatever = itself. O(n) time, O(1) space. This is the canonical solution — exploits XOR's cancellation property.",
    testCode: "assert single_number([2,2,1]) == 1\nassert single_number([4,1,2,1,2]) == 4\nassert single_number([1]) == 1\nprint('All tests passed!')"
  },
  {
    id: 16, stage: 2, title: "XOR of 1 to n", pattern: "XOR range pattern", skill: "compute XOR of all integers 1..n; discover the pattern of XOR over consecutive integers",
    statement: "Compute XOR of all integers from 1 to n. Discover the pattern: n%4==0→n, n%4==1→1, n%4==2→n+1, n%4==3→0. Prove it by induction.",
    examples: [
      { input: "n = 4", output: "4", explain: "1^2^3^4=4" },
      { input: "n = 7", output: "0", explain: "1^2^3^4^5^6^7=0" },
    ],
    why: "XOR over a range follows a regular pattern: XOR of 1..n depends only on n % 4. This enables O(1) range XOR — useful for problems where you need XOR of subranges.",
    starterCode: "def xor_1_to_n(n):\n    pass",
    hints: [
      "Compute manually for n=1..8 and look at the pattern: 1,3,0,4,1,7,0,8.",
      "Notice: n%4==0 → n, n%4==1 → 1, n%4==2 → n+1, n%4==3 → 0.",
      "Proof: pairs of consecutive evens? More formally: (4k)^(4k+1)^(4k+2)^(4k+3)=0. Group every 4."
    ],
    solution: "def xor_1_to_n(n):\n    remainder = n % 4\n    if remainder == 0:\n        return n\n    elif remainder == 1:\n        return 1\n    elif remainder == 2:\n        return n + 1\n    else:\n        return 0",
    walkthrough: "Pattern via induction on groups of 4: (0^1^2^3)=0, so every full group of 4 consecutive numbers XORs to 0. Only the last 0-3 numbers matter. Compute n%4 and apply the case. O(1).",
    testCode: "assert xor_1_to_n(4) == 4\nassert xor_1_to_n(7) == 0\nassert xor_1_to_n(8) == 8\nassert xor_1_to_n(1) == 1\nassert xor_1_to_n(5) == 1\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 2, title: "Find Missing Number", pattern: "XOR with indices", skill: "nums has n distinct numbers from 0..n, one missing; XOR all nums and indices, missing remains",
    statement: "Given array of n DISTINCT numbers from 0 to n (size n, range 0..n), one number is missing. Find it with XOR: XOR all indices 0..n and all array elements. The missing number remains.",
    examples: [
      { input: "nums = [3,0,1]", output: "2", explain: "range 0..3; 0^1^2^3 ^ 3^0^1 = 2" },
      { input: "nums = [0,1]", output: "2", explain: "range 0..2; XOR all = 2" },
    ],
    why: "All numbers from 0..n XORed with all elements: each present number appears twice (in array AND in range) → cancels. The missing number appears only once (in range only) → remains.",
    starterCode: "def missing_number(nums):\n    n = len(nums)\n    result = n\n    pass",
    hints: [
      "Start with result = n (the range includes n). XOR each index i and each nums[i].",
      "Each present number is XORed twice (once from index, once from array value) → cancels.",
      "Alternatively: (sum 0..n) - sum(nums) also works, but XOR avoids overflow."
    ],
    solution: "def missing_number(nums):\n    n = len(nums)\n    result = n\n    for i in range(n):\n        result ^= i ^ nums[i]\n    return result",
    walkthrough: "XOR all: result = 0 ^ 1 ^ ... ^ n ^ nums[0] ^ ... ^ nums[n-1]. Each number that appears in BOTH the range and array is XORed twice → cancels. The missing number appears once → remains. O(n) time, O(1) space.",
    testCode: "assert missing_number([3,0,1]) == 2\nassert missing_number([0,1]) == 2\nassert missing_number([9,6,4,2,3,5,7,0,1]) == 8\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 2, title: "XOR of All Pairs", pattern: "XOR of pairwise XORs", skill: "compute XOR of (a[i]^a[j]) for all i<j; pattern: each number appears (n-1) times",
    statement: "Given array a of n elements, compute XOR of all pairwise XORs: XOR of (a[i] ^ a[j]) for all i < j. Each element appears (n-1) times in the XOR sum, so if n-1 is even (n is odd), result is 0. If n is even, result is XOR of all elements.",
    examples: [
      { input: "arr = [1,2,3]", output: "0", explain: "n=3 (odd), n-1=2 (even), each appears even times → 0" },
      { input: "arr = [1,2,3,4]", output: "4", explain: "n=4 (even), n-1=3 (odd), each appears odd → XOR all = 1^2^3^4=4" },
    ],
    why: "Each element a[i] is paired with every a[j] (j != i), so it appears (n-1) times. If (n-1) is even, self-cancellation: result = 0. If odd, result = XOR of all elements (each survives one copy).",
    starterCode: "def xor_all_pairs(arr):\n    n = len(arr)\n    pass",
    hints: [
      "Each number a[i] appears in (n-1) pairwise XORs: with every other element.",
      "If (n-1) is even → a[i]^a[i] pairs cancel → result 0. If odd → one copy of each survives.",
      "So: if n is odd, return 0. If n is even, return XOR of all elements."
    ],
    solution: "def xor_all_pairs(arr):\n    n = len(arr)\n    if n % 2 == 1:\n        return 0\n    result = 0\n    for x in arr:\n        result ^= x\n    return result",
    walkthrough: "Count appearances: each element pairs with n-1 others. If n-1 is even → even number of appearances → XOR cancels (a^a=0). If n-1 is odd → one a[i] survives per element → result = XOR of all elements. O(n).",
    testCode: "assert xor_all_pairs([1,2,3]) == 0\nassert xor_all_pairs([1,2,3,4]) == 4\nassert xor_all_pairs([5]) == 0\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 2, title: "Swap Two Numbers Without Temp", pattern: "XOR swap trick", skill: "a=a^b; b=a^b; a=a^b swaps a and b without temporary variable",
    statement: "Implement swap of two integers a,b without using a temporary variable. Use XOR: a = a ^ b; b = a ^ b; a = a ^ b. Trace the bits to prove correctness.",
    examples: [
      { input: "a = 5, b = 3", output: "a=3, b=5" },
      { input: "a = 0, b = 7", output: "a=7, b=0" },
    ],
    why: "XOR swap demonstrates XOR's cancellation property in a different context. After 3 XORs, a gets b's value and b gets a's value. This works because XOR is its own inverse.",
    starterCode: "def xor_swap(a, b):\n    pass",
    hints: [
      "Step 1: a = a ^ b (a becomes a^b). Step 2: b = a ^ b = (a^b)^b = a^(b^b) = a^0 = a.",
      "Step 3: a = a ^ b = (a^b)^a = (a^a)^b = 0^b = b.",
      "Three steps, no temp. Works for any integers."
    ],
    solution: "def xor_swap(a, b):\n    a = a ^ b\n    b = a ^ b\n    a = a ^ b\n    return a, b",
    walkthrough: "After step 1: a holds a^b. Step 2: b = (a^b)^b = a (since b^b=0). Step 3: a = (a^b)^a = b (since a^a=0). The values are swapped. Note: fails if a and b are the same variable (self-swap), but for distinct integers it works.",
    testCode: "assert xor_swap(5, 3) == (3, 5)\nassert xor_swap(0, 7) == (7, 0)\nassert xor_swap(-1, 10) == (10, -1)\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 2, title: "Find the Difference (String XOR)", pattern: "XOR cancellation on characters", skill: "XOR all chars in s and t; the extra char in t survives",
    statement: "Given strings s and t where t is formed by shuffling s and adding exactly one extra lowercase letter, find that extra letter. XOR all character codes (ord) — every char in s appears once in s and once in t → cancels. The extra char in t appears once → remains.",
    examples: [
      { input: "s = 'abcd', t = 'abcde'", output: "'e'" },
      { input: "s = '', t = 'y'", output: "'y'" },
    ],
    why: "XOR cancellation extends to any integer domain — including character codes. Same principle as Single Number (P11): pairs cancel (a^a=0), singleton survives. The problem is 2-string XOR: each s-char XORed in twice (once from s, once from t) = 0.",
    starterCode: "def find_the_difference(s, t):\n    result = 0\n    pass",
    hints: [
      "XOR all character codes: result ^= ord(ch) for each char in s AND each char in t.",
      "Same as Single Number — pairs cancel (appear once in s, once in t), singleton remains.",
      "Return chr(result) to convert the surviving integer back to a character."
    ],
    solution: "def find_the_difference(s, t):\n    result = 0\n    for ch in s:\n        result ^= ord(ch)\n    for ch in t:\n        result ^= ord(ch)\n    return chr(result)",
    walkthrough: "XOR operates on ASCII codes. Every char in s appears in both strings → XORed twice → cancels (x^x=0). The extra char in t appears once → survives. Convert the remaining code back to a character. O(n+m). Identical logic to P11.",
    testCode: "assert find_the_difference('abcd', 'abcde') == 'e'\nassert find_the_difference('', 'y') == 'y'\nassert find_the_difference('a', 'aa') == 'a'\nprint('All tests passed!')"
  },
  {
    id: 21, stage: 2, title: "Number Complement", pattern: "XOR with all-1s mask", skill: "flip all bits without leading zeros; use mask of matching bit width",
    statement: "Given positive integer n, return its complement (flip all bits, ignoring leading zeros). Complement of 5 (101) is 2 (010). Compute n's bit length, create mask of all 1s of that length: mask = (1 << bit_length) - 1. Then n ^ mask flips every bit.",
    examples: [
      { input: "n = 5", output: "2", explain: "5 (101) → complement (010) = 2" },
      { input: "n = 1", output: "0", explain: "1 (1) → complement (0) = 0" },
    ],
    why: "Flipping bits = XOR with all-1s mask of matching width. The mask is (1<<bit_length)-1 (e.g., bit_length=3 → mask=111=7). n ^ mask flips every represented bit. Composes bit_length + mask creation + XOR.",
    starterCode: "def bitwise_complement(n):\n    pass",
    hints: [
      "Compute n's bit_length. mask = (1 << bit_length) - 1 creates that many 1-bits.",
      "For n=5 (101): bit_length=3, mask=7 (111). 5 ^ 7 = 2 (010).",
      "XOR with 1 flips: 1^1=0, 0^1=1. So XOR with all-1s flips every position in the mask width."
    ],
    solution: "def bitwise_complement(n):\n    length = n.bit_length()\n    mask = (1 << length) - 1\n    return n ^ mask",
    walkthrough: "Step 1: bit_length = number of meaningful bits. Step 2: (1 << length) - 1 = mask of 'length' 1s (e.g., length=3 → 2^3-1=7=111). Step 3: n ^ mask flips every bit within that width. Leading zeros aren't in n's bit_length, so they're ignored. O(1).",
    testCode: "assert bitwise_complement(5) == 2\nassert bitwise_complement(1) == 0\nassert bitwise_complement(7) == 0\nassert bitwise_complement(10) == 5\nprint('All tests passed!')"
  },

  // ── STAGE 3: Naive ──
  {
    id: 22, stage: 3, title: "Count Bits per Number — 32 Iterations", pattern: "per-number bit loop", skill: "for each number 0..n, count set bits by iterating 32 times",
    statement: "Given n, return array where ans[i] = number of 1 bits in binary representation of i, for i=0..n. Naive: for each i, iterate up to 32 bits, count 1s.",
    examples: [
      { input: "n = 5", output: "[0,1,1,2,1,2]" },
      { input: "n = 2", output: "[0,1,1]" },
    ],
    why: "The naive approach computes popcount independently for each number by checking every bit. O(n * 32). The waste: each number's popcount can be derived from a smaller number's (DP in Stage 4).",
    starterCode: "def count_bits_naive(n):\n    result = []\n    for i in range(n + 1):\n        pass\n    return result",
    hints: [
      "For each i: count = 0; temp = i; while temp > 0: count += temp & 1; temp >>= 1.",
      "This is 32 iterations per number (or fewer if you stop at 0). O(n * 32).",
      "Can we compute popcount(i) from popcount of a smaller number? Yes — DP next."
    ],
    solution: "def count_bits_naive(n):\n    result = []\n    for i in range(n + 1):\n        count = 0\n        temp = i\n        while temp > 0:\n            count += temp & 1\n            temp >>= 1\n        result.append(count)\n    return result",
    walkthrough: "For each i from 0 to n, count bits by examining each of up to 32 positions. Total: O(n * 32). The independence of each number's computation is the waste. DP optimization: popcount(i) = popcount(i>>1) + (i&1).",
    testCode: "assert count_bits_naive(5) == [0,1,1,2,1,2]\nassert count_bits_naive(2) == [0,1,1]\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 3, title: "Reverse Bits — Naive (String Method)", pattern: "string reversal", skill: "convert to binary string of length 32, reverse, convert back",
    statement: "Given a 32-bit unsigned integer, reverse its bits. Naive: convert to 32-bit binary string, reverse, convert to int.",
    examples: [
      { input: "n = 43261596 (00000010100101000001111010011100)", output: "964176192 (00111001011110000010100101000000)" },
      { input: "n = 0", output: "0" },
    ],
    why: "The string method is the most intuitive: treat bits as characters and reverse. But it creates 32-character strings per call. The bit-twiddling O(1) method (Stage 4) works with byte-level lookup tables.",
    starterCode: "def reverse_bits_naive(n):\n    bits = bin(n)[2:].zfill(32)\n    pass",
    hints: [
      "Convert n to binary string, pad to 32 chars with leading zeros.",
      "Reverse the string, convert back to int with int(reversed_str, 2).",
      "This is O(32) time but creates strings. For repeated calls, a lookup table is faster."
    ],
    solution: "def reverse_bits_naive(n):\n    bits = bin(n)[2:].zfill(32)\n    reversed_bits = bits[::-1]\n    return int(reversed_bits, 2)",
    walkthrough: "bin(n) gives '0b...'. Strip '0b', pad to 32 chars with zfill. Reverse string, parse as int base 2. Works, but string operations are relatively heavy for a bit operation.",
    testCode: "assert reverse_bits_naive(43261596) == 964176192\nassert reverse_bits_naive(0) == 0\nassert reverse_bits_naive(1) == 1 << 31\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 3, title: "Hamming Distance — Naive (String Compare)", pattern: "compare bits one by one", skill: "compute XOR, count 1s in its binary representation (or compare strings)",
    statement: "Given two integers x,y, return Hamming distance (number of positions where bits differ). Naive: XOR them (1s at positions where they differ), count 1s via string conversion.",
    examples: [
      { input: "x = 1 (0001), y = 4 (0100)", output: "2" },
      { input: "x = 3 (0011), y = 1 (0001)", output: "1" },
    ],
    why: "Hamming distance = popcount(x ^ y). XOR reveals differing bits (1 where differ, 0 where same). Counting the 1s is the popcount operation.",
    starterCode: "def hamming_distance_naive(x, y):\n    xor_val = x ^ y\n    pass",
    hints: [
      "Compute xor_val = x ^ y. Bits that differ are 1. Count the 1s.",
      "Naive count: bin(xor_val).count('1') — but this uses string conversion.",
      "Better: use the bit-counting loop from P16."
    ],
    solution: "def hamming_distance_naive(x, y):\n    xor_val = x ^ y\n    count = 0\n    while xor_val > 0:\n        count += xor_val & 1\n        xor_val >>= 1\n    return count",
    walkthrough: "XOR creates a bitmask of differences. Count set bits via &1 and shift right. O(32) per call. More efficient: x & (x-1) drops LSB — O(popcount). Brian Kernighan's algorithm.",
    testCode: "assert hamming_distance_naive(1, 4) == 2\nassert hamming_distance_naive(3, 1) == 1\nassert hamming_distance_naive(0, 0) == 0\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 3, title: "Bit Count from 0 to Num — Naive", pattern: "independent per-number popcount", skill: "for i in 0..n, compute popcount(i) in a loop over bits",
    statement: "Given n, return array of popcounts for 0..n. Use the Brian Kernighan loop: while i: i &= i-1, count++. Each number computed independently.",
    examples: [
      { input: "n = 5", output: "[0,1,1,2,1,2]" },
    ],
    why: "Brian Kernighan's algorithm: i & (i-1) drops lowest set bit. Repeat until 0, counting drops. O(popcount) per number, overall O(n * average popcount) ≈ O(n log n). DP in Stage 4 makes it O(n).",
    starterCode: "def count_bits_bk(n):\n    result = []\n    for i in range(n + 1):\n        pass\n    return result",
    hints: [
      "For each i: count = 0; temp = i; while temp: temp = temp & (temp - 1); count += 1.",
      "temp & (temp-1) drops the lowest set bit. The number of iterations = popcount.",
      "Better than 32-iteration loop when numbers are sparse."
    ],
    solution: "def count_bits_bk(n):\n    result = []\n    for i in range(n + 1):\n        count = 0\n        temp = i\n        while temp:\n            temp &= temp - 1\n            count += 1\n        result.append(count)\n    return result",
    walkthrough: "Brian Kernighan: i & (i-1) clears the lowest set bit. The loop runs exactly popcount(i) times — faster than always-32 for sparse numbers. But INDEPENDENT per number. DP: popcount(i) = popcount(i>>1) + (i&1) gives O(n) overall.",
    testCode: "assert count_bits_bk(5) == [0,1,1,2,1,2]\nassert count_bits_bk(0) == [0]\nprint('All tests passed!')"
  },
  {
    id: 26, stage: 3, title: "Check Power of Two — Naive", pattern: "divide by 2 repeatedly", skill: "while n > 1 and n % 2 == 0: n //= 2. Return n == 1.",
    statement: "Check if n is a power of two. Naive: repeatedly divide by 2 while even. If final result is 1, it's a power of two.",
    examples: [
      { input: "n = 16", output: "True" },
      { input: "n = 18", output: "False" },
      { input: "n = 1", output: "True" },
    ],
    why: "Division loop is the most intuitive approach: strip away factors of 2. But bitwise: a power of two has exactly one set bit. n > 0 and n & (n-1) == 0 in O(1).",
    starterCode: "def is_power_of_two_naive(n):\n    if n <= 0:\n        return False\n    pass",
    hints: [
      "While n > 1: if n % 2 != 0, return False. Else n //= 2. Return True if n == 1.",
      "This is O(log n). The bitwise check is O(1): n > 0 and n & (n-1) == 0.",
      "A power of two has exactly one '1' bit. n & (n-1) drops it → result 0 means exactly one '1' bit."
    ],
    solution: "def is_power_of_two_naive(n):\n    if n <= 0:\n        return False\n    while n > 1:\n        if n % 2 != 0:\n            return False\n        n //= 2\n    return n == 1",
    walkthrough: "Repeated division by 2. If any odd number > 1 appears, not a power of two. O(log n). Bitwise: n & (n-1) == 0 iff exactly one bit is set (and n > 0). This is O(1) and the canonical solution.",
    testCode: "assert is_power_of_two_naive(16) == True\nassert is_power_of_two_naive(18) == False\nassert is_power_of_two_naive(1) == True\nassert is_power_of_two_naive(0) == False\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 3, title: "Gray Code Sequence", pattern: "G(i) = i ^ (i >> 1)", skill: "generate n-bit Gray code where consecutive numbers differ by exactly one bit",
    statement: "Given n, return the n-bit Gray code sequence (values 0 to 2^n-1) where each consecutive number differs by exactly one bit. Use the formula: gray(i) = i ^ (i >> 1).",
    examples: [
      { input: "n = 2", output: "[0,1,3,2]", explain: "00→01→11→10 — each step flips exactly one bit" },
      { input: "n = 1", output: "[0,1]" },
    ],
    why: "Gray code is a binary sequence where adjacent numbers differ by exactly ONE bit. g(i) = i ^ (i >> 1) converts binary index to Gray code. Used in Karnaugh maps, error correction, rotary encoders. The XOR with shifted self is a neat bit trick.",
    starterCode: "def gray_code(n):\n    result = []\n    pass",
    hints: [
      "For i in 0..(1<<n)-1: result.append(i ^ (i >> 1)).",
      "i >> 1 shifts i right by 1 (floor divide by 2). XOR with i gives the Gray code.",
      "The MSB is unchanged (i and i>>1 both have 0 at position n-1 above i's range)."
    ],
    solution: "def gray_code(n):\n    result = []\n    for i in range(1 << n):\n        result.append(i ^ (i >> 1))\n    return result",
    walkthrough: "g(i) = i ^ (i >> 1). For n=2: g(0)=0^0=0 (00), g(1)=1^0=1 (01), g(2)=2^1=3 (11), g(3)=3^1=2 (10). Each consecutive output differs by 1 bit because XOR with shifted version produces a single-bit-flip transition. O(2^n).",
    testCode: "assert gray_code(2) == [0, 1, 3, 2]\nassert gray_code(1) == [0, 1]\nassert len(gray_code(3)) == 8\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 3, title: "Steps to Reduce to Zero", pattern: "bit-based step counting", skill: "count steps n→0 using even→n//2, odd→n-1 operations",
    statement: "Given non-negative integer n, count steps to reduce to zero. In each step: if n is even, divide by 2 (n//=2); if n is odd, subtract 1 (n-=1). Count total operations. Each 1-bit costs one subtraction; each bit position costs one division.",
    examples: [
      { input: "n = 14", output: "6", explain: "14→7→6→3→2→1→0 (6 steps)" },
      { input: "n = 8", output: "4", explain: "8→4→2→1→0 (4 steps)" },
    ],
    why: "This reveals the relationship between bit representation and computation cost. Even = LSB is 0 (right-shift). Odd = LSB is 1 (clear LSB, then shift). Each 1-bit costs a subtract; each position shift costs a divide. Steps = bit_length + popcount - 1.",
    starterCode: "def steps_to_zero(n):\n    steps = 0\n    pass",
    hints: [
      "While n > 0: if n % 2 == 0: n //= 2; else: n -= 1; steps += 1 each time.",
      "Each even step is a right-shift (>>1). Each odd step clears the LSB.",
      "Total = bit_length + popcount - 1. But implement the simulation first for understanding."
    ],
    solution: "def steps_to_zero(n):\n    steps = 0\n    while n > 0:\n        if n % 2 == 0:\n            n //= 2\n        else:\n            n -= 1\n        steps += 1\n    return steps",
    walkthrough: "Simulation: for 14 (1110): even→7, odd→6, even→3, odd→2, even→1, odd→0 = 6 steps. Each 1-bit in n demands a subtraction; each bit position shift is a division. The formula total = bit_length + popcount - 1 encodes this relationship.",
    testCode: "assert steps_to_zero(14) == 6\nassert steps_to_zero(8) == 4\nassert steps_to_zero(123) == 12\nassert steps_to_zero(0) == 0\nprint('All tests passed!')"
  },

  // ── STAGE 4: Optimization ──
  {
    id: 29, stage: 4, title: "Popcount — DP: popcount(x) = popcount(x>>1) + (x&1)", pattern: "DP on bits", skill: "popcount[i] = popcount[i >> 1] + (i & 1)",
    statement: "Count bits for 0..n in O(n) using DP: ans[0] = 0; ans[i] = ans[i >> 1] + (i & 1). i >> 1 is i without its last bit; (i & 1) is the last bit.",
    examples: [
      { input: "n = 5", output: "[0,1,1,2,1,2]" },
    ],
    why: "DP eliminates per-number loops. i >> 1 drops LSB (1 less bit to count). The LSB itself is i & 1. The answer for i uses the ALREADY-COMPUTED answer for i>>1. O(n).",
    starterCode: "def count_bits_dp(n):\n    dp = [0] * (n + 1)\n    pass",
    hints: [
      "dp[0] = 0. For i >= 1: dp[i] = dp[i >> 1] + (i & 1).",
      "i >> 1 is i/2 (floor) — all bits of i except the LSB. i & 1 is 1 if LSB is 1, else 0.",
      "Why does this work? Because i = (i>>1) shifted left by 1, plus the LSB. Popcount is additive."
    ],
    solution: "def count_bits_dp(n):\n    dp = [0] * (n + 1)\n    for i in range(1, n + 1):\n        dp[i] = dp[i >> 1] + (i & 1)\n    return dp",
    walkthrough: "DP recurrence: the popcount of i equals popcount of i without its LSB (i>>1) plus the LSB itself (i&1). Since i>>1 < i, dp[i>>1] is already computed. O(n) with just one + and one & per number.",
    testCode: "assert count_bits_dp(5) == [0,1,1,2,1,2]\nassert count_bits_dp(0) == [0]\nassert count_bits_dp(10) == [0,1,1,2,1,2,2,3,1,2,2]\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 4, title: "Reverse Bits — O(1) Per Byte (Lookup Table)", pattern: "byte-level lookup table", skill: "precompute reversed values for all 256 bytes; look up each byte of 32-bit int",
    statement: "Reverse bits of 32-bit integer in O(1) using precomputed lookup table for bytes. Reverse each of the 4 bytes, then arrange them in reverse order.",
    examples: [
      { input: "n = 43261596", output: "964176192" },
    ],
    why: "A 256-entry lookup table stores reversed bit patterns for every possible byte (0-255). Reverse the 4 bytes of a 32-bit int independently, then OR them together in reverse byte order. O(1).",
    starterCode: "def build_reverse_table():\n    pass\n\ndef reverse_bits_optimized(n):\n    table = build_reverse_table()\n    pass",
    hints: [
      "Build table: for each byte b in 0..255, reverse its 8 bits (loop or bit tricks). Store result.",
      "For 32-bit n: byte0 = (n >> 24) & 0xFF, byte1 = (n >> 16) & 0xFF, byte2 = (n >> 8) & 0xFF, byte3 = n & 0xFF.",
      "Result = (table[byte3] << 24) | (table[byte2] << 16) | (table[byte1] << 8) | table[byte0]."
    ],
    solution: "def build_reverse_table():\n    table = [0] * 256\n    for i in range(256):\n        rev = 0\n        for j in range(8):\n            if i & (1 << j):\n                rev |= (1 << (7 - j))\n        table[i] = rev\n    return table\n\ndef reverse_bits_optimized(n):\n    table = build_reverse_table()\n    byte3 = (n >> 24) & 0xFF\n    byte2 = (n >> 16) & 0xFF\n    byte1 = (n >> 8) & 0xFF\n    byte0 = n & 0xFF\n    return (table[byte0] << 24) | (table[byte1] << 16) | (table[byte2] << 8) | table[byte3]",
    walkthrough: "Precompute reversed patterns for all 256 byte values (8-bit reversal). Split 32-bit int into 4 bytes. Look up each byte's reverse. Assemble in reverse byte order: the least significant byte becomes the most significant in reversed output. 4 lookups + 4 shifts + 3 ORs = O(1).",
    testCode: "assert reverse_bits_optimized(43261596) == 964176192\nassert reverse_bits_optimized(0) == 0\nassert reverse_bits_optimized(1) == 1 << 31\nprint('All tests passed!')"
  },
  {
    id: 31, stage: 4, title: "Count Bits 0 to n — DP", pattern: "dp[i] = dp[i>>1] + (i&1)", skill: "O(n) popcount computation",
    statement: "Count bits from 0 to n using DP optimization (same as P21 but expanded as the primary teaching problem for DP-on-bits).",
    examples: [
      { input: "n = 5", output: "[0,1,1,2,1,2]" },
    ],
    why: "The DP insight: popcount(i) = popcount(i/2) + (i&1). Half the work is already done. This is the core optimization pattern for bit DP — reuse computation from smaller numbers.",
    starterCode: "def count_bits_0_to_n(n):\n    result = [0] * (n + 1)\n    pass",
    hints: [
      "result[0] = 0. For i from 1 to n: result[i] = result[i >> 1] + (i & 1).",
      "i >> 1 is i without the LSB. i & 1 is the LSB.",
      "This is also valid for any DP recurrence on bits: dp[i] = dp[i >> 1] + something(i & 1)."
    ],
    solution: "def count_bits_0_to_n(n):\n    result = [0] * (n + 1)\n    for i in range(1, n + 1):\n        result[i] = result[i >> 1] + (i & 1)\n    return result",
    walkthrough: "Fills dp array in O(n). Each i uses a previously computed value (i>>1 < i). Cache-friendly. This DP is the most common bit-DP pattern — used for counting bits, checking parity, enumerating powers of two, etc.",
    testCode: "assert count_bits_0_to_n(5) == [0,1,1,2,1,2]\nassert count_bits_0_to_n(8) == [0,1,1,2,1,2,2,3,1]\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 4, title: "Hamming Weight — DP Cumulative", pattern: "popcount using Brian Kernighan", skill: "use n & (n-1) for O(popcount) per number",
    statement: "Compute Hamming weight (popcount) of a single number using Brian Kernighan's algorithm: while n: n &= n-1; count++. O(popcount) instead of O(32).",
    examples: [
      { input: "n = 11 (1011)", output: "3" },
    ],
    why: "n & (n-1) drops the lowest set bit. The loop runs exactly popcount times. For sparse numbers (few 1s), much faster than iterating all 32 bits. For dense numbers, about the same.",
    starterCode: "def hamming_weight(n):\n    count = 0\n    pass",
    hints: [
      "while n > 0: n = n & (n - 1); count += 1.",
      "Each iteration clears the lowest set bit. Number of iterations = number of set bits.",
      "Return count. O(popcount(n)). Average popcount for random ints = 16, but worst case is 32."
    ],
    solution: "def hamming_weight(n):\n    count = 0\n    while n:\n        n &= n - 1\n        count += 1\n    return count",
    walkthrough: "n & (n-1) flips the lowest 1 to 0. Loop counts how many times this happens. For 11 (1011): 11&10=10, 10&9=8, 8&7=0 → 3 iterations. O(popcount).",
    testCode: "assert hamming_weight(11) == 3\nassert hamming_weight(0) == 0\nassert hamming_weight(255) == 8\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 4, title: "Check Power of Four", pattern: "power of two + 1-bits at even positions", skill: "n > 0 and n & (n-1) == 0 and n & 0xAAAAAAAA == 0 (no 1-bits at odd positions)",
    statement: "Check if n is a power of four. Condition: (1) n > 0, (2) n is power of two (n & (n-1) == 0), (3) the single 1-bit is at an even position (n & 0xAAAAAAAA == 0).",
    examples: [
      { input: "n = 16", output: "True" },
      { input: "n = 5", output: "False" },
      { input: "n = 2", output: "False", explain: "power of two but at odd position" },
    ],
    why: "Power of four = power of two AND the only set bit is at an even index (0, 2, 4, ...). Even positions have mask 0x55555555 (0101...). Check n & 0xAAAAAAAA == 0 (no set bits at odd positions).",
    starterCode: "def is_power_of_four(n):\n    pass",
    hints: [
      "First: is n > 0 and power of two? Check n & (n-1) == 0.",
      "The single set bit must be at an even position. Even positions: bits 0,2,4,6,... mask 0x55555555.",
      "Check: n & 0xAAAAAAAA == 0 (odd positions are 0). Or: n % 3 == 1 (another property of powers of 4)."
    ],
    solution: "def is_power_of_four(n):\n    return n > 0 and (n & (n - 1)) == 0 and (n & 0xAAAAAAAA) == 0",
    walkthrough: "Power of four = 4^k = 2^(2k). The single 1-bit is at position 0, 2, 4, 6, ... (even positions). Mask 0xAAAAAAAA = 1010...1010 (odd positions set). n & this mask == 0 means no bit at odd positions → bit is at an even position → power of four.",
    testCode: "assert is_power_of_four(16) == True\nassert is_power_of_four(5) == False\nassert is_power_of_four(2) == False\nassert is_power_of_four(1) == True\nassert is_power_of_four(64) == True\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 4, title: "Power of Two — Bitwise O(1)", pattern: "n & (n-1) check", skill: "n > 0 and n & (n-1) == 0 iff exactly one bit set = power of two",
    statement: "Check if n is a power of two using O(1) bit operation. A power of two has exactly one 1-bit. n & (n-1) drops the lowest set bit; if result is 0, there was exactly one bit. Contrast with the O(log n) division approach from Stage 3.",
    examples: [
      { input: "n = 16", output: "True" },
      { input: "n = 3", output: "False" },
      { input: "n = 0", output: "False" },
    ],
    why: "The canonical power-of-two check. n & (n-1) clears the lowest set bit. If the result is 0, there was exactly one bit → power of two. O(1) vs O(log n) division. This is the optimization that Stage 3's naive approach was begging for.",
    starterCode: "def is_power_of_two(n):\n    pass",
    hints: [
      "If n <= 0, return False (0 and negatives aren't powers of two).",
      "A power of two in binary: 1 (1), 2 (10), 4 (100), 8 (1000) — exactly one 1-bit.",
      "n & (n-1) == 0 means exactly one bit was set — that's the definition of a power of two."
    ],
    solution: "def is_power_of_two(n):\n    return n > 0 and (n & (n - 1)) == 0",
    walkthrough: "If n is a power of two (only one 1-bit), n & (n-1) clears that single bit → 0. If n has multiple 1-bits, clearing one leaves others → result != 0. n > 0 excludes 0 and negatives. O(1) — one AND and one compare.",
    testCode: "assert is_power_of_two(16) == True\nassert is_power_of_two(3) == False\nassert is_power_of_two(0) == False\nassert is_power_of_two(1) == True\nassert is_power_of_two(1024) == True\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 4, title: "Bitwise AND of Range [m, n]", pattern: "common prefix", skill: "AND of all numbers m..n = common prefix of m and n (shift until equal)",
    statement: "Given range [m, n] (m <= n), return bitwise AND of all numbers in the range. Optimization: continuously shift m and n right until they're equal (finding their common prefix). Count shifts, then shift the prefix back left. O(32).",
    examples: [
      { input: "m = 5, n = 7", output: "4", explain: "5(101) & 6(110) & 7(111) = 4(100) — common prefix '1'" },
      { input: "m = 0, n = 1", output: "0" },
    ],
    why: "AND of a consecutive range flips lower bits to 0 as numbers increment across the range. The result is the COMMON PREFIX of m and n — bits that never change. Shift both until equal, then shift back. O(log range).",
    starterCode: "def range_bitwise_and(m, n):\n    shift = 0\n    pass",
    hints: [
      "While m < n: shift both right by 1; shift += 1.",
      "After loop, m == n (common prefix). Return m << shift (restore to original bit positions).",
      "Bits that differ between m and n become 0 in the AND. Only the unchanging prefix survives."
    ],
    solution: "def range_bitwise_and(m, n):\n    shift = 0\n    while m < n:\n        m >>= 1\n        n >>= 1\n        shift += 1\n    return m << shift",
    walkthrough: "Find common prefix: shift both right until m == n. For m=5 (101), n=7 (111): shift1 → m=2,n=3; shift2 → m=1,n=1. Prefix=1. Restore: 1<<2=4. The differing lower bits (01 vs 11) all AND to 0 in the range. O(32).",
    testCode: "assert range_bitwise_and(5, 7) == 4\nassert range_bitwise_and(0, 1) == 0\nassert range_bitwise_and(2, 2) == 2\nassert range_bitwise_and(12, 15) == 12\nprint('All tests passed!')"
  },
  {
    id: 36, stage: 4, title: "Count Total Set Bits 1 to n", pattern: "per-bit position counting", skill: "for each bit position i, count complete cycles + partial cycle where bit i = 1",
    statement: "Given n, return total number of 1-bits in binary representations of all numbers from 1 to n. Per bit position: bits repeat with period 2^(i+1); the first half of each period has bit i = 1. Count complete cycles and partial remainder. O(32).",
    examples: [
      { input: "n = 5", output: "7", explain: "1(1)+1(10)+2(11)+1(100)+2(101)=7" },
      { input: "n = 0", output: "0" },
    ],
    why: "Instead of iterating n numbers, analyze per BIT POSITION. At position i, period = 2^(i+1). In each full period, exactly half (2^i) numbers have bit i = 1. Count full cycles + partial. O(32) independent of n — huge optimization.",
    starterCode: "def total_set_bits(n):\n    count = 0\n    i = 0\n    pass",
    hints: [
      "For bit position i: period = 1 << (i+1). Each full period contributes period // 2 = 2^i set bits.",
      "Full cycles = (n + 1) // period. Remainder = (n + 1) % period.",
      "Extra bits from partial cycle = max(0, remainder - period//2). Add to count."
    ],
    solution: "def total_set_bits(n):\n    count = 0\n    i = 0\n    while (1 << i) <= n:\n        period = 1 << (i + 1)\n        full_cycles = (n + 1) // period\n        count += full_cycles * (period // 2)\n        remainder = (n + 1) % period\n        count += max(0, remainder - (period // 2))\n        i += 1\n    return count",
    walkthrough: "Bit position 0: bits cycle 0,1,0,1,... (period=2). For n=5: numbers 0-5. Full cycles=3, 1-bit each → 3. Bit 1: period=4, cycle 0011,0011. Full cycles=1 (0-3, two 1s), remainder=2 (4-5, bit1=0). Total: pos0=3, pos1=2, pos2=2 → 7.",
    testCode: "assert total_set_bits(5) == 7\nassert total_set_bits(0) == 0\nassert total_set_bits(3) == 4\nassert total_set_bits(100) == 319\nprint('All tests passed!')"
  },

  // ── STAGE 5: Mastery ──
  {
    id: 37, stage: 5, title: "Single Number II (Every Appears Thrice — Mod 3)", pattern: "count bits per position, mod 3", skill: "each bit position's sum across all numbers modulo 3 gives the single number's bit",
    statement: "Given array where every element appears exactly three times except one which appears once. Find the single number. Each bit position: count how many numbers have a 1 there. If count % 3 == 1, the single number has a 1 at that position.",
    examples: [
      { input: "nums = [2,2,3,2]", output: "3" },
      { input: "nums = [0,1,0,1,0,1,99]", output: "99" },
    ],
    why: "XOR cancellation (mod 2) extends to mod-3 counter. For each bit position, count appearances of 1. Since numbers appear 3 times, count % 3 reveals the single number's bit at that position.",
    starterCode: "def single_number_ii(nums):\n    result = 0\n    for i in range(32):\n        pass\n    return result",
    hints: [
      "For each bit position 0..31: count = sum of (num >> i) & 1 for all num. If count % 3 == 1, set bit i in result.",
      "This works because for each bit, trio numbers contribute 3 (→ 0 mod 3). The singleton contributes 0 or 1.",
      "O(32 * n). More optimized: track two-state variables (ones, twos) for O(n) single pass."
    ],
    solution: "def single_number_ii(nums):\n    result = 0\n    for i in range(32):\n        count = 0\n        for num in nums:\n            if (num >> i) & 1:\n                count += 1\n        if count % 3:\n            result |= (1 << i)\n    return result if result < (1 << 31) else result - (1 << 32)",
    walkthrough: "For each of 32 bits: count how many numbers have that bit set. Mod 3: if 1 left, the singleton has that bit set. Build result. Handle negative numbers by checking sign bit. O(32*n). The state-machine approach (ones, twos) does it in one pass without per-bit loops.",
    testCode: "assert single_number_ii([2,2,3,2]) == 3\nassert single_number_ii([0,1,0,1,0,1,99]) == 99\nprint('All tests passed!')"
  },
  {
    id: 38, stage: 5, title: "Single Number III (Two Unique — XOR + Mask)", pattern: "XOR all → diff mask → separate into two groups", skill: "XOR all gives a^b; find a differing bit; partition into two groups; XOR each group to get a and b",
    statement: "Given array where every element appears exactly twice except TWO elements that appear once. Find those two. XOR all → a^b. Find a bit where a and b differ (using a^b & -(a^b)). Partition numbers by that bit. XOR each group.",
    examples: [
      { input: "nums = [1,2,1,3,2,5]", output: "[3,5]" },
      { input: "nums = [-1,0]", output: "[-1,0]" },
    ],
    why: "XOR all gives XOR of the two unique numbers (a^b). Since a != b, a^b has at least one 1-bit — that's a position where a and b differ. Group numbers by that bit: one group has a, the other has b. XOR each group to retrieve them.",
    starterCode: "def single_number_iii(nums):\n    xor_all = 0\n    for n in nums:\n        xor_all ^= n\n    pass",
    hints: [
      "xor_all = XOR of all numbers = a ^ b (pairs cancel).",
      "diff_bit = xor_all & -xor_all (lowest set bit of a^b, which is a position where a,b differ).",
      "Partition: group 1 = numbers where diff_bit is set, group 2 = others. XOR each group → one unique number each."
    ],
    solution: "def single_number_iii(nums):\n    xor_all = 0\n    for n in nums:\n        xor_all ^= n\n    diff_bit = xor_all & -xor_all\n    a = b = 0\n    for n in nums:\n        if n & diff_bit:\n            a ^= n\n        else:\n            b ^= n\n    return [a, b]",
    walkthrough: "Step 1: XOR all → a^b. Step 2: find the rightmost 1-bit in a^b (using xor_all & -xor_all). This is a position where a and b differ. Step 3: partition numbers by whether that bit is set. In each group, pairs still cancel, but a is in one group and b in the other. XOR each group → a, b. O(n).",
    testCode: "result = single_number_iii([1,2,1,3,2,5])\nassert set(result) == {3, 5}\nresult2 = single_number_iii([-1,0])\nassert set(result2) == {-1, 0}\nprint('All tests passed!')"
  },
  {
    id: 39, stage: 5, title: "Sum Without + (Half Adder)", pattern: "half adder with XOR and AND", skill: "sum = a ^ b (sum without carry); carry = (a & b) << 1; repeat until carry == 0",
    statement: "Compute sum of two integers a,b without using + operator. Use half-adder: sum = a ^ b (XOR gives sum without carry), carry = (a & b) << 1 (AND gives carry bits, shifted left). Repeat with sum and carry until carry is 0.",
    examples: [
      { input: "a = 3, b = 5", output: "8" },
      { input: "a = -2, b = 3", output: "1" },
    ],
    why: "XOR acts as addition without carry (0+0=0, 1+0=1, 0+1=1, 1+1=0 with carry). AND gives the carry bits. Iterate until no more carries. This is the hardware half-adder algorithm.",
    starterCode: "def add_without_plus(a, b):\n    pass",
    hints: [
      "Iterate: while b != 0: carry = (a & b) << 1; a = a ^ b; b = carry.",
      "a ^ b = sum without carry. (a & b) << 1 = carry bits, shifted to next position.",
      "Works for positive and negative integers in Python (two's complement for fixed-width, but Python ints are arbitrary precision — this still works)."
    ],
    solution: "def add_without_plus(a, b):\n    while b != 0:\n        carry = (a & b) << 1\n        a = a ^ b\n        b = carry\n    return a",
    walkthrough: "a^b computes the sum of bits where no carry is generated. a&b finds positions where BOTH bits are 1 (carry generated). Shift carry left (to next bit position). Repeat: compute sum of the previous sum and the carries. When carry = 0, we're done. O(number of bits in b).",
    testCode: "assert add_without_plus(3, 5) == 8\nassert add_without_plus(-2, 3) == 1\nassert add_without_plus(0, 0) == 0\nassert add_without_plus(100, 200) == 300\nprint('All tests passed!')"
  },
  {
    id: 40, stage: 5, title: "Integer Replacement (Bit Properties)", pattern: "greedy with bit parity", skill: "if even, n//2. if odd: for n=3 or n%4==1, n--; else n++.",
    statement: "Given positive integer n, replace: if even, n/2. If odd, n+1 or n-1. Find minimum steps to reach 1. Greedy with bit pattern: when odd, check last two bits. If n%4==1 or n==3, decrement; else increment.",
    examples: [
      { input: "n = 8", output: "3", explain: "8→4→2→1" },
      { input: "n = 7", output: "4", explain: "7→8→4→2→1" },
    ],
    why: "Bit-based decision: when odd, prefer the operation that creates more trailing zeros (more divisions by 2). n%4==1 means n in binary ends in '01': n-1 gives '00' (two trailing zeros). n%4==3 means n ends in '11': n+1 gives '00' (except n=3 which gives 2, not better).",
    starterCode: "def integer_replacement(n):\n    steps = 0\n    pass",
    hints: [
      "While n > 1: if n is even, n //= 2. If odd: if n == 3 or n % 4 == 1: n -= 1; else: n += 1.",
      "n % 4 checks last two bits. n%4==1 → ends 01, decrement gives 00. n%4==3 → ends 11, increment gives 00, more trailing zeros.",
      "Exception: n == 3 → 3→2→1 (2 steps via decrement) is better than 3→4→2→1 (3 steps via increment)."
    ],
    solution: "def integer_replacement(n):\n    steps = 0\n    while n > 1:\n        if n % 2 == 0:\n            n //= 2\n        elif n == 3 or n % 4 == 1:\n            n -= 1\n        else:\n            n += 1\n        steps += 1\n    return steps",
    walkthrough: "Even: always divide by 2. Odd: look at last two bits. If ending in 01 (n%4==1), decrement adds trailing zeros. If ending in 11 (n%4==3), increment adds more trailing zeros. Exception n=3: 3→2→1 is better than 3→4→2→1. O(log n) steps.",
    testCode: "assert integer_replacement(8) == 3\nassert integer_replacement(7) == 4\nassert integer_replacement(4) == 2\nassert integer_replacement(1) == 0\nprint('All tests passed!')"
  },
  {
    id: 41, stage: 5, title: "Subsets Enumeration (Bitmask 0..2^n-1)", pattern: "bitmask enumeration", skill: "for mask in 0..2^n-1: for each bit i, if mask & (1<<i), include element i",
    statement: "Given array of distinct elements, generate ALL subsets using bitmask enumeration. For each mask from 0 to 2^n-1, the bits indicate which elements are included.",
    examples: [
      { input: "nums = [1,2,3]", output: "[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]" },
      { input: "nums = [0]", output: "[[],[0]]" },
    ],
    why: "Bitmasks map perfectly to subsets: an n-bit number has bits 0..n-1; bit i set means element i is included. 2^n possible masks → all subsets enumerated. O(2^n * n) total.",
    starterCode: "def subsets_bitmask(nums):\n    n = len(nums)\n    result = []\n    pass",
    hints: [
      "For mask from 0 to (1<<n)-1: for i from 0 to n-1: if mask & (1 << i), include nums[i].",
      "The inner loop checks each bit of mask. Alternative: while mask > 0: use bit tricks.",
      "All subsets = 2^n masks. Bitmask enumeration is the standard method."
    ],
    solution: "def subsets_bitmask(nums):\n    n = len(nums)\n    result = []\n    for mask in range(1 << n):\n        subset = []\n        for i in range(n):\n            if mask & (1 << i):\n                subset.append(nums[i])\n        result.append(subset)\n    return result",
    walkthrough: "Enumerate integers 0 to 2^n - 1. Each integer's binary representation is a subset indicator: bit i = 1 means element i is in the subset. O(2^n * n) — the inner loop scans all n bits per mask. For n <= 20, this is feasible. Bitmask = subset identity.",
    testCode: "assert subsets_bitmask([1,2,3]) == [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]\nassert subsets_bitmask([0]) == [[],[0]]\nassert len(subsets_bitmask([])) == 1\nprint('All tests passed!')"
  },
  {
    id: 42, stage: 5, title: "Total Hamming Distance of All Pairs", pattern: "per-bit pair counting", skill: "for each bit position: k numbers have bit=1, (n-k) have bit=0, pairs = k*(n-k)",
    statement: "Given array nums, return sum of Hamming distances between all pairs (i,j). For each bit position: if k numbers have that bit set, pairs differing at that position = k * (n - k). Sum across 32 positions. O(32*n) instead of O(n²).",
    examples: [
      { input: "nums = [4,14,2]", output: "6", explain: "4(100)^14(1110)=2, 4^2=1, 14^2=3 → 6" },
      { input: "nums = [4,14,4]", output: "4" },
    ],
    why: "Pairwise Hamming distance is O(n²) naively. Optimization: count per bit. At each position, ones and zeros form ones*zeros differing pairs. Compose per-bit counting with combinatorics. Each 1-0 pair contributes 1 to total distance at that bit.",
    starterCode: "def total_hamming_distance(nums):\n    n = len(nums)\n    total = 0\n    pass",
    hints: [
      "For each bit position 0..31: count = number of nums with that bit set (using (num>>i) & 1).",
      "total += count * (n - count). Each 1-bit paired with each 0-bit = differing at this position.",
      "O(32*n) — independent of O(n²). For n=10^5, this is the only feasible approach."
    ],
    solution: "def total_hamming_distance(nums):\n    n = len(nums)\n    total = 0\n    for i in range(32):\n        ones = 0\n        for num in nums:\n            if (num >> i) & 1:\n                ones += 1\n        total += ones * (n - ones)\n    return total",
    walkthrough: "Track per bit: at position i, count how many numbers have 1 (ones) and 0 (n-ones). Each pair (one from 1s, one from 0s) differs at this bit. So contributions = ones * (n-ones). Sum across 32 bits. O(32*n).",
    testCode: "assert total_hamming_distance([4, 14, 2]) == 6\nassert total_hamming_distance([4, 14, 4]) == 4\nassert total_hamming_distance([0, 0, 0]) == 0\nprint('All tests passed!')"
  },
  {
    id: 43, stage: 5, title: "Decode XORed Array", pattern: "XOR inversion", skill: "arr[i+1] = arr[i] ^ encoded[i]; XOR is self-inverse (a^b=c ⇒ b=a^c)",
    statement: "Unknown array arr. Given encoded[i] = arr[i] ^ arr[i+1] and arr[0] (first element), reconstruct arr. Since a ^ b = c ⇔ b = a ^ c, iteratively: arr[i+1] = arr[i] ^ encoded[i].",
    examples: [
      { input: "encoded = [1,2,3], first = 1", output: "[1,0,2,1]", explain: "arr[1]=1^1=0, arr[2]=0^2=2, arr[3]=2^3=1" },
      { input: "encoded = [6,2,7,3], first = 4", output: "[4,2,0,7,4]" },
    ],
    why: "XOR is invertible: given a^b=c, you can recover either operand if you know the other. This chains: arr[0] known, arr[1] = arr[0]^encoded[0], arr[2] = arr[1]^encoded[1], etc. Composes XOR's self-inverse property with sequential reconstruction.",
    starterCode: "def decode_xor(encoded, first):\n    arr = [first]\n    pass",
    hints: [
      "Start arr = [first]. For each e in encoded: arr.append(arr[-1] ^ e).",
      "Because encoded[i] = arr[i] ^ arr[i+1], XOR both sides with arr[i] → arr[i+1] = arr[i] ^ encoded[i].",
      "XOR's self-inverse: if a^b=c, then b=a^c and a=c^b."
    ],
    solution: "def decode_xor(encoded, first):\n    arr = [first]\n    for e in encoded:\n        arr.append(arr[-1] ^ e)\n    return arr",
    walkthrough: "Recurrence: arr[i+1] = arr[i] ^ encoded[i]. Start with arr[0]. Each step XORs the last known element with the corresponding encoded value to reveal the next element. O(n). This is a direct consequence of XOR's inversion: a^b=c → b=a^c.",
    testCode: "assert decode_xor([1, 2, 3], 1) == [1, 0, 2, 1]\nassert decode_xor([6, 2, 7, 3], 4) == [4, 2, 0, 7, 4]\nassert decode_xor([], 5) == [5]\nprint('All tests passed!')"
  },
  {
    id: 44, stage: 5, title: "Subarray XOR Equals K", pattern: "prefix XOR + hashmap", skill: "count subarrays with XOR == K by tracking prefix XOR frequencies",
    statement: "Given array nums and integer k, count number of contiguous subarrays whose XOR equals k. Use prefix XOR: subarray L..R has XOR = prefix[R] ^ prefix[L-1]. As we iterate, track prefix frequencies in hashmap; for each prefix, check if prefix ^ k was seen before.",
    examples: [
      { input: "nums = [4,2,2,6,4], k = 6", output: "4" },
      { input: "nums = [5,6,7,8,9], k = 5", output: "2" },
    ],
    why: "Prefix XOR is the XOR analog of prefix sums. XOR(L,R) = prefix[R] ^ prefix[L-1]. To count subarrays with XOR==K: for each prefix[R], check if prefix[R]^K exists in the frequency map (as some prior prefix[L-1]). O(n) with hashmap.",
    starterCode: "def subarray_xor_count(nums, k):\n    count = 0\n    prefix = 0\n    freq = {0: 1}\n    pass",
    hints: [
      "prefix = running XOR. Iterate: prefix ^= num. target = prefix ^ k.",
      "If target is in freq map, add freq[target] to count (each prior occurrence starts a subarray ending here).",
      "Then increment freq[prefix]. This mirrors the 'subarray sum equals K' pattern with XOR replacing addition."
    ],
    solution: "def subarray_xor_count(nums, k):\n    count = 0\n    prefix = 0\n    freq = {0: 1}\n    for num in nums:\n        prefix ^= num\n        target = prefix ^ k\n        count += freq.get(target, 0)\n        freq[prefix] = freq.get(prefix, 0) + 1\n    return count",
    walkthrough: "If prefix[R] ^ prefix[L-1] = K, then prefix[L-1] = prefix[R] ^ K. For each R, we check if prefix[R]^K has been seen as any previous prefix. Each prior occurrence starts a subarray ending at R. freq tracks how many times each prefix value appeared. O(n).",
     testCode: "assert subarray_xor_count([4, 2, 2, 6, 4], 6) == 4\nassert subarray_xor_count([5, 6, 7, 8, 9], 5) == 2\nassert subarray_xor_count([1, 1, 1], 0) == 2\nprint('All tests passed!')"
  },

  // ── STAGE 6: Compose ──
  {
    id: 45, stage: 6, title: "Prime Number of Set Bits in Range", pattern: "popcount + prime check", skill: "compose popcount with prime set membership; count numbers with prime popcount in [L,R]",
    statement: "Given integers L,R, count numbers in the range whose number of set bits (popcount) is prime. Precompute primes up to 32. For each number: compute popcount, check if prime. Compose bit counting with mathematical property validation.",
    examples: [
      { input: "L = 6, R = 10", output: "4", explain: "6(110,2b→prime),7(111,3b→prime),9(1001,2b→prime),10(1010,2b→prime)" },
      { input: "L = 10, R = 15", output: "5" },
    ],
    why: "Cross-domain composition: bit manipulation counts 1-bits, then validates a mathematical property (primality) against a precomputed set. The constraints are bounded (max 20 bits for 10^6), so the prime set is small.",
    starterCode: "def count_prime_set_bits(L, R):\n    primes = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31}\n    count = 0\n    pass",
    hints: [
      "Precompute set of prime numbers up to max possible popcount (32 for 32-bit ints).",
      "For each i in range(L, R+1): if popcount(i) in primes, count++.",
      "Use bin(i).count('1') or i.bit_count() for popcount. Simple composition — no complex DP needed."
    ],
    solution: "def count_prime_set_bits(L, R):\n    primes = {2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31}\n    count = 0\n    for i in range(L, R + 1):\n        if bin(i).count('1') in primes:\n            count += 1\n    return count",
    walkthrough: "Range is bounded. For each number: count set bits, check if result is prime. Max popcount for 32-bit int is 32, but practical range bounds are much smaller. Composes popcount (bit skill) with set membership (math property).",
    testCode: "assert count_prime_set_bits(6, 10) == 4\nassert count_prime_set_bits(10, 15) == 5\nassert count_prime_set_bits(1, 1) == 0\nprint('All tests passed!')"
  },
  {
    id: 46, stage: 6, title: "Maximum XOR of Two Numbers", pattern: "greedy bit-by-bit with prefix set", skill: "build max XOR answer bit by bit from MSB; use hash set of prefixes to check feasibility",
    statement: "Given array nums, return the maximum XOR of any two elements. Build answer bit by bit from MSB (bit 31) to LSB. At each step, use a hash set of masked prefixes: check if any two prefixes XOR to give the current candidate. Greedy O(32*n).",
    examples: [
      { input: "nums = [3,10,5,25,2,8]", output: "28", explain: "5 ^ 25 = 28" },
      { input: "nums = [0]", output: "0" },
    ],
    why: "Mastery composes bit-by-bit greedy construction + set-based feasibility check. At each bit: try setting this bit to 1 in the answer. Collect all numbers' masked prefixes. If any p ^ candidate exists in the set, the bit is achievable. O(32*n).",
    starterCode: "def find_maximum_xor(nums):\n    max_xor = 0\n    mask = 0\n    pass",
    hints: [
      "Iterate bit i from 31 down to 0. mask |= (1 << i). Collect masked prefixes in set: {n & mask for n in nums}.",
      "candidate = max_xor | (1 << i). For each prefix p: if p ^ candidate in set, max_xor = candidate.",
      "Greedy: higher bits have exponentially more weight. If a bit can be 1, set it — it dominates all lower bits combined."
    ],
    solution: "def find_maximum_xor(nums):\n    max_xor = 0\n    mask = 0\n    for i in range(31, -1, -1):\n        mask |= (1 << i)\n        prefixes = {n & mask for n in nums}\n        candidate = max_xor | (1 << i)\n        for p in prefixes:\n            if (p ^ candidate) in prefixes:\n                max_xor = candidate\n                break\n    return max_xor",
    walkthrough: "Greedy: at bit i, try to set answer[i] = 1. prefixes = all numbers masked to bits 31..i. candidate = best so far with bit i = 1. p ^ candidate gives the needed other prefix to achieve XOR = candidate. If found, keep the bit. O(32*n).",
    testCode: "assert find_maximum_xor([3, 10, 5, 25, 2, 8]) == 28\nassert find_maximum_xor([0]) == 0\nassert find_maximum_xor([2, 4]) == 6\nprint('All tests passed!')"
  },
  {
    id: 47, stage: 6, title: "Divide Two Integers Without * / %", pattern: "bit-shift division", skill: "use left-shift to multiply divisor by power of 2; repeated subtraction",
    statement: "Compute dividend // divisor without using multiplication (*), division (/), or modulus (%). Use bit shifts: repeatedly find the largest shift where divisor << shift <= dividend, subtract it, accumulate 1 << shift to quotient. Handle signs and 32-bit overflow.",
    examples: [
      { input: "dividend = 10, divisor = 3", output: "3" },
      { input: "dividend = 7, divisor = -3", output: "-2" },
    ],
    why: "Bit shifts replace multiplication by powers of 2. Division = repeated subtraction of divisor * 2^k (found by left-shifting). Compose shifts, sign handling (XOR sign comparison), and 32-bit INT_MIN/-1 overflow check.",
    starterCode: "def divide(dividend, divisor):\n    pass",
    hints: [
      "Handle signs: result sign = (dividend < 0) ^ (divisor < 0). Convert both to absolute values.",
      "While dividend >= divisor: find largest shift where divisor << shift <= dividend. Subtract divisor<<shift, add 1<<shift to quotient.",
      "Handle overflow: if dividend == -2^31 and divisor == -1, return 2^31 - 1 (INT32_MAX)."
    ],
    solution: "def divide(dividend, divisor):\n    if dividend == -2147483648 and divisor == -1:\n        return 2147483647\n    sign = -1 if (dividend < 0) ^ (divisor < 0) else 1\n    dvd = abs(dividend)\n    dvs = abs(divisor)\n    quotient = 0\n    while dvd >= dvs:\n        temp = dvs\n        multiple = 1\n        while dvd >= (temp << 1):\n            temp <<= 1\n            multiple <<= 1\n        dvd -= temp\n        quotient += multiple\n    return sign * quotient",
    walkthrough: "Find the largest power-of-2 multiple of divisor that fits in remaining dividend. Subtract and repeat. Inner while doubles temp (shift left = *2) until exceeding dvd. Each subtraction adds the corresponding power of 2 to quotient. This is binary long division. O(log dividend) steps.",
    testCode: "assert divide(10, 3) == 3\nassert divide(7, -3) == -2\nassert divide(0, 1) == 0\nassert divide(15, 3) == 5\nprint('All tests passed!')"
  },
  {
    id: 48, stage: 6, title: "XOR Queries of Subarray", pattern: "prefix XOR + range query", skill: "precompute prefix XOR; answer any [L,R] XOR query in O(1) per query",
    statement: "Given array arr and queries [L,R] (inclusive), return XOR of elements from L to R for each query. Precompute prefix XOR: prefix[i] = XOR of arr[0..i-1]. Then XOR(L,R) = prefix[R+1] ^ prefix[L]. Compose prefix array + query processing.",
    examples: [
      { input: "arr = [1,3,4,8], queries = [[0,1],[1,2],[0,3],[3,3]]", output: "[2,7,14,8]" },
      { input: "arr = [4,8,2,10], queries = [[2,3],[0,2]]", output: "[8,14]" },
    ],
    why: "Prefix XOR answers range queries in O(1) after O(n) preprocessing. Since a^a=0: XOR(0,R) ^ XOR(0,L-1) cancels the elements before L, leaving exactly XOR(L,R). Same pattern as prefix sums but with XOR's self-cancellation.",
    starterCode: "def xor_queries(arr, queries):\n    prefix = [0]\n    for v in arr:\n        prefix.append(prefix[-1] ^ v)\n    result = []\n    pass",
    hints: [
      "Build prefix XOR: prefix[i] = XOR of first i elements. prefix has length n+1, prefix[0] = 0.",
      "For query (L,R): answer = prefix[R+1] ^ prefix[L].",
      "Because XOR(arr[0..R]) ^ XOR(arr[0..L-1]) = XOR(arr[L..R]) — elements 0..L-1 cancel via a^a=0."
    ],
    solution: "def xor_queries(arr, queries):\n    prefix = [0]\n    for v in arr:\n        prefix.append(prefix[-1] ^ v)\n    result = []\n    for L, R in queries:\n        result.append(prefix[R + 1] ^ prefix[L])\n    return result",
    walkthrough: "Precompute prefix XOR of length n+1. For query (L,R): XOR(L,R) = XOR(0,R) ^ XOR(0,L-1). This works because a^a=0 — the prefix before L cancels out of the total prefix through R. O(n + q). Same pattern as prefix sum but using XOR's inversion.",
    testCode: "assert xor_queries([1,3,4,8], [[0,1],[1,2],[0,3],[3,3]]) == [2,7,14,8]\nassert xor_queries([4,8,2,10], [[2,3],[0,2]]) == [8,14]\nprint('All tests passed!')"
  },
  {
    id: 49, stage: 6, title: "Binary Watch", pattern: "popcount + enumeration", skill: "enumerate all (h,m) with exactly k LEDs lit; popcount on hour and minute components",
    statement: "A binary watch: 4 LEDs for hours (0-11), 6 LEDs for minutes (0-59). Given turnedOn (number of LEDs lit), return all possible times in format 'H:MM'. For each valid (h,m) pair, check popcount(h) + popcount(m) == turnedOn.",
    examples: [
      { input: "turnedOn = 1", output: "['0:01','0:02','0:04','0:08','0:16','0:32','1:00','2:00','4:00','8:00']" },
      { input: "turnedOn = 9", output: "[]", explain: "max combined LEDs = 10; 9 cannot form a valid time" },
    ],
    why: "Composes popcount with cartesian enumeration. Flood-fill all valid (h,m) pairs (12×60=720), filter by popcount sum. Same popcount primitive, applied to two small integers independently, with combinatorial selection.",
    starterCode: "def read_binary_watch(turned_on):\n    result = []\n    pass",
    hints: [
      "Hours range 0..11 (4 LEDs, max popcount 3 for 11=1011). Minutes range 0..59 (6 LEDs).",
      "For each hour h and minute m: if popcount(h) + popcount(m) == turnedOn, format as f'{h}:{m:02d}'.",
      "Popcount: bin(x).count('1'). Brute force 720 checks is instantaneous."
    ],
    solution: "def read_binary_watch(turned_on):\n    result = []\n    for h in range(12):\n        for m in range(60):\n            if bin(h).count('1') + bin(m).count('1') == turned_on:\n                result.append(f'{h}:{m:02d}')\n    return result",
    walkthrough: "Brute-force all 12×60=720 possible times. For each, count set bits in hour (4 LEDs: 1,2,4,8) and minute (6 LEDs: 1,2,4,8,16,32). If sum == turnedOn, valid time. Compose popcount + enumeration + formatting. Solve the 'which bits are lit' problem for a real device.",
    testCode: "result = read_binary_watch(1)\nassert len(result) == 10\nassert '0:01' in result\nassert '8:00' in result\nassert read_binary_watch(9) == []\nprint('All tests passed!')"
  },
  {
    id: 50, stage: 6, title: "Minimum Flips to Make a | b = c", pattern: "per-bit operation analysis", skill: "for each bit of a,b,c, determine min flips to satisfy a|b=c",
    statement: "Given a,b,c, return minimum bit flips in a and b (0→1 or 1→0) to make a | b = c. Per-bit analysis: if c's bit is 1 and a,b both 0 → 1 flip. If c's bit is 0 → flips = a_bit + b_bit (flip each 1 to 0). Sum across 32 bits.",
    examples: [
      { input: "a = 2 (10), b = 6 (110), c = 5 (101)", output: "3" },
      { input: "a = 1, b = 2, c = 3", output: "0", explain: "1|2=3 already" },
    ],
    why: "Mastery composes per-bit analysis + conditional logic. Each bit position is independent — operations on one bit don't affect others. For each bit, enumerate the 4 combinations of (a_bit, b_bit) against c_bit. Compose bit extraction + OR semantics + minimization.",
    starterCode: "def min_flips(a, b, c):\n    flips = 0\n    pass",
    hints: [
      "For each bit i (0..31): extract a_bit, b_bit, c_bit using (x>>i)&1.",
      "If c_bit == 1 and a_bit==0 and b_bit==0: flips += 1 (make one of them 1). If c_bit == 0: flips += a_bit + b_bit (both must be 0).",
      "Each bit is independent; no carry or interaction between positions. Straightforward per-bit sum."
    ],
    solution: "def min_flips(a, b, c):\n    flips = 0\n    for i in range(32):\n        bit_a = (a >> i) & 1\n        bit_b = (b >> i) & 1\n        bit_c = (c >> i) & 1\n        if bit_c == 1:\n            if bit_a == 0 and bit_b == 0:\n                flips += 1\n        else:\n            flips += bit_a + bit_b\n    return flips",
    walkthrough: "Bit position independence: a|b=c must hold at each position. c=1 requires at least one 1 in a or b — cost 1 if both are 0. c=0 requires both a and b to be 0 — cost = a_bit+b_bit (flip each 1 to 0). Sum across 32 independent positions. O(32).",
    testCode: "assert min_flips(2, 6, 5) == 3\nassert min_flips(1, 2, 3) == 0\nassert min_flips(4, 2, 7) == 1\nprint('All tests passed!')"
  },
]
