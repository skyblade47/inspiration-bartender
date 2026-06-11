# 灵感调酒师 - 项目代码规范

> 版本：v1.0 | 日期：2026-06-08  
> 状态：正式版  
> 继承自：AI写作教练代码规范

---

## 一、文档目的

本文档为灵感调酒师项目制定统一的代码规范，确保：
1. 代码风格一致性
2. 文件组织规范化
3. 质量检查标准化
4. 代码编写规则明确

**所有开发人员必须严格遵守本文档的所有规定。**

---

## 二、文件组织结构

### 2.1 整体目录结构

```
inspiration-bartender/
├── src/
│   ├── components/              # 通用组件
│   │   ├── Glass/               # 灵感杯子组件
│   │   │   └── index.tsx       # 玻璃杯组件（液体动画）
│   │   └── ...
│   │
│   ├── screens/                 # 页面组件
│   │   ├── BarScreen/          # 吧台场景
│   │   │   └── index.tsx       # 主界面
│   │   ├── CaptureScreen/       # 灵感捕获
│   │   │   └── index.tsx       # 创建新灵感
│   │   ├── DetailScreen/        # 灵感详情
│   │   │   └── index.tsx       # 查看/编辑灵感
│   │   ├── BrewingScreen/       # 调酒工作台
│   │   │   └── index.tsx       # AI 补全对话
│   │   ├── CollisionScreen/    # 灵感碰撞
│   │   │   └── index.tsx       # 混合灵感
│   │   └── SettingsScreen/     # 设置页面
│   │       └── index.tsx
│   │
│   ├── services/               # 业务服务层
│   │   ├── database.ts         # SQLite 数据库
│   │   ├── sync/              # 同步模块
│   │   │   ├── index.ts        # 入口
│   │   │   ├── types.ts        # 类型定义
│   │   │   ├── discovery.ts     # 设备发现
│   │   │   ├── server.ts        # HTTP 服务器
│   │   │   ├── protocol.ts      # 协议处理
│   │   │   └── syncManager.ts   # 同步管理器
│   │   └── sound.ts            # 音效管理
│   │
│   ├── store/                  # Zustand 状态管理
│   │   ├── inspirationStore.ts # 灵感状态
│   │   └── settingsStore.ts     # 设置状态
│   │
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts            # 全局类型
│   │
│   ├── constants/              # 常量配置
│   │   ├── theme.ts            # 主题配色
│   │   └── glassTypes.ts       # 杯子类型配置
│   │
│   └── App.tsx                 # 应用入口
│
├── assets/                      # 静态资源
│   ├── images/                 # 图片
│   ├── animations/             # Lottie 动画
│   └── sounds/                 # ASMR 音效
│
├── docs/                        # 设计文档
├── package.json
├── tsconfig.json
├── app.json
└── ...
```

### 2.2 文件命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| **组件文件** | PascalCase + `.tsx` | `BarScreen.tsx` |
| **屏幕文件** | PascalCase + `Screen` + `/index.tsx` | `CaptureScreen/index.tsx` |
| **工具/服务文件** | kebab-case + `.ts` | `sync-manager.ts` |
| **Store 文件** | PascalCase + `Store` + `.ts` | `inspirationStore.ts` |
| **类型文件** | PascalCase + `.ts` | `editor.ts` |
| **同步模块** | kebab-case | `sync-manager.ts` |

---

## 三、代码风格规范

### 3.1 TypeScript 类型定义

#### 3.1.1 类型定义位置

**规则：类型定义应在使用处最近的文件顶部声明**

```typescript
// ✅ 正确：在使用组件的同一文件顶部定义
import React from 'react'
import type { Inspiration, GlassType } from '../../types'

interface CaptureScreenProps {
  onSave: (inspiration: Inspiration) => void
  onCancel: () => void
}

export const CaptureScreen: React.FC<CaptureScreenProps> = ({
  onSave,
  onCancel,
}) => {
  // 组件实现...
}
```

#### 3.1.2 类型定义原则

| 原则 | 说明 |
|------|------|
| **就近定义** | 类型应在使用它的最小范围内定义 |
| **接口优于类型别名** | 优先使用 `interface` |
| **避免 any** | 尽可能使用 `unknown` 或具体类型 |
| **导出原则** | 仅导出必要的类型，隐藏内部类型 |

### 3.2 React Native 组件规范

#### 3.2.1 组件定义模式

**规则：使用函数组件 + 命名导出**

```typescript
// ✅ 正确：命名导出函数组件
export const BarScreen: React.FC = () => {
  return <View>...</View>
}

// ✅ 正确：带 Props 接口的命名导出
interface GlassProps {
  type: GlassType
  completion: number
  onPress?: () => void
}

export const Glass: React.FC<GlassProps> = ({
  type,
  completion,
  onPress,
}) => {
  return <View>...</View>
}

// ❌ 错误：default 导出
const MyComponent: React.FC = () => { ... }
export default MyComponent
```

#### 3.2.2 组件内部结构规范

```typescript
export const ExampleComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // ============================================================
  // 1. Hooks 声明区
  // ============================================================
  const [localState, setLocalState] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Zustand store selectors
  const inspirations = useInspirationStore((s) => s.inspirations)
  
  // ============================================================
  // 2. useMemo - 计算属性（可选）
  // ============================================================
  const sortedInspirations = useMemo(() => {
    return inspirations.sort((a, b) => b.completion - a.completion)
  }, [inspirations])
  
  // ============================================================
  // 3. useCallback - 事件处理函数
  // ============================================================
  const handlePress = useCallback((id: string) => {
    onInspirationPress?.(id)
  }, [onInspirationPress])
  
  // ============================================================
  // 4. useEffect - 副作用处理
  // ============================================================
  useEffect(() => {
    loadInspirations()
  }, [])
  
  // ============================================================
  // 5. 渲染逻辑
  // ============================================================
  return (
    <View style={styles.container}>
      {sortedInspirations.map(inspiration => (
        <Glass
          key={inspiration.id}
          type={inspiration.type}
          completion={inspiration.completion}
          onPress={() => handlePress(inspiration.id)}
        />
      ))}
    </View>
  )
}
```

#### 3.2.3 组件命名规范

| 元素 | 命名规范 | 示例 |
|------|----------|------|
| 组件文件 | PascalCase + `.tsx` | `BarScreen.tsx` |
| Props 接口 | PascalCase + Props | `BarScreenProps` |
| 回调属性 | `on` + PascalCase | `onInspirationPress` |
| 状态属性 | `is`/`has`/`should` + PascalCase | `isLoading` |
| 处理函数 | `handle` + PascalCase | `handlePress` |

### 3.3 Zustand Store 规范

#### 3.3.1 Store 文件结构

```typescript
// ============================================================
// 1. 导入区
// ============================================================
import { create } from 'zustand'
import type { Inspiration } from '../types'
import * as db from '../services/database'

// ============================================================
// 2. 类型定义区 - State 和 Actions 接口
// ============================================================
interface InspirationStore {
  // State
  inspirations: Inspiration[]
  isLoading: boolean
  error: string | null
  
  // Actions
  loadInspirations: () => Promise<void>
  addInspiration: (data: Partial<Inspiration>) => Promise<string>
  updateInspiration: (id: string, data: Partial<Inspiration>) => Promise<void>
  deleteInspiration: (id: string) => Promise<void>
  getInspiration: (id: string) => Inspiration | undefined
  clearError: () => void
}

// ============================================================
// 3. Store 实现
// ============================================================
export const useInspirationStore = create<InspirationStore>((set, get) => ({
  // State 默认值
  inspirations: [],
  isLoading: false,
  error: null,
  
  // Actions 实现
  loadInspirations: async () => {
    set({ isLoading: true, error: null })
    try {
      const data = await db.getAllInspirations()
      set({ inspirations: data, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },
  
  addInspiration: async (data) => {
    const id = await db.createInspiration(data)
    await get().loadInspirations()
    return id
  },
  
  updateInspiration: async (id, data) => {
    await db.updateInspiration(id, data)
    await get().loadInspirations()
  },
  
  deleteInspiration: async (id) => {
    await db.deleteInspiration(id)
    await get().loadInspirations()
  },
  
  getInspiration: (id) => {
    return get().inspirations.find(i => i.id === id)
  },
  
  clearError: () => set({ error: null }),
}))
```

### 3.4 日志记录规范

| 场景 | 日志级别 | 示例 |
|------|----------|------|
| 应用启动 | `console.log` | `console.log('[InspirationBartender] App started')` |
| 数据库操作 | `console.log` | `console.log('[Database] Inspiration created')` |
| 同步状态 | `console.log` | `console.log('[Sync] Synced 5 inspirations')` |
| 错误 | `console.error` | `console.error('[Error]', error)` |

---

## 四、质量检查要求

### 4.1 形式检查（自动化）

#### 4.1.1 TypeScript 类型检查

**命令：** `npm run ts:check`

**要求：** 必须通过，0 错误

```bash
npm run ts:check
# 必须输出无错误
```

#### 4.1.2 构建检查

**命令：** `npx expo prebuild` 或 `npm run build`

**要求：** 必须成功构建

---

## 五、代码编写规则

### 5.1 基本规则

**规则 1：默认情况下，所有回复和注释都必须使用中文**

```typescript
// ✅ 正确：中文注释
/**
 * 玻璃杯组件 - 展示灵感杯子及其液体填充动画
 * 支持多种杯子类型和完成度可视化
 */

// ❌ 错误：英文注释
/**
 * Glass component - displays inspiration glass with liquid animation
 */
```

**规则 2：复杂需求拆解成小任务，分步实现**

```
任务拆解原则：
1. 每个任务应该能在 2 小时内完成
2. 任务之间应该有明确的依赖关系
3. 每个任务完成后应该能独立测试
```

**规则 3：代码实现前后要仔细检查，确保类型定义完整**

```typescript
// ✅ 正确：完整的 Props 定义
interface GlassProps {
  /** 杯子类型 */
  type: GlassType
  /** 完成度 0-100 */
  completion: number
  /** 尺寸大小 */
  size?: 'small' | 'medium' | 'large'
  /** 点击回调 */
  onPress?: () => void
  /** 长按回调 */
  onLongPress?: () => void
}

// ❌ 错误：Props 定义不完整
interface GlassProps {
  type: GlassType
  completion: number
}
```

**规则 4：遵循项目架构设计，保持代码风格一致**

**规则 5：组件设计遵循单一职责原则**

```typescript
// ✅ 正确：单一职责
export const CaptureScreen: React.FC<Props> = ({ onSave }) => {
  // 只负责捕获新灵感
}

// ❌ 错误：职责混合
export const CaptureScreen: React.FC<Props> = ({ onSave }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  // 混入了分析逻辑
}
```

**规则 6：确保代码可读性，复杂逻辑添加注释**

```typescript
// ✅ 正确：复杂逻辑添加注释
/**
 * 根据完成度计算液体颜色透明度
 * 原理：完成度越高，液体越饱满，颜色越深
 */
const getLiquidOpacity = (completion: number): number => {
  return 0.3 + (completion / 100) * 0.7
}
```

**规则 7：如有疑问，先询问再修改**

---

## 六、Git 提交规范

### 6.1 提交信息格式

```
<类型>: <简短描述>

[可选的详细描述]
```

### 6.2 提交类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加灵感捕获功能` |
| `fix` | Bug 修复 | `fix: 修复液体动画卡顿` |
| `docs` | 文档更新 | `docs: 更新 README` |
| `style` | 代码格式 | `style: 格式化代码` |
| `refactor` | 代码重构 | `refactor: 简化同步逻辑` |
| `chore` | 构建/工具 | `chore: 添加 expo-av 依赖` |

### 6.3 提交示例

```bash
# 正确示例
git commit -m "feat: 添加吧台场景主界面"
git commit -m "feat: 实现玻璃杯液体动画"
git commit -m "fix: 修复同步超时问题"
git commit -m "docs: 添加架构文档"

# 详细示例
git commit -m "feat: 添加灵感同步系统

- 实现设备发现模块
- 实现 HTTP 服务器接收端
- 集成到应用入口"
```

---

## 七、同步模块规范

### 7.1 同步架构

```
桌面宠物 → 灵感调酒师 → AI写作教练
(端口3001)   (端口3002)      (端口3003)
```

### 7.2 同步模块文件结构

```typescript
// src/services/sync/types.ts - 类型定义
export interface SyncInspiration {
  id: string
  content: string
  tags: string[]
  source: 'desktop-pet' | 'inspiration-bartender'
  syncStatus: 'local' | 'pending' | 'synced'
  // ...
}

// src/services/sync/discovery.ts - 设备发现
export class DeviceDiscovery {
  async start(port: number): Promise<void>
  stop(): void
  getDevices(type?: string): SyncDevice[]
}

// src/services/sync/server.ts - HTTP 服务器
export class SyncServer {
  async start(port: number): Promise<void>
  async stop(): Promise<void>
}

// src/services/sync/syncManager.ts - 同步管理器
export class SyncManager {
  static getInstance(): SyncManager
  init(config?: SyncConfig): Promise<void>
  addDevice(ip: string, port: number, type: string): void
  sendInspiration(inspiration: Inspiration): Promise<boolean>
}
```

### 7.3 日志标签

| 模块 | 日志标签 | 示例 |
|------|----------|------|
| 设备发现 | `[Discovery]` | `console.log('[Discovery] Device found')` |
| 同步服务器 | `[SyncServer]` | `console.log('[SyncServer] Started on port 3002')` |
| 同步管理器 | `[SyncManager]` | `console.log('[SyncManager] Initialized')` |
| 应用入口 | `[App]` | `console.log('[App] InspirationBartender started')` |

---

## 八、灵感完整度规范

### 8.1 完成度状态

| 状态 | 完成度 | 液体高度 | 状态标签 |
|------|--------|---------|---------|
| 种子 | 0% | 空杯 | 🌱 |
| 萌芽 | 25% | 1/4 | 💧 |
| 生长 | 50% | 1/2 | 🌿 |
| 含苞 | 75% | 3/4 | 🌸 |
| 绽放 | 100% | 满杯 | ✨ |

### 8.2 杯子类型对应灵感类型

| 杯子类型 | 灵感类型 | 液体颜色 |
|----------|---------|---------|
| 白兰地杯 | 绘画/视觉 | 钴蓝色 |
| 香槟杯 | 音乐/声音 | 淡紫色 |
| 红酒杯 | 文学/文字 | 深红色 |
| 古典杯 | 工作/商业 | 琥珀色 |
| 烧杯 | 程序/技术 | 荧光绿 |
| 梅森罐 | 生活/日常 | 暖橙色 |
| 锥形瓶 | 科学/研究 | 透明微蓝 |
| 马天尼杯 | 跨界/混合 | 混合色 |

---

## 九、附录

### 9.1 常用命令

| 命令 | 说明 |
|------|------|
| `npm start` | 启动开发服务器 |
| `npx expo prebuild` | 生成原生项目 |
| `npm run ts:check` | TypeScript 类型检查 |
| `npm install` | 安装依赖 |

### 9.2 相关文档

- [docs/superpowers/plans/](./docs/superpowers/plans/) - 实现计划文档
- [README.md](./README.md) - 项目说明

---

**文档版本历史：**

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| v1.0 | 2026-06-08 | 初始版本，统一灵感调酒师项目代码规范 |

**维护责任：** 所有开发人员都有责任遵守和维护本文档。
