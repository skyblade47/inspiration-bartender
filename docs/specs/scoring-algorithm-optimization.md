# 灵感调酒师 - 评分算法优化设计方案

> 版本：v1.0
> 日期：2026-06-16
> 状态：设计阶段完成，待用户确认
> 适用：评分系统算法优化

---

## 一、问题分析

### 1.1 维度不一致问题

| 系统 | 维度数量 | 维度列表 |
|------|---------|---------|
| 本地评分 | 4维 | 清晰度、丰富度、可行性、独特性 |
| LLM评分 | 5维 | 清晰度、深度、可执行性、创意度、完整度 |

**问题**：两套维度定义无法融合，用户看到的评分结果不一致。

### 1.2 本地评分算法局限

**当前算法**：基于数量计数
- 清晰度：名称 + 文本长度 + 结构化字段数量
- 丰富度：图片数 + 语音 + 链接 + 卡片数 + 日志数
- 可行性：描述长度 + 卡片数 + 碰撞数 + 是否有计划
- 独特性：碰撞数 + 容器类型 + 卡片数 + 输入类型数

**局限**：
1. 仅计算数量，不评估内容质量
2. 评分上限设计不合理（部分维度难以达到100分）
3. 缺乏语义理解（无法判断内容是否真正有价值）

### 1.3 LLM评分未接入

**现状**：
- `ScoringService` 已实现但无调用方
- 缺少触发策略和成本控制
- 用户无法主动请求 LLM 评分

### 1.4 缺乏缓存机制

**问题**：
- 用户频繁修改灵感时重复计算
- 无 LLM 评分结果缓存
- 性能浪费

---

## 二、设计方案

### 2.1 维度统一方案

**决策**：保留四维模型，LLM评分结果转换为统一维度

**维度映射**：
```
LLM维度 → 本地维度
- clarity → 清晰度 (CLARITY)
- depth → 丰富度 (RICHNESS) 的深度因子
- actionability → 可行性 (FEASIBILITY)
- creativity → 独特性 (UNIQUENESS)
- completeness → 丰富度 (RICHNESS) 的完整因子
```

**统一后的四维定义**：

| 维度 | 本地评估指标 | LLM评估重点 |
|------|-------------|-------------|
| 清晰度 | 名称明确度、文本结构、关键概念 | 表达清晰、概念明确、易于理解 |
| 丰富度 | 内容数量、多模态输入、日志记录 | 思考深度、要素完整、层次感 |
| 可行性 | 执行计划、碰撞历史、头脑风暴 | 可转化为行动、有明确下一步 |
| 独特性 | 碰撞次数、容器类型、创新组合 | 新颖想法、独特视角、创新组合 |

### 2.2 使用场景划分

| 场景 | 评分类型 | 触发时机 | 说明 |
|------|---------|---------|------|
| 实时预览 | 本地评分 | 内容变更时 | 快速反馈，无延迟 |
| 保存评估 | 本地评分 | 灵感保存时 | 确定最终状态 |
| 深度分析 | LLM评分 | 用户主动触发 | 提供详细评语和建议 |
| 碰撞后评估 | LLM评分 | 碰撞完成后 | 评估融合结果质量 |

**本地评分优先**：日常使用场景全部使用本地评分，保证响应速度。

**LLM评分补充**：仅在需要深度分析时调用，提供更智能的评估。

### 2.3 本地评分算法优化

#### 清晰度算法优化

```typescript
// 原算法：名称25分 + 文本长度40分 + 结构化35分
// 新算法：
清晰度 = 
  名称质量(30分) +
  文本质量(40分) +
  结构化程度(30分)

名称质量：
- 有明确名称（非"新灵感"）：20分
- 名称长度≥5字符：+5分
- 名称包含关键词（项目/计划/方案等）：+5分

文本质量：
- 基础分：文本长度≥50字符：15分
- 结构分：有分段或列表：+10分
- 关键词分：包含行动词（实现/开发/设计等）：+10分
- 完整分：长度≥100字符：+5分

结构化程度：
- 每个有效字段：10分（最高30分）
- 有效字段定义：非空且有实际内容
```

#### 丰富度算法优化

```typescript
// 原算法：图片20分 + 语音15分 + 链接15分 + 卡片30分 + 日志20分
// 新算法：
丰富度 = 
  多模态输入(25分) +
  头脑风暴深度(35分) +
  酿造日志质量(25分) +
  时间投入(15分)

多模态输入：
- 纯文本：5分
- 文本+图片：15分
- 文本+图片+语音/链接：25分

头脑风暴深度：
- 卡片数量：每张10分（最高20分）
- 卡片内容质量：有详细描述的卡片每张+5分（最高15分）

酿造日志质量：
- 日志条数：每条5分（最高15分）
- 日志长度：平均≥50字符：+10分

时间投入：
- 创建时间距今≥1天：5分
- 有更新记录：+5分
- 最近7天内有更新：+5分
```

#### 可行性算法优化

```typescript
// 原算法：描述20分 + 卡片40分 + 碰撞30分 + 计划10分
// 新算法：
可行性 = 
  基础可行性(20分) +
  思考深度(40分) +
  碰撞验证(30分) +
  执行规划(10分)

基础可行性：
- 文本描述≥30字符：20分

思考深度：
- 头脑风暴卡片：每张15分（最高30分）
- 卡片有可行性行动词：+10分

碰撞验证：
- 碰撞次数：每次10分（最高30分）
- 碰撞产生配方：+10分

执行规划：
- 有明确的steps/plan/actions：10分
```

#### 独特性算法优化

```typescript
// 原算法：基础20分 + 碰撞30分 + 容器15分 + 卡片20分 + 多模态15分
// 新算法：
独特性 = 
  基础独特性(20分) +
  创新组合(35分) +
  思维发散(25分) +
  多维度输入(20分)

基础独特性：
- 每个灵感都有基础独特性：20分

创新组合：
- 碰撞次数：每次15分（最高25分）
- 碰撞产生独特配方：+10分

思维发散：
- 头脑风暴卡片≥3张：25分
- 头脑风暴卡片1-2张：15分

多维度输入：
- ≥3种输入类型：20分
- 2种输入类型：10分
```

### 2.4 缓存策略

#### 本地评分缓存

```typescript
interface ScoringCache {
  // 内容哈希 → 评分结果
  contentHash: string;
  result: ScoringResult;
  timestamp: number;
}

// 缓存策略：
// 1. 计算灵感内容的哈希值
// 2. 内容未变更时复用缓存结果
// 3. 缓存有效期：永久（直到内容变更）
// 4. 内存缓存，不持久化
```

#### LLM评分缓存

```typescript
interface LLMScoringCache {
  // 灵感ID + 内容哈希 → LLM评分结果
  inspirationId: string;
  contentHash: string;
  llmResult: LLMParsedScoringResult;
  timestamp: number;
}

// 缓存策略：
// 1. 持久化到数据库（SQLite）
// 2. 内容变更时失效
// 3. 有效期：7天（过期后需重新评估）
```

### 2.5 LLM接入策略

#### 触发时机

| 触发方式 | 时机 | 条件 |
|---------|------|------|
| 用户主动 | 点击"深度分析"按钮 | 无限制 |
| 碰撞后自动 | 碰撞完成生成配方 | 仅对新灵感 |
| 定期优化 | 每周一次 | 低优先级，可选 |

#### 成本控制

```typescript
// LLM评分配置
interface LLMScoringConfig {
  // 每日最大调用次数
  maxDailyCalls: number;  // 默认：10次
  // 每次评分最大token
  maxTokens: number;      // 默认：500
  // 是否启用自动评分
  enableAutoScoring: boolean;  // 默认：false
}
```

#### LLM评分结果融合

```typescript
// LLM评分结果转换为本地维度
function convertLLMToLocalDimensions(
  llmResult: LLMParsedScoringResult
): LocalDimensionScores {
  return {
    clarity: llmResult.dimensions.clarity,
    richness: calculateRichnessFromLLM(llmResult),
    feasibility: llmResult.dimensions.actionability,
    uniqueness: llmResult.dimensions.creativity,
  };
}

function calculateRichnessFromLLM(llmResult: LLMParsedScoringResult): number {
  // 深度 + 完整度的加权平均
  return Math.round(
    llmResult.dimensions.depth * 0.6 +
    llmResult.dimensions.completeness * 0.4
  );
}
```

---

## 三、文件结构

### 3.1 需修改文件

| 文件 | 修改内容 |
|------|---------|
| `src/services/scoring/evaluator.ts` | 优化评分算法，增加内容质量评估 |
| `src/services/scoring/dimensions.ts` | 更新维度定义和权重说明 |
| `src/services/llm/prompts/scoring.ts` | 更新 Prompt，维度映射说明 |
| `src/services/llm/index.ts` | 添加 LLM 评分缓存和触发策略 |
| `src/services/scoring/index.ts` | 导出新增模块 |

### 3.2 需新增文件

| 文件 | 内容 |
|------|------|
| `src/services/scoring/cache.ts` | 本地评分缓存实现 |
| `src/services/scoring/hybrid.ts` | 混合评分策略（本地+LLM） |
| `src/services/scoring/types.ts` | 统一类型定义 |

---

## 四、接口定义

### 4.1 混合评分接口

```typescript
// 混合评分服务
interface HybridScoringService {
  // 快速评分（本地，带缓存）
  quickScore(inspiration: Inspiration): ScoringResult;
  
  // 深度评分（LLM，带缓存）
  deepScore(inspiration: Inspiration): Promise<DeepScoringResult>;
  
  // 强制刷新（清除缓存重新计算）
  refreshScore(inspiration: Inspiration): ScoringResult;
  
  // 获取评分历史
  getScoreHistory(inspirationId: string): Promise<ScoringHistory>;
}

// 深度评分结果
interface DeepScoringResult extends ScoringResult {
  // LLM 生成的评语
  llmComment: string;
  // LLM 生成的改进建议
  llmSuggestions: string[];
  // 评分来源
  source: 'local' | 'llm' | 'hybrid';
}
```

### 4.2 缓存接口

```typescript
// 评分缓存管理
interface ScoringCacheManager {
  // 获取缓存
  get(inspiration: Inspiration): ScoringResult | null;
  
  // 设置缓存
  set(inspiration: Inspiration, result: ScoringResult): void;
  
  // 清除缓存
  clear(inspirationId?: string): void;
  
  // 计算内容哈希
  computeHash(inspiration: Inspiration): string;
}
```

---

## 五、实现步骤

### 优先级排序

| 优先级 | 步骤 | 说明 |
|--------|------|------|
| **高** | 1. 本地评分算法优化 | 修改 evaluator.ts，提升评分精确度 |
| **高** | 2. 本地评分缓存 | 新增 cache.ts，避免重复计算 |
| **中** | 3. LLM评分接入 | 修改 scoring.ts Prompt，添加维度映射 |
| **中** | 4. 混合评分服务 | 新增 hybrid.ts，统一评分入口 |
| **低** | 5. UI集成 | 在灵感详情页添加"深度分析"按钮 |
| **低** | 6. LLM评分缓存 | 持久化 LLM 评分结果 |

### 实现顺序

```
Phase 1: 本地评分优化
├── Step 1: 更新维度定义和权重说明
├── Step 2: 优化清晰度算法
├── Step 3: 优化丰富度算法
├── Step 4: 优化可行性算法
├── Step 5: 优化独特性算法
└── Step 6: 添加缓存机制

Phase 2: LLM评分接入
├── Step 7: 更新 LLM Prompt
├── Step 8: 添加维度映射函数
├── Step 9: 实现混合评分服务
└── Step 10: 添加触发策略

Phase 3: UI集成（可选）
├── Step 11: 添加深度分析按钮
└── Step 12: 显示评分雷达图
```

---

## 六、验收标准

### 6.1 功能验收

| 测试项 | 通过标准 |
|--------|----------|
| 本地评分精确度 | 相同内容评分一致 |
| 缓存有效性 | 内容未变更时复用结果 |
| LLM维度映射 | 正确转换为四维模型 |
| 混合评分融合 | 本地+LLM结果正确合并 |

### 6.2 性能验收

| 测试项 | 通过标准 |
|--------|----------|
| 本地评分耗时 | < 5ms |
| 缓存命中时耗时 | < 1ms |
| LLM评分耗时 | < 3s |

---

**文档版本**：v1.0
**创建日期**：2026-06-16
**状态**：待用户确认后进入修改阶段