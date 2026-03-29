import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Moon, ArrowLeft, ArrowRight, Check, AlertTriangle, Loader2 } from 'lucide-react';

const Quiz = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { success, error } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    primaryIssue: '',
    symptoms: [],
    urgency: '',
    supplementPreference: '',
    sensitivity: [],
    tried: [],
    safetyFlags: [],
    caffeineAfterNoon: false,
    lateScreenTime: false,
    inconsistentSchedule: false,
  });

  const questions = [
    {
      id: 'primaryIssue',
      question: 'What\'s your primary sleep challenge?',
      subtitle: 'Select the one that bothers you most',
      type: 'single',
      options: [
        { value: 'cannot_fall_asleep', label: 'Can\'t fall asleep', icon: '🧠' },
        { value: 'wake_up_cant_return', label: 'Wake up and can\'t return to sleep', icon: '🌙' },
        { value: 'tired_but_wired', label: 'Tired but wired / hyperarousal', icon: '⚡' },
        { value: 'bedtime_dread', label: 'Bedtime anxiety / dread', icon: '😰' },
        { value: 'racing_thoughts', label: 'Racing thoughts at bedtime', icon: '💭' },
        { value: 'physical_tension', label: 'Physical tension in body', icon: '💪' },
      ],
    },
    {
      id: 'urgency',
      question: 'What are you looking for?',
      subtitle: 'This helps us tailor the recommendations',
      type: 'single',
      options: [
        { value: 'need_help_tonight', label: 'Need help tonight', icon: '🌙' },
        { value: 'long_term', label: 'Want long-term improvement', icon: '📈' },
        { value: 'both', label: 'Both - tonight and over time', icon: '🎯' },
      ],
    },
    {
      id: 'supplementPreference',
      question: 'How do you feel about supplements?',
      subtitle: 'We only recommend non-prescription options',
      type: 'single',
      options: [
        { value: 'no_supplements', label: 'No supplements at all', icon: '🚫' },
        { value: 'open_to_supplements', label: 'Open to supplements if safe', icon: '👍' },
        { value: 'unsure', label: 'Not sure / need more info', icon: '❓' },
      ],
    },
    {
      id: 'sensitivity',
      question: 'What concerns you most about sleep aids?',
      subtitle: 'Select all that apply',
      type: 'multi',
      options: [
        { value: 'hate_grogginess', label: 'Morning grogginess', icon: '😴' },
        { value: 'fear_dependency', label: 'Dependency / addiction', icon: '🔒' },
        { value: 'fear_side_effects', label: 'Side effects', icon: '⚠️' },
        { value: 'want_natural_only', label: 'Prefer natural only', icon: '🌿' },
      ],
    },
    {
      id: 'tried',
      question: 'What have you already tried?',
      subtitle: 'Select all that apply',
      type: 'multi',
      options: [
        { value: 'melatonin', label: 'Melatonin', icon: '💊' },
        { value: 'magnesium', label: 'Magnesium', icon: '🧲' },
        { value: 'l_theanine', label: 'L-Theanine', icon: '🍵' },
        { value: 'meditation', label: 'Meditation / mindfulness', icon: '🧘' },
        { value: 'breathwork', label: 'Breathing exercises', icon: '🌬️' },
        { value: 'white_noise', label: 'White noise / sleep sounds', icon: '🔊' },
        { value: 'journaling', label: 'Journaling', icon: '📝' },
        { value: 'none', label: 'Nothing yet', icon: '🙈' },
      ],
    },
    {
      id: 'safetyFlags',
      question: 'Are any of these true for you?',
      subtitle: 'This helps us ensure your safety',
      type: 'multi',
      options: [
        { value: 'pregnancy', label: 'Pregnancy', icon: '🤰' },
        { value: 'antidepressants', label: 'Taking antidepressants', icon: '💊' },
        { value: 'stimulant_medication', label: 'Taking stimulant medication (ADHD meds)', icon: '⚡' },
        { value: 'blood_pressure_medication', label: 'Taking blood pressure medication', icon: '❤️' },
        { value: 'sleep_apnea', label: 'History of loud snoring / breathing issues', icon: '😤' },
        { value: 'severe_insomnia', label: 'Severe insomnia (more than a month)', icon: '⏰' },
        { value: 'panic_symptoms', label: 'Experiencing panic symptoms', icon: '😱' },
        { value: 'none', label: 'None of these apply', icon: '✓' },
      ],
    },
    {
      id: 'lifestyle',
      question: 'Regarding your lifestyle habits:',
      subtitle: 'Select all that apply',
      type: 'multi',
      options: [
        { value: 'caffeineAfterNoon', label: 'I have caffeine after noon', icon: '☕' },
        { value: 'lateScreenTime', label: 'I use screens close to bedtime', icon: '📱' },
        { value: 'inconsistentSchedule', label: 'My sleep schedule varies a lot', icon: '📅' },
        { value: 'eveningStress', label: 'High stress in the evenings', icon: '😓' },
        { value: 'none', label: 'None of these apply', icon: '✓' },
      ],
    },
    {
      id: 'email',
      question: 'Almost done!',
      subtitle: isAuthenticated 
        ? 'We\'ll save your plan to your dashboard'
        : 'Enter your email to save your plan (optional)',
      type: 'email',
      required: false,
    },
  ];

  const totalSteps = questions.length;
  const progress = ((currentStep) / totalSteps) * 100;

  const handleOptionSelect = (questionId, value, isMulti) => {
    if (isMulti) {
      setAnswers(prev => {
        const current = prev[questionId] || [];
        return {
          ...prev,
          [questionId]: current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value],
        };
      });
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: value,
      }));
    }
  };

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Start quiz session
      const startResponse = await api.post('/quiz/start', {
        type: 'full',
        source: 'landing_page',
      });
      
      const session = startResponse.data.data;
      setSessionId(session.sessionId);
      
      // Complete quiz with all answers
      const completeResponse = await api.post('/quiz/complete', {
        sessionId: session.sessionId,
        answers,
        safetyFlags: answers.safetyFlags,
        emailCaptured: answers.email || (isAuthenticated ? user?.email : null),
      });
      
      const result = completeResponse.data.data;
      
      success('Your sleep plan is ready!');
      navigate(`/quiz/results/${result.planId}`);
    } catch (err) {
      console.error('Quiz submission error:', err);
      error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    const currentQ = questions[currentStep];
    if (currentQ.required === false && !answers[currentQ.id]) return true;
    if (currentQ.type === 'multi') {
      return answers[currentQ.id]?.length > 0;
    }
    return !!answers[currentQ.id];
  };

  const currentQ = questions[currentStep];

  return (
    <div className="min-h-screen bg-night-950 text-white flex flex-col">
      {/* Header */}
      <div className="border-b border-night-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-night-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Quiz
          </button>
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-brand-400" />
            <span className="font-semibold">Sleep Relief Navigator</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-night-900 border-b border-night-800">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-night-400">Step {currentStep + 1} of {totalSteps}</span>
            <span className="text-sm text-night-400">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-night-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl w-full">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
              {currentQ.question}
            </h2>
            <p className="text-night-400 text-center mb-8">
              {currentQ.subtitle}
            </p>

            {currentQ.type === 'email' ? (
              <div className="space-y-4">
                {isAuthenticated ? (
                  <div className="bg-night-900 border border-night-700 rounded-xl p-4 text-center">
                    <p className="text-night-300">We'll save your results to your account:</p>
                    <p className="font-medium text-brand-400">{user?.email}</p>
                  </div>
                ) : (
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={answers.email || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-6 py-4 bg-night-900 border border-night-700 rounded-xl text-lg focus:outline-none focus:border-brand-500 transition-colors"
                  />
                )}
                <p className="text-sm text-night-500 text-center">
                  You can also complete the quiz without providing an email
                </p>
              </div>
            ) : (
              <div className={`grid gap-3 ${currentQ.type === 'single' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {currentQ.options.map((option) => {
                  const isSelected = currentQ.type === 'multi'
                    ? answers[currentQ.id]?.includes(option.value)
                    : answers[currentQ.id] === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleOptionSelect(currentQ.id, option.value, currentQ.type === 'multi')}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'bg-brand-900/50 border-brand-500 text-brand-100'
                          : 'bg-night-900 border-night-700 hover:border-night-500 text-night-200 hover:text-white'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="font-medium">{option.label}</span>
                      {isSelected && (
                        <Check className="w-5 h-5 ml-auto text-brand-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Safety warning for certain flags */}
            {currentQ.id === 'safetyFlags' && answers.safetyFlags?.length > 0 && !answers.safetyFlags.includes('none') && (
              <div className="mt-6 bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-200">
                  <strong>Note:</strong> Based on your responses, we'll be extra careful with 
                  recommendations and may flag items for professional consultation.
                </div>
              </div>
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-12">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors ${
                currentStep === 0
                  ? 'text-night-600 cursor-not-allowed'
                  : 'text-night-300 hover:text-white hover:bg-night-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep === totalSteps - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="group flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Get My Sleep Plan
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer disclaimer */}
      <div className="p-4 border-t border-night-800 text-center">
        <p className="text-xs text-night-600">
          This quiz provides educational wellness guidance, not medical advice. 
          If you have serious sleep concerns, please consult a healthcare professional.
        </p>
      </div>
    </div>
  );
};

export default Quiz;