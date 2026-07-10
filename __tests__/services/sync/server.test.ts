import { SyncServer } from '../../../src/services/sync/server';
import { SyncInspiration } from '../../../src/services/sync/types';

describe('sync/server', () => {
  let server: SyncServer;

  beforeEach(() => {
    server = new SyncServer(3002);
  });

  afterEach(() => {
    server.stop();
  });

  describe('constructor', () => {
    it('应初始化设备信息', () => {
      const deviceInfo = server.getDeviceInfo();
      expect(deviceInfo.name).toBe('灵感调酒师');
      expect(deviceInfo.type).toBe('inspiration-bartender');
      expect(deviceInfo.port).toBe(3002);
      expect(deviceInfo.url).toBe('http://127.0.0.1:3002');
    });
  });

  describe('start', () => {
    it('应成功启动服务器', async () => {
      await server.start('测试设备', 'inspiration-bartender', {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => [],
      });
    });

    it('重复启动应不报错', async () => {
      await server.start('测试设备', 'inspiration-bartender', {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => [],
      });
      await server.start('测试设备', 'inspiration-bartender', {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => [],
      });
    });

    it('应更新设备名称和类型', async () => {
      await server.start('我的设备', 'writing-coach', {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => [],
      });

      const deviceInfo = server.getDeviceInfo();
      expect(deviceInfo.name).toBe('我的设备');
      expect(deviceInfo.type).toBe('writing-coach');
    });
  });

  describe('handleExternalRequest', () => {
    const mockInspirations: SyncInspiration[] = [
      {
        id: 'test-id',
        title: '测试灵感',
        content: '测试内容',
        tags: [],
        source: 'inspiration-bartender',
        sourceApp: 'test',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        syncStatus: 'local',
        syncHistory: [],
        checksum: 'test-checksum',
      },
    ];

    it('服务器未启动应返回 503', async () => {
      const result = await server.handleExternalRequest('/api/info', 'GET', {}, {} as any);
      expect(result.status).toBe(503);
      expect(result.body.error).toBe('Server not available');
    });

    it('GET /api/info 应返回设备信息', async () => {
      await server.start('测试设备', 'inspiration-bartender', {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => [],
      });

      const result = await server.handleExternalRequest('/api/info', 'GET', {}, {} as any);

      expect(result.status).toBe(200);
      expect(result.body.device.name).toBe('测试设备');
      expect(result.body.api.version).toBe('1.0.0');
      expect(result.body.api.endpoints).toContain('/api/info');
      expect(result.body.api.endpoints).toContain('/api/inspirations');
    });

    it('POST /api/inspirations 应调用回调', async () => {
      const receivedInspirations: SyncInspiration[][] = [];
      const receivedSources: string[] = [];

      const callbacks = {
        onInspirationsReceived: async (inspirations: SyncInspiration[], source: string) => {
          receivedInspirations.push(inspirations);
          receivedSources.push(source);
          return {
            success: true,
            received: inspirations.length,
            processed: inspirations.length,
            conflicts: 0,
            timestamp: new Date().toISOString(),
          };
        },
        getLocalInspirations: async () => [],
      };

      await server.start('测试设备', 'inspiration-bartender', callbacks);

      const result = await server.handleExternalRequest('/api/inspirations', 'POST', {
        inspirations: mockInspirations,
        source: 'writing-coach',
      }, callbacks);

      expect(result.status).toBe(200);
      expect(result.body.success).toBe(true);
      expect(receivedInspirations).toHaveLength(1);
      expect(receivedInspirations[0][0].id).toBe('test-id');
      expect(receivedSources[0]).toBe('writing-coach');
    });

    it('GET /api/inspirations/list 应返回灵感列表', async () => {
      const callbacks = {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => mockInspirations,
      };

      await server.start('测试设备', 'inspiration-bartender', callbacks);

      const result = await server.handleExternalRequest('/api/inspirations/list', 'GET', {}, callbacks);

      expect(result.status).toBe(200);
      expect(result.body.inspirations).toHaveLength(1);
      expect(result.body.count).toBe(1);
      expect(result.body.lastSync).toBeDefined();
    });

    it('未知端点应返回 404', async () => {
      const callbacks = {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => [],
      };

      await server.start('测试设备', 'inspiration-bartender', callbacks);

      const result = await server.handleExternalRequest('/api/unknown', 'GET', {}, callbacks);

      expect(result.status).toBe(404);
      expect(result.body.error).toBe('Not found');
    });

    it('回调错误应返回 500', async () => {
      const callbacks = {
        onInspirationsReceived: async () => {
          throw new Error('内部错误');
        },
        getLocalInspirations: async () => [],
      };

      await server.start('测试设备', 'inspiration-bartender', callbacks);

      const result = await server.handleExternalRequest('/api/inspirations', 'POST', {
        inspirations: mockInspirations,
        source: 'writing-coach',
      }, callbacks);

      expect(result.status).toBe(500);
      expect(result.body.error).toBe('Internal server error');
    });
  });

  describe('setDeviceIp', () => {
    it('应更新设备 IP 和 URL', () => {
      server.setDeviceIp('192.168.1.10');

      const deviceInfo = server.getDeviceInfo();
      expect(deviceInfo.ip).toBe('192.168.1.10');
      expect(deviceInfo.url).toBe('http://192.168.1.10:3002');
    });
  });

  describe('getDeviceInfo', () => {
    it('应返回设备信息副本', async () => {
      await server.start('测试设备', 'inspiration-bartender', {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => [],
      });

      const deviceInfo = server.getDeviceInfo();
      deviceInfo.name = '修改后';

      const updatedDeviceInfo = server.getDeviceInfo();
      expect(updatedDeviceInfo.name).toBe('测试设备');
    });
  });

  describe('stop', () => {
    it('应停止服务器', async () => {
      await server.start('测试设备', 'inspiration-bartender', {
        onInspirationsReceived: async () => ({
          success: true,
          received: 0,
          processed: 0,
          conflicts: 0,
          timestamp: new Date().toISOString(),
        }),
        getLocalInspirations: async () => [],
      });

      server.stop();

      const result = await server.handleExternalRequest('/api/info', 'GET', {}, {} as any);
      expect(result.status).toBe(503);
    });
  });
});