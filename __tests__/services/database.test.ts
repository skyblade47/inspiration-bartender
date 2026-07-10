const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  runAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn().mockReturnValue(mockDb),
}));

import {
  initDatabase,
  createInspiration,
  getAllInspirations,
  getInspirationById,
  updateInspiration,
  deleteInspiration,
  initSyncTables,
  createSyncTask,
  getSyncTask,
  getSyncTasksByStatus,
  updateSyncTask,
  deleteSyncTask,
  addSyncHistory,
  getSyncHistory,
  getSyncStatus,
  DatabaseError,
} from '@/services/database';
import { Inspiration, GlassType, InspirationStatus } from '@/types';
import { SyncTask, SyncStatus } from '@/services/sync';

describe('database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initDatabase', () => {
    it('应初始化数据库表', async () => {
      await initDatabase();

      expect(mockDb.execAsync).toHaveBeenCalled();
    });
  });

  describe('createInspiration', () => {
    it('应创建灵感', async () => {
      const inspiration: Omit<Inspiration, 'id' | 'createdAt' | 'updatedAt'> = {
        name: '测试灵感',
        type: GlassType.COCKTAIL,
        completion: 50,
        status: InspirationStatus.SPROUT,
        rawInput: { text: '测试输入' },
        brewingLog: [],
        brainstormCards: [],
        collisionHistory: [],
        structuredContent: {},
      };

      await createInspiration(inspiration);

      expect(mockDb.runAsync).toHaveBeenCalled();
    });
  });

  describe('getAllInspirations', () => {
    it('应返回所有灵感', async () => {
      const mockInspirations = [
        { id: '1', name: '灵感1', type: 'COCKTAIL', completion: 50, status: 'sprout', rawInput: '{}', brewingLog: '[]', brainstormCards: '[]', collisionHistory: '[]', structuredContent: '{}', createdAt: 1704067200000, updatedAt: 1704067200000 },
      ];
      mockDb.getAllAsync.mockResolvedValueOnce(mockInspirations);

      const result = await getAllInspirations();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('灵感1');
    });

    it('查询失败应抛出 DatabaseError', async () => {
      mockDb.getAllAsync.mockRejectedValueOnce(new Error('Query failed'));

      await expect(getAllInspirations()).rejects.toThrow(DatabaseError);
    });
  });

  describe('getInspirationById', () => {
    it('应返回指定灵感', async () => {
      const mockInspiration = { id: '1', name: '灵感1', type: 'COCKTAIL', completion: 50, status: 'sprout', rawInput: '{}', brewingLog: '[]', brainstormCards: '[]', collisionHistory: '[]', structuredContent: '{}', createdAt: 1704067200000, updatedAt: 1704067200000 };
      mockDb.getFirstAsync.mockResolvedValueOnce(mockInspiration);

      const result = await getInspirationById('1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(result?.name).toBe('灵感1');
    });

    it('不存在的灵感应返回 null', async () => {
      mockDb.getFirstAsync.mockResolvedValueOnce(null);

      const result = await getInspirationById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateInspiration', () => {
    it('应更新灵感', async () => {
      await updateInspiration('test-id', { name: '新名称' });

      expect(mockDb.runAsync).toHaveBeenCalled();
    });
  });

  describe('deleteInspiration', () => {
    it('应删除灵感', async () => {
      await deleteInspiration('test-id');

      expect(mockDb.runAsync).toHaveBeenCalled();
    });
  });

  describe('同步表操作', () => {
    describe('initSyncTables', () => {
      it('应初始化同步表', async () => {
        await initSyncTables();

        expect(mockDb.execAsync).toHaveBeenCalled();
      });
    });

    describe('createSyncTask', () => {
      it('应创建同步任务', async () => {
        await createSyncTask({
          id: 'task-id',
          inspirationId: 'test-inspiration-id',
          targetDeviceId: 'test-device-id',
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryTime: null,
          error: null,
        });

        expect(mockDb.runAsync).toHaveBeenCalled();
      });
    });

    describe('getSyncTask', () => {
      it('应获取同步任务', async () => {
        mockDb.getFirstAsync.mockResolvedValueOnce({
          id: 'task-id',
          inspiration_id: 'inspiration-id',
          target_device_id: 'device-id',
          status: 'pending',
          retry_count: 0,
          max_retries: 5,
          next_retry_time: null,
          error: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        });

        const task = await getSyncTask('task-id');

        expect(task).not.toBeNull();
        expect(task?.id).toBe('task-id');
      });
    });

    describe('getSyncTasksByStatus', () => {
      it('应获取指定状态的任务', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([
          {
            id: 'task-1',
            inspiration_id: 'inspiration-1',
            target_device_id: 'device-1',
            status: 'pending',
            retry_count: 0,
            max_retries: 5,
            next_retry_time: null,
            error: null,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ]);

        const tasks = await getSyncTasksByStatus('pending');

        expect(tasks).toHaveLength(1);
        expect(tasks[0].status).toBe('pending');
      });
    });

    describe('updateSyncTask', () => {
      it('应更新同步任务', async () => {
        await updateSyncTask('task-id', { status: 'completed' });

        expect(mockDb.runAsync).toHaveBeenCalled();
      });
    });

    describe('deleteSyncTask', () => {
      it('应删除同步任务', async () => {
        await deleteSyncTask('task-id');

        expect(mockDb.runAsync).toHaveBeenCalled();
      });
    });

    describe('addSyncHistory', () => {
      it('应添加同步历史', async () => {
        await addSyncHistory('inspiration-id', 'source-device', 'target-device', 'success', 1000);

        expect(mockDb.runAsync).toHaveBeenCalled();
      });
    });

    describe('getSyncHistory', () => {
      it('应获取同步历史', async () => {
        mockDb.getAllAsync.mockResolvedValueOnce([
          {
            id: 1,
            inspiration_id: 'inspiration-id',
            source_device: 'source-device',
            target_device: 'target-device',
            status: 'success',
            timestamp: '2024-01-01',
            duration_ms: 1000,
          },
        ]);

        const history = await getSyncHistory(50);

        expect(history).toHaveLength(1);
        expect(history[0].status).toBe('success');
      });
    });

    describe('getSyncStatus', () => {
      it('应获取同步状态', async () => {
        mockDb.getFirstAsync.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

        const status = await getSyncStatus();

        expect(status.lastSyncTime).toBeDefined();
      });
    });
  });
});
