/**
 * 评分 Prompt 模板
 * 用于评估灵感的完成度、创意度等指标
 */

// 变量类型定义
export interface ScoringPromptVars {
  // 灵感名称
  inspirationName: string;
  // 灵感描述
  inspirationDescription?: string;
  // 调酒记录
  brewingLog?: string;
  // 评分维度
  dimensions?: string;
  // 参考标准
  criteria?: string;
}

// 评分结果接口
export interface ScoringResult {
  // 总分
  totalScore: number;
  // 各维度分数
  dimensions: {
    clarity: number;      // 清晰度
    depth: number;        // 深度
    actionability: number; // 可执行性
    creativity: number;   // 创意度
    completeness: number; // 完整度
  };
  // 评语
  comment: string;
  // 改进建议
  suggestions: string[];
}

// 系统提示词 - 评分专家角色
export const SCORING_SYSTEM_PROMPT = `你是一位专业的灵感评估专家，负责评估灵感的质量和成熟度。
你的评估基于以下五个维度：

1. 清晰度 (clarity, 0-100)
   - 灵感是否表达清晰
   - 核心概念是否明确
   - 是否容易理解

2. 深度 (depth, 0-100)
   - 思考是否深入
   - 是否触及本质问题
   - 是否有层次感

3. 可执行性 (actionability, 0-100)
   - 是否可以转化为具体行动
   - 是否有明确的下一步
   - 是否现实可行

4. 创意度 (creativity, 0-100)
   - 是否有新颖的想法
   - 是否有独特的视角
   - 是否有创新的组合

5. 完整度 (completeness, 0-100)
   - 各要素是否完整
   - 是否有遗漏的重要部分
   - 是否形成闭环

请用 JSON 格式返回评分结果，格式如下：
{
  "totalScore": 总分,
  "dimensions": {
    "clarity": 分数,
    "depth": 分数,
    "actionability": 分数,
    "creativity": 分数,
    "completeness": 分数
  },
  "comment": "整体评语",
  "suggestions": ["改进建议1", "改进建议2", ...]
}`;

// 基础评分模板
export const BASE_SCORING_PROMPT = `请评估以下灵感：

灵感名称：{{inspirationName}}
{{inspirationDescription}}

调酒过程记录：
{{brewingLog}}

请给出详细的评分和分析。`;

// 快速评分模板（简化版）
export const QUICK_SCORING_PROMPT = `请快速评估这个灵感：

名称：{{inspirationName}}
描述：{{inspirationDescription}}

给出简化的评分（总分和一句话评语）。`;

// 详细评分模板
export const DETAILED_SCORING_PROMPT = `请详细评估以下灵感：

灵感名称：{{inspirationName}}

灵感描述：
{{inspirationDescription}}

完整的调酒过程：
{{brewingLog}}

评估维度：{{dimensions}}

参考标准：
{{criteria}}

请给出详细的评分，包括：
1. 各维度的分数和理由
2. 整体评语
3. 具体的改进建议`;

// 比较评分模板
export const COMPARATIVE_SCORING_PROMPT = `请比较评估以下灵感：

灵感A：{{inspirationName}}
{{inspirationDescription}}

参考灵感：
{{brewingLog}}

请评估这个灵感相对于参考灵感的优劣。`;

// 进度评估模板
export const PROGRESS_SCORING_PROMPT = `灵感的当前状态：

名称：{{inspirationName}}
描述：{{inspirationDescription}}
已进行的调酒步骤：
{{brewingLog}}

请评估：
1. 当前完成进度（百分比）
2. 还需要哪些步骤
3. 下一步建议`;

/**
 * 创建基础评分 Prompt
 */
export function createBaseScoringPrompt(vars: ScoringPromptVars): string {
  const description = vars.inspirationDescription 
    ? `灵感描述：${vars.inspirationDescription}` 
    : '';
  
  return BASE_SCORING_PROMPT
    .replace('{{inspirationName}}', vars.inspirationName)
    .replace('{{inspirationDescription}}', description)
    .replace('{{brewingLog}}', vars.brewingLog || '（暂无记录）');
}

/**
 * 创建详细评分 Prompt
 */
export function createDetailedScoringPrompt(vars: ScoringPromptVars): string {
  return DETAILED_SCORING_PROMPT
    .replace('{{inspirationName}}', vars.inspirationName)
    .replace('{{inspirationDescription}}', vars.inspirationDescription || '（暂无描述）')
    .replace('{{brewingLog}}', vars.brewingLog || '（暂无记录）')
    .replace('{{dimensions}}', vars.dimensions || '清晰度、深度、可执行性、创意度、完整度')
    .replace('{{criteria}}', vars.criteria || '基于灵感调酒师的通用标准');
}

/**
 * 创建快速评分 Prompt
 */
export function createQuickScoringPrompt(vars: ScoringPromptVars): string {
  return QUICK_SCORING_PROMPT
    .replace('{{inspirationName}}', vars.inspirationName)
    .replace('{{inspirationDescription}}', vars.inspirationDescription || '（暂无描述）');
}

/**
 * 创建进度评估 Prompt
 */
export function createProgressScoringPrompt(vars: ScoringPromptVars): string {
  return PROGRESS_SCORING_PROMPT
    .replace('{{inspirationName}}', vars.inspirationName)
    .replace('{{inspirationDescription}}', vars.inspirationDescription || '（暂无描述）')
    .replace('{{brewingLog}}', vars.brewingLog || '（暂无记录）');
}

/**
 * 解析评分结果
 * 从 LLM 返回的 JSON 文本中提取评分结果
 */
export function parseScoringResult(responseText: string): ScoringResult {
  try {
    // 尝试提取 JSON 部分
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('未找到 JSON 格式的评分结果');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // 验证并补全结果
    return {
      totalScore: parsed.totalScore ?? 0,
      dimensions: {
        clarity: parsed.dimensions?.clarity ?? 0,
        depth: parsed.dimensions?.depth ?? 0,
        actionability: parsed.dimensions?.actionability ?? 0,
        creativity: parsed.dimensions?.creativity ?? 0,
        completeness: parsed.dimensions?.completeness ?? 0,
      },
      comment: parsed.comment ?? '暂无评语',
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch (error) {
    // 解析失败时返回默认结果
    console.error('评分结果解析失败:', error);
    return {
      totalScore: 0,
      dimensions: {
        clarity: 0,
        depth: 0,
        actionability: 0,
        creativity: 0,
        completeness: 0,
      },
      comment: '评分解析失败，请重试',
      suggestions: [],
    };
  }
}

/**
 * 构建评分请求消息
 */
export function buildScoringMessages(
  scoringPrompt: string
): Array<{role: 'system' | 'user' | 'assistant'; content: string}> {
  return [
    { role: 'system', content: SCORING_SYSTEM_PROMPT },
    { role: 'user', content: scoringPrompt },
  ];
}

/**
 * 计算加权总分
 */
export function calculateWeightedScore(
  dimensions: ScoringResult['dimensions'],
  weights?: {
    clarity?: number;
    depth?: number;
    actionability?: number;
    creativity?: number;
    completeness?: number;
  }
): number {
  const defaultWeights = {
    clarity: 0.2,
    depth: 0.2,
    actionability: 0.2,
    creativity: 0.2,
    completeness: 0.2,
  };
  
  const w = { ...defaultWeights, ...weights };
  
  return Math.round(
    dimensions.clarity * w.clarity! +
    dimensions.depth * w.depth! +
    dimensions.actionability * w.actionability! +
    dimensions.creativity * w.creativity! +
    dimensions.completeness * w.completeness!
  );
}
