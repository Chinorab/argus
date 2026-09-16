# Retour d'expérience — Nebius Token Factory & NVIDIA Nemotron

Journal tenu au fil du développement d'Argus (livrable du hackathon). Chaque entrée : date, outil, ce qui a marché, ce qui a coincé.

## 2026-09-16 — Démarrage
- Catalogue : la page publique du catalogue Token Factory se rend côté client, impossible à lire sans navigateur ; les identifiants de modèles ont dû être vérifiés via les billets de blog Nebius et la fiche NVIDIA. Une page statique listant les IDs exacts ferait gagner du temps.
- Architecture retenue : Nano Omni (vision + audio) → Nano 30B (extraction JSON) → Ultra 550B (jugement), repli Super 120B. Un seul client OpenAI-compatible pour les quatre.
