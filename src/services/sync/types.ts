export type DeviceType = 'desktop-pet' | 'inspiration-bartender' | 'writing-coach';

export interface SyncDevice {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  port: number;
  lastSeen: string;
  capabilities: {
    canReceive: boolean;
    canSend: boolean;
  };
  version: string;
  url: string;
}

export interface SyncInspiration {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  source: DeviceType;
  sourceApp: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'local' | 'pending' | 'synced';
  syncHistory: Array<{
    to: string;
    at: string;
    success: boolean;
  }>;
  checksum: string;
  original?: {
    chatHistory?: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
    glassType?: string;
    completion?: number;
    rawInput?: any;
  };
}

export interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number;
  deviceName: string;
  port: number;
}

export interface InfoResponse {
  device: SyncDevice;
  api: {
    version: string;
    endpoints: string[];
  };
}

export interface SyncResponse {
  success: boolean;
  received: number;
  processed: number;
  conflicts: number;
  timestamp: string;
}

export interface InspirationListResponse {
  inspirations: SyncInspiration[];
  count: number;
  lastSync: string;
}

export interface SyncEventCallbacks {
  onInspirationReceived?: (inspiration: SyncInspiration) => void;
  onDeviceDiscovered?: (device: SyncDevice) => void;
  onSyncComplete?: (result: SyncResponse) => void;
  onError?: (error: Error) => void;
  onSyncStatusChanged?: (status: SyncStatus) => void;
}

export interface SyncTask {
  id: string;
  inspirationId: string;
  targetDeviceId: string;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  nextRetryTime: string | null;
  createdAt: string;
  updatedAt: string;
  error: string | null;
}

export interface SyncStatus {
  lastSyncTime: string | null;
  pendingTasks: number;
  failedTasks: number;
  syncingTasks: number;
  completedTasks: number;
}

export interface SyncHistory {
  id: number;
  inspirationId: string;
  sourceDevice: string;
  targetDevice: string;
  status: string;
  timestamp: string;
  durationMs: number;
}

export interface SyncDeviceEnhanced extends SyncDevice {
  healthStatus: 'online' | 'offline' | 'unhealthy';
  responseTime: number;
  lastSyncSuccess: string | null;
  syncFailureCount: number;
}
