import { GlassType } from '../types';

interface GlassConfig {
  label: string;
  description: string;
  icon: string;
  liquidColor: string;
}

export const glassConfigs: Record<GlassType, GlassConfig> = {
  [GlassType.BRANDY]: {
    label: '白兰地杯',
    description: '绘画/视觉灵感',
    icon: '🎨',
    liquidColor: '#1E3A5F',
  },
  [GlassType.CHAMPAGNE]: {
    label: '香槟杯',
    description: '音乐/声音灵感',
    icon: '🎵',
    liquidColor: '#9B59B6',
  },
  [GlassType.WINE]: {
    label: '红酒杯',
    description: '文学/文字灵感',
    icon: '📖',
    liquidColor: '#8B0000',
  },
  [GlassType.COCKTAIL]: {
    label: '古典鸡尾酒杯',
    description: '工作/商业灵感',
    icon: '💼',
    liquidColor: '#D4A017',
  },
  [GlassType.BEAKER]: {
    label: '烧杯',
    description: '程序/技术灵感',
    icon: '💻',
    liquidColor: '#00FF7F',
  },
  [GlassType.MASON]: {
    label: '梅森罐',
    description: '生活/日常灵感',
    icon: '🌿',
    liquidColor: '#FF8C00',
  },
  [GlassType.FLASK]: {
    label: '锥形瓶',
    description: '科学/研究灵感',
    icon: '🔬',
    liquidColor: '#87CEEB',
  },
  [GlassType.MARTINI]: {
    label: '马天尼杯',
    description: '跨界/混合灵感',
    icon: '✨',
    liquidColor: '#9B59B6',
  },
};
