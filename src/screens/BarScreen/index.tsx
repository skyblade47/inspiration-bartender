import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, StyleSheet, FlatList, Text, TouchableOpacity } from 'react-native';
import { FAB, ActivityIndicator, Portal, Snackbar, Button, IconButton, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Inspiration } from '../../types';
import { useInspirationStore } from '../../store/inspirationStore';
import { Glass } from '../../components/Glass';
import { barColors } from '../../constants/theme';

type BarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Bar'>;

// 灵感卡片组件（memo 优化）
interface InspirationCardProps {
  inspiration: Inspiration;
  isSelectionMode: boolean;
  isSelected: boolean;
  onPress: (id: string) => void;
  onLongPress: (id: string) => void;
}

const InspirationCard = memo(({ 
  inspiration, 
  isSelectionMode, 
  isSelected, 
  onPress, 
  onLongPress 
}: InspirationCardProps) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(inspiration.id)}
      onLongPress={() => onLongPress(inspiration.id)}
      style={styles.glassWrapper}
      activeOpacity={0.8}
    >
      {/* 选择指示器 */}
      {isSelectionMode && (
        <View style={[
          styles.selectionIndicator,
          isSelected && styles.selectionIndicatorActive
        ]}>
          <Text style={styles.selectionText}>
            {isSelected ? '✓' : ''}
          </Text>
        </View>
      )}
      
      <Glass
        type={inspiration.type}
        completion={inspiration.completion}
        status={inspiration.status}
        size="medium"
      />
      <Text style={styles.glassLabel} numberOfLines={1}>
        {inspiration.name}
      </Text>
    </TouchableOpacity>
  );
});

// 卡片固定宽度，用于 getItemLayout
const CARD_WIDTH = 130; // glassWrapper + gap

export const BarScreen: React.FC = () => {
  const navigation = useNavigation<BarScreenNavigationProp>();
  
  // 选择性订阅 Zustand store，避免全量订阅导致的重渲染
  const inspirations = useInspirationStore((state) => state.inspirations);
  const isLoading = useInspirationStore((state) => state.isLoading);
  const error = useInspirationStore((state) => state.error);
  const loadInspirations = useInspirationStore((state) => state.loadInspirations);
  const clearError = useInspirationStore((state) => state.clearError);
  
  // 多选状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadInspirations();
  }, [loadInspirations]);

  const handleInspirationPress = useCallback((id: string) => {
    if (isSelectionMode) {
      toggleSelection(id);
    } else {
      navigation.navigate('Detail', { inspirationId: id });
    }
  }, [isSelectionMode, navigation]);

  const handleInspirationLongPress = useCallback((id: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds([id]);
    }
  }, [isSelectionMode]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else if (prev.length < 3) {
        return [...prev, id];
      }
      return prev;
    });
  }, []);

  const handleCancelSelection = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const handleStartCollision = useCallback(() => {
    if (selectedIds.length >= 2) {
      navigation.navigate('Collision', { selectedIds });
      handleCancelSelection();
    }
  }, [selectedIds, navigation, handleCancelSelection]);

  const handleAddInspiration = useCallback(() => {
    navigation.navigate('Capture');
  }, [navigation]);

  // 进入数据管理页面
  const handleOpenExport = useCallback(() => {
    navigation.navigate('Export');
  }, [navigation]);

  // 进入 LLM 设置页面
  const handleOpenLLMSettings = useCallback(() => {
    setMenuVisible(false);
    navigation.navigate('LLMSettings');
  }, [navigation]);

  // 设置菜单状态
  const [menuVisible, setMenuVisible] = useState(false);

  // FlatList 渲染项
  const renderItem = useCallback(({ item }: { item: Inspiration }) => (
    <InspirationCard
      inspiration={item}
      isSelectionMode={isSelectionMode}
      isSelected={selectedIds.includes(item.id)}
      onPress={handleInspirationPress}
      onLongPress={handleInspirationLongPress}
    />
  ), [isSelectionMode, selectedIds, handleInspirationPress, handleInspirationLongPress]);

  // 固定高度的 getItemLayout，提升 FlatList 性能
  const getItemLayout = useCallback((_data: unknown, index: number) => ({
    length: CARD_WIDTH,
    offset: CARD_WIDTH * index + 20, // 加上 paddingHorizontal
    index,
  }), []);

  // 列表为空时的组件
  const ListEmptyComponent = useCallback(() => (
    isLoading ? (
      <ActivityIndicator size="large" color={barColors.primary} />
    ) : (
      <Text style={styles.emptyText}>还没有灵感，点击 + 开始创作</Text>
    )
  ), [isLoading]);

  return (
    <View style={styles.container}>
      {/* 背景装饰 */}
      <View style={styles.background}>
        <View style={styles.shelf} />
        <View style={styles.spotlight} />
      </View>

      {/* 设置按钮 */}
      <View style={styles.settingsButtonContainer}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="cog"
              iconColor={barColors.textSecondary}
              size={24}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleOpenExport();
            }}
            title="📤 数据管理"
            leadingIcon="database-export"
          />
          <Menu.Item
            onPress={handleOpenLLMSettings}
            title="🤖 LLM 设置"
            leadingIcon="brain"
          />
        </Menu>
      </View>

      {/* 吧台 */}
      <View style={styles.barContainer}>
        <View style={styles.bar} />
        <FlatList
          horizontal
          data={inspirations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          ListEmptyComponent={ListEmptyComponent}
          contentContainerStyle={styles.glassContainer}
          showsHorizontalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      </View>

      {/* 多选模式底部栏 */}
      {isSelectionMode && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionCount}>
            已选择 {selectedIds.length}/3 个灵感
          </Text>
          <View style={styles.selectionActions}>
            <Button
              mode="outlined"
              onPress={handleCancelSelection}
              textColor={barColors.text}
            >
              取消
            </Button>
            <Button
              mode="contained"
              onPress={handleStartCollision}
              disabled={selectedIds.length < 2}
              style={styles.collisionButton}
            >
              🍸 调制特调
            </Button>
          </View>
        </View>
      )}

      {/* FAB 按钮 */}
      {!isSelectionMode && (
        <FAB
          icon="plus"
          style={styles.fab}
          color={barColors.background}
          onPress={handleAddInspiration}
        />
      )}

      {/* 错误提示 */}
      <Portal>
        <Snackbar
          visible={!!error}
          onDismiss={clearError}
          duration={3000}
        >
          {error}
        </Snackbar>
      </Portal>
    </View>
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
  shelf: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#2a1f18',
  },
  spotlight: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -100,
    width: 200,
    height: 300,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
  },
  settingsButtonContainer: {
    position: 'absolute',
    top: 40,
    right: 8,
    zIndex: 10,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bar: {
    height: 60,
    backgroundColor: barColors.bar,
    borderTopWidth: 4,
    borderTopColor: '#5d4b3f',
  },
  glassContainer: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  glassWrapper: {
    alignItems: 'center',
    position: 'relative',
    width: 100,
    marginRight: 30,
  },
  selectionIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: barColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  selectionIndicatorActive: {
    backgroundColor: barColors.primary,
  },
  selectionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  glassLabel: {
    color: barColors.text,
    fontSize: 12,
    marginTop: 8,
    maxWidth: 100,
    textAlign: 'center',
  },
  emptyText: {
    color: barColors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: barColors.primary,
  },
  selectionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: barColors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: barColors.border,
  },
  selectionCount: {
    color: barColors.text,
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  selectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collisionButton: {
    flex: 1,
    marginLeft: 12,
  },
});