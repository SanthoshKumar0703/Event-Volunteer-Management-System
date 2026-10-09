import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Types
type ThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';

interface ThemeContextType {
  theme: ThemeMode;
  actualTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>('SYSTEM');
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

  // Check system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const systemPrefersDark = mediaQuery.matches;
    
    // Check localStorage
    const savedTheme = localStorage.getItem('eventflow-theme') as ThemeMode | null;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (systemPrefersDark) {
      setTheme('SYSTEM');
    }
  }, []);

  // Update actual theme based on selected theme and system preference
  useEffect(() => {
    if (theme === 'SYSTEM') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setActualTheme(mediaQuery.matches ? 'dark' : 'light');
      
      // Listen for system theme changes
      const handler = (e: MediaQueryListEvent) => {
        setActualTheme(e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setActualTheme(theme.toLowerCase() as 'light' | 'dark');
    }
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (actualTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    
    // Save to localStorage if not SYSTEM
    if (theme !== 'SYSTEM') {
      localStorage.setItem('eventflow-theme', theme);
    }
  }, [actualTheme, theme]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'LIGHT' ? 'DARK' : theme === 'DARK' ? 'SYSTEM' : 'LIGHT';
    setTheme(newTheme);
  };

  // Set theme
  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    actualTheme,
    setTheme: handleSetTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Export context for testing
export { ThemeContext };
