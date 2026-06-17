# 灵感调酒师 - 文档库索引

> **版本**: v1.2（新增五大原则体系 + 错误库）
> **日期**: 2026-06-16
> **状态**: 已更新
> **维护者**: Main Agent

---

## 项目基本信息

| 项目 | 内容 |
|------|------|
| 项目名称 | 灵感调酒师（Inspiration Bartender） |
| 项目类型 | React Native Expo 移动应用 |
| 开发语言 | TypeScript |
| 状态管理 | Zustand |
| 本地数据 | Expo SQLite |
| 动画库 | React Native Reanimated |
| GitHub 仓库 | https://github.com/skyblade47/inspiration-bartender |
| 最新提交 | `8d22680` feat: 实现同步系统改进 |

---

## 📋 文档库结构（v1.2）

```
docs/
├── index.md                              # 本文件 - 文档库总索引
├── WORK_PRINCIPLES.md                    # 🔑 AI 辅助开发五大核心原则（新增 v1.2）
├── WORKFLOW.md                           # 执行流程管理（已集成原则）
├── CODE_STANDARDS.md                     # 代码标准和规范
├── README.md                             # 项目说明（已有）
│
├── plans/                                # 阶段计划文档
│   ├── Phase1-基础功能.md
│   ├── Phase2-对话补全与评分.md
│   └── Phase3-灵感碰撞.md
│
├── specs/                                # 模块设计规范
│   ├── glass-component.md               # 玻璃杯组件设计规范
│   ├── sync-system.md                   # 同步系统设计规范
│   ├── llm-integration.md               # LLM 集成设计规范
│   ├── scoring-system.md                # 评分系统设计规范
│   └── collision-system.md              # 碰撞系统设计规范
│
├── errors/                               # ❌ 错误历史和解决方案（v1.2 新增）
│   ├── index.md                         # 错误索引总览 + 使用流程
│   ├── ERR-001-TypeScript编译错误.md    # 高 - 类型检查
│   ├── ERR-002-Git推送失败.md           # 高 - Git 工具链
│   ├── ERR-003-useEffect资源泄漏.md     # 中 - 资源管理
│   ├── ERR-004-依赖安装失败.md          # 中 - 构建依赖
│   └── ERR-005-组件命名不统一.md        # 低 - 代码规范
│
├── references/                           # 参考资料（预留）
│   └── ...
│
└── assets/                               # 文档资源
    ├── 提示词生成器.html
    └── demo-screenshot.png
```

---

## 🔑 核心文档优先级

**每次开发任务开始前，必须按此顺序阅读（详见 WORK_PRINCIPLES.md 复检模式）：**

| 优先级 | 文档 | 作用 | 阅读时间 |
|:---:|------|------|:---:|
| ⭐⭐⭐ | [WORK_PRINCIPLES.md](WORK_PRINCIPLES.md) | 五大核心原则 + 所有规范索引 | 5 分钟 |
| ⭐⭐⭐ | [WORKFLOW.md](WORKFLOW.md) | 设计-修改-验收三阶段执行流程 | 3 分钟 |
| ⭐⭐⭐ | [errors/index.md](errors/index.md) | 避免重复踩坑，快速定位历史错误 | 3 分钟 |
| ⭐⭐ | [CODE_STANDARDS.md](CODE_STANDARDS.md) | TypeScript 编码规范、命名约定 | 3 分钟 |
| ⭐⭐ | `specs/*.md` | 当前任务涉及模块的设计规范 | 按需 |

---

## 🔷 五大核心原则速览

```
┌──────────────────────────────────────────────────────────────────┐
│                    AI 辅助开发工作流程                             │
│                                                                  │
│  原则零：功能对齐检查 ─ 所有改动必须符合产品定位                      │
│  原则一：设计方案 + Ponytail ─ 先设计后编码，最少代码                 │
│  原则二：写→审→改→查闭环 ─ Coder + Reviewer 双 Agent              │
│  原则三：错误库建立 ─ 同样错误不犯第二次                            │
│  原则四：可复用代码库 ─ 模式可复用，避免重复造轮子                    │
└──────────────────────────────────────────────────────────────────┘
```

详见 [WORK_PRINCIPLES.md](WORK_PRINCIPLES.md)

---

## 🔄 执行流程（设计-修改-验收）

### 标准开发流程

```
用户需求 → 设计阶段 → [用户确认] → 修改阶段 → [用户确认] → 验收阶段 → [用户确认] → 完成
   ↓           ↓           ↓          ↓           ↓          ↓
 需求确认    创建设计    确认设计    实现代码    确认变更   测试验收
```

### 子 Agent 职责

| Agent 类型 | 职责 | 原则对应 |
|------------|------|---------|
| **设计 Agent** | 分析需求，创建设计文档（`specs/*.md`），确定技术方案 | 原则零 + 原则一 |
| **修改 Agent (Coder)** | 根据设计文档实现代码，运行 `npx tsc --noEmit`，确保边界情况 | 原则二 |
| **验收 Agent (Reviewer)** | 逐条审查代码，只给意见不修改，输出审查报告 | 原则二 |
| **Main Agent** | 协调全流程，更新文档，维护错误库和代码库 | 原则三 + 原则四 |

### 确认流程铁律

> ⚠️ **每个阶段完成后必须等待用户确认，才可进入下一阶段。**

详见 [WORKFLOW.md](WORKFLOW.md)

---

## 📐 模块设计规范

| 模块 | 文档 | 状态 | 关联原则 |
|------|------|:---:|---------|
| 玻璃杯组件 | [specs/glass-component.md](specs/glass-component.md) | ✅ | 原则零（调酒隐喻） |
| 同步系统 | [specs/sync-system.md](specs/sync-system.md) | ✅ | 原则零（单向数据流） |
| LLM 集成 | [specs/llm-integration.md](specs/llm-integration.md) | ✅ | 原则一（二边界情况） |
| 评分系统 | [specs/scoring-system.md](specs/scoring-system.md) | ✅ | 原则一（二边界情况） |
| 碰撞系统 | [specs/collision-system.md](specs/collision-system.md) | ✅ | 原则零（调酒隐喻） |

---

## 📊 阶段计划文档

| 阶段 | 文档 | 状态 |
|------|------|:---:|
| Phase 1 | [plans/Phase1-基础功能.md](plans/Phase1-基础功能.md) | ✅ |
| Phase 2 | [plans/Phase2-对话补全与评分.md](plans/Phase2-对话补全与评分.md) | ✅ |
| Phase 3 | [plans/Phase3-灵感碰撞.md](plans/Phase3-灵感碰撞.md) | ✅ |

---

## ❌ 错误历史（已解决 5 条）

详见 [errors/index.md](errors/index.md)

| 编号 | 错误名称 | 严重程度 | 状态 |
|------|---------|:--------:|:---:|
| ERR-001 | TypeScript 编译失败 | 🟠 高 | ✅ 已解决 |
| ERR-002 | Git push 到远程仓库失败 | 🟠 高 | ✅ 已解决 |
| ERR-003 | useEffect 清理缺失导致资源泄漏 | 🟡 中 | ✅ 已解决 |
| ERR-004 | npm install 依赖安装失败 | 🟡 中 | ✅ 已解决 |
| ERR-005 | 组件命名风格不统一 / 路径混乱 | 🟢 低 | ✅ 已解决 |

---

## 🚀 下一步行动

1. ✅ **文档库初始化** - v1.2 完成
2. ✅ **五大原则体系建立** - WORK_PRINCIPLES.md 完成
3. ✅ **错误历史建立** - 5 条记录完成
4. 🔄 **待启动** - 根据用户需求选择要开发的模块
5. 📋 **待执行** - 按设计-修改-验收流程执行，每个阶段需用户确认

---

## 🔗 关联文档（桌面宠物 / AI 写作教练）

灵感调酒师是数据流中间节点：

```
桌面宠物（Desktop Pet）
    │ 单向同步
    ↓
灵感调酒师（Inspiration Bartender） ← 当前项目
    │ 单向同步
    ↓
AI 写作教练（AI Writing Coach）
```

相关项目文档路径：
- `D:\OneDrive\项目\desktop-pet\docs\`
- `D:\OneDrive\项目\ai-writing-coach\docs\WORK_PRINCIPLES.md`（原则体系来源）

---

**文档版本**: v1.2  
**最后更新**: 2026-06-16  
**维护者**: Main Agent
