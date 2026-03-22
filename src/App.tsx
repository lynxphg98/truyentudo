
import React, { useState, useEffect, _ReactNode } from '_react';
import {
  Plus, BookOpen, Edit3, Trash2, User, Users, Settings,
  Download, Upload, Languages, HelpCircle, Moon, Sun, Pencil,
  ChevronLeft, Sparkles, Key, Camera, X, Check, AlertTriangle, Wifi,
  Feather, RefreshCw
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ✅ Import từ các utilities mới
import { cn } from '@/util/cn';
import { handleApiError } from '@/util/errorHandler';
import StorageManager from '@/util/storage';
import { useApiCall } from '@/hook/useApiCall';
import { useAuth } from '@/hook/useAuth';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Alert } from '@/components/ui/Alert';
import { Skeleton, StoryCardSkeleton } from '@/components/ui/Skeleton';
import { ApiDashboardModal } from '@/components/modals/ApiDashboardModal';
import { ProfileModal } from '@/components/modals/ProfileModal';

// ✅ Import types
import type { Story, ApiKeyConfig } from '@/types';

// --- CONSTANTS ---
const AI_PROVIDERS = [
  {
    id: 'gemini',
    name: 'Google Gemini',
    baseUrl: '',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash'],
    note: 'Key lấy từ Google AI Studio (Miễn phí tốt nhất).',
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4o', 'gpt-4o-mini'],
    note: 'Yêu cầu tài khoản trả phí từ OpenAI.',
  },
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: ['deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1'],
    note: 'Dùng mô não DeepSeek rất rẻ và thông minh.',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    note: 'Siêu rẻ, thông minh hàng đầu hiện nay.',
  },
  {
    id: 'ollama',
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3', 'qwen2.5'],
    note: 'Dành cho người cài AI chạy trực tiếp trên máy tính riêng.',
  },
];

// --- API CALL HELPER ---
const callAiApi = async (
  prompt: string,
  config: ApiKeyConfig,
  onUsageUpdate?: (id: string) => void
): Promise<string> => {
  if (!config?.key) {
    throw new Error('❌ Chưa cấu hình API Key!');
  }

  let response;
  if (config.provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.modelName}:generateContent?key=${config.key}`;
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
  } else {
    const url = `${config.baseUrl}/chat/completions`;
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.key}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
  }

  const data = await response.json();

  if (!response.ok || data.error) {
    const error = new Error(data.error?.message || '❌ Lỗi API');
    throw error;
  }

  if (onUsageUpdate) onUsageUpdate(config.id);

  return config.provider === 'gemini'
    ? data.candidates?.[0]?.content?.parts?.[0]?.text
    : data.choices?.[0]?.message?.content;
};

// --- MAIN APP CONTENT ---
const AppContent = () => {
  const { user, theme, toggleTheme } = useAuth();
  const { call: executeAiCall, loading: isProcessingAI, error: _aiError } = useApiCall<string>();

  // State
  const [apiKeys, setApiKeys] = useState<ApiKeyConfig[]>([]);
  const [showApiDashboard, setShowApiDashboard] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [view, setView] = useState<'stories' | 'characters' | 'tools'>('stories');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [alertMessage, setAlertMessage] = useState<{
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // ✅ Load từ optimized storage
  useEffect(() => {
    document.title = '🎭 Truyện Tự Do - Cổng Truyện AI Đa Năng';
    const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (favicon)
      favicon.href = 'https://api.dicebear.com/7.x/initials/svg?seed=TTD&backgroundColor=4f46e5';

    // Load data
    const savedApiKeys = StorageManager.getItem<ApiKeyConfig[]>('api_keys');
    const savedStories = StorageManager.getItem<Story[]>('stories');

    if (savedApiKeys) setApiKeys(savedApiKeys);
    if (savedStories) setStories(savedStories);
  }, []);

  // Helpers
  const getActiveKey = () => apiKeys.find(k => k.isActive);

  const saveStories = (newStories: Story[]) => {
    setStories(newStories);
    StorageManager.setItem('stories', newStories);
  };

  const trackUsage = (id: string) => {
    const newList = apiKeys.map(k =>
      k.id === id ? { ...k, usageCount: k.usageCount + 1 } : k
    );
    setApiKeys(newList);
    StorageManager.setItem('api_keys', newList);
  };

  const handleSaveStory = (data: Partial<Story>) => {
    try {
      const newStories = selectedStory
        ? stories.map(s =>
            s.id === selectedStory.id
              ? { ...s, ...data, updatedAt: new Date().toISOString() }
              : s
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

      saveStories(newStories);
      setIsCreating(false);
      setSelectedStory(null);
      setAlertMessage({
        type: 'success',
        message: '✅ Lưu truyện thành công!',
      });
    } catch (_error) {
      setAlertMessage({
        type: 'error',
        message: '❌ Lỗi khi lưu truyện!',
      });
    }
  };

  const handleAIAction = async (prompt: string, callback: (res: string) => void) => {
    const key = getActiveKey();

    if (!key) {
      setShowApiDashboard(true);
      setAlertMessage({
        type: 'warning',
        message: '⚠️ Vui lòng cấu hình API Key trước',
      });
      return;
    }

    try {
      const result = await executeAiCall(async () => {
        return await callAiApi(prompt, key, trackUsage);
      });

      if (result) {
        callback(result);
        setAlertMessage({
          type: 'success',
          message: '✅ AI xử lý xong!',
        });
      }
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      setAlertMessage({
        type: 'error',
        message: apiError.message,
      });
    }
  };

  return (
    <div
      className={cn(
        'min-h-screen font-sans transition-colors duration-300 selection:bg-indigo-100',
        theme === 'dark'
          ? 'bg-slate-900 text-slate-100'
          : 'bg-[#FDFDFF] text-slate-900'
      )}
    >
      {/* MODALS */}
      <ApiDashboardModal
        isOpen={showApiDashboard}
        onClose={() => setShowApiDashboard(false)}
        apiKeys={apiKeys}
        onUpdateKeys={(keys: ApiKeyConfig[]) => {
          setApiKeys(keys);
          StorageManager.setItem('api_keys', keys);
        }}
      />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />

      {/* ALERTS */}
      {alertMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[500] max-w-md">
          <Alert
            type={alertMessage.type}
            message={alertMessage.message}
            onClose={() => setAlertMessage(null)}
          />
        </div>
      )}

      {/* NAVBAR */}
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 h-20 border-b z-50 flex items-center justify-between px-6 backdrop-blur-md',
          theme === 'dark'
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-white/80 border-slate-200 shadow-sm'
        )}
      >
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              setView('stories');
              setSelectedStory(null);
              setIsCreating(false);
            }}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform font-bold text-white tracking-tighter">
              TTD
            </div>
            <span className="text-xl font-serif font-bold hidden sm:block tracking-tighter">
              Truyện Tự Do
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={toggleTheme}
            ariaLabel="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>

          <Button
            variant={getActiveKey() ? 'primary' : 'danger'}
            size="md"
            onClick={() => setShowApiDashboard(true)}
            ariaLabel="API Configuration"
            className="flex items-center gap-2"
          >
            <Key className="w-4 h-4" />
            <span className="hidden md:block text-xs">{getActiveKey() ? 'API OK' : 'Cài API'}</span>
          </Button>

          <Button
            variant="ghost"
            size="md"
            onClick={() => setShowProfile(true)}
            ariaLabel="Profile"
          >
            <User className="w-5 h-5" />
          </Button>

          <div
            className="w-8 h-8 rounded-full border overflow-hidden cursor-pointer"
            onClick={() => setShowProfile(true)}
          >
            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </nav>

      <main className="pt-32 px-6 max-w-7xl mx-auto pb-40">
        {selectedStory ? (
          /* XEM TRUYỆN CHI TIẾT */
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <Button
              onClick={() => setSelectedStory(null)}
              variant="ghost"
              className="flex items-center gap-2 mb-8"
            >
              <ChevronLeft /> Quay lại thư viện
            </Button>

            <div
              className={cn(
                'p-12 rounded-[50px] border shadow-sm leading-relaxed',
                theme === 'dark'
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-slate-100'
              )}
            >
              <h1 className="text-5xl font-serif font-bold mb-10 leading-tight tracking-tight">
                {selectedStory.title}
              </h1>
              <div className="prose prose-slate max-w-none text-lg whitespace-pre-wrap leading-[1.8] opacity-90">
                <ReactMarkdown>{selectedStory.content}</ReactMarkdown>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-4">
              <Button
                loading={isProcessingAI}
                onClick={() =>
                  handleAIAction(
                    `Viết tiếp kịch tính cho nội dung: ${selectedStory.content.slice(-2000)}`,
                    res =>
                      handleSaveStory({
                        ...selectedStory,
                        content: selectedStory.content + '\n\n' + res,
                      })
                  )
                }
                className="flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> Viết tiếp bằng AI
              </Button>

              <Button
                variant="secondary"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="w-5 h-5" /> Chỉnh sửa
              </Button>
            </div>
          </div>
        ) : isCreating ? (
          /* TRÌNH SOẠN THẢO */
          <div className="max-w-4xl mx-auto animate-in fade-in">
            <div className="flex items-center justify-between mb-16">
              <Button
                variant="ghost"
                onClick={() => setIsCreating(false)}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>

              <div className="flex gap-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    const titleInput = document.getElementById('stitle') as HTMLInputElement;
                    const title = titleInput?.value;
                    if (!title) {
                      setAlertMessage({
                        type: 'warning',
                        message: '⚠️ Vui lòng nhập tiêu đề!',
                      });
                      return;
                    }
                    handleAIAction(
                      `Xây dựng dàn ý chi tiết cho truyện: "${title}"`,
                      res => {
                        const contentTextarea = document.getElementById('scontent') as HTMLTextAreaElement;
                        if (contentTextarea) contentTextarea.value = res;
                      }
                    );
                  }}
                  loading={isProcessingAI}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> AI phác thảo
                </Button>

                <Button
                  onClick={() => {
                    const titleInput = document.getElementById('stitle') as HTMLInputElement;
                    const contentTextarea = document.getElementById('scontent') as HTMLTextAreaElement;
                    const title = titleInput?.value;
                    const content = contentTextarea?.value;
                    if (!title) {
                      setAlertMessage({
                        type: 'warning',
                        message: '⚠️ Cần tiêu đề!',
                      });
                      return;
                    }
                    handleSaveStory({
                      title,
                      content,
                      type: 'original',
                    });
                  }}
                >
                  Lưu tác phẩm
                </Button>
              </div>
            </div>

            <div className="space-y-12">
              <div className="space-y-2">
                <Input
                  id="stitle"
                  label="Tiêu Đề Tác Phẩm"
                  placeholder="VD: Thiên Hạ Đệ Nhất Kiếm, Nàng Dâu Hào Môn..."
                  className="text-3xl font-serif font-bold"
                />
              </div>

              <TextArea
                id="scontent"
                label="Nội Dung Truyện"
                placeholder="Hôm nay bạn muốn viết gì?..."
                className="min-h-[60vh] text-lg"
              />
            </div>
          </div>
        ) : (
          /* THƯ VIỆN */
          <div>
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-16 gap-8">
              <div>
                <h2 className="text-7xl font-serif font-bold tracking-tighter mb-8">
                  Thư viện
                </h2>
                <div className="flex flex-col gap-3">
                  {['stories', 'characters', 'tools'].map(v => (
                    <Button
                      key={v}
                      variant={view === v ? 'primary' : 'secondary'}
                      size="md"
                      onClick={() => setView(v as any)}
                      className="flex items-center gap-3 w-fit"
                    >
                      {v === 'stories' && <BookOpen className="w-4 h-4" />}
                      {v === 'characters' && <Users className="w-4 h-4" />}
                      {v === 'tools' && <Settings className="w-4 h-4" />}
                      {v === 'stories' && 'Truyện'}
                      {v === 'characters' && 'Nhân vật'}
                      {v === 'tools' && 'Công cụ'}
                    </Button>
                  ))}
                </div>
              </div>

              {view === 'stories' && (
                <div className="flex flex-wrap justify-end gap-4 md:mt-20">
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-3"
                  >
                    <Plus className="w-5 h-5" /> Viết truyện
                  </Button>
                </div>
              )}
            </div>

            {/* STORIES VIEW */}
            {view === 'stories' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {[
                  { type: 'original', title: 'Truyện sáng tác', icon: '✍️', color: 'indigo' },
                  { type: 'translated', title: 'Truyện dịch', icon: '📚', color: 'teal' },
                  { type: 'continued', title: 'Truyện viết tiếp', icon: '✨', color: 'amber' },
                ].map(({ type, title, color }) => (
                  <div key={type} className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-3 rounded-xl text-white shadow-lg',
                          {
                            'bg-indigo-600': color === 'indigo',
                            'bg-teal-600': color === 'teal',
                            'bg-amber-600': color === 'amber',
                          }
                        )}
                      >
                        {type === 'original' && <Feather />}
                        {type === 'translated' && <BookOpen />}
                        {type === 'continued' && <Sparkles />}
                      </div>
                      <div>
                        <h3 className="font-serif font-bold text-xl">{title}</h3>
                        <p className="text-xs opacity-40 uppercase">
                          {stories.filter(s => s.type === type).length} tác phẩm
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {stories.filter(s => s.type === type).length > 0 ? (
                        stories.filter(s => s.type === type).map(story => (
                          <div
                            key={story.id}
                            onClick={() => setSelectedStory(story)}
                            className={cn(
                              'p-6 rounded-[32px] border transition-all cursor-pointer hover:shadow-xl group relative',
                              theme === 'dark'
                                ? 'bg-slate-800 border-slate-700 hover:border-indigo-500'
                                : 'bg-white border-slate-100 hover:border-indigo-200'
                            )}
                          >
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                if (confirm('Xóa truyện này?')) {
                                  saveStories(stories.filter(s => s.id !== story.id));
                                }
                              }}
                              className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 text-red-400 transition-all"
                              aria-label="Delete story"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <h4 className="font-serif font-bold text-lg mb-2 line-clamp-1">
                              {story.title}
                            </h4>
                            <p className="text-xs opacity-50 line-clamp-2">
                              {story.content}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="p-10 border-2 border-dashed rounded-[32px] opacity-10 text-center font-bold">
                          Chưa có tác phẩm
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TOOLS VIEW */}
            {view === 'tools' && (
              <div className="space-y-8">
                <h3 className="text-4xl font-serif font-bold">Công cụ nâng cao</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Export/Import */}
                  <div
                    className={cn(
                      'p-10 rounded-[40px] border',
                      theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                    )}
                  >
                    <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Download className="w-5 h-5" /> Bảo lưu dữ liệu
                    </h4>
                    <p className="text-sm opacity-60 mb-6">
                      Xuất dữ liệu của bạn để tạo bản sao lưu.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const data = StorageManager.exportData();
                          const blob = new Blob([data], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `truyentudo-backup-${Date.now()}.json`;
                          a.click();
                        }}
                        className="flex-1 flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Xuất
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* LOADING OVERLAY */}
      {isProcessingAI && (
        <div
          className={cn(
            'fixed inset-0 z-[999] flex flex-col items-center justify-center backdrop-blur-xl',
            theme === 'dark' ? 'bg-slate-900/80' : 'bg-white/80'
          )}
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-300 border-t-indigo-600 mb-8" />
          <h3 className="text-2xl font-serif font-bold">✨ AI đang suy nghĩ...</h3>
        </div>
      )}
    </div>
  );
};

// --- APP WRAPPER ---
export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}
