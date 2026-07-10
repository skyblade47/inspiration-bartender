import React from 'react';
import { createRoot } from 'react-dom/client';

const inspirations = [
  { id: '1', name: '街角的咖啡店', type: 'MASON', completion: 45 },
  { id: '2', name: '雨天的爵士乐', type: 'CHAMPAGNE', completion: 70 },
  { id: '3', name: '老电影氛围', type: 'WINE', completion: 30 },
];

const GLASS_COLORS: Record<string, string> = {
  BRANDY: '#1E3A5F',
  CHAMPAGNE: '#9B59B6',
  WINE: '#8B0000',
  COCKTAIL: '#D4A017',
  BEAKER: '#00FF7F',
  MASON: '#FF8C00',
  FLASK: '#87CEEB',
  MARTINI: '#C0C0C0',
};

function GlassCard({ inspiration, isSelected, onClick }: { inspiration: any; isSelected: boolean; onClick: () => void }) {
  const color = GLASS_COLORS[inspiration.type] || '#D4A017';
  const height = inspiration.completion;

  return (
    <div
      className={`glass-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {isSelected && <div className="check-mark">✓</div>}
      <div className="glass-body">
        <div
          className="glass-liquid"
          style={{ height: `${height}%`, backgroundColor: color }}
        />
      </div>
      <p className="glass-name">{inspiration.name}</p>
      <p className="glass-percent">{inspiration.completion}%</p>
    </div>
  );
}

const PRESETS = [
  { name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o', apiKeyPlaceholder: 'sk-...' },
  { name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-v4', apiKeyPlaceholder: 'sk-...' },
  { name: 'Moonshot', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k', apiKeyPlaceholder: 'sk-...' },
  { name: 'Qwen', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-turbo', apiKeyPlaceholder: 'sk-...' },
  { name: 'Ollama', baseUrl: 'http://localhost:11434/v1', model: 'llama3', apiKeyPlaceholder: 'ollama' },
];

function WebApp() {
  const [selected, setSelected] = React.useState<string[]>([]);
  const [showSettings, setShowSettings] = React.useState(false);
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState('');
  const [model, setModel] = React.useState('');
  const [testStatus, setTestStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = React.useState('');

  const toggleSelection = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setBaseUrl(preset.baseUrl);
    setModel(preset.model);
  };

  const testConnection = async () => {
    if (!apiKey || !baseUrl || !model) {
      setTestStatus('error');
      setTestMessage('请填写完整的 API Key、端点和模型名称');
      return;
    }

    setTestStatus('loading');
    setTestMessage('正在测试连接...');

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 10,
          temperature: 0,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const result = await response.json();

      if (response.ok && result.choices && result.choices.length > 0) {
        setTestStatus('success');
        setTestMessage('连接成功！模型: ' + model);
      } else {
        setTestStatus('error');
        setTestMessage('连接失败: ' + (result.error?.message || '未知错误'));
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage('连接失败: ' + (error as Error).message);
    }
  };

  return (
    <div className="container">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; background: #1a1410; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; }
        .container { min-height: 100vh; color: #E8D5B7; }
        .header { padding: 16px; display: flex; justify-content: space-between; align-items: center; }
        .title { color: #D4A017; font-size: 24px; font-weight: bold; margin: 0; }
        .settings-btn { padding: 8px; cursor: pointer; font-size: 20px; transition: transform 0.2s; }
        .settings-btn:active { transform: scale(0.9); }
        .settings-panel { padding: 16px; background: rgba(255,255,255,0.05); }
        .form-group { margin-bottom: 12px; }
        .form-label { color: #A8A8A8; font-size: 12px; display: block; margin-bottom: 4px; }
        .form-input, .form-select { width: 100%; padding: 8px; background: rgba(0,0,0,0.3); color: #E8D5B7; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; }
        .form-input:focus, .form-select:focus { outline: none; border-color: #D4A017; }
        .bar-scene { background: rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin: 16px; }
        .hint { color: #A8A8A8; font-size: 14px; text-align: center; margin-bottom: 16px; }
        .glasses { display: flex; flex-wrap: wrap; justify-content: center; }
        .glass-card { width: 140px; margin: 8px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s; position: relative; }
        .glass-card:hover { transform: scale(1.05); }
        .glass-card:active { transform: scale(0.95); }
        .glass-card.selected { background: rgba(212, 160, 23, 0.2); border: 2px solid #D4A017; }
        .check-mark { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-radius: 50%; background: #D4A017; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #000; font-weight: bold; }
        .glass-body { width: 50px; height: 70px; background: rgba(255,255,255,0.1); border: 2px solid rgba(255,255,255,0.2); border-radius: 4px 4px 20px 20px; margin: 0 auto 8px; position: relative; overflow: hidden; }
        .glass-liquid { position: absolute; bottom: 0; left: 0; right: 0; border-radius: 0 0 18px 18px; }
        .glass-name { color: #E8D5B7; font-size: 13px; margin: 0; }
        .glass-percent { color: #A8A8A8; font-size: 11px; margin-top: 4px; }
        .selection-info { text-align: center; margin-top: 16px; color: #A8A8A8; font-size: 12px; }
        .actions { display: flex; justify-content: center; gap: 12px; margin: 16px; }
        .btn { padding: 12px 24px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; transition: all 0.15s; }
        .btn-primary { background: #D4A017; color: #000; }
        .btn-primary:hover { background: #E5B830; }
        .btn-primary:active { transform: translateY(2px); }
        .btn-secondary { background: rgba(255,255,255,0.1); color: #A8A8A8; }
        .btn-secondary:hover { background: rgba(255,255,255,0.15); }
        .btn-secondary:active { transform: translateY(2px); }
        .btn-success { background: #22C55E; color: #000; }
        .btn-success:hover { background: #2DC869; }
        .btn-success:active { transform: translateY(2px); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .info { background: rgba(255,255,255,0.03); border-radius: 12px; padding: 16px; margin: 16px; }
        .info-title { color: #D4A017; font-size: 14px; margin: 0 0 8px; }
        .info-text { color: #A8A8A8; font-size: 12px; line-height: 1.6; white-space: pre-line; margin: 0; }
        .test-result { margin-top: 12px; padding: 12px; border-radius: 8px; font-size: 12px; }
        .test-result.success { background: rgba(34, 197, 94, 0.1); color: #22C55E; border: 1px solid rgba(34, 197, 94, 0.3); }
        .test-result.error { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.3); }
        .test-result.loading { background: rgba(212, 160, 23, 0.1); color: #D4A017; border: 1px solid rgba(212, 160, 23, 0.3); }
        .preset-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .preset-tag { padding: 4px 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; font-size: 12px; cursor: pointer; transition: all 0.15s; }
        .preset-tag:hover { background: rgba(212, 160, 23, 0.2); border-color: #D4A017; }
        .preset-tag:active { transform: scale(0.95); }
      `}</style>

      <div className="header">
        <h1 className="title">🍸 灵感调酒师</h1>
        <div className="settings-btn" onClick={() => setShowSettings(!showSettings)}>⚙️</div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h2 style={{ color: '#D4A017', fontSize: 16, margin: '0 0 12px' }}>⚙️ LLM 配置（OpenAI 兼容格式）</h2>

          <p style={{ color: '#A8A8A8', fontSize: 12, margin: '0 0 12px' }}>选择预设或手动输入自定义配置：</p>

          <div className="preset-tags">
            {PRESETS.map(p => (
              <div key={p.name} className="preset-tag" onClick={() => applyPreset(p)}>{p.name}</div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label">API Key</label>
            <input type="password" className="form-input" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
          </div>

          <div className="form-group">
            <label className="form-label">API 端点（Base URL）</label>
            <input type="text" className="form-input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" />
          </div>

          <div className="form-group">
            <label className="form-label">模型名称</label>
            <input type="text" className="form-input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o" />
          </div>

          <button
            className={'btn ' + (testStatus === 'success' ? 'btn-success' : 'btn-primary')}
            onClick={testConnection}
            disabled={testStatus === 'loading'}
          >
            {testStatus === 'loading' ? '测试中...' : '🔗 测试连接'}
          </button>

          {testStatus !== 'idle' && (
            <div className={'test-result ' + testStatus}>{testMessage}</div>
          )}
        </div>
      )}

      <div className="bar-scene">
        <p className="hint">💡 点击选择 2-3 个灵感进行碰撞混合</p>

        <div className="glasses">
          {inspirations.map(insp => (
            <GlassCard key={insp.id} inspiration={insp} isSelected={selected.includes(insp.id)} onClick={() => toggleSelection(insp.id)} />
          ))}
        </div>

        <p className="selection-info">已选择: {selected.length}/3</p>
      </div>

      <div className="actions">
        <button className="btn btn-primary">➕ 添加灵感</button>
        <button className={'btn ' + (selected.length >= 2 ? 'btn-primary' : 'btn-secondary')}>🍸 调制特调</button>
      </div>

      <div className="info">
        <h3 className="info-title">📌 使用说明</h3>
        <p className="info-text">这是灵感调酒师的 Web 测试版本。\n\nLLM 配置使用 OpenAI 兼容格式：\n1. 选择预设快速填充端点和模型\n2. 或手动输入自定义的 API Key、端点和模型名称\n3. 点击"测试连接"验证配置是否正确\n\n支持的预设提供商：\n• OpenAI (gpt-4o)\n• DeepSeek (deepseek-v4)\n• Moonshot (月之暗面)\n• Qwen (通义千问)\n• Ollama (本地部署)</p>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<WebApp />);
}