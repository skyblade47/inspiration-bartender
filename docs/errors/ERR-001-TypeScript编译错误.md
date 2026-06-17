# [ERR-001] TypeScript 编译失败 / 类型检查不通过

| 字段 | 内容 |
|------|------|
| **错误编号** | ERR-001 |
| **发现日期** | 2026-06-16 |
| **严重程度** | 🟠 高 |
| **涉及模块** | 全局（所有 TypeScript 文件） |
| **涉及文件** | `src/**/*.ts / *.tsx` |
| **发现阶段** | 编码 / 验收阶段（执行 `npx tsc --noEmit` 时） |
| **状态** | ✅ 已解决 |

---

## 错误现象

在编码阶段或验收阶段运行类型检查时出现编译错误，典型表现为：

- 显式 `any` 被使用（`noImplicitAny: true`）
- `null` / `undefined` 未处理（`strictNullChecks: true`）
- 组件 Props 接口未定义或缺失字段
- Zustand store 的返回值与类型声明不一致
- 导入路径拼写错误 / 文件不存在

**预期行为**：`npx tsc --noEmit` 应返回 0 错误，这是提交代码的硬性门槛。  
**实际行为**：存在 1~N 个类型错误，阻断代码提交。

## 复现步骤

1. 在项目根目录打开终端
2. 执行命令：`npx tsc --noEmit`
3. 观察到红色错误信息与错误数量统计

---

## 根本原因分析

| 常见子类 | 说明 |
|---------|------|
| **类型缺失** | 组件 Props / 服务返回值未明确定义 interface，退化为 any |
| **未处理 null** | 从 store / SQLite 读取的值可能为空，但未做 `??` / `?.` 保护 |
| **类型不匹配** | 把 `string | undefined` 当作 `string` 传入严格函数 |
| **路径拼写错误** | import 路径大小写或文件后缀不一致 |
| **tsconfig 约束过松** | 未开启 `strict` 模式导致编译通过但运行时出错 |

深层原因：原则一（设计方案）阶段未明确类型模型；原则二（写→审闭环）阶段 Reviewer 未执行类型检查 checklist。

---

## 解决方案

### 修复步骤

1. **强制开启严格模式**：确保 `tsconfig.json` 中 `"strict": true`、`"noImplicitAny": true`、`"strictNullChecks": true`
2. **逐个文件修**：按 `tsc` 输出从第一个错误开始修复，不要跳过
3. **类型定义优先**：先定义 `src/types/index.ts` 的全局 interface，再改实现
4. **每次提交前跑**：`npx tsc --noEmit` 作为 pre-commit 钩子（未来可加 husky）

### 关键代码变更摘要

```typescript
// ❌ 修改前 —— 隐式 any
function handleInput(value) {
  return value.trim();
}

// ✅ 修改后 —— 明确类型
function handleInput(value: string | null | undefined): string {
  return (value ?? '').trim();
}
```

```typescript
// ❌ 修改前 —— 组件 Props 无类型
const Glass = ({ data }) => <View>...</View>

// ✅ 修改后 —— 定义 interface
interface GlassProps {
  data: {
    type: string;
    completion: number;
    color: string;
  };
}

const Glass: React.FC<GlassProps> = ({ data }) => <View>...</View>
```

---

## 验证结果

- [x] `npx tsc --noEmit` 通过（0 错误）
- [x] 核心功能手动验证通过（至少吧台界面、对话界面、碰撞界面）
- [x] 无回归问题：其他模块不因为本次类型收紧而增加新错误

---

## 预防措施

如何防止未来再次发生同样的问题？

- [x] 加入 Reviewer 检查清单第一条（WORK_PRINCIPLES.md 原则二）
- [x] 设计文档模板中强制要求"类型/数据模型"章节（原则一）
- [x] 所有公共导出函数必须带完整 JSDoc + 类型声明
- [ ] 加入 husky pre-commit（可选：当项目规模达到一定阈值后启用）

---

## 关联文档

- 违反原则：[WORK_PRINCIPLES.md 原则一 / 原则二](../WORK_PRINCIPLES.md)
- 相关设计：模块 specs 参见 `docs/specs/` 下对应文档
- 代码标准：`docs/CODE_STANDARDS.md`
- 流程参考：[WORKFLOW.md](../WORKFLOW.md) 验收阶段 → 类型检查是必选项

---

**文档版本**: v1.0  
**最后更新**: 2026-06-16
