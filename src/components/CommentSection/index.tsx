import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { barColors } from '../../constants/theme';

interface CommentSectionProps {
  llmComment: string;
  llmSuggestions: string[];
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  llmComment,
  llmSuggestions,
}) => {
  if (!llmComment && llmSuggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* AI评语 */}
      {llmComment && (
        <View style={styles.commentSection}>
          <Text style={styles.header}>🤖 AI 分析评语</Text>
          <Text style={styles.commentText}>{llmComment}</Text>
        </View>
      )}

      {/* 改进建议 */}
      {llmSuggestions.length > 0 && (
        <View style={styles.suggestionsSection}>
          <Text style={styles.header}>📋 改进建议</Text>
          {llmSuggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  commentSection: {
    marginBottom: 16,
  },
  suggestionsSection: {},
  header: {
    fontSize: 16,
    fontWeight: '600',
    color: barColors.text,
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: barColors.textSecondary,
    lineHeight: 20,
  },
  suggestionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: barColors.primary,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: barColors.textSecondary,
    flex: 1,
  },
});