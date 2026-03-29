import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Quiz = lazy(() => import('./pages/Quiz'));
const QuizResults = lazy(() => import('./pages/QuizResults'));
const HelpNow = lazy(() => import('./pages/HelpNow'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Library = lazy(() => import('./pages/Library'));
const LibraryDetail = lazy(() => import('./pages/LibraryDetail'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardPlans = lazy(() => import('./pages/DashboardPlans'));
const DashboardOutcomes = lazy(() => import('./pages/DashboardOutcomes'));
const DashboardBilling = lazy(() => import('./pages/DashboardBilling'));
const DashboardSettings = lazy(() => import('./pages/DashboardSettings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-night-950 flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

function App() {
  const { theme } = useTheme();

  return (
    <div className={theme}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/:slug" element={<LibraryDetail />} />
            <Route path="/learn/:slug" element={<LibraryDetail />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
          </Route>

          {/* Quiz flow (separate layout for focus) */}
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/quiz/results/:planId" element={<QuizResults />} />
          <Route path="/help-now" element={<HelpNow />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/plans" element={<DashboardPlans />} />
          <Route path="/dashboard/outcomes" element={<DashboardOutcomes />} />
          <Route path="/dashboard/billing" element={<DashboardBilling />} />
          <Route path="/dashboard/settings" element={<DashboardSettings />} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/interventions" element={<AdminDashboard />} />
          <Route path="/admin/rules" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;