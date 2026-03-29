import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';
import { Moon, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Get started with personalized sleep guidance',
      features: [
        { text: 'Sleep profile classification', included: true },
        { text: 'Tonight\'s sleep plan', included: true },
        { text: 'Evidence library access', included: true },
        { text: 'Basic outcome tracking', included: true },
        { text: '7-night reset plan', included: false },
        { text: 'Advanced progress tracking', included: false },
        { text: 'Email support', included: false },
      ],
      cta: isAuthenticated ? 'Go to Quiz' : 'Start Free',
      highlighted: false,
    },
    {
      id: 'premium_monthly',
      name: 'Premium',
      price: '$9.99',
      period: '/month',
      description: 'Full access to accelerate your sleep improvement',
      features: [
        { text: 'Everything in Free', included: true },
        { text: '7-night reset program', included: true },
        { text: 'Advanced progress tracking', included: true },
        { text: 'Unlimited quiz retakes', included: true },
        { text: 'Outcome analytics & trends', included: true },
        { text: 'Email support', included: true },
        { text: 'Early access to new features', included: true },
      ],
      cta: 'Start Premium',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      id: 'one_time',
      name: '7-Night Reset',
      price: '$29',
      period: 'one-time',
      description: 'A comprehensive 7-night program to reset your sleep',
      features: [
        { text: 'Complete 7-night reset plan', included: true },
        { text: 'Daily protocol adjustments', included: true },
        { text: 'Progress tracking', included: true },
        { text: 'Evidence-based techniques', included: true },
        { text: 'Supplement guidance', included: true },
        { text: 'Email support for 7 days', included: true },
        { text: 'Save plan to dashboard', included: true },
      ],
      cta: 'Get the Reset',
      highlighted: false,
      badge: 'Best Value',
    },
  ];

  const handleSelectPlan = async (planId) => {
    if (planId === 'free') {
      navigate('/quiz');
      return;
    }

    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setLoadingPlan(planId);
    setLoading(true);

    try {
      let response;
      if (planId === 'premium_monthly') {
        response = await api.post('/billing/subscribe');
      } else if (planId === 'one_time') {
        response = await api.post('/billing/checkout', { priceKey: '7night_reset' });
      }

      if (response?.data?.data?.url) {
        window.location.href = response.data.data.url;
      }
    } catch (err) {
      console.error('Payment error:', err);
      error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-night-950 text-white">
      {/* Header */}
      <div className="border-b border-night-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-center gap-2">
          <Moon className="w-6 h-6 text-brand-400" />
          <span className="font-bold text-lg">Sleep Relief Navigator</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Invest in better sleep
          </h1>
          <p className="text-xl text-night-300 max-w-2xl mx-auto">
            Choose the plan that fits your sleep improvement journey. 
            Start free, upgrade when you're ready.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative bg-night-900 border rounded-2xl p-8 ${
                plan.highlighted 
                  ? 'border-brand-500 shadow-glow' 
                  : 'border-night-800'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-brand-500 text-white text-sm font-medium rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-night-400">{plan.period}</span>
                </div>
                <p className="text-sm text-night-400 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    {feature.included ? (
                      <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-night-600 shrink-0" />
                    )}
                    <span className={feature.included ? 'text-night-200' : 'text-night-500'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  plan.highlighted
                    ? 'bg-brand-600 hover:bg-brand-500 text-white'
                    : 'bg-night-800 hover:bg-night-700 text-night-200'
                } disabled:opacity-50`}
              >
                {loading && loadingPlan === plan.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {plan.cta}
                    {plan.id !== 'free' && <ArrowRight className="w-5 h-5" />}
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'Can I cancel my subscription anytime?',
                a: 'Yes, you can cancel your subscription at any time. You\'ll continue to have access until the end of your billing period.',
              },
              {
                q: 'What happens to my data if I downgrade?',
                a: 'Your saved plans and outcome logs are preserved. You\'ll just lose access to premium features.',
              },
              {
                q: 'Is this medical advice?',
                a: 'No. Sleep Relief Navigator provides educational wellness guidance, not medical advice. We are not a substitute for professional medical care.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 30-day money-back guarantee for our premium plans. Contact support if you\'re not satisfied.',
              },
            ].map((faq, i) => (
              <div key={i} className="bg-night-900 border border-night-800 rounded-xl p-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-night-400 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-900/30 border border-green-500/30 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-200 font-medium">30-day money-back guarantee</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-night-800 py-8 text-center">
        <p className="text-night-500 text-sm">
          Questions? <Link to="/contact" className="text-brand-400 hover:underline">Contact support</Link>
        </p>
      </footer>
    </div>
  );
};

export default Pricing;