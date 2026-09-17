# Video script — Argus (2:50 target, 3:00 hard limit)

Language: English voice-over — generated track: `docs/media/voiceover.mp3` (Microsoft Andrew neural voice via edge-tts, 2:11), subtitles `docs/media/voiceover.srt`, source text `docs/voiceover.txt`. Screen recording of the live demo + one real kitchen sequence
shot on a phone. No music under the voice-over during the report (let the content breathe);
a light bed elsewhere. Subtitles burned in (judges may watch muted).

Recording tips: 1920×1080, Chrome at 125 % zoom, light theme, EN interface. Record the app
run once at natural speed, then cut the waits. Show the real timer in the corner when it
finishes — do not fake it.

| Time | Screen | Voice-over |
|---|---|---|
| 0:00–0:12 | Phone footage, handheld: a real kitchen, a fridge door opening, a thermometer reading 7 °C. Title card over it: **Argus — the food-safety inspection before the inspector**. | "In France, every restaurant inspection ends with a public grade. The worst one can close you for weeks. Most owners find out what's wrong the day the inspector walks in." |
| 0:12–0:25 | Same footage, quick cuts: a notebook of temperatures, cardboard in a walk-in, a bain-marie. | "A pre-inspection audit costs a few hundred euros. The businesses that need it most never call. Argus is that audit — from a phone, in a minute — built on NVIDIA Nemotron running on Nebius Token Factory." |
| 0:25–0:40 | Screen: argus-eight-xi.vercel.app, hero with the cycling verdict. Scroll to the form. Add three photos (real ones from the footage). | "You photograph the kitchen. Fridges, surfaces, the dish area, the floor." |
| 0:40–0:55 | Screen: click **Record a note**, speak on camera (picture-in-picture of you): *"The blast chiller has been broken for a month, we cool the stews on the counter overnight."* The transcript appears live, the note lands in the list. | "You say what photos can't show." *(then let the live transcript speak for itself, 3 s of silence)* |
| 0:55–1:05 | Screen: paste the temperature logbook (messy text), paste the statement. Click **Run the inspection**. | "You paste your temperature log as it is — a notebook, a spreadsheet, a text message — and describe your situation." |
| 1:05–1:35 | Screen: the live timeline. Photos get scanned, anomaly chips appear. Zoom on the model badges as each step lights up. | "Now watch the agent work. A vision model reads each photo like an inspector would, with a confidence score. Nemotron Nano structures your voice note into facts and transcribes the logbook — then a rule engine, not a model, applies the legal limits and spots the fridge that has been drifting for three days. Finally Nemotron Ultra, 550 billion parameters, cross-checks every piece of evidence against the official inspection grid." |
| 1:35–1:50 | Screen: the report lands. Red banner **Urgent correction required**, the four-level scale, the counters. Hold 2 s. | "Thirty-eight seconds. Here is the grade the inspector would publish — and the rule that leads to it." |
| 1:50–2:15 | Screen: scroll to the critical findings. Hover the voice-note finding (B7, immediate). Then the kitchen map, then the evidence gallery with confidence percentages. | "Every finding cites the grid point, the regulation, the proof and the deadline. The stews cooled overnight? Critical, point B7, immediate action — no photo could have shown that. The kitchen map tells you where it hurts. And the evidence gallery shows exactly what the model saw, and how sure it was. What it couldn't see goes to *to verify on site*. No finding without evidence." |
| 2:15–2:35 | Screen: click **Generate the food safety plan**. Cut the wait. Scroll the priority actions (each with its NC id), the HACCP flow with CCP badges, the records table. Click **Download PDF**, show the print preview for 2 s. | "One more click and Nemotron Super writes your food safety plan — the document the law requires — for *this* kitchen: hygiene practices, HACCP control points, records, and a thirty-day action plan where every action points back to the finding it fixes. Export it as a PDF." |
| 2:35–2:50 | Screen: architecture card (a single still): Photos → MiniCPM-V · Voice → Web Speech → Nemotron Nano · Logs → Nano → rule engine · Judge → Nemotron Ultra · Plan → Nemotron Super · all on Nebius Token Factory. Then the GitHub page with the Apache 2.0 badge. | "Models perceive and extract; code decides. Four Nemotron calls, one rule engine, one reference written from the real inspection grid. Open source, Apache 2.0, live today." |
| 2:50–2:56 | Title card: **Argus** · argus-eight-xi.vercel.app · github.com/Chinorab/argus | "Argus. See your kitchen the way the inspector will — before it matters." |

## Shot list for the real-kitchen footage (10 minutes on site)

Ask for permission and keep faces out of frame. Vertical is fine for the phone shots; crop to 16:9 in the edit.

1. Fridge door opening, thermometer visible (the 7 °C shot — stage it with a real thermometer if the fridge is fine).
2. Temperature notebook, handwritten, close-up.
3. Walk-in shelves with cardboard boxes.
4. Bain-marie or pass with plates.
5. Blast chiller or a stew pot on a counter (for the voice-note line).
6. You, in the kitchen, speaking the voice note into the phone (this becomes the picture-in-picture).

Take the same photos with the phone camera for the demo run so the video shows the kitchen that gets inspected.

## Assets to prepare

- Architecture still (one slide, dark background, the five arrows above).
- Two title cards (opening and closing).
- Subtitle file (SRT) from this script.
- Screen recording at 1080p, cursor visible, no notifications.

## Timing check

Read the voice-over aloud at a calm pace: it runs 2:35–2:45 without the silences. Leave the
3 s of live transcript and the 2 s on the red banner untouched — they are the two beats
judges remember.
