import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Menu, X, User, LogOut, Settings, Shield } from 'lucide-react';
import { useState } from 'react';

const MainLayout = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/library', label: 'Evidence Library' },
    { href: '/pricing', label: 'Pricing' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-night-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-night-950/80 backdrop-blur-lg border-b border-night-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Moon className="w-8 h-8 text-brand-400" />
              <span className="font-bold text-xl hidden sm:block">Sleep Relief Navigator</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-brand-400'
                      : 'text-night-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-night-800 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Auth buttons */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-night-300 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg hover:bg-night-800 transition-colors text-night-300 hover:text-white"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-night-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-night-800 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-night-800 bg-night-900">
            <div className="px-4 py-4 space-y-2">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-night-800 text-brand-400'
                      : 'text-night-300 hover:bg-night-800 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-night-300 hover:bg-night-800 hover:text-white rounded-lg transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-400 hover:bg-night-800 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-night-300 hover:bg-night-800 hover:text-white rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-night-900 border-t border-night-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="w-6 h-6 text-brand-400" />
                <span className="font-bold text-lg">Sleep Relief Navigator</span>
              </div>
              <p className="text-night-400 text-sm max-w-md">
                Personalized non-prescription sleep guidance for anxious nights. 
                Evidence-based recommendations to help you fall asleep and stay asleep.
              </p>
              <p className="text-night-500 text-xs mt-4">
                Not medical advice. Consult a healthcare provider for medical conditions.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-night-400">
                <li><Link to="/quiz" className="hover:text-white transition-colors">Take Quiz</Link></li>
                <li><Link to="/library" className="hover:text-white transition-colors">Evidence Library</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-night-400">
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-night-800 mt-8 pt-8 text-center text-night-500 text-sm">
            © {new Date().getFullYear()} Sleep Relief Navigator. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;