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
}
