# Argus — the food-safety inspection before the inspector

Argus is a multimodal agent that simulates an official food-safety inspection of a commercial
kitchen. Feed it photos, temperature logs and a short statement; it returns the inspection
report a French DDPP inspector would write, predicts the public **Alim'confiance** grade the
establishment would receive, and lists the corrective actions with deadlines.

Built for the **Nebius × NVIDIA Global AI Hackathon** (track: Best Apps and Agents).

**Live demo:** https://argus-eight-xi.vercel.app — click *Try with the demo case file*, then *Run the inspection* (about 40 s).

## Why

In France, restaurant inspection results are public. A single "urgent correction required"
grade can mean an administrative closure — weeks of lost revenue for a small business. Most
operators discover their non-compliances the day the inspector walks in. Argus lets them see
their kitchen the way the inspector will, before it matters.

The regulatory knowledge (grid, texts, temperature limits, severity scale, grade rules) comes
from hands-on experience in food-hygiene compliance, not from a generic prompt.

## How it works

| Step | Model (Nebius Token Factory) | Role |
|---|---|---|
| 1. Perception | `openbmb/MiniCPM-V-4_5` | Per photo: zone, equipment, visible anomalies with confidence, positives |
| 2. Extraction | `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` | Transcribes messy temperature logs to JSON (reasoning off for fidelity) |
| 2b. Rules | deterministic code | Applies the limits of the French order of 21/12/2009, detects persistent drift |
| 3. Judgement | `nvidia/Nemotron-3-Ultra-550b-a55b` (fallback `nvidia/nemotron-3-super-120b-a12b`) | Cross-checks every finding against the DGAL inspection grid, qualifies severity, predicts the grade, writes the report |
| 4. Food safety plan | `nvidia/nemotron-3-super-120b-a12b` | Drafts the establishment's Food Safety Management Plan (PMS: hygiene practices, HACCP flow with CCPs, records, procedures) so that every finding is addressed by a practice, a control point or a priority action |

Design principle: **models perceive and extract, code decides.** Temperature limits and
verdicts are never left to a language model.

The UI streams each step live (Server-Sent Events), shows which model is working, and links
every finding to its evidence (photo thumbnail, reading, statement). The report and the plan
export to PDF through a print stylesheet (**Download PDF** → "Save as PDF") and to JSON.

## Run it locally

```bash
git clone https://github.com/Chinorab/argus && cd argus
npm install
cp .env.example .env.local   # set NEBIUS_API_KEY
npm run dev
```

Open http://localhost:3000 and click **"Try with the demo case file"**.

### Command line

Put kitchen photos in a folder with an optional `temperatures.txt` and `statement.txt`, then:

```bash
npm run audit -- samples/demo        # English report
npm run audit -- samples/demo fr     # French report
npm run pms -- samples/demo          # then the food safety plan from report.json
```

Other scripts: `npm run models` lists the Token Factory catalogue and checks the model ids
Argus uses; `npm run probe-vision -- <photo> <model ids…>` tests which models accept image input.

## Project layout

```
src/lib/nebius.ts              Token Factory client and model ids
src/lib/schemas.ts             zod schemas (lenient enums for model output)
src/lib/rules/temperatures.ts  deterministic temperature compliance rules
src/lib/pipeline/              perceive → extract → judge → pms, and the event orchestrator
src/lib/reference/             inspection reference: texts, grid, severity scale, grade rules
src/app/api/inspect/route.ts   SSE endpoint
src/app/api/pms/route.ts       food safety plan endpoint
src/components/                capture form, live timeline, report, food safety plan
```

## Demo case file

The demo loads three Wikimedia Commons photos (attributions in `public/demo/manifest.json`:
Dwight Sipler CC BY 2.0, MarkBuckawicki CC0, Shixart1985 CC BY 2.0), deliberately faulty
temperature logs (a meat fridge drifting at 7 °C for three days, a bain-marie at 58 °C) and a
statement with no written food safety plan.

## Security note

The Nebius API key lives only in `.env.local` (git-ignored) and is read exclusively by server
code: the Token Factory client is marked `server-only`, so the build fails if any client
component ever imports it. Photos are sent to the server as data URLs, forwarded to the model
and never stored.

## Language

The interface, the generated report and this repository are in English. A French toggle is
available for operators in the field; the regulatory references keep their official French names.

## Feedback on Nebius and NVIDIA tooling

See [FEEDBACK.md](FEEDBACK.md).

## Licence

Apache 2.0 — see [LICENSE](LICENSE).
