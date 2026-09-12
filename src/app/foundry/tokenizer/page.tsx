"use client"

// FOUNDRY · Station 01 — Token Bench.
// A real BPE tokenizer: watch the merges get learned, then predict counts,
// cut a prompt to a token budget, and price a request.

import { useEffect, useMemo, useState } from "react"
import { FoundryCompletion, FoundryShell } from "@/components/foundry-shell"
import { FOUNDRIES } from "@/foundry/catalog"
import { triggerGameFeedback } from "@/games/feedback"
import { loadStationProgress, recordMissionCleared, recordStationRun } from "@/foundry/progress"
import { BPE_CORPUS, encodeBPE, encodeWord, tokenCost, trainBPE } from "@/foundry/engine-bpe"

const STATION = FOUNDRIES[0]
const MODEL = trainBPE(BPE_CORPUS, 150)

const WALKER_WORDS = [" tokens", " the", " cache", " model", " reads"]
const WALKER_STEPS = 12

const COUNT_TARGETS = [
  { text: "the model reads the tokens", hint: "Common words — the merges have them covered." },
  { text: "Tokenizer: split rare-words!", hint: "Punctuation stands alone and rare words shatter." },
  { text: "cache the keys and reuse the values", hint: "Corpus words compress hard." },
]

const BUDGET_SENTENCES = [
  { text: "Answer using only the context below.", required: true },
  { text: "The launch code is K7X9 and it expires at midnight.", required: true },
  { text: "Please be helpful and harmless and honest and thorough.", required: false },
  { text: "As a language model built by engineers for engineers, I will now", required: false },
  { text: "cache the keys and reuse the values when tokens repeat", required: false },
]

const PRICE_ITEMS = [
  {
    story: "One chat turn: 1,200 input tokens, 600 output tokens. Input lists at $0.50 per million, output at $1.50 per million.",
    options: ["$0.0015", "$0.015", "$0.15"],
    correct: "$0.0015",
    explain: "1200 × 0.5 / 1,000,000 = $0.0006 in, 600 × 1.5 / 1,000,000 = $0.0009 out — $0.0015 total. Output costs three times the input.",
  },
  {
    story: "A batch job: 200 requests, each 1,500 input and 300 output tokens, same prices.",
    options: ["$0.024", "$0.24", "$2.40"],
    correct: "$0.24",
    explain: "Per request: 1500 × 0.5 + 300 × 1.5 = 1,200 per million-token units... scaled: $0.0012 each. Two hundred of them: $0.24. Token math is production math.",
  },
]

function TokenChips({ text }: { text: string }) {
  const encoding = useMemo(() => encodeBPE(text, MODEL), [text])
  return (
    <div className="foundry-token-row" aria-label={`${encoding.pieces.length} tokens`}>
      {encoding.words.flatMap(({ word, pieces }, wi) =>
        pieces.map((piece, pi) => (
          <span key={`${wi}-${pi}`} className="foundry-token-chip" title={word.trim() || piece}>
            {piece.replace(/ /g, "␣")}
          </span>
        )),
      )}
    </div>
  )
}

function MergeWalker({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const merges = MODEL.merges.slice(0, WALKER_STEPS)
  const latest = step > 0 ? merges[step - 1] : null

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 1 · Watch the forge</span>
      <h1 className="stage-title">A vocabulary is learned, not declared.</h1>
      <p className="narrative">
        The tokenizer starts with single characters. It scans the corpus, finds the adjacent pair
        that repeats most, and welds it into one token. Again and again. Step through the first{" "}
        {WALKER_STEPS} merges and watch three words get cheaper.
      </p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>merge {step} of {WALKER_STEPS} · vocab {MODEL.baseVocab + step}</span><b>{step === 0 ? "raw characters" : latest ? `${latest.pair[0]} + ${latest.pair[1]} → ${latest.merged}` : ""}</b></div>
        {latest && (
          <div className="foundry-merge-line">
            <code>{latest.pair[0]}</code><code>{latest.pair[1]}</code><span>seen {latest.count}×</span><code className="foundry-merge-out">{latest.merged}</code>
          </div>
        )}
        <div className="foundry-word-lab">
          {WALKER_WORDS.map(word => (
            <div key={word} className="foundry-word-evolution">
              <small>{word.trim()}</small>
              <div className="foundry-token-row">
                {encodeWord(word, MODEL, step).map((piece, i) => (
                  <span key={i} className="foundry-token-chip">{piece.replace(/ /g, "␣")}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <code>merge rule: count all adjacent pairs → weld the most frequent → repeat</code>
      </div>
      <div className="foundry-step-controls">
        <button className="btn-ghost" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>← undo one</button>
        <button className="btn-primary" onClick={() => setStep(s => Math.min(WALKER_STEPS, s + 1))} disabled={step === WALKER_STEPS}>weld next merge →</button>
        <button className="btn-ghost as-link" onClick={onDone} disabled={step < 8}>I see how vocabularies grow →</button>
      </div>
    </section>
  )
}

function CountQuiz({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const item = COUNT_TARGETS[index]
  const actual = useMemo(() => encodeBPE(item.text, MODEL).pieces.length, [item.text])
  const options = [actual - 1, actual, actual + 1]
  const [revealed, setRevealed] = useState(false)

  const pick = (option: number) => {
    if (revealed) return
    setPicked(option)
    if (option === actual) {
      triggerGameFeedback("correct")
      setRevealed(true)
    } else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  const next = () => {
    if (index + 1 === COUNT_TARGETS.length) {
      triggerGameFeedback("complete")
      onDone()
      return
    }
    setIndex(i => i + 1)
    setPicked(null)
    setRevealed(false)
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 2 · Call the count</span>
      <h1 className="stage-title">How many tokens is this?</h1>
      <p className="narrative">{item.hint} Call the count before the reveal — pricing, context windows and rate limits all start here.</p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>prompt {index + 1} of {COUNT_TARGETS.length}</span><b>chars: {item.text.length}</b></div>
        <p className="foundry-prompt-line">{item.text}</p>
        {revealed && <TokenChips text={item.text} />}
        <code>{revealed ? `${actual} tokens — that is what the model actually sees` : "characters are not tokens"}</code>
      </div>
      <div className="game-choice-box">
        {options.map(option => (
          <button key={option} className={`game-choice ${picked === option ? (option === actual ? "selected" : "is-wrong") : ""}`} onClick={() => pick(option)}>
            {option} tokens
          </button>
        ))}
      </div>
      {revealed && (
        <>
          <div className="game-feedback correct"><b>Called it.</b><p>The meter in your head now measures in tokens, not characters.</p></div>
          <button className="btn-primary" onClick={next}>{index + 1 === COUNT_TARGETS.length ? "Price the tokens →" : "Next prompt →"}</button>
        </>
      )}
      {!revealed && picked !== null && (
        <div className="game-feedback wrong"><b>Off by {Math.abs((picked ?? 0) - actual)}.</b><p>Look at the chips — leading spaces join words, punctuation stands alone, rare words shatter.</p></div>
      )}
    </section>
  )
}

function BudgetCut({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const [kept, setKept] = useState<boolean[]>(BUDGET_SENTENCES.map(() => true))
  const [submitted, setSubmitted] = useState(false)

  const promptText = BUDGET_SENTENCES.filter((_, i) => kept[i]).map(s => s.text).join(" ")
  const used = useMemo(() => (promptText ? encodeBPE(promptText, MODEL).pieces.length : 0), [promptText])
  const requiredText = BUDGET_SENTENCES.filter(s => s.required).map(s => s.text).join(" ")
  const budget = useMemo(() => encodeBPE(requiredText, MODEL).pieces.length, [requiredText])
  const keepsRequired = BUDGET_SENTENCES.every((s, i) => !s.required || kept[i])
  const passes = submitted && used <= budget && keepsRequired

  const submit = () => {
    setSubmitted(true)
    if (used <= budget && keepsRequired) triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 3 · The budget cut</span>
      <h1 className="stage-title">Cut the prompt to {budget} tokens.</h1>
      <p className="narrative">
        The context window is 2,000 tokens and this prompt must leave room for the answer.
        Keep the constraint and the fact — everything else has to justify its tokens.
      </p>
      <div className="concept-visual forge-panel">
        <div className="concept-visual-top"><span>token budget</span><b className={used > budget ? "foundry-over" : "foundry-under"}>{used} / {budget}</b></div>
        <div className="foundry-budget-bar"><span style={{ width: `${Math.min(100, (used / budget) * 100)}%`, background: used > budget ? "var(--viz-pruned)" : "var(--viz-settled)" }} /></div>
        <div className="foundry-sentence-list">
          {BUDGET_SENTENCES.map((sentence, i) => (
            <button key={i} className={`foundry-sentence-toggle ${kept[i] ? "on" : ""} ${sentence.required ? "required" : ""}`} onClick={() => setKept(k => k.map((v, j) => (j === i ? !v : v)))}>
              <i>{kept[i] ? "◆" : "◇"}</i>
              <span>{sentence.text}</span>
              <code>{encodeBPE(sentence.text, MODEL).pieces.length} tok</code>
            </button>
          ))}
        </div>
      </div>
      {submitted && passes && <div className="game-feedback correct"><b>Under budget with the fact intact.</b><p>Fluff is not free. Every token you cut is a token the answer can use.</p></div>}
      {submitted && !passes && (
        <div className="game-feedback wrong">
          <b>{!keepsRequired ? "The fact or the constraint got cut." : "Still over budget."}</b>
          <p>Keep the two required lines and drop the filler — then resubmit.</p>
        </div>
      )}
      <div className="foundry-step-controls">
        {!passes && <button className="btn-primary" onClick={submit}>Submit the prompt</button>}
        {passes && <button className="btn-primary" onClick={onDone}>Take the pricing desk →</button>}
      </div>
    </section>
  )
}

function PriceDesk({ onDone, onMistake }: { onDone: () => void; onMistake: () => void }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const item = PRICE_ITEMS[index]
  const correct = picked === item.correct

  const pick = (option: string) => {
    if (picked !== null) return
    setPicked(option)
    if (option === item.correct) triggerGameFeedback("correct")
    else {
      triggerGameFeedback("wrong")
      onMistake()
    }
  }

  const next = () => {
    if (index + 1 === PRICE_ITEMS.length) {
      triggerGameFeedback("complete")
      onDone()
      return
    }
    setIndex(i => i + 1)
    setPicked(null)
  }

  return (
    <section className="game-act">
      <span className="stage-kicker">Mission 4 · The pricing desk</span>
      <h1 className="stage-title">What does this request cost?</h1>
      <p className="narrative">{item.story}</p>
      <div className="game-choice-box">
        {item.options.map(option => (
          <button key={option} className={`game-choice ${picked === option ? (option === item.correct ? "selected" : "is-wrong") : ""}`} onClick={() => pick(option)}>{option}</button>
        ))}
      </div>
      {picked !== null && (
        <>
          <div className={`game-feedback ${correct ? "correct" : "wrong"}`}><b>{correct ? "Exactly." : "Orders of magnitude matter."}</b><p>{item.explain}</p></div>
          <button className="btn-primary" onClick={next}>{index + 1 === PRICE_ITEMS.length ? "Finish the bench →" : "Next invoice →"}</button>
        </>
      )}
      <code className="foundry-formula">cost = (in × price_in + out × price_out) / 1,000,000 · {tokenCost(1_000_000, 0.5) === 0.5 ? "sanity check: 1M tokens at $0.50/M costs $0.50" : ""}</code>
    </section>
  )
}

export default function TokenBenchPage() {
  const [mission, setMission] = useState(1)
  const [mistakes, setMistakes] = useState(0)
  const [finished, setFinished] = useState(false)

  // Resume where the last session left off; fully cleared stations replay from the top.
  useEffect(() => {
    const saved = loadStationProgress(STATION.id)
    if (saved && saved.missionsCleared > 0 && saved.missionsCleared < STATION.missions) setMission(saved.missionsCleared + 1)
  }, [])

  const next = () => {
    recordMissionCleared(STATION.id, mission)
    setMission(m => m + 1)
  }
  const mistake = () => setMistakes(m => m + 1)
  const complete = () => {
    triggerGameFeedback("complete")
    recordStationRun(STATION.id, STATION.missions, mistakes)
    setFinished(true)
  }

  if (finished) {
    return (
      <FoundryShell station={STATION} mission={STATION.missions}>
        <FoundryCompletion
          station={STATION}
          stats={[
            { label: "Missions cleared", value: STATION.missions },
            { label: "Mistakes this run", value: mistakes },
            { label: "Vocabulary trained", value: `${MODEL.vocab.length} tokens` },
          ]}
          concepts={[
            { title: "Merges, not words", description: "A tokenizer learns repeated pairs until rare words are the only ones that shatter." },
            { title: "Count in tokens", description: "Context windows, rate limits and invoices are all token-denominated." },
            { title: "Budget = surgery", description: "Cutting fluff under a token budget keeps the fact and the constraint." },
            { title: "Output costs more", description: "Pricing is asymmetric — the generated tokens are the expensive ones." },
          ]}
          onRestart={() => {
            setMission(1)
            setMistakes(0)
            setFinished(false)
          }}
        />
      </FoundryShell>
    )
  }

  return (
    <FoundryShell station={STATION} mission={mission}>
      {mission === 1 && <MergeWalker onDone={next} />}
      {mission === 2 && <CountQuiz onDone={next} onMistake={mistake} />}
      {mission === 3 && <BudgetCut onDone={next} onMistake={mistake} />}
      {mission === 4 && <PriceDesk onDone={complete} onMistake={mistake} />}
    </FoundryShell>
  )
}
