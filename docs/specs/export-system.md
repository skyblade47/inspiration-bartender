# 设计文档 - 灵感导出/导入系统

> 版本：v1.0  
> 创建日期：2026-06-16  
> 状态：待用户确认  
> 关联原则：原则一（设计方案 + Ponytail）、原则四（可复用代码库）

---

## 1. 功能概述

为灵感调酒师添加手动导出和导入功能，支持将灵感数据导出为 JSON 文件，以及从 JSON 文件恢复数据。

**为什么需要这个功能**：
- 在同步系统不稳定时提供数据备份方案
- 用户可将灵感数据导出到其他设备或云存储
- 支持灵感数据的迁移和备份

---

## 2. 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/services/export.ts` | 新增 | 导出/导入服务核心逻辑 |
| `src/screens/ExportScreen/index.tsx` | 新增 | 导出/导入界面 |
| `src/components/ui/ExportCard.tsx` | 新增 | 导出选项卡片组件 |
| `src/types/index.ts` | 修改 | 添加导出相关类型 |
| `docs/specs/export-system.md` | 新增 | 本设计文档 |

---

## 3. 类型/数据模型

```typescript
// 导出数据格式版本
export const EXPORT_VERSION = '1.0';

// 导出文件元数据
export interface ExportMetadata {
  version: string;           // 导出格式版本
  appName: string;           // 应用名称
  exportTime: string;        // ISO 时间戳
  inspirationCount: number;   // 导出灵感数量
  deviceInfo?: string;       // 设备信息（可选）
}

// 完整导出数据
export interface ExportData {
  metadata: ExportMetadata;
  inspirations: Inspiration[];  // 灵感列表
}

// 导出选项
export interface ExportOptions {
  format: 'json' | 'json-pretty';  // JSON 格式
  includeHistory: boolean;         // 包含历史记录
  compression: boolean;           // 是否压缩（未来扩展）
}

// 导入结果
export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
}
```

---

## 4. 组件树 / 数据流

```
ExportScreen (导出/导入界面)
├── ExportCard (导出选项卡片)
├── ImportCard (导入选项卡片)
└── HistoryList (导入历史记录)

ExportService (服务层)
├── exportInspirations()     导出所有灵感
├── exportInspirationById()  导出单个灵感
├── importInspirations()     导入灵感
└── validateExportData()     验证导入数据
```

---

## 5. 核心逻辑说明

### 5.1 导出流程（Android 移动端）

```
用户点击导出
    ↓
显示导出选项（全部/单个/选择）
    ↓
收集灵感数据（从 SQLite）
    ↓
构建 ExportData 结构
    ↓
转换为 JSON 字符串
    ↓
生成文件名：inspiration_export_YYYYMMDD_HHMMSS.json
    ↓
保存到应用缓存目录（cacheDirectory）
    ↓
调用系统分享菜单（Sharing.shareAsync）
    ↓
用户选择：保存到云盘 / 发送到微信 / 保存到 Downloads 等
    ↓
显示成功提示
```

**说明**：
- Android 应用无法直接写入用户可访问的公共目录
- 使用 `expo-sharing` 调用系统分享，用户可选择保存方式
- 用户可通过分享菜单将文件保存到 Downloads、云存储、或发送到其他应用

### 5.2 导入流程

```
用户选择导入文件
    ↓
读取 JSON 文件
    ↓
验证格式和数据完整性
    ↓
检查版本兼容性
    ↓
逐条导入（跳过已存在的 ID）
    ↓
显示导入结果统计
```

### 5.3 数据完整性保证

- **版本控制**：每份导出文件包含版本号，支持未来格式迁移
- **元数据**：记录导出时间、数量，便于追溯
- **增量导入**：已存在的灵感不会被覆盖，只跳过
- **格式验证**：导入前验证 JSON 结构，不合法文件给出明确错误

---

## 6. 边界情况处理

| 情况 | 处理方式 |
|------|---------|
| 空数据库导出 | 提示"暂无灵感可导出" |
| 导入文件格式错误 | 显示具体错误位置和原因 |
| 导入文件版本过旧 | 提示并尝试兼容转换 |
| 导入文件版本更新 | 提示"请更新应用版本" |
| 磁盘空间不足 | 提示"存储空间不足" |
| 文件权限被拒绝 | 提示"无法访问存储，请检查权限" |

---

## 7. UI 设计

### 7.1 导出屏幕布局

```
┌────────────────────────────────┐
│  ← 数据管理                    │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────────┐ │
│  │  📤 导出灵感              │ │
│  │  将灵感保存为 JSON 文件   │ │
│  │                           │ │
│  │  [导出全部] [导出单个]    │ │
│  └──────────────────────────┘ │
│                                │
│  ┌──────────────────────────┐ │
│  │  📥 导入灵感              │ │
│  │  从 JSON 文件恢复灵感     │ │
│  │                           │ │
│  │  [选择文件]              │ │
│  └──────────────────────────┘ │
│                                │
│  ┌──────────────────────────┐ │
│  │  📋 最近导出记录          │ │
│  │  inspiration_export_... │ │
│  └──────────────────────────┘ │
│                                │
└────────────────────────────────┘
```

### 7.2 Expo API 选择（Android 移动端）

| 功能 | API | 说明 |
|------|-----|------|
| 临时存储 | `FileSystem.cacheDirectory` | 应用缓存目录，用于生成临时文件 |
| 分享文件 | `expo-sharing.shareAsync()` | 调用系统分享菜单，用户选择保存方式 |
| 选择文件 | `expo-document-picker` | 选择要导入的 JSON 文件 |
| 文件操作 | `FileSystem.writeAsStringAsync()` | 写入 JSON 字符串 |

**导出用户体验**：
```
点击导出 → 系统分享菜单弹出 → 用户选择：
  - 保存到 Google Drive / 百度网盘 / 微云
  - 发送到微信 / QQ / 邮件
  - 保存到本地 Downloads（部分 Android 版本支持）
```

---

## 8. 验收标准

- [ ] `npx tsc --noEmit` 通过（0 错误）
- [ ] 可以导出全部灵感为 JSON 文件
- [ ] 可以导出单个灵感
- [ ] 可以从 JSON 文件导入灵感
- [ ] 已存在的灵感不会被覆盖
- [ ] 导出文件格式正确，可被其他应用读取
- [ ] 错误提示清晰友好
- [ ] 符合 CODE_STANDARDS.md 规范

---

## 9. 风险评估

| 风险 | 等级 | 说明 |
|------|------|------|
| 文件权限问题 | 中 | 部分 Android 版本需要额外权限申请 |
| 大数据量导出 | 低 | SQLite 查询性能良好，单次导出应<1秒 |
| 格式版本不兼容 | 中 | 设计版本字段便于未来扩展 |

---

## 10. 技术约束（Ponytail 精简）

- **不引入新依赖**：使用 Expo 内置 API（FileSystem、DocumentPicker、Sharing）
- **不复用现有 store**：直接调用 database.ts 服务层
- **不设计压缩格式**：v1.0 只支持 JSON 明文
- **不设计增量同步**：仅支持全量导出/导入
