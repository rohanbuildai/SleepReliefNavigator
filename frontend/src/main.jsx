import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import App from './App';
import './styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple error fallback component
const ErrorFallback = ({ error, resetError }) => (
  <div className="min-h-screen bg-night-950 text-white flex items-center justify-center p-4">
    <div className="max-w-md text-center">
      <div className="text-6xl mb-6">😴</div>
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-night-400 mb-6">
        {error?.message || "We're sorry for the inconvenience. Please refresh the page or try again later."}
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={resetError}
          className="px-6 py-3 bg-night-800 hover:bg-night-700 rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-xl font-medium transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  </div>
);

// Error boundary for the entire app
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

// Render app
try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ThemeProvider>
              <ToastProvider>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </ToastProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (err) {
  console.error('Fatal render error:', err);
  document.getElementById('root').innerHTML = `
    <div style="min-height:100vh;background:#020617;color:white;display:flex;align-items:center;justify-content:center;font-family:system-ui;">
      <div style="text-align:center;padding:2rem;">
        <div style="font-size:3rem;margin-bottom:1rem;">😴</div>
        <h1 style="font-size:1.5rem;font-weight:bold;margin-bottom:1rem;">Something went wrong</h1>
        <p style="color:#94a3b8;margin-bottom:1.5rem;">Please refresh the page or try again later.</p>
        <button onclick="location.reload()" style="padding:0.75rem 1.5rem;background:#7c3aed;color:white;border-radius:0.75rem;font-weight:500;cursor:pointer;border:none;">
          Refresh Page
        </button>
      </div>
    </div>
  `;
}