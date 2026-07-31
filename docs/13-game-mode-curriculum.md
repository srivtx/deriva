# 13 — Game Mode Curriculum

## Purpose

Game Mode is not a points layer over practice. It is a separate interaction layer
where each game makes one family of algorithmic thinking physically observable.
Existing questions in `src/data/` remain unchanged. Games may link to them as
read-only transfer destinations, but never rewrite their content or completion state.

## Design Laws

1. **The player manipulates a concept, not a quiz answer.** A correct tap must change
   the simulated world: a frame moves, a frontier expands, a branch dies, or a state is
   remembered.
2. **One game engine owns one family of patterns.** Games are reusable simulations with
   authored levels, not one-off mini-games.
3. **Every level has a visible failure state.** The player sees the invariant break or
   the frontier make a bad move before being told why.
4. **Every run ends with a transfer.** The game names where the same move appears in a
   real lesson or existing practice problem.
5. **No arbitrary XP, lives, loot, or variable-ratio rewards.** The reward is a clearer
   model, a clean run, and a new transfer unlocked by evidence.
6. **Phone first.** One manipulation per screen, thumb-sized controls, animated state
   changes, no drag requirement where a tap sequence communicates the same idea.

## Pattern Coverage Target

| Game engine | Patterns covered |
|---|---|
| Stack Climber | Recursive Leap of Faith; Traversal-as-Skeleton; Upward Aggregation; Returning Tuples; Path-as-Array + Prefix-on-Path; Function-as-List |
| Invariant Inspector | Invariant-Driven Structure; Downward Constraints; Pointer Surgery; Sentinel Thinking; Representative Trees |
| Frontier Runner | The Two Walks; Layer Argument; Frontier Maintenance; Greedy Frontier; Relaxation Rounds; Sweep Line; Elimination-of-Sources |
| Decision Garden | Decision Tree; Choose-Explore-Unchoose; Pruning; Visited/Canonical Form; Bit-as-Membership Enumeration |
| State Forge | Overlap → Memoization; State Design; Ending at i; Table-as-Product; Cancellation Algebra |
| Compression Workshop | Structure-as-Compression; Local-Rules-Global-Answer; Masks & Stencils; Elimination |
| Proof Arena | Exchange Argument; Invariance-Preserving Reduction; Halve-the-Work |

This is the target map, not a claim that the current UI teaches all of these patterns.
Game Mode should reinforce the full curriculum over time, but it should not replace the
lessons or reduce every pattern to a multiple-choice card.
Some patterns intentionally appear in more than one engine because transfer is part
of mastery, not duplication by accident.

## Level Shape

Every game level follows the same loop:

```text
1. Read the situation
2. Make a prediction
3. Manipulate the state
4. Watch the consequence
5. Repair or continue
6. Name the pattern
7. Transfer to a real lesson
```

## First Implementation

`Stack Climber` is the reference game. Its run covers six recursion concepts in one
continuous state machine:

- Contract: what does the function promise?
- Descent: does the next call move toward a smaller problem?
- Base case: where does the chain stop?
- Call stack: which frames are waiting?
- Return flow: how do answers climb upward?
- Transfer: how does the same shape appear in a tree?

The player should see those transitions move on screen. Static choice cards do not
qualify as a finished game interaction.

## Implementation Audit — 2026-07-31

The original catalog marked every engine as `playable`, but the implementation did not
match that label:

| Engine | Current implementation | Honest status |
|---|---|---|
| Stack Climber | Stateful recursion simulation with prediction, action, stack motion, and return flow | Playable |
| Algorithm Relay | Five static choice rooms with a shared scene | Prototype |
| Invariant Inspector | Three generic choice cards | Next |
| Bike Route Runner | Stateful 3D graph route with prediction, BFS layers, and weighted frontier | Playable |
| Decision Garden | Three generic choice cards | Next |
| State Forge | Three generic choice cards | Next |
| Compression Workshop | Three generic choice cards | Next |
| Proof Arena | Three generic choice cards | Next |

The generic engines mention useful ideas, but they do not yet satisfy the game laws above:
they do not let the player manipulate the structure, predict a concrete next state, see a
real failure, or transfer the learned move to a lesson. They are labeled as future engines
rather than pretending that the pattern family is already mastered.

## Scope Decision

Game Mode will teach a small set of high-leverage moves deeply, then point to the full
lesson curriculum for breadth. It will not attempt to make all 36 patterns into separate
mini-games.

The first useful set is:

1. Define a recursive contract.
2. Shrink a problem toward a base case.
3. Move information upward through returns.
4. Preserve an invariant during mutation.
5. Move a frontier with a meaningful ordering.
6. Choose, explore, and undo a decision.
7. Remember the smallest state that preserves the future.
8. Compress repeated work with the right representation.
9. Attack a shortcut with a counterexample or proof.

Each future engine must repeat its move across several concrete rounds, include prediction
before manipulation, show a visible failure state, and end with a transfer link. The full
named patterns remain in the curriculum lessons, where they can receive the depth and
implementation practice they require.

## Progression

Game Mode unlocks engines by pattern evidence, not by problem count:

```text
Stack Climber → Invariant Inspector → Decision Garden
               ↘ Frontier Runner → State Forge → Proof Arena
```

Compression Workshop becomes available after the player has manipulated at least one
structure and one state machine. A future engine may have multiple levels, but the
first level of each engine must be short enough to replay in under five minutes.
