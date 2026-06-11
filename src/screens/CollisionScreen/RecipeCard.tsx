import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import type { Recipe } from '../../types';
import { barColors } from '../../constants/theme';

interface RecipeCardProps {
  /** 配方数据 */
  recipe: Recipe;
  /** 是否选中 */
  isSelected?: boolean;
  /** 排名（用于显示） */
  rank?: number;
  /** 点击回调 */
  onPress?: (recipe: Recipe) => void;
  /** 混合颜色（用于背景渐变） */
  mixColors?: string[];
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isSelected = false,
  rank = 1,
  onPress,
  mixColors = [],
}) => {
  // 获取排名标签
  const getRankLabel = (): string => {
    switch (rank) {
      case 1:
        return '🥇 最佳方案';
      case 2:
        return '🥈 推荐方案';
      case 3:
        return '🥉 备选方案';
      default:
        return `方案 ${rank}`;
    }
  };

  // 获取排名颜色
  const getRankColor = (): string => {
    switch (rank) {
      case 1:
        return '#FFD700';
      case 2:
        return '#C0C0C0';
      case 3:
        return '#CD7F32';
      default:
        return barColors.textSecondary;
    }
  };

  // 渲染评分星星
  const renderScore = (score: number): React.ReactNode => {
    const fullStars = Math.floor(score / 20);
    const hasHalfStar = score % 20 >= 10;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <View style={styles.scoreContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <Text key={`full-${i}`} style={styles.star}>⭐</Text>
        ))}
        {hasHalfStar && <Text style={styles.star}>✨</Text>}
        {[...Array(emptyStars)].map((_, i) => (
          <Text key={`empty-${i}`} style={styles.starEmpty}>☆</Text>
        ))}
        <Text style={styles.scoreText}>{score}</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.containerSelected,
        mixColors.length > 0 && {
          borderLeftColor: mixColors[0],
          borderLeftWidth: 4,
        },
      ]}
      onPress={() => onPress?.(recipe)}
      activeOpacity={0.8}
    >
      {/* 顶部：排名和评分 */}
      <View style={styles.header}>
        <View style={styles.rankBadge}>
          <Text style={[styles.rankText, { color: getRankColor() }]}>
            {getRankLabel()}
          </Text>
        </View>
        {renderScore(recipe.score)}
      </View>

      {/* 标题 */}
      <Text style={styles.title} numberOfLines={2}>
        {recipe.title}
      </Text>

      {/* 描述 */}
      <Text style={styles.description} numberOfLines={3}>
        {recipe.description}
      </Text>

      {/* 关键词 */}
      <View style={styles.keywordsContainer}>
        {recipe.keywords.slice(0, 4).map((keyword, index) => (
          <Chip
            key={index}
            style={styles.keywordChip}
            textStyle={styles.keywordText}
            compact
          >
            {keyword}
          </Chip>
        ))}
      </View>

      {/* 发展方向 */}
      <View style={styles.directionsContainer}>
        <Text style={styles.directionsLabel}>可能的发展方向：</Text>
        {recipe.directions.slice(0, 2).map((direction, index) => (
          <View key={index} style={styles.directionItem}>
            <Text style={styles.directionBullet}>•</Text>
            <Text style={styles.directionText} numberOfLines={1}>
              {direction}
            </Text>
          </View>
        ))}
      </View>

      {/* 选中指示器 */}
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedIcon}>✓</Text>
        </View>
      )}

      {/* 背景装饰 */}
      <View
        style={[
          styles.backgroundDecoration,
          {
            backgroundColor: mixColors[0]
              ? `${mixColors[0]}20`
              : 'rgba(212, 160, 23, 0.1)',
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: barColors.surface,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: barColors.outline,
    overflow: 'hidden',
  },
  containerSelected: {
    borderColor: barColors.primary,
    borderWidth: 2,
    backgroundColor: `${barColors.primary}10`,
  },
  backgroundDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 150,
    height: 150,
    borderRadius: 75,
    transform: [{ translateX: 50 }, { translateY: -50 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 14,
  },
  starEmpty: {
    fontSize: 14,
    color: barColors.textSecondary,
  },
  scoreText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: barColors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: barColors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: barColors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  keywordChip: {
    backgroundColor: 'rgba(212, 160, 23, 0.2)',
    height: 28,
  },
  keywordText: {
    fontSize: 12,
    color: barColors.primary,
  },
  directionsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
  },
  directionsLabel: {
    fontSize: 12,
    color: barColors.textSecondary,
    marginBottom: 6,
  },
  directionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  directionBullet: {
    fontSize: 12,
    color: barColors.primary,
    marginRight: 6,
  },
  directionText: {
    fontSize: 13,
    color: barColors.text,
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: barColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIcon: {
    color: barColors.background,
    fontSize: 16,
    fontWeight: '700',
  },
});
