# Retour d'expérience — Nebius Token Factory & NVIDIA Nemotron

Journal tenu au fil du développement d'Argus (livrable du hackathon). Chaque entrée : date, outil, ce qui a marché, ce qui a coincé.

## 2026-09-16 — Démarrage
- Catalogue : la page publique du catalogue Token Factory se rend côté client, impossible à lire sans navigateur ; les identifiants de modèles ont dû être vérifiés via les billets de blog Nebius et la fiche NVIDIA. Une page statique listant les IDs exacts ferait gagner du temps.
- Architecture retenue : Nano Omni (vision + audio) → Nano 30B (extraction JSON) → Ultra 550B (jugement), repli Super 120B. Un seul client OpenAI-compatible pour les quatre.

## 2026-09-16 — Premier pipeline bout en bout
- **Identifiants de modèles** : ceux de la doc marketing ne sont pas ceux de l'API. Réels via `GET /models` : `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B`, `nvidia/nemotron-3-super-120b-a12b`, `nvidia/Nemotron-3-Ultra-550b-a55b`, `nvidia/Nemotron-3_5-Lightning`. La casse varie d'un modèle à l'autre.
- **Aucun Nemotron n'accepte d'image sur Token Factory** (`400 This model does not support image input` pour Nano, Super, Ultra, Lightning). Nano Omni et Nano 2 VL, annoncés sur le blog, sont absents du catalogue (23 modèles). Argus utilise `openbmb/MiniCPM-V-4_5` pour la perception (0,9-2 s par photo, correct) et garde Nemotron pour l'extraction et le jugement.
- **Raisonnement Nemotron** : renvoyé dans un champ `message.reasoning` non standard (pas dans `content`), pratique pour l'afficher. En mode thinking, Nano 30B *agrège* des données tabulaires (14 relevés → 3) ; `chat_template_kwargs: {enable_thinking: false}` (paramètre vLLM, transmis tel quel) rétablit la transcription fidèle et divise la latence par deux. `reasoning_effort: "none"` est accepté mais renvoie un `content` vide.
- **Ultra 550B** : 29-45 s pour un jugement de ~5 k tokens d'entrée, 100 % de disponibilité sur 4 appels. Le repli Super n'a pas été nécessaire.
- **Fiabilité métier** : Nano a inversé la logique de conformité sur les températures négatives (−19 °C jugé non conforme à ≤ −18 °C). Leçon générale : les modèles extraient, le code décide (limites et verdicts dans `src/lib/rules/`).
- Les modèles renvoient `null` pour les champs optionnels : schémas zod en `.nullish()` obligatoires.
