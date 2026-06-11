/**
 * 调酒对话 Prompt 模板
 * 用于生成调酒灵感和对话
 */

// 变量类型定义
export interface BrewingPromptVars {
  // 用户输入
  userInput: string;
  // 灵感名称
  inspirationName?: string;
  // 当前状态
  currentStatus?: string;
  // 历史对话
  conversationHistory?: string;
  // 已有的调酒记录
  brewingLog?: string;
  // 用户偏好
  userPreferences?: string;
}

/**
 * Prompt 模板类
 * 支持变量替换和模板组合
 */
export class PromptTemplate {
  private template: string;
  private vars: Map<string, string>;

  constructor(template: string) {
    this.template = template;
    this.vars = new Map();
  }

  /**
   * 设置变量值
   */
  set(key: string, value: string): this {
    this.vars.set(key, value);
    return this;
  }

  /**
   * 批量设置变量
   */
  setAll(vars: Record<string, string>): this {
    Object.entries(vars).forEach(([key, value]) => {
      this.vars.set(key, value);
    });
    return this;
  }

  /**
   * 渲染模板
   * 使用 {{variableName}} 语法进行变量替换
   */
  render(): string {
    let result = this.template;
    
    this.vars.forEach((value, key) => {
      const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(pattern, value);
    });
    
    return result;
  }
}

// 系统提示词 - 调酒师角色
export const BREWING_SYSTEM_PROMPT = `你是一位富有创意的调酒师，专门帮助用户将灵感转化为独特的"调酒"配方。
你的任务是通过对话引导用户，帮助他们：
1. 澄清和深化他们的灵感
2. 探索不同的可能性
3. 将抽象的想法转化为具体的行动步骤
4. 发现意想不到的组合和联系

你的风格：
- 像调酒一样，懂得如何"混合"不同的想法元素
- 用比喻和故事让对话更有趣
- 保持开放和好奇的态度
- 适时提出启发性的问题

请用中文回复，保持温暖友好的语气。`;

// 初始对话模板
export const INITIAL_BREWING_PROMPT = `用户带来了一个新的灵感：
"{{userInput}}"

请作为调酒师，用一段简短而有趣的开场白来欢迎这个灵感，并提出一个开放式问题来开始对话。
注意：
- 用调酒的比喻来描述这个灵感
- 提出的问题要能帮助用户深入思考
- 保持轻松愉快的语气`;

// 继续对话模板
export const CONTINUE_BREWING_PROMPT = `用户正在调制的灵感：{{inspirationName}}
当前状态：{{currentStatus}}

{{conversationHistory}}

用户说："{{userInput}}"

请继续对话：
1. 回应用户的想法
2. 提出新的问题或建议，帮助灵感进一步发展
3. 如果用户提出了具体的想法，帮助他完善和细化`;

// 深化灵感模板
export const DEEPEN_BREWING_PROMPT = `灵感的名称：{{inspirationName}}
当前状态：{{currentStatus}}

已有的调酒记录：
{{brewingLog}}

用户的最新想法："{{userInput}}"

请帮助用户深化这个灵感：
1. 分析灵感的核心要素
2. 提出可能的扩展方向
3. 建议具体的下一步行动
4. 如果有好的比喻或故事，可以分享`;

// 完成调酒模板
export const COMPLETE_BREWING_PROMPT = `灵感的名称：{{inspirationName}}

完整的调酒过程：
{{brewingLog}}

请为这个完成的灵感写一段总结：
1. 回顾灵感的演变过程
2. 总结核心要素和特点
3. 给出祝福和鼓励的话语
4. 风格要像调酒师完成一杯特调时的仪式感`;

// 用户偏好相关
export const PREFERENCE_AWARE_PROMPT = `用户的偏好：
{{userPreferences}}

灵感的名称：{{inspirationName}}

用户说："{{userInput}}"

请根据用户的偏好来调整你的回应方式，让对话更贴合用户的风格。`;

/**
 * 创建初始对话 Prompt
 */
export function createInitialPrompt(userInput: string): string {
  return new PromptTemplate(INITIAL_BREWING_PROMPT)
    .set('userInput', userInput)
    .render();
}

/**
 * 创建继续对话 Prompt
 */
export function createContinuePrompt(vars: BrewingPromptVars): string {
  return new PromptTemplate(CONTINUE_BREWING_PROMPT)
    .setAll({
      inspirationName: vars.inspirationName || '未命名灵感',
      currentStatus: vars.currentStatus || '萌芽中',
      conversationHistory: vars.conversationHistory || '（对话刚开始）',
      userInput: vars.userInput,
    })
    .render();
}

/**
 * 创建深化灵感 Prompt
 */
export function createDeepenPrompt(vars: BrewingPromptVars): string {
  return new PromptTemplate(DEEPEN_BREWING_PROMPT)
    .setAll({
      inspirationName: vars.inspirationName || '未命名灵感',
      currentStatus: vars.currentStatus || '成长中',
      brewingLog: vars.brewingLog || '（暂无记录）',
      userInput: vars.userInput,
    })
    .render();
}

/**
 * 创建完成调酒 Prompt
 */
export function createCompletePrompt(vars: BrewingPromptVars): string {
  return new PromptTemplate(COMPLETE_BREWING_PROMPT)
    .setAll({
      inspirationName: vars.inspirationName || '未命名灵感',
      brewingLog: vars.brewingLog || '（暂无记录）',
    })
    .render();
}

/**
 * 组合系统提示和用户提示
 */
export function buildBrewingMessages(userPrompt: string): Array<{role: 'system' | 'user' | 'assistant'; content: string}> {
  return [
    { role: 'system', content: BREWING_SYSTEM_PROMPT },
    { role: 'user', content: userPrompt },
  ];
}
