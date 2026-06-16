import { InspirationEvaluator } from '../../../src/services/scoring/evaluator';
import { Inspiration, InspirationStatus, GlassType, StructuredContent } from '../../../src/types';

const createMockInspiration = (overrides: Partial<Inspiration> = {}): Inspiration => ({
  id: 'test-1',
  name: '测试灵感',
  type: GlassType.COCKTAIL,
  completion: 0,
  status: InspirationStatus.SEED,
  rawInput: { text: '' },
  brewingLog: [],
  brainstormCards: [],
  collisionHistory: [],
  structuredContent: undefined as unknown as StructuredContent,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('InspirationEvaluator', () => {
  describe('evaluate', () => {
    it('应返回有效的评分结果', () => {
      const evaluator = new InspirationEvaluator();
      const inspiration = createMockInspiration({
        name: '完整测试灵感',
        rawInput: { text: '这是一个完整的测试灵感描述文本，包含足够的内容用于评分测试。' },
      });
      
      const result = evaluator.evaluate(inspiration);
      
      expect(result.totalScore).toBeGreaterThanOrEqual(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
      expect(result.dimensionScores).toHaveLength(4);
      expect(result.suggestions).toBeDefined();
    });

    it('空灵感应返回低分', () => {
      const evaluator = new InspirationEvaluator();
      const inspiration = createMockInspiration();
      
      const result = evaluator.evaluate(inspiration);
      
      expect(result.totalScore).toBeLessThan(30);
    });

    it('应正确计算维度分数', () => {
      const evaluator = new InspirationEvaluator();
      const inspiration = createMockInspiration({
        name: '测试项目',
        rawInput: { text: '这是一个测试项目，需要完成开发实现' },
        brainstormCards: [
          { id: 'card1', title: '卡片1', content: '这是卡片内容超过二十个字符', color: '#fff', createdAt: Date.now() },
          { id: 'card2', title: '卡片2', content: '这是卡片内容超过二十个字符', color: '#fff', createdAt: Date.now() },
        ],
        structuredContent: {
          title: '标题',
          summary: '摘要',
          steps: ['步骤1', '步骤2'],
        },
      });
      
      const result = evaluator.evaluate(inspiration);
      
      expect(result.dimensionScores).toHaveLength(4);
      result.dimensionScores.forEach(dim => {
        expect(dim.score).toBeGreaterThanOrEqual(0);
        expect(dim.weightedScore).toBe(dim.score * dim.weight);
      });
    });

    it('应返回 SEED 状态的建议', () => {
      const evaluator = new InspirationEvaluator();
      const inspiration = createMockInspiration();
      
      const result = evaluator.evaluate(inspiration);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('quickEvaluate', () => {
    it('应快速返回分数和状态', () => {
      const evaluator = new InspirationEvaluator();
      const inspiration = createMockInspiration({
        name: '快速测试',
        rawInput: { text: '这是一个快速测试灵感' },
      });
      
      const result = evaluator.quickEvaluate(inspiration);
      
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.status).toBeDefined();
    });
  });
});
