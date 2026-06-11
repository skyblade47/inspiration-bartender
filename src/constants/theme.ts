import { MD3DarkTheme } from 'react-native-paper';
import { GlassType } from '../types';

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: '#1a1410',
    surface: '#2a1f18',
    primary: '#D4A017',
    secondary: '#FF8C00',
    onPrimary: '#1a1410',
    onSurface: '#f5f0e6',
    onSurfaceVariant: '#a89888',
    outline: '#4a3a2a',
  },
};

export const liquidColors: Record<GlassType, string> = {
  [GlassType.BRANDY]: '#1E3A5F',
  [GlassType.CHAMPAGNE]: '#9B59B6',
  [GlassType.WINE]: '#8B0000',
  [GlassType.COCKTAIL]: '#D4A017',
  [GlassType.BEAKER]: '#00FF7F',
  [GlassType.MASON]: '#FF8C00',
  [GlassType.FLASK]: '#87CEEB',
  [GlassType.MARTINI]: 'linear-gradient(135deg, #D4A017 0%, #9B59B6 100%)',
};

export const barColors = {
  background: '#1a1410',
  bar: '#3d2b1f',
  surface: '#2a1f18',
  primary: '#D4A017',
  accent: '#FF8C00',
  text: '#f5f0e6',
  textSecondary: '#a89888',
  outline: '#4a3a2a',
  border: '#4a3a2a',
};
