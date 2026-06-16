import {
  ScoringDimension,
  DimensionConfig,
  DEFAULT_DIMENSION_CONFIGS,
  getDimensionConfig,
  validateWeights,
} from '../../../src/services/scoring/dimensions';

describe('dimensions', () => {
  describe('DEFAULT_DIMENSION_CONFIGS', () => {
    it('应包含4个维度', () => {
      expect(DEFAULT_DIMENSION_CONFIGS).toHaveLength(4);
    });

    it('各维度权重之和应为1', () => {
      const totalWeight = DEFAULT_DIMENSION_CONFIGS.reduce((sum, c) => sum + c.weight, 0);
      expect(totalWeight).toBeCloseTo(1, 2);
    });

    it('每个维度应有有效的 id 和 name', () => {
      DEFAULT_DIMENSION_CONFIGS.forEach(config => {
        expect(config.id).toBeDefined();
        expect(config.name).toBeDefined();
        expect(config.maxScore).toBe(100);
      });
    });
  });

  describe('ScoringDimension', () => {
    it('应包含所有必需的维度枚举值', () => {
      expect(ScoringDimension.CLARITY).toBe('clarity');
      expect(ScoringDimension.RICHNESS).toBe('richness');
      expect(ScoringDimension.FEASIBILITY).toBe('feasibility');
      expect(ScoringDimension.UNIQUENESS).toBe('uniqueness');
    });
  });

  describe('getDimensionConfig', () => {
    it('应返回正确的维度配置', () => {
      const config = getDimensionConfig(ScoringDimension.CLARITY);
      expect(config.id).toBe(ScoringDimension.CLARITY);
      expect(config.name).toBe('清晰度');
      expect(config.weight).toBe(0.25);
    });

    it('对未知维度应抛出错误', () => {
      expect(() => getDimensionConfig('unknown' as ScoringDimension)).toThrow('未知的评分维度');
    });
  });

  describe('validateWeights', () => {
    it('有效权重应返回 true', () => {
      expect(validateWeights(DEFAULT_DIMENSION_CONFIGS)).toBe(true);
    });

    it('权重和为1应返回 true', () => {
      const configs: DimensionConfig[] = [
        { id: ScoringDimension.CLARITY, name: '测试', description: '', weight: 0.5, maxScore: 100 },
        { id: ScoringDimension.RICHNESS, name: '测试', description: '', weight: 0.5, maxScore: 100 },
      ];
      expect(validateWeights(configs)).toBe(true);
    });

    it('权重和不为1应返回 false', () => {
      const configs: DimensionConfig[] = [
        { id: ScoringDimension.CLARITY, name: '测试', description: '', weight: 0.3, maxScore: 100 },
        { id: ScoringDimension.RICHNESS, name: '测试', description: '', weight: 0.3, maxScore: 100 },
      ];
      expect(validateWeights(configs)).toBe(false);
    });
  });
});
