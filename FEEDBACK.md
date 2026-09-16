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
