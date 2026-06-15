import { SyncTask } from './types';
import { updateSyncTask } from '../database';

export class RetryManager {
  private static instance: RetryManager;
  private retryTimers: Map<string, NodeJS.Timeout> = new Map();
  private maxRetries = 5;
  private baseDelayMs = 30000;
  private maxDelayMs = 480000;

  private constructor() {}

  static getInstance(): RetryManager {
    if (!RetryManager.instance) {
      RetryManager.instance = new RetryManager();
    }
    return RetryManager.instance;
  }

  calculateNextRetryDelay(retryCount: number): number {
    const delay = this.baseDelayMs * Math.pow(2, retryCount);
    return Math.min(delay, this.maxDelayMs);
  }

  async scheduleRetry(task: SyncTask, syncFn: (task: SyncTask) => Promise<void>): Promise<void> {
    if (task.retryCount >= this.maxRetries) {
      console.log(`[RetryManager] Max retries reached for task ${task.id}`);
      await updateSyncTask(task.id, { status: 'failed' });
      return;
    }

    const delayMs = this.calculateNextRetryDelay(task.retryCount);
    const nextRetryTime = new Date(Date.now() + delayMs).toISOString();

    await updateSyncTask(task.id, { nextRetryTime, retryCount: task.retryCount + 1 });

    const timer = setTimeout(async () => {
      try {
        await updateSyncTask(task.id, { status: 'syncing' });
        await syncFn(task);
        await updateSyncTask(task.id, { status: 'completed' });
      } catch (error) {
        console.error(`[RetryManager] Retry failed for task ${task.id}:`, error);
        await updateSyncTask(task.id, { error: error instanceof Error ? error.message : 'Unknown error' });
        await this.scheduleRetry({ ...task, retryCount: task.retryCount + 1 }, syncFn);
      } finally {
        this.retryTimers.delete(task.id);
      }
    }, delayMs);

    this.retryTimers.set(task.id, timer);
    console.log(`[RetryManager] Scheduled retry for task ${task.id} in ${delayMs / 1000}s`);
  }

  cancelRetry(taskId: string): void {
    const timer = this.retryTimers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(taskId);
      console.log(`[RetryManager] Cancelled retry for task ${taskId}`);
    }
  }

  shutdown(): void {
    this.retryTimers.forEach((timer) => clearTimeout(timer));
    this.retryTimers.clear();
    console.log('[RetryManager] Shutdown complete');
  }
}
