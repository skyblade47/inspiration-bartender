# 灵感调酒师

灵感调酒师是 AI 写作教练的移动端灵感收集应用，以"调酒"为核心隐喻，将灵感的捕获、补全、碰撞转化为诗意的酒吧体验。

## 技术栈

- React Native + TypeScript + Expo
- Zustand 状态管理
- SQLite 本地存储
- React Native Reanimated 动画
- React Navigation 导航

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Expo Go 应用（手机端）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

然后在手机上打开 Expo Go 应用，扫描终端显示的二维码即可预览。

### 平台特定命令

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 项目结构

```
src/
├── assets/          # 静态资源
├── components/      # 通用组件
├── screens/         # 页面组件
├── store/           # 状态管理
├── services/        # 业务服务
├── types/           # TypeScript 类型
├── constants/       # 常量配置
└── App.tsx          # 应用入口
```

## Phase 1 功能

- ✅ 吧台场景 - 灵感杯子展示
- ✅ 灵感捕获 - 创建新灵感
- ✅ 灵感详情 - 查看与删除灵感
- ✅ 本地存储 - SQLite 持久化

## Phase 2 & 3 (待实现)

- 对话补全 - AI 引导完善灵感
- 完整度评分 - 多维度评估
- 灵感碰撞 - 多个灵感混合
- 网络同步 - 与桌面端同步

## 开发规范

- 使用 TypeScript 严格模式
- 遵循组件化开发原则
- 保持代码简洁易读
- 提交代码前运行类型检查

```bash
npm run ts:check
```
