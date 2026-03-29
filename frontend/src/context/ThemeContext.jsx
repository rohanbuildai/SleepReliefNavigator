import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default values if not in provider (fallback)
    return { theme: 'dark', isDark: true, setTheme: () => {}, toggleTheme: () => {} };
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark'); // Default to dark for nighttime app
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage or system preference
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        setTheme(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light');
      }
    } catch (e) {
      // localStorage might not be available
      console.warn('Theme initialization error:', e);
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof document !== 'undefined') {
      try {
        localStorage.setItem('theme', theme);
        // Update HTML class
        if (theme === 'light') {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        console.warn('Theme update error:', e);
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  if (!mounted) {
    // Prevent flash by returning dark theme until mounted
    return (
      <div className="dark">
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;