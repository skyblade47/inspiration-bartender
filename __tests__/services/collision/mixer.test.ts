import { InspirationMixer, createMixer } from '../../../src/services/collision/mixer';
import { Inspiration, GlassType, InspirationStatus, MixType } from '../../../src/types';

const createMockInspiration = (overrides: Partial<Inspiration> = {}): Inspiration => ({
  id: 'test-1',
  name: '测试灵感A',
  type: GlassType.COCKTAIL,
  completion: 50,
  status: InspirationStatus.GROW,
  rawInput: { text: '这是一个测试灵感' },
  brewingLog: [],
  brainstormCards: [],
  collisionHistory: [],
  structuredContent: { title: '标题' },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('InspirationMixer', () => {
  describe('constructor', () => {
    it('应使用默认配置创建混合器', () => {
      const mixer = new InspirationMixer();
      expect(mixer).toBeDefined();
    });

    it('应接受自定义配置', () => {
      const mixer = new InspirationMixer({
        defaultMixMode: 'screen' as any,
        autoExtractThemes: false,
        intensityThreshold: 0.5,
      });
      expect(mixer).toBeDefined();
    });
  });

  describe('mix', () => {
    it('应正确混合两个灵感', () => {
      const mixer = new InspirationMixer();
      const inspiration1 = createMockInspiration({ id: '1', name: '灵感A', type: GlassType.BRANDY });
      const inspiration2 = createMockInspiration({ id: '2', name: '灵感B', type: GlassType.WINE });

      const result = mixer.mix([inspiration1, inspiration2]);

      expect(result.mixedColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.mixType).toBeDefined();
      expect(result.keywords).toBeInstanceOf(Array);
      expect(result.moods).toBeInstanceOf(Array);
      expect(result.combinedContent).toContain('灵感A');
      expect(result.combinedContent).toContain('灵感B');
    });

    it('应混合三个灵感', () => {
      const mixer = new InspirationMixer();
      const inspiration1 = createMockInspiration({ id: '1', name: '灵感A' });
      const inspiration2 = createMockInspiration({ id: '2', name: '灵感B' });
      const inspiration3 = createMockInspiration({ id: '3', name: '灵感C' });

      const result = mixer.mix([inspiration1, inspiration2, inspiration3]);

      expect(result.mixedColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.combinedContent).toContain('灵感A');
      expect(result.combinedContent).toContain('灵感B');
      expect(result.combinedContent).toContain('灵感C');
    });

    it('少于两个灵感应抛出错误', () => {
      const mixer = new InspirationMixer();
      const inspiration = createMockInspiration();

      expect(() => mixer.mix([inspiration])).toThrow('混合至少需要两个灵感');
    });

    it('超过三个灵感应抛出错误', () => {
      const mixer = new InspirationMixer();
      const inspirations = [
        createMockInspiration({ id: '1' }),
        createMockInspiration({ id: '2' }),
        createMockInspiration({ id: '3' }),
        createMockInspiration({ id: '4' }),
      ];

      expect(() => mixer.mix(inspirations)).toThrow('最多只能混合三个灵感');
    });

    it('应支持自定义混合类型', () => {
      const mixer = new InspirationMixer();
      const inspiration1 = createMockInspiration({ id: '1' });
      const inspiration2 = createMockInspiration({ id: '2' });

      const result = mixer.mix([inspiration1, inspiration2], { mixType: MixType.LAYER });

      expect(result.mixType).toBe(MixType.LAYER);
    });

    it('应支持自定义颜色', () => {
      const mixer = new InspirationMixer();
      const inspiration1 = createMockInspiration({ id: '1' });
      const inspiration2 = createMockInspiration({ id: '2' });

      const result = mixer.mix([inspiration1, inspiration2], {
        customColors: ['#FF0000', '#00FF00'],
      });

      expect(result.mixedColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('早期状态灵感应使用分层混合', () => {
      const mixer = new InspirationMixer();
      const inspiration1 = createMockInspiration({
        id: '1',
        status: InspirationStatus.SEED,
      });
      const inspiration2 = createMockInspiration({
        id: '2',
        status: InspirationStatus.SPROUT,
      });

      const result = mixer.mix([inspiration1, inspiration2]);

      expect(result.mixType).toBe(MixType.LAYER);
    });

    it('后期状态灵感应使用混色混合', () => {
      const mixer = new InspirationMixer();
      const inspiration1 = createMockInspiration({
        id: '1',
        status: InspirationStatus.BUD,
      });
      const inspiration2 = createMockInspiration({
        id: '2',
        status: InspirationStatus.BLOOM,
      });

      const result = mixer.mix([inspiration1, inspiration2]);

      expect(result.mixType).toBe(MixType.BLEND);
    });

    it('应提取关键词', () => {
      const mixer = new InspirationMixer({ autoExtractThemes: true });
      const inspiration1 = createMockInspiration({ id: '1', name: '项目 开发' });
      const inspiration2 = createMockInspiration({ id: '2', name: '项目 设计' });

      const result = mixer.mix([inspiration1, inspiration2]);

      expect(result.keywords).toContain('项目');
    });

    it('应提取氛围词', () => {
      const mixer = new InspirationMixer();
      const inspiration1 = createMockInspiration({ id: '1', type: GlassType.BRANDY });
      const inspiration2 = createMockInspiration({ id: '2', type: GlassType.WINE });

      const result = mixer.mix([inspiration1, inspiration2]);

      expect(result.moods.length).toBeGreaterThan(0);
    });

    it('关闭自动提取时应返回空关键词', () => {
      const mixer = new InspirationMixer({ autoExtractThemes: false });
      const inspiration1 = createMockInspiration({ id: '1', name: '测试' });
      const inspiration2 = createMockInspiration({ id: '2', name: '测试' });

      const result = mixer.mix([inspiration1, inspiration2]);

      expect(result.keywords).toHaveLength(0);
    });
  });

  describe('updateConfig', () => {
    it('应更新配置', () => {
      const mixer = new InspirationMixer();
      mixer.updateConfig({ intensityThreshold: 0.8 });
      expect(mixer).toBeDefined();
    });
  });
});

describe('createMixer', () => {
  it('应创建新的混合器实例', () => {
    const mixer = createMixer();
    expect(mixer).toBeInstanceOf(InspirationMixer);
  });

  it('应使用自定义配置创建混合器', () => {
    const mixer = createMixer({ intensityThreshold: 0.6 });
    expect(mixer).toBeInstanceOf(InspirationMixer);
  });
});
