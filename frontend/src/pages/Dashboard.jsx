import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Moon, Calendar, TrendingUp, BookOpen, ArrowRight, MoonIcon } from 'lucide-react';

const Dashboard = () => {
  const { user, isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-night-950 text-white">
      {/* Header */}
      <div className="border-b border-night-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Moon className="w-6 h-6 text-brand-400" />
            <span className="font-bold text-lg">Dashboard</span>
          </div>
          <Link to="/quiz" className="text-sm text-brand-400 hover:text-brand-300">
            Take New Quiz →
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
          </h1>
          <p className="text-night-400">
            Track your sleep progress and access your personalized plans
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-night-900 border border-night-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-brand-400" />
              </div>
              <span className="text-night-400">Plans Created</span>
            </div>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-night-500 mt-1">Take the quiz to get started</p>
          </div>

          <div className="bg-night-900 border border-night-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-night-400">Last 7 Days</span>
            </div>
            <div className="text-3xl font-bold">--</div>
            <p className="text-sm text-night-500 mt-1">Log outcomes to track progress</p>
          </div>

          <div className="bg-night-900 border border-night-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-night-400">Sleep Profile</span>
            </div>
            <div className="text-lg font-bold">Not Classified</div>
            <p className="text-sm text-night-500 mt-1">Complete the quiz to find out</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/quiz"
            className="group bg-gradient-to-br from-brand-900/30 to-brand-600/10 border border-brand-500/20 rounded-2xl p-8 hover:border-brand-500/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Take Sleep Quiz</h3>
                <p className="text-night-300">
                  Get a personalized sleep plan in 2 minutes
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-brand-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/dashboard/plans"
            className="group bg-night-900 border border-night-800 rounded-2xl p-8 hover:border-night-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">My Plans</h3>
                <p className="text-night-300">
                  View and manage your saved sleep plans
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-night-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/dashboard/outcomes"
            className="group bg-night-900 border border-night-800 rounded-2xl p-8 hover:border-night-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Track Outcomes</h3>
                <p className="text-night-300">
                  Log your sleep quality and see trends
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-night-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/library"
            className="group bg-night-900 border border-night-800 rounded-2xl p-8 hover:border-night-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Evidence Library</h3>
                <p className="text-night-300">
                  Learn about sleep interventions and supplements
                </p>
              </div>
              <ArrowRight className="w-6 h-6 text-night-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Premium Upgrade */}
        <div className="bg-gradient-to-br from-brand-900/30 to-brand-600/10 border border-brand-500/20 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Unlock Premium Features</h3>
              <p className="text-night-300">
                Get 7-night reset plans, advanced tracking, and email support
              </p>
            </div>
            <Link
              to="/dashboard/billing"
              className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold transition-colors whitespace-nowrap"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;