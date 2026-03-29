import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Moon, CheckCircle, AlertTriangle, ArrowRight, Save, Share2, Clock, Shield, Leaf } from 'lucide-react';

const QuizResults = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        navigate('/quiz');
        return;
      }

      try {
        // If authenticated, fetch from API
        if (isAuthenticated) {
          const response = await api.get(`/plans/${planId}`);
          if (response.data.success) {
            setPlan(response.data.data.plan);
          }
        } else {
          // For non-authenticated users, we'd need to store in localStorage
          // For now, show a message
          setPlan(null);
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, isAuthenticated, navigate]);

  const handleSavePlan = async () => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/plans/${planId}`, { isSaved: true });
      // Show success
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-night-950 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show placeholder if not authenticated (in real app, would have better handling)
  const profileName = plan?.profileName || 'Your Sleep Profile';
  const profileSlug = plan?.profileSlug || 'racing_mind';

  const profileInfo = {
    'racing_mind': {
      name: 'Racing Mind Sleep Onset',
      description: 'You have difficulty quieting mental activity at bedtime. Your brain stays active when it should be winding down.',
      icon: '🧠',
    },
    'midnight_wake': {
      name: 'Middle-of-Night Adrenaline Wake',
      description: 'You wake up in the middle of the night with difficulty returning to sleep, often with a surge of alertness.',
      icon: '🌙',
    },
    'tired_wired': {
      name: 'Tired But Wired Hyperarousal',
      description: 'You\'re physically exhausted but mentally alert. Your body wants sleep but your mind is on overdrive.',
      icon: '⚡',
    },
    'bedtime_anxiety': {
      name: 'Bedtime Anticipatory Anxiety',
      description: 'You experience fear or dread about not being able to sleep, creating a cycle that perpetuates sleeplessness.',
      icon: '😰',
    },
    'body_tension': {
      name: 'Body Tension Dominant Sleeplessness',
      description: 'Physical tension and somatic anxiety prevent you from relaxing enough for sleep.',
      icon: '💪',
    },
  };

  const info = profileInfo[profileSlug] || profileInfo['racing_mind'];

  return (
    <div className="min-h-screen bg-night-950 text-white">
      {/* Header */}
      <div className="border-b border-night-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-6 h-6 text-brand-400" />
            <span className="font-semibold">Your Sleep Plan</span>
          </div>
          <Link to="/quiz" className="text-sm text-night-400 hover:text-white transition-colors">
            Take New Quiz
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Classification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-brand-900/50 border border-brand-500/30 rounded-full mb-6">
            <span className="text-2xl">{info.icon}</span>
            <span className="text-brand-300 font-medium">{info.name}</span>
          </div>
          <p className="text-lg text-night-300 max-w-2xl mx-auto">{info.description}</p>
        </motion.div>

        {/* Tonight's Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-night-900/50 border border-night-800 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Moon className="w-6 h-6 text-brand-400" />
            <h2 className="text-2xl font-bold">Tonight's Sleep Plan</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-brand-400">Step 1: Start Now</h3>
              <div className="bg-night-900 border border-night-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
                    <span className="text-2xl">🧘</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">4-7-8 Breathing Technique</h4>
                    <p className="text-night-300 mb-4">
                      A breathing pattern that activates your parasympathetic nervous system to induce calm.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-night-800 rounded-full text-sm">
                        <Clock className="w-4 h-4" /> 5 minutes
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
                        <CheckCircle className="w-4 h-4" /> No grogginess risk
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-900/50 text-brand-400 rounded-full text-sm">
                        <Shield className="w-4 h-4" /> Evidence strong
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-brand-400">Step 2: After 5 Minutes</h3>
              <div className="bg-night-900 border border-night-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
                    <span className="text-2xl">💊</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">L-Theanine (100-200mg)</h4>
                    <p className="text-night-300 mb-4">
                      An amino acid that promotes relaxation without drowsiness. Supports calm focus.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-night-800 rounded-full text-sm">
                        <Clock className="w-4 h-4" /> Takes 30 minutes
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-sm">
                        <Leaf className="w-4 h-4" /> Natural
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-brand-400">Step 3: If Still Awake After 20 Minutes</h3>
              <div className="bg-night-900 border border-night-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Cognitive Unload</h4>
                    <p className="text-night-300 mb-4">
                      Get up briefly, write down what's on your mind, then return to bed with a clearer mind.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-night-800 rounded-full text-sm">
                        <Clock className="w-4 h-4" /> 10 minutes
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-900/30 text-yellow-400 rounded-full text-sm">
                        <AlertTriangle className="w-4 h-4" /> Leave bed if >20 min awake
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Avoid Tonight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-bold text-red-400">Avoid Tonight</h2>
          </div>
          <ul className="space-y-2 text-red-200">
            <li className="flex items-center gap-2">
              <span className="text-red-400">✕</span>
              Screens / blue light (use night mode if necessary)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400">✕</span>
              Caffeine after noon (if you had any today)
            </li>
            <li className="flex items-center gap-2">
              <span className="text-red-400">✕</span>
              Checking the time repeatedly
            </li>
          </ul>
        </motion.div>

        {/* Why This Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-night-900/50 border border-night-800 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-xl font-bold mb-4">Why This Fits Your Profile</h2>
          <p className="text-night-300 leading-relaxed">
            {info.description} The recommended interventions target cognitive arousal reduction through 
            relaxation techniques and mental unloading strategies that are evidence-based for this 
            specific sleep pattern. The combination addresses both the mental and physical components 
            of your sleep difficulty.
          </p>
        </motion.div>

        {/* Safety Note */}
        {plan?.needsProfessionalHelp && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-200 mb-2">Consider Professional Help</h3>
                <p className="text-yellow-100/80 text-sm">
                  Based on your responses, we recommend consulting a healthcare professional. 
                  If your sleep problems persist, please consider speaking with a sleep specialist 
                  or your primary care provider.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          {isAuthenticated ? (
            <button
              onClick={handleSavePlan}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save to Dashboard'}
            </button>
          ) : (
            <Link
              to="/register"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold transition-all"
            >
              Create Account to Save
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
          <Link
            to="/library"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 border border-night-700 hover:border-night-500 rounded-xl font-medium transition-colors"
          >
            Explore Evidence Library
          </Link>
        </motion.div>

        {/* CTA for premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-gradient-to-br from-brand-900/30 to-brand-600/10 rounded-2xl p-8 text-center border border-brand-500/20"
        >
          <h3 className="text-xl font-bold mb-4">Want a 7-Night Reset Plan?</h3>
          <p className="text-night-300 mb-6 max-w-lg mx-auto">
            Get a progressive plan that builds better sleep habits over 7 nights, with daily adjustments 
            based on your outcomes.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold transition-all"
          >
            Unlock Premium Plan
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default QuizResults;