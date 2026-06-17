# 灵感调酒师 - 同步系统设计规范

> 版本：v1.0
> 日期：2026-06-16
> 状态：已实现
> 适用：灵感调酒师项目的局域网数据同步

---

## 一、模块概述

### 1.1 功能定位
同步系统实现灵感调酒师与其他应用（桌面宠物、写作教练）的局域网数据同步：
- 支持从桌面宠物接收灵感数据
- 支持向写作教练发送灵感数据
- 支持设备自动发现（局域网扫描）
- 支持手动添加设备
- 提供同步任务队列和重试机制

### 1.2 文件结构

```
src/services/sync/
├── types.ts           # 类型定义
├── protocol.ts         # 协议工具函数
├── discovery.ts        # 设备发现模块
├── server.ts           # HTTP服务器模块
├── retryManager.ts    # 重试管理器
├── stateStore.ts       # 状态持久化存储
├── syncManager.ts      # 同步管理器（核心）
└── index.ts            # 导出入口
```

---

## 二、系统架构

### 2.1 数据流方向

```
桌面宠物 (Desktop Pet) ──┐
                           │ 单向数据流
                           ↓
                    灵感调酒师 (Bartender)
                           │ 单向数据流
                           ↓
                    AI写作教练 (Writing Coach)
```

**重要原则**：
- 桌面宠物 → 灵感调酒师（只发送，不接收）
- 灵感调酒师 → AI写作教练（只发送，不接收）
- 避免循环同步（校验和检测）

### 2.2 核心组件关系

```
┌─────────────────────────────────────────────────────────┐
│                      SyncManager                          │
│  ┌──────────┐   ┌─────────────┐   ┌─────────────┐        │
│  │ Discovery│ ↔ │ HTTP Server │ ↔ │ RetryManager│        │
│  └──────────┘   └─────────────┘   └─────────────┘        │
│                           ↓                               │
│                    ┌────────────┐                        │
│                    │ StateStore │                        │
│                    └────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

**组件职责**：
- **Discovery**：扫描局域网设备、维护设备列表
- **Server**：接收外部推送、提供API接口
- **RetryManager**：失败任务的自动重试
- **StateStore**：同步任务和历史的持久化

---

## 三、数据结构

### 3.1 设备类型

```typescript
type DeviceType = 
  | 'desktop-pet'        // 桌面宠物应用
  | 'inspiration-bartender' // 灵感调酒师
  | 'writing-coach';     // AI写作教练

interface SyncDevice {
  id: string;                 // 设备唯一ID
  name: string;               // 设备名称
  type: DeviceType;           // 设备类型
  ip: string;                 // IP地址
  port: number;               // 端口号
  lastSeen: string;           // 最后在线时间
  capabilities: {
    canReceive: boolean;      // 是否可接收数据
    canSend: boolean;         // 是否可发送数据
  };
  version: string;            // 应用版本
  url: string;                // 基础URL（http://ip:port）
}
```

### 3.2 同步灵感数据

```typescript
interface SyncInspiration {
  id: string;                      // 灵感ID
  title?: string;                  // 标题
  content: string;                 // 主要内容
  tags: string[];                  // 标签列表
  source: DeviceType;              // 来源应用
  sourceApp: string;               // 源应用标识
  createdAt: string;               // 创建时间(ISO)
  updatedAt: string;               // 更新时间(ISO)
  
  // 同步状态管理
  syncStatus: 'local' | 'pending' | 'synced';
  syncHistory: Array<{
    to: string;                    // 目标设备
    at: string;                    // 同步时间
    success: boolean;              // 是否成功
  }>;
  
  // 数据校验
  checksum: string;                // 内容校验和
  
  // 原始数据（可选）
  original?: {
    chatHistory?: Array<{ ... }>;  // 对话历史
    glassType?: string;            // 杯子类型
    completion?: number;           // 完成度
    rawInput?: any;                // 原始输入
  };
}
```

### 3.3 同步任务

```typescript
interface SyncTask {
  id: string;                      // 任务ID
  inspirationId: string;           // 灵感ID
  targetDeviceId: string;          // 目标设备ID
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;              // 当前重试次数
  maxRetries: number;              // 最大重试次数（默认5）
  nextRetryTime: string | null;    // 下次重试时间
  createdAt: string;               // 创建时间
  updatedAt: string;               // 更新时间
  error: string | null;            // 错误信息
}
```

### 3.4 同步状态

```typescript
interface SyncStatus {
  lastSyncTime: string | null;    // 最后一次成功同步
  pendingTasks: number;            // 待处理任务数
  failedTasks: number;             // 失败任务数
  syncingTasks: number;            // 同步中任务数
  completedTasks: number;          // 已完成任务数
}
```

---

## 四、API接口设计

### 4.1 接收接口（Server）

```
GET /api/info
  - 返回设备信息和API版本
  - 响应: InfoResponse { device, api }

GET /api/inspirations
  - 返回本地灵感列表
  - 响应: InspirationListResponse

POST /api/inspirations
  - 接收灵感推送
  - 请求体: { inspirations: SyncInspiration[], source: string }
  - 响应: SyncResponse { success, received, processed, conflicts }
```

### 4.2 发送流程

```typescript
// 1. 获取目标设备列表
const targets = discovery.getDevices('writing-coach');

// 2. 构建同步任务
for (const insp of queue) {
  for (const target of targets) {
    const task = stateStore.createTask(insp.id, target.id);
    // 尝试发送
    try {
      await pushToDevice(target, insp);
      await stateStore.updateTask(task.id, { status: 'completed' });
    } catch (error) {
      // 失败，交给重试管理器
      await retryManager.scheduleRetry(task, retryFunction);
    }
  }
}
```

### 4.3 发送请求体

```json
POST http://{target-ip}:{port}/api/inspirations

{
  "inspirations": [
    {
      "id": "uuid-string",
      "title": "灵感标题",
      "content": "主要内容...",
      "tags": ["tag1", "tag2"],
      "source": "inspiration-bartender",
      "sourceApp": "bartender-v1.0.0",
      "createdAt": "2024-06-15T10:00:00Z",
      "updatedAt": "2024-06-15T11:30:00Z",
      "syncStatus": "pending",
      "syncHistory": [],
      "checksum": "hash-value",
      "original": {
        "glassType": "brandy",
        "completion": 75
      }
    }
  ],
  "source": "inspiration-bartender"
}
```

---

## 五、重试机制

### 5.1 指数退避策略（Exponential Backoff）

```
重试次数 → 等待时间
第1次失败 → 30秒后重试
第2次失败 → 1分钟后重试
第3次失败 → 2分钟后重试
第4次失败 → 4分钟后重试
第5次失败 → 8分钟后重试（上限）

最大重试次数：5次
超过5次 → 标记为失败，等待用户手动触发
```

**算法**：
```
delay = baseDelay × 2^retryCount
maxDelay = 8分钟

示例：
retryCount=0 → 30s × 2^0 = 30s
retryCount=1 → 30s × 2^1 = 60s
retryCount=2 → 30s × 2^2 = 120s
```

### 5.2 失败判定标准

| 失败类型 | 是否重试 | 示例 |
|---------|---------|------|
| 网络超时 | ✓ | 请求30秒无响应 |
| 连接拒绝 | ✓ | 设备未启动服务 |
| HTTP 5xx | ✓ | 服务器内部错误 |
| HTTP 4xx | ✗ | 格式错误、未授权 |
| 校验和冲突 | ✗ | 数据已存在且更新 |

---

## 六、状态持久化

### 6.1 SQLite表结构

**表1：sync_tasks（同步任务队列）**
```sql
CREATE TABLE sync_tasks (
  id TEXT PRIMARY KEY,           -- 任务ID
  inspiration_id TEXT NOT NULL,  -- 灵感ID
  target_device_id TEXT NOT NULL, -- 目标设备ID
  status TEXT NOT NULL DEFAULT 'pending', -- pending/syncing/completed/failed
  retry_count INTEGER DEFAULT 0,  -- 当前重试次数
  max_retries INTEGER DEFAULT 5,  -- 最大重试次数
  next_retry_time TEXT,           -- 下次重试时间(ISO)
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  error TEXT                      -- 错误信息
);
```

**表2：sync_history（同步历史记录）**
```sql
CREATE TABLE sync_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inspiration_id TEXT NOT NULL,
  source_device TEXT,
  target_device TEXT,
  status TEXT NOT NULL,           -- success/failed
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  duration_ms INTEGER             -- 耗时(毫秒)
);
```

### 6.2 恢复流程

应用启动时：
1. 读取 `sync_tasks` 表中所有 `pending` 和 `failed` 任务
2. 重新加入同步队列
3. 对失败任务计算是否需要重试
4. 触发一次完整同步

---

## 七、设备发现机制

### 7.1 手动添加

用户可手动输入：
- IP 地址（如 192.168.1.100）
- 端口号（默认：灵感调酒师 3002，写作教练 3003）
- 类型标签

### 7.2 自动发现（待完善）

**方法**：
- 端口扫描（扫描 3001-3010 端口）
- 尝试访问 `/api/info` 端点
- 解析返回的设备类型信息

**局限性**：
- 不同子网可能无法扫描
- 需要对方应用已启动
- 可能被防火墙拦截

---

## 八、配置选项

```typescript
interface SyncConfig {
  enabled: boolean;              // 是否启用同步
  autoSync: boolean;             // 是否自动同步
  syncInterval: number;          // 自动同步间隔（分钟）
  deviceName: string;            // 本机设备名称
  port: number;                  // 本机HTTP服务端口
}
```

**默认值**：
```typescript
DEFAULT_CONFIG = {
  enabled: true,
  autoSync: true,
  syncInterval: 5,               // 5分钟
  deviceName: '灵感调酒师',
  port: 3002
}
```

---

## 九、错误处理策略

### 9.1 常见错误场景

| 错误 | 原因 | 处理方式 |
|------|------|----------|
| 连接超时 | 目标设备离线 | 加入重试队列 |
| 连接拒绝 | 目标服务未启动 | 加入重试队列 |
| HTTP 400 | 请求格式错误 | 记录错误，不再重试 |
| HTTP 500 | 服务器内部错误 | 加入重试队列 |
| 数据冲突 | 已存在更新版本 | 记录日志，跳过 |

### 9.2 用户通知

- 同步失败时不打扰用户（后台静默处理）
- 可在设置页面查看同步状态
- 超过最大重试次数的任务需要用户确认

---

## 十、验收标准

### 10.1 功能验收

| 测试项 | 通过标准 | 验证方式 |
|--------|----------|----------|
| 接收灵感 | 可从桌面宠物接收灵感数据 | 集成测试 |
| 发送灵感 | 可向写作教练推送灵感 | 集成测试 |
| 任务队列 | 正确管理同步任务状态 | 单元测试 |
| 自动重试 | 失败任务自动重试 | 集成测试 |
| 状态持久化 | 重启后恢复未完成任务 | 集成测试 |
| 设备管理 | 正确维护设备列表 | 手动测试 |

### 10.2 代码验收

| 测试项 | 通过标准 | 验证方式 |
|--------|----------|----------|
| 类型安全 | TypeScript 无错误 | `npm run ts:check` |
| 异常处理 | 所有异步操作有catch | 代码审查 |
| 日志记录 | 关键操作有日志输出 | 代码审查 |

---

## 十一、参考信息

### 11.1 相关文件

- 类型定义：[src/services/sync/types.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/sync/types.ts)
- 同步管理器：[src/services/sync/syncManager.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/sync/syncManager.ts)
- 重试管理器：[src/services/sync/retryManager.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/sync/retryManager.ts)
- 状态存储：[src/services/sync/stateStore.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/sync/stateStore.ts)
- 设备发现：[src/services/sync/discovery.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/sync/discovery.ts)
- HTTP服务：[src/services/sync/server.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/sync/server.ts)

### 11.2 技术参考

- Fetch API：https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- Expo SQLite：https://docs.expo.dev/versions/latest/sdk/sqlite
- Bonjour/mDNS：零配置网络发现协议

---

**文档版本**：v1.0
**创建日期**：2026-06-16
**最后更新**：2026-06-16
