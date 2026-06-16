import {
  hexToRgb,
  rgbToHex,
  mixColors,
  gradientMixColors,
  getGlassDefaultColor,
  getStatusDefaultColor,
  isValidInspiration,
  isValidCollisionSource,
  extractKeywords,
  extractCommonThemes,
  mergeInspirationContent,
  decideMixType,
  calculateMixIntensity,
  generateCollisionId,
  generateInspirationId,
  ColorMixMode,
} from '../../../src/services/collision/utils';
import { Inspiration, GlassType, InspirationStatus, MixType } from '../../../src/types';

const createMockInspiration = (overrides: Partial<Inspiration> = {}): Inspiration => ({
  id: 'test-1',
  name: '测试灵感',
  type: GlassType.COCKTAIL,
  completion: 50,
  status: InspirationStatus.GROW,
  rawInput: { text: '这是一个测试灵感文本' },
  brewingLog: [],
  brainstormCards: [],
  collisionHistory: [],
  structuredContent: { title: '标题' },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('碰撞服务工具函数', () => {
  describe('ID 生成', () => {
    it('generateCollisionId 应生成唯一碰撞 ID', () => {
      const id1 = generateCollisionId();
      const id2 = generateCollisionId();

      expect(id1).toMatch(/^collision_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^collision_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('generateInspirationId 应生成唯一灵感 ID', () => {
      const id1 = generateInspirationId();
      const id2 = generateInspirationId();

      expect(id1).toMatch(/^inspiration_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^inspiration_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('颜色转换', () => {
    describe('hexToRgb', () => {
      it('应正确转换十六进制颜色', () => {
        const rgb = hexToRgb('#FF0000');
        expect(rgb).toEqual([255, 0, 0]);
      });

      it('应处理不带 # 的颜色', () => {
        const rgb = hexToRgb('00FF00');
        expect(rgb).toEqual([0, 255, 0]);
      });

      it('无效颜色应返回灰色', () => {
        const rgb = hexToRgb('invalid');
        expect(rgb).toEqual([128, 128, 128]);
      });
    });

    describe('rgbToHex', () => {
      it('应正确转换 RGB 为十六进制', () => {
        const hex = rgbToHex([255, 0, 0]);
        expect(hex).toBe('#ff0000');
      });

      it('应处理超过 255 的值并截断', () => {
        const hex = rgbToHex([300, -50, 128]);
        expect(hex).toBe('#ff0080');
      });

      it('应补齐单位数十六进制', () => {
        const hex = rgbToHex([10, 1, 255]);
        expect(hex).toBe('#0a01ff');
      });
    });
  });

  describe('ColorMixMode 枚举', () => {
    it('应包含正确的模式值', () => {
      expect(ColorMixMode.NORMAL).toBe('normal');
      expect(ColorMixMode.MULTIPLY).toBe('multiply');
      expect(ColorMixMode.SCREEN).toBe('screen');
      expect(ColorMixMode.OVERLAY).toBe('overlay');
    });
  });

  describe('mixColors', () => {
    it('NORMAL 模式应进行线性混合', () => {
      const result = mixColors('#FF0000', '#00FF00', ColorMixMode.NORMAL, 0.5);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('MULTIPLY 模式应进行正片叠底', () => {
      const result = mixColors('#FF0000', '#00FF00', ColorMixMode.MULTIPLY);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('SCREEN 模式应进行屏幕混合', () => {
      const result = mixColors('#FF0000', '#00FF00', ColorMixMode.SCREEN);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('OVERLAY 模式应进行叠加混合', () => {
      const result = mixColors('#FF0000', '#00FF00', ColorMixMode.OVERLAY);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('应使用默认混合模式', () => {
      const result = mixColors('#FF0000', '#00FF00');
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('应使用默认混合比例', () => {
      const result = mixColors('#FF0000', '#00FF00', ColorMixMode.NORMAL);
      expect(result).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe('gradientMixColors', () => {
    it('单颜色应返回原数组', () => {
      const result = gradientMixColors(['#FF0000']);
      expect(result).toEqual(['#FF0000']);
    });

    it('两颜色应插入中间色', () => {
      const result = gradientMixColors(['#FF0000', '#00FF00']);
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('#FF0000');
      expect(result[2]).toBe('#00FF00');
    });

    it('多颜色应正确渐进混合', () => {
      const result = gradientMixColors(['#FF0000', '#00FF00', '#0000FF']);
      expect(result).toHaveLength(5);
    });

    it('应支持自定义混合模式', () => {
      const result = gradientMixColors(['#FF0000', '#00FF00'], ColorMixMode.MULTIPLY);
      expect(result).toHaveLength(3);
    });
  });

  describe('getGlassDefaultColor', () => {
    it('应为每个杯子类型返回对应颜色', () => {
      expect(getGlassDefaultColor(GlassType.BRANDY)).toBe('#4169E1');
      expect(getGlassDefaultColor(GlassType.CHAMPAGNE)).toBe('#DDA0DD');
      expect(getGlassDefaultColor(GlassType.WINE)).toBe('#8B0000');
      expect(getGlassDefaultColor(GlassType.COCKTAIL)).toBe('#D2691E');
      expect(getGlassDefaultColor(GlassType.BEAKER)).toBe('#00FF7F');
      expect(getGlassDefaultColor(GlassType.MASON)).toBe('#FF8C00');
      expect(getGlassDefaultColor(GlassType.FLASK)).toBe('#E0FFFF');
      expect(getGlassDefaultColor(GlassType.MARTINI)).toBe('#FF69B4');
    });

    it('未知类型应返回默认灰色', () => {
      expect(getGlassDefaultColor('unknown' as GlassType)).toBe('#808080');
    });
  });

  describe('getStatusDefaultColor', () => {
    it('应为每个状态返回对应颜色', () => {
      expect(getStatusDefaultColor(InspirationStatus.SEED)).toBe('#8B4513');
      expect(getStatusDefaultColor(InspirationStatus.SPROUT)).toBe('#90EE90');
      expect(getStatusDefaultColor(InspirationStatus.GROW)).toBe('#32CD32');
      expect(getStatusDefaultColor(InspirationStatus.BUD)).toBe('#FFB6C1');
      expect(getStatusDefaultColor(InspirationStatus.BLOOM)).toBe('#FFD700');
    });

    it('未知状态应返回默认灰色', () => {
      expect(getStatusDefaultColor('unknown' as InspirationStatus)).toBe('#808080');
    });
  });

  describe('类型验证', () => {
    describe('isValidInspiration', () => {
      it('缺少 id 应返回 false', () => {
        const inspiration = createMockInspiration({ id: undefined as any });
        expect(isValidInspiration(inspiration)).toBe(false);
      });

      it('缺少 name 应返回 false', () => {
        const inspiration = createMockInspiration({ name: undefined as any });
        expect(isValidInspiration(inspiration)).toBe(false);
      });

      it('无效 type 应返回 false', () => {
        const inspiration = createMockInspiration({ type: 'invalid' as GlassType });
        expect(isValidInspiration(inspiration)).toBe(false);
      });

      it('非对象应返回 false', () => {
        expect(isValidInspiration('string' as any)).toBe(false);
      });
    });

    describe('isValidCollisionSource', () => {
      it('2-3 个有效 ID 应返回 true', () => {
        expect(isValidCollisionSource(['id1', 'id2'])).toBe(true);
        expect(isValidCollisionSource(['id1', 'id2', 'id3'])).toBe(true);
      });

      it('少于 2 个 ID 应返回 false', () => {
        expect(isValidCollisionSource(['id1'])).toBe(false);
        expect(isValidCollisionSource([])).toBe(false);
      });

      it('多于 3 个 ID 应返回 false', () => {
        expect(isValidCollisionSource(['id1', 'id2', 'id3', 'id4'])).toBe(false);
      });

      it('包含空字符串应返回 false', () => {
        expect(isValidCollisionSource(['id1', ''])).toBe(false);
      });

      it('非数组应返回 false', () => {
        expect(isValidCollisionSource(null as unknown as string[])).toBe(false);
        expect(isValidCollisionSource('string' as unknown as string[])).toBe(false);
      });
    });
  });

  describe('内容提取', () => {
    describe('extractKeywords', () => {
      it('应从名称提取关键词', () => {
        const inspiration = createMockInspiration({ name: '项目 开发 设计' });
        const keywords = extractKeywords(inspiration);
        expect(keywords).toContain('项目');
        expect(keywords).toContain('开发');
        expect(keywords).toContain('设计');
      });

      it('应从文本提取关键词', () => {
        const inspiration = createMockInspiration({
          rawInput: { text: '这是 一个 测试文本' },
        });
        const keywords = extractKeywords(inspiration);
        expect(keywords).toContain('这是');
        expect(keywords).toContain('测试文本');
      });

      it('应去除重复关键词', () => {
        const inspiration = createMockInspiration({ name: '测试 测试' });
        const keywords = extractKeywords(inspiration);
        expect(keywords.filter(k => k === '测试')).toHaveLength(1);
      });
    });

    describe('extractCommonThemes', () => {
      it('应提取出现多次的共同主题', () => {
        const inspirations = [
          createMockInspiration({ id: '1', name: '项目' }),
          createMockInspiration({ id: '2', name: '项目' }),
        ];
        const themes = extractCommonThemes(inspirations);
        expect(themes).toContain('项目');
      });

      it('只出现一次的词不应被提取', () => {
        const inspirations = [
          createMockInspiration({ id: '1', name: '项目A' }),
          createMockInspiration({ id: '2', name: '项目B' }),
        ];
        const themes = extractCommonThemes(inspirations);
        expect(themes).not.toContain('项目A');
        expect(themes).not.toContain('项目B');
      });

      it('空数组应返回空', () => {
        const themes = extractCommonThemes([]);
        expect(themes).toHaveLength(0);
      });
    });

    describe('mergeInspirationContent', () => {
      it('应合并多个灵感内容', () => {
        const inspirations = [
          createMockInspiration({ id: '1', name: '灵感A', rawInput: { text: '内容A' } }),
          createMockInspiration({ id: '2', name: '灵感B', rawInput: { text: '内容B' } }),
        ];
        const merged = mergeInspirationContent(inspirations);
        expect(merged).toContain('灵感A');
        expect(merged).toContain('内容A');
        expect(merged).toContain('灵感B');
        expect(merged).toContain('内容B');
      });

      it('应包含结构化内容', () => {
        const inspirations = [
          createMockInspiration({
            id: '1',
            structuredContent: { title: '结构化标题' },
          }),
        ];
        const merged = mergeInspirationContent(inspirations);
        expect(merged).toContain('结构化标题');
      });
    });
  });

  describe('混合策略', () => {
    describe('decideMixType', () => {
      it('早期状态应返回 LAYER', () => {
        const inspirations = [
          createMockInspiration({ id: '1', status: InspirationStatus.SEED }),
          createMockInspiration({ id: '2', status: InspirationStatus.BLOOM }),
        ];
        expect(decideMixType(inspirations)).toBe(MixType.LAYER);
      });

      it('全部后期状态应返回 BLEND', () => {
        const inspirations = [
          createMockInspiration({ id: '1', status: InspirationStatus.BUD }),
          createMockInspiration({ id: '2', status: InspirationStatus.BLOOM }),
        ];
        expect(decideMixType(inspirations)).toBe(MixType.BLEND);
      });
    });

    describe('calculateMixIntensity', () => {
      it('应根据平均完成度计算强度', () => {
        const inspirations = [
          createMockInspiration({ id: '1', completion: 60 }),
          createMockInspiration({ id: '2', completion: 80 }),
        ];
        const intensity = calculateMixIntensity(inspirations);
        expect(intensity).toBe(0.7);
      });

      it('空数组应返回 NaN', () => {
        const intensity = calculateMixIntensity([]);
        expect(Number.isNaN(intensity)).toBe(true);
      });

      it('完成度 100 应返回 1', () => {
        const inspirations = [
          createMockInspiration({ id: '1', completion: 100 }),
          createMockInspiration({ id: '2', completion: 100 }),
        ];
        const intensity = calculateMixIntensity(inspirations);
        expect(intensity).toBe(1);
      });
    });
  });
});
