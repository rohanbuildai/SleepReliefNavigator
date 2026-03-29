require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');
const interventionsData = require('../data/interventions.json');
const profilesData = require('../data/profiles.json');

// Import models
const Intervention = require('../models/Intervention');
const SleepProfile = require('../models/SleepProfile');
const RecommendationRule = require('../models/RecommendationRule');
const EvidenceEntry = require('../models/EvidenceEntry');

async function seedDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(config.env === 'production' 
      ? process.env.MONGODB_URI 
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/sleeprelief');
    console.log('✅ Connected to MongoDB');

    // Seed Interventions
    console.log('\n📦 Seeding Interventions...');
    await Intervention.deleteMany({});
    const interventions = await Intervention.insertMany(interventionsData);
    console.log(`   ✅ Seeded ${interventions.length} interventions`);

    // Seed Sleep Profiles
    console.log('\n📦 Seeding Sleep Profiles...');
    await SleepProfile.deleteMany({});
    const profiles = await SleepProfile.insertMany(profilesData);
    console.log(`   ✅ Seeded ${profiles.length} sleep profiles`);

    // Seed Recommendation Rules
    console.log('\n📦 Seeding Recommendation Rules...');
    await RecommendationRule.deleteMany({});
    
    const rules = [
      // Profile-specific rules
      {
        name: 'Racing Mind - Melatonin + L-Theanine',
        slug: 'racing_mind_melatonin_ltheanine',
        type: 'profile_match',
        applicableProfiles: ['racing_mind'],
        priority: 10,
        conditions: {
          profileSlugs: ['racing_mind'],
          subscriptionRequired: 'none',
        },
        actions: {
          includeInterventions: interventions.filter(i => 
            ['melatonin', 'l_theanine', '478_breathing', 'cognitive_unload'].includes(i.slug)
          ).map(i => i._id),
          setPrimary: true,
        },
        explanation: 'For racing mind, we prioritize cognitive calming supplements and breathing techniques.',
        isActive: true,
      },
      {
        name: 'Midnight Wake - White Noise + Stimulus Control',
        slug: 'midnight_wake_white_noise_stimulus',
        type: 'profile_match',
        applicableProfiles: ['midnight_wake'],
        priority: 10,
        conditions: {
          profileSlugs: ['midnight_wake'],
          subscriptionRequired: 'none',
        },
        actions: {
          includeInterventions: interventions.filter(i => 
            ['white_noise', 'stimulus_control', '478_breathing'].includes(i.slug)
          ).map(i => i._id),
          setPrimary: true,
        },
        explanation: 'For middle-of-night waking, focus on sleep continuity and not reinforcing wakefulness.',
        isActive: true,
      },
      {
        name: 'Tired But Wired - PMR + NSDR',
        slug: 'tired_wired_pmr_nsdr',
        type: 'profile_match',
        applicableProfiles: ['tired_wired'],
        priority: 10,
        conditions: {
          profileSlugs: ['tired_wired'],
          subscriptionRequired: 'none',
        },
        actions: {
          includeInterventions: interventions.filter(i => 
            ['progressive_muscle_relaxation', 'nsdr', 'magnesium_glycinate', 'screen_reduction'].includes(i.slug)
          ).map(i => i._id),
          setPrimary: true,
        },
        explanation: 'For hyperarousal, prioritize body-based relaxation techniques to bridge mind-body disconnect.',
        isActive: true,
      },
      // Contraindication rules
      {
        name: 'Exclude Melatonin for Stimulant Users',
        slug: 'no_melatonin_stimulants',
        type: 'contraindication',
        applicableProfiles: ['racing_mind', 'midnight_wake'],
        priority: 1,
        conditions: {
          safetyFlags: ['stimulant_medication'],
          subscriptionRequired: 'none',
        },
        actions: {
          excludeInterventions: interventions.filter(i => i.slug === 'melatonin').map(i => i._id),
          addWarning: 'Melatonin is not recommended when taking stimulant medications. Please consult your doctor.',
        },
        explanation: 'Melatonin may interact with stimulant medications.',
        isActive: true,
      },
      {
        name: 'Exclude Melatonin for Pregnancy',
        slug: 'no_melatonin_pregnancy',
        type: 'contraindication',
        applicableProfiles: ['racing_mind', 'midnight_wake'],
        priority: 1,
        conditions: {
          safetyFlags: ['pregnancy'],
          subscriptionRequired: 'none',
        },
        actions: {
          excludeInterventions: interventions.filter(i => 
            ['melatonin', 'chamomile_tea'].includes(i.slug)
          ).map(i => i._id),
          addWarning: 'Some supplements are not recommended during pregnancy. Please consult your healthcare provider.',
        },
        explanation: 'Melatonin and chamomile may not be safe during pregnancy.',
        isActive: true,
      },
      // Safety escalation rules
      {
        name: 'Escalate Sleep Apnea Concerns',
        slug: 'escalate_sleep_apnea',
        type: 'safety',
        applicableProfiles: ['midnight_wake', 'racing_mind'],
        priority: 1,
        conditions: {
          safetyFlags: ['sleep_apnea'],
          subscriptionRequired: 'none',
        },
        actions: {
          addWarning: 'Your symptoms suggest possible sleep apnea. Please consult a healthcare professional for evaluation.',
        },
        explanation: 'Loud snoring and gasping during sleep may indicate sleep apnea, which requires professional evaluation.',
        isActive: true,
      },
      {
        name: 'Escalate Severe Insomnia',
        slug: 'escalate_severe_insomnia',
        type: 'safety',
        applicableProfiles: ['racing_mind', 'bedtime_anxiety'],
        priority: 1,
        conditions: {
          safetyFlags: ['severe_insomnia'],
          subscriptionRequired: 'none',
        },
        actions: {
          addWarning: 'Long-term severe insomnia may require professional support. We recommend consulting a sleep specialist.',
        },
        explanation: 'If insomnia persists for more than a month and significantly impacts daily life, professional help is recommended.',
        isActive: true,
      },
    ];
    
    await RecommendationRule.insertMany(rules);
    console.log(`   ✅ Seeded ${rules.length} recommendation rules`);

    // Seed Evidence Entries
    console.log('\n📦 Seeding Evidence Entries...');
    await EvidenceEntry.deleteMany({});
    
    const evidenceEntries = [
      {
        title: 'Melatonin for Sleep',
        slug: 'melatonin-for-sleep',
        summary: 'Melatonin is a hormone that regulates the sleep-wake cycle and is commonly used as a sleep aid for jet lag and insomnia.',
        whatItIs: 'Melatonin is a hormone naturally produced by the pineal gland that signals to your body when it\'s time to sleep. As a supplement, it\'s synthesized artificially.',
        bestFor: ['sleep onset', 'jet lag', 'shift work', 'circadian rhythm disorders'],
        notBestFor: ['chronic insomnia', 'maintenance sleep', 'severe anxiety-driven insomnia'],
        howItWorks: 'Melatonin doesn\'t force sleep but signals your brain that it\'s evening. It reduces core body temperature and promotes drowsiness.',
        evidenceStrength: 'strong',
        onsetMinutes: 30,
        duration: '4-6 hours',
        grogginessRisk: 2,
        dependencyRisk: 1,
        sideEffectRisk: 1,
        safetyNotes: 'Start with lowest effective dose (0.5-1mg). Long-term use should include occasional breaks. Not for pregnancy or while breastfeeding.',
        whenToAvoid: ['pregnancy', 'breastfeeding', 'autoimmune disorders', 'depression (may worsen)', 'seizure disorders'],
        commonMistakes: ['Taking too high a dose', 'Taking too close to bedtime', 'Using nightly without breaks', 'Expecting immediate results'],
        keywords: ['melatonin', 'sleep aid', 'insomnia', 'jet lag', 'sleep supplement'],
        isActive: true,
        sortOrder: 1,
      },
      {
        title: 'Magnesium for Sleep',
        slug: 'magnesium-for-sleep',
        summary: 'Magnesium is a mineral involved in hundreds of body processes, including muscle relaxation and neurotransmitter production that support sleep.',
        whatItIs: 'Magnesium is an essential mineral involved in over 300 enzymatic reactions. Glycinate form is best absorbed and least likely to cause digestive issues.',
        bestFor: ['muscle tension', 'anxiety-related insomnia', 'restless legs', 'stress-related sleep issues'],
        notBestFor: ['sleep onset problems', 'racing thoughts', 'severe insomnia'],
        howItWorks: 'Magnesium supports GABA production (a calming neurotransmitter), relaxes muscles, and regulates melatonin production.',
        evidenceStrength: 'moderate',
        onsetMinutes: 45,
        duration: '6-8 hours',
        grogginessRisk: 1,
        dependencyRisk: 1,
        sideEffectRisk: 1,
        safetyNotes: 'Take with food to avoid digestive issues. If you have kidney disease, consult a doctor before supplementing. Can interact with certain antibiotics and blood pressure medications.',
        whenToAvoid: ['kidney disease', 'heart conditions', 'on blood pressure medications (consult doctor)'],
        commonMistakes: ['Taking on empty stomach', 'Using wrong form (oxide vs glycinate)', 'Taking too late (can cause morning grogginess)', 'Not taking consistently'],
        keywords: ['magnesium', 'sleep mineral', 'muscle relaxation', 'anxiety', 'GABA'],
        isActive: true,
        sortOrder: 2,
      },
      {
        title: 'L-Theanine for Calm',
        slug: 'l-theanine-for-sleep',
        summary: 'L-Theanine is an amino acid from green tea that promotes relaxation without drowsiness, making it useful for anxiety-related sleep issues.',
        whatItIs: 'L-Theanine is a non-protein amino acid found naturally in tea leaves. It promotes alpha brain wave activity associated with relaxed alertness.',
        bestFor: ['anxiety-driven insomnia', 'racing thoughts', 'stress-related sleep issues', 'combination with other sleep aids'],
        notBestFor: ['severe insomnia', 'chronic pain', 'sleep apnea'],
        howItWorks: 'L-Theanine increases GABA, dopamine, and serotonin levels while promoting alpha brain waves for calm, relaxed focus.',
        evidenceStrength: 'strong',
        onsetMinutes: 30,
        duration: '4-6 hours',
        grogginessRisk: 1,
        dependencyRisk: 1,
        sideEffectRisk: 1,
        safetyNotes: 'Generally very safe. May lower blood pressure, so consult a doctor if you have low blood pressure or are on blood pressure medications.',
        whenToAvoid: ['low blood pressure', 'on blood pressure medications (consult doctor)', 'pregnancy (limited research)'],
        commonMistakes: ['Taking too high a dose (can cause vivid dreams)', 'Not being patient (takes time to work)', 'Taking with late caffeine'],
        keywords: ['l-theanine', 'green tea', 'relaxation', 'anxiety', 'calm'],
        isActive: true,
        sortOrder: 3,
      },
    ];
    
    await EvidenceEntry.insertMany(evidenceEntries);
    console.log(`   ✅ Seeded ${evidenceEntries.length} evidence entries`);

    console.log('\n✅ Database seeding complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Interventions: ${interventions.length}`);
    console.log(`   - Sleep Profiles: ${profiles.length}`);
    console.log(`   - Recommendation Rules: ${rules.length}`);
    console.log(`   - Evidence Entries: ${evidenceEntries.length}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };