import { SyncInspiration, SyncDevice, SyncConfig, SyncResponse, SyncEventCallbacks, DeviceType } from './types';
import { DeviceDiscovery } from './discovery';
import { SyncServer } from './server';
import { toSyncInspiration, fromSyncInspiration, nowISO, generateId } from './protocol';

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

  private callbacks: SyncEventCallbacks = {};
  private getLocalInspirations: (() => Promise<any[]>) | null = null;
  private saveInspiration: ((data: any) => Promise<void>) | null = null;

  private constructor() {
    this.discovery = new DeviceDiscovery();
    this.server = new SyncServer(DEFAULT_PORT);
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
    };
    this.getLocalInspirations = callbacks?.getLocalInspirations || null;
    this.saveInspiration = callbacks?.saveInspiration || null;

    try {
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

    for (const target of targets) {
      try {
        await this.pushToDevice(target, this.syncQueue);
      } catch (error) {
        console.error(`[SyncManager] Push to ${target.name} failed:`, error);
      }
    }

    this.syncQueue.forEach((insp) => {
      insp.syncStatus = 'synced';
    });
    this.syncQueue = [];
  }

  private async pushToDevice(
    device: SyncDevice,
    inspirations: SyncInspiration[]
  ): Promise<SyncResponse> {
    const response = await fetch(`${device.url}/api/inspirations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inspirations,
        source: 'inspiration-bartender',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  }

  sendInspiration(inspiration: any, targetDeviceId?: string): Promise<void> {
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
        return this.pushToDevice(device, [syncInsp]);
      }
    }

    return this.pushToWritingCoach();
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
    
    this.discovery.stop();
    this.server.stop();
    
    console.log('[SyncManager] Shutdown complete');
  }
}
