/**
 * LLM 配置管理模块
 * 负责管理不同 LLM 提供商的配置信息
 */

import * as SQLite from 'expo-sqlite';

// LLM 提供商类型
export enum LLMProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek',
  MOONSHOT = 'moonshot',
  QWEN = 'qwen',
  CUSTOM = 'custom',
}

// 基础配置接口
export interface BaseLLMConfig {
  provider: LLMProvider;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

// OpenAI 配置
export interface OpenAIConfig extends BaseLLMConfig {
  provider: LLMProvider.OPENAI;
  apiKey: string;
  baseUrl?: string; // 自定义 API 端点
}

// Anthropic 配置
export interface AnthropicConfig extends BaseLLMConfig {
  provider: LLMProvider.ANTHROPIC;
  apiKey: string;
  baseUrl?: string;
}

// Ollama 配置（本地部署，无需 API Key）
export interface OllamaConfig extends BaseLLMConfig {
  provider: LLMProvider.OLLAMA;
  baseUrl: string; // Ollama 服务地址，如 http://localhost:11434
}

// Google Gemini 配置
export interface GeminiConfig extends BaseLLMConfig {
  provider: LLMProvider.GEMINI;
  apiKey: string;
  baseUrl?: string;
}

// DeepSeek 配置
export interface DeepSeekConfig extends BaseLLMConfig {
  provider: LLMProvider.DEEPSEEK;
  apiKey: string;
  baseUrl?: string;
}

// Moonshot 配置
export interface MoonshotConfig extends BaseLLMConfig {
  provider: LLMProvider.MOONSHOT;
  apiKey: string;
  baseUrl?: string;
}

// Qwen 配置
export interface QwenConfig extends BaseLLMConfig {
  provider: LLMProvider.QWEN;
  apiKey: string;
  baseUrl?: string;
}

// 自定义配置（兼容 OpenAI 格式的任意 API）
export interface CustomConfig extends BaseLLMConfig {
  provider: LLMProvider.CUSTOM;
  apiKey: string;
  baseUrl: string;
}

// 联合类型
export type LLMConfig = OpenAIConfig | AnthropicConfig | OllamaConfig | GeminiConfig | DeepSeekConfig | MoonshotConfig | QwenConfig | CustomConfig;

// 配置存储键名
const CONFIG_TABLE_NAME = 'llm_config';

// 数据库实例
let db: SQLite.SQLiteDatabase | null = null;

/**
 * 初始化配置数据库
 */
export async function initConfigDatabase(): Promise<void> {
  db = SQLite.openDatabaseSync('llm_config.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ${CONFIG_TABLE_NAME} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL,
      config TEXT NOT NULL,
      isDefault INTEGER DEFAULT 0,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
}

/**
 * 保存 LLM 配置
 * @param config LLM 配置对象
 * @param isDefault 是否设为默认配置
 */
export async function saveConfig(config: LLMConfig, isDefault: boolean = false): Promise<void> {
  if (!db) await initConfigDatabase();
  
  const now = Date.now();
  const configJson = JSON.stringify(config);
  
  // 如果设为默认，先取消其他默认配置
  if (isDefault) {
    await db!.runAsync(`UPDATE ${CONFIG_TABLE_NAME} SET isDefault = 0`);
  }
  
  // 检查是否已存在该提供商的配置
  const existing = await db!.getFirstAsync(
    `SELECT id FROM ${CONFIG_TABLE_NAME} WHERE provider = ?`,
    config.provider
  );
  
  if (existing) {
    // 更新现有配置
    await db!.runAsync(
      `UPDATE ${CONFIG_TABLE_NAME} SET config = ?, isDefault = ?, updatedAt = ? WHERE provider = ?`,
      configJson,
      isDefault ? 1 : 0,
      now,
      config.provider
    );
  } else {
    // 插入新配置
    await db!.runAsync(
      `INSERT INTO ${CONFIG_TABLE_NAME} (provider, config, isDefault, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
      config.provider,
      configJson,
      isDefault ? 1 : 0,
      now,
      now
    );
  }
}

/**
 * 获取指定提供商的配置
 * @param provider LLM 提供商
 */
export async function getConfig(provider: LLMProvider): Promise<LLMConfig | null> {
  if (!db) await initConfigDatabase();
  
  const row = await db!.getFirstAsync<{ config: string }>(
    `SELECT config FROM ${CONFIG_TABLE_NAME} WHERE provider = ?`,
    provider
  );
  
  if (!row) return null;
  return JSON.parse(row.config) as LLMConfig;
}

/**
 * 获取默认配置
 */
export async function getDefaultConfig(): Promise<LLMConfig | null> {
  if (!db) await initConfigDatabase();
  
  const row = await db!.getFirstAsync<{ config: string }>(
    `SELECT config FROM ${CONFIG_TABLE_NAME} WHERE isDefault = 1 LIMIT 1`
  );
  
  if (!row) return null;
  return JSON.parse(row.config) as LLMConfig;
}

/**
 * 获取所有已保存的配置
 */
export async function getAllConfigs(): Promise<LLMConfig[]> {
  if (!db) await initConfigDatabase();
  
  const rows = await db!.getAllAsync<{ config: string }>(
    `SELECT config FROM ${CONFIG_TABLE_NAME} ORDER BY updatedAt DESC`
  );
  
  return rows.map((row) => JSON.parse(row.config) as LLMConfig);
}

/**
 * 删除指定提供商的配置
 * @param provider LLM 提供商
 */
export async function deleteConfig(provider: LLMProvider): Promise<void> {
  if (!db) await initConfigDatabase();
  await db!.runAsync(`DELETE FROM ${CONFIG_TABLE_NAME} WHERE provider = ?`, provider);
}

/**
 * 设置默认配置
 * @param provider LLM 提供商
 */
export async function setDefaultConfig(provider: LLMProvider): Promise<void> {
  if (!db) await initConfigDatabase();
  
  // 取消所有默认
  await db!.runAsync(`UPDATE ${CONFIG_TABLE_NAME} SET isDefault = 0`);
  // 设置新的默认
  await db!.runAsync(
    `UPDATE ${CONFIG_TABLE_NAME} SET isDefault = 1 WHERE provider = ?`,
    provider
  );
}

/**
 * 验证配置是否有效
 * @param config LLM 配置
 */
export function validateConfig(config: LLMConfig): boolean {
  switch (config.provider) {
    case LLMProvider.OPENAI:
    case LLMProvider.ANTHROPIC:
    case LLMProvider.GEMINI:
    case LLMProvider.DEEPSEEK:
    case LLMProvider.MOONSHOT:
    case LLMProvider.QWEN:
      return !!(config as OpenAIConfig).apiKey && !!(config as OpenAIConfig).model;
    case LLMProvider.OLLAMA:
      return !!(config as OllamaConfig).baseUrl && !!(config as OllamaConfig).model;
    case LLMProvider.CUSTOM:
      return !!(config as CustomConfig).apiKey && !!(config as CustomConfig).baseUrl && !!(config as CustomConfig).model;
    default:
      return false;
  }
}

/**
 * 获取默认模型列表
 * @param provider LLM 提供商
 */
export function getDefaultModels(provider: LLMProvider): string[] {
  switch (provider) {
    case LLMProvider.OPENAI:
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    case LLMProvider.ANTHROPIC:
      return ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'];
    case LLMProvider.OLLAMA:
      return ['llama3', 'llama3:70b', 'mistral', 'codellama', 'qwen2'];
    case LLMProvider.GEMINI:
      return ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'];
    case LLMProvider.DEEPSEEK:
      return ['deepseek-chat', 'deepseek-r1.5', 'deepseek-coder'];
    case LLMProvider.MOONSHOT:
      return ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'];
    case LLMProvider.QWEN:
      return ['qwen-plus', 'qwen-turbo', 'qwen-max', 'qwen-max-longcontext'];
    case LLMProvider.CUSTOM:
      return ['gpt-4o', 'gpt-3.5-turbo', 'custom-model'];
    default:
      return [];
  }
}

// 模型缓存表名
const MODEL_CACHE_TABLE_NAME = 'llm_model_cache';

// 模型缓存有效期（24小时）
const MODEL_CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * 初始化模型缓存数据库表
 */
async function initModelCacheTable(): Promise<void> {
  if (!db) await initConfigDatabase();
  await db!.execAsync(`
    CREATE TABLE IF NOT EXISTS ${MODEL_CACHE_TABLE_NAME} (
      provider TEXT PRIMARY KEY,
      models TEXT NOT NULL,
      cachedAt INTEGER NOT NULL
    );
  `);
}

/**
 * 缓存模型列表
 * @param provider LLM 提供商
 * @param models 模型列表
 */
export async function cacheModels(provider: LLMProvider, models: string[]): Promise<void> {
  await initModelCacheTable();
  const now = Date.now();
  await db!.runAsync(
    `INSERT OR REPLACE INTO ${MODEL_CACHE_TABLE_NAME} (provider, models, cachedAt) VALUES (?, ?, ?)`,
    provider,
    JSON.stringify(models),
    now
  );
}

/**
 * 获取缓存的模型列表
 * @param provider LLM 提供商
 * @returns 模型列表或 null（如果缓存过期）
 */
export async function getCachedModels(provider: LLMProvider): Promise<string[] | null> {
  await initModelCacheTable();
  const row = await db!.getFirstAsync<{ models: string; cachedAt: number }>(
    `SELECT models, cachedAt FROM ${MODEL_CACHE_TABLE_NAME} WHERE provider = ?`,
    provider
  );

  if (!row) return null;

  const age = Date.now() - row.cachedAt;
  if (age > MODEL_CACHE_TTL) {
    // 缓存过期，删除
    await db!.runAsync(`DELETE FROM ${MODEL_CACHE_TABLE_NAME} WHERE provider = ?`, provider);
    return null;
  }

  return JSON.parse(row.models) as string[];
}

/**
 * 获取模型列表（优先从 API 获取，失败则回退到缓存或默认列表）
 * @param provider LLM 提供商
 * @param fetcher 从 API 获取模型的函数
 */
export async function fetchModelsWithFallback(
  provider: LLMProvider,
  fetcher: () => Promise<string[]>
): Promise<string[]> {
  try {
    const models = await fetcher();
    await cacheModels(provider, models);
    return models;
  } catch {
    // API 获取失败，尝试使用缓存
    const cached = await getCachedModels(provider);
    if (cached) return cached;
    // 缓存也没有，回退到默认列表
    return getDefaultModels(provider);
  }
}
