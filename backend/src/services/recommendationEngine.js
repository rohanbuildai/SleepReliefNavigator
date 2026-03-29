const SleepProfile = require('../models/SleepProfile');
const Intervention = require('../models/Intervention');
const RecommendationRule = require('../models/RecommendationRule');

// Safety flags that should block certain interventions
const SAFETY_FLAGS = {
  PREGNANCY: 'pregnancy',
  ANTIDEPRESSANTS: 'antidepressants',
  STIMULANT_MEDICATION: 'stimulant_medication',
  BLOOD_PRESSURE_MEDICATION: 'blood_pressure_medication',
  SLEEP_APNEA: 'sleep_apnea',
  ALCOHOL_TONIGHT: 'alcohol_tonight',
  SEVERE_INSOMNIA: 'severe_insomnia',
  PANIC_SYMPTOMS: 'panic_symptoms',
};

// Contraindications mapping (intervention -> blocked by safety flag)
const CONTRAINDICATIONS = {
  // Supplements blocked by certain flags
  melatonin: [SAFETY_FLAGS.PREGNANCY, SAFETY_FLAGS.STIMULANT_MEDICATION],
  magnesium: [SAFETY_FLAGS.BLOOD_PRESSURE_MEDICATION],
  l_theanine: [SAFETY_FLAGS.STIMULANT_MEDICATION],
  
  // Behavioral interventions generally safe
  breathing_exercises: [],
  journaling: [],
  white_noise: [],
  stimulus_control: [],
  sleep_restriction: [SAFETY_FLAGS.SLEEP_APNEA],
  nsdr: [SAFETY_FLAGS.PANIC_SYMPTOMS],
  
  // Routine interventions
  chamomile_tea: [SAFETY_FLAGS.PREGNANCY],
  caffeine_timing: [],
  screen_time_reduction: [],
  bedtime_routine: [],
};

// Profile matching rules (quiz responses -> profile slug)
const PROFILE_MATCH_RULES = {
  'racing_mind': {
    symptoms: ['racing_thoughts', 'cant_fall_asleep'],
    conditions: {
      primaryIssue: ['cannot_fall_asleep', 'racing_thoughts'],
      urgency: ['need_help_tonight', 'both'],
    },
  },
  'midnight_wake': {
    symptoms: ['wake_up_cant_return', 'midnight_anxiety'],
    conditions: {
      primaryIssue: ['wake_up_cant_return'],
      urgency: ['need_help_tonight', 'both'],
    },
  },
  'tired_wired': {
    symptoms: ['tired_but_wired', 'hyperarousal'],
    conditions: {
      primaryIssue: ['tired_but_wired'],
      urgency: ['both', 'long_term'],
    },
  },
  'bedtime_anxiety': {
    symptoms: ['bedtime_dread', 'anticipatory_anxiety'],
    conditions: {
      primaryIssue: ['bedtime_dread', 'anticipatory_anxiety'],
      urgency: ['both'],
    },
  },
  'body_tension': {
    symptoms: ['physical_tension', 'body_anxiety'],
    conditions: {
      primaryIssue: ['physical_tension', 'body_anxiety'],
      urgency: ['need_help_tonight', 'both'],
    },
  },
};

// Intervention scoring weights
const SCORING = {
  BEST_FOR_MATCH: 30,
  SAFETY_CLEAR: 20,
  LOW_GROGGINESS: 15,
  LOW_DEPENDENCY: 15,
  QUICK_ONSET: 10,
  EVIDENCE_LEVEL: 10,
};

/**
 * Classify user into a sleep profile based on quiz responses
 */
const classifyProfile = async (responses) => {
  const { primaryIssue, symptoms, urgency } = responses;
  
  // Direct profile matching
  if (primaryIssue === 'cannot_fall_asleep' || symptoms?.includes('racing_thoughts')) {
    return {
      slug: 'racing_mind',
      name: 'Racing Mind Sleep Onset',
      confidence: 85,
    };
  }
  
  if (primaryIssue === 'wake_up_cant_return' || symptoms?.includes('midnight_wake')) {
    return {
      slug: 'midnight_wake',
      name: 'Middle-of-Night Adrenaline Wake',
      confidence: 80,
    };
  }
  
  if (primaryIssue === 'tired_but_wired' || symptoms?.includes('hyperarousal')) {
    return {
      slug: 'tired_wired',
      name: 'Tired But Wired Hyperarousal',
      confidence: 82,
    };
  }
  
  if (primaryIssue === 'bedtime_dread' || symptoms?.includes('anticipatory_anxiety')) {
    return {
      slug: 'bedtime_anxiety',
      name: 'Bedtime Anticipatory Anxiety',
      confidence: 78,
    };
  }
  
  if (primaryIssue === 'physical_tension' || symptoms?.includes('body_tension')) {
    return {
      slug: 'body_tension',
      name: 'Body Tension Dominant Sleeplessness',
      confidence: 75,
    };
  }
  
  // Default to racing mind if no match
  return {
    slug: 'racing_mind',
    name: 'Racing Mind Sleep Onset',
    confidence: 60,
  };
};

/**
 * Filter interventions based on safety flags
 */
const filterBySafety = (interventions, safetyFlags = []) => {
  return interventions.filter(intervention => {
    const interventionSlug = intervention.slug.toLowerCase();
    const blockedBy = CONTRAINDICATIONS[interventionSlug] || [];
    
    for (const flag of safetyFlags) {
      if (blockedBy.includes(flag)) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Score and rank interventions for a profile
 */
const scoreInterventions = (interventions, profileSlug, responses) => {
  return interventions.map(intervention => {
    let score = 0;
    
    // Best for match
    if (intervention.bestFor?.includes(profileSlug)) {
      score += SCORING.BEST_FOR_MATCH;
    }
    
    // Check if intervention matches user's specific issues
    const userIssues = responses.symptoms || [];
    const matchingIssues = intervention.bestFor?.filter(bf => 
      userIssues.some(issue => bf.includes(issue) || issue.includes(bf))
    ) || [];
    
    score += matchingIssues.length * 5;
    
    // Safety score (already filtered, but bonus for low risk)
    score += (5 - intervention.grogginessRisk) * (SCORING.SAFETY_CLEAR / 5);
    score += (5 - intervention.dependencyRisk) * (SCORING.SAFETY_CLEAR / 5);
    
    // Grogginess preference
    if (responses.sensitivity?.includes('hate_grogginess') && intervention.grogginessRisk <= 2) {
      score += SCORING.LOW_GROGGINESS;
    }
    
    // Dependency concern
    if (responses.sensitivity?.includes('fear_dependency') && intervention.dependencyRisk <= 2) {
      score += SCORING.LOW_DEPENDENCY;
    }
    
    // Quick onset preference
    if (responses.urgency === 'need_help_tonight' && intervention.onsetMinutes <= 30) {
      score += SCORING.QUICK_ONSET;
    }
    
    // Supplement preference
    if (responses.supplementPreference === 'no_supplements' && intervention.category === 'supplement') {
      score -= 20;
    }
    if (responses.supplementPreference === 'open_to_supplements' && intervention.category === 'supplement') {
      score += 5;
    }
    
    // Evidence level
    score += intervention.evidenceLevel * 2;
    
    return {
      ...intervention.toObject(),
      score,
    };
  }).sort((a, b) => b.score - a.score);
};

/**
 * Build the Tonight Plan
 */
const buildTonightPlan = (rankedInterventions, profileSlug, responses, safetyFlags) => {
  const primarySteps = [];
  const backupPlan = [];
  
  // Take top 3 for primary steps
  const primary = rankedInterventions.slice(0, 3);
  
  primary.forEach((intervention, index) => {
    primarySteps.push({
      order: index + 1,
      intervention: intervention._id,
      interventionSlug: intervention.slug,
      interventionName: intervention.name,
      instructions: intervention.quickProtocol || intervention.instructions,
      duration: intervention.onsetMinutes,
      timing: index === 0 ? 'now' : `after step ${index}`,
    });
  });
  
  // Take next 2 for backup
  const backup = rankedInterventions.slice(3, 5);
  
  backup.forEach(intervention => {
    backupPlan.push({
      intervention: intervention._id,
      interventionSlug: intervention.slug,
      interventionName: intervention.name,
      instructions: intervention.quickProtocol || intervention.instructions,
    });
  });
  
  // Build avoid tonight list based on contraindications
  const avoidTonight = [];
  
  if (safetyFlags.includes(SAFETY_FLAGS.ALCOHOL_TONIGHT)) {
    avoidTonight.push('Alcohol (disrupts sleep architecture)');
  }
  if (safetyFlags.includes(SAFETY_FLAGS.STIMULANT_MEDICATION)) {
    avoidTonight.push('Melatonin (may interact with stimulants)');
  }
  if (responses.caffeineAfterNoon) {
    avoidTonight.push('Caffeine after noon');
  }
  if (responses.lateScreenTime) {
    avoidTonight.push('Blue light screens 1 hour before bed');
  }
  
  // Calculate overall risk
  const avgGrogginessRisk = primary.reduce((sum, i) => sum + i.grogginessRisk, 0) / primary.length;
  const avgDependencyRisk = primary.reduce((sum, i) => sum + i.dependencyRisk, 0) / primary.length;
  
  return {
    primarySteps,
    backupPlan,
    avoidTonight,
    grogginessRisk: Math.round(avgGrogginessRisk),
    dependencyRisk: Math.round(avgDependencyRisk),
  };
};

/**
 * Build the Tomorrow Reset Plan
 */
const buildTomorrowReset = (rankedInterventions, profileSlug) => {
  const steps = [];
  
  // Get morning/evening routine interventions
  const routineInterventions = rankedInterventions.filter(
    i => i.category === 'routine' || i.category === 'behavioral'
  ).slice(0, 4);
  
  routineInterventions.forEach((intervention, index) => {
    steps.push({
      intervention: intervention._id,
      interventionSlug: intervention.slug,
      interventionName: intervention.name,
      instructions: intervention.instructions,
      timing: index < 2 ? 'morning' : 'evening',
    });
  });
  
  return { steps };
};

/**
 * Build the 7-Night Reset Plan (premium)
 */
const buildSevenNightPlan = (rankedInterventions, profileSlug, isPremium = false) => {
  const nights = [];
  
  // Progressive plan over 7 nights
  const focusByNight = [
    { night: 1, focus: 'Wind down & relaxation' },
    { night: 2, focus: 'Cognitive unload' },
    { night: 3, focus: 'Breathing exercises' },
    { night: 4, focus: 'Environmental optimization' },
    { night: 5, focus: 'Routine consistency' },
    { night: 6, focus: 'Stimulus control' },
    { night: 7, focus: 'Full protocol review' },
  ];
  
  focusByNight.forEach(({ night, focus }) => {
    const nightInterventions = rankedInterventions
      .filter(i => i.category !== 'supplement' || night > 3) // Supplements later
      .slice(0, 3);
    
    nights.push({
      night,
      focus,
      interventions: nightInterventions.map(i => ({
        intervention: i._id,
        interventionSlug: i.slug,
        interventionName: i.name,
        instructions: i.instructions,
        note: i.safetyNotes,
      })),
      expectedOutcome: `By night ${night}, you should notice improvement in ${focus.toLowerCase()}`,
    });
  });
  
  return {
    nights,
    totalDuration: 7,
    isPremium: !isPremium, // Requires premium
  };
};

/**
 * Check if user needs professional help
 */
const needsProfessionalHelp = (safetyFlags, responses) => {
  const redFlags = [
    SAFETY_FLAGS.SEVERE_INSOMNIA,
    SAFETY_FLAGS.PANIC_SYMPTOMS,
    SAFETY_FLAGS.SLEEP_APNEA,
  ];
  
  const triggeredFlags = safetyFlags.filter(f => redFlags.includes(f));
  
  if (triggeredFlags.length > 0) {
    return true;
  }
  
  // Check for very long-term severe issues
  if (responses.insomniaDuration === 'more_than_month' && responses.urgency === 'long_term') {
    return true;
  }
  
  return false;
};

/**
 * Generate explanation for why this plan fits
 */
const generateExplanation = (profileSlug, responses) => {
  const explanations = {
    'racing_mind': `Your symptoms indicate a "Racing Mind" pattern - difficulty quieting mental activity at bedtime. The recommended interventions target cognitive arousal reduction through relaxation techniques and mental unloading strategies that are evidence-based for this specific sleep pattern.`,
    
    'midnight_wake': `Your middle-of-night wakefulness with difficulty returning to sleep suggests an autonomic nervous system arousal pattern. The interventions focus on parasympathetic activation to help you return to sleep without strong stimulation.`,
    
    'tired_wired': `Your "tired but wired" state indicates hyperarousal - where your body is physically fatigued but mentally alert. The recommendations balance gentle physical relaxation with cognitive calming to resolve this mismatch.`,
    
    'bedtime_anxiety': `Your bedtime dread suggests anticipatory anxiety about sleep. The plan includes gentle exposure techniques and anxiety reduction strategies specifically effective for sleep-related anxiety.`,
    
    'body_tension': `Your physical tension pattern indicates somatic arousal interfering with sleep onset. The recommendations focus on progressive relaxation and body-based techniques to reduce physical tension.`,
  };
  
  return explanations[profileSlug] || explanations['racing_mind'];
};

/**
 * Main recommendation engine function
 */
const generateRecommendations = async (responses, safetyFlags = []) => {
  // Step 1: Classify profile
  const profile = await classifyProfile(responses);
  
  // Step 2: Get all active interventions
  const interventions = await Intervention.find({ isActive: true });
  
  // Step 3: Filter by safety flags
  const safeInterventions = filterBySafety(interventions, safetyFlags);
  
  // Step 4: Score and rank
  const rankedInterventions = scoreInterventions(safeInterventions, profile.slug, responses);
  
  // Step 5: Build plans
  const tonightPlan = buildTonightPlan(rankedInterventions, profile.slug, responses, safetyFlags);
  const tomorrowReset = buildTomorrowReset(rankedInterventions, profile.slug);
  
  // Step 6: Check for professional help needs
  const requiresProfessional = needsProfessionalHelp(safetyFlags, responses);
  
  // Step 7: Generate explanation
  const explanation = generateExplanation(profile.slug, responses);
  
  // Step 8: Safety note based on flags
  let safetyNote = '';
  if (safetyFlags.includes(SAFETY_FLAGS.PREGNANCY)) {
    safetyNote = 'Note: You indicated pregnancy. Please consult with your healthcare provider before using any supplements.';
  } else if (safetyFlags.includes(SAFETY_FLAGS.ANTIDEPRESSANTS)) {
    safetyNote = 'Note: You indicated taking antidepressants. Please consult with your doctor before adding any sleep supplements.';
  } else if (safetyFlags.includes(SAFETY_FLAGS.STIMULANT_MEDICATION)) {
    safetyNote = 'Note: You indicated stimulant medication use. Please consult with your healthcare provider before using melatonin or other sleep supplements.';
  }
  
  // Generate escalation note if needed
  let escalationNote = '';
  if (requiresProfessional) {
    escalationNote = 'Based on your responses, we recommend consulting a healthcare professional. If your sleep problems persist, please consider speaking with a sleep specialist or your primary care provider.';
  }
  
  return {
    profile,
    tonightPlan,
    tomorrowReset,
    sevenNightPlan: buildSevenNightPlan(rankedInterventions, profile.slug, false),
    safetyFlagsTriggered: safetyFlags,
    needsProfessionalHelp: requiresProfessional,
    explanation,
    safetyNote,
    escalationNote,
    rankedInterventions: rankedInterventions.slice(0, 10).map(i => ({
      _id: i._id,
      name: i.name,
      slug: i.slug,
      category: i.category,
      score: i.score,
    })),
  };
};

module.exports = {
  generateRecommendations,
  classifyProfile,
  filterBySafety,
  scoreInterventions,
  SAFETY_FLAGS,
  CONTRAINDICATIONS,
  PROFILE_MATCH_RULES,
};