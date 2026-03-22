import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  Download,
  Edit3,
  Feather,
  Key,
  Moon,
  Plus,
  Settings,
  Sparkles,
  Sun,
  Trash2,
  User,
  Users,
  Upload,
  Brain,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/util/cn';
import { handleApiError } from '@/util/errorHandler';
import StorageManager from '@/util/storage';
import { useApiCall } from '@/hooks/useApiCall';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Alert } from '@/components/ui/Alert';
import ApiDashboardModal from '@/components/modals/ApiDashboardModal';
import { ProfileModal } from '@/components/modals/ProfileModal';
import type { ApiKeyConfig, Story } from '@/types';

type AppView = 'stories' | 'characters' | 'tools';

const AI_PROVIDERS = {
  gemini: {
    baseUrl: '',
    defaultModel: 'gemini-2.0-flash',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  siliconflow: {
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
  },
} as const;

const MAX_STYLE_CHARS = 18000;

const normalizeApiKey = (key: Partial<ApiKeyConfig>, index: number): ApiKeyConfig => {
  const provider = (key.provider || 'gemini') as keyof typeof AI_PROVIDERS;
  const providerInfo = AI_PROVIDERS[provider] || AI_PROVIDERS.gemini;
  return {
    id: key.id || `key-${index}-${Date.now()}`,
    name: key.name || `API Key ${index + 1}`,
    provider,
    key: key.key || '',
    baseUrl: key.baseUrl || providerInfo.baseUrl,
    modelName: key.modelName || providerInfo.defaultModel,
    usageCount: typeof key.usageCount === 'number' ? key.usageCount : 0,
    isActive: Boolean(key.isActive),
  };
};

const callAiApi = async (
  prompt: string,
  config: ApiKeyConfig,
  onUsageUpdate?: (id: string) => void
): Promise<string> => {
  if (!config?.key?.trim()) {
    throw new Error('Chua cau hinh API Key.');
  }

  const provider = (config.provider || 'gemini') as keyof typeof AI_PROVIDERS;
  const providerInfo = AI_PROVIDERS[provider] || AI_PROVIDERS.gemini;
  const modelName = config.modelName || providerInfo.defaultModel;

  let response: Response;
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.key}`;
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
  } else {
    const baseUrl = config.baseUrl || providerInfo.baseUrl;
    const url = `${baseUrl}/chat/completions`;
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
  }

  const data = await response.json();

  if (!response.ok || data?.error) {
    throw new Error(data?.error?.message || 'Loi goi API.');
  }

  if (onUsageUpdate) onUsageUpdate(config.id);

  const text =
    provider === 'gemini'
      ? data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text || '').join('\n')
      : data?.choices?.[0]?.message?.content;

  if (!text || !text.trim()) {
    throw new Error('AI khong tra noi dung. Vui long thu lai.');
  }

  return text.trim();
};

const AppContent = () => {
  const { user, theme, toggleTheme } = useAuth();
  const { call: executeAiCall, loading: isProcessingAI } = useApiCall<string>();

  const styleInputRef = useRef<HTMLInputElement | null>(null);

  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [showApiDashboard, setShowApiDashboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [view, setView] = useState<AppView>('stories');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [styleCorpus, setStyleCorpus] = useState('');
  const [isLearningStyle, setIsLearningStyle] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    document.title = 'Truyen Tu Do - Cong truyen AI da nang';
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (favicon) {
      favicon.href = 'https://api.dicebear.com/7.x/initials/svg?seed=TTD&backgroundColor=f97316';
    }

    const savedApiKeys = StorageManager.getItem<ApiKeyConfig[]>('api_keys');
    const savedStories = StorageManager.getItem<Story[]>('stories');
    const savedStyleCorpus = StorageManager.getItem<string>('style_corpus');

    if (savedApiKeys?.length) {
      const normalized = savedApiKeys.map((item, idx) => normalizeApiKey(item, idx));
      const hasActive = normalized.some((item) => item.isActive);
      const fixed = hasActive ? normalized : normalized.map((item, idx) => ({ ...item, isActive: idx === 0 }));
      setApiKeys(fixed);
      StorageManager.setItem('api_keys', fixed);
    }

    if (savedStories) setStories(savedStories);
    if (savedStyleCorpus) setStyleCorpus(savedStyleCorpus);
  }, []);

  const getActiveKey = () => apiKeys.find((k) => k.isActive) || apiKeys[0];

  const saveStories = (newStories: Story[]) => {
    setStories(newStories);
    StorageManager.setItem('stories', newStories);
  };

  const trackUsage = (id: string) => {
    const updated = apiKeys.map((k) => (k.id === id ? { ...k, usageCount: k.usageCount + 1 } : k));
    setApiKeys(updated);
    StorageManager.setItem('api_keys', updated);
  };

  const appendStyleGuide = (prompt: string) => {
    if (!styleCorpus.trim()) return prompt;
    return `${prompt}

---
VAN PHONG MAU (tu cac file nguoi dung da tai len):
${styleCorpus.slice(-MAX_STYLE_CHARS)}

Yeu cau:
- Giu giong van phong, nhac dieu, toc do ke chuyen tu VAN PHONG MAU.
- Khong sao chep nguyen van doan van dai.
- Van phai hop mach truyen hien tai.`;
  };

  const openCreateEditor = (story?: Story) => {
    setIsCreating(true);
    if (story) {
      setSelectedStory(story);
      setEditorTitle(story.title);
      setEditorContent(story.content);
    } else {
      setSelectedStory(null);
      setEditorTitle('');
      setEditorContent('');
    }
  };

  const handleSaveStory = () => {
    if (!editorTitle.trim()) {
      setAlertMessage({ type: 'warning', message: 'Vui long nhap tieu de.' });
      return;
    }

    const data: Partial<Story> = {
      title: editorTitle.trim(),
      content: editorContent.trim(),
      type: selectedStory?.type || 'original',
    };

    const nextStories = selectedStory
      ? stories.map((s) =>
          s.id === selectedStory.id ? { ...s, ...data, updatedAt: new Date().toISOString() } as Story : s
        )
      : [
          {
            id: `story-${Date.now()}`,
            title: data.title || '',
            content: data.content || '',
            type: data.type || 'original',
            updatedAt: new Date().toISOString(),
          },
          ...stories,
        ];

    saveStories(nextStories);
    setIsCreating(false);
    setSelectedStory(null);
    setEditorTitle('');
    setEditorContent('');
    setAlertMessage({ type: 'success', message: 'Da luu truyen thanh cong.' });
  };

  const handleAIAction = async (prompt: string, callback: (res: string) => void) => {
    const key = getActiveKey();
    if (!key) {
      setShowApiDashboard(true);
      setAlertMessage({
        type: 'warning',
        message: 'Ban chua cau hinh API Key. Vui long cai dat truoc.',
      });
      return;
    }

    try {
      const result = await executeAiCall(() => callAiApi(appendStyleGuide(prompt), key, trackUsage));
      if (!result) {
        setAlertMessage({ type: 'error', message: 'AI chua tra ket qua. Vui long thu lai.' });
        return;
      }
      callback(result);
      setAlertMessage({ type: 'success', message: 'AI da xu ly xong.' });
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      setAlertMessage({ type: 'error', message: apiError.message });
    }
  };

  const handleContinueStory = (story: Story) => {
    handleAIAction(
      `Viet tiep mot doan truyen moi, khop voi mach truyen sau:

${story.content.slice(-2500)}

Yeu cau:
- Viet tu nhien, mach lac.
- Khong lap lai doan vua co.
- Them mot tinh tiet moi de day truyen di tiep.`,
      (res) => {
        const nextStories = stories.map((s) =>
          s.id === story.id
            ? { ...s, content: `${s.content}\n\n${res}`, type: 'continued', updatedAt: new Date().toISOString() }
            : s
        );
        saveStories(nextStories);
        const nextSelected = nextStories.find((s) => s.id === story.id) || null;
        setSelectedStory(nextSelected);
      }
    );
  };

  const handleCreateOutline = () => {
    if (!editorTitle.trim()) {
      setAlertMessage({ type: 'warning', message: 'Vui long nhap tieu de truoc khi goi AI.' });
      return;
    }
    handleAIAction(
      `Tao dan y chi tiet cho truyen "${editorTitle.trim()}". Bao gom:
- Mo bai
- 3-5 su kien chinh
- Cao trao
- Ket mo`,
      (res) => setEditorContent(res)
    );
  };

  const handleStyleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setIsLearningStyle(true);
    try {
      const supported = ['.txt', '.md', '.markdown', '.json', '.csv', '.tsv', '.html', '.htm'];
      const chunks: string[] = [];

      for (const file of Array.from(fileList)) {
        const lowerName = file.name.toLowerCase();
        const ok = supported.some((ext) => lowerName.endsWith(ext));
        if (!ok) continue;

        const raw = await file.text();
        const cleaned = raw.replace(/\s+/g, ' ').trim();
        if (cleaned) {
          chunks.push(`[FILE: ${file.name}]\n${cleaned.slice(0, 10000)}`);
        }
      }

      if (!chunks.length) {
        setAlertMessage({
          type: 'warning',
          message: 'Chua doc duoc file hop le. Hay dung .txt, .md, .json, .csv hoac .html.',
        });
        return;
      }

      const merged = `${styleCorpus}\n\n${chunks.join('\n\n')}`.slice(-MAX_STYLE_CHARS);
      setStyleCorpus(merged);
      StorageManager.setItem('style_corpus', merged);
      setAlertMessage({
        type: 'success',
        message: `AI da hoc them van phong tu ${chunks.length} file.`,
      });
    } catch (_error) {
      setAlertMessage({ type: 'error', message: 'Khong the doc file. Vui long thu lai.' });
    } finally {
      setIsLearningStyle(false);
      e.target.value = '';
    }
  };

  const handleDeleteStory = (storyId: string) => {
    const nextStories = stories.filter((s) => s.id !== storyId);
    saveStories(nextStories);
    if (selectedStory?.id === storyId) {
      setSelectedStory(null);
    }
  };

  const styleSamples = stories.slice(0, 3);

  return (
    <div
      className={cn(
        'min-h-screen font-sans transition-colors duration-300 selection:bg-orange-100',
        theme === 'dark'
          ? 'bg-slate-900 text-slate-100'
          : 'bg-gradient-to-b from-amber-50 via-orange-50 to-white text-slate-800'
      )}
    >
      <ApiDashboardModal
        isOpen={showApiDashboard}
        onClose={() => setShowApiDashboard(false)}
        apiKeys={apiKeys}
        onUpdateKeys={(keys) => {
          const normalized = keys.map((item, idx) => normalizeApiKey(item, idx));
          setApiKeys(normalized);
          StorageManager.setItem('api_keys', normalized);
        }}
      />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {alertMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] max-w-xl">
          <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />
        </div>
      )}

      <nav
        className={cn(
          'fixed top-0 left-0 right-0 h-20 border-b z-50 flex items-center justify-between px-6 backdrop-blur-md',
          theme === 'dark'
            ? 'bg-slate-900/85 border-slate-800'
            : 'bg-white/90 border-orange-100 shadow-[0_8px_30px_rgba(120,53,15,0.08)]'
        )}
      >
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            setView('stories');
            setSelectedStory(null);
            setIsCreating(false);
          }}
        >
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg font-bold text-white">
            TTD
          </div>
          <span className="text-xl font-serif font-bold hidden sm:block tracking-tight">Truyen Tu Do</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md" onClick={toggleTheme} ariaLabel="Toggle theme">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </Button>

          <Button
            variant={getActiveKey() ? 'primary' : 'danger'}
            size="md"
            onClick={() => setShowApiDashboard(true)}
            ariaLabel="API Configuration"
            className="flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span className="hidden md:block text-xs">{getActiveKey() ? 'API OK' : 'Cai API'}</span>
          </Button>

          <Button variant="ghost" size="md" onClick={() => setShowProfile(true)} ariaLabel="Profile">
            <User className="w-5 h-5" />
          </Button>

          <button
            className="w-8 h-8 rounded-full border border-orange-200 overflow-hidden cursor-pointer"
            onClick={() => setShowProfile(true)}
            aria-label="Open profile"
          >
            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          </button>
        </div>
      </nav>

      <main className="pt-32 px-6 max-w-7xl mx-auto pb-40">
        {selectedStory && !isCreating ? (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <Button onClick={() => setSelectedStory(null)} variant="ghost" className="flex items-center gap-2 mb-8">
              <ChevronLeft /> Quay lai thu vien
            </Button>

            <div
              className={cn(
                'p-10 rounded-[40px] border shadow-sm leading-relaxed',
                theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100'
              )}
            >
              <h1 className="text-4xl font-serif font-bold mb-8 leading-tight tracking-tight">{selectedStory.title}</h1>
              <div className="prose prose-slate max-w-none text-lg whitespace-pre-wrap leading-[1.8] opacity-90">
                <ReactMarkdown>{selectedStory.content}</ReactMarkdown>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                loading={isProcessingAI}
                onClick={() => handleContinueStory(selectedStory)}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> Viet tiep bang AI
              </Button>

              <Button
                variant="secondary"
                onClick={() => openCreateEditor(selectedStory)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-5 h-5" /> Chinh sua
              </Button>
            </div>
          </div>
        ) : isCreating ? (
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <div className="flex items-center justify-between mb-10">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsCreating(false);
                  setSelectedStory(null);
                  setEditorTitle('');
                  setEditorContent('');
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={handleCreateOutline}
                  loading={isProcessingAI}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> AI phac thao
                </Button>

                <Button onClick={handleSaveStory}>Luu tac pham</Button>
              </div>
            </div>

            <div className="space-y-8">
              <Input
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                label="Tieu de tac pham"
                placeholder="Vi du: Thien Ha De Nhat Kiem"
                className="text-3xl font-serif font-bold"
              />

              <TextArea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                label="Noi dung truyen"
                placeholder="Hom nay ban muon viet gi?"
                className="min-h-[60vh] text-lg"
              />
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-16 gap-8">
              <div>
                <h2 className="text-6xl font-serif font-bold tracking-tight mb-8">Thu vien</h2>
                <div className="flex flex-col gap-3">
                  {(['stories', 'characters', 'tools'] as AppView[]).map((v) => (
                    <Button
                      key={v}
                      variant={view === v ? 'primary' : 'secondary'}
                      size="md"
                      onClick={() => setView(v)}
                      className="flex items-center gap-3 w-fit"
                    >
                      {v === 'stories' && <BookOpen className="w-4 h-4" />}
                      {v === 'characters' && <Users className="w-4 h-4" />}
                      {v === 'tools' && <Settings className="w-4 h-4" />}
                      {v === 'stories' && 'Truyen'}
                      {v === 'characters' && 'Nhan vat'}
                      {v === 'tools' && 'Cong cu'}
                    </Button>
                  ))}
                </div>
              </div>

              {view === 'stories' && (
                <div className="flex flex-wrap justify-end gap-4 md:mt-20">
                  <Button onClick={() => openCreateEditor()} className="flex items-center gap-3">
                    <Plus className="w-5 h-5" /> Viet truyen
                  </Button>
                </div>
              )}
            </div>

            {view === 'stories' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {[
                  { type: 'original' as const, title: 'Truyen sang tac', color: 'indigo' },
                  { type: 'translated' as const, title: 'Truyen dich', color: 'teal' },
                  { type: 'continued' as const, title: 'Truyen viet tiep', color: 'amber' },
                ].map(({ type, title, color }) => (
                  <div key={type} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn('p-3 rounded-xl text-white shadow-lg', {
                          'bg-indigo-600': color === 'indigo',
                          'bg-teal-600': color === 'teal',
                          'bg-amber-600': color === 'amber',
                        })}
                      >
                        {type === 'original' && <Feather />}
                        {type === 'translated' && <BookOpen />}
                        {type === 'continued' && <Sparkles />}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-xl">{title}</h3>
                        <p className="text-xs opacity-40 uppercase">
                          {stories.filter((s) => s.type === type).length} tac pham
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {stories.filter((s) => s.type === type).length > 0 ? (
                        stories
                          .filter((s) => s.type === type)
                          .map((story) => (
                            <div
                              key={story.id}
                              onClick={() => setSelectedStory(story)}
                              className={cn(
                                'p-6 rounded-[28px] border transition-all cursor-pointer hover:shadow-xl group relative',
                                theme === 'dark'
                                  ? 'bg-slate-800 border-slate-700 hover:border-indigo-500'
                                  : 'bg-white border-orange-100 hover:border-orange-300'
                              )}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Xoa truyen nay?')) {
                                    handleDeleteStory(story.id);
                                  }
                                }}
                                className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-red-400 transition-all"
                                aria-label="Delete story"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <h4 className="font-serif font-bold text-lg mb-2 line-clamp-1">{story.title}</h4>
                              <p className="text-xs opacity-60 line-clamp-3">{story.content}</p>
                            </div>
                          ))
                      ) : (
                        <div className="p-10 border-2 border-dashed rounded-[28px] opacity-30 text-center font-bold">
                          Chua co tac pham
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {view === 'tools' && (
              <div className="space-y-8">
                <h3 className="text-4xl font-serif font-bold">Cong cu nang cao</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div
                    className={cn(
                      'p-8 rounded-[30px] border',
                      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100'
                    )}
                  >
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" /> Backup du lieu
                    </h4>
                    <p className="text-sm opacity-70 mb-6">Xuat toan bo du lieu truyện ra file JSON.</p>
                    <Button
                      onClick={() => {
                        const data = StorageManager.exportData();
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `truyentudo-backup-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Xuat backup
                    </Button>
                  </div>

                  <div
                    className={cn(
                      'p-8 rounded-[30px] border',
                      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100'
                    )}
                  >
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Brain className="w-5 h-5" /> AI hoc van phong
                    </h4>
                    <p className="text-sm opacity-70 mb-3">
                      Tai len file truyện de AI hoc cach hanh van truoc khi viet tiep.
                    </p>
                    <p className="text-xs opacity-60 mb-5">
                      Ho tro: .txt, .md, .json, .csv, .html. Dung luong mau hien tai: {styleCorpus.length} ky tu.
                    </p>
                    <input
                      ref={styleInputRef}
                      type="file"
                      accept=".txt,.md,.markdown,.json,.csv,.tsv,.html,.htm,text/plain,text/markdown,text/html,application/json"
                      multiple
                      className="hidden"
                      onChange={handleStyleFilesSelected}
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={() => styleInputRef.current?.click()}
                        loading={isLearningStyle}
                        className="flex-1 flex items-center justify-center gap-2"
                      >
                        <Upload className="w-4 h-4" /> Tai file hoc tap
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setStyleCorpus('');
                          StorageManager.removeItem('style_corpus');
                          setAlertMessage({ type: 'info', message: 'Da xoa bo nho van phong.' });
                        }}
                      >
                        Xoa mau
                      </Button>
                    </div>
                  </div>
                </div>

                {styleSamples.length > 0 && (
                  <div
                    className={cn(
                      'p-8 rounded-[30px] border',
                      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-orange-100'
                    )}
                  >
                    <h4 className="font-bold mb-3">Goi y nhanh de day bo nho van phong</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {styleSamples.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            const merged = `${styleCorpus}\n\n[FROM STORY: ${s.title}]\n${s.content}`.slice(
                              -MAX_STYLE_CHARS
                            );
                            setStyleCorpus(merged);
                            StorageManager.setItem('style_corpus', merged);
                            setAlertMessage({ type: 'success', message: `Da nap van phong tu "${s.title}".` });
                          }}
                          className={cn(
                            'text-left p-4 rounded-xl border transition-colors',
                            theme === 'dark'
                              ? 'bg-slate-900 border-slate-700 hover:border-slate-500'
                              : 'bg-amber-50 border-amber-100 hover:border-orange-300'
                          )}
                        >
                          <p className="font-semibold line-clamp-1">{s.title}</p>
                          <p className="text-xs opacity-70 line-clamp-2 mt-1">{s.content}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {isProcessingAI && (
        <div
          className={cn(
            'fixed inset-0 z-[999] flex flex-col items-center justify-center backdrop-blur-xl',
            theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/70'
          )}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-300 border-t-orange-600 mb-8" />
          <h3 className="text-2xl font-serif font-bold">AI dang xu ly...</h3>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}
