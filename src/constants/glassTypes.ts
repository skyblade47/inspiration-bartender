import { GlassType } from '../types';

interface GlassConfig {
  label: string;
  description: string;
  icon: string;
}

export const glassConfigs: Record<GlassType, GlassConfig> = {
  [GlassType.BRANDY]: {
    label: '白兰地杯',
    description: '绘画/视觉灵感',
    icon: '🎨',
  },
  [GlassType.CHAMPAGNE]: {
    label: '香槟杯',
    description: '音乐/声音灵感',
    icon: '🎵',
  },
  [GlassType.WINE]: {
    label: '红酒杯',
    description: '文学/文字灵感',
    icon: '📖',
  },
  [GlassType.COCKTAIL]: {
    label: '古典鸡尾酒杯',
    description: '工作/商业灵感',
    icon: '💼',
  },
  [GlassType.BEAKER]: {
    label: '烧杯',
    description: '程序/技术灵感',
    icon: '💻',
  },
  [GlassType.MASON]: {
    label: '梅森罐',
    description: '生活/日常灵感',
    icon: '🌿',
  },
  [GlassType.FLASK]: {
    label: '锥形瓶',
    description: '科学/研究灵感',
    icon: '🔬',
  },
  [GlassType.MARTINI]: {
    label: '马天尼杯',
    description: '跨界/混合灵感',
    icon: '✨',
  },
};
