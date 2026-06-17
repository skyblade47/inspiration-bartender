import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Inspiration, InspirationStatus } from '../../types';
import { ScoringResult, DeepScoringResult } from '../../services/scoring';
import { barColors } from '../../constants/theme';
import { RadarChart } from '../RadarChart';
import { ScoreSourceBadge } from '../ScoreSourceBadge';

interface ScoringSectionProps {
  inspiration: Inspiration;
  scoringResult: ScoringResult | DeepScoringResult | null;
  onDeepScore?: () => Promise<void>;
  isAnalyzing?: boolean;
  hasError?: boolean;
}

const STATUS_LABELS: Record<InspirationStatus, string> = {
  [InspirationStatus.SEED]: '种子',
  [InspirationStatus.SPROUT]: '萌芽',
  [InspirationStatus.GROW]: '生长',
  [InspirationStatus.BUD]: '含苞待放',
  [InspirationStatus.BLOOM]: '绽放',
};

const STATUS_COLORS: Record<InspirationStatus, string> = {
  [InspirationStatus.SEED]: '#8B4513',
  [InspirationStatus.SPROUT]: '#228B22',
  [InspirationStatus.GROW]: '#32CD32',
  [InspirationStatus.BUD]: '#FF69B4',
  [InspirationStatus.BLOOM]: '#FFD700',
};

export const ScoringSection: React.FC<ScoringSectionProps> = ({
  inspiration,
  scoringResult,
  onDeepScore,
  isAnalyzing = false,
  hasError = false,
}) => {
  if (!scoringResult) {
    return null;
  }

  const statusLabel = STATUS_LABELS[scoringResult.status];
  const statusColor = STATUS_COLORS[scoringResult.status];
  const deepResult = scoringResult as DeepScoringResult;
  const source = deepResult.source || 'local';
  const hasAnalyzed = source === 'llm';

  // 按钮状态：初始 | 加载中 | 已完成 | 错误
  const getButtonConfig = () => {
    if (isAnalyzing) {
      return {
        text: '分析中...',
        mode: 'contained' as const,
        disabled: true,
        color: barColors.textSecondary,
      };
    }
    if (hasError) {
      return {
        text: '重试分析',
        mode: 'contained' as const,
        disabled: false,
        color: '#DC143C', // error color
      };
    }
    if (hasAnalyzed) {
      return {
        text: '已分析',
        mode: 'outlined' as const,
        disabled: false,
        color: '#32CD32', // success color
      };
    }
    return {
      text: '深度分析',
      mode: 'contained' as const,
      disabled: false,
      color: barColors.primary,
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.scoreInfo}>
          <Text style={styles.scoreLabel}>评分</Text>
          <Text style={styles.scoreValue}>{scoringResult.totalScore} 分</Text>
        </View>
        <View style={styles.statusInfo}>
          <Text style={styles.statusLabel}>状态</Text>
          <Text style={[styles.statusValue, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.radarContainer}>
        <RadarChart
          dimensionScores={scoringResult.dimensionScores}
          size={200}
          showLabels={true}
        />
      </View>

      <View style={styles.footer}>
        <ScoreSourceBadge source={source} />
        
        {onDeepScore && (
          <Button
            mode={buttonConfig.mode}
            onPress={onDeepScore}
            disabled={buttonConfig.disabled}
            loading={isAnalyzing}
            buttonColor={buttonConfig.mode === 'contained' ? buttonConfig.color : undefined}
            textColor={buttonConfig.mode === 'contained' ? barColors.background : buttonConfig.color}
            style={[styles.deepButton, buttonConfig.mode === 'outlined' && styles.deepButtonOutlined]}
          >
            {buttonConfig.text}
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    color: barColors.textSecondary,
    fontSize: 14,
    marginRight: 8,
  },
  scoreValue: {
    color: barColors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    color: barColors.textSecondary,
    fontSize: 14,
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  radarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deepButton: {
    minWidth: 120,
  },
  deepButtonOutlined: {
    borderColor: '#32CD32',
  },
});