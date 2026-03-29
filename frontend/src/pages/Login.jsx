import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Moon, Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Basic validation
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message || 'Login failed';
      error(message);
      if (message && typeof message === 'string') {
        if (message.includes('email')) {
          setErrors({ email: message });
        } else if (message.includes('password')) {
          setErrors({ password: message });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Moon className="w-8 h-8 text-brand-400" />
            <span className="font-bold text-xl">Sleep Relief Navigator</span>
          </Link>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-night-400 mt-2">Sign in to access your sleep plans</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-night-900 border border-night-800 rounded-2xl p-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-night-800 border rounded-xl focus:outline-none transition-colors ${
                  errors.email ? 'border-red-500' : 'border-night-700 focus:border-brand-500'
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-night-800 border rounded-xl focus:outline-none transition-colors ${
                  errors.password ? 'border-red-500' : 'border-night-700 focus:border-brand-500'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-brand-400 hover:text-brand-300"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-600 hover:bg-brand-500 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Register link */}
        <p className="text-center mt-6 text-night-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;