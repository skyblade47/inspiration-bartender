import * as SQLite from 'expo-sqlite';
import { SyncTask, SyncStatus } from './types';
import { generateId } from './protocol';
import { initSyncTables, createSyncTask, getSyncTask, getSyncTasksByStatus, updateSyncTask, deleteSyncTask, clearCompletedSyncTasks, addSyncHistory, getSyncHistory, getSyncStatus } from '../database';
const db = SQLite.openDatabaseSync('inspiration.db');

export class SyncStateStore {
  private static instance: SyncStateStore;

  private constructor() {}

  static getInstance(): SyncStateStore {
    if (!SyncStateStore.instance) {
      SyncStateStore.instance = new SyncStateStore();
    }
    return SyncStateStore.instance;
  }

  async init(): Promise<void> {
    try {
      await initSyncTables();
      console.log('[SyncStateStore] Tables created successfully');
    } catch (error) {
      console.error('[SyncStateStore] Failed to create tables:', error);
      throw error;
    }
  }

  async createTask(inspirationId: string, targetDeviceId: string): Promise<SyncTask> {
    const task: SyncTask = {
      id: generateId(),
      inspirationId,
      targetDeviceId,
      status: 'pending',
      retryCount: 0,
      maxRetries: 5,
      nextRetryTime: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      error: null,
    };

    try {
      await createSyncTask(task);
      console.log(`[SyncStateStore] Created task: ${task.id}`);
      return task;
    } catch (error) {
      console.error('[SyncStateStore] Failed to create task:', error);
      throw error;
    }
  }

  async getTask(taskId: string): Promise<SyncTask | null> {
    try {
      return await getSyncTask(taskId);
    } catch (error) {
      console.error('[SyncStateStore] Failed to get task:', error);
      throw error;
    }
  }

  async getTasksByStatus(status?: string): Promise<SyncTask[]> {
    try {
      return await getSyncTasksByStatus(status);
    } catch (error) {
      console.error('[SyncStateStore] Failed to get tasks:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: Partial<SyncTask>): Promise<void> {
    try {
      await updateSyncTask(taskId, updates);
      console.log(`[SyncStateStore] Updated task: ${taskId}`);
    } catch (error) {
      console.error('[SyncStateStore] Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(taskId: string): Promise<void> {
    try {
      await deleteSyncTask(taskId);
      console.log(`[SyncStateStore] Deleted task: ${taskId}`);
    } catch (error) {
      console.error('[SyncStateStore] Failed to delete task:', error);
      throw error;
    }
  }

  async clearCompletedTasks(): Promise<void> {
    try {
      await clearCompletedSyncTasks();
      console.log('[SyncStateStore] Cleared completed tasks');
    } catch (error) {
      console.error('[SyncStateStore] Failed to clear completed tasks:', error);
      throw error;
    }
  }

  async addHistory(
    inspirationId: string,
    sourceDevice: string,
    targetDevice: string,
    status: string,
    durationMs: number
  ): Promise<void> {
    try {
      await addSyncHistory(inspirationId, sourceDevice, targetDevice, status, durationMs);
    } catch (error) {
      console.error('[SyncStateStore] Failed to add history:', error);
    }
  }

  async getHistory(limit: number = 50): Promise<{
    id: number;
    inspirationId: string;
    sourceDevice: string;
    targetDevice: string;
    status: string;
    timestamp: string;
    durationMs: number;
  }[]> {
    try {
      return await getSyncHistory(limit);
    } catch (error) {
      console.error('[SyncStateStore] Failed to get history:', error);
      throw error;
    }
  }

  async getStatus(): Promise<SyncStatus> {
    try {
      return await getSyncStatus();
    } catch (error) {
      console.error('[SyncStateStore] Failed to get status:', error);
      throw error;
    }
  }

  async cleanupOldHistory(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
      await db.runAsync('DELETE FROM sync_history WHERE timestamp < ?', [cutoffDate]);
      console.log(`[SyncStateStore] Cleaned up history older than ${daysToKeep} days`);
    } catch (error) {
      console.error('[SyncStateStore] Failed to cleanup history:', error);
    }
  }
}
