export const ai: Record<string, string> = {
  // AI workspace shell
  INTELLIGENCE: 'UBWENGE',
  'Your intelligent assistant for this workspace · {workspace}':
    'Umufasha wawe w’ubwenge muri aka kazi · {workspace}',
  'Available to every role': 'Iboneka ku ruhare rwose',
  Ask: 'Baza',
  Practice: 'Imyitozo',
  Evaluate: 'Suzuma',
  Plan: 'Gahunda',
  Sources: 'Inkomoko',
  Status: 'Imiterere',
  'Response language': 'Ururimi rw’ibisubizo',
  'AI response language': 'Ururimi rw’ibisubizo by’AI',
  'Use simple language': 'Koresha ururimi rworoshye',
  'Use simple language in AI answers': 'Koresha ururimi rworoshye mu bisubizo by’AI',
  'The request could not be completed.': 'Icyifuzo nticyashoboye kurangira.',

  // Practice question drafting
  'Draft practice questions': 'Tegura ibibazo by’imyitozo',
  'Generate a question draft from approved material. Answer keys stay hidden.':
    'Kurura ibibazo mu bikoresho byemewe. Inyandiko z’ibisubizo ntizigaragazwa.',
  'Question drafting is locked for your role. Ask MENYA for guided practice instead.':
    'Gutegura ibibazo bifunzwe ku ruhare rwawe. Saba MENYA imyitozo iyobowe.',
  'Trainer / admin': 'Umwarimu / Umuyobozi',
  'Guided practice': 'Imyitozo iyobowe',
  Topic: 'Ingingo',
  'e.g. Ohm’s law': 'Urugero: itegeko rya Ohm',
  'Question type': 'Ubwoko bw’ikibazo',
  mcq: 'Ibibazo by’amahitamo',
  theory: 'Icyandiko',
  practical: 'Imyitozo y’intoki',
  mixed: 'Ivanze',
  Count: 'Umubare',
  'Drafting…': 'Birimo gutegurwa…',
  Generate: 'Tegura',
  'Locked: only trainers and administrators can generate question sets. Your guided practice below is still available.':
    'Bifunzwe: abarimu n’abayobozi gusa bashobora gutegura ibibazo. Imyitozo iyobowe iri hasi iraboneka.',
  'Draft only — check every question and score with your trainer before using it for formal assessment.':
    'Ibyateguwe gusa — genzura buri kibazo n’amanota hamwe n’umwarimu mbere yo kubikoresha mu bizamini byemewe.',
  'Suggest {count} {type} practice questions on {topic}':
    'Tanga ibibazo {count} by’imyitozo ya {type} kuri {topic}',
  'Topic: {topic} · {count} draft questions': 'Ingingo: {topic} · ibibazo {count} byateguwe',
  'Engine: {engine}': 'Injini: {engine}',
  Steps: 'Intambwe',
  Suggestions: 'Ibyifuzo',

  // Answer evaluation
  'Check an answer': 'Genzura igisubizo',
  'Feedback is indicative and grounded in approved material — never an official grade.':
    'Ibitekerezo ni ibyo kwerekana gusa kandi bishingiye ku bikoresho byemewe — si amanota yemewe.',
  'Written response': 'Igisubizo cyanditswe',
  'Paste the answer you want MENYA to review…': 'Shyira hano igisubizo ushaka ko MENYA isuzuma…',
  'Rubric criteria (comma separated)': 'Ibipimo bya rubriki (bitandukanyijwe n’akaduho)',
  'Safety, calculation, explanation': 'Umutekano, kubara, ibisobanuro',
  'Topic (optional)': 'Ingingo (bidakenewe)',
  'e.g. Circuit calculations': 'Urugero: kubara muri circuit',
  'Checking…': 'Birimo kugenzurwa…',
  Feedback: 'Ibitekerezo',
  'Indicative score: {score}/100': 'Amanota yerekana: {score}/100',
  Gaps: 'Icyuho',
  'No gaps flagged.': 'Nta cyuho cyagaragajwe.',
  'No suggestions right now.': 'Nta byifuzo muri iki gihe.',
  'Indicative feedback only — your trainer or institution makes the official decision.':
    'Ibitekerezo byerekana gusa — umwarimu wawe cyangwa ikigo gifata icyemezo cyemewe.',

  // Study plan
  'Study plan': 'Gahunda yo kwiga',
  'Apply a suggested block to your MENYA study planner.':
    'Shyira igice cyatanzwe muri gahunda yawe yo kwiga ya MENYA.',
  'Use this plan to guide your cohort or review schedule. Planner edits remain student-only.':
    'Koresha iyi gahunda kuyobora itsinda ryawe cyangwa gahunda yo kugenzura. Guhindura gahunda bikorwa n’abanyeshuri gusa.',
  'Minutes / day': 'Imiminota / umunsi',
  Days: 'Iminsi',
  'Loading…': 'Birimo gupakururwa…',
  'Refresh plan': 'Vugurura gahunda',
  Day: 'Umunsi',
  Slot: 'Igihe',
  Task: 'Umurimo',
  Minutes: 'Imiminota',
  Reason: 'Impamvu',
  Planner: 'Gahunda',
  'Add day {day} task to planner': 'Ongera umurimo w’umunsi wa {day} muri gahunda',
  Add: 'Ongera',
  'Added to study planner': 'Wongerewe muri gahunda yo kwiga',
  '{task} · Day {day} · {slot}': '{task} · Umunsi wa {day} · {slot}',
  'Could not add study block': 'Ntibashije kongera igice cyo kwiga',
  'This plan was built with MENYA’s deterministic scheduling rules.':
    'Iyi gahunda yubatswe hakurikijwe amategeko ya MENYA yo gutegura adahinduka.',
  'This plan was assembled with AI assistance.': 'Iyi gahunda yateguwe ifashijwe na AI.',
  'Adjust it to your context and confirm safety-sensitive practice with your trainer.':
    'Ihuze n’ibiri mu kazi kawe kandi wemeze imyitozo ijyanye n’umutekano hamwe n’umwarimu.',

  // Approved sources
  'Approved sources': 'Inkomoko zemewe',
  'MENYA only cites approved curriculum material. References are shown as [S1] title chips.':
    'MENYA ikoresha gusa ibikoresho by’amasomo byemewe. Ibyerekana byandikwa nka [S1] izina.',
  Refresh: 'Vugurura',
  '{count} cited sources': 'Inkomoko {count} zivugwa',
  'Not fully grounded': 'Ntishingiye byuzuye',

  // Administrator status
  'AI service status': 'Imiterere ya serivisi ya AI',
  'Administrator-only view of provider health, quota and cache usage.':
    'Iyabonwa n’abayobozi gusa y’imikorere y’itanga serivisi, igipimo n’ububiko bw’agateganyo.',
  Provider: 'Utanga serivisi',
  Configuration: 'Igenamiterere',
  Quota: 'Igipimo',
  Requests: 'Ibyifuzo',
  Configured: 'Yashyizweho',
  'Not configured': 'Ntiyashyizweho',
  '{count} cached entries': 'Ibintu {count} bibitswe by’agateganyo',
  'Resets {resetAt}': 'Isubizwa {resetAt}',
  '{count} tokens used': 'Ibimenyetso {count} byakoreshejwe',
  'Quota usage': 'Imikoreshereze y’igipimo',
  Errors: 'Amakosa',
  Fallbacks: 'Kwitabaza ubundi buryo',
  'Last error': 'Ikosa rya nyuma',
  None: 'Nta na kimwe',

  // Tutor panel
  'MENYA AI Tutor': 'Umwarimu wa MENYA AI',
  'MENYA AI Trainer Copilot': 'Umufasha w’umwarimu wa MENYA AI',
  'MENYA AI Review Copilot': 'Umufasha w’ukugenzura ubuziranenge wa MENYA AI',
  'MENYA AI Operations Copilot': 'Umufasha w’ubuyobozi bwa MENYA AI',
  'I am following your lesson on “{lessonTitle}”. Ask me anything, or use a prompt below. I can simplify a concept, give a hint, or create practice questions.':
    'Ndi hano muri “{lessonTitle}”. Mbaze ibyo ushaka, cyangwa ukoreshe ibibazo biri hasi. Nshobora kugabanya ibintu bigoye, guha ikimenyetso, cyangwa gutanga imyitozo.',
  'I am reading your {lessonTitle} workspace. Ask me about patterns, priorities or next steps and I will answer from your {role} view.':
    'Ndi kureba imirimo yawe ya {lessonTitle}. Mbaze ibijyanye n’ibibazo, ibyihutirwa cyangwa intambwe ikurikira, nkagusubiza mu byo ubona.',
  'Context aware · server backed': 'Ihanga ibiri mu kazi · ishingiye kuri serivisi',
  Live: 'Nzima',
  Language: 'Ururimi',
  English: 'Icyongereza',
  Kinyarwanda: 'Ikinyarwanda',
  'Reading your workspace context…': 'Ndi gusoma ibiri mu mwanya wawe…',
  'I could not reach the MENYA AI service just now. Please try again in a moment.':
    'Ntibashije kugera kuri MENYA AI ubu. Subira ugerageza nyuma y’akanya gato.',
  'Try asking': 'Gerageza ubaze',
  'Suggested next moves': 'Intambwe zikurikira ziteganywa',
  'Ask MENYA AI…': 'Baza MENYA AI…',
  'Message MENYA AI': 'Ubutumwa kuri MENYA AI',
  'Send message': 'Ohereza ubutumwa',
  'AI supports your work. Verify safety information and formal decisions with your trainer or institution policy.':
    'AI ifasha mu kazi kawe. Genzura amakuru y’umutekano n’ibyemezo byemewe hamwe n’umwarimu cyangwa politiki y’ikigo.',

  // Drawer, insights and recommendations
  'Close MENYA AI help': 'Funga ubufasha bwa MENYA AI',
  'Close AI help drawer': 'Funga agasanduku k’ubufasha bwa AI',
  'Quick AI help': 'Ubufasha bwihuse bwa AI',
  'AI quick help: {label}': 'Ubufasha bwihuse bwa AI: {label}',
  'MENYA AI INSIGHT': 'UBWENGE BWA MENYA AI',
  'Why this?': 'Kuki iyi?',
  'MENYA AI is reading your workspace…': 'MENYA AI isoma aka kazi…',
  'Recommendation dismissed': 'Icyifuzo cyavanyweho',
  'MENYA AI will adjust your suggestions.': 'MENYA AI izahindura ibyo itanga.',
  'Dismiss recommendation: {title}': 'Kuraho icyifuzo: {title}',
  'FOR YOU': 'KU WAWE',
  '{minutes} min': '{minutes} min',

  // Quick help actions (labels and prompts)
  Explain: 'Sobanura',
  'Quiz me': 'Nyigisha ibibazo',
  'Check answer': 'Genzura igisubizo',
  Resources: 'Ibikoresho',
  'Quiz me on this topic': 'Mpa ibibazo kuri iyi ngingo',
  'Build a study plan for this week': 'Wubake gahunda yo kwiga kuri iki cyumweru',
  'Check my answer against the rubric': 'Genzura igisubizo cyanjye ukurikije rubriki',
  'List the approved curriculum sources you can cite':
    'Rondora ibikoresho byemewe by’amasomo ushobora kwerekana',

  // Starter prompts
  'Explain this in simpler terms': 'Sobanura mu buryo bworoshye',
  'Give me a hint for the activity': 'Mpa ikimenyetso cy’iyi ngingo',
  'Why did I miss that quiz question?': 'Kuki nabuze kuri kiriya kibazo?',
  'Suggest practice exercises': 'Tanga imyitozo',
  'Who needs a check-in?': 'Ni mwene ubuhe abanyeshuri bakeneye kuvugwa?',
  'Which course needs practice?': 'Ni iyihe nzira ikeneye imyitozo?',
  'Summarise the review queue': 'Sobanura urutonde rwo kugenzura',
  'How do I apply the rubric?': 'Nshyira mu bikorwa rite rubriki?',
  'What should I prioritise?': 'Ni ibiki nakwita cyane?',
  'Check consistency of decisions': 'Reba niba ibyemezo bihuje',
  'Summarise platform health': 'Sobanura ubuzima bwa MENYA',
  'Where is coverage thin?': 'Aho ubumenyi buke bukeneye kongerwa?',
  'What should I check before intake?': 'Ndeba iki mbere y’ukwakira abashya?',

  // Exercise prompts
  'A 24 V circuit has 6 Ω resistance — find the current':
    'Umuriro wa 24 V ufite 6 Ω — shakisha umuyaga',
  'Explain series vs parallel with an example':
    'Sobanura itandukaniro rya seri na paraleli n’urugero',
  'Quiz me on cable sizing': 'Mpa ibibazo ku gupima insinga',
  'Which learners need a check-in this week?':
    'Ni abanyeshuri ba bandi bakeneye kuvugwa muri iki cyumweru?',
  'Draft a practice block for our weakest course':
    'Tegura igice cy’imyitozo cy’amasomo adafite ubumenyi buhagije',
  'What feedback pattern should I use for repeat errors?':
    'Ni ubuhe buryo bwo gutanga ibitekerezo nakoresha ku makosa asubirwamo?',
  'Walk me through the safety criterion': 'Nsobanurire ibipimo by’umutekano intambwe ku yindi',
  'How should I word a change request?': 'Nandika nte icyifuzo cy’impinduka?',
  'Check my decision against the rubric': 'Genzura icyemezo cyanjye ukurikije rubriki',
  'Summarise platform health for this week': 'Sobanura ubuzima bwa sisitemu muri iki cyumweru',
  'Where should we add trainer coverage?': 'Aho twongera abarimu?',
  'What should I verify before a new intake?':
    'Ni ibiki tugomba kugenzura mbere y’ukwakira abashya?',
}
