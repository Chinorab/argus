# Argus — l'inspection sanitaire avant l'inspecteur

Agent multimodal qui simule une inspection DDPP dans une cuisine de restauration commerciale :
photos + notes vocales + relevés de température → note Alim'confiance prédite, rapport
d'inspection, plan correctif, plan de maîtrise sanitaire.

Construit pour le **Nebius × NVIDIA Global AI Hackathon** (track Best Apps and Agents).

## Modèles (100 % Nebius Token Factory)

| Étape | Modèle |
|---|---|
| Perception photo / audio | `nvidia/nemotron-3-nano-omni-reasoning-30b-a3b` |
| Extraction structurée | `nvidia/nemotron-3-nano-30b-a3b` |
| Jugement réglementaire | `nvidia/nemotron-3-ultra-550b` (repli `nvidia/nemotron-3-super-120b-a12b`) |

## Installation

```bash
git clone https://github.com/<user>/argus && cd argus
npm install
cp .env.example .env.local   # renseigner NEBIUS_API_KEY
npm run dev
```

## Test du pipeline en ligne de commande

Déposer des photos de cuisine dans `samples/demo/` (avec `temperatures.txt` et `declaratif.txt`) puis :

```bash
npx tsx scripts/audit.mts samples/demo
```

## Licence

Apache 2.0 — voir [LICENSE](LICENSE).

## Dossier de démonstration

Le bouton « Essayer avec le dossier de démonstration » charge trois photos de Wikimedia Commons
(`public/demo/manifest.json` contient les attributions : Dwight Sipler CC BY 2.0, MarkBuckawicki CC0,
Shixart1985 CC BY 2.0), des relevés de température volontairement piégés et un déclaratif sans PMS.
