import { create } from 'zustand';
import type { 
  Inspiration, 
  CollisionRecord, 
  Recipe,
  MixedResult 
} from '../types';
import { MixType, ShakePhase } from '../types';

// ============================================================
// 碰撞界面阶段
// ============================================================
export enum CollisionPhase {
  SELECT = 'select',       // 选择阶段 - 选择要碰撞的灵感
  ANIMATING = 'animating', // 动画阶段 - 播放碰撞动画
  RECIPES = 'recipes',      // 配方阶段 - 展示生成的配方
}

// ============================================================
// 液体层类型 - 用于碰撞动画可视化
// ============================================================
export interface CollisionLiquidLayer {
  id: string;
  inspirationId: string;
  color: string;
  volume: number;  // 0-100
  opacity: number;
}

// ============================================================
// 碰撞状态接口
// ============================================================
interface CollisionStore {
  // 当前阶段
  phase: CollisionPhase;
  
  // 已选择的灵感列表（用于碰撞）
  selectedInspirations: Inspiration[];
  
  // 当前碰撞记录
  currentCollision: CollisionRecord | null;
  
  // 混合结果
  mixedResult: MixedResult | null;
  
  // 生成的配方列表
  recipes: Recipe[];
  
  // 摇晃动画状态
  shakeAnimation: {
    phase: ShakePhase;
    progress: number;  // 0-1
    colors: string[];
  };
  
  // 液体层列表（用于可视化）
  liquidLayers: CollisionLiquidLayer[];
  
  // 操作方法
  // 阶段控制
  setPhase: (phase: CollisionPhase) => void;
  
  // 选择操作
  toggleInspirationSelection: (inspiration: Inspiration) => void;
  clearSelection: () => void;
  
  // 碰撞流程
  startCollision: () => void;
  updateShakeAnimation: (phase: ShakePhase, progress: number, colors?: string[]) => void;
  completeCollision: (mixedResult: MixedResult, recipes: Recipe[]) => void;
  
  // 配方操作
  selectRecipe: (recipe: Recipe) => void;
  
  // 重置
  reset: () => void;
}

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 初始状态
const initialState = {
  phase: CollisionPhase.SELECT,
  selectedInspirations: [],
  currentCollision: null,
  mixedResult: null,
  recipes: [],
  shakeAnimation: {
    phase: ShakePhase.POUR,
    progress: 0,
    colors: [],
  },
  liquidLayers: [],
};

// 根据杯子类型获取液体颜色
const getLiquidColorByGlassType = (glassType: string): string => {
  const colorMap: Record<string, string> = {
    brandy: '#1E3A5F',
    champagne: '#9B59B6',
    wine: '#8B0000',
    cocktail: '#D4A017',
    beaker: '#00FF7F',
    mason: '#FF8C00',
    flask: '#87CEEB',
    martini: 'linear-gradient(135deg, #D4A017 0%, #9B59B6 100%)',
  };
  return colorMap[glassType] || '#D4A017';
};

export const useCollisionStore = create<CollisionStore>((set, get) => ({
  ...initialState,

  // 设置当前阶段
  setPhase: (phase) => {
    set({ phase });
  },

  // 切换灵感选择状态
  toggleInspirationSelection: (inspiration) => {
    const { selectedInspirations } = get();
    const isSelected = selectedInspirations.some(i => i.id === inspiration.id);
    
    if (isSelected) {
      // 取消选择
      set({
        selectedInspirations: selectedInspirations.filter(i => i.id !== inspiration.id),
      });
    } else {
      // 选择（最多3个）
      if (selectedInspirations.length >= 3) {
        console.log('[Collision] 最多只能选择3个灵感进行碰撞');
        return;
      }
      set({
        selectedInspirations: [...selectedInspirations, inspiration],
      });
    }
  },

  // 清空选择
  clearSelection: () => {
    set({ selectedInspirations: [] });
  },

  // 开始碰撞流程
  startCollision: () => {
    const { selectedInspirations } = get();
    
    if (selectedInspirations.length < 2) {
      console.log('[Collision] 至少需要选择2个灵感进行碰撞');
      return;
    }

    // 创建碰撞记录
    const collisionRecord: CollisionRecord = {
      id: generateId(),
      sourceInspirationIds: selectedInspirations.map(i => i.id),
      mixType: MixType.BLEND,
      mixColors: selectedInspirations.map(i => getLiquidColorByGlassType(i.type)),
      recipes: [],
      createdAt: Date.now(),
    };

    // 初始化液体层
    const liquidLayers: CollisionLiquidLayer[] = selectedInspirations.map((inspiration, index) => ({
      id: generateId(),
      inspirationId: inspiration.id,
      color: getLiquidColorByGlassType(inspiration.type),
      volume: 100 / selectedInspirations.length,
      opacity: 0.8,
    }));

    set({
      currentCollision: collisionRecord,
      liquidLayers,
      phase: CollisionPhase.ANIMATING,
      shakeAnimation: {
        phase: ShakePhase.POUR,
        progress: 0,
        colors: selectedInspirations.map(i => getLiquidColorByGlassType(i.type)),
      },
    });
  },

  // 更新摇晃动画状态
  updateShakeAnimation: (phase, progress, colors) => {
    set(state => ({
      shakeAnimation: {
        ...state.shakeAnimation,
        phase,
        progress,
        colors: colors || state.shakeAnimation.colors,
      },
    }));
  },

  // 完成碰撞
  completeCollision: (mixedResult, recipes) => {
    const { currentCollision } = get();
    
    if (!currentCollision) return;

    // 更新碰撞记录
    const updatedCollision: CollisionRecord = {
      ...currentCollision,
      resultInspirationId: generateId(), // 后续会关联到实际的灵感
      recipes,
    };

    set({
      currentCollision: updatedCollision,
      mixedResult,
      recipes,
      phase: CollisionPhase.RECIPES,
      shakeAnimation: {
        phase: ShakePhase.POUR_OUT,
        progress: 1,
        colors: [mixedResult.mixedColor],
      },
    });
  },

  // 选择配方
  selectRecipe: (recipe) => {
    const { currentCollision } = get();
    
    if (!currentCollision) return;

    set({
      currentCollision: {
        ...currentCollision,
        selectedRecipe: recipe,
      },
    });
  },

  // 重置状态
  reset: () => {
    set(initialState);
  },
}));
