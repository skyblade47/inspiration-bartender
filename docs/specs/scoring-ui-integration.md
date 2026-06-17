# 灵感调酒师 - 评分算法优化 Phase 3：UI集成设计

> 版本：v1.0
> 日期：2026-06-16
> 状态：设计阶段完成，待用户确认
> 适用：评分系统UI集成

---

## 一、UI布局设计

### 1.1 整体布局结构

```
DetailScreen
├── GlassSection（现有）
│   ├── Glass 组件
│   └── 完成度文本
├── Divider
├── BasicInfoSection（现有）
│   ├── 标题
│   ├── 类型标签
│   └── 日期
├── Divider
├── 📦 ScoringSection（新增）
│   ├── ScoreHeader（总分 + 状态）
│   ├── RadarChart（雷达图）
│   ├── DeepAnalysisButton（深度分析按钮）
│   └── ScoreSourceBadge（来源标识）
├── Divider
├── 📦 CommentSection（新增，LLM评分后显示）
│   ├── LLM评语文本
│   └── 改进建议列表
├── Divider
├── ContentSection（现有）
│   └── 灵感内容文本
├── Divider
└── ButtonsContainer（现有）
    ├── 返回按钮
    └── 删除按钮
```

### 1.2 评分区域详细布局

```
┌─────────────────────────────────────┐
│  评分: 72 分          [深度分析 ▶]   │
│  状态: 含苞待放        来源: 本地    │
├─────────────────────────────────────┤
│                                     │
│          雷达图（四维）              │
│                                     │
│      清晰度(25%)    丰富度(30%)     │
│         68             75           │
│                                     │
│      可行性(25%)    独特性(20%)     │
│         70             80           │
│                                     │
└─────────────────────────────────────┘
```

### 1.3 LLM评语区域布局

```
┌─────────────────────────────────────┐
│  🤖 AI 分析评语                     │
├─────────────────────────────────────┤
│  "这是一个具有创新性的想法，核心    │
│   概念清晰，但实施细节需要进一步    │
│   完善..."                          │
├─────────────────────────────────────┤
│  📋 改进建议                        │
│  • 建议添加具体的实施步骤           │
│  • 可以考虑与其他灵感进行碰撞       │
│  • 增加更多视觉素材丰富内容         │
└─────────────────────────────────────┘
```

---

## 二、组件结构

### 2.1 新增组件清单

| 组件名 | 路径 | 职责 |
|--------|------|------|
| `ScoringSection` | `src/components/ScoringSection/index.tsx` | 评分区域容器 |
| `RadarChart` | `src/components/RadarChart/index.tsx` | 四维雷达图 |
| `DeepAnalysisButton` | `src/components/DeepAnalysisButton/index.tsx` | 深度分析按钮 |
| `ScoreSourceBadge` | `src/components/ScoreSourceBadge/index.tsx` | 来源徽章 |
| `CommentSection` | `src/components/CommentSection/index.tsx` | LLM评语展示 |

### 2.2 组件Props定义

```typescript
// ScoringSection
interface ScoringSectionProps {
  inspiration: Inspiration;
  scoringResult: ScoringResult | DeepScoringResult | null;
  onDeepScore: () => Promise<void>;
  isAnalyzing: boolean;
}

// RadarChart
interface RadarChartProps {
  dimensionScores: DimensionScore[];
  size?: number;
  showLabels?: boolean;
}

// DeepAnalysisButton
interface DeepAnalysisButtonProps {
  onPress: () => Promise<void>;
  isLoading: boolean;
  hasAnalyzed: boolean;
  disabled?: boolean;
}

// ScoreSourceBadge
interface ScoreSourceBadgeProps {
  source: 'local' | 'llm' | 'hybrid';
}

// CommentSection
interface CommentSectionProps {
  llmComment: string;
  llmSuggestions: string[];
}
```

---

## 三、交互流程

### 3.1 页面加载流程

```
用户进入详情页 → 获取灵感数据 → 调用 quickScore() → 显示评分区域
```

### 3.2 深度分析流程

```
用户点击"深度分析" → 显示加载状态 → 调用 deepScore() → 成功：更新评分/失败：显示错误
```

### 3.3 按钮状态定义

| 状态 | 显示文本 | 可点击 | 样式 |
|------|---------|--------|------|
| 初始 | "深度分析" | ✅ | contained, primary |
| 加载中 | "分析中..." | ❌ | disabled |
| 已完成 | "已分析" | ✅ | outlined, success |
| 错误 | "重试分析" | ✅ | contained, error |

---

## 四、文件结构

### 4.1 需修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/screens/DetailScreen/index.tsx` | 集成评分区域、添加状态管理 |

### 4.2 需新增文件

```
src/components/
├── ScoringSection/
│   ├── index.tsx
│   └── styles.ts
├── RadarChart/
│   ├── index.tsx
│   └── styles.ts
├── DeepAnalysisButton/
│   └── index.tsx
├── ScoreSourceBadge/
│   └── index.tsx
└── CommentSection/
    ├── index.tsx
    └── SuggestionItem.tsx
```

### 4.3 依赖安装

```bash
npx expo install react-native-svg
```

---

## 五、实现步骤（按优先级）

### Phase 3.1：基础评分展示（高优先级）

1. 创建 `ScoringSection` 组件
2. 创建 `ScoreSourceBadge` 组件
3. 修改 `DetailScreen` 集成评分区域

### Phase 3.2：雷达图可视化（高优先级）

4. 安装 `react-native-svg`
5. 创建 `RadarChart` 组件
6. 集成到 `ScoringSection`

### Phase 3.3：深度分析功能（中优先级）

7. 创建 `DeepAnalysisButton` 组件
8. 实现深度分析流程

### Phase 3.4：评语展示（中优先级）

9. 创建 `CommentSection` 组件
10. 集成到 `DetailScreen`

---

## 六、验收标准

| 测试项 | 通过标准 |
|--------|----------|
| 本地评分显示 | 正确显示总分和雷达图 |
| 深度分析按钮 | 状态切换正确 |
| LLM评分更新 | 成功后数据刷新 |
| 评语展示 | 仅LLM评分后显示 |
| 错误处理 | 失败时显示友好提示 |

---

**文档版本**：v1.0
**创建日期**：2026-06-16
**状态**：待用户确认后进入修改阶段