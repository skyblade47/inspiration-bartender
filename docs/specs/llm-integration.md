# 灵感调酒师 - LLM集成设计规范

> 版本：v1.0
> 日期：2026-06-16
> 状态：已实现
> 适用：灵感调酒师项目的 AI 对话功能

---

## 一、模块概述

### 1.1 功能定位
LLM（大语言模型）集成模块为灵感调酒师提供智能对话能力，负责：
- 根据用户输入生成追问和建议
- 评估灵感完整度并给出评分
- 生成灵感碰撞后的创意配方
- 提供多供应商支持（OpenAI、Anthropic、Ollama）

### 1.2 文件结构

```
src/services/llm/
├── config.ts           # LLM配置管理
├── provider.ts         # LLM提供商实现（核心）
├── index.ts            # 导出入口
└── prompts/
    ├── brewing.ts       # 调酒对话提示词
    └── scoring.ts       # 评分提示词
```

---

## 二、架构设计

### 2.1 核心流程

```text
用户输入 → 构建Message → LLM调用 → 响应解析 → 显示/存储
    ↓
流式输出（可选）→ 实时更新UI → 动画效果
```

### 2.2 提供商架构

使用策略模式（Strategy Pattern）支持多供应商：

```typescript
// 统一接口
interface ILLMProvider {
  chat(request: ChatRequest): Promise<ChatResponse>;
  chatStream?(request: ChatRequest, onChunk: (chunk: string) => void): Promise<void>;
}

// 提供商实现
class OpenAIProvider implements ILLMProvider { ... }
class AnthropicProvider implements ILLMProvider { ... }
class OllamaProvider implements ILLMProvider { ... }

// 工厂函数
function createProvider(config: LLMConfig): ILLMProvider { ... }
```

---

## 三、数据结构

### 3.1 LLM提供商类型

```typescript
export enum LLMProvider {
  OPENAI = 'openai',       // OpenAI系列（GPT-3.5/4）
  ANTHROPIC = 'anthropic',  // Anthropic Claude
  OLLAMA = 'ollama',       // 本地部署（Llama/CodeLlama等）
}
```

### 3.2 消息结构

```typescript
export enum MessageRole {
  SYSTEM = 'system',      // 系统提示词
  USER = 'user',          // 用户消息
  ASSISTANT = 'assistant', // AI回复
}

export interface Message {
  role: MessageRole;        // 消息角色
  content: string;          // 消息内容
}
```

### 3.3 请求和响应

```typescript
// 请求参数
export interface ChatRequest {
  messages: Message[];           // 对话历史
  temperature?: number;          // 采样温度（0-2）
  maxTokens?: number;            // 最大生成token
  topP?: number;                 // top_p采样
  stream?: boolean;              // 是否流式
}

// 响应结果
export interface ChatResponse {
  content: string;               // 生成文本
  usage?: {
    promptTokens: number;        // 输入token数
    completionTokens: number;    // 输出token数
    totalTokens: number;         // 总token数
  };
  finishReason?: string;         // 完成原因
}
```

### 3.4 配置结构

```typescript
// 基础配置
export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// 特定提供商配置
export interface OpenAIConfig extends LLMConfig { ... }
export interface AnthropicConfig extends LLMConfig { ... }
export interface OllamaConfig extends LLMConfig { ... }
```

---

## 四、实现规范

### 4.1 OpenAI 提供商（已实现）

**API 端点**：`POST {baseUrl}/v1/chat/completions`

**请求头**：
```
Content-Type: application/json
Authorization: Bearer {apiKey}
```

**请求体**：
```json
{
  "model": "gpt-4",
  "messages": [...],
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": false
}
```

**响应处理**：
- 成功：`data.choices[0].message.content`
- 流式：逐行解析 SSE 格式（`data: {...}`）
- 错误：非200状态码抛出异常

**推荐模型**：
- `gpt-4` - 高质量，较慢，较贵
- `gpt-4-1106-preview` - 最新GPT-4
- `gpt-3.5-turbo` - 快速，经济

### 4.2 Anthropic 提供商（已实现）

**API 端点**：`POST {baseUrl}/v1/messages`

**请求头**：
```
Content-Type: application/json
x-api-key: {apiKey}
anthropic-version: 2023-06-01
```

**特殊处理**：
- System消息从messages中分离，作为单独参数传递
- 响应格式：`data.content` 是数组，每个元素有 `text` 字段
- Token统计：`usage.input_tokens` 和 `usage.output_tokens`

**推荐模型**：
- `claude-3-5-sonnet-20241022` - 最新Sonnet
- `claude-3-opus-20240229` - 最高质量
- `claude-3-haiku-20240307` - 快速轻量

### 4.3 Ollama 提供商（已实现）

**API 端点**：`POST {baseUrl}/api/chat`

**特性**：
- 本地部署，无需API Key
- 隐私友好，数据不出本地
- 响应格式与云端不同：`data.message.content`
- 流式支持：每行一个JSON对象

**使用要求**：
- 本地必须运行 Ollama 服务
- 默认端口：11434
- 需要已 `ollama pull {model}` 下载模型

**推荐模型**：
- `llama2` - 基础模型
- `mistral` - 轻量快速
- `llama3` - 最新Llama模型

---

## 五、使用场景

### 5.1 调酒对话（Brewing Screen）

**目的**：通过对话补全灵感内容

**Prompt 特点**：
- 引导用户补充细节
- 提出追问问题
- 鼓励思考扩展

**调用流程**：
1. 用户在调酒工作台输入内容
2. 构建包含系统提示和对话历史的消息
3. 调用 LLM.chat()
4. 解析返回内容
5. 显示 AI 回复
6. 更新液体高度动画

### 5.2 评分系统辅助

**目的**：辅助评估灵感完整度

**使用方式**：
- 结合本地评分器（evaluator.ts）
- 对分数较低的维度生成建议
- 提供有针对性的改进建议

### 5.3 碰撞配方生成

**目的**：生成灵感混合后的创意方案

**Prompt 特点**：
- 接收2-3个灵感内容
- 生成3-5个创意配方
- 每个配方包含标题、描述、关键词、方向、评分

**输出格式**：JSON 数组

---

## 六、错误处理

### 6.1 错误类型和处理

| 错误场景 | 处理方式 | 用户体验 |
|----------|---------|----------|
| API Key 缺失 | 抛出错误，要求配置 | 显示"请先配置LLM设置" |
| 网络超时 | 3次重试，指数退避 | 显示"网络连接较慢..." |
| 4xx 客户端错误 | 记录日志，不再重试 | 显示"请求失败，请检查配置" |
| 5xx 服务端错误 | 最多3次重试 | 显示"服务暂时不可用" |
| 流式中断 | 尝试恢复，失败降级 | 显示已接收内容 |
| 解析失败 | 记录原始响应，降级显示 | 显示原始文本 |

### 6.2 降级策略

当 LLM 不可用时：
1. 使用本地规则生成基础建议
2. 显示预设的提示问题
3. 记录错误供后续分析
4. 不影响核心功能使用

---

## 七、性能和成本考虑

### 7.1 Token 使用优化

1. **消息长度控制**
   - 限制历史消息数量（最多10-20条）
   - 对长文本进行摘要

2. **缓存策略**
   - 对相同输入缓存响应
   - 缓存过期时间：24小时

3. **流式输出**
   - 提升用户感知速度
   - 无需等待完整响应

### 7.2 成本估算（参考）

- GPT-4：约 $0.03/1K tokens（输入）+$0.06/1K tokens（输出）
- GPT-3.5-Turbo：约 $0.0015/1K tokens
- Claude 3.5 Sonnet：约 $0.003/1K tokens
- Ollama：免费（本地部署成本忽略）

---

## 八、验收标准

### 8.1 功能验收

| 测试项 | 通过标准 | 验证方式 |
|--------|----------|----------|
| 三提供商支持 | OpenAI、Anthropic、Ollama都能调用 | 集成测试 |
| 对话功能 | 正常生成连贯回复 | 手动测试 |
| 流式输出 | 实时显示文字流 | 手动测试 |
| 错误处理 | 优雅处理各种异常 | 代码审查+测试 |
| 配置切换 | 可动态切换提供商 | 手动测试 |

### 8.2 代码验收

| 测试项 | 通过标准 | 验证方式 |
|--------|----------|----------|
| 类型安全 | TypeScript 无错误 | `npm run ts:check` |
| 扩展性 | 易于添加新提供商 | 代码审查 |
| 异常处理 | 所有 API 调用都有 try-catch | 代码审查 |
| 文档完整 | 每个主要函数都有注释 | 代码审查 |

---

## 九、安全考虑

1. **API Key 安全**
   - 不要在代码中硬编码
   - 使用环境变量或安全存储
   - 不要输出到日志

2. **内容审核**
   - 对用户输入进行适当过滤
   - 对 LLM 输出进行基本检查

3. **隐私保护**
   - 清楚告知用户数据将发送到哪里
   - 提供本地部署选项（Ollama）

---

## 十、参考信息

### 10.1 相关文件

- LLM服务：[src/services/llm/provider.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/llm/provider.ts)
- LLM配置：[src/services/llm/config.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/llm/config.ts)
- 调酒Prompt：[src/services/llm/prompts/brewing.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/llm/prompts/brewing.ts)
- 评分Prompt：[src/services/llm/prompts/scoring.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/llm/prompts/scoring.ts)
- 评分系统：[src/services/scoring/evaluator.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/services/scoring/evaluator.ts)

### 10.2 外部参考

- OpenAI API文档：https://platform.openai.com/docs
- Anthropic API文档：https://docs.anthropic.com
- Ollama GitHub：https://github.com/ollama/ollama

---

**文档版本**：v1.0
**创建日期**：2026-06-16
**最后更新**：2026-06-16
