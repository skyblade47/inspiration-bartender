import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { barColors } from '../../constants/theme';

interface ScoreSourceBadgeProps {
  source: 'local' | 'llm' | 'hybrid';
}

const SOURCE_CONFIG = {
  local: { label: '本地评分', color: barColors.textSecondary },
  llm: { label: 'AI分析', color: barColors.primary },
  hybrid: { label: '混合评分', color: barColors.accent },
};

export const ScoreSourceBadge: React.FC<ScoreSourceBadgeProps> = ({ source }) => {
  const config = SOURCE_CONFIG[source];
  
  return (
    <View style={[styles.badge, { borderColor: config.color }]}>
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});