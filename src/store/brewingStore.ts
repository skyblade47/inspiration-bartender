import { create } from 'zustand';
import { GlassType, InspirationStatus } from '../types';

// 对话消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// 液体层类型 - 用于可视化展示
export interface LiquidLayer {
  id: string;
  name: string;
  color: string;
  volume: number; // 0-100
  opacity: number;
}

// 调酒步骤类型
export interface BrewingStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number; // 0-100
}

// 调酒状态接口
interface BrewingStore {
  // 基础状态
  inspirationId: string | null;
  name: string;
  glassType: GlassType;
  completion: number;
  status: InspirationStatus;

  // 对话相关
  messages: ChatMessage[];
  isTyping: boolean;

  // 液体可视化
  liquidLayers: LiquidLayer[];
  isPouring: boolean;
  pourAnimation: {
    active: boolean;
    source: string;
    target: string;
    progress: number;
  };

  // 调酒步骤
  steps: BrewingStep[];
  currentStepIndex: number;

  // 用户输入
  userInput: string;
  isProcessing: boolean;

  // 操作方法
  initialize: (id: string, name: string, glassType: GlassType) => void;
  addMessage: (role: ChatMessage['role'], content: string) => void;
  setTyping: (isTyping: boolean) => void;
  setUserInput: (input: string) => void;
  submitUserInput: () => Promise<void>;
  
  // 液体操作
  addLiquidLayer: (layer: Omit<LiquidLayer, 'id'>) => void;
  updateLiquidLayer: (id: string, data: Partial<LiquidLayer>) => void;
  removeLiquidLayer: (id: string) => void;
  startPourAnimation: (source: string, target: string) => void;
  stopPourAnimation: () => void;

  // 步骤操作
  setCurrentStep: (index: number) => void;
  updateStepProgress: (stepId: string, progress: number) => void;
  completeStep: (stepId: string) => void;

  // 状态更新
  setCompletion: (value: number) => void;
  setStatus: (status: InspirationStatus) => void;
  reset: () => void;
}

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 初始状态
const initialState = {
  inspirationId: null,
  name: '',
  glassType: GlassType.COCKTAIL,
  completion: 0,
  status: InspirationStatus.SEED,
  messages: [],
  isTyping: false,
  liquidLayers: [],
  isPouring: false,
  pourAnimation: {
    active: false,
    source: '',
    target: '',
    progress: 0,
  },
  steps: [],
  currentStepIndex: 0,
  userInput: '',
  isProcessing: false,
};

export const useBrewingStore = create<BrewingStore>((set, get) => ({
  ...initialState,

  // 初始化调酒会话
  initialize: (id, name, glassType) => {
    set({
      inspirationId: id,
      name,
      glassType,
      messages: [{
        id: generateId(),
        role: 'system',
        content: `欢迎来到灵感调酒台！您选择了${glassType}，让我们开始创作吧。`,
        timestamp: Date.now(),
      }],
      steps: [
        { id: '1', name: '收集灵感', description: '输入您的原始灵感', status: 'in_progress', progress: 0 },
        { id: '2', name: '提炼精华', description: '从灵感中提取核心元素', status: 'pending', progress: 0 },
        { id: '3', name: '混合调配', description: '将元素进行创意组合', status: 'pending', progress: 0 },
        { id: '4', name: '沉淀发酵', description: '让创意自然成熟', status: 'pending', progress: 0 },
        { id: '5', name: '品鉴呈现', description: '输出最终成果', status: 'pending', progress: 0 },
      ],
      currentStepIndex: 0,
    });
  },

  // 添加对话消息
  addMessage: (role, content) => {
    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: Date.now(),
    };
    set(state => ({
      messages: [...state.messages, message],
    }));
  },

  // 设置打字状态
  setTyping: (isTyping) => {
    set({ isTyping });
  },

  // 设置用户输入
  setUserInput: (input) => {
    set({ userInput: input });
  },

  // 提交用户输入
  submitUserInput: async () => {
    const { userInput, addMessage, setTyping, isProcessing } = get();
    if (!userInput.trim() || isProcessing) return;

    // 添加用户消息
    addMessage('user', userInput);
    set({ userInput: '', isProcessing: true });

    // 模拟AI响应
    setTyping(true);
    
    // 这里后续会接入实际的AI服务
    // 目前使用模拟响应
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const responses = [
      '这是一个很有趣的想法！让我帮您进一步探索...',
      '我感受到了您灵感的核心，让我们继续深化它...',
      '这个角度很独特，我来为您调配一下...',
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    addMessage('assistant', randomResponse);
    setTyping(false);
    set({ isProcessing: false });
  },

  // 添加液体层
  addLiquidLayer: (layer) => {
    const newLayer: LiquidLayer = {
      ...layer,
      id: generateId(),
    };
    set(state => ({
      liquidLayers: [...state.liquidLayers, newLayer],
    }));
  },

  // 更新液体层
  updateLiquidLayer: (id, data) => {
    set(state => ({
      liquidLayers: state.liquidLayers.map(layer =>
        layer.id === id ? { ...layer, ...data } : layer
      ),
    }));
  },

  // 移除液体层
  removeLiquidLayer: (id) => {
    set(state => ({
      liquidLayers: state.liquidLayers.filter(layer => layer.id !== id),
    }));
  },

  // 开始倾倒动画
  startPourAnimation: (source, target) => {
    set({
      isPouring: true,
      pourAnimation: {
        active: true,
        source,
        target,
        progress: 0,
      },
    });
  },

  // 停止倾倒动画
  stopPourAnimation: () => {
    set({
      isPouring: false,
      pourAnimation: {
        active: false,
        source: '',
        target: '',
        progress: 0,
      },
    });
  },

  // 设置当前步骤
  setCurrentStep: (index) => {
    set(state => ({
      currentStepIndex: index,
      steps: state.steps.map((step, i) => ({
        ...step,
        status: i < index ? 'completed' : i === index ? 'in_progress' : 'pending',
      })),
    }));
  },

  // 更新步骤进度
  updateStepProgress: (stepId, progress) => {
    set(state => ({
      steps: state.steps.map(step =>
        step.id === stepId ? { ...step, progress } : step
      ),
    }));
  },

  // 完成步骤
  completeStep: (stepId) => {
    set(state => {
      const stepIndex = state.steps.findIndex(s => s.id === stepId);
      const nextIndex = stepIndex + 1;
      return {
        steps: state.steps.map((step, i) => {
          if (step.id === stepId) {
            return { ...step, status: 'completed', progress: 100 };
          }
          if (i === nextIndex && nextIndex < state.steps.length) {
            return { ...step, status: 'in_progress' };
          }
          return step;
        }),
        currentStepIndex: nextIndex < state.steps.length ? nextIndex : state.currentStepIndex,
      };
    });
  },

  // 设置完成度
  setCompletion: (value) => {
    set({ completion: Math.min(100, Math.max(0, value)) });
  },

  // 设置状态
  setStatus: (status) => {
    set({ status });
  },

  // 重置状态
  reset: () => {
    set(initialState);
  },
}));
