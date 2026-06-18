import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  TextInput, 
  Button, 
  SegmentedButtons,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, GlassType } from '../../types';
import { useInspirationStore } from '../../store/inspirationStore';
import { glassConfigs } from '../../constants/glassTypes';
import { barColors } from '../../constants/theme';

type CaptureScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Capture'>;

export const CaptureScreen: React.FC = () => {
  const navigation = useNavigation<CaptureScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { addInspiration } = useInspirationStore();
  
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [selectedType, setSelectedType] = useState<GlassType>(GlassType.MASON);
  const [isSaving, setIsSaving] = useState(false);

  const glassTypeButtons = Object.entries(glassConfigs).map(([type, config]) => ({
    value: type,
    label: config.icon,
  }));

  const handleSave = async () => {
    if (!text.trim()) return;
    
    setIsSaving(true);
    try {
      const inspirationName = name.trim() || text.trim().substring(0, 20) + '...';
      await addInspiration({
        name: inspirationName,
        type: selectedType,
        rawInput: { text: text.trim() },
      });
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save inspiration:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
        <Text style={styles.title}>捕获新灵感</Text>

        {/* 杯子类型选择 */}
        <Text style={styles.label}>选择灵感类型</Text>
        <SegmentedButtons
          value={selectedType}
          onValueChange={(value) => setSelectedType(value as GlassType)}
          buttons={glassTypeButtons}
          style={styles.segmentedButtons}
        />
        <Text style={styles.typeDescription}>
          {glassConfigs[selectedType].label} - {glassConfigs[selectedType].description}
        </Text>

        {/* 灵感名称 */}
        <Text style={styles.label}>灵感名称（可选）</Text>
        <TextInput
          mode="outlined"
          value={name}
          onChangeText={setName}
          placeholder="给你的灵感起个名字"
          style={styles.input}
          outlineColor={barColors.outline}
          activeOutlineColor={barColors.primary}
          textColor={barColors.text}
          placeholderTextColor={barColors.textSecondary}
        />

        {/* 灵感内容 */}
        <Text style={styles.label}>灵感内容</Text>
        <TextInput
          mode="outlined"
          value={text}
          onChangeText={setText}
          placeholder="记录你的灵感..."
          multiline
          numberOfLines={8}
          style={styles.textArea}
          outlineColor={barColors.outline}
          activeOutlineColor={barColors.primary}
          textColor={barColors.text}
          placeholderTextColor={barColors.textSecondary}
        />

        {/* 保存按钮 */}
        <Button
          mode="contained"
          onPress={handleSave}
          disabled={!text.trim() || isSaving}
          style={styles.saveButton}
          buttonColor={barColors.primary}
          textColor={barColors.background}
          loading={isSaving}
        >
          {isSaving ? '保存中...' : '保存灵感'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: barColors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    color: barColors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  label: {
    color: barColors.text,
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  typeDescription: {
    color: barColors.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: barColors.surface,
  },
  textArea: {
    backgroundColor: barColors.surface,
    minHeight: 150,
  },
  saveButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
});
