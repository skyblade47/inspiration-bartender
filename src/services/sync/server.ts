import { SyncDevice, SyncInspiration, InfoResponse, SyncResponse, InspirationListResponse, DeviceType } from './types';
import { nowISO } from './protocol';

type RequestHandler = (
  path: string,
  method: string,
  body: any
) => Promise<{ status: number; body: any }>;

export class SyncServer {
  private port: number;
  private deviceInfo: SyncDevice;
  private isRunning = false;
  private requestHandler: RequestHandler | null = null;
  private localInspirations: SyncInspiration[] = [];

  constructor(port: number = 3002) {
    this.port = port;
    this.deviceInfo = {
      id: `inspiration-bartender-${Date.now()}`,
      name: '灵感调酒师',
      type: 'inspiration-bartender',
      ip: '127.0.0.1',
      port: this.port,
      lastSeen: nowISO(),
      capabilities: {
        canReceive: true,
        canSend: true,
      },
      version: '1.0.0',
      url: `http://127.0.0.1:${this.port}`,
    };
  }

  async start(
    deviceName: string,
    deviceType: DeviceType,
    callbacks: {
      onInspirationsReceived: (inspirations: SyncInspiration[], source: string) => Promise<SyncResponse>;
      getLocalInspirations: () => Promise<SyncInspiration[]>;
    }
  ): Promise<void> {
    if (this.isRunning) {
      console.log('[Server] Already running');
      return;
    }

    this.deviceInfo.name = deviceName;
    this.deviceInfo.type = deviceType;
    this.isRunning = true;

    // 在 React Native 中，我们使用一个模拟服务器来处理 API 请求
    // 实际的网络服务器需要通过原生模块或在 Web 环境中运行
    this.requestHandler = async (path: string, method: string, body: any) => {
      return this.handleRequest(path, method, body, callbacks);
    };

    console.log(`[Server] Sync server initialized on port ${this.port}`);
  }

  private async handleRequest(
    path: string,
    method: string,
    body: any,
    callbacks: {
      onInspirationsReceived: (inspirations: SyncInspiration[], source: string) => Promise<SyncResponse>;
      getLocalInspirations: () => Promise<SyncInspiration[]>;
    }
  ): Promise<{ status: number; body: any }> {
    try {
      if (path === '/api/info' && method === 'GET') {
        const response: InfoResponse = {
          device: this.deviceInfo,
          api: {
            version: '1.0.0',
            endpoints: ['/api/info', '/api/inspirations', '/api/inspirations/list'],
          },
        };
        return { status: 200, body: response };
      }

      if (path === '/api/inspirations' && method === 'POST') {
        const { inspirations, source } = body;
        const result = await callbacks.onInspirationsReceived(inspirations, source);
        return { status: 200, body: result };
      }

      if (path === '/api/inspirations/list' && method === 'GET') {
        const localInspirations = await callbacks.getLocalInspirations();
        const response: InspirationListResponse = {
          inspirations: localInspirations,
          count: localInspirations.length,
          lastSync: nowISO(),
        };
        return { status: 200, body: response };
      }

      return {
        status: 404,
        body: { error: 'Not found', message: `Unknown endpoint: ${method} ${path}` },
      };
    } catch (error) {
      console.error('[Server] Error handling request:', error);
      return {
        status: 500,
        body: { error: 'Internal server error', message: (error as Error).message },
      };
    }
  }

  async handleExternalRequest(
    path: string,
    method: string,
    body: any,
    callbacks: {
      onInspirationsReceived: (inspirations: SyncInspiration[], source: string) => Promise<SyncResponse>;
      getLocalInspirations: () => Promise<SyncInspiration[]>;
    }
  ): Promise<{ status: number; body: any }> {
    if (!this.requestHandler) {
      return { status: 503, body: { error: 'Server not available' } };
    }
    return this.handleRequest(path, method, body, callbacks);
  }

  setDeviceIp(ip: string): void {
    this.deviceInfo.ip = ip;
    this.deviceInfo.url = `http://${ip}:${this.port}`;
  }

  getDeviceInfo(): SyncDevice {
    return { ...this.deviceInfo };
  }

  stop(): void {
    this.isRunning = false;
    this.requestHandler = null;
    console.log('[Server] Sync server stopped');
  }
}
