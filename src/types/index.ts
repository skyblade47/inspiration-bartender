export enum GlassType {
  BRANDY = 'brandy',
  CHAMPAGNE = 'champagne',
  WINE = 'wine',
  COCKTAIL = 'cocktail',
  BEAKER = 'beaker',
  MASON = 'mason',
  FLASK = 'flask',
  MARTINI = 'martini',
}

export enum InspirationStatus {
  SEED = 'seed',
  SPROUT = 'sprout',
  GROW = 'grow',
  BUD = 'bud',
  BLOOM = 'bloom',
}

export enum MixType {
  LAYER = 'layer',     // 分层
  BLEND = 'blend',     // 混色
}

export interface RawInput {
  text: string;
  images?: string[];
  voice?: string;
  link?: string;
}

export interface Inspiration {
  id: string;
  name: string;
  type: GlassType;
  completion: number;
  status: InspirationStatus;
  
  rawInput: RawInput;
  brewingLog: any[];
  brainstormCards: any[];
  collisionHistory: any[];
  structuredContent: any;
  
  createdAt: number;
  updatedAt: number;
}

/**
 * 配方建议
 */
export interface Recipe {
  id: string;
  title: string;                  // 方案标题
  description: string;           // 详细描述
  keywords: string[];            // 关键词
  directions: string[];           // 可能的发展方向
  score: number;                 // 创意评分
}

/**
 * 碰撞记录
 */
export interface CollisionRecord {
  id: string;
  sourceInspirationIds: string[]; // 源灵感 ID 列表（2-3个）
  resultInspirationId?: string;    // 生成的新灵感 ID
  
  // 碰撞过程
  mixType: MixType;              // 分层 or 混色
  mixColors: string[];           // 混合颜色
  
  // 配方建议
  recipes: Recipe[];
  selectedRecipe?: Recipe;
  
  createdAt: number;
}

/**
 * 混合结果
 */
export interface MixedResult {
  mixedColor: string;
  mixType: MixType;
  keywords: string[];
  moods: string[];
  combinedContent: string;
}

/**
 * 摇晃动画阶段
 */
export enum ShakePhase {
  POUR = 'pour',                 // 倒入
  SHAKE = 'shake',              // 摇晃
  POUR_OUT = 'pour_out',         // 倒出
}

export interface ShakeAnimation {
  phase: ShakePhase;
  progress: number;              // 0-1
  colors: string[];             // 当前颜色
}

export type RootStackParamList = {
  Bar: undefined;
  Capture: undefined;
  Detail: { inspirationId: string };
  Brewing: { inspirationId: string };
  Collision: { selectedIds: string[] };
};
