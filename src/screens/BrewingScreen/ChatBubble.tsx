import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { ChatMessage } from '../../store/brewingStore';
import { barColors } from '../../constants/theme';

interface ChatBubbleProps {
  message: ChatMessage;
  isLatest?: boolean;
}

// 打字动画指示器组件
const TypingIndicator: React.FC = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // 创建打字动画效果
    const animate = () => {
      dot1.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
      dot2.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
      dot3.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 300 })
      );
    };
    animate();
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3.value,
  }));

  return (
    <View style={styles.typingContainer}>
      <Animated.View style={[styles.typingDot, dot1Style]} />
      <Animated.View style={[styles.typingDot, dot2Style]} />
      <Animated.View style={[styles.typingDot, dot3Style]} />
    </View>
  );
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isLatest = false }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // 入场动画
    scale.value = withSpring(1, { damping: 12, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 300 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // 根据角色确定样式
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  const bubbleStyle = [
    styles.bubble,
    isUser ? styles.userBubble : styles.assistantBubble,
    isSystem && styles.systemBubble,
  ];

  const textStyle = [
    styles.text,
    isUser ? styles.userText : styles.assistantText,
    isSystem && styles.systemText,
  ];

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isUser ? styles.containerUser : styles.containerAssistant,
        animatedStyle,
      ]}
    >
      {!isSystem && (
        <Text style={styles.roleLabel}>
          {isUser ? '👤 你' : '🍸 调酒师'}
        </Text>
      )}
      <View style={bubbleStyle}>
        <Text style={textStyle}>{message.content}</Text>
      </View>
      <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
    </Animated.View>
  );
};

// 打字中的气泡组件
export const TypingBubble: React.FC = () => {
  return (
    <View style={[styles.container, styles.containerAssistant]}>
      <Text style={styles.roleLabel}>🍸 调酒师</Text>
      <View style={[styles.bubble, styles.assistantBubble]}>
        <TypingIndicator />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '85%',
    marginVertical: 8,
  },
  containerUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerAssistant: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  roleLabel: {
    fontSize: 12,
    color: barColors.textSecondary,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: barColors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: barColors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: barColors.outline,
  },
  systemBubble: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: barColors.background,
  },
  assistantText: {
    color: barColors.text,
  },
  systemText: {
    color: barColors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 10,
    color: barColors.textSecondary,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: barColors.primary,
  },
});
