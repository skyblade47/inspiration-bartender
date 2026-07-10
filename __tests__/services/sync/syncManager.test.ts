import { SyncManager } from '../../../src/services/sync/syncManager';
import { SyncConfig, SyncDevice, SyncInspiration, SyncTask, SyncStatus } from '../../../src/services/sync/types';

jest.mock('../../../src/services/sync/discovery', () => ({
  DeviceDiscovery: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
    addDevice: jest.fn().mockImplementation((ip: string, port: number) => ({
      id: `${ip}:${port}`,
      name: '写作教练',
      type: 'writing-coach',
      ip,
      port,
      url: `http://${ip}:${port}`,
      capabilities: { canReceive: true, canSend: true },
      version: '1.0.0',
      lastSeen: new Date().toISOString(),
    })),
    removeDevice: jest.fn().mockReturnValue(true),
    getDevices: jest.fn().mockReturnValue([]),
    getDevice: jest.fn().mockReturnValue(undefined),
  })),
}));

jest.mock('../../../src/services/sync/server', () => ({
  SyncServer: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn(),
  })),
}));

jest.mock('../../../src/services/sync/retryManager', () => ({
  RetryManager: {
    getInstance: jest.fn().mockReturnValue({
      scheduleRetry: jest.fn().mockResolvedValue(undefined),
      cancelRetry: jest.fn(),
      shutdown: jest.fn(),
    }),
  },
}));

jest.mock('../../../src/services/sync/stateStore', () => ({
  SyncStateStore: {
    getInstance: jest.fn().mockReturnValue({
      init: jest.fn().mockResolvedValue(undefined),
      createTask: jest.fn().mockResolvedValue({ id: 'task-id' } as SyncTask),
      getTask: jest.fn().mockResolvedValue(null),
      getTasksByStatus: jest.fn().mockResolvedValue([]),
      updateTask: jest.fn().mockResolvedValue(undefined),
      deleteTask: jest.fn().mockResolvedValue(undefined),
      clearCompletedTasks: jest.fn().mockResolvedValue(undefined),
      addHistory: jest.fn().mockResolvedValue(undefined),
      getHistory: jest.fn().mockResolvedValue([]),
      getStatus: jest.fn().mockResolvedValue({
        lastSyncTime: null,
        pendingTasks: 0,
        failedTasks: 0,
        syncingTasks: 0,
        completedTasks: 0,
      }),
    }),
  },
}));

jest.mock('../../../src/services/sync/protocol', () => ({
  toSyncInspiration: jest.fn().mockImplementation((data) => ({
    id: data.id,
    title: data.name,
    content: data.content || '',
    tags: [],
    source: 'inspiration-bartender',
    sourceApp: 'test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: 'local',
    syncHistory: [],
    checksum: 'test-checksum',
  })),
  fromSyncInspiration: jest.fn().mockImplementation((syncInsp) => ({
    id: syncInsp.id,
    name: syncInsp.title || 'Untitled',
    content: syncInsp.content,
    tags: syncInsp.tags,
  })),
  nowISO: jest.fn().mockReturnValue('2024-01-01'),
  generateId: jest.fn().mockReturnValue('new-id'),
}));

describe('sync/syncManager', () => {
  let syncManager: SyncManager;

  beforeEach(() => {
    jest.clearAllMocks();
    (SyncManager as any)['instance'] = undefined;
    syncManager = SyncManager.getInstance();
  });

  afterEach(async () => {
    await syncManager.shutdown();
  });

  describe('getInstance', () => {
    it('应返回单例实例', () => {
      const instance1 = SyncManager.getInstance();
      const instance2 = SyncManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('init', () => {
    it('应成功初始化', async () => {
      await syncManager.init();
    });

    it('应使用自定义配置', async () => {
      const config: Partial<SyncConfig> = {
        deviceName: '自定义设备',
        autoSync: false,
      };

      await syncManager.init(config);

      const currentConfig = syncManager.getConfig();
      expect(currentConfig.deviceName).toBe('自定义设备');
      expect(currentConfig.autoSync).toBe(false);
    });

    it('应注册回调函数', async () => {
      const onErrorMock = jest.fn();

      await syncManager.init({}, { onError });

      function onError(error: Error) {
        onErrorMock(error);
      }
    });

    it('重复初始化应不报错', async () => {
      await syncManager.init();
      await syncManager.init();
    });
  });

  describe('getConfig', () => {
    it('应返回当前配置', async () => {
      await syncManager.init();

      const config = syncManager.getConfig();
      expect(config.deviceName).toBe('灵感调酒师');
      expect(config.autoSync).toBe(true);
      expect(config.syncInterval).toBe(5);
    });
  });

  describe('updateConfig', () => {
    it('应更新配置', async () => {
      await syncManager.init();

      syncManager.updateConfig({ deviceName: '新名称', syncInterval: 10 });

      const config = syncManager.getConfig();
      expect(config.deviceName).toBe('新名称');
      expect(config.syncInterval).toBe(10);
    });

    it('应在 autoSync 变为 false 时停止自动同步', async () => {
      await syncManager.init({ autoSync: true });

      syncManager.updateConfig({ autoSync: false });

      const config = syncManager.getConfig();
      expect(config.autoSync).toBe(false);
    });
  });

  describe('addDevice', () => {
    it('应添加设备', async () => {
      await syncManager.init();

      const device = syncManager.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');

      expect(device.id).toBe('192.168.1.10:3002');
      expect(device.name).toBe('写作教练');
    });
  });

  describe('removeDevice', () => {
    it('应移除设备', async () => {
      await syncManager.init();
      syncManager.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');

      const result = syncManager.removeDevice('192.168.1.10:3002');
      expect(result).toBe(true);
    });
  });

  describe('getDiscoveredDevices', () => {
    it('应返回发现的设备', async () => {
      await syncManager.init();

      const devices = syncManager.getDiscoveredDevices();
      expect(Array.isArray(devices)).toBe(true);
    });
  });

  describe('getSyncStatus', () => {
    it('应返回同步状态', async () => {
      await syncManager.init();

      const status = await syncManager.getSyncStatus();
      expect(status.lastSyncTime).toBeDefined();
      expect(typeof status.pendingTasks).toBe('number');
      expect(typeof status.failedTasks).toBe('number');
      expect(typeof status.syncingTasks).toBe('number');
      expect(typeof status.completedTasks).toBe('number');
    });
  });

  describe('syncNow', () => {
    it('应触发同步', async () => {
      await syncManager.init();

      const result = await syncManager.syncNow();
      expect(result.success).toBeDefined();
      expect(result.timestamp).toBeDefined();
    });
  });

  describe('clearCompletedTasks', () => {
    it('应清除已完成任务', async () => {
      await syncManager.init();

      await syncManager.clearCompletedTasks();
    });
  });

  describe('shutdown', () => {
    it('应关闭同步管理器', async () => {
      await syncManager.init();

      await syncManager.shutdown();
    });
  });
});