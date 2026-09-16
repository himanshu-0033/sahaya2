// The questionnaire list the reading section renders from.
//
// GENERATED from backend/lib/instruments.js. Do not hand-edit. Regenerate with:
//   npm run sync:tests
//
// It exists so the reading section stays a pure static bundle: the Tests tab
// fetches this same information from /api/assessments because it also needs
// scoring, but an explainer page has nothing to score and should not need a
// server to render. backend/test/test-notes.test.mjs fails if this file drifts
// out of step with the instruments it was generated from.
//
// `items` is null for an instrument the app does not serve, because the reason
// it is not served is that the licence to reproduce it has not come back.

export const TEST_INDEX = [
  {
    "id": "asq",
    "name": "ASQ",
    "fullName": "Ask Suicide-Screening Questions",
    "domain": "Safety",
    "itemCount": 4,
    "minutes": 1,
    "wordingVerified": false,
    "available": true,
    "blurb": "Four direct questions about thoughts of suicide. Takes a minute.",
    "license": "Public domain (developed by the U.S. National Institute of Mental Health; free to use, no permission needed)",
    "citation": "Horowitz et al. (2012), Arch Pediatr Adolesc Med 166(12):1170-6",
    "prompt": "Answer yes or no. Being asked these questions does not plant the idea.",
    "options": [
      {
        "value": 0,
        "label": "No"
      },
      {
        "value": 1,
        "label": "Yes"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [
      0,
      1,
      2,
      3
    ],
    "items": [
      {
        "text": "In the past few weeks, have you wished you were dead?"
      },
      {
        "text": "In the past few weeks, have you felt that you or your family would be better off if you were dead?"
      },
      {
        "text": "In the past week, have you been having thoughts about killing yourself?"
      },
      {
        "text": "Have you ever tried to kill yourself?"
      }
    ],
    "bands": [
      {
        "max": 0,
        "label": "No screen triggered",
        "note": "You answered no to all four. Nothing here needs acting on today, and this screen is here any time that changes."
      },
      {
        "max": 4,
        "label": "Positive screen",
        "note": "At least one yes. This is not a diagnosis and it is not a verdict on you. It means the right next step is a conversation with a counsellor, soon."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "c-ssrs",
    "name": "C-SSRS",
    "fullName": "Columbia-Suicide Severity Rating Scale (Screener)",
    "domain": "Safety",
    "itemCount": 6,
    "minutes": 2,
    "wordingVerified": false,
    "available": false,
    "blurb": "The Columbia protocol. Six questions, and it stops early if it can.",
    "license": "© Research Foundation for Mental Hygiene, Inc. Free for non-profit, healthcare and research use, but permission must be requested from the Columbia Lighthouse Project (cssrs.columbia.edu) first",
    "citation": "Posner et al. (2011), Am J Psychiatry 168(12):1266-77",
    "prompt": "Answer yes or no. Some of these ask about the past month, one about your whole life.",
    "options": [
      {
        "value": 0,
        "label": "No"
      },
      {
        "value": 1,
        "label": "Yes"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [
      0,
      1,
      2,
      3,
      4,
      5
    ],
    "items": null,
    "bands": [
      {
        "when": [],
        "label": "No screen triggered",
        "note": "You answered no throughout. Nothing here needs acting on today, and this is here any time that changes."
      },
      {
        "when": [
          {
            "items": [
              0,
              1
            ]
          }
        ],
        "label": "Low risk",
        "note": "Thoughts, without a plan or intent behind them. That is worth telling a counsellor about. It is also very common and very survivable."
      },
      {
        "when": [
          {
            "items": [
              2
            ]
          },
          {
            "items": [
              5
            ]
          }
        ],
        "label": "Moderate risk",
        "note": "Either you have thought about how, or something has happened in the past. Please speak to a counsellor about this rather than carrying it alone."
      },
      {
        "when": [
          {
            "items": [
              3,
              4
            ]
          },
          {
            "items": [
              5
            ],
            "followUp": 1
          }
        ],
        "crisisLevel": "acute",
        "label": "High risk",
        "note": "This level means intent, a worked-out plan, or something recent. Please do not wait for an appointment. Talk to someone today, using the numbers on this screen."
      }
    ],
    "reportsBandOnly": true
  },
  {
    "id": "phq-9",
    "name": "PHQ-9",
    "fullName": "Patient Health Questionnaire-9",
    "domain": "Mood",
    "itemCount": 9,
    "minutes": 3,
    "wordingVerified": true,
    "available": true,
    "blurb": "Depression symptoms over the last two weeks.",
    "license": "Public domain (Pfizer released the PHQ family for free use)",
    "citation": "Kroenke, Spitzer & Williams (2001), J Gen Intern Med 16(9):606-13",
    "prompt": "Over the last 2 weeks, how often have you been bothered by the following?",
    "options": [
      {
        "value": 0,
        "label": "Not at all"
      },
      {
        "value": 1,
        "label": "Several days"
      },
      {
        "value": 2,
        "label": "More than half the days"
      },
      {
        "value": 3,
        "label": "Nearly every day"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [
      8
    ],
    "items": [
      {
        "text": "Little interest or pleasure in doing things"
      },
      {
        "text": "Feeling down, depressed, or hopeless"
      },
      {
        "text": "Trouble falling or staying asleep, or sleeping too much"
      },
      {
        "text": "Feeling tired or having little energy"
      },
      {
        "text": "Poor appetite or overeating"
      },
      {
        "text": "Feeling bad about yourself — or that you are a failure or have let yourself or your family down"
      },
      {
        "text": "Trouble concentrating on things, such as reading the newspaper or watching television"
      },
      {
        "text": "Moving or speaking so slowly that other people could have noticed — or being so fidgety or restless that you have been moving around a lot more than usual"
      },
      {
        "text": "Thoughts that you would be better off dead or of hurting yourself in some way"
      }
    ],
    "bands": [
      {
        "max": 4,
        "label": "Minimal",
        "note": "Few or no depression symptoms reported."
      },
      {
        "max": 9,
        "label": "Mild",
        "note": "Some symptoms. Worth watching over the next few weeks."
      },
      {
        "max": 14,
        "label": "Moderate",
        "note": "Symptoms that usually warrant a conversation with a counsellor."
      },
      {
        "max": 19,
        "label": "Moderately severe",
        "note": "A level at which professional support is normally recommended."
      },
      {
        "max": 27,
        "label": "Severe",
        "note": "Please speak to a counsellor or doctor about this."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "gad-7",
    "name": "GAD-7",
    "fullName": "Generalised Anxiety Disorder-7",
    "domain": "Anxiety",
    "itemCount": 7,
    "minutes": 2,
    "wordingVerified": true,
    "available": true,
    "blurb": "Anxiety symptoms over the last two weeks.",
    "license": "Public domain (Pfizer released the PHQ family for free use)",
    "citation": "Spitzer, Kroenke, Williams & Löwe (2006), Arch Intern Med 166(10):1092-7",
    "prompt": "Over the last 2 weeks, how often have you been bothered by the following?",
    "options": [
      {
        "value": 0,
        "label": "Not at all"
      },
      {
        "value": 1,
        "label": "Several days"
      },
      {
        "value": 2,
        "label": "More than half the days"
      },
      {
        "value": 3,
        "label": "Nearly every day"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "Feeling nervous, anxious, or on edge"
      },
      {
        "text": "Not being able to stop or control worrying"
      },
      {
        "text": "Worrying too much about different things"
      },
      {
        "text": "Trouble relaxing"
      },
      {
        "text": "Being so restless that it is hard to sit still"
      },
      {
        "text": "Becoming easily annoyed or irritable"
      },
      {
        "text": "Feeling afraid, as if something awful might happen"
      }
    ],
    "bands": [
      {
        "max": 4,
        "label": "Minimal",
        "note": "Little anxiety reported."
      },
      {
        "max": 9,
        "label": "Mild",
        "note": "Some anxiety. Often manageable with routine and rest."
      },
      {
        "max": 14,
        "label": "Moderate",
        "note": "Worth talking through with a counsellor."
      },
      {
        "max": 21,
        "label": "Severe",
        "note": "A level at which professional support is normally recommended."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "k10",
    "name": "K10",
    "fullName": "Kessler Psychological Distress Scale",
    "domain": "General distress",
    "itemCount": 10,
    "minutes": 3,
    "wordingVerified": true,
    "available": true,
    "blurb": "Overall psychological distress in the past month.",
    "license": "Free to use (Kessler & Mroczek; widely reproduced in public health)",
    "citation": "Kessler et al. (2002), Psychol Med 32(6):959-76",
    "prompt": "In the past 4 weeks, about how often did you feel…",
    "options": [
      {
        "value": 1,
        "label": "None of the time"
      },
      {
        "value": 2,
        "label": "A little of the time"
      },
      {
        "value": 3,
        "label": "Some of the time"
      },
      {
        "value": 4,
        "label": "Most of the time"
      },
      {
        "value": 5,
        "label": "All of the time"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "…tired out for no good reason?"
      },
      {
        "text": "…nervous?"
      },
      {
        "text": "…so nervous that nothing could calm you down?"
      },
      {
        "text": "…hopeless?"
      },
      {
        "text": "…restless or fidgety?"
      },
      {
        "text": "…so restless that you could not sit still?"
      },
      {
        "text": "…depressed?"
      },
      {
        "text": "…that everything was an effort?"
      },
      {
        "text": "…so sad that nothing could cheer you up?"
      },
      {
        "text": "…worthless?"
      }
    ],
    "bands": [
      {
        "max": 19,
        "label": "Low distress",
        "note": "In the range most people report."
      },
      {
        "max": 24,
        "label": "Moderate distress",
        "note": "Higher than typical. Worth keeping an eye on."
      },
      {
        "max": 29,
        "label": "High distress",
        "note": "Worth talking through with a counsellor."
      },
      {
        "max": 50,
        "label": "Very high distress",
        "note": "A level at which professional support is normally recommended."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "who-5",
    "name": "WHO-5",
    "fullName": "WHO-5 Well-Being Index",
    "domain": "Wellbeing",
    "itemCount": 5,
    "minutes": 1,
    "wordingVerified": true,
    "available": true,
    "blurb": "How well the last two weeks have actually felt.",
    "license": "Free to use with attribution (WHO Collaborating Centre, Denmark)",
    "citation": "Topp et al. (2015), Psychother Psychosom 84(3):167-76",
    "prompt": "Over the last 2 weeks…",
    "options": [
      {
        "value": 0,
        "label": "At no time"
      },
      {
        "value": 1,
        "label": "Some of the time"
      },
      {
        "value": 2,
        "label": "Less than half the time"
      },
      {
        "value": 3,
        "label": "More than half the time"
      },
      {
        "value": 4,
        "label": "Most of the time"
      },
      {
        "value": 5,
        "label": "All of the time"
      }
    ],
    "higherIsBetter": true,
    "crisisItems": [],
    "items": [
      {
        "text": "I have felt cheerful and in good spirits"
      },
      {
        "text": "I have felt calm and relaxed"
      },
      {
        "text": "I have felt active and vigorous"
      },
      {
        "text": "I woke up feeling fresh and rested"
      },
      {
        "text": "My daily life has been filled with things that interest me"
      }
    ],
    "bands": [
      {
        "max": 28,
        "label": "Low wellbeing",
        "note": "A score at or below 28 is the usual cue to screen for depression."
      },
      {
        "max": 50,
        "label": "Below average",
        "note": "Lower than typical. Small daily changes tend to move this most."
      },
      {
        "max": 75,
        "label": "Moderate",
        "note": "A fairly ordinary fortnight."
      },
      {
        "max": 100,
        "label": "Good",
        "note": "A good stretch, worth noticing what helped."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "pss-10",
    "name": "PSS-10",
    "fullName": "Perceived Stress Scale",
    "domain": "Stress",
    "itemCount": 10,
    "minutes": 3,
    "wordingVerified": true,
    "available": true,
    "blurb": "How unpredictable and overloaded the last month has felt.",
    "license": "Free for research and teaching; commercial use needs the author’s permission",
    "citation": "Cohen, Kamarck & Mermelstein (1983), J Health Soc Behav 24(4):385-96",
    "prompt": "In the last month, how often have you…",
    "options": [
      {
        "value": 0,
        "label": "Never"
      },
      {
        "value": 1,
        "label": "Almost never"
      },
      {
        "value": 2,
        "label": "Sometimes"
      },
      {
        "value": 3,
        "label": "Fairly often"
      },
      {
        "value": 4,
        "label": "Very often"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "…been upset because of something that happened unexpectedly?"
      },
      {
        "text": "…felt that you were unable to control the important things in your life?"
      },
      {
        "text": "…felt nervous and stressed?"
      },
      {
        "text": "…felt confident about your ability to handle your personal problems?",
        "reverse": true
      },
      {
        "text": "…felt that things were going your way?",
        "reverse": true
      },
      {
        "text": "…found that you could not cope with all the things that you had to do?"
      },
      {
        "text": "…been able to control irritations in your life?",
        "reverse": true
      },
      {
        "text": "…felt that you were on top of things?",
        "reverse": true
      },
      {
        "text": "…been angered because of things that were outside of your control?"
      },
      {
        "text": "…felt difficulties were piling up so high that you could not overcome them?"
      }
    ],
    "bands": [
      {
        "max": 13,
        "label": "Low stress",
        "note": "Within the range most people report."
      },
      {
        "max": 26,
        "label": "Moderate stress",
        "note": "A normal load, but one worth managing deliberately."
      },
      {
        "max": 40,
        "label": "High stress",
        "note": "A heavy month. Worth talking about what could come off the pile."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "ucla-3",
    "name": "UCLA-3",
    "fullName": "Three-Item Loneliness Scale",
    "domain": "Social",
    "itemCount": 3,
    "minutes": 1,
    "wordingVerified": true,
    "available": true,
    "blurb": "How connected you feel to the people around you.",
    "license": "Free to use",
    "citation": "Hughes, Waite, Hawkley & Cacioppo (2004), Res Aging 26(6):655-72",
    "prompt": "How often do you feel…",
    "options": [
      {
        "value": 1,
        "label": "Hardly ever"
      },
      {
        "value": 2,
        "label": "Some of the time"
      },
      {
        "value": 3,
        "label": "Often"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "…that you lack companionship?"
      },
      {
        "text": "…left out?"
      },
      {
        "text": "…isolated from others?"
      }
    ],
    "bands": [
      {
        "max": 5,
        "label": "Not lonely",
        "note": "Connection looks steady."
      },
      {
        "max": 9,
        "label": "Lonely",
        "note": "A score of 6 or more is the usual cut-off for loneliness."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "mspss",
    "name": "MSPSS",
    "fullName": "Multidimensional Scale of Perceived Social Support",
    "domain": "Social",
    "itemCount": 12,
    "minutes": 3,
    "wordingVerified": true,
    "available": true,
    "blurb": "Support you feel you have from family, friends, and someone special.",
    "license": "Free to use",
    "citation": "Zimet, Dahlem, Zimet & Farley (1988), J Pers Assess 52(1):30-41",
    "prompt": "How strongly do you agree?",
    "options": [
      {
        "value": 1,
        "label": "Very strongly disagree"
      },
      {
        "value": 2,
        "label": "Strongly disagree"
      },
      {
        "value": 3,
        "label": "Mildly disagree"
      },
      {
        "value": 4,
        "label": "Neutral"
      },
      {
        "value": 5,
        "label": "Mildly agree"
      },
      {
        "value": 6,
        "label": "Strongly agree"
      },
      {
        "value": 7,
        "label": "Very strongly agree"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "There is a special person who is around when I am in need"
      },
      {
        "text": "There is a special person with whom I can share my joys and sorrows"
      },
      {
        "text": "My family really tries to help me"
      },
      {
        "text": "I get the emotional help and support I need from my family"
      },
      {
        "text": "I have a special person who is a real source of comfort to me"
      },
      {
        "text": "My friends really try to help me"
      },
      {
        "text": "I can count on my friends when things go wrong"
      },
      {
        "text": "I can talk about my problems with my family"
      },
      {
        "text": "I have friends with whom I can share my joys and sorrows"
      },
      {
        "text": "There is a special person in my life who cares about my feelings"
      },
      {
        "text": "My family is willing to help me make decisions"
      },
      {
        "text": "I can talk about my problems with my friends"
      }
    ],
    "bands": [
      {
        "max": 2.9,
        "label": "Low support",
        "note": "Few people feel available to you right now."
      },
      {
        "max": 5,
        "label": "Moderate support",
        "note": "Some support, with room to widen it."
      },
      {
        "max": 7,
        "label": "High support",
        "note": "You have people you can reach."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "mini-spin",
    "name": "Mini-SPIN",
    "fullName": "Mini Social Phobia Inventory",
    "domain": "Social",
    "itemCount": 3,
    "minutes": 1,
    "wordingVerified": true,
    "available": true,
    "blurb": "A three-question screen for social anxiety.",
    "license": "Free to use",
    "citation": "Connor, Kobak, Churchill, Katzelnick & Davidson (2001), Depress Anxiety 14(2):137-40",
    "prompt": "How much has this bothered you in the past week?",
    "options": [
      {
        "value": 0,
        "label": "Not at all"
      },
      {
        "value": 1,
        "label": "A little bit"
      },
      {
        "value": 2,
        "label": "Somewhat"
      },
      {
        "value": 3,
        "label": "Very much"
      },
      {
        "value": 4,
        "label": "Extremely"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "Fear of embarrassment causes me to avoid doing things or speaking to people"
      },
      {
        "text": "I avoid activities in which I am the centre of attention"
      },
      {
        "text": "Being embarrassed or looking stupid are among my worst fears"
      }
    ],
    "bands": [
      {
        "max": 5,
        "label": "Below screen cut-off",
        "note": "Social anxiety unlikely on this screen."
      },
      {
        "max": 12,
        "label": "Above screen cut-off",
        "note": "A score of 6 or more suggests social anxiety is worth exploring."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "rses",
    "name": "RSES",
    "fullName": "Rosenberg Self-Esteem Scale",
    "domain": "Self",
    "itemCount": 10,
    "minutes": 2,
    "wordingVerified": true,
    "available": true,
    "blurb": "How you currently regard yourself.",
    "license": "Free to use",
    "citation": "Rosenberg (1965), Society and the Adolescent Self-Image",
    "prompt": "How strongly do you agree?",
    "options": [
      {
        "value": 0,
        "label": "Strongly disagree"
      },
      {
        "value": 1,
        "label": "Disagree"
      },
      {
        "value": 2,
        "label": "Agree"
      },
      {
        "value": 3,
        "label": "Strongly agree"
      }
    ],
    "higherIsBetter": true,
    "crisisItems": [],
    "items": [
      {
        "text": "On the whole, I am satisfied with myself"
      },
      {
        "text": "At times I think I am no good at all",
        "reverse": true
      },
      {
        "text": "I feel that I have a number of good qualities"
      },
      {
        "text": "I am able to do things as well as most other people"
      },
      {
        "text": "I feel I do not have much to be proud of",
        "reverse": true
      },
      {
        "text": "I certainly feel useless at times",
        "reverse": true
      },
      {
        "text": "I feel that I am a person of worth, at least on an equal plane with others"
      },
      {
        "text": "I wish I could have more respect for myself",
        "reverse": true
      },
      {
        "text": "All in all, I am inclined to feel that I am a failure",
        "reverse": true
      },
      {
        "text": "I take a positive attitude toward myself"
      }
    ],
    "bands": [
      {
        "max": 14,
        "label": "Low self-esteem",
        "note": "Below the usual range. Often moves with mood."
      },
      {
        "max": 25,
        "label": "Normal range",
        "note": "Within the range most people report."
      },
      {
        "max": 30,
        "label": "High self-esteem",
        "note": "A steady view of yourself."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "brs",
    "name": "BRS",
    "fullName": "Brief Resilience Scale",
    "domain": "Strengths",
    "itemCount": 6,
    "minutes": 1,
    "wordingVerified": true,
    "available": true,
    "blurb": "How quickly you tend to bounce back.",
    "license": "Free to use",
    "citation": "Smith et al. (2008), Int J Behav Med 15(3):194-200",
    "prompt": "How strongly do you agree?",
    "options": [
      {
        "value": 1,
        "label": "Strongly disagree"
      },
      {
        "value": 2,
        "label": "Disagree"
      },
      {
        "value": 3,
        "label": "Neutral"
      },
      {
        "value": 4,
        "label": "Agree"
      },
      {
        "value": 5,
        "label": "Strongly agree"
      }
    ],
    "higherIsBetter": true,
    "crisisItems": [],
    "items": [
      {
        "text": "I tend to bounce back quickly after hard times"
      },
      {
        "text": "I have a hard time making it through stressful events",
        "reverse": true
      },
      {
        "text": "It does not take me long to recover from a stressful event"
      },
      {
        "text": "It is hard for me to snap back when something bad happens",
        "reverse": true
      },
      {
        "text": "I usually come through difficult times with little trouble"
      },
      {
        "text": "I tend to take a long time to get over set-backs in my life",
        "reverse": true
      }
    ],
    "bands": [
      {
        "max": 2.99,
        "label": "Low resilience",
        "note": "Set-backs are taking a while to shake off right now."
      },
      {
        "max": 4.3,
        "label": "Normal resilience",
        "note": "Within the usual range."
      },
      {
        "max": 5,
        "label": "High resilience",
        "note": "You recover from set-backs quickly."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "gse-10",
    "name": "GSE-10",
    "fullName": "General Self-Efficacy Scale",
    "domain": "Strengths",
    "itemCount": 10,
    "minutes": 2,
    "wordingVerified": true,
    "available": true,
    "blurb": "Your belief that you can handle what comes.",
    "license": "Free to use for research and non-commercial purposes",
    "citation": "Schwarzer & Jerusalem (1995), Measures in Health Psychology",
    "prompt": "How true is this of you?",
    "options": [
      {
        "value": 1,
        "label": "Not at all true"
      },
      {
        "value": 2,
        "label": "Hardly true"
      },
      {
        "value": 3,
        "label": "Moderately true"
      },
      {
        "value": 4,
        "label": "Exactly true"
      }
    ],
    "higherIsBetter": true,
    "crisisItems": [],
    "items": [
      {
        "text": "I can always manage to solve difficult problems if I try hard enough"
      },
      {
        "text": "If someone opposes me, I can find the means and ways to get what I want"
      },
      {
        "text": "It is easy for me to stick to my aims and accomplish my goals"
      },
      {
        "text": "I am confident that I could deal efficiently with unexpected events"
      },
      {
        "text": "Thanks to my resourcefulness, I know how to handle unforeseen situations"
      },
      {
        "text": "I can solve most problems if I invest the necessary effort"
      },
      {
        "text": "I can remain calm when facing difficulties because I can rely on my coping abilities"
      },
      {
        "text": "When I am confronted with a problem, I can usually find several solutions"
      },
      {
        "text": "If I am in trouble, I can usually think of a solution"
      },
      {
        "text": "I can usually handle whatever comes my way"
      }
    ],
    "bands": [
      {
        "max": 19,
        "label": "Low",
        "note": "Confidence in handling demands is low right now."
      },
      {
        "max": 30,
        "label": "Moderate",
        "note": "Within the usual range."
      },
      {
        "max": 40,
        "label": "High",
        "note": "A strong sense that you can meet what comes."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "flourishing",
    "name": "Flourishing Scale",
    "fullName": "Diener Flourishing Scale",
    "domain": "Wellbeing",
    "itemCount": 8,
    "minutes": 2,
    "wordingVerified": true,
    "available": true,
    "blurb": "Purpose, relationships, and self-regard.",
    "license": "Free to use with attribution",
    "citation": "Diener et al. (2010), Soc Indic Res 97(2):143-56",
    "prompt": "How strongly do you agree?",
    "options": [
      {
        "value": 1,
        "label": "Strongly disagree"
      },
      {
        "value": 2,
        "label": "Disagree"
      },
      {
        "value": 3,
        "label": "Slightly disagree"
      },
      {
        "value": 4,
        "label": "Mixed"
      },
      {
        "value": 5,
        "label": "Slightly agree"
      },
      {
        "value": 6,
        "label": "Agree"
      },
      {
        "value": 7,
        "label": "Strongly agree"
      }
    ],
    "higherIsBetter": true,
    "crisisItems": [],
    "items": [
      {
        "text": "I lead a purposeful and meaningful life"
      },
      {
        "text": "My social relationships are supportive and rewarding"
      },
      {
        "text": "I am engaged and interested in my daily activities"
      },
      {
        "text": "I actively contribute to the happiness and well-being of others"
      },
      {
        "text": "I am competent and capable in the activities that are important to me"
      },
      {
        "text": "I am a good person and live a good life"
      },
      {
        "text": "I am optimistic about my future"
      },
      {
        "text": "People respect me"
      }
    ],
    "bands": [
      {
        "max": 31,
        "label": "Low",
        "note": "Meaning and connection feel thin at the moment."
      },
      {
        "max": 47,
        "label": "Moderate",
        "note": "Within the usual range."
      },
      {
        "max": 56,
        "label": "High",
        "note": "A strong sense of purpose and connection."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "cbi-personal",
    "name": "CBI (personal)",
    "fullName": "Copenhagen Burnout Inventory, personal burnout",
    "domain": "Burnout",
    "itemCount": 6,
    "minutes": 2,
    "wordingVerified": true,
    "available": true,
    "blurb": "Physical and emotional exhaustion.",
    "license": "Free to use (public domain, Kristensen et al.)",
    "citation": "Kristensen, Borritz, Villadsen & Christensen (2005), Work & Stress 19(3):192-207",
    "prompt": "How often does this apply to you?",
    "options": [
      {
        "value": 0,
        "label": "Never / almost never"
      },
      {
        "value": 1,
        "label": "Seldom"
      },
      {
        "value": 2,
        "label": "Sometimes"
      },
      {
        "value": 3,
        "label": "Often"
      },
      {
        "value": 4,
        "label": "Always"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "How often do you feel tired?"
      },
      {
        "text": "How often are you physically exhausted?"
      },
      {
        "text": "How often are you emotionally exhausted?"
      },
      {
        "text": "How often do you think: “I can’t take it anymore”?"
      },
      {
        "text": "How often do you feel worn out?"
      },
      {
        "text": "How often do you feel weak and susceptible to illness?"
      }
    ],
    "bands": [
      {
        "max": 49,
        "label": "Low burnout",
        "note": "Energy is holding up."
      },
      {
        "max": 74,
        "label": "Moderate burnout",
        "note": "Running low. Recovery time matters more than effort here."
      },
      {
        "max": 100,
        "label": "High burnout",
        "note": "A level worth taking seriously and talking about."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "ais-8",
    "name": "AIS-8",
    "fullName": "Athens Insomnia Scale",
    "domain": "Sleep",
    "itemCount": 8,
    "minutes": 2,
    "wordingVerified": true,
    "available": true,
    "blurb": "Sleep difficulty over the past month.",
    "license": "Free to use",
    "citation": "Soldatos, Dikeos & Paparrigopoulos (2000), J Psychosom Res 48(6):555-60",
    "prompt": "For the past month, at least three times a week…",
    "options": [
      {
        "value": 0,
        "label": "No problem"
      },
      {
        "value": 1,
        "label": "Slight problem"
      },
      {
        "value": 2,
        "label": "Marked problem"
      },
      {
        "value": 3,
        "label": "Very serious problem"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "Sleep induction — time it takes you to fall asleep after turning the light off"
      },
      {
        "text": "Awakenings during the night"
      },
      {
        "text": "Final awakening earlier than desired"
      },
      {
        "text": "Total sleep duration"
      },
      {
        "text": "Overall quality of sleep"
      },
      {
        "text": "Sense of well-being during the day"
      },
      {
        "text": "Functioning (physical and mental) during the day"
      },
      {
        "text": "Sleepiness during the day"
      }
    ],
    "bands": [
      {
        "max": 5,
        "label": "No insomnia",
        "note": "Sleep looks broadly fine."
      },
      {
        "max": 9,
        "label": "Mild insomnia",
        "note": "A score of 6 or more meets the screening threshold. Sleep timing is usually the first thing to fix."
      },
      {
        "max": 15,
        "label": "Moderate insomnia",
        "note": "Enough disruption to be worth raising with a doctor."
      },
      {
        "max": 24,
        "label": "Severe insomnia",
        "note": "Please talk to a doctor about this. Insomnia this heavy responds well to treatment."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "sas-sv",
    "name": "SAS-SV",
    "fullName": "Smartphone Addiction Scale, Short Version",
    "domain": "Habits",
    "itemCount": 10,
    "minutes": 2,
    "wordingVerified": true,
    "available": true,
    "blurb": "How much your phone use is interfering.",
    "license": "Free to use",
    "citation": "Kwon, Kim, Cho & Yang (2013), PLoS ONE 8(12):e83558",
    "prompt": "How strongly do you agree?",
    "options": [
      {
        "value": 1,
        "label": "Strongly disagree"
      },
      {
        "value": 2,
        "label": "Disagree"
      },
      {
        "value": 3,
        "label": "Weakly disagree"
      },
      {
        "value": 4,
        "label": "Weakly agree"
      },
      {
        "value": 5,
        "label": "Agree"
      },
      {
        "value": 6,
        "label": "Strongly agree"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "Missing planned work due to smartphone use"
      },
      {
        "text": "Having a hard time concentrating in class, while doing assignments, or while working, due to smartphone use"
      },
      {
        "text": "Feeling pain in the wrists or at the back of the neck while using a smartphone"
      },
      {
        "text": "Won’t be able to stand not having a smartphone"
      },
      {
        "text": "Feeling impatient and fretful when I am not holding my smartphone"
      },
      {
        "text": "Having my smartphone in mind even when I am not using it"
      },
      {
        "text": "I will never give up using my smartphone even when my daily life is already greatly affected by it"
      },
      {
        "text": "Constantly checking my smartphone so as not to miss conversations between other people on social media"
      },
      {
        "text": "Using my smartphone longer than I had intended"
      },
      {
        "text": "The people around me tell me that I use my smartphone too much"
      }
    ],
    "bands": [
      {
        "max": 30,
        "label": "Low",
        "note": "Phone use looks unproblematic."
      },
      {
        "max": 60,
        "label": "Elevated",
        "note": "Above the published cut-offs (31 for men, 33 for women). Worth a look at where the hours go."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "audit-c",
    "name": "AUDIT-C",
    "fullName": "Alcohol Use Disorders Identification Test, Consumption",
    "domain": "Habits",
    "itemCount": 3,
    "minutes": 1,
    "wordingVerified": true,
    "available": true,
    "blurb": "A three-question screen for drinking patterns.",
    "license": "Public domain (World Health Organization)",
    "citation": "Bush, Kivlahan, McDonell, Fihn & Bradley (1998), Arch Intern Med 158(16):1789-95",
    "prompt": null,
    "options": null,
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "How often do you have a drink containing alcohol?",
        "options": [
          {
            "value": 0,
            "label": "Never"
          },
          {
            "value": 1,
            "label": "Monthly or less"
          },
          {
            "value": 2,
            "label": "2–4 times a month"
          },
          {
            "value": 3,
            "label": "2–3 times a week"
          },
          {
            "value": 4,
            "label": "4 or more times a week"
          }
        ]
      },
      {
        "text": "How many standard drinks do you have on a typical day when you are drinking?",
        "options": [
          {
            "value": 0,
            "label": "1 or 2"
          },
          {
            "value": 1,
            "label": "3 or 4"
          },
          {
            "value": 2,
            "label": "5 or 6"
          },
          {
            "value": 3,
            "label": "7 to 9"
          },
          {
            "value": 4,
            "label": "10 or more"
          }
        ]
      },
      {
        "text": "How often do you have six or more drinks on one occasion?",
        "options": [
          {
            "value": 0,
            "label": "Never"
          },
          {
            "value": 1,
            "label": "Less than monthly"
          },
          {
            "value": 2,
            "label": "Monthly"
          },
          {
            "value": 3,
            "label": "Weekly"
          },
          {
            "value": 4,
            "label": "Daily or almost daily"
          }
        ]
      }
    ],
    "bands": [
      {
        "max": 2,
        "label": "Low risk",
        "note": "Below the usual screening cut-off."
      },
      {
        "max": 12,
        "label": "Above cut-off",
        "note": "At or above the usual cut-off (3 for women, 4 for men). Worth a conversation."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "phq-15",
    "name": "PHQ-15",
    "fullName": "Patient Health Questionnaire-15 (Somatic Symptom Scale)",
    "domain": "Body",
    "itemCount": 15,
    "minutes": 3,
    "wordingVerified": false,
    "available": true,
    "blurb": "Physical symptoms: the aches and nausea that stress often shows up as.",
    "license": "Public domain (Pfizer released the PHQ family for free use)",
    "citation": "Kroenke, Spitzer & Williams (2002), Psychosom Med 64(2):258-66",
    "prompt": "Over the last 4 weeks, how much have you been bothered by…",
    "options": [
      {
        "value": 0,
        "label": "Not bothered at all"
      },
      {
        "value": 1,
        "label": "Bothered a little"
      },
      {
        "value": 2,
        "label": "Bothered a lot"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "Stomach pain"
      },
      {
        "text": "Back pain"
      },
      {
        "text": "Pain in your arms, legs, or joints (knees, hips, etc.)"
      },
      {
        "text": "Menstrual cramps or other problems with your periods (women only)"
      },
      {
        "text": "Headaches"
      },
      {
        "text": "Chest pain"
      },
      {
        "text": "Dizziness"
      },
      {
        "text": "Fainting spells"
      },
      {
        "text": "Feeling your heart pound or race"
      },
      {
        "text": "Shortness of breath"
      },
      {
        "text": "Pain or problems during sexual intercourse"
      },
      {
        "text": "Constipation, loose bowels, or diarrhoea"
      },
      {
        "text": "Nausea, gas, or indigestion"
      },
      {
        "text": "Feeling tired or having low energy"
      },
      {
        "text": "Trouble sleeping"
      }
    ],
    "bands": [
      {
        "max": 4,
        "label": "Minimal",
        "note": "Few physical symptoms reported."
      },
      {
        "max": 9,
        "label": "Low",
        "note": "Some symptoms. Common during a stressful stretch."
      },
      {
        "max": 14,
        "label": "Medium",
        "note": "Enough to be worth mentioning to a doctor as well as a counsellor."
      },
      {
        "max": 30,
        "label": "High",
        "note": "Please have these checked medically. Physical symptoms deserve physical care, whatever else is going on."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "pc-ptsd-5",
    "name": "PC-PTSD-5",
    "fullName": "Primary Care PTSD Screen for DSM-5",
    "domain": "Trauma",
    "itemCount": 5,
    "minutes": 1,
    "wordingVerified": false,
    "available": true,
    "blurb": "Five questions about how a frightening event is still affecting you.",
    "license": "Public domain (US Department of Veterans Affairs, National Center for PTSD)",
    "citation": "Prins et al. (2016), J Gen Intern Med 31(10):1206-11",
    "prompt": "Sometimes things happen that are extremely frightening, horrible or upsetting. If something like that has happened to you, in the past month have you…",
    "options": [
      {
        "value": 0,
        "label": "No"
      },
      {
        "value": 1,
        "label": "Yes"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "Had nightmares about the event(s), or thought about the event(s) when you did not want to?"
      },
      {
        "text": "Tried hard not to think about the event(s), or went out of your way to avoid situations that reminded you of it?"
      },
      {
        "text": "Been constantly on guard, watchful, or easily startled?"
      },
      {
        "text": "Felt numb or detached from people, activities, or your surroundings?"
      },
      {
        "text": "Felt guilty or unable to stop blaming yourself or others for the event(s) or any problems the event(s) may have caused?"
      }
    ],
    "bands": [
      {
        "max": 2,
        "label": "Below cut-off",
        "note": "Below the usual screening threshold."
      },
      {
        "max": 5,
        "label": "At or above cut-off",
        "note": "A score of 3 or more is the point at which a proper conversation with a clinician is recommended. It is a screen, not a diagnosis of PTSD."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "scoff",
    "name": "SCOFF",
    "fullName": "SCOFF Eating Disorder Screening Questionnaire",
    "domain": "Eating",
    "itemCount": 5,
    "minutes": 1,
    "wordingVerified": false,
    "available": true,
    "blurb": "Five yes/no questions about eating, weight and control.",
    "license": "Free to reproduce (published in the BMJ)",
    "citation": "Morgan, Reid & Lacey (1999), BMJ 319(7223):1467-8",
    "prompt": "Answer yes or no.",
    "options": [
      {
        "value": 0,
        "label": "No"
      },
      {
        "value": 1,
        "label": "Yes"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "Do you make yourself Sick because you feel uncomfortably full?"
      },
      {
        "text": "Do you worry you have lost Control over how much you eat?"
      },
      {
        "text": "Have you recently lost more than One stone (about 6 kg) in a three-month period?"
      },
      {
        "text": "Do you believe yourself to be Fat when others say you are too thin?"
      },
      {
        "text": "Would you say that Food dominates your life?"
      }
    ],
    "bands": [
      {
        "max": 1,
        "label": "Below cut-off",
        "note": "Below the usual screening threshold."
      },
      {
        "max": 5,
        "label": "At or above cut-off",
        "note": "Two or more yeses is the point at which the authors recommend a proper assessment. Eating difficulties respond well to early help. Please talk to someone."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "bsmas",
    "name": "BSMAS",
    "fullName": "Bergen Social Media Addiction Scale",
    "domain": "Habits",
    "itemCount": 6,
    "minutes": 2,
    "wordingVerified": false,
    "available": true,
    "blurb": "Six questions about where social media sits in your day.",
    "license": "Free to use for research and education (Andreassen et al.)",
    "citation": "Andreassen et al. (2016), Psychol Addict Behav 30(2):252-62",
    "prompt": "Over the past year, how often have you…",
    "options": [
      {
        "value": 1,
        "label": "Very rarely"
      },
      {
        "value": 2,
        "label": "Rarely"
      },
      {
        "value": 3,
        "label": "Sometimes"
      },
      {
        "value": 4,
        "label": "Often"
      },
      {
        "value": 5,
        "label": "Very often"
      }
    ],
    "higherIsBetter": false,
    "crisisItems": [],
    "items": [
      {
        "text": "…spent a lot of time thinking about social media or planning how to use it?"
      },
      {
        "text": "…felt an urge to use social media more and more?"
      },
      {
        "text": "…used social media in order to forget about personal problems?"
      },
      {
        "text": "…tried to cut down on social media without success?"
      },
      {
        "text": "…become restless or troubled if you were unable to use social media?"
      },
      {
        "text": "…used social media so much that it has had a negative impact on your studies or work?"
      }
    ],
    "bands": [
      {
        "max": 23,
        "label": "Below cut-off",
        "note": "Social media use looks unproblematic on this scale."
      },
      {
        "max": 30,
        "label": "At or above cut-off",
        "note": "At or above the commonly used cut-off of 24. Worth a look at where the hours go. This is a screen, not a diagnosis of anything."
      }
    ],
    "reportsBandOnly": false
  },
  {
    "id": "scs-sf",
    "name": "SCS-SF",
    "fullName": "Self-Compassion Scale, Short Form",
    "domain": "Strengths",
    "itemCount": 12,
    "minutes": 3,
    "wordingVerified": false,
    "available": true,
    "blurb": "How you treat yourself when things go badly.",
    "license": "Free for research and educational use (Kristin Neff)",
    "citation": "Raes, Pommier, Neff & Van Gucht (2011), Clin Psychol Psychother 18(3):250-5",
    "prompt": "How often do you behave in this way?",
    "options": [
      {
        "value": 1,
        "label": "Almost never"
      },
      {
        "value": 2,
        "label": "Rarely"
      },
      {
        "value": 3,
        "label": "Sometimes"
      },
      {
        "value": 4,
        "label": "Often"
      },
      {
        "value": 5,
        "label": "Almost always"
      }
    ],
    "higherIsBetter": true,
    "crisisItems": [],
    "items": [
      {
        "text": "When I fail at something important to me, I become consumed by feelings of inadequacy.",
        "reverse": true
      },
      {
        "text": "I try to be understanding and patient towards those aspects of my personality I do not like."
      },
      {
        "text": "When something painful happens, I try to take a balanced view of the situation."
      },
      {
        "text": "When I am feeling down, I tend to feel like most other people are probably happier than I am.",
        "reverse": true
      },
      {
        "text": "I try to see my failings as part of being human."
      },
      {
        "text": "When I am going through a very hard time, I give myself the caring and tenderness I need."
      },
      {
        "text": "When something upsets me, I try to keep my emotions in balance."
      },
      {
        "text": "When I fail at something that matters to me, I tend to feel alone in my failure.",
        "reverse": true
      },
      {
        "text": "When I am feeling down, I tend to obsess and fixate on everything that is wrong.",
        "reverse": true
      },
      {
        "text": "When I feel inadequate in some way, I try to remind myself that most people feel that way sometimes."
      },
      {
        "text": "I am disapproving and judgmental about my own flaws and inadequacies.",
        "reverse": true
      },
      {
        "text": "I am intolerant and impatient towards those aspects of my personality I do not like.",
        "reverse": true
      }
    ],
    "bands": [
      {
        "max": 2.49,
        "label": "Low",
        "note": "You are harder on yourself than you would ever be on a friend. That is a learnable skill, not a fixed trait."
      },
      {
        "max": 3.5,
        "label": "Moderate",
        "note": "A fairly typical mix of kindness and criticism toward yourself."
      },
      {
        "max": 5,
        "label": "High",
        "note": "You tend to treat yourself decently when things go wrong. That is protective, and worth keeping."
      }
    ],
    "reportsBandOnly": false
  }
];
