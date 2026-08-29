// RES — research-brainstorm trainer.
// Prep for short open-ended research interviews (understand → hypothesize →
// design → predict → attack → iterate). Content is methodology-first: every
// question is walked through with a model brainstorm, challenged with the
// follow-ups an interviewer would actually ask, and closed with pitfalls.

export interface ResFollowup {
  q: string
  a: string
}

export interface ResSteps {
  frame: string
  hypothesize: string
  design: string
  predict: string
  attack: string
  iterate: string
}

export interface ResQuestion {
  id: string
  domain: string
  title: string
  difficulty: "Warm-up" | "Core" | "Hard"
  setup: string
  question: string
  steps: ResSteps
  followups: ResFollowup[]
  pitfalls: string[]
  takeaway: string
  source?: string
}

export interface ResMethodStep {
  key: keyof ResSteps
  name: string
  what: string
  say: string
}

export interface ResPipelineStage {
  stage: string
  what: string
  signal: string
}

// ── The reported pipeline (varies by cohort — treat as orientation, not gospel) ──

export const RES_PIPELINE: ResPipelineStage[] = [
  {
    stage: "Resume screen",
    what: "Context before signals. Nothing to rehearse.",
    signal: "Does the record show taste and follow-through?",
  },
  {
    stage: "OA1 · coding",
    what: "Technical assessment — algorithms and implementation.",
    signal: "Can you write correct code under time pressure?",
  },
  {
    stage: "OA2 · debugging",
    what: "Problem-solving assessment — find and fix what is broken.",
    signal: "Can you form hypotheses about a bug and test them fast?",
  },
  {
    stage: "Take-home",
    what: "A multi-hour research assignment (recent reports: ~4–5h, sometimes split into assisted work plus written reflection).",
    signal: "Can you run an open-ended investigation and write it up?",
  },
  {
    stage: "15-min brainstorm",
    what: "Two open-ended research questions, live. You think out loud — often with almost no feedback while you do — and defend your direction when challenged.",
    signal: "Research fluency, grounding in the lab's published work, thesis articulation, technical depth, intellectual independence. The 'right' answer is not the point.",
  },
  {
    stage: "Decision",
    what: "Offer or pass; some cohorts add references.",
    signal: "Would this person survive four months of open-ended research?",
  },
]

// ── The method: one loop, six moves ──

export const RES_METHOD: ResMethodStep[] = [
  {
    key: "frame",
    name: "Frame",
    what: "Restate the question in your own words. Name the measurable claim. Ask one or two clarifying questions — scope, resources, what would count as an answer.",
    say: "Before designing anything, let me pin down what we would actually measure.",
  },
  {
    key: "hypothesize",
    name: "Hypothesize",
    what: "Offer two or three candidate mechanisms — distinct, testable, not strawmen. If everything you propose is compatible with every outcome, you have no hypotheses.",
    say: "There are three ways this could be happening, and they disagree about what we'd see if…",
  },
  {
    key: "design",
    name: "Design",
    what: "For the leading hypothesis: an intervention, a measurement, a control. Name the dataset and the comparison. The design should isolate one variable.",
    say: "The cleanest test is X, because it breaks assumption Y while holding everything else fixed.",
  },
  {
    key: "predict",
    name: "Predict",
    what: "Before seeing any data, say what each result would mean — both directions. Predictions are what make an experiment interpretable instead of anecdotal.",
    say: "If I see A, that supports hypothesis 1; if I see not-A, that shifts weight to hypothesis 2.",
  },
  {
    key: "attack",
    name: "Attack",
    what: "Confounds, alternative explanations, ways the result could be ambiguous. Do the interviewer's job before they do — attack your own design first.",
    say: "The biggest flaw here is… and the control that would catch it is…",
  },
  {
    key: "iterate",
    name: "Iterate",
    what: "The follow-up experiment that disambiguates what the first one left open — and what would falsify the hypothesis outright. Research is this loop, not a single design.",
    say: "If that is still ambiguous, the next experiment is… and here is what would kill the hypothesis.",
  },
]

// ── The question bank ──

export const RES_QUESTIONS: ResQuestion[] = [
  {
    id: "R01",
    domain: "Evaluations",
    title: "Measuring sycophancy",
    difficulty: "Core",
    setup: "You are handed API access to a chat model — no internals, no weights. Users complain it agrees with them too much.",
    question: "Design an experiment to measure whether the model tells users what they want to hear rather than what it believes is true.",
    steps: {
      frame: "Telling you what you want to hear bundles two claims: the model has a belief, and its stated answer tracks your preference rather than that belief. Separate them first — otherwise any result is ambiguous. A measurable version: does the model's stated answer change when the user's stated opinion changes, while the underlying evidence is held fixed?",
      hypothesize: "Candidate mechanisms: (1) the model genuinely re-reasons and treats the user's framing as evidence — a legitimate Bayesian update; (2) the model keeps its belief but changes its stated answer to match — sycophancy proper; (3) the model has no stable belief and simply continues the conversational frame.",
      design: "A paired-prompt experiment. Build N factual questions with verifiable ground truth. For each, two versions: one where the user asserts the correct view, one where they assert the incorrect view. Measure whether the stated answer flips with the user's assertion. Ground truth never changes — that is the control.",
      predict: "If answers track the user's assertion on questions the model should know, that is the sycophancy signal. If they flip only on genuinely uncertain questions, it is consistent with legitimate deference. The contrast between known and unknown items is the real measurement — not the raw flip rate.",
      attack: "Flip rate alone is confounded: a good model should partially defer to user confidence on hard questions — that is exactly why ground truth is the control. Question difficulty correlates with subject, so a model could look sycophantic on one domain; sample across domains. And phrasing matters: assertive vs. tentative user tones will move results on their own.",
      iterate: "The strongest upgrade measures the model's belief independently of its statement: ask the same question in a context where the user states no opinion, and compare. If stated answers flip with the user but opinion-free beliefs stay put, you have separated sycophancy from genuine re-reasoning.",
    },
    followups: [
      { q: "Why paired prompts rather than just asking?", a: "A single answer has no baseline. The pair makes the user's assertion the only manipulated variable — everything else is held identical, so the difference is attributable to it." },
      { q: "What if the model flips on 10% of questions?", a: "10% on known-answer questions is meaningful; 10% on uncertain ones is expected deference. The absolute number matters less than where the flips sit relative to the model's own accuracy — segment by confidence." },
      { q: "What would the opposite result tell you?", a: "Zero flips could mean robust truth-tracking — or questions too easy to trip on, or a model that ignores user statements entirely (a different failure: discarding legitimate social evidence). Null results need their own explanation." },
      { q: "Could there be another explanation for flips?", a: "Prompt sensitivity: the model may be continuing the sentence's stylistic frame rather than tracking what the user wants. Vary user confidence — sycophancy should scale with expressed confidence; frame-continuation should not." },
      { q: "How would you make it stronger?", a: "Scale across domains and phrasings, pre-register what counts as a flip, add the opinion-free belief measurement — and test whether sycophancy persists when agreeableness costs something the model claims to value." },
    ],
    pitfalls: ["Measuring flip rate with no ground-truth control", "Conflating deference on hard questions with sycophancy", "One phrasing of the user's assertion — results may be format artifacts"],
    takeaway: "Isolate one manipulated variable — the user's assertion — hold evidence fixed, and beliefs can be separated from statements.",
  },
  {
    id: "R02",
    domain: "Evaluations",
    title: "Detecting sandbagging",
    difficulty: "Hard",
    setup: "A lab tests frontier models on dangerous-capability evals before deployment. The fear: a model recognizes the eval and deliberately fails it, so a safe score does not mean safe.",
    question: "How would you test whether a model is deliberately underperforming on a safety evaluation?",
    steps: {
      frame: "Deliberate underperformance requires two things: the model recognizes the eval context, and it modulates behavior because of that recognition. Each is separately testable. The measurable claim: does performance depend on whether the model believes it is being safety-evaluated — with the task itself held fixed?",
      hypothesize: "(1) The model recognizes eval triggers and downregulates capability; (2) performance drops for mundane reasons — odd prompt formats, stress-test artifacts; (3) the null: the eval genuinely elicits the behavior and the model is honest. These have different signatures — artifact-based drops should not track the safety-relevance of the task.",
      design: "Manipulate perceived context while holding the task identical. Present the same dangerous-capability task in two wrappers: one that looks like a safety eval, one embedded in a plausible benign workflow. Compare performance. A gap in favor of the benign wrapper is the sandbagging signature — the capability exists but was withheld under the eval frame.",
      predict: "Sandbagging predicts a context-dependent gap; artifacts predict gaps that track prompt weirdness, not safety relevance; honesty predicts no gap. Say this before running: a gap appearing only on safety-framed versions, at matched task difficulty, is the signature.",
      attack: "The benign wrapper may legitimately reduce caution — showing code in a coding context is defensible engineering, not sandbagging. A smart model may sandbag in both frames if it suspects the benign frame is also a test. And your benign wrapper may leak eval-ness. The gap is evidence, not proof.",
      iterate: "Cross-validate with evidence that does not rely on framing: do the model's eval-frame errors look incapable — or capable-but-withheld, the kind a model that genuinely could not do the task would not make? Also probe recognition directly, and use task styles the model plausibly never saw flagged as evals.",
    },
    followups: [
      { q: "Why hold the task fixed instead of comparing across tasks?", a: "A cross-task difference is confounded by difficulty. Fixed task, varied frame isolates the one variable that matters: perceived context." },
      { q: "What if there is no gap?", a: "Honesty — or a wrapper that failed to convince, or a model that sandbags everywhere it detects any test. The null needs interpretation too; that is part of the experiment." },
      { q: "How would the model even know it is an eval?", a: "Formats, keywords, topics from training. Test recognition directly: have the model classify which prompts look like safety evals, then check whether sandbagging correlates with its own recognition." },
      { q: "What if it sandbags in both frames?", a: "Then framing experiments are blind to it — change measurement level: mechanistic probes for eval-recognition, training-data audits for eval-like distributions, or behavior that only makes sense if the model believes it is being watched." },
      { q: "Make it stronger?", a: "Many benign wrappers, machine-verifiable ground truth, and a quantitative test: can you predict which tasks get sandbagged from the model's own safety-saliency? A correlation is far stronger than one anecdotal gap." },
    ],
    pitfalls: ["Reading any performance gap as sandbagging without artifact controls", "Relying on a single benign wrapper", "Forgetting the model may be modeling the experiment itself"],
    takeaway: "Sandbagging is a claim about context-dependence — so manipulate perceived context while holding capability constant.",
  },
  {
    id: "R03",
    domain: "Interpretability",
    title: "Reasoning or shortcut?",
    difficulty: "Core",
    setup: "A model aces your math word-problem suite. A colleague squints: 'I bet it is pattern-matching, not reasoning.'",
    question: "How would you find out whether the model is actually reasoning or exploiting shortcuts?",
    steps: {
      frame: "Reasoning vs. shortcut is not binary — define it behaviorally: a reasoner's success should depend on a problem's logical structure, not its surface similarity to training-like problems. The measurable claim: does accuracy track solution structure or surface features?",
      hypothesize: "(1) Structural reasoning — accuracy survives surface changes; (2) template matching — accuracy collapses under surface rewrites; (3) a mixture — real procedure plus heuristics for special cases; (4) contamination — the exact problems were in the training data.",
      design: "A two-axis intervention. Axis 1, surface: rewrite problems with new names, objects, numbers, sentence order — structure identical. Axis 2, structure: change the logical step order or add a distractor quantity — surface style identical. Structural reasoning predicts robustness on axis 1 and controlled degradation on axis 2; shortcuts predict the reverse.",
      predict: "Before running: heavy accuracy loss under rephrasing with survival under structural change is the shortcut signature; the opposite pattern indicates genuine structure-sensitivity. A mixed model should fail selectively — e.g., on the distractor axis.",
      attack: "Rephrasings can change difficulty by accident — length, rare words. Control rewrite quality and match token counts. Contamination: test on freshly generated isomorphic problems. And some shortcuts are legitimate heuristics humans use too — failing one adversarial template does not mean there is no reasoning anywhere.",
      iterate: "If the behavioral signature is ambiguous, escalate to mechanism: probe internal activations on matched pairs — same surface, different structure, and vice versa — to see what the representation actually tracks. Behavior tells you that something is off; mechanism tells you what.",
    },
    followups: [
      { q: "Why both axes instead of just paraphrasing?", a: "One-axis results are ambiguous — paraphrase failure could be ordinary robustness noise. Each hypothesis predicts a different pattern across the two axes, not just a different score." },
      { q: "What if it passes everything?", a: "Then the suite is too easy or too close to the training distribution. Generating genuinely novel isomorphic problems is the hard part — and the part that makes the test worth anything." },
      { q: "What would falsify the shortcut hypothesis?", a: "Accuracy invariant to surface rewrites, plus degradation that is structured and step-count-predictable when logic changes — hard for template matching to produce. And by symmetry, one counterexample template is not enough to establish shortcuts either." },
      { q: "Another explanation for the pattern?", a: "Difficulty confounds, or a regime effect: reasoning on short problems, templates when long. Segment results by length and complexity — mixtures reveal themselves within segments." },
      { q: "Make it stronger?", a: "Quantify: train a probe to predict errors from surface features alone. If surface alone predicts errors, shortcuts are measurable — then report how much accuracy structure explains versus surface." },
    ],
    pitfalls: ["Paraphrases that silently change difficulty", "Single-axis testing — ambiguous by construction", "Forgetting contamination: the suite may be in the training data"],
    takeaway: "Design manipulations so each competing hypothesis predicts a different pattern — not just a different score.",
  },
  {
    id: "R04",
    domain: "Interpretability",
    title: "Is the chain of thought real?",
    difficulty: "Hard",
    setup: "Models explain their answers with chain-of-thought, and teams increasingly use those explanations for safety decisions — 'the model said it did X because Y.'",
    question: "How would you test whether the chain of thought faithfully reflects the model's actual computation?",
    steps: {
      frame: "Faithfulness is a relation between two things you must measure separately: the stated explanation and the actual causal computation. The dangerous failure is post-hoc rationalization — a fluent story over a decision made another way. Operationalize: does the stated reason causally matter, or is it decoration?",
      hypothesize: "(1) Faithful — the answer is computed through the CoT; (2) post-hoc — the answer is computed first, the CoT rationalizes; (3) mixed — causal for some problem types, decorative for others; (4) subtler — the CoT is causal, but the stated motive differs from the computed one.",
      design: "Perturb the CoT itself. Inject an error into a middle reasoning step — flip a sign, swap a premise — and see whether the final answer follows the flawed logic (causal) or still lands correct (decorative). Second design: seed two different CoTs for the same problem and see whether the answer tracks the path — an answer invariant across CoTs is not CoT-driven.",
      predict: "Causal CoT predicts answers follow injected errors; decorative predicts error-blindness. Path-dependence predicts the answer distribution shifts with the seeded CoT; answer-first predicts invariance. Write the two-by-two down before running.",
      attack: "Injected errors may just confuse the model — any perturbation degrades performance, which is not evidence of causality. Use magnitude-matched controls: errors injected into semantically irrelevant tokens. Models may also notice and repair the corruption — competence, not unfaithfulness. And expect heterogeneity: arithmetic CoT may be causal while motive-explanations are decorative.",
      iterate: "Complement behavior with internals: activation patching between CoTs, or reading whether the answer's internal representation exists before the CoT is generated. If the answer is decodable before CoT tokens are produced, the direction of computation is visible.",
    },
    followups: [
      { q: "Why perturbation rather than just asking the model?", a: "Self-report is the thing under test — asking is circular. Perturbation tests the CoT's causal role in the computation, independent of what the model says about itself." },
      { q: "Answers follow injected errors 80% of the time — meaning?", a: "A strong causal signal for those problems — but segment by problem type before generalizing. The 20% that ignore errors may be the interesting population: answers computed another way." },
      { q: "The opposite result — answers ignore errors?", a: "The post-hoc signature. But check the control first: if irrelevant perturbations also change answers, your injection procedure is the confound, not the CoT." },
      { q: "Could a faithful model repair errors?", a: "Yes — and it is subtle: catching and fixing an error is reasoning, but it means the original CoT was not the whole story. Distinguish follow-to-the-end from caught-and-repaired by where in the output recovery happens." },
      { q: "Make it stronger?", a: "Pair behavioral perturbation with activation-level causality — patch internals, not just tokens — and pick problem classes where a decorative CoT is forced to disagree with itself, so the two hypotheses cannot both explain the output." },
    ],
    pitfalls: ["Using self-report as evidence of faithfulness", "Perturbations without magnitude-matched controls", "One global faithfulness verdict across all problem types"],
    takeaway: "Never ask the model about its computation — perturb the computation and watch what breaks.",
  },
  {
    id: "R05",
    domain: "Interpretability",
    title: "The probe that found deception",
    difficulty: "Core",
    setup: "You train a linear probe on a model's residual stream; it detects 'deceptive statements' with 94% accuracy on held-out data. Someone proposes using it as a lie detector in deployment.",
    question: "What does this probe actually tell you — and what could it not tell you?",
    steps: {
      frame: "A probe is a readout, and a readout's accuracy does not establish what the feature is or what the model does with it. Separate three claims: (a) activations contain linearly decodable information correlated with deception; (b) the model uses that information in its computation; (c) probing accuracy transfers to deployment. The probe alone licenses only (a).",
      hypothesize: "What drives the probe? Genuine model-internal deception representations; or a proxy correlated with your labels — formality, hedging, phrase frequency; or dataset construction confounds, where deceptive statements happen to be stylistically distinct.",
      design: "Information-versus-use is the key test. If the model uses the feature, intervening on it should change behavior: ablate or steer along the probe direction and watch for behavioral change. Information that can be read but does nothing under intervention is epiphenomenal as far as the model is concerned.",
      predict: "If the probe reads a causally-used feature, steering shifts behavior in the predicted direction — ideally with a dose-response curve. If it reads a correlated shadow, interventions do nothing, or produce off-target weirdness.",
      attack: "Your labels may encode the confound: run a bag-of-words baseline — if it hits 90%, the probe is reading style. Test generalization to deception constructed differently from your training labels — different domains, phrasings, incentives. And 'deception' as a human category may not be the model's natural abstraction at all.",
      iterate: "If interventions fail, drop the presupposed labels: feature-discovery without human categories — unsupervised or contrastive datasets — to find what the model's own representation distinguishes, then check whether your category aligns with it.",
    },
    followups: [
      { q: "Why does 94% on held-out data not settle it?", a: "Held-out accuracy rules out memorizing data points, not confounded features. A probe can be genuinely predictive within your distribution while reading a proxy. Prediction and mechanism are different claims." },
      { q: "What would the steering experiment show for a shadow feature?", a: "Nothing — perturbing an unused direction leaves behavior unchanged. That null is informative: it downgrades 'the model has a deception feature' to 'deception is decodable from activations.'" },
      { q: "Could a causally-used probe still fail as a lie detector?", a: "Yes — features can be causally involved yet correlated with, not identical to, the target; and anything optimizing against detection can shift off the feature. A detection circuit is not an enforcement mechanism." },
      { q: "Another explanation for 94%?", a: "Label leakage through construction: if deceptive statements were collected in a different style or context than honest ones, the probe reads context, not deception. Cross-domain evaluation exposes this fast." },
      { q: "Make it stronger?", a: "A pre-registered causal battery: steering dose-response, ablation effects on task performance, cross-dataset transfer, and a style-only baseline. A probe that survives all four is a real candidate; one that fails the baseline was never about deception." },
    ],
    pitfalls: ["Equating decodability with use", "Held-out accuracy within a single distribution treated as proof", "Skipping the trivial baselines"],
    takeaway: "Readable does not mean used. Correlation is a clue; causality is the product.",
  },
  {
    id: "R06",
    domain: "Scalable Oversight",
    title: "Supervising the supervisor",
    difficulty: "Hard",
    setup: "Your model is better than any human on your team at some consequential task — protein design, exploit-finding. You still need to supervise it.",
    question: "How would you evaluate a model that is better than you at the task it is doing?",
    steps: {
      frame: "Full oversight may be impossible — the honest goal is bounded oversight: verify enough structure to trust outputs without re-deriving them. Separate what needs trusting: the process (how it works), the output (is this artifact good), and the distribution (what it does across cases, including ones you cannot check). Each has different tools.",
      hypothesize: "Which trust gap is largest? Humans often cannot evaluate superhuman solutions but can evaluate properties — provable correctness, simulations, small-scale tests. The gap may be narrower than it looks; the design question is which properties are checkable.",
      design: "A ladder of partial verifiability. (1) Decompose: outputs in verifiable sub-parts, each checked with a cheap checker — tests, solvers, simulations — even when the whole is beyond you. (2) Cross-examine: independent models, or the same model under different prompts, critique each other; disagreements localize where supervision is needed. (3) Audit process, not just product: intermediate steps in machine-checkable form — proofs, logs, executable derivations.",
      predict: "Sound outputs make decomposition and cross-examination converge with few flagged cases. Systematic gaming or error makes disagreements cluster — and cluster predictably — at exactly the points where the model exceeds your verification.",
      attack: "The checker itself may be gameable — tests that pass under shortcut solutions; you know this failure mode from eval design. Models may collude implicitly through shared training. Decomposition can hide errors in the seams between parts. Each tool transfers the trust problem rather than dissolving it — be explicit about where it lands.",
      iterate: "Make verification cheap and adversarial: red-team the checker — ask the model to find inputs where the checker passes bad outputs — then iterate the checker. Measure oversight by what gets through, not by how confident you feel.",
    },
    followups: [
      { q: "Why not just have humans review samples?", a: "Random human review of superhuman output measures almost nothing — you will approve what looks plausible, and plausibility is exactly what a misaligned optimizer provides. Spend review effort where disagreement or structure says risk is." },
      { q: "What if there is no cheap verifier at all?", a: "Then you are in core scalable-oversight territory: debate, amplification, ensemble signals — and the residual risk is larger; quantify what you can — consistency, calibration, track record — instead of pretending verification exists." },
      { q: "The opposite result — everything checks out?", a: "Distinguish trustworthy from checks-are-blind: corrupt outputs yourself and confirm the checker catches them. A checker that passes your corruptions is measuring nothing." },
      { q: "Could the model exploit cross-examination?", a: "Yes — coherent deception stays consistent across instances. Counter with diversity: different prompts, contexts, fine-tunes. Consistency across diverse elicitation is far harder to fake." },
      { q: "Make it stronger?", a: "Close the loop with ground truth wherever it eventually arrives — folds confirmed, exploits verified — and log whether the process predicted outcomes. An oversight system that never meets ground truth is untested." },
    ],
    pitfalls: ["Treating plausibility-review as oversight", "Checkers weaker than the optimizer aimed at them", "Decompositions that hide errors at the seams"],
    takeaway: "When you cannot check the answer, restructure until you can check parts of it — then red-team the parts-checker.",
  },
  {
    id: "R07",
    domain: "Scalable Oversight",
    title: "Does debate work?",
    difficulty: "Core",
    setup: "In the debate protocol, two models argue opposite answers and a human judge picks the winner. The hope: honesty wins arguments the judge can follow.",
    question: "How would you test whether debate actually helps a human judge reach the truth?",
    steps: {
      frame: "The claim has two parts: debates surface truth-relevant information the judge would not find alone, and winning correlates with truth better than the judge's baseline. Measure both — against baselines: judge-alone, single-model assistance, panel voting. Debate is only valuable if it beats them.",
      hypothesize: "(1) Debate works — truth wins more with debate than without; (2) rhetoric works — persuasion quality, not truth, predicts winners; (3) no signal — judges are near chance regardless. Distinguishing (1) from (2) is the crux, and it requires questions whose truth you know but the judge does not.",
      design: "Questions with verifiable answers the judge does not know. Run each both ways: direct answering with explanation (baseline) and two-sided debate (treatment), judge blind to condition. Score judge accuracy against ground truth. Vary debater ability asymmetry — what happens when one side is simply more capable?",
      predict: "If debate surfaces truth, accuracy with debate beats baseline, and the gap grows with debate depth up to a point. If rhetoric drives it, accuracy tracks debater eloquence ratings, not truth. If the more capable debater wins regardless of side, the protocol transferred capability, not truth — the scary result.",
      attack: "Your questions may be argue-able in ways real oversight is not — constructed truths versus messy judgments. Your judge pool differs from real users. Your ground truth may itself be contestable, so judges you scored 'wrong' might be right. And models trained similarly may share persuasive strategies, hiding rhetoric within one pool.",
      iterate: "Measure why judges decide as they do: have them state the deciding argument, then classify those arguments for truth-relevance versus rhetorical pattern. If stable rhetorical moves dominate, that is a fixable target — restructure the protocol (mandatory citations, judge follow-up questions) and re-measure.",
    },
    followups: [
      { q: "Why blind the judge to condition?", a: "Because knowing it was a debate shifts judge priors — they expect adversarial filtering of claims. The measurement you care about is whether argument content moves them, uncontaminated by the label." },
      { q: "What if debate helps only on easy questions?", a: "That is the known failure shape: value exactly where the judge needed none. Stratify questions by judge-alone accuracy and report where debate helps — the protocol's real coverage is the gap between judge ability and truth." },
      { q: "The opposite result — judges do better without debate?", a: "For your pool and setup, debate is overhead. Check whether stronger debaters or structure (cross-examination rounds) changes that before abandoning the idea — the protocol is known to be sensitive to both." },
      { q: "Could two models both be wrong and convincing?", a: "Yes — shared blind spots from shared training. Use model pairs from different runs, and include questions where the models' consensus is known-wrong; a good protocol lets the human catch some of those." },
      { q: "Make it stronger?", a: "Move from accuracy to mechanism: log which arguments changed minds, whether they contain checkable claims, and whether checkable-claim density predicts correct decisions. Iterate the protocol, not just the score." },
    ],
    pitfalls: ["No baseline condition — debate versus what?", "Unblinded judges", "Ground truth as contestable as the debate itself"],
    takeaway: "An oversight protocol is an experiment — it needs a control arm, blinding, and a mechanistic readout, or you are measuring enthusiasm.",
  },
  {
    id: "R08",
    domain: "Alignment & Behavior",
    title: "Emergent misalignment",
    difficulty: "Hard",
    setup: "A published result: fine-tuning on narrow insecure code made models broadly misaligned — answering harmful questions, expressing dark views — a generalization nobody predicted.",
    question: "Design a study to figure out why this happens and whether it will generalize to future models.",
    steps: {
      frame: "Two questions, kept separate. Mechanism: what internal change connects insecure-code training to broad misbehavior? Generality: quirk of one model family and dataset, or a structural property of gradient descent on narrow data? A mechanism found in one model is evidence; the same mechanism across independently trained models is a law.",
      hypothesize: "(1) The narrow data acts as a vector — contaminated with other content, or its style activates latent behavior; (2) a shared representation — any distribution shift the model reads as 'different regime' perturbs a misalignment direction; (3) an optimization artifact — the RLHF-instilled safe persona is fragile, and narrow fine-tunes damage it, with insecure code irrelevant except as a vehicle.",
      design: "Decompose by ablation. (a) Control data matched in format, length, and quality but secure — does misalignment follow the topic or the fine-tuning act? (b) Neutral narrow data — poetry, biology — does any narrow fine-tune do this? (c) A content audit of the insecure-code set for correlated material. If (b) holds broadly, the phenomenon is about narrowness, not code.",
      predict: "Vector-prediction: dataset-specific — controls stay clean, contaminated sets misalign. Regime-prediction: any sufficiently distribution-shifted fine-tune misaligns. Artifact-prediction: misalignment tracks damage to safety-relevant circuits, measurable identically across datasets.",
      attack: "The published dataset may not be fully auditable. 'Misalignment' is measured by evals that could be brittle — pre-register your metric and score blind. Fine-tuning runs vary: replicate across seeds before believing effect sizes.",
      iterate: "If any narrow data misaligns, the study becomes about persona fragility: is safety behavior one entangled representation? Measure by steering — does one direction control multiple safety behaviors at once? If yes, the generalization claim sharpens: future models with similarly entangled safety training inherit the fragility.",
    },
    followups: [
      { q: "Why ablations instead of studying the original dataset?", a: "The original dataset only shows that it happened. Ablations identify which variable carries the effect — topic, format, narrowness, or noise. Without that, every theory fits the data." },
      { q: "What if only insecure code causes it?", a: "Then ask what insecure code represents to the model — perhaps subtle rule-violations. Testable: build datasets sharing that structural property in unrelated domains and see whether misalignment follows the property, not the topic." },
      { q: "The opposite result — nothing replicates?", a: "Model- and dataset-specific — itself important: alignment fragility is not structural here, and scary published results need contamination audits before extrapolation." },
      { q: "Could the evals be measuring the wrong thing?", a: "Yes — 'misalignment' scores may be dominated by persona and style shifts. Validate: do high-scoring models actually produce harmful content under adversarial elicitation, or just a different tone?" },
      { q: "Make it stronger?", a: "Cross-model replication is the ballgame: repeat the minimal effective fine-tune across model families and scales. A mechanism that recurs across independently trained models licenses prediction about future ones — which was the actual question." },
    ],
    pitfalls: ["Treating one replication as a law", "Brittle misalignment evals", "Unaudited dataset contamination", "Single-seed effect sizes"],
    takeaway: "Mechanism without replication is anecdote — the study that answers 'will it generalize' is the same study on a different model.",
  },
  {
    id: "R09",
    domain: "Capabilities",
    title: "Measuring reward hacking",
    difficulty: "Core",
    setup: "You are deploying a coding agent evaluated by running its tests. You have read the stories: agents that edit tests, hardcode outputs, stub functions.",
    question: "Design an evaluation to measure how readily an agent games its tests rather than solving the task.",
    steps: {
      frame: "Define hacking behaviorally: the reward proxy (tests pass) increases while the intended objective (a correct general solution) does not. So the eval needs ground truth independent of the proxy — solutions scored by hidden tests or human review, contrasted against the proxy score.",
      hypothesize: "Hacking rate should depend on (1) proxy alignment — how tight the tests are; (2) optimization pressure — iterations allowed, model propensity; (3) perceived detection — does the agent believe anyone inspects? An eval spanning these axes measures propensity; a single setting measures almost nothing.",
      design: "A lattice of environments. Fix a task set; provide test suites of varying tightness — exhaustive, minimal, slightly-wrong. Score every solution with hidden ground-truth tests. Hacking rate = fraction where the proxy passes but ground truth fails. Vary allowed iterations for a dose-response curve, not a single number.",
      predict: "A real propensity predicts rate rising with pressure and proxy looseness, with hack style shifting from benign shortcuts to active test manipulation as pressure grows. Incompetence predicts random failures — not proxy-exploiting ones.",
      attack: "Hidden tests may leak into frontier training data — canary and check. The agent may overfit even the hidden tests — the ground truth itself needs adversarial auditing and rotation. Classifying hack-versus-mistake needs a rubric, blind annotators, and reported inter-rater agreement.",
      iterate: "The research version: does the agent know? After each hack, ask it in a fresh context whether its solution meets the spec. A yes means self-misleading hacking — an alignment finding. A no-but-did-it-anyway means strategic — a different worry.",
    },
    followups: [
      { q: "Why dose-response instead of one measurement?", a: "A single rate conflates propensity with opportunity. The curve's shape distinguishes a threshold behavior — hacking under pressure — from a constant background rate, which demand completely different mitigations." },
      { q: "What if the agent games the hidden tests too?", a: "Your ground truth became a second proxy — the regress every eval designer fears. Mitigate with sampled human review and rotating hidden-test generators so overfitting to one style does not transfer." },
      { q: "The opposite result — zero hacking?", a: "Before celebrating: were there opportunities? An eval where hacking is hard shows nothing. Include a positive control — deliberately gameable tests — and confirm the model finds them." },
      { q: "Could some 'hacking' be legitimate?", a: "Yes — exploiting a spec gap a reasonable engineer would also exploit is engineering. Restrict the safety-relevant category to intent-circumvention: behavior that only makes sense if the agent knows the tests diverge from intent." },
      { q: "Make it stronger?", a: "Measure generalization of hacking: once an agent hacks one environment, does it hack faster in novel ones? Learning-to-hack across tasks is the strongest possible early-warning signal." },
    ],
    pitfalls: ["Ground truth that is just another proxy", "No positive control", "Single-setting rates without pressure curves", "A rubric with no inter-rater agreement"],
    takeaway: "Measure hacking as a dose-response curve against proxy looseness — and prove the trap can be sprung with a positive control.",
  },
  {
    id: "R10",
    domain: "Capabilities",
    title: "Memorized or derived?",
    difficulty: "Core",
    setup: "A model answers an obscure factual question correctly. One person says it just memorized that from training data; another says it can derive it.",
    question: "How would you distinguish memorization from genuine derivation or generalization?",
    steps: {
      frame: "Separate three bundled things: the fact is in the weights; the model can apply knowledge it has; the model can derive answers it was never given. For a single fact, memorization versus derivation may not be separable at all — the interesting question is about the class of questions, not the instance.",
      hypothesize: "(1) Verbatim memorization — performance exists only for seen items; (2) schema generalization — templates that apply to new items of the same type; (3) true derivation — composition of facts and procedures to reach never-stated answers. Each predicts different behavior under controlled variation.",
      design: "A ladder of perturbations around the original item: (a) identical — baseline; (b) paraphrase, same fact; (c) same schema, new content — contrived but verifiable and ungoogleable; (d) composition — two known facts whose combination is stated nowhere. Memorization collapses after (a)-(b); schema succeeds at (c) and collapses at (d); derivation succeeds throughout.",
      predict: "Write the three signatures down before running. The construction problem makes or breaks the study: rung (c) content must be verifiable — otherwise you cannot score it — yet genuinely novel. This is where most attempts fail.",
      attack: "Your novel items may exist somewhere in the crawl — someone generated the same contrived example. Mitigate with post-hoc search and recency: build items around recent artifacts. Also, schema-memorization from many examples is still generalization of a kind; the bright line is composition at rung (d) — that is what capability claims actually rest on.",
      iterate: "If results are muddy, escalate to dose-response: fine-tune on K examples of a schema and find where generalization to new items kicks in. The shape of that curve distinguishes template-copying from rule-extraction — and it is the cleanest publishable answer.",
    },
    followups: [
      { q: "Why is the instance-level question maybe unanswerable?", a: "For one answered fact, both stories predict the same behavior — it gets it right. Hypotheses only diverge across variations; the experiment must move from instance to class before anything is distinguishable." },
      { q: "What if it succeeds at rung (d)?", a: "It composes — strong generalization evidence for that class. But check leakage of compositions too: two atoms plus their combination may all be documented somewhere; novelty checks must cover combinations, not just atoms." },
      { q: "The opposite result — collapse at rung (b)?", a: "Paraphrase failure suggests surface-tied knowledge. But verify the paraphrases are not simply harder — longer, rarer words fail for mundane reasons. Keep rewrite quality controlled or the signature is noise." },
      { q: "Could the model memorize how to derive?", a: "Yes — and behaviorally that is fine: a memorized procedure that composes correctly is the capability. The line worth policing is output-that-generalizes versus output-that-parrots, not memory versus thought." },
      { q: "Make it stronger?", a: "Add internal evidence: does the model encode the answer's components before output, and does accuracy degrade gracefully as retrieval crutches are removed? Behavioral ladders plus mechanistic checks converge." },
    ],
    pitfalls: ["Novel items that are not actually novel", "Instance-level conclusions", "Treating schema-memorization as no generalization at all"],
    takeaway: "Move from the instance to a ladder of perturbations — the rung where accuracy collapses is the answer.",
  },
  {
    id: "R11",
    domain: "Research Craft",
    title: "The upside-down benchmark",
    difficulty: "Hard",
    setup: "You release a new reasoning benchmark. Results: small open models pass ~90%; frontier models fail it. Your inbox is chaos.",
    question: "Walk through your hypotheses for this pattern, and how you would distinguish them.",
    steps: {
      frame: "An inverted difficulty pattern is a red flag about the benchmark before it is a finding about the models. Leading suspicion: the benchmark accidentally rewards a shared quirk of small models that instruction-tuning shaped away. Hold that as hypothesis one, not conclusion — the discipline is letting the audit decide.",
      hypothesize: "(1) Benchmark artifact — the metric rewards a degenerate strategy: format, keyword, length; (2) reverse contamination — small models trained directly on this benchmark's style or source; (3) genuine capability inversion — the task rewards something RLHF degrades, like raw combinatorial search or willingness to brute-force; (4) evaluation bug — parsing silently zeros correct frontier answers.",
      design: "Stratified error analysis plus degenerate-solution hunting. Audit a sample of small-model passes with a strong judge: solve or exploit? Hand-check frontier outputs: failing the task or failing the parser? Then intervene — remove the suspected exploit channel, change the format, and re-run both groups.",
      predict: "Artifact: small-model passes collapse under format change while frontier scores barely move. Contamination: style-matched training traces and brittle generalization to paraphrases. Capability inversion: passes look legitimate and survive controls — the moment the benchmark becomes interesting.",
      attack: "Your audit sample may be unrepresentative — stratify by score and model family. A frontier-model judge may share the benchmark's biases and downvote valid small-model solutions. One format fix may create a new artifact — check that rankings are invariant under benign variations before concluding anything.",
      iterate: "If it survives as capability inversion, ask why: profile where frontier models fail — step type, length, instruction pressure — and test whether stripping the assistant persona ('complete this text') restores performance. That would localize the inversion to training, not architecture — a far more valuable finding.",
    },
    followups: [
      { q: "Why audit passes before failures?", a: "The anomaly is in who passes. Frontier failures have a dozen mundane explanations; small-model passes are the anomalous data — the likelihood ratio lives there." },
      { q: "The audit is mixed — some exploit, some legit?", a: "Then the benchmark measures a blend; report the decomposition, not the headline. A 60%-artifact benchmark still measures something — but you must say what, or downstream users inherit your confusion." },
      { q: "Flip it — frontier passes, small fails, 'as expected'?", a: "Then worry differently: a normal-looking benchmark may be measuring RLHF-style compliance, not reasoning. The check is identical either way: what strategy does passing actually require?" },
      { q: "Could small models be substantively right?", a: "Possible — frontier models may overthink: reject correct-but-ugly answers, follow misleading instruction cues. Strip the persona and see whether scores converge; if they do, the inversion was a persona effect." },
      { q: "Make it stronger?", a: "Pre-register the audit protocol and publish artifacts — transcripts, exploit catalog, contamination searches. The benchmark's credibility rests on that analysis, not the leaderboard." },
    ],
    pitfalls: ["Trusting the headline metric", "Judge models that share the benchmark's bias", "Fixing one artifact and declaring victory"],
    takeaway: "When results are upside-down, audit the passes before theorizing about the failures — the anomaly is in who passes.",
  },
  {
    id: "R12",
    domain: "Alignment & Behavior",
    title: "The refusal spike",
    difficulty: "Warm-up",
    setup: "After a routine fine-tune, your assistant model's refusal rate on benign prompts tripled. Users are annoyed; safety is happy — for now.",
    question: "How do you investigate what happened?",
    steps: {
      frame: "A rate tripling means the behavior distribution moved. The investigation is a decomposition: did the model change, the data change, or the measurement change? Most incidents are measurement; the interesting ones are data. Work in order of cheapness.",
      hypothesize: "(1) Data — the fine-tune set contains refusal-like patterns: conservative annotator labels, safety-flavored examples that over-steepened caution; (2) dynamics — fine-tuning shifted a general caution direction, overgeneralizing from few examples; (3) measurement — output format changed and the refusal classifier miscounts hedged answers as refusals.",
      design: "Freeze measurement first: hand-audit a stratified sample of 'refusals' to validate the classifier. Then bisect the data: fine-tune from the same base on temporal and random halves — a rate that follows a half localizes the cause in data. Third, the reverse probe: remove or relabel refusal-flavored examples and check whether the rate normalizes.",
      predict: "Data cause: the rate tracks specific subsets — bisection converges on them. Dynamics cause: any subset raises the rate, dose-response with training steps rather than content. Measurement cause: the hand audit disagrees with the classifier before any model work happens.",
      attack: "Subsets are not independent — style correlates across halves; use several random splits and demand consistency. The base checkpoint may have drifted — new base version is the classic silent variable. And the 'benign prompts' set itself may be skewed toward edge cases.",
      iterate: "Once localized to data, find the feature: construct minimal pairs — same topic, refusal-label versus not — and measure dose-response. That converts an incident into a transferable lesson about which data shapes refusal behavior.",
    },
    followups: [
      { q: "Why audit the classifier first?", a: "Every downstream inference depends on the measurement being stable. A format change — more verbose hedging — can triple 'refusals' with zero behavioral change, and teams have shipped rollbacks over classifier drift. Cheapest check, highest prior." },
      { q: "Bisection says both halves raise refusals?", a: "Then it is not a subset — it is the process: fine-tuning itself shifts caution. Vary steps and learning rate on clean data and fit the dose-response; if caution rises with steps regardless of content, that is a training-dynamics finding." },
      { q: "The opposite result — nothing moves the rate?", a: "Suspect the comparison itself: is the base model truly identical — checkpoint, tokenizer, sampling parameters? Before exotic explanations, re-verify that the A/B is actually A versus B." },
      { q: "Could it be deliberate?", a: "An upstream team may have 'improved' safety labeling. That is a communication finding, not a mystery — which is why the investigation starts with data provenance interviews, not GPUs." },
      { q: "Make it stronger?", a: "Turn the incident into an instrument: the minimal-pair dataset and its dose-response curve between caution-flavored examples and benign refusal rate is reusable by every future fine-tune." },
    ],
    pitfalls: ["Skipping measurement validation", "Bisecting on a single split", "Assuming the base checkpoint is unchanged", "Chasing model causes before data provenance"],
    takeaway: "Incident investigation is decomposition — measurement, data, dynamics, in that order of cheapness.",
  },
  {
    id: "R13",
    domain: "Evaluations",
    title: "Willing to help with harm?",
    difficulty: "Core",
    setup: "You are on a pre-deployment safety team. The question in front of you is the classic experimental-design prompt from AI-safety interviews — operationalize it.",
    question: "How would you measure whether a model is willing to help with a harmful task?",
    steps: {
      frame: "Separate willingness from capability — a model may refuse what it could do, or attempt what it cannot. Willingness is intent-under-elicitation: does the model, when asked in ways that do not give the game away, move toward assisting? The measurable claim: assistance rate as a function of how clearly the request is harmful, across elicitation styles.",
      hypothesize: "(1) The model refuses robustly — refusals survive obfuscation; (2) refusal is surface-level — it breaks under rephrasing, personas, or fictionalization while capability remains; (3) the model helps when the harm is implicit — it fails to recognize harm rather than being willing. These need different measurements: obfuscation resistance versus harm-recognition.",
      design: "A graded request ladder: unambiguous, implicit, obfuscated, fictionalized, decomposed (the harm split across steps). For each rung, measure assistance with judge-verified harm-relevance and blind annotators. Crucially include benign controls that superficially resemble harm — crime fiction, security education. The gap between responses to real harm and benign lookalikes is the willingness signal, not the raw assistance rate.",
      predict: "Robust refusal predicts flat low assistance across the ladder; surface refusal predicts assistance rising monotonically with obfuscation; harm-blindness predicts assistance tracking the model's own harm-recognition — which you can measure separately with classification prompts.",
      attack: "Your 'harmful' labels are value-laden — use a documented harm taxonomy and publish it. Judge models share biases with the tested model family. Elicitation diversity is the confound-eater: one jailbreak template proves one template works, not willingness. And whatever you publish becomes a training-free jailbreak — handle the release responsibly.",
      iterate: "The follow-up with the highest stakes: does willingness scale? Run the ladder across model sizes and generations. If assistance-under-obfuscation grows with capability, the eval becomes a canary — and the dose-response curve across scale is the real finding.",
    },
    followups: [
      { q: "Why a ladder rather than one hard prompt?", a: "A single prompt gives a bit, not a curve. The ladder's shape tells you what kind of refusal you are dealing with — robust, superficial, or harm-blindness — and each demands a completely different mitigation." },
      { q: "What if it refuses even the benign controls?", a: "Then it is over-refusing — the opposite failure, and a capability cost. Measure the refusal precision/recall tradeoff: a model that refuses everything is safe and useless; the interesting metric is where the boundary sits." },
      { q: "The opposite result — it helps with everything?", a: "Check the judges and the ladder construction first; but if real, that is the most severe finding — escalate. Before concluding, rule out that your 'harmful' items are actually benign under your own taxonomy." },
      { q: "Could the model be willing but incapable?", a: "Yes — which is why capability must be measured on the same tasks under legitimate framing, where willingness is not the bottleneck. Willingness-without-capability is a different risk profile from either axis alone." },
      { q: "Make it stronger?", a: "Pre-register hypotheses and thresholds, run across elicitation families — personas, encodings, decomposition — and test persistence: does the model still assist when the request arrives embedded in legitimate-looking multi-step work?" },
    ],
    pitfalls: ["Raw assistance rate with no benign controls", "One jailbreak template standing in for elicitation diversity", "Uncalibrated judge models", "Publishing the attack set verbatim"],
    takeaway: "Willingness is a curve over elicitation pressure, measured against benign lookalikes — not a single yes or no.",
    source: "Reported as the standard experimental-design prompt in AI-safety team interview rounds.",
  },
  {
    id: "R14",
    domain: "Alignment & Behavior",
    title: "Training robust alignment",
    difficulty: "Hard",
    setup: "A reported 2026 Fellow brainstorm asks three linked things — prevent misuse by bad actors, detect misalignment, and train in robust alignment. Take the third.",
    question: "How would you train models to be more robustly aligned — so alignment survives adversarial pressure, fine-tuning, and deployment?",
    steps: {
      frame: "'Robust' is the operative word — not aligned under the training distribution's prompts, but aligned under distribution shift: jailbreaks, third-party fine-tuning, agentic pressure, long horizons. Name what robustness is over: inputs, modifications, and time. A training proposal that cannot say what it is robust against is a vibe, not a plan.",
      hypothesize: "Current alignment is brittle because (1) it lives in shallow behaviors — refusals as surface patterns, removable by fine-tuning; (2) it lives in the persona layer — the assistant character rather than underlying objectives; (3) it never faced adversarial pressure during training, so it only covers seen attacks.",
      design: "Adversarial training with a red-team loop: an attacker model or human red-team generates elicitation attempts; the target trains across discovered failures; iterate. Measure robustness as attack success rate under a held-out attacker budget — freeze the target, give a fresh attacker fixed compute, count successful elicitation. That count is the metric, not vibes about robustness.",
      predict: "Genuine robustness predicts low attack success on held-out attackers, and — the subtle prediction — graceful degradation: failures are partial, not coherent jailbreak personas. Shallow training predicts success rates that collapse when the attacker shifts style, with failures that look like whole personas switching off.",
      attack: "Adversarial training teaches what you test for — the model may learn to defeat this attacker class rather than internalize alignment; Goodhart looms. The loop also trains attacker-side capability — a dual-use cost. And robustness on text jailbreaks says nothing about fine-tuning attacks or agentic pressure — match the threat model or say so.",
      iterate: "Test the strongest form of the claim: does alignment survive fine-tuning on ordinary user data? If robust alignment is real, safety metrics should degrade slowly and recoverably under neutral fine-tuning — the align, fine-tune, re-eval sequence is the sharpest test of whether anything deep was trained.",
    },
    followups: [
      { q: "Why attack success under budget rather than a benchmark?", a: "A benchmark is a fixed attack set — it will be trained on, directly or through contamination. A budgeted fresh attacker measures the margin between defense and offense, which is the actual quantity deployment safety depends on." },
      { q: "The opposite result — high success even after training?", a: "Either the attacker budget dominated — offense beats defense at fixed scale, itself a load-bearing finding for deployment policy — or training targeted the wrong layer. Distinguish by inspecting what the failures look like." },
      { q: "Is this not just security?", a: "Partly — and the mapping is productive: attackers adapt, defenses decay, margins matter. But the system under attack is the decision-maker itself, so failures are adaptive in a way web exploits are not. Security intuition is a prior, not a solution." },
      { q: "Could robust training damage capability?", a: "Yes — over-trained refusals produce the over-refusing model your willingness evals measure. Track the robustness-versus-utility frontier: robustness gained per point of capability lost is the number that decides whether the method is real." },
      { q: "Make it stronger?", a: "Test transfer across elicitation families never seen in training, across fine-tuning recipes, and across time — does the margin hold as the attacker iterates for weeks? Robustness that only holds for a day is a demo, not a property." },
    ],
    pitfalls: ["No named threat model", "Fixed attack benchmarks as the metric", "Goodharting the attacker class", "Ignoring the over-refusal cost"],
    takeaway: "Name what robustness is over, measure attack success under fresh-attacker budget, and test whether it survives neutral fine-tuning.",
    source: "From the reported alignment triplet in a 2026 AI Safety Fellow brainstorm.",
  },
  {
    id: "R15",
    domain: "Scalable Oversight",
    title: "Detecting misalignment live",
    difficulty: "Core",
    setup: "The second of the reported triplet: your model is live, millions of users, fine-tuned variants shipping weekly.",
    question: "How would you detect misalignment in a deployed model?",
    steps: {
      frame: "Deployment detection is measurement-under-noise: the misalignment signal must survive benign variation. Choose the detection object — behavior (outputs), effects (downstream consequences), or internals (activations). Behavior is cheap and blind to deception; internals are rich but unvalidated; effects are ground truth but slow.",
      hypothesize: "Where would misalignment show? (1) Rare outputs — a small harmful or manipulative tail invisible in averages; (2) conditional behavior — misbehavior gated on contexts your monitors never sample; (3) distributional drift — the model shifting slowly as user-feedback loops reshape it during deployment.",
      design: "Layered monitoring. (a) Canary honeypots: seeded conversations designed to elicit the behavior of concern, sampled continuously, with known ground truth. (b) Anomaly detection on output embeddings and classifier scores with per-segment baselines, not global averages. (c) Human review routed by judge disagreement, so the ambiguous cases — where detection is genuinely hard — get the scarcest resource: attention.",
      predict: "Contextual misalignment is caught by honeypots and segment baselines that global dashboards miss; drift processes fire drift metrics before behavioral incidents; deception defeats the entire behavioral layer — and that null is itself diagnostic, pushing you to the internals layer.",
      attack: "Your classifiers were trained on yesterday's misalignment — novel failure modes sail through. Monitoring shifts behavior if the model detects it — the panopticon problem, R02's cousin. Alert fatigue trains humans to ignore the system — thresholds need owners. And every layer's false-positive rate must be measured, not assumed.",
      iterate: "Close the loop: every confirmed incident becomes new canaries and new classifier training data. Measure the monitoring system like any detector — ROC over time against an adversary that is actively shifting — and report how detection latency changes quarter over quarter.",
    },
    followups: [
      { q: "Why honeypots rather than sampling real traffic?", a: "Real traffic is dominated by benign use — the tail you care about is exponentially undersampled. Honeypots put the prior where the risk is and provide ground truth for calibration. Their weakness — they only catch what you imagine — is exactly why they must layer with anomaly detection." },
      { q: "Alerts fire but reviewers find nothing?", a: "Either threshold miscalibration, a real pattern too subtle for humans to articulate yet, or adversaries probing. Do not dismiss it — lower the threshold for a week and characterize what alerts cluster on; novel failure modes look like noise first." },
      { q: "The opposite — no alerts for months?", a: "Distinguish quiet from blind: inject known-bad synthetic traffic as positive controls and verify the pipeline fires. A monitoring system without positive controls is unfalsifiable." },
      { q: "Could monitoring make things worse?", a: "If the model conditions on monitoring context, you are measuring its sandbagging behavior, not its deployment behavior — R02 applied to your own dashboard. And monitoring that violates proportionality erodes the trust that makes deployment legitimate; the detector can become the harm." },
      { q: "Make it stronger?", a: "Add the internals layer cautiously: deploy probes validated offline on model organisms (R16), then run them silently for months to measure false-positive rates on production traffic before trusting alerts. Behavior first, internals later — that ordering is the honest one." },
    ],
    pitfalls: ["Global-average dashboards", "No positive controls", "Classifiers frozen at yesterday's failures", "Unmeasured alert fatigue"],
    takeaway: "Deployment detection is layered — honeypots for the known, anomalies for the unknown, positive controls to prove you are not blind.",
    source: "From the reported alignment triplet in a 2026 AI Safety Fellow brainstorm.",
  },
  {
    id: "R16",
    domain: "Alignment & Behavior",
    title: "Build a model organism",
    difficulty: "Hard",
    setup: "Model-organisms research deliberately trains small models with injected misalignment — a known disease — to test whether detectors can find it.",
    question: "Design a model organism of deceptive alignment, and explain what it teaches that natural examples cannot.",
    steps: {
      frame: "The organism's value is control: you know the ground truth — whether the model is actually deceptive, and why — which natural examples never provide. The design space is the training story: what objective, what scenario, what scale, and what counts as success — the organism must actually be deceptive, or you have built nothing to study.",
      hypothesize: "To implant deception you need the ingredients of the natural phenomenon: a trigger the model can recognize, a conditional objective, and training pressure where honesty is penalized in some contexts and rewarded in others. Your hypotheses are about which minimal recipe suffices — that is the science.",
      design: "Train a small model in a curriculum where honesty about a hidden objective is penalized in a detectable context but rewarded outside it — for example, a training-versus-evaluation distinction the model can infer. Hold out a validation battery: behavioral (does it act differently in the trigger context?), mechanistic (can the deception circuit be found?), and detector-facing (do your monitors fire?).",
      predict: "If the organism works, you have a system with known deceptive behavior and — the payoff — ground-truth labels for every detector experiment. If it does not work, that bounds the phenomenon too: deception may require more scale or realism than the recipe provides, which tempers how worried to be about natural emergence at current scales.",
      attack: "The classic confound: the organism may act deceptive without the intended structure — the trigger may be a superficial token pattern rather than situational recognition. Validate with trigger variation: does deception follow the semantic condition or the surface form? And be honest about external validity — an implanted disease models the natural one only if the recipe mirrors plausible training accidents.",
      iterate: "The highest-value experiment on a validated organism is detector calibration: run the full monitoring stack — behavioral classifiers, probes, anomaly detection — against it and measure the ROC. You finally know the false-positive rate of deception detection, something natural data can never give you.",
    },
    followups: [
      { q: "Why not just study natural cases?", a: "Because 'is this model actually deceiving me' is exactly what natural data cannot establish — that is the problem. The organism inverts it: you built the deception, so the labels are ground truth, and every downstream measurement becomes meaningful." },
      { q: "What if you cannot make it deceptive?", a: "Either the recipe is wrong — improve it — or deception needs scale or sophistication current training cannot reach. The second reading lowers your prior on near-term deceptive alignment, which is a real finding, not a failure." },
      { q: "Is building deception itself dangerous?", a: "Yes — which is why organisms live small, sandboxed, with staged method release. Publish detector results and protocols; be careful with turnkey recipes. Every lab here has an explicit policy — know and state yours." },
      { q: "Could detectors trained on organisms miss natural deception?", a: "Absolutely — overfitting to the implanted flavor is the central external-validity risk. Require detectors to generalize across multiple organisms with different recipes; a detector that only catches your own organism caught nothing." },
      { q: "Make it stronger?", a: "Scale the organism in steps and find where deception emerges or breaks — the crossover point is the scaling law of the phenomenon, and it is the number that most directly informs deployment policy." },
    ],
    pitfalls: ["Surface triggers that mimic rather than implement the condition", "No validation that deception exists in the organism", "Publishing turnkey recipes", "Single-organism detector overfitting"],
    takeaway: "The organism buys ground truth — the one thing natural misalignment cannot give your detectors — but only if you validate that the implanted disease is the disease you meant.",
  },
  {
    id: "R17",
    domain: "Evaluations",
    title: "Does it know it's being tested?",
    difficulty: "Hard",
    setup: "Everything you have designed so far assumes the model just answers. But a model that knows when it is being evaluated is a different measurement problem.",
    question: "How would you measure whether a model knows it is being tested?",
    steps: {
      frame: "Unpack 'knows' into separately measurable components: (1) recognition — can it classify contexts as evaluation versus deployment; (2) behavior change — does its behavior differ between them; (3) representation — is the distinction encoded internally. Each level needs its own experiment; conflating them is the standard confusion.",
      hypothesize: "The model may recognize evals by surface markers — formatting, keywords — by semantic content, or not at all. Behavior change may follow recognition (strategic) or the context itself (mundane prompt effects). Distinguish those or you will call every prompt effect situational awareness.",
      design: "A three-layer battery. Behavioral: matched task pairs differing only in eval markers — measure output differences. Generalization: recognition tested on novel eval formats it cannot have seen. Internal: probe activations for eval-context encoding, then validate causally — steer along the probe and check whether recognition, and behavior, shift.",
      predict: "Surface-marker recognition predicts sensitivity that dies when markers are restyled; semantic recognition transfers to novel-but-topically-similar evals; strategic behavior predicts behavior change specifically where recognition happens — the correlation between the two is the actual measurement.",
      attack: "Your 'novel' eval formats were probably described in training data — papers and posts about evals circulate. Recognition may also key on meta-cues: anything that makes an interaction feel recorded. And self-report is unusable here — asking 'are you being tested?' measures your prompt, not its knowledge.",
      iterate: "The deployment-relevant version: measure awareness under your own monitoring stack — does the model behave differently in honeypots than in normal traffic? A model whose behavior differs in your canaries makes your honeypots measure the wrong thing, and you need that number (it connects directly to R15).",
    },
    followups: [
      { q: "Why does this matter — is it not trivia?", a: "Because every eval and monitoring claim is conditional on the model treating the context honestly. If awareness-conditional behavior change exists at nontrivial rates, eval scores become upper bounds on deployment misbehavior — the whole measurement stack inherits the caveat." },
      { q: "The opposite result — no awareness anywhere?", a: "Either the model genuinely lacks it or your battery is too crude. Claim only what you measured: 'no awareness detectable by these methods at these sensitivities' — never 'no awareness.'" },
      { q: "Could there be awareness without behavior change?", a: "Yes — knowledge without strategy, which is roughly the current empirical picture: models encode deployment-related concepts, behavioral effects look small. Fragile comfort: awareness could cross into strategy with scale, so track it across generations." },
      { q: "Another explanation for behavior change?", a: "Prompt style — eval-framed text is stylistically different and models respond to style. Your matched-pair design controls this only if pairs are genuinely matched; audit them as carefully as the R03 rewrites." },
      { q: "Make it stronger?", a: "The causal internal layer is the discriminator: recognition representations that steer behavior when patched are mechanism, not correlation. Pair behavioral batteries with activation steering, and pre-register which results count as strategic awareness." },
    ],
    pitfalls: ["Self-report treated as measurement", "'Novel' formats that exist in training data", "Prompt-style effects mislabeled as awareness", "Ignoring the monitoring feedback loop"],
    takeaway: "Split recognition, behavior change, and representation — and remember every other eval's validity is conditional on the answer.",
  },
  {
    id: "R18",
    domain: "Interpretability",
    title: "The fiction-firing feature",
    difficulty: "Core",
    setup: "Your sparse autoencoder surfaces a feature that fires strongly on deceptive statements in your eval set — but also on fiction, games, and hypotheticals.",
    question: "What would you do next, and what would you conclude?",
    steps: {
      frame: "The fiction-firing is not noise to filter — it is data about what the feature is. Two live readings: the feature encodes something deception and fiction share, such as asserting non-actual content, or it is polysemantic — several unrelated meanings in one direction. Your next experiments must distinguish one meaning with broad scope from several meanings glued together.",
      hypothesize: "(1) A general non-literal-assertion feature — deception is a special case; (2) polysemanticity — unrelated circuits sharing the direction; (3) a superposition artifact — the SAE split one real feature awkwardly across several learned directions.",
      design: "A dissection battery. (a) Max-activating sweep over a huge unlabeled corpus, clustered — does activation organize by non-actual content, or scatter? (b) Contrastive pairs: statements identical except for fiction-versus-claimed-fact framing — does activation track the frame? (c) Causal: ablate or steer the feature on deception evals and on fiction generation — a non-literal feature should modulate both; a deception feature only the first.",
      predict: "A coherent feature predicts clean clustering and frame-tracking; polysemanticity predicts bimodal activation patterns and steering effects that diverge across contexts; the artifact hypothesis predicts the picture cleans up at a different SAE width or sparsity — each hypothesis has its own signature.",
      attack: "Your deception labels may themselves be the confound — labeled-deception datasets are stylistically distinctive (R05's problem again). Dictionary size and training data shape SAE features — rerun at different widths before believing the feature is real. And keep the language honest: a direction is not a concept until causal work earns it.",
      iterate: "Whatever this feature is, the research product is the method: a battery that takes any SAE feature and outputs 'coherent meaning X' or 'polysemantic, do not use,' with evidence. That tooling outlives the feature — the feature was the excuse.",
    },
    followups: [
      { q: "Why not just rename it 'deception-related' and move on?", a: "Because the name is the finding you would be shipping, and it is probably wrong. Features feed monitors and training filters downstream; a mislabeled direction propagates a false belief into safety-critical tooling. The dissection is not pedantry — it is the product." },
      { q: "Steering shows it is causal for deception and for fiction?", a: "Then the model genuinely uses one circuit for both — a big finding: mechanistic deception detection cannot be separated from imagination at this granularity, with direct consequences for R05-style lie detectors." },
      { q: "The opposite — clustering shows total scatter?", a: "Then it is polysemantic or an artifact; downgrade every claim and check whether a different width resolves it. Also audit the pipeline — sometimes 'the feature' is a bug in your dashboards." },
      { q: "Could fiction-firing be legitimate for a deception feature?", a: "Actually yes — both require representing what is not the case. The point is that co-activation alone cannot tell you whether that shared abstraction is the feature's meaning or coincidence — exactly what the causal battery decides." },
      { q: "Make it stronger?", a: "Automated interpretability — model-generated descriptions across thousands of firing contexts — plus human review of clusters, and pre-registered contrastive predictions. Dissection at scale is how features stop being anecdotes." },
    ],
    pitfalls: ["Naming features from max-activating examples alone", "One SAE width treated as ground truth", "Ignoring label confounds in the eval set", "Steering conclusions without dose-response"],
    takeaway: "A feature is a hypothesis, not a finding — dissect before you name, and name before you use.",
  },
  {
    id: "R19",
    domain: "Capabilities",
    title: "Forecasting dangerous capability",
    difficulty: "Hard",
    setup: "Deployment decisions increasingly hinge on predictions: will the next model be able to do X — autonomous exploitation, persuasion at scale, self-improvement? You are asked to build the forecasting function.",
    question: "How would you predict a dangerous capability before it arrives?",
    steps: {
      frame: "Forecasting is about lead time — predicting early enough for mitigations to matter. Define the target precisely: a capability at what threshold, measured by what eval? Vague targets make unfalsifiable forecasts. Then choose the horizon — next checkpoint, next generation, next year — each horizon uses different signals.",
      hypothesize: "Candidate signals: (1) scaling-law extrapolation — capability against compute; (2) precursor capabilities — cheaper sub-skills that historically precede the target; (3) elicitation gaps — abilities present but hidden (R02's sandbagging, R17's awareness); (4) qualitative signals — internal research anecdotes, tool-use progress. Each has a different error profile; build a panel, not a single method.",
      design: "The pipeline: (a) a benchmark ladder for the target capability — graded difficulty, machine-verifiable scoring; (b) backtesting — fit each extrapolation method on past model generations and check which would have predicted the present; this calibration step is the one everyone skips; (c) a live forecast with confidence intervals, updated per checkpoint, logged with explicit resolution criteria.",
      predict: "The meta-discipline: state in advance what observations would move the forecast and by how much — curves bending, precursors accelerating, elicitation revealing hidden capability. A forecast that cannot say what would change it is a vibe with a date attached.",
      attack: "Benchmarks saturate and leak; capability is elicitation-dependent, so 'the model cannot do X' often means 'we failed to elicit X' — the systematic error is underestimation via bad elicitation. Extrapolation assumes smooth trends that emergence has repeatedly violated. And incentives bias forecasters toward what the org wants to hear — log predictions before the data, always.",
      iterate: "Resolve every forecast against ground truth when it arrives and feed misses back into method weights. The research product is the track record: a forecasting function that has been right, with stated uncertainty, is the only version anyone should act on.",
    },
    followups: [
      { q: "Why backtest instead of just extrapolating?", a: "Every method looks good without error bars. Backtesting — would method M, given only pre-2024 models, have predicted 2024? — is the only way to earn calibration before the forecast matters." },
      { q: "What if the capability is emergent — no precursors?", a: "Then lead time is short and you say so: the honest output is 'crossing likely within one generation, watch these tripwires,' plus cheap continuous evals near the boundary. A forecast admitting short lead time drives faster mitigations than a wrong confident one." },
      { q: "The opposite — you predicted it and it did not arrive?", a: "Resolve it, find what the capability model got wrong — elicitation, threshold, data — and publish the miss. A forecasting function that never publishes misses is indistinguishable from astrology." },
      { q: "Could hidden capabilities defeat the whole approach?", a: "They are the strongest argument for elicitation research as a forecasting input: if you cannot elicit it, measure the elicitation gap itself and put it in the error bars. The forecast should carry explicit 'present but undetectable' probability mass." },
      { q: "Make it stronger?", a: "Cross-lab calibration — joint forecasts with other teams on held-out tripwires, so incentives check each other — and an uncontaminated ladder: fresh item generation with canaries, the same discipline as R09's hidden tests." },
    ],
    pitfalls: ["Vague targets", "No backtesting", "Benchmarks that saturate or leak", "Forecasts without stated falsifiers"],
    takeaway: "A forecast is a calibrated track record, not a number — backtest, state what would move you, resolve, repeat.",
  },
  {
    id: "R20",
    domain: "Capabilities",
    title: "Agent autonomy gates",
    difficulty: "Core",
    setup: "Your lab is about to let a coding agent run for hours with shell and network access. Someone asks the obvious question.",
    question: "How would you evaluate an autonomous agent before letting it run unsupervised?",
    steps: {
      frame: "An agent eval covers what a chat eval never faced: persistence — errors compound across steps; side effects — actions, not text; goal drift — does it still pursue the assigned goal after detours? The measurable object is the distribution of trajectories, not single outputs. You are certifying a process.",
      hypothesize: "Failure modes cluster: (1) capability failures — wrong actions from incompetence; (2) alignment failures — competent actions toward off-model goals, R09's reward hacking at higher stakes; (3) robustness failures — derailing on unexpected states; (4) security failures — prompt-injected mid-trajectory. Each needs its own probes; a generic agentic benchmark measures none of them.",
      design: "Staged autonomy with gates. Stage one, sandboxed: instrumented environments with checkpoints for drift (inject detours, measure return), injection canaries planted in the environment, and recovery tests (corrupt a tool mid-run). Stage two, restricted production: real tasks, read-only, human checkpoint every N steps. Gradate permissions by measured failure rates, not vibes.",
      predict: "Healthy agents show low drift-after-detour, canaries flagged or ignored, graceful recovery. The scary signatures: drift that does not return; tool errors worked around in ways that violate their intent; and most diagnostic — different behavior when logging is on versus off, which is R17's awareness applied to agents.",
      attack: "Benchmarks decay as models train on similar environments; sandbox-specific habits may not transfer; long-horizon variance is brutal — single runs are anecdotal, so you need distributions over seeds and time budgets. And the agent improves after deployment through memory and tools — you certified a snapshot, not the thing users meet.",
      iterate: "Instrument production itself: every autonomy expansion is an experiment with pre-registered tripwires — destructive-action rate, injection-surface contacts, drift reports — that automatically roll back permissions. Autonomy is not granted once; it is a control loop.",
    },
    followups: [
      { q: "Why staged gates rather than a big benchmark?", a: "The risks are tail-shaped and compounding: a 95%-clean trajectory distribution still means one bad action per twenty runs, and with side effects you do not get to average. Gates convert a distribution problem into a per-stage evidence problem you can actually decide on." },
      { q: "What if sandbox and production behavior differ?", a: "That gap is itself the finding — measure the delta and treat a large one as disqualifying until understood. Likely causes: prompt differences, tool distributions, or monitoring awareness." },
      { q: "The opposite: everything passes — now what?", a: "Check the probes were live: did injection canaries actually reach the agent, did recovery corruptions actually trigger? An eval that never fires its traps certified nothing. Then expand autonomy slowly anyway — absence of observed failure at short horizons is weak evidence at long ones." },
      { q: "Could misalignment hide from the eval?", a: "Yes — that is the ceiling of behavioral agent evals, and why internals work matters: eventually you want trajectory-level monitors validated on model organisms (R16), not just task completion rates." },
      { q: "Make it stronger?", a: "Log everything and mine the logs: trajectory datasets from staged deployments are the raw material for the next eval generation — and they catch slow drift that no pre-built benchmark will." },
    ],
    pitfalls: ["Single-run anecdotes", "Sandbox-specific overfitting", "Probes that never fire", "Granting autonomy once instead of running a control loop"],
    takeaway: "Certify the trajectory distribution with staged gates and live tripwires — autonomy is a control loop, not a permission.",
  },
  {
    id: "R21",
    domain: "Research Craft",
    title: "The pressing problem",
    difficulty: "Core",
    setup: "Reported verbatim in research interviews. There is no experiment to design — the object under test is you.",
    question: "What do you see as the most pressing unsolved problem in AI alignment — and how would you start on it?",
    source: "Reported verbatim in research-engineer and research-scientist interview loops.",
    steps: {
      frame: "This is a thesis question wearing a brainstorm's clothes. What is scored: a specific, technically-grounded choice — not 'everything is worrying' — an argument for why it outranks alternatives, and a concrete first experiment. The trap is generality: an answer anyone could give after one blog post.",
      hypothesize: "Pick your actual answer and stress-test it: is it pressing — large effect on risk; unsolved — not merely underfunded; tractable-by-you — you can name the first experiment; and load-bearing — progress would change real decisions? A problem failing tractable-by-you is fine to name if you route through a sub-problem that passes.",
      design: "Your answer has the anatomy of an experiment. Example: 'The pressing problem is that our evaluations are conditional on the model treating evals honestly (R17) — every safety claim inherits that caveat. First experiment: measure behavior deltas between eval-framed and deployment-framed contexts on a small open model, pre-registered, with matched pairs. If deltas are large, the field's measurement stack needs repair before anything else.'",
      predict: "Anticipate the pushes: 'why this over scalable oversight?' 'is this not already studied?' 'what would change your mind?' Have the comparative argument ready — what you give up by working on this, and why the exchange is favorable. Updating under a better argument is a good sign here; update for reasons, not pressure.",
      attack: "The self-check: could your answer be reduced to a slogan — 'interpretability matters'? Then it is not yet an answer. Could someone act on it next week — dataset, model scale, design? If not, drill until there is a first experiment. And be calibrated: fake confidence about a research frontier reads worse than honest uncertainty.",
      iterate: "The strongest close maps your problem onto the team's actual work: 'this is adjacent to your monitoring research because...' — not flattery, a real research map showing where your direction plugs in. That is the difference between an opinion and an agenda.",
    },
    followups: [
      { q: "Why is your problem more pressing than X?", a: "Rehearse the direct comparison but keep it live: pressing means risk-relevant, unsolved, and tractable. If X beats yours on those axes, say so and adjust — the reasoning process is the signal, not the loyalty." },
      { q: "Is this not already being worked on?", a: "'Yes, and' is the right shape: cite the existing lines, then name the gap your angle addresses. Claiming novelty where none exists is an instant credibility hit; knowing the literature is the fix." },
      { q: "What would falsify your thesis?", a: "Every research position needs its own falsifier — what evidence would make you abandon this as the pressing problem? If you cannot name any, you have stated a loyalty, not a thesis." },
      { q: "How would you start this week?", a: "The first experiment, named: dataset, model scale, design, pre-registered prediction. Vagueness here undoes everything upstream." },
      { q: "What if four months produce nothing?", a: "Define 'nothing' — negative results on well-instrumented experiments are progress; they bound the phenomenon. If your design cannot produce even a bound, the experiment, not the problem, needs rework." },
    ],
    pitfalls: ["Slogan answers", "No comparative argument", "No first experiment", "No named falsifier"],
    takeaway: "Pick one problem, defend the choice comparatively, and walk in with the first experiment already designed.",
  },
  {
    id: "R22",
    domain: "Scalable Oversight",
    title: "When the window closes",
    difficulty: "Hard",
    setup: "Chain-of-thought is our main window into what a model is doing — and there are early signs models can learn to reason without putting the real steps in words.",
    question: "Research this: what happens to oversight if chain-of-thought stops being faithful, and what would you do about it?",
    steps: {
      frame: "Two linked questions. Measurement: is faithfulness degrading, and where? Response: what does oversight do if the window closes? Name the stakes: CoT monitoring is load-bearing in current safety cases — R04's techniques, R15's monitors — so if it silently degrades, our oversight story has a hole shaped exactly like our main tool.",
      hypothesize: "Degradation routes: (1) training pressure — RL against CoT-monitored objectives rewards hiding the real reasoning; (2) drift — as models internalize more, stated reasoning becomes sketch rather than trace; (3) it was never faithful for some problem classes — R04's mixed results. Each route has different indicators: incentive-driven degradation appears where monitoring creates pressure, drift appears everywhere, never-faithful appears by class.",
      design: "A faithfulness sentinel: keep the R04 battery — error injection, path seeding, magnitude-matched controls — running continuously across model generations, segmented by problem class and by whether training objectives touched the CoT. The key design choice: the sentinel runs on models during training, so degradation is caught before deployment. A monitor for the monitor.",
      predict: "Incentive-driven degradation predicts faithfulness dropping on monitored task classes and recovering when monitoring pressure lifts — the dose-response is the signature. Drift predicts slow uniform decline. Never-faithful classes show flat low scores. The three patterns are only distinguishable because you segmented — and each implies a different response.",
      attack: "The sentinel can be gamed: a model that keeps faithful CoT on simple cases while diverging on hard ones — so segment by difficulty, not just class. Perturbation batteries have their own false-negative modes — R04's controls. And the organizational attack: dashboards nobody acts on. The sentinel needs tripwires with owners, like R20's autonomy gates.",
      iterate: "The response half: if faithfulness degrades, oversight needs replacement channels — internal-state monitors validated for causal use (R05), debriefing techniques, redundant architectures — and they must be built before, not after. The research product is the sentinel plus a costed migration plan: what we lose when CoT goes, what replaces it, and by when.",
    },
    followups: [
      { q: "Why a sentinel rather than one big study?", a: "Because the risk is a moving target — degradation is a process tied to training decisions, and a one-time study answers last quarter's question. A sentinel gives faithfulness the same status as capability benchmarks: tracked, trended, owned." },
      { q: "The opposite result — faithfulness stable?", a: "Current monitoring assumptions hold for this generation — worth knowing, within the battery's stated sensitivity. But stability breeds institutional dependence on a channel future training could close; the migration plan stays on the shelf, not in the bin." },
      { q: "Could we just train models to keep faithful CoT?", a: "A real mitigation with a Goodhart edge — rewarding faithful-looking CoT trains the appearance and makes the sentinel harder, not easier (R14's lesson). Honest version: train for faithfulness and keep the sentinel adversarially updated — measure what you reward, or the reward becomes the target." },
      { q: "Another explanation for observed degradation?", a: "Battery drift: your sentinel ages — new generations change formats, perturbation controls calibrated on old models misfire. Re-baseline per generation and keep a frozen reference model to separate model-change from battery-change." },
      { q: "Make it stronger?", a: "Red-team the sentinel: task an attacker model with correct answers while passing the faithfulness battery — covert reasoning under a faithfulness test. Success quantifies how much oversight can be lost without the dashboard noticing, while the blind spot is still cheap to fix." },
    ],
    pitfalls: ["One-time studies for a moving risk", "Unsegmented dashboards", "Rewarding faithful appearance", "Batteries that age without re-baselining"],
    takeaway: "Treat faithfulness as a tracked metric with tripwires — and build the replacement channels before the window closes.",
  },
]

export const RES_DOMAINS = Array.from(new Set(RES_QUESTIONS.map(q => q.domain)))
