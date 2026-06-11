import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Text } from 'react-native-paper';
import { ShakePhase } from '../../types';
import { barColors } from '../../constants/theme';

interface ShakeAnimationProps {
  /** 当前阶段 */
  phase: ShakePhase;
  /** 进度 0-1 */
  progress: number;
  /** 颜色列表 */
  colors: string[];
  /** 完成回调 */
  onComplete?: () => void;
}

// 阶段持续时间（毫秒）
const PHASE_DURATIONS: Record<ShakePhase, number> = {
  [ShakePhase.POUR]: 2000,
  [ShakePhase.SHAKE]: 3000,
  [ShakePhase.POUR_OUT]: 1500,
};

export const ShakeAnimation: React.FC<ShakeAnimationProps> = ({
  phase,
  progress,
  colors,
  onComplete,
}) => {
  // 动画值
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeRotation = useRef(new Animated.Value(0)).current;
  const pourHeight = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  // 摇晃动画
  useEffect(() => {
    if (phase === ShakePhase.SHAKE) {
      const shakeAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(shakeX, {
              toValue: 15,
              duration: 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(shakeRotation, {
              toValue: 1,
              duration: 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(shakeX, {
              toValue: -15,
              duration: 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(shakeRotation, {
              toValue: -1,
              duration: 100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      shakeAnimation.start();
      return () => shakeAnimation.stop();
    } else {
      shakeX.setValue(0);
      shakeRotation.setValue(0);
    }
  }, [phase, shakeX, shakeRotation]);

  // 倾倒动画
  useEffect(() => {
    if (phase === ShakePhase.POUR || phase === ShakePhase.POUR_OUT) {
      Animated.timing(pourHeight, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [phase, progress, pourHeight]);

  // 淡入淡出
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  // 获取阶段文字
  const getPhaseText = (): string => {
    switch (phase) {
      case ShakePhase.POUR:
        return '倒入中...';
      case ShakePhase.SHAKE:
        return '摇晃混合...';
      case ShakePhase.POUR_OUT:
        return '倒出中...';
      default:
        return '';
    }
  };

  // 旋转插值
  const rotation = shakeRotation.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-10deg', '10deg'],
  });

  // 渲染杯子
  const renderGlass = () => {
    const glassHeight = 200;
    const glassWidth = 100;
    const baseHeight = 30;

    return (
      <Animated.View
        style={[
          styles.glassContainer,
          {
            transform: [
              { translateX: shakeX },
              { rotate: rotation },
            ],
          },
        ]}
      >
        {/* 杯子主体 */}
        <View style={[styles.glass, { height: glassHeight, width: glassWidth }]}>
          {/* 液体 */}
          <Animated.View
            style={[
              styles.liquid,
              {
                height: pourHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '80%'],
                }),
                backgroundColor: colors[0] || barColors.primary,
              },
            ]}
          />
          
          {/* 液体光泽 */}
          <View style={styles.liquidShine} />
          
          {/* 液体泡沫 */}
          {phase === ShakePhase.SHAKE && (
            <View style={styles.bubbles}>
              {[...Array(5)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.bubble,
                    {
                      left: `${20 + i * 15}%`,
                      bottom: pourHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '60%'],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* 杯子底座 */}
        <View style={[styles.glassBase, { width: glassWidth * 0.6 }]} />

        {/* 装饰光效 */}
        <View style={styles.glowEffect} />
      </Animated.View>
    );
  };

  // 渲染混合容器
  const renderMixingContainer = () => {
    const containerSize = 120;

    return (
      <View style={styles.mixingContainer}>
        {/* 混合罐 */}
        <View
          style={[
            styles.mixingBowl,
            {
              width: containerSize,
              height: containerSize * 0.6,
            },
          ]}
        >
          {/* 混合液 */}
          <View
            style={[
              styles.mixingLiquid,
              {
                backgroundColor:
                  colors.length > 1
                    ? `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
                    : colors[0] || barColors.primary,
              },
            ]}
          />
        </View>

        {/* 蒸汽效果 */}
        {phase === ShakePhase.SHAKE && (
          <View style={styles.steamContainer}>
            {[...Array(3)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.steam,
                  {
                    left: 20 + i * 30,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* 背景光效 */}
      <View style={styles.backgroundGlow} />

      {/* 主内容 */}
      <View style={styles.content}>
        {/* 摇晃中的杯子 */}
        <View style={styles.shakerArea}>
          {phase !== ShakePhase.POUR_OUT && renderGlass()}
          {phase === ShakePhase.SHAKE && renderMixingContainer()}
        </View>

        {/* 阶段文字 */}
        <Text style={styles.phaseText}>{getPhaseText()}</Text>

        {/* 进度条 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: colors[0] || barColors.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* 颜色预览 */}
        <View style={styles.colorPreview}>
          {colors.map((color, index) => (
            <View
              key={index}
              style={[
                styles.colorDot,
                { backgroundColor: color },
              ]}
            />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  backgroundGlow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
  },
  content: {
    alignItems: 'center',
  },
  shakerArea: {
    width: 250,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassContainer: {
    alignItems: 'center',
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  liquid: {
    width: '100%',
    borderRadius: 6,
  },
  liquidShine: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 20,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  glassBase: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    marginTop: 4,
  },
  glowEffect: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212, 160, 23, 0.2)',
    zIndex: -1,
  },
  bubbles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  bubble: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  mixingContainer: {
    position: 'absolute',
    bottom: 20,
  },
  mixingBowl: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 100,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  mixingLiquid: {
    width: '100%',
    height: '70%',
    borderRadius: 100,
  },
  steamContainer: {
    position: 'absolute',
    top: -40,
    width: '100%',
    height: 40,
  },
  steam: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  phaseText: {
    fontSize: 20,
    color: barColors.text,
    marginTop: 30,
    fontWeight: '600',
  },
  progressContainer: {
    width: 200,
    marginTop: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  colorPreview: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});
