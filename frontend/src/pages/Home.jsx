import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Moon, ArrowRight, CheckCircle, Brain, Shield, Clock, Star, ChevronDown } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: Brain,
      title: 'Personalized Sleep Profile',
      description: 'Get classified into one of 5 evidence-based sleep profiles based on your specific symptoms and patterns.',
    },
    {
      icon: Clock,
      title: 'Tonight\'s Action Plan',
      description: 'Receive a specific 3-step protocol for tonight, designed to work within your sleep window.',
    },
    {
      icon: Shield,
      title: 'Safety-First Recommendations',
      description: 'Every recommendation is checked against your health profile for contraindications and red flags.',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Complete the Quiz',
      description: 'Answer questions about your sleep patterns, anxiety triggers, and what you\'ve tried before. Takes about 2 minutes.',
    },
    {
      number: '02',
      title: 'Get Your Sleep Profile',
      description: 'We classify you into a specific sleep profile and explain why this matches your symptoms.',
    },
    {
      number: '03',
      title: 'Receive Your Plan',
      description: 'Get a personalized Tonight Sleep Plan with specific steps, supplements (if appropriate), and things to avoid.',
    },
    {
      number: '04',
      title: 'Track & Improve',
      description: 'Log your outcomes and refine your approach over 7 nights with our optional reset program.',
    },
  ];

  const testimonials = [
    {
      quote: 'I\'ve tried everything for my racing thoughts at night. This finally gave me a framework that made sense.',
      name: 'Sarah M.',
      role: 'Product Manager',
      rating: 5,
    },
    {
      quote: 'The safety flags caught something I wouldn\'t have thought to mention to a doctor. Important feature.',
      name: 'James K.',
      role: 'Software Engineer',
      rating: 5,
    },
    {
      quote: 'Not another generic sleep tip. This actually considers my specific situation and gives actionable advice.',
      name: 'Priya R.',
      role: 'Teacher',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'Is this a medical product?',
      answer: 'No. Sleep Relief Navigator provides educational wellness guidance and personalized informational recommendations. We are not a medical device, we do not diagnose conditions, and we do not replace professional medical advice.',
    },
    {
      question: 'What makes this different from other sleep apps?',
      answer: 'Most sleep apps give generic advice. We classify you into a specific sleep profile (like "Racing Mind" or "Tired But Wired") and generate recommendations based on evidence-based rules, not AI. You get a specific plan for tonight, not just general tips.',
    },
    {
      question: 'Are the recommendations safe?',
      answer: 'Yes. We screen for contraindications based on your health profile, medications, and other factors. If we detect potential safety concerns, we\'ll flag them and recommend consulting a healthcare professional.',
    },
    {
      question: 'What supplements do you recommend?',
      answer: 'We may suggest supplements like melatonin, magnesium glycinate, or L-theanine when appropriate for your profile. We only recommend non-prescription, over-the-counter options and always check for contraindications.',
    },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  const handleCta = () => {
    if (isAuthenticated) {
      navigate('/quiz');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/20 via-night-950 to-night-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-900/10 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-900/50 border border-brand-500/30 text-brand-300 text-sm mb-6">
                <Moon className="w-4 h-4" />
                For anxious nights and racing thoughts
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              Personalized sleep guidance for{' '}
              <span className="gradient-text">anxious nights</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-night-300 mb-8 max-w-2xl mx-auto"
            >
              Not random tips. Not another generic sleep app. A science-based sleep 
              plan built around your specific anxiety-driven sleep problems.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={handleCta}
                className="group w-full sm:w-auto px-8 py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-glow"
              >
                {isAuthenticated ? 'Take Quiz Again' : 'Get My Sleep Plan'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link
                to="/library"
                className="w-full sm:w-auto px-8 py-4 border border-night-700 hover:border-night-500 rounded-xl font-medium transition-colors"
              >
                Explore Evidence Library
              </Link>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm text-night-500 mt-4"
            >
              2-minute quiz • Personalized plan • No prescription required
            </motion.p>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="w-6 h-6 text-night-500 animate-bounce" />
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-night-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Tired of lying awake with your mind racing?
            </h2>
            <p className="text-lg text-night-300">
              If you can't fall asleep because of racing thoughts, wake up at 3am and can't get back, 
              or feel "tired but wired" — you're not alone. And random sleep tips from Google aren't helping.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: '🧠',
                title: 'Racing thoughts at bedtime',
                description: 'Your brain won\'t shut off. Work, worries, tomorrow\'s tasks — all spinning when you should be sleeping.',
              },
              {
                emoji: '😰',
                title: '3am anxiety spikes',
                description: 'You wake up wide awake with a surge of alertness, heart racing, impossible to fall back asleep.',
              },
              {
                emoji: '⚡',
                title: 'Tired but wired',
                description: 'Physically exhausted but mentally alert. Your body wants sleep but your mind is on overdrive.',
              },
            ].map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-night-900 border border-night-800 rounded-2xl p-6 text-center"
              >
                <div className="text-4xl mb-4">{problem.emoji}</div>
                <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                <p className="text-night-400">{problem.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-night-300 max-w-2xl mx-auto">
              From quiz to personalized plan in under 5 minutes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative bg-night-900/50 border border-night-800 rounded-2xl p-6"
              >
                <div className="text-6xl font-bold text-brand-500/20 absolute top-4 right-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-night-400 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button
              onClick={handleCta}
              className="group px-8 py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold transition-all flex items-center gap-2 mx-auto"
            >
              Start Your Sleep Assessment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-night-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Built for people who can't turn off their minds
              </h2>
              <p className="text-lg text-night-300 mb-8">
                Unlike generic sleep apps, we analyze your specific symptoms, classify your sleep profile, 
                and generate evidence-based recommendations designed for your exact situation.
              </p>
              
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-brand-900/50 border border-brand-500/30 flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-brand-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-night-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-600/20 to-brand-900/20 rounded-3xl p-8 border border-brand-500/20">
                <div className="bg-night-900 rounded-2xl p-6 border border-night-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                      <Moon className="w-5 h-5 text-brand-400" />
                    </div>
                    <div>
                      <div className="font-semibold">Your Sleep Profile</div>
                      <div className="text-sm text-brand-400">Racing Mind Sleep Onset</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-night-800/50 rounded-xl">
                      <div className="text-sm text-night-400 mb-1">Tonight's Plan</div>
                      <div className="font-medium">3-step protocol ready</div>
                    </div>
                    <div className="p-4 bg-night-800/50 rounded-xl">
                      <div className="text-sm text-night-400 mb-1">Top Recommendation</div>
                      <div className="font-medium">4-7-8 Breathing + L-Theanine</div>
                    </div>
                    <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
                      <div className="text-sm text-green-400">✓ Safety check passed</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">What Early Users Say</h2>
            <p className="text-lg text-night-300">Real feedback from people with anxiety-driven sleep problems</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-night-900/50 border border-night-800 rounded-2xl p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-brand-400 text-brand-400" />
                  ))}
                </div>
                <p className="text-night-200 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-semibold">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-night-500">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-night-900/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-night-900 border border-night-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between"
                >
                  <span className="font-medium">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-night-300 text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-brand-900/30 to-brand-600/10 rounded-3xl p-12 text-center border border-brand-500/20">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to break the sleepless cycle?
            </h2>
            <p className="text-lg text-night-300 mb-8 max-w-2xl mx-auto">
              Take our 2-minute quiz and get a personalized sleep plan tailored to your 
              anxiety-driven sleep problems. Tonight.
            </p>
            <button
              onClick={handleCta}
              className="group px-10 py-5 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold text-lg transition-all flex items-center gap-2 mx-auto shadow-glow"
            >
              Get My Sleep Plan
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-sm text-night-500 mt-4">
              Free to start • Evidence-based • No prescriptions needed
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 border-t border-night-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 text-sm text-yellow-200">
            <strong>Important:</strong> Sleep Relief Navigator provides educational wellness 
            guidance and personalized informational recommendations. This is not medical advice, 
            diagnosis, or treatment. If you have persistent sleep problems, severe insomnia, or 
            suspect a medical condition, please consult a healthcare professional.
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;