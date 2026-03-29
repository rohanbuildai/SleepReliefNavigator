import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DashboardOutcomes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-night-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Sleep Outcomes</h1>
      <p className="text-night-400">Track your sleep quality and outcomes here.</p>
    </div>
  );
};

export default DashboardOutcomes;