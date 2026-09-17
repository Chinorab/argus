# Feedback — Nebius Token Factory & NVIDIA Nemotron

Kept as a running log while building Argus (a hackathon deliverable). Each entry: date, tool,
what worked, what got in the way.

## 2026-09-16 — Getting started
- **Catalogue discoverability.** The public catalogue page renders client-side, so it cannot be
  read without a browser; the model ids had to be checked through blog posts and NVIDIA model
  cards. A static page listing the exact ids would save time.
- **Model ids differ from the marketing names.** Actual ids via `GET /models`:
  `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`, `nvidia/nemotron-3-super-120b-a12b`,
  `nvidia/Nemotron-3-Ultra-550b-a55b`, `nvidia/Nemotron-3_5-Lightning`. Casing is inconsistent
  from one model to the next.
- **No Nemotron accepts image input on Token Factory** (`400 This model does not support image
  input` for Nano, Super, Ultra and Lightning). Nemotron 3 Nano Omni and Nemotron Nano 2 VL,
  both announced on the Nebius blog, are absent from the catalogue (23 models at the time of
  writing). Argus uses `openbmb/MiniCPM-V-4_5` for perception (0.9-3 s per photo, decent) and
  keeps Nemotron for extraction and judgement.

## 2026-09-16 — First end-to-end pipeline
- **Nemotron reasoning** comes back in a non-standard `message.reasoning` field (not in
  `content`) — handy for displaying it. In thinking mode, Nano 30B *aggregates* tabular data
  (14 readings collapsed to 3); `chat_template_kwargs: {enable_thinking: false}` (a vLLM
  parameter, passed through as is) restores faithful transcription and halves latency.
  `reasoning_effort: "none"` is accepted but returns an empty `content`.
- **Ultra 550B**: 29-45 s for a judgement over ~5k input tokens, 100 % availability over the
  first dozen calls. The Super fallback never triggered.
- **Domain reliability**: Nano inverted the compliance logic on negative temperatures (−19 °C
  judged non-compliant against ≤ −18 °C). General lesson: models extract, code decides
  (limits and verdicts live in `src/lib/rules/`).
- Models return `null` for optional fields: zod schemas must be `.nullish()`.
- Enum values must be listed in the JSON template of the prompt, otherwise Ultra writes free
  text ("chambre froide", "24 h"); a lenient enum with aliases on the parsing side absorbs the
  rest.

## 2026-09-17 — Food safety plan generation
- **Super 120B on long structured output**: ~30 s for a 6.5k-token JSON document, no truncation
  at `max_tokens: 14000`. It drifts from the JSON template more than Ultra does (drops fields,
  returns `{title, detail}` objects where a string was asked). A permissive zod layer that
  flattens objects to text absorbed everything; strict schemas would have failed one call in two.
- Reusing the same `reasoning`-free path as Ultra: Super returns `content` directly, no
  `reasoning` field at temperature 0.2 with this prompt.

## 2026-09-17 — Voice notes
- No audio-input model in the Token Factory catalogue (Nemotron 3 Nano Omni would be the natural
  fit and is announced, but absent). Argus uses the browser's Web Speech API for speech-to-text
  and Nemotron Nano 30B (thinking off) to clean transcripts and extract facts: 1.5-1.8 s for two
  notes, faithful, no hallucinated facts in a dozen runs.

## 2026-09-17 — Calibrating on a clean kitchen
- Testing a *well-run* kitchen exposed two failure modes invisible on the faulty one: the small
  vision model reports absences ("missing hand-wash sink", 0.9) for anything outside the frame,
  and fills its anomaly list with boilerplate ("possible cross-contamination", 0.6) when told what
  to look for. Negative instructions in the prompt did not stop it; a deterministic filter on
  absence claims and a judge rule ("nothing absent from a frame can become a finding") did.
- Nano split a cooling batch ("68 °C at 14:10 to 8 °C at 15:45") into two readings; the rule
  engine then flagged 68 °C as out of range and Ultra invented a 25-hour cooling time. Cooling
  is now extracted as one event (start, end, duration) and judged on both temperature and time.

## 2026-09-17 — Latency and a hung request
- **Ultra 550B latency varies a lot across the day**: 20-45 s for the same judgement prompt in
  the morning, 70-96 s in the evening. Nothing in the response says whether the model was queued
  or generating; a queue-time header would help size timeouts.
- **One request never returned.** A judgement call to Ultra hung for more than ten minutes with
  no error and no data. The OpenAI SDK default (10 min, 2 retries) would have turned that into a
  30-minute wait; on Vercel the function would simply have been killed at 300 s. Argus now sets
  per-call timeouts (perception 60 s, Nano 60 s, Ultra 150 s, Super 120 s, plan 150 s) and falls
  back from Ultra to Super on timeout, which the UI shows as a step in the timeline. Suggestion:
  document expected p95 latencies per model so builders can set timeouts with confidence.
- **Stability of structured judgements.** With a fixed-severity table in the reference, the
  predicted grade was identical across 5 consecutive runs per case (2 kitchens); the count of
  minor findings still varies with the vision model's output at temperature 0.2. Grade stability
  comes from the rule engine and the reference, not from the sampler.
