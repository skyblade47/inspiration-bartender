import React, { useState, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  ActivityIndicator,
  Snackbar,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { barColors } from '../../constants/theme';
import {
  exportAllInspirations,
  exportSingleInspiration,
  importFromFile,
  getExportHistory,
  addExportHistory,
  ImportResult,
} from '../../services/export';
import { getAllInspirations } from '../../services/database';
import { Inspiration } from '../../types';

type ExportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Bar'>;

// 灵感选择卡片组件
interface InspirationSelectCardProps {
  inspiration: Inspiration;
  isSelected: boolean;
  onPress: () => void;
}

const InspirationSelectCard = memo(({ inspiration, isSelected, onPress }: InspirationSelectCardProps) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card style={[styles.selectCard, isSelected && styles.selectCardActive]}>
      <Card.Content style={styles.selectCardContent}>
        <Text style={styles.selectCardName} numberOfLines={1}>
          {inspiration.name}
        </Text>
        <Text style={styles.selectCardType}>
          {inspiration.type}
        </Text>
        {isSelected && (
          <View style={styles.selectIndicator}>
            <Text style={styles.selectIndicatorText}>✓</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  </TouchableOpacity>
));

export const ExportScreen: React.FC = () => {
  const navigation = useNavigation<ExportScreenNavigationProp>();

  // 状态
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showSelectDialog, setShowSelectDialog] = useState(false);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportResultDialog, setShowImportResultDialog] = useState(false);

  // 导出历史
  const exportHistory = getExportHistory();

  // 加载灵感列表（用于单选导出）
  const loadInspirationsForSelect = useCallback(async () => {
    const allInspirations = await getAllInspirations();
    setInspirations(allInspirations);
    setShowSelectDialog(true);
  }, []);

  // 导出全部
  const handleExportAll = useCallback(async () => {
    setIsExporting(true);
    const result = await exportAllInspirations();
    setIsExporting(false);

    if (result.success) {
      setSnackbarMessage('导出成功！请选择保存方式');
      setSnackbarVisible(true);
      addExportHistory({
        fileName: result.filePath?.split('/').pop() || '',
        exportTime: new Date().toISOString(),
        inspirationCount: inspirations.length || 0,
      });
    } else {
      Alert.alert('导出失败', result.error || '未知错误');
    }
  }, [inspirations.length]);

  // 导出单个
  const handleExportSingle = useCallback(async () => {
    if (!selectedId) {
      Alert.alert('请选择灵感');
      return;
    }

    setIsExporting(true);
    setShowSelectDialog(false);
    const result = await exportSingleInspiration(selectedId);
    setIsExporting(false);
    setSelectedId(null);

    if (result.success) {
      setSnackbarMessage('导出成功！');
      setSnackbarVisible(true);
    } else {
      Alert.alert('导出失败', result.error || '未知错误');
    }
  }, [selectedId]);

  // 导入文件
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    const result = await importFromFile();
    setIsImporting(false);

    setImportResult(result);
    setShowImportResultDialog(true);
  }, []);

  // 选择灵感
  const handleSelectInspiration = useCallback((id: string) => {
    setSelectedId(id === selectedId ? null : id);
  }, [selectedId]);

  // 关闭选择对话框
  const handleCloseSelectDialog = useCallback(() => {
    setShowSelectDialog(false);
    setSelectedId(null);
  }, []);

  // 返回
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={styles.title}>数据管理</Text>
        <Text style={styles.subtitle}>导出或导入您的灵感数据</Text>
      </View>

      {/* 导出卡片 */}
      <Card style={styles.card}>
        <Card.Title title="📤 导出灵感" subtitle="将灵感保存为 JSON 文件" />
        <Card.Content>
          <Text style={styles.cardDescription}>
            导出的文件可通过系统分享菜单保存到云盘、发送到微信或保存到本地。
          </Text>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="outlined"
            onPress={loadInspirationsForSelect}
            disabled={isExporting}
            textColor={barColors.primary}
          >
            导出单个
          </Button>
          <Button
            mode="contained"
            onPress={handleExportAll}
            disabled={isExporting}
            style={styles.exportButton}
          >
            {isExporting ? <ActivityIndicator color={barColors.background} size="small" /> : '导出全部'}
          </Button>
        </Card.Actions>
      </Card>

      {/* 导入卡片 */}
      <Card style={styles.card}>
        <Card.Title title="📥 导入灵感" subtitle="从 JSON 文件恢复灵感" />
        <Card.Content>
          <Text style={styles.cardDescription}>
            选择 JSON 文件导入灵感。已存在的灵感将被跳过，不会重复导入。
          </Text>
        </Card.Content>
        <Card.Actions style={styles.cardActions}>
          <Button
            mode="contained"
            onPress={handleImport}
            disabled={isImporting}
            style={styles.importButton}
          >
            {isImporting ? <ActivityIndicator color={barColors.background} size="small" /> : '选择文件'}
          </Button>
        </Card.Actions>
      </Card>

      {/* 导出历史 */}
      {exportHistory.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title="📋 最近导出记录" />
          <Card.Content>
            {exportHistory.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyFileName} numberOfLines={1}>
                  {item.fileName}
                </Text>
                <Text style={styles.historyTime}>
                  {new Date(item.exportTime).toLocaleString('zh-CN')}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* 返回按钮 */}
      <Button
        mode="outlined"
        onPress={handleGoBack}
        style={styles.backButton}
        textColor={barColors.text}
      >
        返回吧台
      </Button>

      {/* 选择灵感对话框 */}
      <Portal>
        <Dialog visible={showSelectDialog} onDismiss={handleCloseSelectDialog}>
          <Dialog.Title>选择要导出的灵感</Dialog.Title>
          <Dialog.Content>
            {inspirations.length === 0 ? (
              <Text style={styles.emptyText}>暂无灵感</Text>
            ) : (
              <View style={styles.selectList}>
                {inspirations.map((inspiration) => (
                  <InspirationSelectCard
                    key={inspiration.id}
                    inspiration={inspiration}
                    isSelected={selectedId === inspiration.id}
                    onPress={() => handleSelectInspiration(inspiration.id)}
                  />
                ))}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseSelectDialog} textColor={barColors.textSecondary}>
              取消
            </Button>
            <Button
              onPress={handleExportSingle}
              disabled={!selectedId}
              textColor={barColors.primary}
            >
              导出
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 导入结果对话框 */}
      <Portal>
        <Dialog visible={showImportResultDialog} onDismiss={() => setShowImportResultDialog(false)}>
          <Dialog.Title>导入结果</Dialog.Title>
          <Dialog.Content>
            {importResult && (
              <View>
                <Text style={styles.resultText}>
                  ✅ 成功导入: {importResult.importedCount} 条
                </Text>
                <Text style={styles.resultText}>
                  ⏭️ 已跳过: {importResult.skippedCount} 条（已存在）
                </Text>
                {importResult.errors.length > 0 && (
                  <View style={styles.errorList}>
                    <Text style={styles.errorTitle}>错误:</Text>
                    {importResult.errors.map((err, i) => (
                      <Text key={i} style={styles.errorText}>
                        {err}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowImportResultDialog(false)} textColor={barColors.primary}>
              确定
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: barColors.background,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: barColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: barColors.textSecondary,
  },
  card: {
    marginBottom: 16,
    backgroundColor: barColors.surface,
  },
  cardDescription: {
    fontSize: 12,
    color: barColors.textSecondary,
    marginBottom: 8,
  },
  cardActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  exportButton: {
    marginLeft: 8,
    backgroundColor: barColors.primary,
  },
  importButton: {
    backgroundColor: barColors.primary,
  },
  backButton: {
    marginTop: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: barColors.border,
  },
  historyFileName: {
    fontSize: 12,
    color: barColors.text,
    flex: 1,
  },
  historyTime: {
    fontSize: 10,
    color: barColors.textSecondary,
  },
  selectList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectCard: {
    width: 120,
    margin: 4,
    backgroundColor: barColors.surface,
  },
  selectCardActive: {
    backgroundColor: barColors.primary,
  },
  selectCardContent: {
    padding: 8,
  },
  selectCardName: {
    fontSize: 12,
    color: barColors.text,
    fontWeight: 'bold',
  },
  selectCardType: {
    fontSize: 10,
    color: barColors.textSecondary,
    marginTop: 4,
  },
  selectIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: barColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectIndicatorText: {
    color: barColors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: barColors.textSecondary,
    padding: 16,
  },
  resultText: {
    fontSize: 14,
    color: barColors.text,
    marginBottom: 8,
  },
  errorList: {
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 12,
    color: '#f44336',
    marginTop: 4,
  },
});