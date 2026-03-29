import React from 'react';
import { Link } from 'react-router-dom';
import { Moon } from 'lucide-react';

const PAGE_NAME = () => {
  return (
    <div className="min-h-screen bg-night-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Moon className="w-8 h-8 text-brand-400" />
            <span className="font-bold text-xl">Sleep Relief Navigator</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">PAGE_TITLE</h1>
          <p className="text-night-400">Page content coming soon.</p>
        </div>
        <div className="text-center">
          <Link to="/" className="text-brand-400 hover:text-brand-300">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default PAGE_NAME;
