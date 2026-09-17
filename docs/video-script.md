# Video script — Argus (2:45 target, 3:00 hard limit)

Screen recording only — no filming. The story is **two kitchens, two verdicts**: the same agent
grades a well-run kitchen *Satisfactory* and a kitchen with problems *Urgent correction*, and
shows why. Both are built into the app (the two demo buttons).

Voice-over: `docs/media/voiceover.mp3` (Microsoft Andrew neural voice via edge-tts) with
subtitles `docs/media/voiceover.srt`; source text in `docs/voiceover.txt`. Burn the subtitles
in — judges may watch muted. Light music bed on the intro and outro only.

Recording tips: 1920×1080, Chrome at 125 % zoom, light theme, EN interface, cursor visible,
no notifications. Record each run at natural speed, cut the waits, keep the real timer visible
when the report lands.

| Time | Screen | Voice-over |
|---|---|---|
| 0:00–0:14 | Title card **Argus — the food-safety inspection before the inspector**, then a split screen: left, the three *well-run kitchen* photos; right, the three *kitchen with problems* photos (walk-in with cardboard and raw wood, cluttered pass, greasy blast chiller). | "In France, every restaurant inspection ends with a public grade. The worst one can close you for weeks. Most owners find out what's wrong the day the inspector walks in." |
| 0:14–0:26 | Split screen holds; a red badge appears on the right kitchen, a green one on the left. | "A pre-inspection audit costs a few hundred euros, so the businesses that need it most never call. Argus is that audit — from a phone, in a minute — built on NVIDIA Nemotron running on Nebius Token Factory." |
| 0:26–0:40 | Screen: argus-eight-xi.vercel.app, hero with the cycling verdict. Click **Kitchen with problems**. The form fills: three photos, a voice note, the logbook, the statement. | "You photograph the kitchen. You say what photos can't show — here, a voice note: the blast chiller is broken, the stews cool on the counter overnight." |
| 0:40–0:52 | Screen: hover the voice note, then the pasted temperature log (messy text), then the statement. Click **Run the inspection**. | "You paste your temperature log as it is — a notebook, a spreadsheet, a text message — and describe your situation." |
| 0:52–1:22 | Screen: the live timeline. Photos get scanned, zone and anomaly chips appear; the voice-note step; the logbook step; Ultra thinking with the timer. | "Now watch the agent work. A vision model reads each photo like an inspector would, with a confidence score. Nemotron Nano turns your voice note into facts and transcribes the logbook — then a rule engine, not a model, applies the legal limits and spots the fridge that's been drifting for three days. Finally Nemotron Ultra, five hundred and fifty billion parameters, cross-checks every piece of evidence against the official inspection grid." |
| 1:22–1:35 | Screen: the report lands. Red banner **Urgent correction required**, the four-level scale, the counters. Hold 2 s in silence. | "Thirty-five seconds. Here's the grade the inspector would publish — and the rule that leads to it." |
| 1:35–2:00 | Screen: critical findings — hover the voice-note finding (B7, immediate). Then the kitchen map, then the evidence gallery with confidence percentages, then *to verify on site*. | "Every finding cites the grid point, the regulation, the proof and the deadline. The stews cooled overnight? Critical, point B7, immediate action — no photo could have shown that. The kitchen map tells you where it hurts. The evidence gallery shows exactly what the model saw, and how sure it was. What it couldn't see goes to *to verify on site*. No finding without evidence." |
| 2:00–2:18 | Screen: click **Generate the food safety plan**. Cut the wait. Scroll the priority actions (each with its NC id), the HACCP flow with CCP badges. Click **Download PDF**, 2 s on the print preview. | "One more click and Nemotron Super writes your food safety plan — the document the law requires — for *this* kitchen: hygiene practices, HACCP control points, records, and a thirty-day action plan where every action points back to the finding it fixes. Export it as a PDF." |
| 2:18–2:34 | Screen: **New inspection**, click **Well-run kitchen**, **Run**. Cut to the report: green banner **Satisfactory**, three minor findings, long *strengths* list. Side-by-side freeze frame of the two banners. | "Same agent, a well-run kitchen: signed logs, wrapped trays, a written plan. Satisfactory — three minor points, nothing to close. The grade moves because the evidence moves." |
| 2:34–2:48 | Screen: architecture still: Photos → MiniCPM-V · Voice → Web Speech → Nemotron Nano · Logs → Nano → rule engine · Judge → Nemotron Ultra · Plan → Nemotron Super · all on Nebius Token Factory. Then the GitHub page with the Apache 2.0 badge. | "Models perceive and extract; code decides. Four Nemotron calls, one rule engine, one reference written from the real inspection grid. Open source, Apache 2.0, live today." |
| 2:48–2:54 | Title card: **Argus** · argus-eight-xi.vercel.app · github.com/Chinorab/argus | "Argus. See your kitchen the way the inspector will — before it matters." |

## Assets to prepare

- Opening split-screen: the six demo photos are in `public/demo/` (three `clean-*.jpg`, three others).
- Architecture still (one slide, dark background, the five arrows above).
- Two title cards (opening and closing) — same teal and paper tones as the app.
- Screen recordings: one run of each demo kitchen, plus the PMS generation and the print preview.

## Timing check

The voice-over track runs 2:20 without the two silences (2 s on the red banner, 2 s on the
side-by-side freeze). Total lands around 2:45 with cuts. Do not add narration to fill gaps —
the two silent beats are the ones judges remember.
