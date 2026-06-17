# 设计文档 - LLM 配置与测试系统

> 版本：v1.0  
> 创建日期：2026-06-16  
> 状态：待用户确认  
> 关联原则：原则一（设计方案 + Ponytail）、原则四（可复用代码库）

---

## 1. 功能概述

为灵感调酒师添加 LLM（大型语言模型）配置和测试功能，让用户能够：

- **配置 LLM**：添加/编辑/删除不同提供商的 LLM 配置
- **设置默认**：选择当前使用的 LLM 提供商
- **测试连接**：验证 LLM 配置是否正确
- **查看状态**：显示当前配置的连接状态

**为什么需要这个功能**：
- 当前 Phase 2 和 Phase 3 使用模拟数据
- 需要真实 LLM 接入才能实现 AI 对话和配方生成
- 用户需要能够灵活配置不同的 LLM 提供商

---

## 2. 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/screens/LLMSettingsScreen/index.tsx` | 新增 | LLM 配置与测试主页面 |
| `src/screens/LLMSettingsScreen/ConfigCard.tsx` | 新增 | 配置卡片组件 |
| `src/screens/LLMSettingsScreen/TestDialog.tsx` | 新增 | 测试对话框组件 |
| `src/screens/LLMSettingsScreen/ModelSelector.tsx` | 新增 | 模型选择器组件 |
| `src/types/index.ts` | 修改 | 添加 `LLMSettings` 导航参数 |
| `src/App.tsx` | 修改 | 注册 LLM 配置页面路由 |
| `src/screens/BarScreen/index.tsx` | 修改 | 添加设置入口 |
| `docs/specs/llm-settings.md` | 新增 | 本设计文档 |

---

## 3. 类型/数据模型

复用现有的 `src/services/llm/config.ts` 中的类型。

---

## 4. 验收标准

- [ ] `npx tsc --noEmit` 通过（0 错误）
- [ ] 可以添加/编辑/删除 OpenAI / Anthropic / Ollama 配置
- [ ] 可以测试连接（成功/失败都有反馈）
- [ ] 可以切换默认配置
- [ ] 配置持久化保存

---

## 5. UI 入口

在吧台页面右上角设置按钮下拉菜单中添加"LLM 设置"选项。
