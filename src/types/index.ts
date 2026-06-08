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

export type RootStackParamList = {
  Bar: undefined;
  Capture: undefined;
  Detail: { inspirationId: string };
};
