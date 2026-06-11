import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { FAB, ActivityIndicator, Portal, Snackbar, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { useInspirationStore } from '../../store/inspirationStore';
import { Glass } from '../../components/Glass';
import { barColors } from '../../constants/theme';

type BarScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Bar'>;

export const BarScreen: React.FC = () => {
  const navigation = useNavigation<BarScreenNavigationProp>();
  const { inspirations, isLoading, error, loadInspirations, clearError } = useInspirationStore();
  
  // 多选状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadInspirations();
  }, [loadInspirations]);

  const handleInspirationPress = (id: string) => {
    if (isSelectionMode) {
      // 多选模式：切换选中状态
      toggleSelection(id);
    } else {
      // 正常模式：进入详情
      navigation.navigate('Detail', { inspirationId: id });
    }
  };

  const handleInspirationLongPress = (id: string) => {
    // 长按进入多选模式
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds([id]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      } else if (prev.length < 3) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleStartCollision = () => {
    if (selectedIds.length >= 2) {
      navigation.navigate('Collision', { selectedIds });
      handleCancelSelection();
    }
  };

  const handleAddInspiration = () => {
    navigation.navigate('Capture');
  };

  return (
    <View style={styles.container}>
      {/* 背景装饰 */}
      <View style={styles.background}>
        <View style={styles.shelf} />
        <View style={styles.spotlight} />
      </View>

      {/* 吧台 */}
      <View style={styles.barContainer}>
        <View style={styles.bar} />
        <ScrollView 
          horizontal 
          style={styles.glassScrollView}
          contentContainerStyle={styles.glassContainer}
          showsHorizontalScrollIndicator={false}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color={barColors.primary} />
          ) : inspirations.length === 0 ? (
            <Text style={styles.emptyText}>还没有灵感，点击 + 开始创作</Text>
          ) : (
            inspirations.map((inspiration) => (
              <TouchableOpacity
                key={inspiration.id}
                onPress={() => handleInspirationPress(inspiration.id)}
                onLongPress={() => handleInspirationLongPress(inspiration.id)}
                style={styles.glassWrapper}
              >
                {/* 选择指示器 */}
                {isSelectionMode && (
                  <View style={[
                    styles.selectionIndicator,
                    selectedIds.includes(inspiration.id) && styles.selectionIndicatorActive
                  ]}>
                    <Text style={styles.selectionText}>
                      {selectedIds.includes(inspiration.id) ? '✓' : ''}
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
            ))
          )}
        </ScrollView>
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
  glassScrollView: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  glassContainer: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    gap: 30,
  },
  glassWrapper: {
    alignItems: 'center',
    position: 'relative',
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
