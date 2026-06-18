
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Button, 
  Divider,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { useInspirationStore } from '../../store/inspirationStore';
import { Glass } from '../../components/Glass';
import { ScoringSection } from '../../components/ScoringSection';
import { CommentSection } from '../../components/CommentSection';
import { glassConfigs } from '../../constants/glassTypes';
import { barColors } from '../../constants/theme';
import { quickScoreInspiration, deepScoreInspiration, ScoringResult, DeepScoringResult } from '../../services/scoring';

type DetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type DetailScreenRouteProp = RouteProp<RootStackParamList, 'Detail'>;

export const DetailScreen: React.FC = () => {
  const navigation = useNavigation<DetailScreenNavigationProp>();
  const route = useRoute<DetailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { inspirationId } = route.params;
  const { getInspiration, deleteInspiration, isLoading } = useInspirationStore();
  
  const inspiration = getInspiration(inspirationId);
  
  const [scoringResult, setScoringResult] = useState<ScoringResult | DeepScoringResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (inspiration) {
      const result = quickScoreInspiration(inspiration);
      setScoringResult(result);
    }
  }, [inspiration]);

  const handleDeepScore = async () => {
    if (!inspiration) return;
    
    setIsAnalyzing(true);
    setHasError(false);
    try {
      const result = await deepScoreInspiration(inspiration);
      setScoringResult(result);
      if (result.source === 'local' && result.llmComment?.includes('失败')) {
        setHasError(true);
      }
    } catch (error) {
      console.error('深度评分失败:', error);
      setHasError(true);
      setErrorMessage('深度分析失败，请稍后重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    await deleteInspiration(inspirationId);
    navigation.goBack();
  };

  if (!inspiration) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={barColors.primary} />
      </View>
    );
  }

  const glassConfig = glassConfigs[inspiration.type];
  const formattedDate = new Date(inspiration.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      {/* 杯子展示 */}
      <View style={styles.glassSection}>
        <Glass
          type={inspiration.type}
          completion={inspiration.completion}
          status={inspiration.status}
          size="large"
        />
        <Text style={styles.completionText}>
          完成度: {inspiration.completion}%
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* 基本信息 */}
      <View style={styles.section}>
        <Text style={styles.title}>{inspiration.name}</Text>
        <Text style={styles.typeLabel}>
          {glassConfig.icon} {glassConfig.label}
        </Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      <Divider style={styles.divider} />

      {/* 评分区域 */}
      <View style={styles.section}>
        <ScoringSection
          inspiration={inspiration}
          scoringResult={scoringResult}
          onDeepScore={handleDeepScore}
          isAnalyzing={isAnalyzing}
          hasError={hasError}
        />
      </View>

      {/* AI评语区域 - 仅当LLM评分成功后显示 */}
      {scoringResult && 'llmComment' in scoringResult && scoringResult.source === 'llm' && (
        <>
          <Divider style={styles.divider} />
          <CommentSection
            llmComment={scoringResult.llmComment || ''}
            llmSuggestions={scoringResult.llmSuggestions || []}
          />
        </>
      )}

      <Divider style={styles.divider} />

      {/* 灵感内容 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>灵感内容</Text>
        <Text style={styles.contentText}>
          {inspiration.rawInput.text}
        </Text>
      </View>

      <Divider style={styles.divider} />

      {/* 操作按钮 */}
      <View style={styles.buttonsContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
          textColor={barColors.text}
        >
          返回
        </Button>
        <Button
          mode="contained"
          onPress={handleDelete}
          style={styles.button}
          buttonColor="#8B0000"
          textColor={barColors.text}
        >
          删除
        </Button>
      </View>

      {/* 错误提示 */}
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
        duration={3000}
        action={{
          label: '关闭',
          onPress: () => setErrorMessage(null),
        }}
      >
        {errorMessage}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: barColors.background,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: barColors.background,
  },
  glassSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  completionText: {
    color: barColors.text,
    fontSize: 16,
    marginTop: 16,
  },
  divider: {
    backgroundColor: barColors.outline,
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  title: {
    color: barColors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  typeLabel: {
    color: barColors.primary,
    fontSize: 16,
    marginBottom: 4,
  },
  date: {
    color: barColors.textSecondary,
    fontSize: 14,
  },
  sectionTitle: {
    color: barColors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contentText: {
    color: barColors.text,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
  },
});
