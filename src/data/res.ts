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
    what: "Two open-ended research questions, live. You think out loud; they challenge; you adapt.",
    signal: "Understand → hypothesize → design → predict → attack → iterate. The 'right' answer is not the point.",
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
]

export const RES_DOMAINS = Array.from(new Set(RES_QUESTIONS.map(q => q.domain)))
