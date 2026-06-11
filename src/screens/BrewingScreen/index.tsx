import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  useSharedValue,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IconButton } from 'react-native-paper';
import { RootStackParamList, GlassType } from '../../types';
import { useBrewingStore, LiquidLayer } from '../../store/brewingStore';
import { ChatBubble, TypingBubble } from './ChatBubble';
import { CompactProgress } from './ProgressIndicator';
import { Glass } from '../../components/Glass';
import { barColors, liquidColors } from '../../constants/theme';
import { glassConfigs } from '../../constants/glassTypes';

type BrewingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Detail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 液体层可视化组件
const LiquidVisualization: React.FC<{
  layers: LiquidLayer[];
  isPouring: boolean;
}> = ({ layers, isPouring }) => {
  const pourY = useSharedValue(-100);

  useEffect(() => {
    if (isPouring) {
      // 倾倒动画
      pourY.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) }),
          withTiming(-100, { duration: 500, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
    }
  }, [isPouring]);

  const pourStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pourY.value }],
    opacity: interpolate(pourY.value, [-100, 0], [0, 1]),
  }));

  // 计算总高度
  const totalVolume = layers.reduce((sum, layer) => sum + layer.volume, 0);

  return (
    <View style={styles.liquidContainer}>
      {/* 杯子轮廓 */}
      <View style={styles.glassOutline}>
        {/* 液体层 */}
        {layers.map((layer, index) => {
          const height = (layer.volume / 100) * 150;
          const bottom = layers
            .slice(0, index)
            .reduce((sum, l) => sum + (l.volume / 100) * 150, 0);

          return (
            <Animated.View
              key={layer.id}
              style={[
                styles.liquidLayer,
                {
                  height,
                  bottom,
                  backgroundColor: layer.color,
                  opacity: layer.opacity,
                },
              ]}
            />
          );
        })}

        {/* 倾倒动画 */}
        {isPouring && (
          <Animated.View style={[styles.pourStream, pourStyle]}>
            <View style={styles.pourDrop} />
          </Animated.View>
        )}
      </View>

      {/* 液体标签 */}
      <View style={styles.layerLabels}>
        {layers.map((layer) => (
          <View key={layer.id} style={styles.layerLabel}>
            <View style={[styles.layerDot, { backgroundColor: layer.color }]} />
            <Text style={styles.layerName}>{layer.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// 气泡动画效果
const BubbleEffect: React.FC = () => {
  const bubbles = Array.from({ length: 5 }, (_, i) => {
    const bubbleY = useSharedValue(0);
    const bubbleOpacity = useSharedValue(0);

    useEffect(() => {
      // 气泡上升动画
      bubbleY.value = withRepeat(
        withTiming(-100, { duration: 2000 + i * 500, easing: Easing.out(Easing.quad) }),
        -1,
        false
      );
      bubbleOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 500 }),
          withTiming(0, { duration: 1500 })
        ),
        -1,
        false
      );
    }, []);

    const bubbleStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: bubbleY.value }],
      opacity: bubbleOpacity.value,
    }));

    return (
      <Animated.View
        key={i}
        style={[
          styles.bubble,
          { left: 20 + i * 15 },
          bubbleStyle,
        ]}
      />
    );
  });

  return <>{bubbles}</>;
};

export const BrewingScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<BrewingScreenNavigationProp>();
  const scrollViewRef = useRef<ScrollView>(null);

  // 从 store 获取状态和方法
  const {
    name,
    glassType,
    completion,
    status,
    messages,
    isTyping,
    liquidLayers,
    isPouring,
    steps,
    currentStepIndex,
    userInput,
    isProcessing,
    initialize,
    setUserInput,
    submitUserInput,
    addLiquidLayer,
    startPourAnimation,
    stopPourAnimation,
  } = useBrewingStore();

  // 本地状态
  const [showLiquidPanel, setShowLiquidPanel] = useState(false);

  // 初始化
  useEffect(() => {
    // 从路由参数获取灵感ID
    const params = route.params as { inspirationId: string } | undefined;
    if (params?.inspirationId) {
      // 这里应该从数据库加载灵感数据
      // 目前使用模拟数据
      initialize(params.inspirationId, '新灵感', GlassType.COCKTAIL);
    } else {
      // 新建灵感
      initialize('new', '新灵感', GlassType.COCKTAIL);
    }
  }, []);

  // 滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // 添加测试液体层
  const handleAddTestLiquid = () => {
    const colors = ['#D4A017', '#FF8C00', '#1E3A5F', '#9B59B6'];
    const names = ['灵感精华', '创意糖浆', '思维基酒', '想象装饰'];
    const randomIndex = Math.floor(Math.random() * colors.length);

    addLiquidLayer({
      name: names[randomIndex],
      color: colors[randomIndex],
      volume: 20 + Math.random() * 30,
      opacity: 0.7 + Math.random() * 0.3,
    });
  };

  const glassConfig = glassConfigs[glassType];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* 背景 */}
      <View style={styles.background}>
        <View style={styles.ambientLight} />
      </View>

      {/* 顶部栏 */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          iconColor={barColors.text}
          onPress={() => navigation.goBack()}
        />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{name || '调酒工作台'}</Text>
          <Text style={styles.headerSubtitle}>
            {glassConfig.icon} {glassConfig.label}
          </Text>
        </View>
        <IconButton
          icon="information-outline"
          iconColor={barColors.text}
          onPress={() => setShowLiquidPanel(!showLiquidPanel)}
        />
      </View>

      {/* 进度指示器 */}
      <CompactProgress steps={steps} currentStepIndex={currentStepIndex} />

      {/* 主内容区 */}
      <View style={styles.mainContent}>
        {/* 左侧：杯子可视化 */}
        <View style={styles.glassSection}>
          <View style={styles.glassWrapper}>
            <Glass
              type={glassType}
              completion={completion}
              status={status}
              size="large"
            />
            <BubbleEffect />
          </View>

          {/* 液体层可视化 */}
          <LiquidVisualization layers={liquidLayers} isPouring={isPouring} />

          {/* 快捷操作按钮 */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddTestLiquid}
            >
              <Text style={styles.actionIcon}>🧪</Text>
              <Text style={styles.actionText}>添加元素</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                startPourAnimation('source', 'target');
                setTimeout(stopPourAnimation, 2000);
              }}
            >
              <Text style={styles.actionIcon}>⚗️</Text>
              <Text style={styles.actionText}>混合</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 右侧：对话区域 */}
        <View style={styles.chatSection}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScrollView}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => (
              <ChatBubble
                key={message.id}
                message={message}
                isLatest={index === messages.length - 1}
              />
            ))}
            {isTyping && <TypingBubble />}
          </ScrollView>
        </View>
      </View>

      {/* 输入区域 */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="输入您的灵感..."
            placeholderTextColor={barColors.textSecondary}
            value={userInput}
            onChangeText={setUserInput}
            multiline
            maxLength={500}
            editable={!isProcessing}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!userInput.trim() || isProcessing) && styles.sendButtonDisabled,
            ]}
            onPress={submitUserInput}
            disabled={!userInput.trim() || isProcessing}
          >
            <Text style={styles.sendIcon}>✨</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: barColors.background,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  ambientLight: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -150,
    width: 300,
    height: 400,
    backgroundColor: 'rgba(212, 160, 23, 0.05)',
    borderRadius: 150,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: barColors.outline,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: barColors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: barColors.textSecondary,
    marginTop: 2,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  glassSection: {
    width: SCREEN_WIDTH * 0.4,
    alignItems: 'center',
    paddingVertical: 16,
  },
  glassWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  bubble: {
    position: 'absolute',
    bottom: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: barColors.primary,
  },
  liquidContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  glassOutline: {
    width: 80,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: barColors.outline,
    overflow: 'hidden',
    position: 'relative',
  },
  liquidLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 4,
  },
  pourStream: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 30,
  },
  pourDrop: {
    flex: 1,
    backgroundColor: barColors.primary,
    borderRadius: 3,
  },
  layerLabels: {
    marginTop: 8,
    gap: 4,
  },
  layerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  layerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  layerName: {
    fontSize: 10,
    color: barColors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: barColors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: barColors.outline,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: 10,
    color: barColors.textSecondary,
    marginTop: 4,
  },
  chatSection: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: barColors.outline,
  },
  chatScrollView: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: barColors.outline,
    backgroundColor: barColors.surface,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: barColors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: barColors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: barColors.outline,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: barColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: barColors.outline,
  },
  sendIcon: {
    fontSize: 20,
  },
});

export default BrewingScreen;
