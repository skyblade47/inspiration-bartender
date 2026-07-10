import { RetryManager } from '../../../src/services/sync/retryManager';
import { SyncTask } from '../../../src/services/sync/types';

jest.mock('../../../src/services/database', () => ({
  updateSyncTask: jest.fn().mockResolvedValue(undefined),
}));

import { updateSyncTask } from '../../../src/services/database';

describe('sync/retryManager', () => {
  let retryManager: RetryManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (RetryManager as any)['instance'] = undefined;
    retryManager = RetryManager.getInstance();
  });

  afterEach(() => {
    retryManager.shutdown();
    jest.useRealTimers();
  });

  describe('getInstance', () => {
    it('应返回单例实例', () => {
      const instance1 = RetryManager.getInstance();
      const instance2 = RetryManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('calculateNextRetryDelay', () => {
    it('应计算正确的重试延迟', () => {
      expect(retryManager.calculateNextRetryDelay(0)).toBe(30000);
      expect(retryManager.calculateNextRetryDelay(1)).toBe(60000);
      expect(retryManager.calculateNextRetryDelay(2)).toBe(120000);
      expect(retryManager.calculateNextRetryDelay(3)).toBe(240000);
      expect(retryManager.calculateNextRetryDelay(4)).toBe(480000);
    });

    it('应限制最大延迟为 480000ms', () => {
      expect(retryManager.calculateNextRetryDelay(5)).toBe(480000);
      expect(retryManager.calculateNextRetryDelay(10)).toBe(480000);
    });
  });

  describe('scheduleRetry', () => {
    const createMockTask = (retryCount: number): SyncTask => ({
      id: 'test-task-id',
      inspirationId: 'test-inspiration-id',
      targetDeviceId: 'test-device-id',
      status: 'failed',
      retryCount,
      maxRetries: 5,
      nextRetryTime: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      error: null,
    });

    it('应调度重试任务', async () => {
      const task = createMockTask(0);
      let syncFnCalled = false;

      await retryManager.scheduleRetry(task, async () => {
        syncFnCalled = true;
      });

      expect(updateSyncTask).toHaveBeenCalledWith(task.id, expect.objectContaining({
        retryCount: 1,
        nextRetryTime: expect.any(String),
      }));
    });

    it('达到最大重试次数应标记任务失败', async () => {
      const task = createMockTask(5);

      await retryManager.scheduleRetry(task, async () => {
        throw new Error('Sync failed');
      });

      expect(updateSyncTask).toHaveBeenCalledWith(task.id, { status: 'failed' });
    });
  });

  describe('cancelRetry', () => {
    it('应取消已调度的重试', async () => {
      const task: SyncTask = {
        id: 'test-task-id',
        inspirationId: 'test-inspiration-id',
        targetDeviceId: 'test-device-id',
        status: 'failed',
        retryCount: 0,
        maxRetries: 5,
        nextRetryTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        error: null,
      };

      await retryManager.scheduleRetry(task, async () => {});
      retryManager.cancelRetry(task.id);

      expect(updateSyncTask).toHaveBeenCalledWith(task.id, expect.objectContaining({
        retryCount: 1,
      }));
    });

    it('取消不存在的任务应不报错', () => {
      retryManager.cancelRetry('nonexistent');
    });
  });

  describe('shutdown', () => {
    it('应取消所有重试并清空定时器', async () => {
      const task: SyncTask = {
        id: 'test-task-id',
        inspirationId: 'test-inspiration-id',
        targetDeviceId: 'test-device-id',
        status: 'failed',
        retryCount: 0,
        maxRetries: 5,
        nextRetryTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        error: null,
      };

      await retryManager.scheduleRetry(task, async () => {});
      retryManager.shutdown();

      expect(updateSyncTask).toHaveBeenCalledWith(task.id, expect.objectContaining({
        retryCount: 1,
      }));
    });
  });
});
