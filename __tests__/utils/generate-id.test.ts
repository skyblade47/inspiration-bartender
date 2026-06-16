import { generateId, generateTimestampId } from '../../src/utils/generate-id';

describe('generate-id', () => {
  describe('generateId', () => {
    it('应生成唯一ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('应生成有效格式的ID', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it('ID长度应为7个字符', () => {
      const id = generateId();
      expect(id.length).toBe(7);
    });
  });

  describe('generateTimestampId', () => {
    it('应生成包含时间戳的ID', () => {
      const id = generateTimestampId();
      expect(id.length).toBeGreaterThan(10);
    });

    it('应生成唯一ID', () => {
      const id1 = generateTimestampId();
      const id2 = generateTimestampId();
      expect(id1).not.toBe(id2);
    });

    it('ID长度应大于10个字符', () => {
      const id = generateTimestampId();
      expect(id.length).toBeGreaterThan(10);
    });
  });
});
