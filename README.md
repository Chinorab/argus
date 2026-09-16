# Argus — the food-safety inspection before the inspector

Argus is a multimodal agent that simulates an official food-safety inspection of a commercial
kitchen. Feed it photos, temperature logs and a short statement; it returns the inspection
report a French DDPP inspector would write, predicts the public **Alim'confiance** grade the
establishment would receive, and lists the corrective actions with deadlines.

Built for the **Nebius × NVIDIA Global AI Hackathon** (track: Best Apps and Agents).

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

Design principle: **models perceive and extract, code decides.** Temperature limits and
verdicts are never left to a language model.

The UI streams each step live (Server-Sent Events), shows which model is working, and links
every finding to its evidence (photo thumbnail, reading, statement).

## Run it locally

```bash
git clone https://github.com/<user>/argus && cd argus
npm install
cp .env.example .env.local   # set NEBIUS_API_KEY
npm run dev
```

Open http://localhost:3000 and click **"Try with the demo case file"**.

### Command line

Put kitchen photos in a folder with an optional `temperatures.txt` and `statement.txt`, then:

```bash
npx tsx scripts/audit.mts samples/demo        # English report
npx tsx scripts/audit.mts samples/demo fr     # French report
```

Other scripts: `scripts/models.mts` lists the Token Factory catalogue and checks the model ids
Argus uses; `scripts/probe-vision.mts` tests which models accept image input.

## Project layout

```
src/lib/nebius.ts              Token Factory client and model ids
src/lib/schemas.ts             zod schemas (lenient enums for model output)
src/lib/rules/temperatures.ts  deterministic temperature compliance rules
src/lib/pipeline/              perceive → extract → judge, and the event orchestrator
src/lib/reference/             inspection reference: texts, grid, severity scale, grade rules
src/app/api/inspect/route.ts   SSE endpoint
src/components/                capture form, live timeline, report
```

## Demo case file

The demo loads three Wikimedia Commons photos (attributions in `public/demo/manifest.json`:
Dwight Sipler CC BY 2.0, MarkBuckawicki CC0, Shixart1985 CC BY 2.0), deliberately faulty
temperature logs (a meat fridge drifting at 7 °C for three days, a bain-marie at 58 °C) and a
statement with no written food safety plan.

## Language

The interface, the generated report and this repository are in English. A French toggle is
available for operators in the field; the regulatory references keep their official French names.

## Feedback on Nebius and NVIDIA tooling

See [FEEDBACK.md](FEEDBACK.md).

## Licence

Apache 2.0 — see [LICENSE](LICENSE).
