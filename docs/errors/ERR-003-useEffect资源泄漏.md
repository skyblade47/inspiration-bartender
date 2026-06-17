# [ERR-003] useEffect 清理缺失导致资源泄漏 / 订阅未取消

| 字段 | 内容 |
|------|------|
| **错误编号** | ERR-003 |
| **发现日期** | 2026-06-16 |
| **严重程度** | 🟡 中 |
| **涉及模块** | 组件层（对话/吧台/碰撞动画均可能涉及） |
| **涉及文件** | `src/screens/*/index.tsx`、`src/components/*/index.tsx` |
| **发现阶段** | 审查阶段（Reviewer 发现）/ 运行时表现为内存泄漏 |
| **状态** | ✅ 已解决 |

---

## 错误现象

组件卸载后仍在执行副作用，导致：
- 控制台警告：`Can't perform a React state update on an unmounted component`
- 定时器持续触发（例如动画计时、轮询 LLM 响应状态）
- WebSocket / EventEmitter 订阅未取消
- 长列表滑动时性能劣化、应用偶发卡顿

**预期行为**：组件卸载时所有副作用被正确清理。

## 复现步骤

1. 打开包含对话/动画的页面
2. 迅速返回到上一页（触发组件 unmount）
3. 在 Metro / Expo 控制台观察黄色或红色警告
4. 若有轮询：继续访问接口 → 看到多次重复请求发出

---

## 根本原因分析

| 常见子类 | 说明 |
|---------|------|
| **setTimeout/setInterval** | 设置了定时器但未在 cleanup 中 `clearTimeout` / `clearInterval` |
| **订阅 / 事件监听** | 调用了 `store.subscribe` / `addEventListener` 但未 unsubscribe |
| **网络请求** | `fetch` / `axios` 在组件卸载后仍试图 `setState` |
| **动画驱动** | React Native Reanimated 的 `withTiming` / `withRepeat` 未被取消 |

深层原因：原则一（设计方案）阶段缺少"边界情况 - 卸载"栏目；原则二 Reviewer checklist 中资源泄漏项未严格执行。

---

## 解决方案

### 修复步骤

每一个 `useEffect` 必须提供 `return () => { ... }` 清理函数。

### 关键代码变更摘要

**案例 1 —— 定时器**

```tsx
// ❌ 修改前
useEffect(() => {
  setInterval(() => setTick(t => t + 1), 1000);
}, []);

// ✅ 修改后
useEffect(() => {
  const id = setInterval(() => setTick(t => t + 1), 1000);
  return () => clearInterval(id);
}, []);
```

**案例 2 —— Zustand 订阅**

```tsx
// ❌ 修改前
useEffect(() => {
  brewingStore.subscribe(state => setBubbles(state.bubbles));
}, []);

// ✅ 修改后
useEffect(() => {
  const unsubscribe = brewingStore.subscribe(
    state => setBubbles(state.bubbles)
  );
  return unsubscribe;
}, []);
```

**案例 3 —— 异步请求 + AbortController**

```tsx
useEffect(() => {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch('/api/recipe', { signal: controller.signal });
      if (!controller.signal.aborted) setRecipe(await res.json());
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e);
    }
  })();

  return () => controller.abort();
}, []);
```

---

## 验证结果

- [x] `npx tsc --noEmit` 0 错误
- [x] 打开/关闭页面各 5 次，控制台无"unmounted component"警告
- [x] Perf Monitor（Expo DevMenu）显示内存稳定，无持续攀升
- [x] 无回归：核心功能（调酒对话、碰撞、评分）正常

---

## 预防措施

- [x] **Reviewer checklist 加入专项检查**：每个 useEffect 是否有 cleanup
- [x] **设计文档模板中加入"边界情况 - 卸载清理"要求**（specs 模板）
- [x] **原则二写→审闭环**：Reviewer 必须对每一处 useEffect 做审查
- [ ] **后续可选**：开启 ESLint `exhaustive-deps` 严格模式

---

## 关联文档

- 违反原则：[WORK_PRINCIPLES.md 原则一 / 原则二](../WORK_PRINCIPLES.md)
- 代码标准：`docs/CODE_STANDARDS.md`
- 相关设计：[specs/llm-integration.md](../specs/llm-integration.md)、[specs/glass-component.md](../specs/glass-component.md)

---

**文档版本**: v1.0  
**最后更新**: 2026-06-16
