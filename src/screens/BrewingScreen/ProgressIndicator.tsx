import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  Easing,
} from 'react-native-reanimated';
import { BrewingStep } from '../../store/brewingStore';
import { barColors } from '../../constants/theme';

interface ProgressIndicatorProps {
  steps: BrewingStep[];
  currentStepIndex: number;
}

// 单个步骤指示器组件
const StepIndicator: React.FC<{
  step: BrewingStep;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  totalSteps: number;
}> = ({ step, index, isActive, isCompleted, totalSteps }) => {
  // 动画值
  const progress = useSharedValue(0);
  const pulse = useSharedValue(1);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    // 进度动画
    progress.value = withSpring(step.progress, { damping: 15, stiffness: 80 });

    // 脉冲动画（仅对活动步骤）
    if (isActive) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }

    // 完成时的打勾动画
    if (isCompleted) {
      checkScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    }
  }, [step.progress, isActive, isCompleted]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <View style={styles.stepContainer}>
      {/* 连接线 */}
      {index > 0 && (
        <View
          style={[
            styles.connector,
            isCompleted && styles.connectorCompleted,
          ]}
        />
      )}

      {/* 步骤圆圈 */}
      <Animated.View
        style={[
          styles.stepCircle,
          isActive && styles.stepCircleActive,
          isCompleted && styles.stepCircleCompleted,
          isActive && pulseStyle,
        ]}
      >
        {isCompleted ? (
          <Animated.Text style={[styles.checkMark, checkStyle]}>✓</Animated.Text>
        ) : (
          <Text style={[
            styles.stepNumber,
            isActive && styles.stepNumberActive,
          ]}>
            {index + 1}
          </Text>
        )}
      </Animated.View>

      {/* 步骤信息 */}
      <View style={styles.stepInfo}>
        <Text style={[
          styles.stepName,
          isActive && styles.stepNameActive,
          isCompleted && styles.stepNameCompleted,
        ]}>
          {step.name}
        </Text>
        <Text style={styles.stepDescription} numberOfLines={1}>
          {step.description}
        </Text>

        {/* 进度条 */}
        {isActive && (
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>
        )}
      </View>
    </View>
  );
};

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStepIndex,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>调酒进度</Text>
      <View style={styles.stepsWrapper}>
        {steps.map((step, index) => (
          <StepIndicator
            key={step.id}
            step={step}
            index={index}
            isActive={index === currentStepIndex}
            isCompleted={step.status === 'completed'}
            totalSteps={steps.length}
          />
        ))}
      </View>
    </View>
  );
};

// 简化版进度指示器（用于顶部显示）
interface CompactProgressProps {
  steps: BrewingStep[];
  currentStepIndex: number;
}

export const CompactProgress: React.FC<CompactProgressProps> = ({
  steps,
  currentStepIndex,
}) => {
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const overallProgress = (completedCount / totalSteps) * 100;

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withSpring(overallProgress, { damping: 15, stiffness: 80 });
  }, [overallProgress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.compactContainer}>
      <View style={styles.compactSteps}>
        {steps.map((step, index) => (
          <View
            key={step.id}
            style={[
              styles.compactDot,
              step.status === 'completed' && styles.compactDotCompleted,
              index === currentStepIndex && styles.compactDotActive,
            ]}
          />
        ))}
      </View>
      <View style={styles.compactBar}>
        <Animated.View style={[styles.compactFill, progressStyle]} />
      </View>
      <Text style={styles.compactText}>
        {completedCount}/{totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: barColors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: barColors.text,
    marginBottom: 12,
  },
  stepsWrapper: {
    gap: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connector: {
    position: 'absolute',
    left: 14,
    top: -8,
    width: 2,
    height: 16,
    backgroundColor: barColors.outline,
    borderRadius: 1,
  },
  connectorCompleted: {
    backgroundColor: barColors.primary,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: barColors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: barColors.outline,
  },
  stepCircleActive: {
    borderColor: barColors.primary,
    backgroundColor: barColors.background,
  },
  stepCircleCompleted: {
    backgroundColor: barColors.primary,
    borderColor: barColors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: barColors.textSecondary,
  },
  stepNumberActive: {
    color: barColors.primary,
  },
  checkMark: {
    fontSize: 14,
    fontWeight: 'bold',
    color: barColors.background,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '500',
    color: barColors.textSecondary,
  },
  stepNameActive: {
    color: barColors.text,
  },
  stepNameCompleted: {
    color: barColors.primary,
  },
  stepDescription: {
    fontSize: 12,
    color: barColors.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: barColors.outline,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: barColors.primary,
    borderRadius: 2,
  },
  // 简化版样式
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  compactSteps: {
    flexDirection: 'row',
    gap: 4,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: barColors.outline,
  },
  compactDotCompleted: {
    backgroundColor: barColors.primary,
  },
  compactDotActive: {
    backgroundColor: barColors.accent,
    transform: [{ scale: 1.25 }],
  },
  compactBar: {
    flex: 1,
    height: 4,
    backgroundColor: barColors.outline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compactFill: {
    height: '100%',
    backgroundColor: barColors.primary,
    borderRadius: 2,
  },
  compactText: {
    fontSize: 12,
    color: barColors.textSecondary,
    minWidth: 30,
    textAlign: 'right',
  },
});
