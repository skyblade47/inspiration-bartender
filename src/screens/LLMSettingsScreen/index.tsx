import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  TextInput,
  Portal,
  Dialog,
  List,
  Chip,
  ActivityIndicator,
  Divider,
  Menu,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types';
import { barColors } from '../../constants/theme';
import {
  LLMProvider,
  LLMConfig,
  OpenAIConfig,
  AnthropicConfig,
  OllamaConfig,
  initConfigDatabase,
  saveConfig,
  getAllConfigs,
  getDefaultConfig,
  deleteConfig,
  setDefaultConfig,
  validateConfig,
  getDefaultModels,
} from '../../services/llm/config';
import { createProvider, MessageRole } from '../../services/llm/provider';

type LLMSettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LLMSettings'>;

// 提供商信息
const PROVIDER_INFO = {
  [LLMProvider.OPENAI]: {
    name: 'OpenAI',
    icon: '🤖',
    description: 'GPT-4 / GPT-3.5 模型',
    color: '#10a37f',
  },
  [LLMProvider.ANTHROPIC]: {
    name: 'Anthropic',
    icon: '🧠',
    description: 'Claude 系列模型',
    color: '#d4770c',
  },
  [LLMProvider.OLLAMA]: {
    name: 'Ollama',
    icon: '💻',
    description: '本地部署的开源模型',
    color: '#6366f1',
  },
};

// 配置卡片组件
interface ConfigCardProps {
  provider: LLMProvider;
  config?: LLMConfig;
  isDefault: boolean;
  onEdit: (provider: LLMProvider) => void;
  onTest: (provider: LLMProvider) => void;
  onDelete: (provider: LLMProvider) => void;
  onSetDefault: (provider: LLMProvider) => void;
}

const ConfigCard = memo(({
  provider,
  config,
  isDefault,
  onEdit,
  onTest,
  onDelete,
  onSetDefault,
}: ConfigCardProps) => {
  const info = PROVIDER_INFO[provider];
  const isConfigured = !!config;
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <Card style={styles.configCard}>
      <Card.Title
        title={`${info.icon} ${info.name}`}
        subtitle={isConfigured ? info.description : '未配置'}
        left={() => (
          <View style={[styles.statusDot, { backgroundColor: isConfigured ? '#10a37f' : '#ef4444' }]} />
        )}
        right={() => (
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            {isConfigured && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onEdit(provider);
                }}
                title="编辑"
                leadingIcon="pencil"
              />
            )}
            <Menu.Item
              onPress={() => {
                setMenuVisible(false);
                onTest(provider);
              }}
              title="测试"
              leadingIcon="play"
              disabled={!isConfigured}
            />
            {isConfigured && !isDefault && (
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  onSetDefault(provider);
                }}
                title="设为默认"
                leadingIcon="star-outline"
              />
            )}
            {isConfigured && (
              <>
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(false);
                    onDelete(provider);
                  }}
                  title="删除"
                  leadingIcon="delete"
                  titleStyle={{ color: '#ef4444' }}
                />
              </>
            )}
          </Menu>
        )}
      />
      {isConfigured && config && (
        <Card.Content>
          <View style={styles.configDetails}>
            <Chip icon="key" style={styles.chip}>API Key: ****{String((config as OpenAIConfig).apiKey || '').slice(-4)}</Chip>
            <Chip icon="brain" style={styles.chip}>模型: {config.model}</Chip>
          </View>
          {isDefault && (
            <Chip icon="star" style={styles.defaultChip} textStyle={styles.defaultChipText}>
              当前默认
            </Chip>
          )}
        </Card.Content>
      )}
      {!isConfigured && (
        <Card.Actions>
          <Button mode="outlined" onPress={() => onEdit(provider)}>
            添加配置
          </Button>
        </Card.Actions>
      )}
    </Card>
  );
});

export const LLMSettingsScreen: React.FC = () => {
  const navigation = useNavigation<LLMSettingsNavigationProp>();
  const insets = useSafeAreaInsets();

  // 状态
  const [configs, setConfigs] = useState<LLMConfig[]>([]);
  const [defaultProvider, setDefaultProvider] = useState<LLMProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 对话框状态
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [testDialogVisible, setTestDialogVisible] = useState(false);
  const [testingProvider, setTestingProvider] = useState<LLMProvider | null>(null);

  // 表单状态
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [modelDropdownVisible, setModelDropdownVisible] = useState(false);

  // 测试状态
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; duration?: number } | null>(null);

  // 加载配置
  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      await initConfigDatabase();
      const allConfigs = await getAllConfigs();
      const defaultConfig = await getDefaultConfig();
      setConfigs(allConfigs);
      setDefaultProvider(defaultConfig?.provider || null);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  // 获取配置
  const getConfigByProvider = (provider: LLMProvider): LLMConfig | undefined => {
    return configs.find(c => c.provider === provider);
  };

  // 打开编辑对话框
  const handleEdit = useCallback((provider: LLMProvider) => {
    const existingConfig = getConfigByProvider(provider);
    setEditingProvider(provider);
    setApiKey((existingConfig as OpenAIConfig | AnthropicConfig)?.apiKey || '');
    setBaseUrl((existingConfig as OpenAIConfig | AnthropicConfig)?.baseUrl || '');
    setModels(getDefaultModels(provider));
    setSelectedModel(existingConfig?.model || getDefaultModels(provider)[0] || '');
    setDialogVisible(true);
  }, [configs]);

  // 保存配置
  const handleSave = useCallback(async () => {
    if (!editingProvider) return;

    // 验证
    if (editingProvider !== LLMProvider.OLLAMA && !apiKey.trim()) {
      Alert.alert('错误', '请输入 API Key');
      return;
    }
    if (!selectedModel) {
      Alert.alert('错误', '请选择模型');
      return;
    }

    try {
      let config: LLMConfig;

      if (editingProvider === LLMProvider.OPENAI) {
        config = {
          provider: LLMProvider.OPENAI,
          apiKey: apiKey.trim(),
          model: selectedModel,
          baseUrl: baseUrl.trim() || undefined,
        } as OpenAIConfig;
      } else if (editingProvider === LLMProvider.ANTHROPIC) {
        config = {
          provider: LLMProvider.ANTHROPIC,
          apiKey: apiKey.trim(),
          model: selectedModel,
          baseUrl: baseUrl.trim() || undefined,
        } as AnthropicConfig;
      } else {
        config = {
          provider: LLMProvider.OLLAMA,
          model: selectedModel,
          baseUrl: baseUrl.trim() || 'http://192.168.1.10:11434',
        } as OllamaConfig;
      }

      await saveConfig(config, !defaultProvider);
      await loadConfigs();
      setDialogVisible(false);
      Alert.alert('成功', '配置已保存');
    } catch (error) {
      Alert.alert('错误', `保存失败: ${(error as Error).message}`);
    }
  }, [editingProvider, apiKey, baseUrl, selectedModel, defaultProvider, loadConfigs]);

  // 删除配置
  const handleDelete = useCallback((provider: LLMProvider) => {
    Alert.alert(
      '确认删除',
      `确定要删除 ${PROVIDER_INFO[provider].name} 的配置吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteConfig(provider);
              await loadConfigs();
            } catch (error) {
              Alert.alert('错误', `删除失败: ${(error as Error).message}`);
            }
          },
        },
      ]
    );
  }, [loadConfigs]);

  // 设置默认
  const handleSetDefault = useCallback(async (provider: LLMProvider) => {
    try {
      await setDefaultConfig(provider);
      setDefaultProvider(provider);
      Alert.alert('成功', `${PROVIDER_INFO[provider].name} 已设为默认`);
    } catch (error) {
      Alert.alert('错误', `设置失败: ${(error as Error).message}`);
    }
  }, []);

  // 测试连接
  const handleTest = useCallback(async (provider: LLMProvider) => {
    const config = getConfigByProvider(provider);
    if (!config) {
      Alert.alert('错误', '请先配置后再测试');
      return;
    }

    setTestingProvider(provider);
    setTestResult(null);
    setTestDialogVisible(true);
    setIsTesting(true);

    const startTime = Date.now();

    try {
      const providerInstance = createProvider(config);
      const response = await providerInstance.chat({
        messages: [
          { role: MessageRole.USER, content: '请回复"连接成功"，不要包含其他内容。' },
        ],
        maxTokens: 50,
      });

      const duration = Date.now() - startTime;
      setTestResult({
        success: true,
        message: response.content,
        duration,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      setTestResult({
        success: false,
        message: (error as Error).message,
        duration,
      });
    } finally {
      setIsTesting(false);
    }
  }, [configs]);

  // 返回
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={barColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>LLM 设置</Text>
        <Text style={styles.subtitle}>配置 AI 语言模型以启用智能对话。同时支持电脑端小说教练 HTTP 服务地址和 Ollama 本地服务地址。</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 当前状态 */}
        {defaultProvider && (
          <Card style={styles.statusCard}>
            <Card.Title
              title="当前状态"
              left={() => <Text style={styles.statusIcon}>🟢</Text>}
            />
            <Card.Content>
              <Text style={styles.statusText}>
                已连接 {PROVIDER_INFO[defaultProvider].name} · {getConfigByProvider(defaultProvider)?.model}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* 配置列表 */}
        <Text style={styles.sectionTitle}>可用提供商</Text>
        {([LLMProvider.OPENAI, LLMProvider.ANTHROPIC, LLMProvider.OLLAMA] as LLMProvider[]).map((provider) => (
          <ConfigCard
            key={provider}
            provider={provider}
            config={getConfigByProvider(provider)}
            isDefault={defaultProvider === provider}
            onEdit={handleEdit}
            onTest={handleTest}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        ))}
      </ScrollView>

      {/* 返回按钮 */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button mode="outlined" onPress={handleGoBack} textColor={barColors.text}>
          返回
        </Button>
      </View>

      {/* 编辑对话框 */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingProvider ? `配置 ${PROVIDER_INFO[editingProvider].name}` : '配置 LLM'}
          </Dialog.Title>
          <Dialog.ScrollArea style={styles.dialogScrollArea}>
            <ScrollView>
              {editingProvider !== LLMProvider.OLLAMA && (
                <TextInput
                  label="API Key"
                  value={apiKey}
                  onChangeText={setApiKey}
                  secureTextEntry
                  style={styles.input}
                  mode="outlined"
                />
              )}
              {editingProvider === LLMProvider.OLLAMA && (
                <>
                  <TextInput
                    label="服务地址"
                    value={baseUrl}
                    onChangeText={setBaseUrl}
                    placeholder="http://192.168.1.10:11434"
                    style={styles.input}
                    mode="outlined"
                  />
                  <Text style={styles.helperText}>
                    Android 真机不能使用电脑的 localhost，请填写电脑的局域网地址，例如 http://192.168.1.10:11434。在可信局域网使用时请注意网络安全风险，避免在公共 WiFi 下暴露服务地址。
                  </Text>
                </>
              )}
              {editingProvider !== LLMProvider.OLLAMA && (
                <TextInput
                  label="自定义端点（可选）"
                  value={baseUrl}
                  onChangeText={setBaseUrl}
                  placeholder={`https://api.${editingProvider?.toString()}.com`}
                  style={styles.input}
                  mode="outlined"
                />
              )}
              <Text style={styles.modelLabel}>选择模型</Text>
              <Menu
                visible={modelDropdownVisible}
                onDismiss={() => setModelDropdownVisible(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setModelDropdownVisible(true)}
                    style={styles.modelButton}
                  >
                    {selectedModel || '请选择模型'}
                  </Button>
                }
              >
                {models.map((model) => (
                  <Menu.Item
                    key={model}
                    onPress={() => {
                      setSelectedModel(model);
                      setModelDropdownVisible(false);
                    }}
                    title={model}
                  />
                ))}
              </Menu>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>取消</Button>
            <Button onPress={handleSave}>保存</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 测试对话框 */}
      <Portal>
        <Dialog visible={testDialogVisible} onDismiss={() => setTestDialogVisible(false)}>
          <Dialog.Title>测试连接</Dialog.Title>
          <Dialog.Content>
            {isTesting && (
              <View style={styles.testingContainer}>
                <ActivityIndicator size="small" color={barColors.primary} />
                <Text style={styles.testingText}>正在测试...</Text>
              </View>
            )}
            {testResult && (
              <View>
                <View style={[styles.resultBadge, testResult.success ? styles.successBadge : styles.errorBadge]}>
                  <Text style={styles.resultBadgeText}>
                    {testResult.success ? '✅ 连接成功' : '❌ 连接失败'}
                  </Text>
                </View>
                <Text style={styles.testPrompt}>测试内容: "请回复'连接成功'"</Text>
                <Text style={styles.testResponse}>响应: {testResult.message}</Text>
                {testResult.duration && (
                  <Text style={styles.testDuration}>延迟: {(testResult.duration / 1000).toFixed(2)}s</Text>
                )}
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setTestDialogVisible(false)}>关闭</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: barColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: barColors.background,
  },
  header: {
    padding: 16,
    paddingTop: 24,
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
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    marginBottom: 16,
    backgroundColor: barColors.surface,
  },
  statusIcon: {
    fontSize: 24,
  },
  statusText: {
    color: barColors.text,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: barColors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  configCard: {
    marginBottom: 12,
    backgroundColor: barColors.surface,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  configDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  defaultChip: {
    marginTop: 8,
    backgroundColor: barColors.primary,
    alignSelf: 'flex-start',
  },
  defaultChipText: {
    color: '#fff',
  },
  footer: {
    padding: 16,
  },
  dialogScrollArea: {
    maxHeight: 300,
    paddingHorizontal: 24,
  },
  input: {
    marginBottom: 16,
    backgroundColor: barColors.background,
  },
  helperText: {
    marginTop: -8,
    marginBottom: 16,
    fontSize: 12,
    color: barColors.textSecondary,
    lineHeight: 18,
  },
  modelLabel: {
    fontSize: 14,
    color: barColors.textSecondary,
    marginBottom: 8,
  },
  modelButton: {
    marginBottom: 16,
  },
  testingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  testingText: {
    marginLeft: 12,
    color: barColors.text,
  },
  resultBadge: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  successBadge: {
    backgroundColor: 'rgba(16, 163, 127, 0.2)',
  },
  errorBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  resultBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  testPrompt: {
    fontSize: 12,
    color: barColors.textSecondary,
    marginBottom: 8,
  },
  testResponse: {
    fontSize: 14,
    color: barColors.text,
    marginBottom: 8,
  },
  testDuration: {
    fontSize: 12,
    color: barColors.textSecondary,
  },
});
