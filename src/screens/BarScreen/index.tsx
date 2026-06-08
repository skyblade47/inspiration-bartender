import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { FAB, ActivityIndicator, Portal, Snackbar } from 'react-native-paper';
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

  useEffect(() => {
    loadInspirations();
  }, [loadInspirations]);

  const handleInspirationPress = (id: string) => {
    navigation.navigate('Detail', { inspirationId: id });
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
              <View key={inspiration.id} style={styles.glassWrapper}>
                <Glass
                  type={inspiration.type}
                  completion={inspiration.completion}
                  status={inspiration.status}
                  size="medium"
                  onPress={() => handleInspirationPress(inspiration.id)}
                />
                <Text style={styles.glassLabel} numberOfLines={1}>
                  {inspiration.name}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* FAB 按钮 */}
      <FAB
        icon="plus"
        style={styles.fab}
        color={barColors.background}
        onPress={handleAddInspiration}
      />

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
});
