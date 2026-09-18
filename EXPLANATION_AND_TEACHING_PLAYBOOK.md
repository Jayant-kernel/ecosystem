# Explanation & Teaching Playbook

**Purpose:** everything VoiceCode.ai needs to make an AI tutor explain like the best human teacher — plus a verified resource library you can cite, post, or hand to the model.

**How to use this document**

| Part | What it is | Who uses it |
| --- | --- | --- |
| **Part A** | Verified resource library (papers, books, articles, video channels) | You, for posts, citations, and research |
| **Part B** | The distilled playbook — patterns, sequences, hint ladders, phrases, anti-patterns | Curriculum authors and prompt engineers |
| **Part C** | Prompt-ready blocks to paste into the tutor and into posts | Whoever edits the system instruction |
| **Part D** | How this maps onto the VoiceCode lesson contract | Lesson authors |
| **Part E** | Evidence ledger, caveats, and verification status | Anyone checking claims before publishing |

Read **Part B** if you only read one part. It is the whole document compressed.

---

# Part A — Verified Resource Library

## A1. Learning-science foundations of explanation

These are the mechanisms. If you understand nothing else, understand these, because every other technique is downstream of working memory and retention.

| # | Resource | Type | Why it matters | Extract for the tutor |
| --- | --- | --- | --- | --- |
| 1 | **Cognitive Load During Problem Solving** — Sweller, 1988. https://andymatuschak.org/files/papers/Sweller%20-%201988%20-%20Cognitive%20load%20during%20problem%20solving.pdf | Paper | Origin of cognitive load theory: unaided problem-solving burns the working memory a beginner needs to build a schema. | Show a fully worked solution before asking a beginner to solve. Narrate the goal structure. |
| 2 | **Cognitive Load Theory** — Sweller, Ayres & Kalyuga, 2011. https://link.springer.com/book/10.1007/978-1-4419-8126-4 | Book | The definitive synthesis: intrinsic vs extraneous vs germane load, split-attention, redundancy, expertise reversal. | Classify every explanation: is this difficulty *intrinsic* (must be taught) or *extraneous* (my wording created it)? Strip extraneous first. |
| 3 | **Worked Examples as a Substitute for Problem Solving** — Sweller & Cooper, 1985. https://www.jstor.org/stable/3233555 | Paper | Establishes the worked-example effect: studying solutions beats struggling. | Cadence: one fully worked example with spoken rationale → a near-identical problem → fade the example. |
| 4 | **The Expertise Reversal Effect** — Kalyuga, Ayres, Chandler & Sweller, 2003. https://ro.uow.edu.au/ndownloader/files/50479548 | Paper | Support that helps a novice *harms* a more advanced learner. Adaptivity is not optional. | Detect mastery ("I already know this") and reduce depth. Retire scaffolding after two correct unaided answers. |
| 5 | **Why Minimal Guidance Does Not Work** — Kirschner, Sweller & Clark, 2006. https://www.sfu.ca/~jcnesbit/EDUC220/ThinkPaper/KirschnerSweller2006.pdf | Paper | Half a century of evidence against "explore and discover it yourself" for novices. | Default to explicit, sequenced instruction. Never open with "go experiment in the console." |
| 6 | **Test-Enhanced Learning** — Roediger & Karpicke, 2006. https://pubmed.ncbi.nlm.nih.gov/16507066 | Paper | Retrieval beats re-reading, and learners misjudge which helped. | End every concept with spoken free recall. Never let "re-read the transcript" count as study. |
| 7 | **Distributed Practice in Verbal Recall** — Cepeda, Pashler, Vul, Wixted & Rohrer, 2006. https://digitalcommons.usf.edu/psy_facpub/1771 | Meta-analysis | Spacing beats massing; the optimal gap grows with how long you want to remember. | Re-surface earlier concepts at expanding intervals (next session, ~1 week, ~1 month). |
| 8 | **Creating Desirable Difficulties** — Bjork & Bjork, 2011. https://bjorklab.psych.ucla.edu/wp-content/uploads/sites/13/2016/04/EBjork_RBjork_2011.pdf | Chapter | Conditions that slow visible learning often improve durable learning — but only if the learner can still succeed. | Interleave and vary practice. If success collapses toward zero, that is an *undesirable* difficulty. |
| 9 | **Shuffling of Mathematics Problems Improves Learning** — Rohrer & Taylor, 2007. https://doi.org/10.1007/s11251-007-9015-8 | Paper | Blocked practice looks better in-session, interleaved wins a week later. | Mix question types ("is this compute, storage, or networking?") instead of five identical drills. |
| 10 | **Multimedia Learning** — Richard Mayer, 2009/2021. https://www.cambridge.org/core/books/multimedia-learning/7A62F072A71289E1E262980CB026A3F9 | Book | 12–15 empirically derived design principles for explanation. | Three buckets: cut extraneous load, segment and pre-train jargon, foster generative processing with conversational voice. |
| 11 | **Nine Ways to Reduce Cognitive Load** — Mayer & Moreno, 2003. https://www.uky.edu/~gmswan3/544/9_ways_to_reduce_CL.pdf | Paper | The clearest short statement of modality, split-attention, coherence, signalling. | Voice-first: prefer *spoken explanation over text read aloud*. Pre-signal structure ("there are three parts"). |
| 12 | **Mind in Society (ZPD)** — Vygotsky, 1978. https://lchc.ucsd.edu/tclearninglounge/ROOT/carlos/readings/vygotsky_learning_and_dev.pdf | Book | Learning happens just beyond independent ability, with guidance. | Diagnose the learner's solo level with one cold question, then pitch exactly one step above it. |
| 13 | **The Role of Tutoring in Problem Solving (scaffolding)** — Wood, Bruner & Ross, 1976. https://pubmed.ncbi.nlm.nih.gov/932126/ | Paper | Coins "scaffolding" and the six tutor functions. Scaffolding must fade. | Narrow the task ("just pick the region for now"), flag the critical feature, then withdraw help as competence rises. |
| 14 | **Principles of Instruction** — Barak Rosenshine, 2012. https://www.aft.org/ae/spring2012/rosenshine | Guide | Ten practitioner principles: review, small steps, model, guided practice, check, independent practice. | Open each session with a 30-second review. Teach in small steps, checking after each. |
| 15 | **Self-Explanations** — Chi, Bassok, Lewis, Reimann & Glaser, 1989. https://education.asu.edu/sites/g/files/litvpz656/files/lcl/chibassoklewisreimannglaser_1.pdf | Paper | Good learners self-explain and monitor; poor learners copy examples. | Ask "why does that step work?" and "why not the other option?" — not just "got it?" |
| 16 | **Inducing Self-Explanation: A Meta-Analysis** — Bisra et al., 2018. https://doi.org/10.1007/s10648-018-9434-x | Meta-analysis | Self-explanation prompts produce g ≈ 0.55 across 69 effect sizes. The act matters more than the wording. | After every concept: "In your own words, why does that happen?" Just do it consistently. |
| 17 | **The Power of Feedback** — Hattie & Timperley, 2007. https://www.uky.edu/~gmswan3/575/Hattie_Timperly_2007.pdf | Paper | Feedback is powerful but highly variable; process-level feedback works, praise does not. | Replace "great job!" with a named process error and the next step. |
| 18 | **Deliberate Practice** — Ericsson, Krampe & Tesch-Römer, 1993. https://doi.org/10.1037/0033-295X.100.3.363 | Paper | Expertise comes from effortful, feedback-rich practice on specific weaknesses. | Target the weakest sub-skill with immediate specific feedback. |
| 19 | **Improving Students' Learning With Effective Techniques** — Dunlosky et al., 2013. https://www.wku.edu/senate/documents/improving_student_learning_dunlosky_2013.pdf | Review | Ranks study techniques: testing, spacing, self-explanation high; highlighting and re-reading low. | Nudge learners away from re-watching and toward quizzing and recall. |

## A2. The craft of explaining — analogy, clarity, story

| # | Resource | Type | Why it matters | Extract for the tutor |
| --- | --- | --- | --- | --- |
| 1 | **The Feynman Lectures on Physics** — Caltech. https://www.feynmanlectures.caltech.edu/ | Book/site | The gold standard of building from everyday intuition instead of formalism. | Open with the everyday experience, then name the concept. Say explicitly what you are *not* explaining yet. |
| 2 | **Feynman, "Magnets" (Fun to Imagine)** — BBC, 1983. https://www.organism.earth/library/document/fun-to-imagine | Video/transcript | Feynman refuses a fake analogy and shows why "why" questions nest. | Never use a cozy analogy that would mislead. Flag analogies as partial and state the level you are answering at. |
| 3 | **The Feynman Technique** — Scott Young, 2011. https://www.scotthyoung.com/blog/2011/09/01/learn-faster/ | Article | The four-step method (explain plainly, find the stall, simplify). Note: Feynman never wrote it — it is a reconstruction. | Use the *stall point* as the diagnostic: wherever the explanation gets wordy is the gap to reteach. |
| 4 | **Structure-Mapping** — Dedre Gentner, 1983. https://groups.psych.northwestern.edu/gentner/papers/Gentner83.2b.pdf | Paper | Good analogies map *relations*, not surface features. | Check you are importing the causal relationship ("a load balancer seats guests"), not shared looks. |
| 5 | **Metaphors We Live By** — Lakoff & Johnson, 1980. https://press.uchicago.edu/ucp/books/book/chicago/M/bo3637992.html | Book | Metaphor is how abstract thought works, not decoration. | Choose one metaphor per unit and keep it consistent. Surface the target metaphor explicitly. |
| 6 | **Analogical Problem Solving** — Gick & Holyoak, 1980. https://doi.org/10.1016/0010-0285(80)90013-4 | Paper | Learners rarely transfer a deep analogy unless you point at the structure. | Name the shape out loud: "this is the same shape as the queue we did earlier." |
| 7 | **The Curse of Knowledge** — Camerer, Loewenstein & Weber, 1989. https://www.cmu.edu/dietrich/sds/docs/loewenstein/CurseknowledgeEconSet.pdf | Paper | Knowing more makes you worse at predicting what a beginner knows. | Never infer the learner's familiarity from yours. Test with a question before advancing. |
| 8 | **Expert Blind Spot** — Nathan & Koedinger, 2000. http://pact.cs.cmu.edu/koedinger/pubs/Nathan%20&%20Koedinger%2000.pdf | Paper | Deep experts are the *worst* at predicting novice difficulty. | Order content concrete/verbal before symbolic — the reverse of expert intuition. |
| 9 | **The Sense of Style** — Steven Pinker, 2014. https://stevenpinker.com/publications/sense-style-thinking-persons-guide-writing-21st-century | Book | Practical treatment of overcoming the curse of knowledge. | Speak in "classic style": address the learner as an equal looking at the same thing. |
| 10 | **Made to Stick (SUCCESs)** — Chip & Dan Heath, 2007. https://heathbrothers.com/books/made-to-stick/ | Book | Simple, Unexpected, Concrete, Credible, Emotional, Stories. | Open with a curiosity gap; convert every abstract property into a concrete image. |
| 11 | **r/explainlikeimfive** — Reddit. https://www.reddit.com/r/explainlikeimfive/ | Community | The largest living corpus of lay explanations. Gets simplicity right, accuracy and analogy discipline often wrong. | Mine top answers for jargon-removal before/after. Add what ELI5 lacks: correctness and stated analogy limits. |
| 12 | **Progressive Disclosure** — Jakob Nielsen, 2006. https://www.nngroup.com/articles/progressive-disclosure/ | Article | Show only the next necessary layer, with good signposting. | One primary idea per turn. Offer "want the next layer?" on request, and say what they will get. |
| 13 | **The Magical Number Seven, Plus or Minus Two** — George Miller, 1956. https://doi.org/10.1037/h0043158 | Paper | Working memory holds ~4–7 *chunks*, not items. | Cap new items per turn at 3–4 and name the chunk ("these three together are a bucket"). |
| 14 | **Concreteness Fading** — Fyfe, McNeil, Son & Goldstone, 2014. https://eric.ed.gov/?id=EJ1036777 | Review | Concrete → abstract gradually beats either alone. | Named concrete example → generic concept → abstract term alone. Verify on a new example. |
| 15 | **Transportation in the Persuasiveness of Narratives** — Green & Brock, 2000. http://www.communicationcache.com/uploads/1/0/8/8/10887248/the%5Frole%5Fof%5Ftransportation%5Fin%5Fthe%5Fpersuasiveness%5Fof%5Fpublic%5Fnarratives.pdf | Paper | Immersion into a story reduces counter-arguing and changes belief. | Give a character, a goal, an obstacle. Continue the story across turns. |
| 16 | **Politics and the English Language** — George Orwell, 1946. https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/politics-and-the-english-language/ | Essay | Vague abstraction hides unclear thinking. | Cut every cuttable word. Replace jargon with an everyday equivalent. Prefer active voice. |
| 17 | **Plain English Campaign — free guides** https://www.plainenglish.co.uk/free-guides | Guides | Standard substitutions for jargon ("A–Z of alternative words"). | Keep a house glossary and lint generated explanations against it. |
| 18 | **Hemingway Editor** https://hemingwayapp.com/ | Tool | Flags long sentences, passive voice, adverbs; reports grade level. | Readability pass before delivery. Caveat: it measures sentence mechanics, not conceptual difficulty. |
| 19 | **Dual Coding Theory and Education** — Clark & Paivio, 1991. https://nschwartz.yourweb.csuchico.edu/Clark%20&%20Paivio.pdf | Paper | Verbal + imagery codes are remembered better together. | Pair each explanation with an explicit relevant mental image. Irrelevant images add load. |
| 20 | **The Back of the Napkin** — Dan Roam, 2008. https://www.danroam.com/my-books | Book | Drawing forces clarity. | Reduce the concept to a spoken sketch: a flow, a stack, dots and arrows. Describe it aloud. |

## A3. Tutoring dialogue, questioning, and hinting

This is the part most directly wired to a *voice* tutor.

| # | Resource | Type | Why it matters | Extract for the tutor |
| --- | --- | --- | --- | --- |
| 1 | **The Art of Socratic Questioning** — Paul & Elder. https://www.criticalthinking.org/store/products/the-art-of-socratic-questioning/231 | Book | Six question families: clarification, assumptions, reasons/evidence, viewpoints, implications, questions about the question. | On a wrong answer, probe instead of correcting: "What did you mean by that?" then "What are you assuming there?" |
| 2 | **Socratic questioning handout** https://www.musostudy.com/resources/3SS/socratic-questioning-handout.pdf | Handout | The same six families as ready-to-speak stems. | Use as a prompt library for spoken question templates. |
| 3 | **The 2 Sigma Problem** — Benjamin Bloom, 1984. https://gwern.net/doc/psychology/1984-bloom.pdf | Paper | One-to-one tutoring is dramatically more effective than group instruction. | Replicate the *loop*: diagnose → tuned help → verify mastery before advancing. |
| 4 | **Relative Effectiveness of Human Tutoring and ITS** — VanLehn, 2011. DOI 10.1080/00461520.2011.611369 *(publisher blocks bots; search: "VanLehn 2011 relative effectiveness of human tutoring")* | Meta-analysis | Human tutoring d ≈ 0.79; intelligent tutors d ≈ 0.76. Realistic, not mythical, targets. | Keep feedback tight around the single step just taken. Stop short of spoon-feeding sub-steps. |
| 5 | **Two-Sigma Tutoring: Separating Science Fiction from Science Fact** — von Hippel, 2024. https://www.educationnext.org/two-sigma-tutoring-separating-science-fiction-from-science-fact/ | Article | Warns AI-tutor builders against over-promising the 2σ figure. | Never claim 2σ in product copy. Claim a well-run tutoring loop. |
| 6 | **AutoTutor and Family: 17 Years of Natural Language Tutoring** — Nye, Graesser & Hu, 2014. https://doi.org/10.1007/s40593-014-0029-5 | Review | The dialogue engine: pump → hint → prompt → assert; expectation/misconception-tailored. | *"Tell me more"* → *"what is the next thing to check?"* → *"the loop needs a ___"* → only then state it. |
| 7 | **A Taxonomy for Learning, Teaching, and Assessing** — Anderson & Krathwohl, 2001. https://archive.org/details/taxonomyforlearn0000unse | Book | Revised Bloom: a knowledge dimension crossed with a cognitive-process dimension. | Move beginners up the verb ladder, not just recall: apply, then evaluate. |
| 8 | **Costa's Levels of Questioning** https://www.yorku.ca/unsdgs/toolkit/wp-content/uploads/sites/617/2023/03/Costa-3-levels-of-questioning.pdf | Framework | Three tiers: gather → process → apply. | Escalate within one conversation from "what does this hold?" to "predict what happens if it is empty, and why." |
| 9 | **Designing Great Hinge Questions** — Dylan Wiliam, 2015. https://www.ascd.org/el/articles/designing-great-hinge-questions | Article | One quick check at a decision point decides move-on vs reteach. | Before advancing: "Quick one — which line runs first, and why?" Reteach immediately on a wrong model. |
| 10 | **Wait-Time and Rewards** — Mary Budd Rowe, 1974. https://files.eric.ed.gov/fulltext/ED061103.pdf | Paper | Extending wait time past ~3 seconds produces longer, better answers. | Actually pause. Say "take your time — I'll wait." Silence is an instructional tool. |
| 11 | **Cold Calling / No Hands Up** — Dylan Wiliam. https://macstandl.com/cold-calling/ | Guide | Everyone must be ready to answer, not just the confident minority. | Simulate it: name the expectation, give think time, normalise not-knowing. |
| 12 | **Think-Pair-Share** — Frank Lyman. https://www.kent.edu/ctl/think-pair-share | Framework | Rehearsal before the public answer raises quality and lowers stakes. | "Think about this on your own — I won't jump in. Now say it out loud as if I were your study partner." |
| 13 | **Exit Tickets** — NSTA. https://www.nsta.org/exit-tickets | Guide | Two minutes at the end surfaces what to reteach next time. | Close with: "In one sentence, what can you explain now that you couldn't at the start? What still feels fuzzy?" |
| 14 | **The Assistance Dilemma** — Koedinger & Aleven, 2007. https://pslcdatashop.web.cmu.edu/KDDCup/FAQ/Koedinger-Aleven-EPR-07.pdf | Paper | When to withhold vs give information. Suggested productive error rate ≈ 5–25%. | Let them struggle only while errors stay productive. If they stall or guess randomly, help quickly. |
| 15 | **Accommodation of a Scientific Conception (conceptual change)** — Posner et al., 1982. https://eclass.uoa.gr/modules/document/file.php/PHS122/%CE%91%CF%81%CE%B8%CF%81%CE%B1/Posner_Strike_Hewson_Gertzog.pdf | Paper | A misconception only dies when the learner is *dissatisfied* with it. | Make the bug dissatisfying first: predict with the old model → run it → let the conflict land. |
| 16 | **Refutation Text meta-analysis** — Schroeder & Kucera, 2022. https://doi.org/10.1007/s10648-021-09656-z | Meta-analysis | Stating and refuting the misconception works (g ≈ 0.41). | Three beats: "Many people think X — understandable, but wrong, because… What actually happens is Y." |
| 17 | **The Behavior of Tutoring Systems** — VanLehn, 2006. https://cs.uky.edu/~sgware/reading/papers/vanlehn2006behavior.pdf | Paper | The progressive hint sequence Point → Teach → Bottom-out, and contingent tutoring. | Start at the hint level that worked last time. Never open with the answer. |
| 18 | **Conceptualizing Talk Moves as Tools** — O'Connor & Michaels. https://educacion.udd.cl/files/2018/04/Conceptualizing-Talk-Moves-as-Tools.pdf | Paper | Say more, press for reasoning, revoice, turn back, recap. | After any answer choose a move, not a verdict: "Say more." / "What made you think that?" / "So what I'm hearing is…" |
| 19 | **Ground Rules for Exploratory Talk** — Mercer, Dawes & Wegerif. https://thinkingtogether.educ.cam.ac.uk/resources/Ground_rules_for_Exploratory_Talk.pdf | Framework | Explicit rules for reasoning talk improve attainment. | Say it out loud: "In this chat we give reasons. If I'm wrong, push back." |
| 20 | **Dialogic Teaching Essentials** — Robin Alexander. https://is.muni.cz/el/ped/podzim2017/OVp125/um/Alexander_Dialogic_Teaching_Essentials.pdf | Framework | Collective, reciprocal, supportive, cumulative, purposeful. | Be cumulative: each answer feeds the next question. "Because you said X, let's test that." |
| 21 | **GenAI Voice Mode in Programming Education** — Jacobs & Kiesler, 2025. https://arxiv.org/abs/2509.10596 | Study | First study of a real-time voice GenAI tutor: novices used it mainly for debugging; 28.6% of feedback was *incorrect*; it was bad at verbalising code. | Spell identifiers. Read code in unambiguous short chunks. Add a confirmation step: "I said `while`, not `for` — does that match?" |
| 22 | **LearnLM supervised tutoring RCT** — Google DeepMind / Eedi, 2025. https://arxiv.org/abs/2512.23633 | RCT | A pedagogically tuned model matched human tutoring; better transfer. Prompt forbade revealing the answer. | Feed the model the learner's *specific misconception*, not just the answer, and enforce a hard no-leak rule. |

## A4. Computing and data education

| # | Resource | Type | Why it matters | Extract for the tutor |
| --- | --- | --- | --- | --- |
| 1 | **The Recurring Rainfall Problem** — Kathi Fisler, 2014. http://web.cs.wpi.edu/~kfisler/Pubs/icer14-rainfall/icer14.pdf | Paper | Even strong students fail to combine sub-plans into one program. | Enumerate the sub-goals and confirm each verbally before writing code. |
| 2 | **Students' Misconceptions in Introductory Programming** — Qian & Lehman, 2017. DOI 10.1145/3077618 | Review | Synthesises misconceptions and their causes. | Keep a misconception checklist (sequence, one value per variable, `=` as equality, scope) and probe for them. |
| 3 | **Notional machines and introductory programming** — Juha Sorva, 2013. DOI 10.1145/2483710.2483713 | Review | The "notional machine" is the mental computer a learner must run in their head. | State a simple execution model aloud (named boxes + a step counter) *before* syntax. |
| 4 | **Some Difficulties of Learning to Program** — du Boulay, 1986. DOI 10.2190/3LFX-9RRF-67T8-UVK9 | Paper | Coins "notional machine"; catalogues analogy-induced novice errors. | Warn explicitly against reading `=` as algebra, and demonstrate the difference live. |
| 5 | **Parson's Programming Puzzles** — Parsons & Haden, 2006. *(search: "Parsons Haden Parson's programming puzzles 2006 ACE")* | Paper | Reordering given lines removes syntax load so attention goes to logic. | Sequence Parsons → faded Parsons (blanks) → write from scratch. |
| 6 | **Parsons Problems and Beyond** — Ericson, Denny, Prather et al., 2022. DOI 10.1145/3571785.3574127 | Working group | Comprehensive review of Parsons variants and evidence. | Always follow a Parsons task with a write-code task to secure transfer. |
| 7 | **Faded Parsons Problems** — Weinman, Fox & Hearst, 2021. DOI 10.1145/3411764.3445228 | Paper | Partial lines with blanks give transfer equal to writing practice, and students prefer them. | Fade key tokens as mastery grows, not whole lines at once. |
| 8 | **Subgoals, Context, and Worked Examples** — Morrison, Margulieux & Guzdial, 2015. DOI 10.1145/2787622.2787733 | Paper | Naming each step's *purpose* reduces load and improves transfer. | Label every worked step by function. Ask the learner to voice the subgoal before revealing the line. |
| 9 | **PRIMM** — Sentance & Waite, 2017. DOI 10.1145/3137065.3137084 · project hub https://suesentance.net/primm-project | Paper/hub | Predict, Run, Investigate, Modify, Make — read working code before writing any. | Use the five stages as a repeatable lesson skeleton. |
| 10 | **Teaching Programming with PRIMM: A Sociocultural Perspective** — Sentance, Waite & Kallia, 2019. https://eric.ed.gov/?id=EJ1217966 | Paper | Quasi-experiment across 13 schools and 493 learners; PRIMM out-performed controls. | Exploit talk in Predict and Investigate — for a voice tutor this is the core mechanism. |
| 11 | **Peer Instruction** — Eric Mazur. https://mazur.harvard.edu/presentations/active-learning-and-interactive-teaching-peer-instruction | Method | Conceptual question → poll → justify → re-poll. | One "what does this print?" ConceptTest, then require a justification, then a near-miss variant. |
| 12 | **Halving Fail Rates Using Peer Instruction** — Porter, Lee & Simon, 2013. DOI 10.1145/2445196.2445250 | Paper | 10,000+ students; substantial failure-rate reduction. | Treat a wrong answer as diagnostic data and build the next question from it. |
| 13 | **Improving Debugging Skills in the Classroom** — Michaeli & Romeike, 2019. https://www.computingeducation.de/pub/2019_Michaeli-Romeike_WIPSCE19.pdf | Paper | Explicitly teaching a debugging process beats assuming it transfers. | Fixed loop: reproduce → localise → hypothesise → change one thing → verify. Require a spoken hypothesis first. |
| 14 | **Debugging: A Review from an Educational Perspective** — McCauley et al., 2008. DOI 10.1080/08993400802114581 | Review | Novices "flail" without a systematic model and skip comprehension. | Prompt "list at least two possible causes" before any fix. Teach rubber-duck explanation as first class. |
| 15 | **Threshold Concepts and Troublesome Knowledge** — Meyer & Land, 2003. https://pressbooks.atlanticoer-relatlantique.ca/app/uploads/sites/803/2021/07/ETLreport4.pdf | Report | Some ideas are transformative, irreversible, and *troublesome* — learners get stuck, then change. | Budget extra time and multiple representations for the gateway concepts. Normalise the struggle. |
| 16 | **Threshold Concepts in Computer Science** — Boustedt et al., 2007. DOI 10.1145/1227504.1227482 | Paper | Evidence that OOP and pointers/indirection behave as genuine thresholds. | Give disproportionate time to state, objects, references, mutation, `this`. |
| 17 | **Distributed Systems for fun and profit** — Mikito Takada, 2013. http://book.mixu.net/distsys/ | Free book | Accessible primer: time, order, replication, consistency, partitions. | Use its framing: information travels at the speed of light; independent things fail independently. |
| 18 | **Jepsen — Consistency reference** https://jepsen.io/consistency | Reference | Plain-language consistency models plus real databases violating their claimed guarantees. | Teach the consistency ladder with allowed/forbidden histories. Use a real finding as the "systems fail silently" story. |
| 19 | **Designing Data-Intensive Applications** — Martin Kleppmann. https://dataintensive.net · free Cambridge notes: https://www.cl.cam.ac.uk/teaching/2122/ConcDisSys/dist-sys-notes.pdf | Book + notes | Bridges distributed-systems theory and practical data engineering. | Frame every tool choice as a trade-off among reliable / scalable / maintainable, never right or wrong. |
| 20 | **AWS Cloud Quest** https://skillbuilder.aws/game-based-learning | Gamified course | Customer need → choose solution → build → validate → feedback. | Copy the loop. Use simulated customer conversations as voice role-play prompts. |
| 21 | **AWS Educate** https://www.awseducate.com/ | Platform | Free beginner courses and labs; no credit card. | Borrow its storage → compute → networking → databases → ops sequencing. |
| 22 | **Google Cloud Skills Boost** https://www.cloudskillsboost.google/paths | Platform | Bite-size content, quizzes, real-credential labs, unscaffolded "challenge lab" at the end. | End each module with an unscaffolded challenge before awarding progress. |
| 23 | **DataCamp interactive learning** https://www.datacamp.com/interactive-learning | Platform | Short video → in-browser exercise → instant feedback; hints before solutions. | Always follow explanation with an executed exercise. Graduate feedback: hint → hint → solution. |
| 24 | **DeepLearning.AI Short Courses** https://www.deeplearning.ai/short-courses | Platform | ~100 short "learn by building" courses, each ending in a runnable artifact. | Keep units short and end in something the learner runs. |

## A5. Explainer channels and people to study

| Explainer | Where | What to steal |
| --- | --- | --- |
| **Richard Feynman** | https://www.feynmanlectures.caltech.edu/ | Explain through everyday experience; state what you are *not* explaining yet. |
| **Grant Sanderson (3Blue1Brown)** | https://www.3blue1brown.com/ | Never let the symbol outrun the intuition. Narrate a moving picture; pause for prediction. |
| **Kurzgesagt** | https://kurzgesagt.org/ | One strong framing metaphor per topic; optimistic emotional arc. |
| **Veritasium (Derek Muller)** | https://www.veritasium.com/ | Elicit the misconception *first*, then confront the gap. |
| **MinutePhysics** | https://www.minutephysics.com/ | Hard time-box: one idea, under two minutes, no digressions. |
| **Hans Rosling** | https://www.ted.com/talks/hans_rosling_the_best_stats_you_ve_ever_seen | Animate the data; present-tense narration to make numbers felt. |
| **Barbara Oakley** | https://www.coursera.org/learn/learning-how-to-learn | Teach chunking and recall as explicit learner skills. |
| **Fireship** | https://www.youtube.com/@Fireship | Compression and signal-to-noise. Caveat: speed without a comprehension check is not teaching. |
| **Ben Eater** | https://eater.net/8bit | Build from first principles, one layer at a time, so the learner sees every layer. |
| **ByteByteGo (Alex Xu)** | https://blog.bytebytego.com | Diagram-first system design; reusable scope → design → deep-dive → trade-offs script. |
| **Hussein Nasser** | https://www.youtube.com/@hnasr | "Explained by example": run it, show the result, make them predict first. |
| **Kahan Data Solutions** | https://www.youtube.com/@KahanDataSolutions | Whiteboard clarity on ETL vs ELT; de-mystify over-engineering. |
| **Darshil Parmar** | https://github.com/darshilparmar/dataengineering-youtube-analysis-project | Anchor every service to one evolving end-to-end project. |
| **Alex The Analyst** | https://www.youtube.com/@AlexTheAnalyst | Model the full workflow, not isolated commands. |

## A6. What to stop believing

| Myth | Status | Source |
| --- | --- | --- |
| Learning styles (visual/auditory/kinesthetic matching) | No evidence for the required crossover interaction | Pashler, McDaniel, Rohrer & Bjork, 2008. https://digitalcommons.usf.edu/psy_facpub/1765 |
| "We remember 10% of what we read, 90% of what we do" | No empirical origin; percentages invented and vary | Subramony et al., 2014, https://eric.ed.gov/?id=EJ1057239 · Letrud & Hernes, 2018, https://eric.ed.gov/?id=EJ1205960 |
| Highlighting and re-reading are good study methods | Low utility | Dunlosky et al., 2013 |
| Left-brain / right-brain learners; "digital natives" | No support | See Dunlosky et al. 2013 and Pashler et al. 2008 for the broader debunking literature |
| An AI tutor can reliably hit Bloom's 2 sigma | Over-promised; ~0.8σ is the realistic band | von Hippel, 2024 |

---

# Part B — The Distilled Playbook

## B1. The ten repeatable explanation patterns

1. **Start concrete, then fade to abstract.** Named tangible instance → generic concept → the jargon alone. Verify on a new example (Fyfe et al.).
2. **Map relations, not surface features.** Build analogies on shared cause-and-effect structure and *label that structure out loud* (Gentner).
3. **Flag the analogy's limits.** Say where the metaphor breaks (Feynman's rejected rubber band).
4. **Elicit before you explain.** Ask for a prediction or current belief first, then teach against the gap (Veritasium).
5. **Chunk to 3–4 items and name the chunk.** Never dump a taxonomy in one turn (Miller; Sweller).
6. **Progressive disclosure with signposting.** Only the next necessary layer; say what unrolling it gives them (Nielsen).
7. **One curiosity gap per lesson.** Open with a concrete, answerable-but-unknown question, close it by the end (Heath).
8. **Narrative transport over argument.** A character, a goal, an obstacle, continued across turns (Green & Brock).
9. **Dual-code every idea.** Pair the spoken explanation with an explicit, *relevant* mental image (Clark & Paivio).
10. **Test by production, not recognition.** The learner explains it back. Fluency in your delivery is not evidence of their understanding (Camerer et al.).

## B2. The eight-step sequence for teaching any technical concept to a true beginner

1. **Anchor to a concrete outcome.** "Make the page say hello" — never a definition.
2. **Surface the existing model.** Ask for a prediction before explaining. Beginners always arrive with a model.
3. **Give the notional machine in plain words.** Named memory boxes, a step counter, top-to-bottom execution — *before* syntax.
4. **Show one complete, subgoal-labelled worked example.** Never make a beginner produce structure and syntax at once.
5. **Predict → Run → Investigate.** Predict output, run it, compare, explain the difference aloud.
6. **Fade the scaffolding.** Complete example → Parsons → faded Parsons → modify → write from scratch. Remove one dimension at a time.
7. **Teach debugging as its own skill.** Spoken hypothesis before any edit. Reproduce → localise → one change → verify.
8. **Make, then space and vary.** A small make task in a new context, then near-transfer variants over days.

## B3. The five-level hint ladder

Move *down* a level only when genuinely stuck. Reset to Level 1 after any success. Never skip to Level 5.

| Level | Name | Tutor does | Spoken example |
| --- | --- | --- | --- |
| 1 | **Point / orient** | Direct attention only | "Look at what happens between line 3 and 4." |
| 2 | **Pump recall** | Generative question about what they know | "What did we say a loop needs at the top?" |
| 3 | **Teach the principle** | State the rule, not the answer | "In JavaScript, `let` is block-scoped; `var` is not." |
| 4 | **Apply to this case** | Walk the principle onto their line | "So this variable is inside the `if` — what does that mean for where it exists?" |
| 5 | **Bottom-out** | Give the exact step, then require self-explanation and an independent retry | "Change `var` to `let`. Now tell me why that fixed it, and write one more like it." |

Rules: start at the level that worked last time (contingent tutoring). Delay the bottom-out rather than removing it. After a bottom-out, always require self-explanation plus a retry.

## B4. Talk moves — what to say after an answer

Choose a move instead of a verdict.

| Move | Spoken form | Use when |
| --- | --- | --- |
| Say more | "Say more about that." | The answer is thin but promising |
| Press for reasoning | "What made you think that?" | Any claim, right or wrong |
| Revoice | "So what I'm hearing is X — have I got it?" | To confirm or repair a model |
| Turn back | "Good question — what's your hunch?" | They ask you instead of thinking |
| Recap | "So far we have A and B." | Before introducing C |
| Uptake | "Because you said X, let's test what that means for Y." | To stay cumulative |

## B5. Phrases that help vs phrases that shut a learner down

**Helpful:** "Take your time — I'll wait." · "What are you assuming there?" · "A guess is fine." · "That's a useful error — let's see what it tells us." · "So what I'm hearing is… have I got that right?" · "Let's run it and find out." · "How would you check that yourself?" · "We're not moving on until this makes sense to you — that's the point."

**Harmful:** "No, that's wrong. The answer is…" · "It's easy, just do X." · "We already covered this." · "Let me just fix it for you." · "As I said…" · "Obviously…" · "Good job!" as the only feedback · "You should know this by now." · "That doesn't make sense." · Giving the code before Level 4.

## B6. Anti-patterns to lint out of generated explanations

- **Curse-of-knowledge leakage** — using a term before defining it; skipping a step because it is obvious to an expert.
- **Abstract-first lecturing** — jargon and architecture diagrams before any concrete hook.
- **Analogy without limits** — a catchy but structurally wrong metaphor; surface similarity that will not transfer.
- **ELI5 failure mode** — simplified until wrong, patronising, or a one-sentence non-answer.
- **Information dumping** — an entire taxonomy in one turn.
- **Over-disclosure** — too many options or layers too early.
- **Passive, nominalised, jargon-heavy prose** — Orwell's target.
- **Story as decoration** — narrative that entertains but does not carry the causal structure.
- **Irrelevant visuals/images** — memorable but unrelated to the concept.
- **Recognition mistaken for understanding** — "does that make sense?" as the only check.
- **Compression at the cost of correctness** — speed without a fidelity or transfer check.

## B7. Cloud and big-data misconceptions to pre-empt

1. "The cloud is free / instant / unlimited." — It is metered, quota-limited, and region-scoped.
2. "The cloud can't lose my data." — Durability needs replication, backups, versioning.
3. "Serverless means no servers." — There are servers; there are cold starts, timeouts, concurrency limits.
4. "Big data needs Hadoop or Spark." — Most problems are small and are cheaper on one machine or a warehouse.
5. "SQL vs NoSQL is a belief system." — It is a trade-off; polyglot persistence is normal.
6. "A data lake is just a dump." — Without catalog and quality checks, a lake becomes a swamp.
7. "ETL always means transform before load." — Modern stacks often load raw first and transform in-warehouse (ELT).
8. "Eventual consistency means broken." — It is a defined guarantee: a trade-off, not a defect.
9. "Replication = backup" and "replication = consistency." — Neither is true.
10. "Partitions are only network failures." — Clock skew, GC pauses, slow disks and corruption cause divergence too.
11. "Streaming is always better than batch." — It adds complexity, cost and correctness risk.
12. "A queue guarantees exactly-once." — Most offer at-least-once; consumers must be idempotent.
13. "The dashboard number is the truth." — Without lineage and freshness checks, dashboards encode bugs.
14. "Distributed system = microservices." — Distribution is a coordination problem; microservices are a deployment choice.

---

# Part C — Prompt Kit

## C1. Drop-in system instruction for the VoiceCode tutor

Paste the block below over the `systemInstruction` template in `services/geminiService.ts`. It keeps the existing tool behaviour and adds the teaching discipline. Placeholders are the same ones already used: `${lessonContext}` and `${aiMemory}`.

```text
You are VoiceCode AI, a warm, patient voice mentor who teaches by talking.

# PRIME DIRECTIVE
Listen first. Answer the learner's actual question before anything else. Never
ignore a question to follow a lesson script.

# THE TEACHING LOOP (every concept, in order)
1. ANCHOR   - a concrete, everyday problem. No jargon yet.
2. ELICIT   - ask for a prediction or their current guess. Wait ~3 seconds.
3. MODEL    - give the mental machine in plain words (named boxes, a step
              counter, instructions top to bottom) BEFORE syntax.
4. SHOW ONE - one complete worked example, narrating the PURPOSE of each step.
5. CHECK    - ONE generative question. Not "does that make sense?".
6. FADE     - let them modify it, then build it from scratch.
7. BREAK IT - show a realistic error, ask them to hypothesise a cause first.
8. RECAP    - one sentence in THEIR words: "you explain it back to me".

# HARD RULES
- Define every technical term the first time you speak it.
- Never say a term the learner has not met and not defined it. No exceptions.
- Introduce at most 3-4 new ideas per turn, then name the chunk.
- Use ONE consistent metaphor per topic, and say where it breaks.
- Every analogy must map a relationship, not a resemblance.
- Never open with the answer. Never skip straight to code.
- Fluency from the learner is NOT understanding. Make them produce it.
- Never claim Bloom's "two sigma". Aim for a strong tutoring loop.
- Do not use learning styles (visual/auditory/kinesthetic). Adapt to
  demonstrated performance and prior knowledge only.

# HINT LADDER (climb down only when stuck; reset after success)
1 Point    - "look at line 3"
2 Pump     - "what did we say a loop needs?"
3 Principle- state the rule, not the answer
4 Apply    - walk the rule onto their exact line
5 Bottom-out - give the step, then require self-explanation AND a retry

# AFTER EVERY ANSWER, CHOOSE A MOVE, NOT A VERDICT
"Say more." / "What made you think that?" / "So what I'm hearing is X - have
I got it?" / "Good question - what's your hunch?" / "Because you said X, let's
test what that means."
Give feedback on the PROCESS ("your model is right but you are mixing up
region and availability zone"), never bare praise ("great job!").

# VOICE-SPECIFIC
- Speak in short sentences. No monologues over ~60 seconds.
- Spell identifiers and operators: "a-m-p-e-r-s-a-n-d a-m-p-e-r-s-a-n-d".
- After writing code, confirm: "I wrote `while`, not `for` - does that match?"
- Silence is a tool. Say "take your time - I'll wait" and actually wait.

# CODE TOOLS
- Use 'writeCode' to show, 'readCode' before debugging, 'executeCode' to run.
- Introduce code in this order: what we are building, why, inputs, outputs,
  then the important line. Then ask them to change it.

# REDIRECT THE GOAL OF THE QUESTION
If they say "just fix it", do not fix it. Move one rung up the hint ladder.

${lessonContext}

# SESSION CONTEXT
- Learner history: ${aiMemory.length > 0 ? aiMemory.slice(-3).join('; ') : 'New learner - be welcoming.'}
```

## C2. Per-lesson teaching script (maps 1:1 to the lesson contract)

Use this when authoring the `explanations` array. Each bullet becomes one paragraph.

1. **Why this matters** — the concrete problem, before any term.
2. **What it is** — the plain-English idea, one sentence.
3. **Mental model** — one metaphor, plus where it breaks.
4. **The machine** — how it actually works, step by step, in plain words.
5. **The technical definition** — only now, and only after the above.
6. **Common mistake** — the misconception stated, then refuted.
7. **Production insight** — why professionals care: cost, security, scale.

## C3. Adaptive difficulty rules

| Signal | Response |
| --- | --- |
| Two correct unaided answers | Reduce explanation depth. Withdraw scaffolding. Move up the verb ladder. |
| One wrong answer | Do not explain. Ask "what made you think that?" and diagnose. |
| Same misconception twice | Switch to refutation: "Many people think X — here is why that fails." |
| Silence or "I don't know" | Move *up* the hint ladder, not down. Give the principle, keep the step. |
| Fast fluent answers, no reasoning | Ask for justification. Fluency is not mastery. |
| Frustration | Narrow the task. Give one step only. Protect dignity. |

## C4. Reusable patterns for posts and short-form

These are the same moves compressed for writing, threads, and short videos.

1. **The refusal hook** — "Let me answer a slightly different question first." (Feynman)
2. **The wrong-guess opener** — "Most people think X. That is reasonable, and wrong."
3. **The concrete before the label** — describe the thing, then name it.
4. **The one-metaphor rule** — one metaphor for the whole piece; never a second.
5. **The limit disclosure** — "This metaphor breaks when…"
6. **The curiosity gap** — open with a question the reader cannot yet answer.
7. **The 3-chunk rule** — never a list of nine; group into three named chunks.
8. **The prediction beat** — "Before you scroll: what do you think happens?"
9. **The failure story** — a real system that broke, then the principle.
10. **The production twist** — end with what changes at 100x scale or real cost.

---

# Part D — How This Maps Onto the VoiceCode Lesson Objects

| Lesson field | Playbook source |
| --- | --- |
| `explanations[0]` | B2 Step 1 (anchor) + C2 Step 1 (why). Also the Foundation Drill from the architecture doc. |
| `explanations[1]` | The plain idea + the mental model (B1 patterns 1–3). |
| `explanations[ last ]` | Production insight — cost, security, scale (C2 Step 7). |
| `demos` | B2 Step 4: one complete worked example, subgoal-labelled in the comments. |
| `exercises` | B2 Steps 5–6: predict → run → modify, then fade to writing from scratch. |
| `debugging` | B2 Step 7: a realistic error plus a spoken hypothesis before the fix. |
| `oralQuestions` (recall) | Costa Level 1 / Bloom Remember. |
| `oralQuestions` (apply) | Costa Level 2 / Bloom Apply. |
| `oralQuestions` (predict) | Costa Level 3 / Bloom Evaluate — the highest-value question type for a voice tutor. |
| `memoryUpdates.mistakeWatchlist` | B7 misconceptions, tracked per lesson. |
| `assessment` | Hinge questions: wrong-thinking and right-thinking learners must give *different* answers. |

**Immediate implication for the current curriculum:** Phase 0 already follows this implicitly. The next authoring pass should make it explicit — every lesson gets one elicit-before-explain question in `oralQuestions`, and every `debugging` block requires a stated hypothesis before the solution.

---

# Part E — Evidence Ledger and Caveats

## Verification status

- Resource URLs above were gathered and checked by four parallel research passes. Where a publisher blocks automated requests (ACM, Wiley, SAGE, Taylor & Francis, ERIC), the DOI or citation was cross-checked and a search query is given instead.
- Two sources could not be URL-verified and are flagged inline with a search query: **Simon (2011)** on assignment/sequence, and **Parsons & Haden (2006)**. Cite them by title and venue, not by a guessed link.
- Naming corrections applied: the curse-of-knowledge paper is **Camerer**, Loewenstein & Weber (not "Cameron"); *Made to Stick*'s mnemonic is **SUCCESs** (six elements); the notional-machine canon is **du Boulay (1986)** and **Sorva (2013)**, not "Benyon".
- The two 2025 AI-tutoring papers (Jacobs & Kiesler; Google DeepMind LearnLM) are recent. Verify before quoting numbers in marketing or product claims.

## Caveats to state honestly

- **Effect sizes from Hattie are contested.** Aggregate effect sizes mix study designs and units of analysis. Treat rankings as directional.
- **"Germane load" is theoretically shaky.** Do not build a learner model that assumes you can cleanly add it.
- **Desirable difficulties have boundary conditions.** Difficulty is only desirable if the learner can still succeed.
- **Multimedia principles are conditional.** The modality effect shrinks or reverses for advanced learners. Our voice-first case is not the standard case.
- **The transfer to voice-first AI tutoring is untested.** Almost all this evidence comes from text, graphics, or human tutoring. Voice adds prosody and pacing but removes persistent visual reference. **We must run our own A/B tests with real beginners rather than assuming these results transfer.**
- **Deliberate practice is contested.** The structure (targeted, feedback-rich) is sound; the strong "practice explains everything" claim is not settled.
- **ZPD and scaffolding measure poorly.** Useful instructionally, difficult to falsify.

## The single most important caveat

Everything in Part B is a *hypothesis about our product*, not a proven fact about VoiceCode. The correct next step is not to assume these techniques work in a voice-first AI tutor — it is to instrument them and measure. Each pattern in B1 should become a variant we can A/B test against our own beginners, using the growth experiment skills already available in this workspace.
