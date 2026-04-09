import React, { useCallback, useState } from 'react';
import { AppContext, BOARD_THEMES } from './AppContext.jsx';
import { useCacheInitializer } from '../hooks/useCacheInitializer.js';

export function AppProvider({ children }) {
  // Initialize global caches for instant preview board rendering
  useCacheInitializer();
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';

    try {
      return window.localStorage.getItem('app-theme') || 'light';
    } catch {
      return 'light';
    }
  });
  const [showLegalDots, setShowLegalDots] = useState(true);
  const [showThreats, setShowThreats] = useState(false);
  // Default piece UI matches the screenshot "Classic" set.
  const [pieceStyle, setPieceStyle] = useState('Classic');
  const [boardTheme, setBoardTheme] = useState(BOARD_THEMES[0]);
  const [showEvalBar, setShowEvalBar] = useState(true);
  const [autoEnPassant, setAutoEnPassant] = useState(true);

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem('app-theme', theme);
    } catch {
      // Ignore storage errors and keep the in-memory theme state.
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = React.useMemo(() => ({
    theme, toggleTheme,
    showLegalDots, setShowLegalDots,
    showThreats, setShowThreats,
    pieceStyle, setPieceStyle,
    boardTheme, setBoardTheme,
    showEvalBar, setShowEvalBar,
    autoEnPassant, setAutoEnPassant,
  }), [
    theme, toggleTheme,
    showLegalDots,
    showThreats,
    pieceStyle,
    boardTheme,
    showEvalBar,
    autoEnPassant
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;
