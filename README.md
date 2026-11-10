# Canadian Championship Exams — preparation system

A local-first practice site for the **June 5–6, 2027 Canadian Championships in Vancouver**. Six written exams and the Ancient History timeline live in independent static HTML pages. Material is intended for Junior Varsity practice; past papers in other divisions or regions are *supplements*, not necessarily the Canadian exam blueprint.

Official information: https://ihbbcanada.com/canadian-championship-exams

## What the site does

- **Study mode:** immediate correctness feedback, no timer.
- **Exam mode:** time pressure, answers only at submission, correct +2 / incorrect −1 / blank 0.
- **Progress dashboard:** every *finished* session records per-question choices and outcomes in browser storage. Counts distinguish unique attempted questions, repeated success on two different days, and the latest unresolved misses.
- **Parent exports:** CSV for reviewing answers, JSON for backing up and merging history across browsers/devices.
- **Privacy:** no accounts, servers, or analytics. This is not a tamper-proof proctoring system; scores record browser responses, not independent proof of unaided performance.

**Important:** The Map & Flag text-only sets are **not** complete visual-exam simulations. For these shortened sets the practice clock is scaled to 20 seconds per question. Full paper drills use 25 minutes. Real Canadian exams last 25 minutes.

Progress is saved only at *Finish & review* or *Submit exam*, or after exam time expires. Export regularly: clearing browser data or exceeding the 250-session retention cap can lose records.

## Bring new material: intake to publishing

Send class notes, worksheets, readings, PDFs, teacher slides, source links, handwritten question packets, or Abhinav's notes to ChatGPT in this project. Include source/year/division where known. No need to convert these into quizzes in advance.

1. **Triage against Canadian exam scope.** Assign each candidate to Ancient History, Biology, Historical Geography, Map & Flag, Military History, Recent History, or outside scope. For History/Science/Geography Bee tossups, reuse knowledge where appropriate, but do not label a buzzer question as an official MCQ.
2. **Classify and prioritize.** Add topic/subtopic, JV difficulty, relevance (high/medium/low), and whether a gap exists or content is repetitive. For Ancient History, use Canada's published regional percentages. For Recent History, there is no earlier Canadian paper, so extrapolation from US/Asian papers must be labeled.
3. **Verify before proposing.** Check answer against the source and when needed a second reliable reference; record disagreements with source answer keys. Demand one unambiguous answer, plausible distractors, consistent chronology, and a concise explanation. For visual questions require a real legible image with rights to host.
4. **Deduplicate.** Run the automatic text check and a semantic check for reworded copies. A different angle on the same subject is acceptable only when pedagogically justified.
5. **Make an editorial decision.** For each submission/topic return **Add**, **Revise**, **Link as reading**, **Hold**, or **Reject**, with a short rationale. The goal is learning, not growing the count.
6. **Publish reviewed material.** Create clearly named Supplemental Practice sets, separate from official past papers, with source/topic/explanation tags. Validate, review the diff, merge, and confirm the site still works.
7. **Measure impact.** Use wrong-answer history, days-apart reinforcement, accurate timed results, and topic coverage (once tagged). If it creates no clear learning benefit, recommend not adding it.

### Metadata required for NEW supplemental questions

The existing HTML pages contain an embedded JSON array of papers. Each paper has a name and questions. Existing questions use q / options / answer; keep these for backward compatibility. Add editorial metadata to new supplements:

~~~json
{
  "name": "Supplemental Practice - Biology: Genetics - 2026-11",
  "questions": [
    {
      "q": "Original, fact-checked multiple-choice question?",
      "options": ["Plausible A", "Plausible B", "Correct C", "Plausible D"],
      "answer": 2,
      "topic": "Genetics",
      "subtopic": "Inheritance",
      "difficulty": "JV",
      "origin": "supplemental",
      "sourceRef": "Source title, year and page or verifiable URL",
      "explanation": "Why C is correct and other choices are not.",
      "reviewStatus": "verified"
    }
  ]
}
~~~

**Do not publish the above illustration as a live question.** Set names must distinguish official papers, text-only subsets, and supplemental sets. Answer index is zero-based (0=A, 1=B, 2=C, 3=D). The legacy papers are grandfathered because most have no topic/explanation tags.

## Checking changes

From repo root:

~~~bash
node scripts/check-banks.js
node --check progress.js
~~~

A GitHub Action validates structure on push and pull request. A clean structural check does **not** certify all facts or transcribed answer keys. Keep an explicit correction log during future content reviews; never silently alter an archived official question.

**Known source anomaly:** The printed 2022 US Nationals Varsity/JV Biology paper, Q29, repeats the same wording for options A and C. This is present in the original published PDF, not merely a transcription error. The validator warns rather than inventing a replacement distractor. Treat source defects separately from errors introduced by our own content.

## Study approach

- **Learn:** Study mode; read explanations and investigate unfamiliar concepts.
- **Recall:** retry a mistake on a later day; same-session repetition alone is weak evidence.
- **Simulate:** use 2025–2026 Canadian JV papers as the strongest past-paper benchmark; avoid treating 17-question text extracts as equivalent to a complete exam.
- **Verify:** inspect exported CSV and unresolved wrong questions, rather than trusting a completion toggle. Ask Abhinav to explain why a choice is correct.
- **Visuals:** work with official map/flag resource sheets until verified image-based drills are added.

## Next priorities (not implemented yet)

1. Full image-backed Map & Flag questions with source attribution and spatial interpretation (largest content gap).
2. Topic tagging/audit of the 2,322 legacy questions for syllabus coverage and weak-spot diagnostics.
3. Numerical tiebreaker practice and source-aligned mocks.
4. Cross-device sync only if manual backups become inadequate.
