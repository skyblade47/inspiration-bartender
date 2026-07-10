import { DeviceDiscovery } from '../../../src/services/sync/discovery';

describe('sync/discovery', () => {
  let discovery: DeviceDiscovery;

  beforeEach(() => {
    discovery = new DeviceDiscovery();
  });

  afterEach(() => {
    discovery.stop();
  });

  describe('start', () => {
    it('应成功启动发现服务', async () => {
      await discovery.start('inspiration-bartender', '测试设备');
      expect(discovery.getDevices()).toEqual([]);
    });

    it('重复启动应不报错', async () => {
      await discovery.start('inspiration-bartender', '测试设备');
      await discovery.start('inspiration-bartender', '测试设备');
    });
  });

  describe('addDevice', () => {
    it('应添加设备', () => {
      const device = discovery.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');

      expect(device.id).toBe('192.168.1.10:3002');
      expect(device.name).toBe('写作教练');
      expect(device.type).toBe('writing-coach');
      expect(device.ip).toBe('192.168.1.10');
      expect(device.port).toBe(3002);
      expect(device.url).toBe('http://192.168.1.10:3002');
      expect(device.capabilities.canReceive).toBe(true);
      expect(device.capabilities.canSend).toBe(true);
    });

    it('应设置正确的能力', () => {
      const desktopPet = discovery.addDevice('192.168.1.11', 3002, 'desktop-pet', '桌宠');
      expect(desktopPet.capabilities.canReceive).toBe(false);
      expect(desktopPet.capabilities.canSend).toBe(false);

      const writingCoach = discovery.addDevice('192.168.1.12', 3002, 'writing-coach', '写作教练');
      expect(writingCoach.capabilities.canReceive).toBe(true);
      expect(writingCoach.capabilities.canSend).toBe(true);

      const bartender = discovery.addDevice('192.168.1.13', 3002, 'inspiration-bartender', '调酒师');
      expect(bartender.capabilities.canReceive).toBe(true);
      expect(bartender.capabilities.canSend).toBe(true);
    });

    it('应触发 onDeviceDiscovered 回调', async () => {
      const discoveredDevices: any[] = [];
      await discovery.start('inspiration-bartender', '测试设备', 3002, {
        onDeviceDiscovered: (device) => discoveredDevices.push(device),
      });

      discovery.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');

      expect(discoveredDevices).toHaveLength(1);
      expect(discoveredDevices[0].name).toBe('写作教练');
    });
  });

  describe('removeDevice', () => {
    it('应移除存在的设备', () => {
      discovery.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');
      const result = discovery.removeDevice('192.168.1.10:3002');

      expect(result).toBe(true);
      expect(discovery.getDevices()).toEqual([]);
    });

    it('移除不存在的设备应返回 false', () => {
      const result = discovery.removeDevice('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getDevices', () => {
    it('应返回所有设备', () => {
      discovery.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');
      discovery.addDevice('192.168.1.11', 3002, 'desktop-pet', '桌宠');

      const devices = discovery.getDevices();
      expect(devices).toHaveLength(2);
    });

    it('应按类型过滤设备', () => {
      discovery.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');
      discovery.addDevice('192.168.1.11', 3002, 'desktop-pet', '桌宠');

      const writingCoaches = discovery.getDevices('writing-coach');
      expect(writingCoaches).toHaveLength(1);
      expect(writingCoaches[0].name).toBe('写作教练');

      const desktopPets = discovery.getDevices('desktop-pet');
      expect(desktopPets).toHaveLength(1);
      expect(desktopPets[0].name).toBe('桌宠');
    });

    it('空设备列表应返回空数组', () => {
      const devices = discovery.getDevices();
      expect(devices).toEqual([]);
    });
  });

  describe('getDevice', () => {
    it('应返回指定设备', () => {
      discovery.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');

      const device = discovery.getDevice('192.168.1.10:3002');
      expect(device).toBeDefined();
      expect(device?.name).toBe('写作教练');
    });

    it('不存在的设备应返回 undefined', () => {
      const device = discovery.getDevice('nonexistent');
      expect(device).toBeUndefined();
    });
  });

  describe('stop', () => {
    it('应停止服务并清空设备列表', () => {
      discovery.addDevice('192.168.1.10', 3002, 'writing-coach', '写作教练');
      discovery.stop();

      expect(discovery.getDevices()).toEqual([]);
    });
  });
});