import {
  generateChecksum,
  verifyChecksum,
  generateId,
  nowISO,
  toSyncInspiration,
  fromSyncInspiration,
} from '../../../src/services/sync/protocol';
import { SyncInspiration, DeviceType } from '../../../src/services/sync/types';

describe('sync/protocol', () => {
  describe('generateChecksum', () => {
    it('应生成相同内容的相同校验和', () => {
      const checksum1 = generateChecksum('test content', ['tag1', 'tag2']);
      const checksum2 = generateChecksum('test content', ['tag1', 'tag2']);
      expect(checksum1).toBe(checksum2);
    });

    it('应生成不同内容的不同校验和', () => {
      const checksum1 = generateChecksum('content1', ['tag1']);
      const checksum2 = generateChecksum('content2', ['tag1']);
      expect(checksum1).not.toBe(checksum2);
    });

    it('应处理空内容', () => {
      const checksum = generateChecksum('', []);
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBeGreaterThan(0);
    });

    it('应处理中文内容', () => {
      const checksum = generateChecksum('中文内容测试', ['标签1', '标签2']);
      expect(typeof checksum).toBe('string');
    });
  });

  describe('verifyChecksum', () => {
    it('应验证有效校验和', () => {
      const inspiration: SyncInspiration = {
        id: 'test-id',
        content: 'test content',
        tags: ['tag1'],
        checksum: generateChecksum('test content', ['tag1']),
        title: 'Test',
        source: 'inspiration-bartender',
        sourceApp: 'test',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        syncStatus: 'local',
        syncHistory: [],
      };
      expect(verifyChecksum(inspiration)).toBe(true);
    });

    it('应检测无效校验和', () => {
      const inspiration: SyncInspiration = {
        id: 'test-id',
        content: 'test content',
        tags: ['tag1'],
        checksum: 'invalid-checksum',
        title: 'Test',
        source: 'inspiration-bartender',
        sourceApp: 'test',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        syncStatus: 'local',
        syncHistory: [],
      };
      expect(verifyChecksum(inspiration)).toBe(false);
    });
  });

  describe('generateId', () => {
    it('应生成唯一 ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('应生成符合 UUID 格式的 ID', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('nowISO', () => {
    it('应返回 ISO 格式的时间字符串', () => {
      const now = nowISO();
      expect(typeof now).toBe('string');
      expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
    });
  });

  describe('toSyncInspiration', () => {
    it('应正确转换灵感为同步格式', () => {
      const data = {
        id: 'test-id',
        name: '测试灵感',
        content: '测试内容',
        tags: ['tag1', 'tag2'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        glassType: 'COCKTAIL',
        completion: 50,
        rawInput: { text: '原始输入' },
      };

      const result = toSyncInspiration(data, 'inspiration-bartender');

      expect(result.id).toBe('test-id');
      expect(result.title).toBe('测试灵感');
      expect(result.content).toBe('测试内容');
      expect(result.tags).toEqual(['tag1', 'tag2']);
      expect(result.source).toBe('inspiration-bartender');
      expect(result.sourceApp).toBe('inspiration-bartender');
      expect(result.checksum).toBe(generateChecksum('测试内容', ['tag1', 'tag2']));
      expect(result.original?.glassType).toBe('COCKTAIL');
      expect(result.original?.completion).toBe(50);
    });

    it('应处理字符串日期', () => {
      const data = {
        id: 'test-id',
        name: '测试灵感',
        content: '测试内容',
        tags: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      };

      const result = toSyncInspiration(data, 'inspiration-bartender');

      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(result.updatedAt).toBe('2024-01-02T00:00:00.000Z');
    });

    it('应设置正确的同步状态', () => {
      const data = {
        id: 'test-id',
        name: '测试灵感',
        content: '测试内容',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'synced',
      };

      const result = toSyncInspiration(data, 'inspiration-bartender');
      expect(result.syncStatus).toBe('synced');
    });
  });

  describe('fromSyncInspiration', () => {
    it('应正确转换同步格式为灵感数据', () => {
      const syncInsp: SyncInspiration = {
        id: 'test-id',
        title: '测试灵感',
        content: '测试内容',
        tags: ['tag1'],
        source: 'inspiration-bartender',
        sourceApp: 'test',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        syncStatus: 'synced',
        syncHistory: [],
        checksum: generateChecksum('测试内容', ['tag1']),
        original: {
          glassType: 'COCKTAIL',
          completion: 50,
          rawInput: { text: '原始输入' },
        },
      };

      const result = fromSyncInspiration(syncInsp);

      expect(result.id).toBe('test-id');
      expect(result.name).toBe('测试灵感');
      expect(result.content).toBe('测试内容');
      expect(result.tags).toEqual(['tag1']);
      expect(result.glassType).toBe('COCKTAIL');
      expect(result.completion).toBe(50);
    });

    it('当没有 title 时应使用 content', () => {
      const syncInsp: SyncInspiration = {
        id: 'test-id',
        content: '这是一个测试内容',
        tags: [],
        source: 'inspiration-bartender',
        sourceApp: 'test',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
        syncStatus: 'local',
        syncHistory: [],
        checksum: generateChecksum('这是一个测试内容', []),
      };

      const result = fromSyncInspiration(syncInsp);

      expect(result.name).toBe('这是一个测试内容');
    });
  });
});