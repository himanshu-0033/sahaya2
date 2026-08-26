// The questionnaire list the reading section renders from.
//
// GENERATED from backend/lib/instruments.js — do not hand-edit. Regenerate with:
//   npm run sync:tests
//
// It exists so the reading section stays a pure static bundle: the Tests tab
// fetches this same information from /api/assessments because it also needs
// scoring, but an explainer page has nothing to score and should not need a
// server to render. backend/test/test-notes.test.mjs fails if this file drifts
// out of step with the instruments it was generated from.

export const TEST_INDEX = [
  {
    "id": "asq",
    "name": "ASQ",
    "fullName": "Ask Suicide-Screening Questions",
    "domain": "Safety",
    "itemCount": 4,
    "minutes": 1,
    "wordingVerified": false
  },
  {
    "id": "c-ssrs",
    "name": "C-SSRS",
    "fullName": "Columbia-Suicide Severity Rating Scale (Screener)",
    "domain": "Safety",
    "itemCount": 6,
    "minutes": 2,
    "wordingVerified": false
  },
  {
    "id": "phq-9",
    "name": "PHQ-9",
    "fullName": "Patient Health Questionnaire-9",
    "domain": "Mood",
    "itemCount": 9,
    "minutes": 3,
    "wordingVerified": true
  },
  {
    "id": "gad-7",
    "name": "GAD-7",
    "fullName": "Generalised Anxiety Disorder-7",
    "domain": "Anxiety",
    "itemCount": 7,
    "minutes": 2,
    "wordingVerified": true
  },
  {
    "id": "k10",
    "name": "K10",
    "fullName": "Kessler Psychological Distress Scale",
    "domain": "General distress",
    "itemCount": 10,
    "minutes": 3,
    "wordingVerified": true
  },
  {
    "id": "who-5",
    "name": "WHO-5",
    "fullName": "WHO-5 Well-Being Index",
    "domain": "Wellbeing",
    "itemCount": 5,
    "minutes": 1,
    "wordingVerified": true
  },
  {
    "id": "pss-10",
    "name": "PSS-10",
    "fullName": "Perceived Stress Scale",
    "domain": "Stress",
    "itemCount": 10,
    "minutes": 3,
    "wordingVerified": true
  },
  {
    "id": "ucla-3",
    "name": "UCLA-3",
    "fullName": "Three-Item Loneliness Scale",
    "domain": "Social",
    "itemCount": 3,
    "minutes": 1,
    "wordingVerified": true
  },
  {
    "id": "mspss",
    "name": "MSPSS",
    "fullName": "Multidimensional Scale of Perceived Social Support",
    "domain": "Social",
    "itemCount": 12,
    "minutes": 3,
    "wordingVerified": true
  },
  {
    "id": "mini-spin",
    "name": "Mini-SPIN",
    "fullName": "Mini Social Phobia Inventory",
    "domain": "Social",
    "itemCount": 3,
    "minutes": 1,
    "wordingVerified": true
  },
  {
    "id": "rses",
    "name": "RSES",
    "fullName": "Rosenberg Self-Esteem Scale",
    "domain": "Self",
    "itemCount": 10,
    "minutes": 2,
    "wordingVerified": true
  },
  {
    "id": "brs",
    "name": "BRS",
    "fullName": "Brief Resilience Scale",
    "domain": "Strengths",
    "itemCount": 6,
    "minutes": 1,
    "wordingVerified": true
  },
  {
    "id": "gse-10",
    "name": "GSE-10",
    "fullName": "General Self-Efficacy Scale",
    "domain": "Strengths",
    "itemCount": 10,
    "minutes": 2,
    "wordingVerified": true
  },
  {
    "id": "flourishing",
    "name": "Flourishing Scale",
    "fullName": "Diener Flourishing Scale",
    "domain": "Wellbeing",
    "itemCount": 8,
    "minutes": 2,
    "wordingVerified": true
  },
  {
    "id": "cbi-personal",
    "name": "CBI (personal)",
    "fullName": "Copenhagen Burnout Inventory — personal burnout",
    "domain": "Burnout",
    "itemCount": 6,
    "minutes": 2,
    "wordingVerified": true
  },
  {
    "id": "ais-8",
    "name": "AIS-8",
    "fullName": "Athens Insomnia Scale",
    "domain": "Sleep",
    "itemCount": 8,
    "minutes": 2,
    "wordingVerified": true
  },
  {
    "id": "sas-sv",
    "name": "SAS-SV",
    "fullName": "Smartphone Addiction Scale — Short Version",
    "domain": "Habits",
    "itemCount": 10,
    "minutes": 2,
    "wordingVerified": true
  },
  {
    "id": "audit-c",
    "name": "AUDIT-C",
    "fullName": "Alcohol Use Disorders Identification Test — Consumption",
    "domain": "Habits",
    "itemCount": 3,
    "minutes": 1,
    "wordingVerified": true
  },
  {
    "id": "phq-15",
    "name": "PHQ-15",
    "fullName": "Patient Health Questionnaire-15 (Somatic Symptom Scale)",
    "domain": "Body",
    "itemCount": 15,
    "minutes": 3,
    "wordingVerified": false
  },
  {
    "id": "pc-ptsd-5",
    "name": "PC-PTSD-5",
    "fullName": "Primary Care PTSD Screen for DSM-5",
    "domain": "Trauma",
    "itemCount": 5,
    "minutes": 1,
    "wordingVerified": false
  },
  {
    "id": "scoff",
    "name": "SCOFF",
    "fullName": "SCOFF Eating Disorder Screening Questionnaire",
    "domain": "Eating",
    "itemCount": 5,
    "minutes": 1,
    "wordingVerified": false
  },
  {
    "id": "bsmas",
    "name": "BSMAS",
    "fullName": "Bergen Social Media Addiction Scale",
    "domain": "Habits",
    "itemCount": 6,
    "minutes": 2,
    "wordingVerified": false
  },
  {
    "id": "scs-sf",
    "name": "SCS-SF",
    "fullName": "Self-Compassion Scale — Short Form",
    "domain": "Strengths",
    "itemCount": 12,
    "minutes": 3,
    "wordingVerified": false
  }
];
