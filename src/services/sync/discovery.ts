import { SyncDevice, DeviceType } from './types';

export class DeviceDiscovery {
  private devices: Map<string, SyncDevice> = new Map();
  private discoveryInterval: NodeJS.Timeout | null = null;
  private onDeviceDiscovered: ((device: SyncDevice) => void) | null = null;
  private isRunning = false;

  constructor() {}

  async start(
    deviceType: DeviceType,
    deviceName: string,
    port: number = 3002,
    callbacks?: { onDeviceDiscovered?: (device: SyncDevice) => void }
  ): Promise<void> {
    if (this.isRunning) {
      console.log('[Discovery] Already running');
      return;
    }

    this.isRunning = true;
    this.onDeviceDiscovered = callbacks?.onDeviceDiscovered || null;
    console.log('[Discovery] Starting simplified discovery service...');

    // 由于 React Native 限制，我们使用简化的设备发现机制
    // 主要依赖手动添加设备和定期健康检查
    this.startHealthCheck();
  }

  private startHealthCheck(): void {
    this.discoveryInterval = setInterval(async () => {
      await this.checkDeviceHealth();
    }, 30000); // 每 30 秒检查一次
  }

  private async checkDeviceHealth(): Promise<void> {
    const now = new Date().toISOString();
    const devicesToRemove: string[] = [];

    for (const [id, device] of this.devices) {
      try {
        const response = await fetch(`${device.url}/api/info`, {
          method: 'GET',
          timeout: 5000,
        });
        if (response.ok) {
          device.lastSeen = now;
          this.devices.set(id, device);
        } else {
          devicesToRemove.push(id);
        }
      } catch {
        devicesToRemove.push(id);
      }
    }

    devicesToRemove.forEach((id) => {
      console.log(`[Discovery] Removing inactive device: ${id}`);
      this.devices.delete(id);
    });
  }

  addDevice(ip: string, port: number, type: string, name: string): SyncDevice {
    const id = `${ip}:${port}`;
    const device: SyncDevice = {
      id,
      name,
      type: type as DeviceType,
      ip,
      port,
      lastSeen: new Date().toISOString(),
      capabilities: {
        canReceive: type === 'inspiration-bartender' || type === 'writing-coach',
        canSend: type !== 'desktop-pet',
      },
      version: '1.0.0',
      url: `http://${ip}:${port}`,
    };

    this.devices.set(id, device);
    console.log('[Discovery] Device added:', device);

    if (this.onDeviceDiscovered) {
      this.onDeviceDiscovered(device);
    }

    return device;
  }

  removeDevice(id: string): boolean {
    return this.devices.delete(id);
  }

  getDevices(filterType?: string): SyncDevice[] {
    const devices = Array.from(this.devices.values());
    if (filterType) {
      return devices.filter((d) => d.type === filterType);
    }
    return devices;
  }

  getDevice(id: string): SyncDevice | undefined {
    return this.devices.get(id);
  }

  stop(): void {
    this.isRunning = false;
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    this.devices.clear();
    console.log('[Discovery] Stopped');
  }
}
