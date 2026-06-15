import { SyncInspiration, SyncDevice, SyncConfig, SyncResponse, SyncEventCallbacks, DeviceType, SyncTask, SyncStatus } from './types';
import { DeviceDiscovery } from './discovery';
import { SyncServer } from './server';
import { toSyncInspiration, fromSyncInspiration, nowISO, generateId } from './protocol';
import { RetryManager } from './retryManager';
import { SyncStateStore } from './stateStore';

const DEFAULT_PORT = 3002;

export class SyncManager {
  private static instance: SyncManager;

  private discovery: DeviceDiscovery;
  private server: SyncServer;
  private config: SyncConfig;
  private syncQueue: SyncInspiration[] = [];
  private receivedInspirations: SyncInspiration[] = [];
  private isRunning = false;
  private syncInterval: NodeJS.Timeout | null = null;

  private retryManager: RetryManager;
  private stateStore: SyncStateStore;

  private callbacks: SyncEventCallbacks = {};
  private getLocalInspirations: (() => Promise<any[]>) | null = null;
  private saveInspiration: ((data: any) => Promise<void>) | null = null;

  private constructor() {
    this.discovery = new DeviceDiscovery();
    this.server = new SyncServer(DEFAULT_PORT);
    this.retryManager = RetryManager.getInstance();
    this.stateStore = SyncStateStore.getInstance();
    this.config = {
      enabled: true,
      autoSync: true,
      syncInterval: 5,
      deviceName: '灵感调酒师',
      port: DEFAULT_PORT,
    };
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  async init(
    config?: Partial<SyncConfig>,
    callbacks?: SyncEventCallbacks & {
      getLocalInspirations?: () => Promise<any[]>;
      saveInspiration?: (data: any) => Promise<void>;
    }
  ): Promise<void> {
    if (this.isRunning) {
      console.log('[SyncManager] Already initialized');
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.callbacks = {
      onInspirationReceived: callbacks?.onInspirationReceived,
      onDeviceDiscovered: callbacks?.onDeviceDiscovered,
      onSyncComplete: callbacks?.onSyncComplete,
      onError: callbacks?.onError,
      onSyncStatusChanged: callbacks?.onSyncStatusChanged,
    };
    this.getLocalInspirations = callbacks?.getLocalInspirations || null;
    this.saveInspiration = callbacks?.saveInspiration || null;

    try {
      await this.stateStore.init();
      await this.loadPendingTasks();

      await this.discovery.start(
        'inspiration-bartender',
        this.config.deviceName,
        this.config.port,
        {
          onDeviceDiscovered: this.callbacks.onDeviceDiscovered,
        }
      );

      await this.server.start(this.config.deviceName, 'inspiration-bartender', {
        onInspirationsReceived: this.handleReceivedInspirations.bind(this),
        getLocalInspirations: this.getLocalSyncInspirations.bind(this),
      });

      if (this.config.autoSync) {
        this.startAutoSync();
      }

      this.isRunning = true;
      console.log('[SyncManager] Initialized successfully');
    } catch (error) {
      console.error('[SyncManager] Initialization failed:', error);
      if (this.callbacks.onError) {
        this.callbacks.onError(error as Error);
      }
      throw error;
    }
  }

  private async loadPendingTasks(): Promise<void> {
    try {
      const pendingTasks = await this.stateStore.getTasksByStatus('pending');
      const failedTasks = await this.stateStore.getTasksByStatus('failed');
      const tasksToRetry = [...pendingTasks, ...failedTasks];

      for (const task of tasksToRetry) {
        const inspiration = await this.findInspirationById(task.inspirationId);
        if (inspiration) {
          this.syncQueue.push(inspiration);
        }
      }

      console.log(`[SyncManager] Loaded ${tasksToRetry.length} pending tasks`);
    } catch (error) {
      console.error('[SyncManager] Failed to load pending tasks:', error);
    }
  }

  private async findInspirationById(id: string): Promise<SyncInspiration | undefined> {
    if (!this.getLocalInspirations) return undefined;

    try {
      const inspirations = await this.getLocalInspirations();
      const found = inspirations.find((i: any) => i.id === id);
      if (found) {
        return toSyncInspiration(
          {
            id: found.id,
            name: found.name,
            content: found.rawInput?.text || '',
            tags: [],
            createdAt: new Date(found.createdAt),
            updatedAt: new Date(found.updatedAt),
            glassType: found.type,
            completion: found.completion,
            rawInput: found.rawInput,
          },
          'inspiration-bartender'
        );
      }
    } catch (error) {
      console.error('[SyncManager] Failed to find inspiration:', error);
    }
    return undefined;
  }

  private startAutoSync(): void {
    const intervalMs = this.config.syncInterval * 60 * 1000;
    this.syncInterval = setInterval(() => {
      this.pushToWritingCoach();
    }, intervalMs);
  }

  private async getLocalSyncInspirations(): Promise<SyncInspiration[]> {
    if (!this.getLocalInspirations) {
      return [];
    }
    try {
      const localInspirations = await this.getLocalInspirations();
      return localInspirations.map((insp) =>
        toSyncInspiration(
          {
            id: insp.id,
            name: insp.name,
            content: insp.rawInput?.text || '',
            tags: [],
            createdAt: new Date(insp.createdAt),
            updatedAt: new Date(insp.updatedAt),
            glassType: insp.type,
            completion: insp.completion,
            rawInput: insp.rawInput,
          },
          'inspiration-bartender'
        )
      );
    } catch (error) {
      console.error('[SyncManager] Error getting local inspirations:', error);
      return [];
    }
  }

  async handleReceivedInspirations(
    inspirations: SyncInspiration[],
    source: string
  ): Promise<SyncResponse> {
    console.log(`[SyncManager] Received ${inspirations.length} inspirations from ${source}`);

    let processed = 0;
    let conflicts = 0;

    for (const insp of inspirations) {
      const existingIndex = this.receivedInspirations.findIndex((i) => i.id === insp.id);

      if (existingIndex >= 0) {
        const existing = this.receivedInspirations[existingIndex];
        if (new Date(insp.updatedAt) > new Date(existing.updatedAt)) {
          this.receivedInspirations[existingIndex] = insp;
          processed++;
          await this.saveReceivedInspiration(insp);
        } else {
          conflicts++;
        }
      } else {
        this.receivedInspirations.push(insp);
        processed++;
        await this.saveReceivedInspiration(insp);
      }

      this.syncQueue.push(insp);
    }

    if (this.config.autoSync) {
      this.pushToWritingCoach();
    }

    const result: SyncResponse = {
      success: true,
      received: inspirations.length,
      processed,
      conflicts,
      timestamp: nowISO(),
    };

    if (this.callbacks.onSyncComplete) {
      this.callbacks.onSyncComplete(result);
    }

    await this.notifyStatusChange();

    return result;
  }

  private async saveReceivedInspiration(inspiration: SyncInspiration): Promise<void> {
    if (this.saveInspiration) {
      try {
        const data = fromSyncInspiration(inspiration);
        await this.saveInspiration(data);
      } catch (error) {
        console.error('[SyncManager] Error saving inspiration:', error);
      }
    }

    if (this.callbacks.onInspirationReceived) {
      this.callbacks.onInspirationReceived(inspiration);
    }
  }

  async pushToWritingCoach(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    const targets = this.discovery.getDevices('writing-coach');
    if (targets.length === 0) {
      console.log('[SyncManager] No writing coach devices found');
      return;
    }

    console.log(`[SyncManager] Pushing ${this.syncQueue.length} inspirations to writing coach...`);

    const startTime = Date.now();

    for (const target of targets) {
      const tasks: SyncTask[] = [];

      for (const insp of this.syncQueue) {
        const task = await this.stateStore.createTask(insp.id, target.id);
        tasks.push(task);
      }

      for (const task of tasks) {
        try {
          await this.stateStore.updateTask(task.id, { status: 'syncing' });
          await this.pushToDevice(target, [this.syncQueue.find((i) => i.id === task.inspirationId)!]);

          await this.stateStore.updateTask(task.id, { status: 'completed' });
          await this.stateStore.addHistory(
            task.inspirationId,
            'inspiration-bartender',
            target.id,
            'completed',
            Date.now() - startTime
          );
        } catch (error) {
          console.error(`[SyncManager] Push to ${target.name} failed for task ${task.id}:`, error);
          await this.stateStore.updateTask(task.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          await this.retryManager.scheduleRetry(task, async (retryTask) => {
            const insp = await this.findInspirationById(retryTask.inspirationId);
            if (insp) {
              await this.pushToDevice(target, [insp]);
            }
          });
        }
      }
    }

    this.syncQueue.forEach((insp) => {
      insp.syncStatus = 'synced';
    });
    this.syncQueue = [];

    await this.notifyStatusChange();
  }

  private async pushToDevice(
    device: SyncDevice,
    inspirations: SyncInspiration[]
  ): Promise<SyncResponse> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${device.url}/api/inspirations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspirations,
          source: 'inspiration-bartender',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const status = response.status;
        if (status >= 400 && status < 500) {
          throw new Error(`Client error: HTTP ${status}`);
        } else if (status >= 500) {
          throw new Error(`Server error: HTTP ${status}`);
        } else {
          throw new Error(`HTTP ${status}`);
        }
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      console.log(`[SyncManager] Push to ${device.name} took ${duration}ms`);
    }
  }

  async sendInspiration(inspiration: any, targetDeviceId?: string): Promise<void> {
    const syncInsp = toSyncInspiration(
      {
        id: inspiration.id || generateId(),
        name: inspiration.name,
        content: inspiration.rawInput?.text || '',
        tags: [],
        createdAt: new Date(inspiration.createdAt || Date.now()),
        updatedAt: new Date(inspiration.updatedAt || Date.now()),
        glassType: inspiration.type,
        completion: inspiration.completion,
        rawInput: inspiration.rawInput,
      },
      'inspiration-bartender'
    );

    this.syncQueue.push(syncInsp);

    if (targetDeviceId) {
      const device = this.discovery.getDevice(targetDeviceId);
      if (device) {
        const task = await this.stateStore.createTask(syncInsp.id, device.id);
        try {
          await this.stateStore.updateTask(task.id, { status: 'syncing' });
          await this.pushToDevice(device, [syncInsp]);
          await this.stateStore.updateTask(task.id, { status: 'completed' });
        } catch (error) {
          await this.stateStore.updateTask(task.id, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          await this.retryManager.scheduleRetry(task, async (retryTask) => {
            const insp = await this.findInspirationById(retryTask.inspirationId);
            if (insp) {
              await this.pushToDevice(device, [insp]);
            }
          });
        }
        return;
      }
    }

    await this.pushToWritingCoach();
  }

  async syncNow(): Promise<SyncResponse> {
    console.log('[SyncManager] Manual sync triggered');
    const pendingTasks = await this.stateStore.getTasksByStatus('pending');
    const failedTasks = await this.stateStore.getTasksByStatus('failed');

    for (const task of [...pendingTasks, ...failedTasks]) {
      const inspiration = await this.findInspirationById(task.inspirationId);
      if (inspiration) {
        this.syncQueue.push(inspiration);
      }
    }

    await this.pushToWritingCoach();

    const status = await this.getSyncStatus();
    return {
      success: status.failedTasks === 0,
      received: 0,
      processed: status.completedTasks,
      conflicts: 0,
      timestamp: nowISO(),
    };
  }

  async getSyncStatus(): Promise<SyncStatus> {
    return this.stateStore.getStatus();
  }

  async getPendingTasks(): Promise<SyncTask[]> {
    return this.stateStore.getTasksByStatus('pending');
  }

  async getSyncHistory(): Promise<{ inspirationId: string; sourceDevice: string; targetDevice: string; status: string; timestamp: string; durationMs: number }[]> {
    return this.stateStore.getHistory();
  }

  async retryFailedTask(taskId: string): Promise<void> {
    const task = await this.stateStore.getTask(taskId);
    if (!task || task.status !== 'failed') {
      throw new Error('Task not found or not in failed state');
    }

    await this.stateStore.updateTask(taskId, { status: 'pending', retryCount: 0 });
    const inspiration = await this.findInspirationById(task.inspirationId);
    if (inspiration) {
      this.syncQueue.push(inspiration);
      await this.pushToWritingCoach();
    }
  }

  async cancelTask(taskId: string): Promise<void> {
    this.retryManager.cancelRetry(taskId);
    await this.stateStore.deleteTask(taskId);
  }

  async clearCompletedTasks(): Promise<void> {
    await this.stateStore.clearCompletedTasks();
  }

  private async notifyStatusChange(): Promise<void> {
    if (this.callbacks.onSyncStatusChanged) {
      try {
        const status = await this.getSyncStatus();
        this.callbacks.onSyncStatusChanged(status);
      } catch (error) {
        console.error('[SyncManager] Failed to notify status change:', error);
      }
    }
  }

  addDevice(ip: string, port: number, type: string, name: string): SyncDevice {
    return this.discovery.addDevice(ip, port, type, name);
  }

  removeDevice(id: string): boolean {
    return this.discovery.removeDevice(id);
  }

  getDiscoveredDevices(): SyncDevice[] {
    return this.discovery.getDevices();
  }

  getReceivedInspirations(): SyncInspiration[] {
    return [...this.receivedInspirations];
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.autoSync === false && this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    } else if (config.autoSync === true && !this.syncInterval && this.isRunning) {
      this.startAutoSync();
    }
  }

  async shutdown(): Promise<void> {
    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    this.retryManager.shutdown();
    this.discovery.stop();
    this.server.stop();

    console.log('[SyncManager] Shutdown complete');
  }
}
