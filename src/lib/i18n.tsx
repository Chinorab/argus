"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@/lib/lang";
import type { Grade, Severity, Zone } from "@/lib/schemas";

export type { Lang };

/** UI strings. English is the source of truth; French is offered for operators in the field. */
const STRINGS = {
  en: {
    tagline: "Nemotron on Nebius Token Factory",
    // hero
    heroKicker: "Food-safety inspection, simulated",
    startInspection: "Start an inspection",
    inputPhotos: "Kitchen photos",
    inputVoice: "Voice notes",
    inputLogs: "Temperature logs",
    inputStatement: "Your statement",
    howItWorks: "How it works",
    step1Title: "Perceive",
    step1Text: "Every photo is read like an inspector would: zone, equipment, visible anomalies with a confidence score.",
    step2Title: "Extract and decide",
    step2Text: "Temperature logs are transcribed, then a rule engine applies the legal limits and spots persistent drift. No model decides a verdict.",
    step3Title: "Judge",
    step3Text: "Nemotron Ultra cross-checks every finding against the official inspection grid and the regulation, and predicts the public grade.",
    whatYouGet: "What you get",
    get1Title: "Your predicted Alim'confiance grade",
    get1Text: "The four-level public grade the inspection would publish, with the rule that led to it and the closure risk.",
    get2Title: "Findings with evidence",
    get2Text: "Each non-compliance cites the grid point, the text, the proof (photo, reading, voice note) and the deadline.",
    get3Title: "Your food safety plan",
    get3Text: "A PMS written for your kitchen: hygiene practices, HACCP flow with control points, records, and a 30-day action plan.",
    scrollToForm: "Start below — three photos are enough for a first run.",
    footerBuilt: "Built for the Nebius × NVIDIA Global AI Hackathon.",
    footerModels: "NVIDIA Nemotron 3 Nano, Super and Ultra on Nebius Token Factory · MiniCPM-V for vision",
    footerDisclaimer: "Simulation for self-assessment. Not an official inspection.",
    zoneMap: "Kitchen map",
    zoneMapHint: "Findings by zone — the worst severity colours the tile.",
    noFindingsZone: "no finding",
    evidencePhotos: "Photo evidence",
    // capture
    newInspection: "New inspection",
    heroA: "What the inspector will see tomorrow,",
    heroB: "seen today.",
    heroText: "Photograph the kitchen, paste your temperature logs, describe the situation. Argus simulates the food-safety inspection and predicts your Alim'confiance grade.",
    tryDemo: "Try with a demo case file",
    tryDemoClean: "Well-run kitchen",
    tryDemoProblem: "Kitchen with problems",
    demoHint: "Two demo kitchens, two verdicts — see how the judge tells them apart.",
    establishment: "Establishment",
    establishmentPlaceholder: "e.g. Le Comptoir de Saint-Denis",
    photos: "Kitchen photos",
    photosHint: "fridges, work surfaces, dish area, waste, floors",
    takePhoto: "Take a photo",
    addPhotos: "Add photos",
    compressing: "Compressing…",
    removePhoto: "Remove photo",
    captionPlaceholder: "Caption (e.g. fridge 2, meat)",
    temperatures: "Temperature logs",
    temperaturesPlaceholder: "Paste your logbook, a CSV, or write freely:\nFridge 2 (meat): Mon 6.5, Tue 7.1…",
    statement: "Situation of the establishment",
    statementPlaceholder: "Written food safety plan? Hygiene training? Pest-control contractor? Any equipment causing trouble?",
    pasteExample: "Paste an example",
    voiceNotes: "Voice notes",
    voiceHint: "Say what the photos cannot show: a noisy fridge, a door that does not close, a log kept in a notebook.",
    startRecording: "Record a note",
    stopRecording: "Stop",
    listening: "Listening…",
    speechUnsupported: "Speech recognition is not available in this browser (try Chrome, Edge or Safari) — type your note instead.",
    typeNote: "Type a note",
    notePlaceholder: "e.g. Fridge 2 has been at 7 °C since Tuesday and the door does not close properly",
    addNote: "Add",
    removeNote: "Remove note",
    exampleNote: "Fridge 2 has been at 7 degrees since Tuesday and the door does not close properly, we moved the minced meat to fridge 1 but the deliveries still go into fridge 2.",
    addAtLeastOne: "Add at least one photo.",
    photoCount: (n: number) => `${n} photo${n > 1 ? "s" : ""} · ~1 min analysis`,
    run: "Run the inspection",
    // timeline
    inProgress: "Inspection in progress",
    agentWorking: "The agent is working",
    perception: "Photo perception",
    anomalies: (n: number) => `${n} anomal${n === 1 ? "y" : "ies"}`,
    analysing: "analysing…",
    error: "error",
    structuringNotes: "Structuring the voice notes",
    notesDone: (n: number, f: number, s: string) => `${n} note${n > 1 ? "s" : ""}, ${f} fact${f === 1 ? "" : "s"} extracted · ${s} s`,
    notesRunning: "Cleaning the transcripts and extracting the inspection facts.",
    readingLogs: "Reading the temperature logs",
    noLogs: "No logs provided — the lack of records will be reported.",
    waiting: "Waiting.",
    transcribing: "Transcribing the readings, then applying the limits of the 21/12/2009 order through the rule engine.",
    logsDone: (n: number, bad: number, s: string) => `${n} readings parsed, ${bad} out of range · ${s} s`,
    judgement: "Regulatory judgement",
    judgePending: "Waiting for perception to finish before assembling the case file.",
    judgeRunning: "Cross-checks every finding against the DGAL grid and the texts (EC 852/2004, AM 21/12/2009), qualifies severities, predicts the grade.",
    judgeDone: (s: string) => `Report delivered in ${s} s.`,
    fallback: (m: string) => `Ultra unavailable, falling back to ${m}.`,
    failed: "The inspection failed",
    backToCapture: "Back to capture",
    // report
    reportTitle: "Simulated inspection report",
    judgedBy: "judge",
    predictedGrade: "Predicted Alim'confiance grade",
    closureRisk: "Risk of administrative closure",
    summary: "Inspector's summary",
    findingsOf: (s: string) => `${s} findings`,
    action: "Action",
    deadline: "Deadline",
    risk: "Risk",
    strengths: "Strengths",
    toVerify: "The inspector will also check",
    readings: "Temperature readings analysed",
    equipment: "Equipment",
    date: "Date",
    reading: "Reading",
    limit: "Limit",
    verdict: "Verdict",
    compliant: "compliant",
    outOfRange: "out of range",
    persistentDrift: "persistent drift",
    reasoningOf: (m: string) => `Reasoning of ${m}`,
    tokens: (n: number) => `${n} tokens generated`,
    download: "Download the report (JSON)",
    newOne: "New inspection",
    // pms
    generatePms: "Generate the food safety plan (PMS)",
    generatingPms: "Writing the plan with Nemotron Super 120B…",
    pmsTitle: "Food Safety Management Plan",
    pmsSubtitle: "Plan de Maîtrise Sanitaire — Regulation (EC) 852/2004 art. 5",
    pmsWrittenBy: (m: string, s: string) => `Drafted by ${m} in ${s} s from the inspection findings`,
    profile: "Establishment profile",
    activity: "Activity",
    capacity: "Capacity",
    staffLabel: "Staff",
    productFamilies: "Product families",
    ghp: "Good hygiene practices",
    responsible: "Responsible",
    frequency: "Frequency",
    record: "Record",
    haccp: "HACCP — process flow and critical control points",
    step: "Step",
    hazards: "Hazards",
    ccp: "CCP",
    criticalLimit: "Critical limit",
    monitoring: "Monitoring",
    correctiveAction: "Corrective action",
    recordsTitle: "Records to keep",
    holder: "Holder",
    traceability: "Traceability",
    nonconformity: "Non-compliance procedure",
    recall: "Withdrawal / recall procedure",
    training: "Training plan",
    priorityActions: "Priority action plan",
    addresses: "addresses",
    downloadPdf: "Download PDF",
    pdfHint: "Opens the print dialog — choose “Save as PDF”.",
    printedBy: "Simulated inspection generated by Argus — NVIDIA Nemotron on Nebius Token Factory. Not an official inspection.",
    grade: { very_satisfactory: "Very satisfactory", satisfactory: "Satisfactory", to_improve: "To improve", urgent_correction: "Urgent correction required" } as Record<Grade, string>,
    severity: { minor: "Minor", major: "Major", critical: "Critical" } as Record<Severity, string>,
    severityPlural: { minor: "minor", major: "major", critical: "critical" } as Record<Severity, string>,
    zone: {
      receiving: "Receiving", dry_storage: "Dry storage", cold_storage: "Cold storage", vegetable_prep: "Vegetable prep", cold_prep: "Cold prep", hot_prep: "Hot prep", cooking: "Cooking", dishwashing: "Dishwashing", waste: "Waste", staff_facilities: "Staff facilities", dining_room: "Dining room", outdoor: "Outdoor", general: "General",
    } as Record<Zone, string>,
    deadlineLabel: { immediate: "Immediate", "24h": "Within 24 h", "7d": "Within 7 days", "30d": "Within 30 days" } as Record<string, string>,
    closure: { low: "low", moderate: "moderate", high: "high" } as Record<string, string>,
    exampleTemperatures: `Logs from 14/09 to 16/09
Fridge 1 (dairy): 14/09 am 3.5; pm 4.0; 15/09 am 3.8; pm 4.2; 16/09 am 3.6
Fridge 2 (meat): 14/09 am 6.5; pm 7.1; 15/09 am 7.0; pm 7.4; 16/09 am 6.9
Freezer: 14/09 -19; 15/09 -18.5; 16/09 -17
Bain-marie lunch service 15/09: 58`,
    exampleStatement: `Traditional restaurant, 45 seats, 3 kitchen staff. The owner completed the 14-hour hygiene training in 2019.
No written food safety management plan (PMS). Temperatures are logged "when we think of it" in a notebook.
Cleaning done every evening but no written plan. Pest-control contract in place.
Fridge 2 has been noisy for a week and its door does not close properly.`,
  },
  fr: {
    tagline: "Nemotron sur Nebius Token Factory",
    heroKicker: "Inspection sanitaire, simulée",
    startInspection: "Commencer une inspection",
    inputPhotos: "Photos de la cuisine",
    inputVoice: "Notes vocales",
    inputLogs: "Relevés de température",
    inputStatement: "Votre déclaratif",
    howItWorks: "Comment ça marche",
    step1Title: "Percevoir",
    step1Text: "Chaque photo est lue comme le ferait un inspecteur : zone, équipements, anomalies visibles avec un score de confiance.",
    step2Title: "Extraire et décider",
    step2Text: "Les relevés sont transcrits, puis un moteur de règles applique les limites légales et détecte les dérives persistantes. Aucun modèle ne décide d'un verdict.",
    step3Title: "Juger",
    step3Text: "Nemotron Ultra confronte chaque constat à la grille d'inspection officielle et à la réglementation, et prédit la note publique.",
    whatYouGet: "Ce que vous obtenez",
    get1Title: "Votre note Alim'confiance prédite",
    get1Text: "La note publique à quatre niveaux que l'inspection publierait, avec la règle qui y conduit et le risque de fermeture.",
    get2Title: "Des constats prouvés",
    get2Text: "Chaque non-conformité cite le point de grille, le texte, la preuve (photo, relevé, note vocale) et le délai.",
    get3Title: "Votre plan de maîtrise sanitaire",
    get3Text: "Un PMS écrit pour votre cuisine : bonnes pratiques, diagramme HACCP avec points critiques, enregistrements et plan d'actions à 30 jours.",
    scrollToForm: "Commencez ci-dessous — trois photos suffisent pour un premier essai.",
    footerBuilt: "Construit pour le Nebius × NVIDIA Global AI Hackathon.",
    footerModels: "NVIDIA Nemotron 3 Nano, Super et Ultra sur Nebius Token Factory · MiniCPM-V pour la vision",
    footerDisclaimer: "Simulation d'auto-évaluation. Ceci n'est pas une inspection officielle.",
    zoneMap: "Carte de la cuisine",
    zoneMapHint: "Constats par zone — la pire sévérité colore la tuile.",
    noFindingsZone: "aucun constat",
    evidencePhotos: "Photos-preuves",
    newInspection: "Nouvelle inspection",
    heroA: "Ce que l'inspecteur verra demain,",
    heroB: "vu aujourd'hui.",
    heroText: "Photographiez la cuisine, collez vos relevés de température, décrivez la situation. Argus simule l'inspection DDPP et prédit votre note Alim'confiance.",
    tryDemo: "Essayer avec un dossier de démonstration",
    tryDemoClean: "Cuisine bien tenue",
    tryDemoProblem: "Cuisine à problèmes",
    demoHint: "Deux cuisines de démonstration, deux verdicts — voyez comment le juge les distingue.",
    establishment: "Établissement",
    establishmentPlaceholder: "Ex. Le Comptoir de Saint-Denis",
    photos: "Photos de la cuisine",
    photosHint: "frigos, plans de travail, plonge, déchets, sols",
    takePhoto: "Prendre une photo",
    addPhotos: "Ajouter des photos",
    compressing: "Compression…",
    removePhoto: "Retirer la photo",
    captionPlaceholder: "Légende (ex. frigo 2 viandes)",
    temperatures: "Relevés de température",
    temperaturesPlaceholder: "Collez votre cahier, un CSV ou écrivez librement :\nFrigo 2 (viandes) : lundi 6.5, mardi 7.1…",
    statement: "Situation de l'établissement",
    statementPlaceholder: "PMS écrit ? Formation hygiène ? Prestataire nuisibles ? Un équipement qui pose problème ?",
    pasteExample: "Coller un exemple",
    voiceNotes: "Notes vocales",
    voiceHint: "Dites ce que les photos ne montrent pas : un frigo bruyant, une porte qui ferme mal, un cahier tenu à la main.",
    startRecording: "Enregistrer une note",
    stopRecording: "Arrêter",
    listening: "À l'écoute…",
    speechUnsupported: "La reconnaissance vocale n'est pas disponible dans ce navigateur (essayez Chrome, Edge ou Safari) — tapez votre note.",
    typeNote: "Écrire une note",
    notePlaceholder: "ex. Le frigo 2 est à 7 °C depuis mardi et la porte ferme mal",
    addNote: "Ajouter",
    removeNote: "Retirer la note",
    exampleNote: "Le frigo 2 est à 7 degrés depuis mardi et la porte ferme mal, on a déplacé la viande hachée dans le frigo 1 mais les livraisons vont toujours dans le frigo 2.",
    addAtLeastOne: "Ajoutez au moins une photo.",
    photoCount: (n: number) => `${n} photo${n > 1 ? "s" : ""} · ~1 min d'analyse`,
    run: "Lancer l'inspection",
    inProgress: "Inspection en cours",
    agentWorking: "L'agent travaille",
    perception: "Perception des photos",
    anomalies: (n: number) => `${n} anomalie${n === 1 ? "" : "s"}`,
    analysing: "analyse…",
    error: "erreur",
    structuringNotes: "Structuration des notes vocales",
    notesDone: (n: number, f: number, s: string) => `${n} note${n > 1 ? "s" : ""}, ${f} fait${f > 1 ? "s" : ""} extrait${f > 1 ? "s" : ""} · ${s} s`,
    notesRunning: "Nettoyage des transcriptions et extraction des faits utiles à l'inspection.",
    readingLogs: "Lecture des relevés de température",
    noLogs: "Aucun relevé fourni — l'absence d'enregistrement sera signalée.",
    waiting: "En attente.",
    transcribing: "Transcription des relevés, puis application des limites de l'arrêté du 21/12/2009 par le moteur de règles.",
    logsDone: (n: number, bad: number, s: string) => `${n} relevés lus, ${bad} hors limite · ${s} s`,
    judgement: "Jugement réglementaire",
    judgePending: "Attend la fin de la perception pour constituer le dossier.",
    judgeRunning: "Confronte chaque constat à la grille DGAL et aux textes (CE 852/2004, AM 21/12/2009), qualifie les sévérités, prédit la note.",
    judgeDone: (s: string) => `Rapport rendu en ${s} s.`,
    fallback: (m: string) => `Ultra indisponible, repli sur ${m}.`,
    failed: "L'inspection a échoué",
    backToCapture: "Revenir à la capture",
    reportTitle: "Rapport d'inspection simulée",
    judgedBy: "juge",
    predictedGrade: "Note Alim'confiance prédite",
    closureRisk: "Risque de fermeture administrative",
    summary: "Synthèse de l'inspecteur",
    findingsOf: (s: string) => `Non-conformités ${s}s`,
    action: "Action",
    deadline: "Délai",
    risk: "Risque",
    strengths: "Points forts",
    toVerify: "L'inspecteur voudra aussi vérifier",
    readings: "Relevés de température analysés",
    equipment: "Équipement",
    date: "Date",
    reading: "Relevé",
    limit: "Limite",
    verdict: "Verdict",
    compliant: "conforme",
    outOfRange: "hors limite",
    persistentDrift: "dérive persistante",
    reasoningOf: (m: string) => `Raisonnement de ${m}`,
    tokens: (n: number) => `${n} tokens générés`,
    download: "Télécharger le rapport (JSON)",
    newOne: "Nouvelle inspection",
    generatePms: "Générer le plan de maîtrise sanitaire (PMS)",
    generatingPms: "Rédaction du plan avec Nemotron Super 120B…",
    pmsTitle: "Plan de maîtrise sanitaire",
    pmsSubtitle: "Règlement (CE) 852/2004 art. 5",
    pmsWrittenBy: (m: string, s: string) => `Rédigé par ${m} en ${s} s à partir des constats de l'inspection`,
    profile: "Profil de l'établissement",
    activity: "Activité",
    capacity: "Capacité",
    staffLabel: "Personnel",
    productFamilies: "Familles de produits",
    ghp: "Bonnes pratiques d'hygiène",
    responsible: "Responsable",
    frequency: "Fréquence",
    record: "Enregistrement",
    haccp: "HACCP — diagramme de fabrication et points critiques",
    step: "Étape",
    hazards: "Dangers",
    ccp: "CCP",
    criticalLimit: "Limite critique",
    monitoring: "Surveillance",
    correctiveAction: "Action corrective",
    recordsTitle: "Enregistrements à tenir",
    holder: "Détenteur",
    traceability: "Traçabilité",
    nonconformity: "Procédure de non-conformité",
    recall: "Procédure de retrait / rappel",
    training: "Plan de formation",
    priorityActions: "Plan d'actions prioritaires",
    addresses: "traite",
    downloadPdf: "Télécharger en PDF",
    pdfHint: "Ouvre la boîte d'impression — choisissez « Enregistrer en PDF ».",
    printedBy: "Inspection simulée générée par Argus — NVIDIA Nemotron sur Nebius Token Factory. Ceci n'est pas une inspection officielle.",
    grade: { very_satisfactory: "Très satisfaisant", satisfactory: "Satisfaisant", to_improve: "À améliorer", urgent_correction: "À corriger de manière urgente" } as Record<Grade, string>,
    severity: { minor: "Mineure", major: "Majeure", critical: "Critique" } as Record<Severity, string>,
    severityPlural: { minor: "mineure", major: "majeure", critical: "critique" } as Record<Severity, string>,
    zone: {
      receiving: "Réception", dry_storage: "Stockage sec", cold_storage: "Stockage froid", vegetable_prep: "Légumerie", cold_prep: "Préparation froide", hot_prep: "Préparation chaude", cooking: "Cuisson", dishwashing: "Plonge", waste: "Déchets", staff_facilities: "Vestiaires / sanitaires", dining_room: "Salle", outdoor: "Extérieur", general: "Général",
    } as Record<Zone, string>,
    deadlineLabel: { immediate: "Immédiat", "24h": "Sous 24 h", "7d": "Sous 7 jours", "30d": "Sous 30 jours" } as Record<string, string>,
    closure: { low: "faible", moderate: "modéré", high: "élevé" } as Record<string, string>,
    exampleTemperatures: `Relevés du 14/09 au 16/09
Frigo 1 (produits laitiers) : 14/09 matin 3.5 ; soir 4.0 ; 15/09 matin 3.8 ; soir 4.2 ; 16/09 matin 3.6
Frigo 2 (viandes) : 14/09 matin 6.5 ; soir 7.1 ; 15/09 matin 7.0 ; soir 7.4 ; 16/09 matin 6.9
Congélateur : 14/09 -19 ; 15/09 -18.5 ; 16/09 -17
Bain-marie service midi 15/09 : 58`,
    exampleStatement: `Restaurant traditionnel 45 couverts, 3 salariés en cuisine. Formation hygiène 14 h suivie par le gérant en 2019.
Pas de plan de maîtrise sanitaire écrit. Températures relevées « quand on y pense » sur un cahier.
Nettoyage chaque soir sans plan écrit. Contrat dératisation en cours.
Le frigo 2 fait du bruit depuis une semaine et la porte ferme mal.`,
  },
} as const;

export type Strings = (typeof STRINGS)["en"];

/** Tailwind colour class per Alim'confiance level. */
export const GRADE_COLOR: Record<Grade, string> = {
  very_satisfactory: "bg-n1",
  satisfactory: "bg-n2",
  to_improve: "bg-n3",
  urgent_correction: "bg-n4",
};
export const GRADE_ORDER: Grade[] = ["very_satisfactory", "satisfactory", "to_improve", "urgent_correction"];
export const SEVERITY_COLOR: Record<Severity, string> = {
  minor: "bg-sev-minor",
  major: "bg-sev-major",
  critical: "bg-sev-critical",
};
export const SEVERITY_ORDER: Severity[] = ["critical", "major", "minor"];

/** Short display name of a model id. */
export function shortModel(id: string): string {
  if (/ultra/i.test(id)) return "Nemotron 3 Ultra 550B";
  if (/super/i.test(id)) return "Nemotron 3 Super 120B";
  if (/nano/i.test(id)) return "Nemotron 3 Nano 30B";
  if (/minicpm/i.test(id)) return "MiniCPM-V 4.5";
  return id.split("/").pop() ?? id;
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("argus.lang");
      if (saved === "fr" || saved === "en") setTimeout(() => setLangState(saved), 0);
    } catch {}
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("argus.lang", l);
    } catch {}
    document.documentElement.lang = l;
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT(): Strings {
  return STRINGS[useLang().lang] as Strings;
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full border border-line p-0.5 text-[11px] font-medium">
      {(["en", "fr"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2 py-0.5 uppercase transition ${lang === l ? "bg-ink text-paper" : "text-ink-3 hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
