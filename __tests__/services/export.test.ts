import {
  exportAllInspirations,
  exportSingleInspiration,
  importFromFile,
  importFromUri,
  addExportHistory,
  getExportHistory,
  clearExportHistory,
  EXPORT_VERSION,
} from '../../src/services/export';
import { Inspiration, GlassType, InspirationStatus } from '../../src/types';

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/',
  cacheDirectory: '/mock/cache/',
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  readAsStringAsync: jest.fn().mockResolvedValue('{}'),
  EncodingType: { UTF8: 'utf8' },
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  shareAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

// Mock database
jest.mock('../../src/services/database', () => ({
  getAllInspirations: jest.fn(),
  getInspirationById: jest.fn(),
  createInspiration: jest.fn().mockResolvedValue(undefined),
}));

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllInspirations, getInspirationById, createInspiration } from '../../src/services/database';

const createMockInspiration = (overrides: Partial<Inspiration> = {}): Inspiration => ({
  id: 'test-1',
  name: '测试灵感',
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

describe('导出服务', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearExportHistory();
  });

  describe('EXPORT_VERSION', () => {
    it('应为有效版本字符串', () => {
      expect(EXPORT_VERSION).toBe('1.0');
    });
  });

  describe('exportAllInspirations', () => {
    it('无灵感时应返回错误', async () => {
      (getAllInspirations as jest.Mock).mockResolvedValueOnce([]);

      const result = await exportAllInspirations();

      expect(result.success).toBe(false);
      expect(result.error).toBe('暂无灵感可导出');
    });

    it('成功时应返回文件路径', async () => {
      const mockInspirations = [createMockInspiration()];
      (getAllInspirations as jest.Mock).mockResolvedValueOnce(mockInspirations);

      const result = await exportAllInspirations();

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('inspiration_export_');
    });

    it('应写入正确的数据', async () => {
      const mockInspirations = [
        createMockInspiration({ id: '1', name: '灵感A' }),
        createMockInspiration({ id: '2', name: '灵感B' }),
      ];
      (getAllInspirations as jest.Mock).mockResolvedValueOnce(mockInspirations);

      await exportAllInspirations();

      expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('灵感A'),
        expect.any(Object)
      );
    });

    it('分享不可用时应返回文件路径', async () => {
      const mockInspirations = [createMockInspiration()];
      (getAllInspirations as jest.Mock).mockResolvedValueOnce(mockInspirations);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);

      const result = await exportAllInspirations();

      expect(result.success).toBe(true);
      expect(result.filePath).toBeDefined();
    });

    it('异常时应返回错误', async () => {
      (getAllInspirations as jest.Mock).mockRejectedValueOnce(new Error('数据库错误'));

      const result = await exportAllInspirations();

      expect(result.success).toBe(false);
      expect(result.error).toContain('导出失败');
    });
  });

  describe('exportSingleInspiration', () => {
    it('灵感不存在时应返回错误', async () => {
      (getInspirationById as jest.Mock).mockResolvedValueOnce(null);

      const result = await exportSingleInspiration('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('灵感不存在');
    });

    it('成功时应返回文件路径', async () => {
      const mockInspiration = createMockInspiration({ name: '测试灵感' });
      (getInspirationById as jest.Mock).mockResolvedValueOnce(mockInspiration);

      const result = await exportSingleInspiration('test-1');

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('inspiration_测试灵感_');
    });

    it('文件名应处理特殊字符', async () => {
      const mockInspiration = createMockInspiration({ name: '测试:灵感*/文档' });
      (getInspirationById as jest.Mock).mockResolvedValueOnce(mockInspiration);

      const result = await exportSingleInspiration('test-1');

      expect(result.success).toBe(true);
      const fileName = result.filePath!.split('/').pop()!;
      expect(fileName).not.toContain(':');
      expect(fileName).not.toContain('*');
    });

    it('分享不可用时也应成功返回', async () => {
      const mockInspiration = createMockInspiration();
      (getInspirationById as jest.Mock).mockResolvedValueOnce(mockInspiration);
      (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);

      const result = await exportSingleInspiration('test-1');

      expect(result.success).toBe(true);
    });
  });

  describe('importFromFile', () => {
    it('用户取消选择时应返回取消结果', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const result = await importFromFile();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('用户取消选择');
    });

    it('无法获取文件路径时应返回错误', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: undefined }],
      });

      const result = await importFromFile();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('无法获取文件路径');
    });

    it('成功导入时应返回正确计数', async () => {
      const exportData = {
        metadata: { version: '1.0', appName: '灵感调酒师' },
        inspirations: [
          { id: '1', name: '导入灵感1' },
          { id: '2', name: '导入灵感2' },
        ],
      };
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///test.json' }],
      });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(exportData)
      );
      (getAllInspirations as jest.Mock).mockResolvedValueOnce([]);

      const result = await importFromFile();

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
      expect(result.skippedCount).toBe(0);
    });

    it('重复 ID 应跳过', async () => {
      const exportData = {
        metadata: { version: '1.0', appName: '灵感调酒师' },
        inspirations: [{ id: 'existing-id', name: '已存在' }],
      };
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///test.json' }],
      });
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(exportData)
      );
      (getAllInspirations as jest.Mock).mockResolvedValueOnce([
        { id: 'existing-id', name: '已存在灵感' },
      ]);

      const result = await importFromFile();

      expect(result.skippedCount).toBe(1);
      expect(result.importedCount).toBe(0);
    });
  });

  describe('importFromUri', () => {
    it('成功导入时应返回结果', async () => {
      const exportData = {
        metadata: { version: '1.0', appName: '灵感调酒师' },
        inspirations: [{ id: 'new-id', name: '新灵感' }],
      };
      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(
        JSON.stringify(exportData)
      );
      (getAllInspirations as jest.Mock).mockResolvedValueOnce([]);

      const result = await importFromUri('file:///test.json');

      expect(result.success).toBe(true);
    });

    it('读取失败时应返回错误', async () => {
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(
        new Error('文件读取失败')
      );

      const result = await importFromUri('file:///test.json');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('读取文件失败');
    });
  });

  describe('导出历史管理', () => {
    describe('addExportHistory', () => {
      it('应添加历史记录', () => {
        addExportHistory({
          fileName: 'test.json',
          exportTime: '2024-01-01',
          inspirationCount: 5,
        });

        const history = getExportHistory();
        expect(history).toHaveLength(1);
        expect(history[0].fileName).toBe('test.json');
      });

      it('应限制历史记录数量为 10', () => {
        for (let i = 0; i < 15; i++) {
          addExportHistory({
            fileName: `test${i}.json`,
            exportTime: '2024-01-01',
            inspirationCount: i,
          });
        }

        const history = getExportHistory();
        expect(history).toHaveLength(10);
      });

      it('新记录应在前', () => {
        addExportHistory({ fileName: 'first.json', exportTime: '2024-01-01', inspirationCount: 1 });
        addExportHistory({ fileName: 'second.json', exportTime: '2024-01-02', inspirationCount: 2 });

        const history = getExportHistory();
        expect(history[0].fileName).toBe('second.json');
      });
    });

    describe('clearExportHistory', () => {
      it('应清空历史记录', () => {
        addExportHistory({ fileName: 'test.json', exportTime: '2024-01-01', inspirationCount: 1 });
        clearExportHistory();

        const history = getExportHistory();
        expect(history).toHaveLength(0);
      });
    });

    describe('getExportHistory', () => {
      it('初始应返回空数组', () => {
        clearExportHistory();
        const history = getExportHistory();
        expect(history).toEqual([]);
      });
    });
  });
});
