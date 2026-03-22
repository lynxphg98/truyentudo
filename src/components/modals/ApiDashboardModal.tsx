import React, { useEffect, useState } from 'react';
import { CheckCircle, Copy, Eye, EyeOff, Key, Plus, Trash2, X } from 'lucide-react';
import type { ApiKeyConfig } from '@/types';

interface ApiDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeyConfig[];
  onUpdateKeys: (keys: ApiKeyConfig[]) => void;
}

type ProviderOption = {
  id: ApiKeyConfig['provider'];
  name: string;
  baseUrl: string;
  models: string[];
};

const PROVIDERS: ProviderOption[] = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: '',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash'],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o-mini', 'gpt-4o'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'],
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3', 'qwen2.5'],
  },
];

const getProvider = (providerId: string) => PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0];

export const ApiDashboardModal: React.FC<ApiDashboardModalProps> = ({
  isOpen,
  onClose,
  apiKeys = [],
  onUpdateKeys,
}) => {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<ApiKeyConfig['provider']>('gemini');
  const [modelName, setModelName] = useState('gemini-2.0-flash');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    const providerInfo = getProvider(provider);
    setModelName(providerInfo.models[0] || '');
  }, [provider]);

  if (!isOpen) return null;

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !apiKeyValue.trim()) return;

    const providerInfo = getProvider(provider);
    const newKey: ApiKeyConfig = {
      id: crypto.randomUUID(),
      name: name.trim(),
      provider,
      key: apiKeyValue.trim(),
      baseUrl: providerInfo.baseUrl,
      modelName: modelName.trim() || providerInfo.models[0],
      usageCount: 0,
      isActive: apiKeys.length === 0,
    };

    onUpdateKeys([...apiKeys, newKey]);
    setName('');
    setApiKeyValue('');
  };

  const handleDeleteKey = (id: string) => {
    const filtered = apiKeys.filter((k) => k.id !== id);
    const hasActive = filtered.some((k) => k.isActive);
    const fixed = hasActive ? filtered : filtered.map((k, idx) => ({ ...k, isActive: idx === 0 }));
    onUpdateKeys(fixed);
  };

  const handleSetActive = (id: string) => {
    const updated = apiKeys.map((k) => ({ ...k, isActive: k.id === id }));
    onUpdateKeys(updated);
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_err) {
      setCopiedId(null);
    }
  };

  const activeProvider = getProvider(provider);

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Quan ly API Key</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          <form onSubmit={handleAddKey} className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Them API key that</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ten goi nho (VD: Gemini chinh)"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white text-sm"
              />

              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ApiKeyConfig['provider'])}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white text-sm"
              >
                {PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Model name"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white text-sm"
              />
              <input
                type="password"
                value={apiKeyValue}
                onChange={(e) => setApiKeyValue(e.target.value)}
                placeholder="Nhap API key that"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 dark:text-white text-sm"
              />
            </div>

            <p className="text-xs text-slate-500">
              Goi y model cho {activeProvider.name}: {activeProvider.models.join(', ')}
            </p>

            <button
              type="submit"
              disabled={!name.trim() || !apiKeyValue.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Luu key
            </button>
          </form>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Danh sach key ({apiKeys.length})</h3>
            {apiKeys.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-sm">
                Chua co API key nao.
              </div>
            ) : (
              <div className="grid gap-3">
                {apiKeys.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{item.name}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                          {item.provider}
                        </span>
                        {item.isActive && (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full">
                            Dang dung
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-2">
                        model: {item.modelName} {item.baseUrl ? `| base: ${item.baseUrl}` : ''}
                      </p>
                      <div className="flex items-center gap-2 font-mono text-sm text-slate-500">
                        <span className="truncate">
                          {showKeyId === item.id ? item.key : '••••••••••••••••••••••••••'}
                        </span>
                        <button
                          onClick={() => setShowKeyId(showKeyId === item.id ? null : item.id)}
                          className="p-1 hover:text-orange-500 transition-colors"
                        >
                          {showKeyId === item.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSetActive(item.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        Dung key nay
                      </button>

                      <button
                        onClick={() => copyToClipboard(item.key, item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          copiedId === item.id
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {copiedId === item.id ? (
                          <>
                            <CheckCircle size={14} /> Da chep
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Sao chep
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteKey(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Xoa key"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDashboardModal;
