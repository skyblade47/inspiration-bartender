import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, IconButton, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList, Inspiration, MixedResult, Recipe } from '../../types';
import { useCollisionStore, CollisionPhase } from '../../store/collisionStore';
import { useInspirationStore } from '../../store/inspirationStore';
import { ShakeAnimation } from './ShakeAnimation';
import { RecipeCard } from './RecipeCard';
import { barColors } from '../../constants/theme';
import { ShakePhase, MixType } from '../../types';
import { initConfigDatabase, initLLMService, MessageRole } from '../../services/llm';
import { parseJsonFromLLMResponse } from '../../utils';

type CollisionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Collision'>;
type CollisionScreenRouteProp = RouteProp<RootStackParamList, 'Collision'>;

// TODO: [Phase 3] 模拟生成配方 - 临时占位实现（v1.1 已接入 LLM）
// 注：此为 Phase 3 "灵感碰撞" 的占位代码，保留作为 LLM 失败时的回退
// 参考设计文档：docs/specs/collision-system.md
const generateMockRecipes = (count: number): Recipe[] => {
  const titles = [
    '跨界融合创作方案',
    '情感共鸣设计方案',
    '技术突破创新计划',
    '用户体验优化策略',
    '内容创作新思路',
    '品牌联动营销方案',
  ];

  const descriptions = [
    '将不同领域的灵感元素进行有机融合，创造出独特且富有创意的解决方案。',
    '深挖用户情感需求，通过共鸣点建立深层次的连接。',
    '聚焦技术创新，寻找突破传统局限的方法。',
    '从用户视角出发，优化每一个接触点的体验。',
    '探索内容创作的新形式和新表达。',
    '整合多个品牌资源，创造跨界合作机会。',
  ];

  const keywords = [
    ['创新', '融合', '跨界', '协同'],
    ['情感', '共鸣', '连接', '体验'],
    ['技术', '突破', '前沿', '智能'],
    ['优化', '体验', '用户', '交互'],
    ['创作', '内容', '叙事', '表达'],
    ['联动', '品牌', '营销', '传播'],
  ];

  const directions = [
    ['实施路径规划', '资源整合方案', '风险评估应对'],
    ['用户调研分析', '原型测试验证', '迭代优化计划'],
    ['技术选型对比', '实现方案设计', '效果预估分析'],
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `recipe-${i}-${Date.now()}`,
    title: titles[i % titles.length],
    description: descriptions[i % descriptions.length],
    keywords: keywords[i % keywords.length],
    directions: directions[i % directions.length],
    score: 60 + Math.floor(Math.random() * 40),
  }));
};

// 模拟混合结果（LLM 失败时使用）
const generateMockMixedResult = (): MixedResult => ({
  mixedColor: '#9B59B6',
  mixType: MixType.BLEND,
  keywords: ['创新', '融合', '跨界'],
  moods: ['活跃', '期待', '兴奋'],
  combinedContent: '多种灵感元素正在融合碰撞，产生全新的创意火花...',
});

/**
 * 使用 LLM 生成碰撞结果
 * 失败时回退到模拟数据
 */
async function generateLLMResult(
  selectedInspirations: Inspiration[],
  completeCollision: (result: MixedResult, recipes: Recipe[]) => void
) {
  try {
    await initConfigDatabase();
    const llmService = await initLLMService();

    if (!llmService) {
      completeCollision(generateMockMixedResult(), generateMockRecipes(3));
      return;
    }

    const inspirationDescriptions = selectedInspirations
      .map(i => `- ${i.name}: ${i.rawInput?.text || i.name}`)
      .join('\n');

    const mixResponse = await llmService.chat({
      messages: [
        {
          role: MessageRole.SYSTEM,
          content: '你是一位富有创意的灵感调酒师。根据用户提供的多个灵感，生成一个融合结果。',
        },
        {
          role: MessageRole.USER,
          content: `请基于以下灵感生成融合结果，返回 JSON 格式：\n${inspirationDescriptions}\n\n返回格式：\n{"keywords": ["关键词1", "关键词2", ...], "moods": ["情绪1", "情绪2"], "combinedContent": "融合后的内容描述"}`,
        },
      ],
      maxTokens: 300,
    });

    const parsedMix = parseJsonFromLLMResponse<{ keywords?: string[]; moods?: string[]; combinedContent?: string }>(
      mixResponse.content,
      { keywords: [], moods: [], combinedContent: '' }
    );

    const mixedResult: MixedResult = {
      mixedColor: '#9B59B6',
      mixType: MixType.BLEND,
      keywords: parsedMix.keywords || ['创新', '融合'],
      moods: parsedMix.moods || ['活跃', '期待'],
      combinedContent: parsedMix.combinedContent || '多种灵感元素正在融合碰撞...',
    };

    const recipeResponse = await llmService.chat({
      messages: [
        {
          role: MessageRole.SYSTEM,
          content: '你是一位富有创意的灵感调酒师。基于灵感融合结果，生成 3 个创意配方方案。',
        },
        {
          role: MessageRole.USER,
          content: `基于融合关键词：${mixedResult.keywords.join('、')}，生成 3 个配方方案。\n\n返回 JSON 格式：\n{"recipes": [{"title": "标题", "description": "描述", "keywords": ["k1", "k2"], "directions": ["步骤1", "步骤2", "步骤3"]}]}`,
        },
      ],
      maxTokens: 800,
    });

    const parsedRecipes = parseJsonFromLLMResponse<{ recipes?: Array<{ title?: string; description?: string; keywords?: string[]; directions?: string[] }> }>(
      recipeResponse.content,
      { recipes: [] }
    );

    let recipes: Recipe[] = (parsedRecipes.recipes || []).map((r, i) => ({
      id: `recipe-${i}-${Date.now()}`,
      title: r.title || `方案 ${i + 1}`,
      description: r.description || '',
      keywords: r.keywords || [],
      directions: r.directions || [],
      score: 70 + Math.floor(Math.random() * 30),
    }));

    if (recipes.length === 0) {
      recipes = generateMockRecipes(3);
    }

    completeCollision(mixedResult, recipes);
  } catch (error) {
    console.error('LLM 碰撞生成失败:', error);
    completeCollision(generateMockMixedResult(), generateMockRecipes(3));
  }
}

export const CollisionScreen: React.FC = () => {
  const navigation = useNavigation<CollisionScreenNavigationProp>();
  const route = useRoute<CollisionScreenRouteProp>();
  const insets = useSafeAreaInsets();
  
  // 状态
  const {
    phase,
    selectedInspirations,
    recipes,
    shakeAnimation,
    setPhase,
    toggleInspirationSelection,
    clearSelection,
    startCollision,
    updateShakeAnimation,
    completeCollision,
    selectRecipe,
    reset,
  } = useCollisionStore();

  const { inspirations, loadInspirations } = useInspirationStore();

  // 初始化加载
  useEffect(() => {
    loadInspirations();
    return () => {
      // 清理状态
      reset();
    };
  }, [loadInspirations, reset]);

  // 处理动画阶段
  useEffect(() => {
    if (phase !== CollisionPhase.ANIMATING) return;

    let currentPhase: ShakePhase = ShakePhase.POUR;
    let progress = 0;
    let timer: ReturnType<typeof setTimeout>;

    const runAnimation = () => {
      const phases: ShakePhase[] = [ShakePhase.POUR, ShakePhase.SHAKE, ShakePhase.POUR_OUT];
      const phaseDuration = [2000, 3000, 1500];
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        let totalElapsed = 0;

        for (let i = 0; i < phaseDuration.length; i++) {
          totalElapsed += phaseDuration[i];
          if (elapsed < totalElapsed) {
            const phaseElapsed = elapsed - (totalElapsed - phaseDuration[i]);
            currentPhase = phases[i];
            progress = phaseElapsed / phaseDuration[i];
            break;
          }
        }

        updateShakeAnimation(currentPhase, progress);

        if (elapsed < phaseDuration.reduce((a, b) => a + b, 0)) {
          timer = setTimeout(animate, 16);
        } else {
          // 动画完成 - 接入真实 LLM 生成混合结果和配方
          generateLLMResult(selectedInspirations, completeCollision);
        }
      };

      animate();
    };

    runAnimation();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, updateShakeAnimation, completeCollision, selectedInspirations]);

  // 返回吧台
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // 开始碰撞
  const handleStartCollision = useCallback(() => {
    if (selectedInspirations.length < 2) {
      console.log('[Collision] 至少需要选择2个灵感');
      return;
    }
    startCollision();
  }, [selectedInspirations, startCollision]);

  // 选择配方后继续
  const handleRecipeSelected = useCallback((recipe: Recipe) => {
    selectRecipe(recipe);
    // 可以在这里导航到下一个屏幕或执行其他操作
    console.log('[Collision] 选择了配方:', recipe.title);
  }, [selectRecipe]);

  // 重新开始
  const handleRestart = useCallback(() => {
    reset();
    clearSelection();
  }, [reset, clearSelection]);

  // ============================================================
  // 渲染：选择阶段
  // ============================================================
  const renderSelectPhase = () => (
    <View style={styles.selectContainer}>
      {/* 标题栏 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon="arrow-left"
          iconColor={barColors.text}
          size={24}
          onPress={handleBack}
        />
        <Text style={styles.headerTitle}>选择灵感</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* 说明文字 */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          选择 2-3 个灵感进行碰撞融合
        </Text>
        <Text style={styles.selectedCount}>
          已选择: {selectedInspirations.length}/3
        </Text>
      </View>

      {/* 灵感列表 */}
      <ScrollView
        style={styles.inspirationsList}
        contentContainerStyle={[styles.inspirationsContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {inspirations.map((inspiration) => {
          const isSelected = selectedInspirations.some(i => i.id === inspiration.id);
          return (
            <TouchableOpacity
              key={inspiration.id}
              style={[
                styles.inspirationItem,
                isSelected && styles.inspirationItemSelected,
              ]}
              onPress={() => toggleInspirationSelection(inspiration)}
              activeOpacity={0.7}
            >
              <View style={styles.inspirationInfo}>
                <Text style={styles.inspirationName}>{inspiration.name}</Text>
                <Text style={styles.inspirationType}>{inspiration.type}</Text>
              </View>
              {isSelected && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 底部操作 */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          mode="outlined"
          onPress={clearSelection}
          style={styles.clearButton}
          textColor={barColors.textSecondary}
        >
          清空选择
        </Button>
        <Button
          mode="contained"
          onPress={handleStartCollision}
          style={styles.collisionButton}
          buttonColor={barColors.primary}
          textColor={barColors.background}
          disabled={selectedInspirations.length < 2}
        >
          开始碰撞
        </Button>
      </View>
    </View>
  );

  // ============================================================
  // 渲染：动画阶段
  // ============================================================
  const renderAnimatingPhase = () => (
    <View style={styles.animatingContainer}>
      <ShakeAnimation
        phase={shakeAnimation.phase}
        progress={shakeAnimation.progress}
        colors={shakeAnimation.colors}
      />
    </View>
  );

  // ============================================================
  // 渲染：配方阶段
  // ============================================================
  const renderRecipesPhase = () => (
    <View style={styles.recipesContainer}>
      {/* 标题栏 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <IconButton
          icon="arrow-left"
          iconColor={barColors.text}
          size={24}
          onPress={handleBack}
        />
        <Text style={styles.headerTitle}>碰撞结果</Text>
        <IconButton
          icon="refresh"
          iconColor={barColors.text}
          size={24}
          onPress={handleRestart}
        />
      </View>

      {/* 结果说明 */}
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>✨ 灵感融合成功！</Text>
        <Text style={styles.resultSubtitle}>
          产生了 {recipes.length} 个创意方案
        </Text>
      </View>

      {/* 配方列表 */}
      <ScrollView
        style={styles.recipesList}
        contentContainerStyle={[styles.recipesContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {recipes.map((recipe, index) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            rank={index + 1}
            mixColors={shakeAnimation.colors}
            onPress={handleRecipeSelected}
          />
        ))}
      </ScrollView>

      {/* 底部操作 */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          mode="outlined"
          onPress={handleRestart}
          style={styles.clearButton}
          textColor={barColors.textSecondary}
        >
          重新碰撞
        </Button>
        <Button
          mode="contained"
          onPress={handleBack}
          style={styles.collisionButton}
          buttonColor={barColors.primary}
          textColor={barColors.background}
        >
          完成
        </Button>
      </View>
    </View>
  );

  // ============================================================
  // 主渲染
  // ============================================================
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {phase === CollisionPhase.SELECT && renderSelectPhase()}
      {phase === CollisionPhase.ANIMATING && renderAnimatingPhase()}
      {phase === CollisionPhase.RECIPES && renderRecipesPhase()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: barColors.background,
  },
  // 选择阶段样式
  selectContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: barColors.text,
  },
  instructionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  instructionText: {
    fontSize: 16,
    color: barColors.textSecondary,
  },
  selectedCount: {
    fontSize: 14,
    color: barColors.primary,
    marginTop: 8,
    fontWeight: '600',
  },
  inspirationsList: {
    flex: 1,
  },
  inspirationsContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  inspirationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: barColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inspirationItemSelected: {
    borderColor: barColors.primary,
    backgroundColor: `${barColors.primary}15`,
  },
  inspirationInfo: {
    flex: 1,
  },
  inspirationName: {
    fontSize: 16,
    fontWeight: '600',
    color: barColors.text,
  },
  inspirationType: {
    fontSize: 12,
    color: barColors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: barColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: barColors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  // 动画阶段样式
  animatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 配方阶段样式
  recipesContainer: {
    flex: 1,
  },
  resultInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: barColors.text,
  },
  resultSubtitle: {
    fontSize: 14,
    color: barColors.textSecondary,
    marginTop: 8,
  },
  recipesList: {
    flex: 1,
  },
  recipesContent: {
    paddingBottom: 20,
  },
  // 底部操作样式
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: barColors.background,
    borderTopWidth: 1,
    borderTopColor: barColors.outline,
  },
  clearButton: {
    flex: 1,
    marginRight: 12,
    borderColor: barColors.outline,
  },
  collisionButton: {
    flex: 2,
  },
});
