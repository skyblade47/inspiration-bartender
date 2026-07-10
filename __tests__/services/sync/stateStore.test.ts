import { SyncStateStore } from '../../../src/services/sync/stateStore';
import { SyncTask, SyncStatus } from '../../../src/services/sync/types';

jest.mock('../../../src/services/database', () => ({
  initSyncTables: jest.fn().mockResolvedValue(undefined),
  createSyncTask: jest.fn().mockResolvedValue(undefined),
  getSyncTask: jest.fn().mockResolvedValue(null),
  getSyncTasksByStatus: jest.fn().mockResolvedValue([]),
  updateSyncTask: jest.fn().mockResolvedValue(undefined),
  deleteSyncTask: jest.fn().mockResolvedValue(undefined),
  clearCompletedSyncTasks: jest.fn().mockResolvedValue(undefined),
  addSyncHistory: jest.fn().mockResolvedValue(undefined),
  getSyncHistory: jest.fn().mockResolvedValue([]),
  getSyncStatus: jest.fn().mockResolvedValue({
    lastSyncTime: null,
    pendingTasks: 0,
    failedTasks: 0,
    syncingTasks: 0,
    completedTasks: 0,
  }),
}));

import {
  initSyncTables,
  createSyncTask,
  getSyncTask,
  getSyncTasksByStatus,
  updateSyncTask,
  deleteSyncTask,
  clearCompletedSyncTasks,
  addSyncHistory,
  getSyncHistory,
  getSyncStatus,
} from '../../../src/services/database';

describe('sync/stateStore', () => {
  let stateStore: SyncStateStore;

  beforeEach(() => {
    jest.clearAllMocks();
    (SyncStateStore as any)['instance'] = undefined;
    stateStore = SyncStateStore.getInstance();
  });

  describe('getInstance', () => {
    it('应返回单例实例', () => {
      const instance1 = SyncStateStore.getInstance();
      const instance2 = SyncStateStore.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('init', () => {
    it('应初始化同步表', async () => {
      await stateStore.init();
      expect(initSyncTables).toHaveBeenCalled();
    });

    it('初始化失败应抛出错误', async () => {
      (initSyncTables as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      await expect(stateStore.init()).rejects.toThrow('Database error');
    });
  });

  describe('createTask', () => {
    it('应创建同步任务', async () => {
      const task = await stateStore.createTask('inspiration-id', 'device-id');

      expect(task.id).toBeDefined();
      expect(task.inspirationId).toBe('inspiration-id');
      expect(task.targetDeviceId).toBe('device-id');
      expect(task.status).toBe('pending');
      expect(task.retryCount).toBe(0);
      expect(task.maxRetries).toBe(5);
      expect(createSyncTask).toHaveBeenCalled();
    });

    it('创建失败应抛出错误', async () => {
      (createSyncTask as jest.Mock).mockRejectedValueOnce(new Error('Create failed'));
      await expect(stateStore.createTask('inspiration-id', 'device-id')).rejects.toThrow('Create failed');
    });
  });

  describe('getTask', () => {
    it('应获取任务', async () => {
      const mockTask: SyncTask = {
        id: 'task-id',
        inspirationId: 'inspiration-id',
        targetDeviceId: 'device-id',
        status: 'pending',
        retryCount: 0,
        maxRetries: 5,
        nextRetryTime: null,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        error: null,
      };
      (getSyncTask as jest.Mock).mockResolvedValueOnce(mockTask);

      const task = await stateStore.getTask('task-id');
      expect(task).toEqual(mockTask);
      expect(getSyncTask).toHaveBeenCalledWith('task-id');
    });

    it('任务不存在应返回 null', async () => {
      const task = await stateStore.getTask('nonexistent');
      expect(task).toBeNull();
    });

    it('获取失败应抛出错误', async () => {
      (getSyncTask as jest.Mock).mockRejectedValueOnce(new Error('Get failed'));
      await expect(stateStore.getTask('task-id')).rejects.toThrow('Get failed');
    });
  });

  describe('getTasksByStatus', () => {
    it('应获取指定状态的任务', async () => {
      const mockTasks: SyncTask[] = [
        {
          id: 'task-1',
          inspirationId: 'inspiration-id',
          targetDeviceId: 'device-id',
          status: 'pending',
          retryCount: 0,
          maxRetries: 5,
          nextRetryTime: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          error: null,
        },
      ];
      (getSyncTasksByStatus as jest.Mock).mockResolvedValueOnce(mockTasks);

      const tasks = await stateStore.getTasksByStatus('pending');
      expect(tasks).toEqual(mockTasks);
      expect(getSyncTasksByStatus).toHaveBeenCalledWith('pending');
    });

    it('不传状态应获取所有任务', async () => {
      await stateStore.getTasksByStatus();
      expect(getSyncTasksByStatus).toHaveBeenCalledWith(undefined);
    });

    it('获取失败应抛出错误', async () => {
      (getSyncTasksByStatus as jest.Mock).mockRejectedValueOnce(new Error('Get tasks failed'));
      await expect(stateStore.getTasksByStatus('pending')).rejects.toThrow('Get tasks failed');
    });
  });

  describe('updateTask', () => {
    it('应更新任务', async () => {
      await stateStore.updateTask('task-id', { status: 'syncing', retryCount: 1 });
      expect(updateSyncTask).toHaveBeenCalledWith('task-id', { status: 'syncing', retryCount: 1 });
    });

    it('更新失败应抛出错误', async () => {
      (updateSyncTask as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));
      await expect(stateStore.updateTask('task-id', { status: 'syncing' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTask', () => {
    it('应删除任务', async () => {
      await stateStore.deleteTask('task-id');
      expect(deleteSyncTask).toHaveBeenCalledWith('task-id');
    });

    it('删除失败应抛出错误', async () => {
      (deleteSyncTask as jest.Mock).mockRejectedValueOnce(new Error('Delete failed'));
      await expect(stateStore.deleteTask('task-id')).rejects.toThrow('Delete failed');
    });
  });

  describe('clearCompletedTasks', () => {
    it('应清除已完成任务', async () => {
      await stateStore.clearCompletedTasks();
      expect(clearCompletedSyncTasks).toHaveBeenCalled();
    });

    it('清除失败应抛出错误', async () => {
      (clearCompletedSyncTasks as jest.Mock).mockRejectedValueOnce(new Error('Clear failed'));
      await expect(stateStore.clearCompletedTasks()).rejects.toThrow('Clear failed');
    });
  });

  describe('addHistory', () => {
    it('应添加同步历史', async () => {
      await stateStore.addHistory('inspiration-id', 'source', 'target', 'completed', 1000);
      expect(addSyncHistory).toHaveBeenCalledWith('inspiration-id', 'source', 'target', 'completed', 1000);
    });

    it('添加失败应记录日志但不抛出', async () => {
      (addSyncHistory as jest.Mock).mockRejectedValueOnce(new Error('Add history failed'));
      await stateStore.addHistory('inspiration-id', 'source', 'target', 'completed', 1000);
    });
  });

  describe('getHistory', () => {
    it('应获取同步历史', async () => {
      const mockHistory = [
        {
          id: 1,
          inspirationId: 'inspiration-id',
          sourceDevice: 'source',
          targetDevice: 'target',
          status: 'completed',
          timestamp: '2024-01-01',
          durationMs: 1000,
        },
      ];
      (getSyncHistory as jest.Mock).mockResolvedValueOnce(mockHistory);

      const history = await stateStore.getHistory();
      expect(history).toEqual(mockHistory);
    });

    it('应支持自定义限制', async () => {
      await stateStore.getHistory(10);
      expect(getSyncHistory).toHaveBeenCalledWith(10);
    });

    it('获取失败应抛出错误', async () => {
      (getSyncHistory as jest.Mock).mockRejectedValueOnce(new Error('Get history failed'));
      await expect(stateStore.getHistory()).rejects.toThrow('Get history failed');
    });
  });

  describe('getStatus', () => {
    it('应获取同步状态', async () => {
      const mockStatus: SyncStatus = {
        lastSyncTime: '2024-01-01',
        pendingTasks: 1,
        failedTasks: 0,
        syncingTasks: 0,
        completedTasks: 5,
      };
      (getSyncStatus as jest.Mock).mockResolvedValueOnce(mockStatus);

      const status = await stateStore.getStatus();
      expect(status).toEqual(mockStatus);
    });

    it('获取失败应抛出错误', async () => {
      (getSyncStatus as jest.Mock).mockRejectedValueOnce(new Error('Get status failed'));
      await expect(stateStore.getStatus()).rejects.toThrow('Get status failed');
    });
  });
});