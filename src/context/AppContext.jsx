import { createContext, useContext } from 'react';

export const AppContext = createContext(null);

export const BOARD_THEMES = [
  { id: 'classic', name: 'Classic', light: '#F0D9B5', dark: '#B58863' },
  { id: 'green', name: 'Green', light: '#EEEED2', dark: '#769656' },
  { id: 'blue', name: 'Blue', light: '#DEE3E6', dark: '#8CA2AD' },
  { id: 'purple', name: 'Purple', light: '#D9D9EA', dark: '#7B61A8' },
  { id: 'night', name: 'Night', light: '#4A4A6A', dark: '#2A2A4A' },
];

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
