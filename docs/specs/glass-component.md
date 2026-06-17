# 灵感调酒师 - 玻璃杯组件设计规范

> 版本：v1.0
> 日期：2026-06-16
> 状态：已实现
> 适用：灵感调酒师项目

---

## 一、模块概述

### 1.1 功能定位
玻璃杯组件是灵感调酒师的核心视觉组件，负责：
- 以不同类型的玻璃杯展示灵感
- 根据灵感完整度显示液体填充动画
- 提供交互入口（点击/长按）
- 支持三种尺寸

### 1.2 组件文件位置
- 主文件：`src/components/Glass/index.tsx`
- 类型定义：`src/types/index.ts`
- 主题配置：`src/constants/theme.ts`

---

## 二、数据结构定义

### 2.1 玻璃杯类型（GlassType）

```typescript
export enum GlassType {
  BRANDY = 'brandy',       // 白兰地杯 - 圆润造型
  CHAMPAGNE = 'champagne',  // 香槟杯 - 细长高脚
  WINE = 'wine',           // 红酒杯 - 经典弧形
  COCKTAIL = 'cocktail',    // 古典鸡尾酒杯 - 方正造型
  BEAKER = 'beaker',       // 烧杯 - 实验室风格
  MASON = 'mason',         // 梅森罐 - 乡村风格
  FLASK = 'flask',         // 锥形瓶 - 科学容器
  MARTINI = 'martini',     // 马天尼杯 - 三角高脚
}
```

### 2.2 组件属性（GlassProps）

```typescript
interface GlassProps {
  /** 杯子类型 */
  type: GlassType;
  /** 完成度百分比 (0-100) */
  completion: number;
  /** 灵感状态 */
  status: InspirationStatus;
  /** 尺寸大小 (默认: medium) */
  size?: 'small' | 'medium' | 'large';
  /** 点击回调 */
  onPress?: () => void;
  /** 长按回调 */
  onLongPress?: () => void;
}
```

### 2.3 尺寸规格

| 尺寸 | 宽度(px) | 高度(px) | 适用场景 |
|------|----------|----------|----------|
| small | 50 | 70 | 列表项、缩略图 |
| medium | 80 | 110 | 默认尺寸、吧台展示 |
| large | 120 | 165 | 详情页、聚焦展示 |

---

## 三、视觉设计规范

### 3.1 液体颜色映射

根据灵感类型映射不同的液体颜色：

| 灵感类型 | 杯子类型 | 颜色 | 描述 |
|----------|---------|------|------|
| 默认类型 | BRANDY | 钴蓝色 (R:30, G:58, B:95) | 深邃稳定 |
| 音乐类 | CHAMPAGNE | 淡紫色 (R:155, G:89, B:182) | 梦幻浪漫 |
| 文学类 | WINE | 酒红色 (R:139, G:0, B:0) | 经典优雅 |
| 工作类 | COCKTAIL | 琥珀色 (R:212, G:160, B:23) | 专业稳重 |
| 程序类 | BEAKER | 荧光绿 (R:0, G:255, B:127) | 科技感 |
| 日常类 | MASON | 暖橙色 (R:255, G:140, B:0) | 亲切温暖 |
| 科学类 | FLASK | 透明蓝 (R:135, G:206, B:250) | 纯净清新 |
| 跨界类 | MARTINI | 混色渐变 | 多彩创新 |

### 3.2 动画参数

液体填充动画使用 React Native Reanimated：

```typescript
// 动画配置
const ANIMATION_CONFIG = {
  damping: 12,        // 阻尼系数 - 控制振动减速
  stiffness: 100,     // 刚度系数 - 控制弹簧速度
  mass: 1,            // 质量
};

// 液体填充逻辑
const liquidHeight = (completion / 100) * totalHeight * 0.7;
// 液体从底部70%空间开始填充，顶部30%留白
```

### 3.3 杯子造型

每种杯子类型有独特的视觉样式（简化实现）：

| 类型 | 样式特征 | borderRadius |
|------|---------|--------------|
| 白兰地杯 | 圆润宽口设计 | 40px |
| 香槟杯 | 细长杯身 | 5px |
| 红酒杯 | 经典弧形杯身 | 15px |
| 古典杯 | 方正厚实杯壁 | 8px |
| 烧杯 | 实验室风格刻度 | 10px |
| 梅森罐 | 宽口瓶身金属盖 | 12px |
| 锥形瓶 | 底部宽顶部窄 | 底部40px顶部8px |
| 马天尼杯 | 三角形杯身 | 锥形渐变 |

---

## 四、实现逻辑

### 4.1 组件核心逻辑流程

```text
输入参数 → 计算尺寸 → 渲染杯子造型 → 计算液体高度
    ↓
应用液体动画 ← 返回可交互组件 ← 设置颜色和透明度
```

### 4.2 液体高度计算

```typescript
// 关键逻辑
const { width, height } = sizeValues[size];
const liquidHeight = (completion / 100) * height * 0.7;
// 液体高度 = (完成度 / 100) × 总高度 × 0.7
// 0.7 系数确保液体只填充杯子70%空间，顶部留白

// 位置：底部15%处开始
bottom: height * 0.15,
width: width * 0.8,
left: width * 0.1,
```

### 4.3 关键代码实现

组件已实现的核心功能（见源码）：
- 动态尺寸计算
- 8种杯子类型的样式区分
- 液体填充动画（弹簧动画）
- TouchableOpacity 交互
- 状态下的液体颜色应用

---

## 五、验收标准

### 5.1 功能验收

| 测试项 | 通过标准 | 验证方式 |
|--------|----------|----------|
| 杯子显示 | 8种类型正确显示 | 手动测试 |
| 液体填充 | 完成度与液体高度正比 | 手动测试 |
| 动画效果 | 液体填充平滑有弹性 | 手动测试 |
| 交互响应 | 点击/长按事件正确触发 | 手动测试 |
| 尺寸适配 | 三种尺寸正确显示 | 手动测试 |

### 5.2 代码验收

| 测试项 | 通过标准 | 验证方式 |
|--------|----------|----------|
| TypeScript | 无类型错误 | `npm run ts:check` |
| 代码规范 | 符合 CODE_STANDARDS.md | 代码审查 |
| 组件纯度 | 无副作用、无本地状态 | 代码审查 |
| Props完整性 | 所有必要属性已定义 | 类型检查 |

---

## 六、扩展建议

### 6.1 可增强功能（待实现）

1. **更精细的杯身造型**
   - 当前实现是简化版本，可以使用 SVG 或自定义绘制
   - 可添加高光效果、玻璃折射效果

2. **气泡动画**
   - 在液体中添加上升的小气泡
   - 增强视觉吸引力

3. **液体波动效果**
   - 当组件被选中或交互时，液体有轻微波动
   - 模拟真实液体的物理效果

4. **颜色渐变**
   - 液体可以使用渐变而非纯色
   - 顶部浅、底部深，增强立体感

5. **杯身装饰元素**
   - 根据灵感状态添加小图标装饰
   - 例如：种子状态加嫩芽图标、绽放状态加星星

### 6.2 优化方向

- 性能优化：减少不必要的 re-render
- 内存优化：大列表使用虚拟化
- 动画优化：避免过度动画导致卡顿

---

## 七、参考信息

### 7.1 相关文件

- 组件实现：[src/components/Glass/index.tsx](file:///d:/OneDrive/项目/inspiration-bartender/src/components/Glass/index.tsx)
- 类型定义：[src/types/index.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/types/index.ts)
- 主题配置：[src/constants/theme.ts](file:///d:/OneDrive/项目/inspiration-bartender/src/constants/theme.ts)
- 使用位置：BarScreen、DetailScreen、BrewingScreen 等

### 7.2 相关规范

- 代码规范：CODE_STANDARDS.md
- React Native 组件规范：遵循 Expo 最佳实践
- 动画库：react-native-reanimated v2+

---

**文档版本**：v1.0
**创建日期**：2026-06-16
**最后更新**：2026-06-16
