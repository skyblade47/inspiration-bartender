# 灵感调酒师 - 测试体系设计

> 版本：v1.0
> 日期：2026-06-16
> 状态：设计阶段完成，待用户确认
> 适用：灵感调酒师项目测试体系建设

---

## 一、测试策略

### 1.1 方案选择：Jest + 轻量方案

| 因素 | Jest 适配度 |
|------|-------------|
| Ponytail 精简原则 | ⭐⭐⭐⭐⭐ 零配置，React 生态标配 |
| 快速执行 | ⭐⭐⭐⭐⭐ Jest V8 快照测试快 |
| 纯函数友好 | ⭐⭐⭐⭐⭐ Mock 能力强 |
| 移动端适配 | ⭐⭐⭐⭐ 需额外配置 preset |

### 1.2 不采用 E2E 测试的原因

- Cypress/Detox 依赖重，配置复杂
- 移动端模拟器测试慢
- 遵循精简原则：核心逻辑覆盖即可

---

## 二、测试覆盖范围

### 2.1 高优先级（必须覆盖）

| 模块 | 文件 | 测试重点 | 覆盖率目标 |
|------|------|----------|------------|
| 评分服务 | `evaluator.ts` | 评分算法、状态映射 | 90%+ |
| 评分服务 | `dimensions.ts` | 维度配置、权重校验 | 90%+ |
| 评分服务 | `cache.ts` | 缓存读写 | 80%+ |
| LLM 服务 | `provider.ts` | 三种 provider | 85%+ |
| LLM 服务 | `config.ts` | 配置验证 | 90%+ |
| 工具函数 | `generate-id.ts` | ID 生成 | 95%+ |
| 工具函数 | `llm-helpers.ts` | JSON 解析、错误脱敏 | 90%+ |

### 2.2 中优先级（建议覆盖）

| 模块 | 文件 | 测试重点 |
|------|------|----------|
| 碰撞服务 | `mixer.ts` | 混合逻辑、颜色计算 |
| 碰撞服务 | `utils.ts` | 颜色转换、主题提取 |
| 导出服务 | `export.ts` | 数据验证、解析 |

### 2.3 低优先级（可选覆盖）

- UI 组件：简单展示组件无需测试
- 屏幕组件：需模拟导航，可选

---

## 三、测试文件结构

```
inspiration-bartender/
├── __tests__/
│   ├── services/
│   │   ├── scoring/
│   │   │   ├── evaluator.test.ts
│   │   │   ├── dimensions.test.ts
│   │   │   └── cache.test.ts
│   │   ├── llm/
│   │   │   ├── provider.test.ts
│   │   │   └── config.test.ts
│   │   └── collision/
│   │       └── mixer.test.ts
│   ├── utils/
│   │   ├── generate-id.test.ts
│   │   └── llm-helpers.test.ts
│   └── setup.ts
├── jest.config.js
└── package.json
```

---

## 四、Jest 配置

### 4.1 依赖安装

```bash
npm install --save-dev jest @types/jest ts-jest
```

### 4.2 jest.config.js

```javascript
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|expo-.*)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  collectCoverageFrom: [
    'src/services/scoring/**/*.ts',
    'src/services/llm/**/*.ts',
    'src/utils/**/*.ts',
  ],
};
```

### 4.3 package.json 脚本

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "ts:check": "tsc --noEmit"
  }
}
```

---

## 五、Mock 策略

### 5.1 外部依赖 Mock

| 依赖 | Mock 方案 |
|------|----------|
| expo-sqlite | 内存 Map 模拟 |
| expo-file-system | Jest mock |
| fetch | 全局 Mock |

### 5.2 setup.ts 示例

```typescript
// __tests__/setup.ts
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  })),
}));

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => Promise.resolve({}),
});
```

---

## 六、实施步骤

### Phase 1：基础设施

1. 安装依赖：jest, @types/jest, ts-jest
2. 创建配置文件：jest.config.js, setup.ts
3. 验证测试运行

### Phase 2：高优先级测试

4. 评分服务测试（evaluator, dimensions, cache）
5. LLM 服务测试（provider, config）
6. 工具函数测试（generate-id, llm-helpers）

### Phase 3：中优先级测试

7. 碰撞服务测试（mixer）
8. 导出服务测试

---

## 七、验收标准

| 标准 | 验证命令 |
|------|----------|
| 测试运行无报错 | `npm test` |
| 覆盖率报告生成 | `npm run test:coverage` |
| TypeScript 类型正确 | `npm run ts:check` |

### 覆盖率要求

| 优先级 | 覆盖率目标 |
|--------|------------|
| 高优先级 | 85%+ |
| 中优先级 | 70%+ |
| 全局阈值 | 70% |

---

## 八、测试示例

### 评分器测试

```typescript
describe('InspirationEvaluator', () => {
  it('应返回有效的评分结果', () => {
    const evaluator = new InspirationEvaluator();
    const result = evaluator.evaluate(mockInspiration);
    
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
    expect(result.totalScore).toBeLessThanOrEqual(100);
    expect(result.dimensionScores).toHaveLength(4);
  });
});
```

### 工具函数测试

```typescript
describe('parseJsonFromLLMResponse', () => {
  it('应从 code fence 中提取 JSON', () => {
    const content = '```json\n{"key": "value"}\n```';
    const result = parseJsonFromLLMResponse(content, {});
    expect(result).toEqual({ key: 'value' });
  });
});
```

---

**文档版本**：v1.0
**创建日期**：2026-06-16
**状态**：待用户确认后进入修改阶段