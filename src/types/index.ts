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
  LAYER = 'layer',
  BLEND = 'blend',
}

export interface RawInput {
  text: string;
  images?: string[];
  voice?: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface BrainstormCard {
  id: string;
  title: string;
  content: string;
  color: string;
  createdAt: number;
}

export interface StructuredContent {
  title?: string;
  summary?: string;
  categories?: string[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  steps?: string[];
  plan?: string;
  actions?: string[];
}

export interface Inspiration {
  id: string;
  name: string;
  type: GlassType;
  completion: number;
  status: InspirationStatus;
  
  rawInput: RawInput;
  brewingLog: ChatMessage[];
  brainstormCards: BrainstormCard[];
  collisionHistory: CollisionRecord[];
  structuredContent: StructuredContent;
  
  createdAt: number;
  updatedAt: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  directions: string[];
  score: number;
}

export interface CollisionRecord {
  id: string;
  sourceInspirationIds: string[];
  resultInspirationId?: string;
  
  mixType: MixType;
  mixColors: string[];
  
  recipes: Recipe[];
  selectedRecipe?: Recipe;
  
  createdAt: number;
}

export interface MixedResult {
  mixedColor: string;
  mixType: MixType;
  keywords: string[];
  moods: string[];
  combinedContent: string;
}

export enum ShakePhase {
  POUR = 'pour',
  SHAKE = 'shake',
  POUR_OUT = 'pour_out',
}

export interface ShakeAnimation {
  phase: ShakePhase;
  progress: number;
  colors: string[];
}

export type RootStackParamList = {
  Bar: undefined;
  Capture: undefined;
  Detail: { inspirationId: string };
  Brewing: { inspirationId: string };
  Collision: { selectedIds: string[] };
  Export: undefined;
  LLMSettings: undefined;
};
