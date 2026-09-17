# Devpost submission — Argus

Copy each block into the matching Devpost field. Keep the wording; adjust names and links if they change.

---

## Project name

Argus

## Tagline (≤ 60 characters)

The food-safety inspection before the inspector.

## Track

Best Apps and Agents

## Links

- Live demo: https://argus-eight-xi.vercel.app — click *Try with the demo case file*, then *Run the inspection* (about 40 s).
- Repository (Apache 2.0): https://github.com/Chinorab/argus
- Video: *(YouTube link)*

## Built with (tags)

nvidia-nemotron, nebius-token-factory, next.js, react, typescript, tailwindcss, zod, openai-sdk, server-sent-events, web-speech-api, vercel

---

## About the project

### Inspiration

I have spent years on the compliance side of food businesses in France — food-hygiene training, HACCP plans, temperature logs, the paperwork a small restaurant has to keep. I have seen what happens on the day the inspector walks in: the owner discovers, in front of a stranger, that the meat fridge has been drifting at 7 °C for a week, that "we clean every night" is not a cleaning plan, that the notebook of temperatures does not count as a record.

In France the result is public. Since 2017, every inspection ends with one of four grades published on **Alim'confiance** — from *Very satisfactory* to *Urgent correction required*. The last one can mean an administrative closure: weeks of lost revenue for a business that runs on thin margins, often for problems that were fixable in a day.

Consultants who do pre-inspection audits exist. They cost several hundred euros a visit, which is exactly why the businesses that need them most never call. Argus is that audit, done from a phone, in a minute.

### What it does

Argus simulates the official inspection of a commercial kitchen and predicts the public grade it would receive.

The operator:

1. photographs the kitchen (fridges, work surfaces, dish area, waste, floors) with their phone;
2. dictates voice notes for what photos cannot show ("the blast chiller has been broken for a month, we cool the stews on the counter overnight");
3. pastes their temperature logbook as-is, however messy;
4. describes the situation in a few lines (training, pest control, written plan or not).

In about 40 seconds Argus returns:

- the **predicted Alim'confiance grade** with the rule that led to it and the risk of administrative closure;
- the **inspector's report**: every non-compliance with its severity, the point of the official inspection grid, the regulation it violates, the **evidence** (a photo with the model's confidence, a temperature reading, a voice note, a statement), the corrective action and the deadline;
- a **kitchen map** of findings by zone and a photo-evidence gallery;
- what the inspector would still check on site;
- on demand, a full **Food Safety Management Plan** (the French *PMS* required by Regulation (EC) 852/2004) written for that kitchen: hygiene practices, HACCP flow with critical control points, records to keep, procedures, and a 30-day action plan where every action cites the finding it fixes;
- a PDF of the whole thing.

The interface is in English with a French toggle for operators in the field. The live timeline shows which model is working on what, in real time.

### How we built it

Everything runs on **Nebius Token Factory** through its OpenAI-compatible API, with the NVIDIA **Nemotron 3** family doing the thinking:

| Step | Model | Role |
|---|---|---|
| Perception | MiniCPM-V 4.5 (Nebius catalogue) | Reads each photo like an inspector: zone, equipment, anomalies with a calibrated confidence score |
| Voice notes | browser Web Speech API → **Nemotron 3 Nano 30B** | Speech-to-text on device; Nano cleans the transcript and extracts inspection facts |
| Temperature logs | **Nemotron 3 Nano 30B** (reasoning off) + a deterministic rule engine | Nano transcribes the logbook; the code applies the legal limits of the French order of 21 December 2009 and detects persistent drift |
| Judgement | **Nemotron 3 Ultra 550B** (fallback **Super 120B**) | Cross-checks every piece of evidence against the DGAL inspection grid and the regulation, qualifies severity, predicts the grade, writes the report |
| Food safety plan | **Nemotron 3 Super 120B** | Drafts the PMS from the case file and the report |

Two design principles shaped the architecture:

- **Models perceive and extract; code decides.** Temperature limits and compliance verdicts are computed by a rule engine, never by a language model. The judge receives readings already qualified ("PERSISTENT DRIFT: 5 consecutive readings out of range") and applies severity rules written in the reference.
- **No finding without evidence.** The judge is forbidden to infer a non-compliance from an absence of proof; what it cannot see goes into "to verify on site". A photo anomaly can only be *critical* if the vision model is at least 90 % confident and names the concrete hazard.

The regulatory knowledge is a 140-line reference I wrote from the texts and the inspection grid used by French inspectors: applicable regulations, temperature table, 41 control points across premises, practices, documentation and staff, a severity scale, and the rules that turn findings into one of the four public grades.

Stack: Next.js 16, React 19, TypeScript, Tailwind 4, zod, the OpenAI SDK pointed at Token Factory, Server-Sent Events for the live timeline, a print stylesheet for the PDF. The public demo is deployed on Vercel; the same image is packaged for Nebius AI Cloud (Dockerfile, Docker Compose with Caddy, one-shot VM setup script in `deploy/`). The API key lives only server-side (`server-only` guard) with per-call timeouts and an Ultra → Super fallback.

### Challenges we ran into

- **No Nemotron accepts images on Token Factory today.** Nano Omni and Nano 2 VL are announced but absent from the catalogue; Nano, Super, Ultra and Lightning all return "This model does not support image input". I kept Nemotron as the brain (extraction, judgement, plan) and used MiniCPM-V from the same catalogue as the eyes.
- **Nemotron's reasoning mode aggregates tabular data.** In thinking mode, Nano collapsed 14 temperature readings into 3. Passing `chat_template_kwargs: {enable_thinking: false}` restored faithful transcription and halved latency.
- **A language model inverted the sign on negative temperatures** (−19 °C judged non-compliant against ≤ −18 °C). That is the day the rule engine was born.
- **Over-confident vision.** The perception model rated "raw and cooked mixed" at 0.80 on a photo where it was only plausible. Explicit confidence calibration in the prompt, plus a 0.9 threshold for photo-only critical findings, fixed it without losing real hazards.
- **Structured output drift.** Ultra writes "chambre froide" where an enum expects `cold_storage`; Super returns `{title, detail}` objects where strings were asked. Lenient zod schemas with aliases and text flattening absorbed all of it.

### Accomplishments that we're proud of

- A report that a French food-safety professional would recognise: the right grid points, the right texts, the right deadlines, one finding per subject, and the honesty to say "to confirm on site".
- The voice-note moment: "we cool the stews on the counter overnight" becomes a critical finding under point B7 with an immediate action — something no photo or logbook could reveal.
- 40 seconds end to end on Vercel, with a timeline that shows the work as it happens.
- A food safety plan where every priority action points back to the non-compliance it resolves.

### What we learned

- With regulated domains, the value is not in the model but in what you refuse to let the model decide. Deterministic rules for limits and verdicts made the output trustworthy; the models made it readable and complete.
- Big reasoning models are excellent judges when the reference is explicit and the evidence is pre-qualified. Ultra never needed a second attempt in dozens of runs.
- Prompting a vision model to *look for* a list of anomalies makes it find them. Calibration instructions matter as much as the list.

### What's next

- Sector packs: butchers, bakeries, caterers, school canteens each have their own grid and limits — the reference file is the only thing to change.
- Recall alerts: cross the operator's product families with the official recall feed (RappelConso) in the report.
- Follow-up mode: re-inspect after the 30-day plan and show the grade moving.
- Nemotron Nano Omni for perception and audio the day it lands on Token Factory — the pipeline is already shaped for it.

---

## Feedback on Nebius Token Factory and NVIDIA tools (Devpost field)

Full log in the repository: https://github.com/Chinorab/argus/blob/main/FEEDBACK.md

Summary:

- **What worked.** One OpenAI-compatible client for four models; Ultra 550B answered 5k-token judgement prompts in 20-70 s with 100 % availability; the `reasoning` field on Nemotron replies made it trivial to show the model's chain of thought in the UI; `chat_template_kwargs` passes through to vLLM, which let me switch Nano's thinking off per request.
- **What got in the way.** The catalogue page is client-rendered and unreadable without a browser, and the model ids differ from the marketing names (inconsistent casing: `NVIDIA-Nemotron-3-Nano-30B-A3B` vs `nemotron-3-super-120b-a12b`). No Nemotron accepts image or audio input on Token Factory although Nano Omni and Nano 2 VL are announced. `reasoning_effort: "none"` is accepted but returns an empty `content`.
- **Suggestions.** A static, machine-readable model list with modalities and ids; Nano Omni in the catalogue; a note in the docs that thinking mode can alter tabular transcription and how to disable it.
