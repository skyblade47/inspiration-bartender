# 灵感调酒师 - 碰撞系统设计规范

> 版本：v1.0
> 日期：2026-06-16
> 状态：已实现
> 适用：灵感调酒师项目的灵感碰撞功能

---

## 一、模块概述

### 1.1 功能定位
灵感碰撞系统允许用户将多个灵感（2-3个）组合在一起，通过创意混合产生新的灵感想法：
- 选择多个灵感进行"碰撞"
- 生成富有创意的配方建议
- 提供摇晃动画和视觉效果
- 支持分层和混色两种碰撞模式

### 1.2 文件结构

```
src/services/collision/
├── utils.ts         # 工具函数（颜色混合、关键词提取）
├── mixer.ts         # 灵感混合器（内容组合逻辑）
├── generator.ts      # 配方生成器（LLM调用）
├── history.ts        # 碰撞历史管理
└── index.ts         # 导出入口

src/screens/CollisionScreen/
├── index.tsx        # 碰撞主界面
├── ShakeAnimation.tsx  # 摇晃动画组件
└── RecipeCard.tsx    # 配方卡片组件
```

---

## 二、核心概念

### 2.1 碰撞类型

```typescript
export enum MixType {
  LAYER = 'layer',     // 分层：保持各灵感独立性，按顺序叠加
  BLEND = 'blend',     // 混色：完全融合各灵感元素
}
```

| 类型 | 视觉效果 | 适用场景 |
|------|---------|---------|
| LAYER（分层） | 颜色分层堆叠 | 各灵感主题差异较大 |
| BLEND（混色） | 颜色均匀混合 | 灵感主题有相关性 |

### 2.2 碰撞数据结构

```typescript
// 碰撞记录
interface CollisionRecord {
  id: string;                       // 碰撞ID
  sourceInspirationIds: string[];    // 源灵感ID列表（2-3个）
  resultInspirationId?: string;     // 生成的新灵感ID
  
  // 碰撞过程信息
  mixType: MixType;                 // 混合类型
  mixColors: string[];              // 各灵感的颜色
  mixColorNames: string[];          // 颜色名称
  
  // 配方建议
  recipes: Recipe[];                // 生成的配方列表
  selectedRecipe?: Recipe;          // 用户选择的配方
  
  createdAt: number;                // 创建时间戳
}

// 配方建议
interface Recipe {
  id: string;
  title: string;                    // 方案标题
  description: string;             // 详细描述(100-200字)
  keywords: string[];              // 关键词(3-5个)
  directions: string[];            // 发展方向(2-3个)
  score: number;                   // 创意评分(0-100)
}

// 混合结果（中间产物）
interface MixedResult {
  mixedColor: string;              // 混合后的颜色
  mixType: MixType;                // 混合类型
  keywords: string[];              // 提取的关键词
  moods: string[];                 // 氛围/情绪标签
  combinedContent: string;         // 组合后的内容文本
}
```

---

## 三、碰撞流程

### 3.1 完整流程

```
选择灵感(2-3个) → 选择混合类型 → 开始碰撞
    ↓
摇晃动画（倒入→摇晃→倒出）→ 生成配方
    ↓
显示配方卡片 → 用户选择 → 创建新灵感（可选）
```

### 3.2 各阶段详细说明

**阶段1：选择灵感**
- 用户从吧台选择 2-3 个灵感
- 每个灵感显示简要预览
- 提供清空和确认按钮

**阶段2：选择混合类型**
- LAYER（分层）：视觉上有层次
- BLEND（混色）：完全融合
- 默认选择混色模式

**阶段3：摇晃动画**
- 倒入：各灵感液体倒入杯子
- 摇晃：模拟摇晃动作（旋转动画）
- 倒出：倒出到新杯子

**阶段4：生成配方**
- 调用 LLM 生成创意配方
- 生成 3-5 个配方建议
- 每个配方有标题、描述、关键词、方向、评分

**阶段5：用户确认**
- 显示所有配方卡片
- 用户可选择一个配方创建新灵感
- 用户可换一批重新生成
- 用户可关闭放弃创建

---

## 四、颜色混合算法

### 4.1 输入颜色

从各灵感的杯子类型获取液体颜色：
```typescript
// 每个灵感的主色
const colors = [
  '#1E3A5F',  // 钴蓝色
  '#9B59B6',  // 淡紫色
  '#D4A017',  // 琥珀色
]
```

### 4.2 混合策略

**分层（LAYER）模式**：
- 不做实际混合
- 按顺序堆叠显示
- 每个灵感保留原始颜色

**混色（BLEND）模式**：
```typescript
// 简单RGB平均混合
function blendColors(colors: string[]): string {
  let r = 0, g = 0, b = 0;
  for (const color of colors) {
    r += parseInt(color.slice(1, 3), 16);
    g += parseInt(color.slice(3, 5), 16);
    b += parseInt(color.slice(5, 7), 16);
  }
  r = Math.round(r / colors.length);
  g = Math.round(g / colors.length);
  b = Math.round(b / colors.length);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
```

---

## 五、配方生成器（LLM）

### 5.1 系统提示词

```text
你是一位创意配方大师，擅长将不同的灵感融合成独特的创意方案。
你的任务是根据给定的灵感混合结果，生成 3-5 个富有创意的配方建议。

每个配方应该：
1. 有独特的名称和描述
2. 包含 3-5 个关键词
3. 提供 2-3 个可能的发展方向
4. 给出 0-100 的创意评分

风格要求：
- 富有想象力和创意性
- 保持开放和包容的态度
- 善于发现意想不到的联系
- 用生动有趣的语言描述

请用中文回复，格式化为清晰的 JSON 数组。
```

### 5.2 用户输入提示词模板

```text
灵感碰撞结果：

混合类型：{mixType}
混合颜色：{mixedColor}
关键词：{keywords.join(', ')}
氛围：{moods.join(', ')}

源灵感：
{inspirations.map(i => `${i.name}: ${i.content}`).join('\n\n')}

请生成创意配方建议。每个配方应该包含：
- title: 方案标题
- description: 详细描述（100-200字）
- keywords: 关键词数组（3-5个）
- directions: 可能的发展方向数组（2-3个）
- score: 创意评分（0-100）

请严格输出有效的 JSON 数组格式，不要包含其他文字。
```

### 5.3 期望输出格式

```json
[
  {
    "title": "数字人文主义",
    "description": "将技术理性与人文关怀有机结合，创造既有深度又有温度的创意方向。通过科技手段提升人文体验，让冰冷的数据拥有人性的光泽。",
    "keywords": ["科技", "人文", "融合", "创新", "平衡"],
    "directions": ["发展AI辅助艺术创作", "探索数字博物馆体验", "构建情感交互界面"],
    "score": 85
  }
]
```

---

## 六、摇晃动画

### 6.1 动画阶段

```typescript
export enum ShakePhase {
  POUR = 'pour',        // 倒入：各灵感依次倒入
  SHAKE = 'shake',      // 摇晃：旋转和震荡
  POUR_OUT = 'pour_out', // 倒出：倒到新杯子
}
```

### 6.2 动画时间线

| 阶段 | 时长 | 效果 |
|------|------|------|
| 倒入 | 1.5s | 液体从顶部流入，逐个倒入 |
| 摇晃 | 2.0s | 杯子左右摇晃，液体旋转混合 |
| 倒出 | 1.0s | 液体从底部流出到新容器 |

### 6.3 动画实现提示

- 使用 React Native Reanimated
- 主要使用：旋转、位移、不透明度动画
- 配合音效（可选）增强沉浸感

---

## 七、UI设计

### 7.1 碰撞主界面（CollisionScreen）

**布局**：
- 顶部：选中的灵感预览（横向滚动）
- 中间：动画区域（大杯子）
- 底部：配方卡片列表（纵向滚动）

**交互**：
- 长按动画区域可重新生成配方
- 点击卡片查看详情
- 点击"创建"按钮生成新灵感

### 7.2 配方卡片

**卡片信息**：
- 标题
- 描述（最多3行，溢出省略）
- 关键词标签（彩色）
- 发展方向列表
- 创意评分（星形或数字）

**卡片操作**：
- 点击选择此配方
- 长按查看完整描述
- 点击"使用此配方"创建灵感

---

## 八、数据流转

### 8.1 碰撞创建流程

```
用户选择灵感 → 生成CollisionRecord
    ↓
混合内容生成MixedResult
    ↓
调用LLM生成配方（generator.generateRecipes）
    ↓
更新Record.recipes
    ↓
显示给用户
    ↓
用户选择配方后创建新灵感（可选）
```

### 8.2 新灵感创建

如果用户选择某个配方，创建新灵感：
- **名称**：配方标题
- **内容**：配方描述
- **关键词**：配方关键词
- **杯子类型**：根据配方氛围选择
- **完成度**：50（中等，需要用户继续完善）
- **碰撞历史**：记录此次碰撞

---

## 九、验收标准

### 9.1 功能验收

| 测试项 | 通过标准 | 验证方式 |
|--------|----------|----------|
| 灵感选择 | 可正确选择2-3个灵感 | 手动测试 |
| 碰撞动画 | 三段动画流畅播放 | 手动测试 |
| 配方生成 | 可生成3-5个配方建议 | 集成测试 |
| 新灵感创建 | 可基于配方创建新灵感 | 手动测试 |
| 碰撞历史 | 记录碰撞操作 | 代码审查 |

### 9.2 代码验收

| 测试项 | 通过标准 | 验证方式 |
|--------|----------|----------|
| 类型安全 | TypeScript 无错误 | `npm run ts:check` |
| LLM集成 | 正确处理响应和错误 | 代码审查 |
| 动画性能 | 动画流畅不卡顿 | 手动测试 |

---

## 十、参考信息

### 10.1 相关文件

- 碰撞服务：[src/services/collision/](file:///d:/OneDrive/项目/inspiration-bartender/src/services/collision/)
- 碰撞界面：[src/screens/CollisionScreen/](file:///d:/OneDrive/项目/inspiration-bartender/src/screens/CollisionScreen/)
- LLM服务：[src/services/llm/](file:///d:/OneDrive/项目/inspiration-bartender/src/services/llm/)
- 类型定义：[src/types/index.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/types/index.ts)

### 10.2 创意参考

- 头脑风暴（Brainstorming）
- 概念组合（Concept Combination）
- 随机输入法（Random Input）
- 六顶思考帽（Six Thinking Hats）

---

**文档版本**：v1.0
**创建日期**：2026-06-16
**最后更新**：2026-06-16
