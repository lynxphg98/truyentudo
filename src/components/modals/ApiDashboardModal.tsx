import React, { useState, useEffect } from 'react';
import { X, Copy, Trash2, Plus, Key, Eye, EyeOff, CheckCircle } from 'lucide-react';

// Định nghĩa kiểu dữ liệu cho API Key
interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

// Định nghĩa Props cho Component
interface ApiDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKey[];
  onUpdateKeys: (keys: ApiKey[]) => void;
}

const ApiDashboardModal: React.FC<ApiDashboardModalProps> = ({
  isOpen,
  onClose,
  apiKeys = [],
  onUpdateKeys,
}) => {
  const [newKeyName, setNewKeyName] = useState('');
  const [showKeyId, setShowKeyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Xử lý đóng modal khi nhấn phím Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  // Hàm tạo API Key ngẫu nhiên (giả lập)
  const generateKey = () => {
    return 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName,
      key: generateKey(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    onUpdateKeys([...apiKeys, newKey]);
    setNewKeyName('');
  };

  const handleDeleteKey = (id: string) => {
    const filteredKeys = apiKeys.filter((k) => k.id !== id);
    onUpdateKeys(filteredKeys);
  };

  const copyToClipboard = (text: string, id: string) => {
    // Sử dụng execCommand cho khả năng tương thích cao trong iframe/sandbox
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Không thể copy', err);
    }
    document.body.removeChild(textArea);
  };

  const toggleVisibility = (id: string) => {
    setShowKeyId(showKeyId === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all transform scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
              Quản lý API Key
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Form thêm mới */}
          <form onSubmit={handleAddKey} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Tên gợi nhớ cho API Key (ví dụ: Production)"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={!newKeyName.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tạo Key Mới
            </button>
          </form>

          {/* Danh sách Key */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Danh sách khóa hiện có ({apiKeys.length})
            </h3>
            
            {apiKeys.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <p className="text-slate-400 text-sm">Chưa có API key nào được tạo.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {apiKeys.map((item) => (
                  <div 
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl group transition-all hover:border-blue-200 dark:hover:border-blue-900"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full">
                          {item.createdAt}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-sm text-slate-500">
                        <span className="truncate">
                          {showKeyId === item.id ? item.key : '••••••••••••••••••••••••'}
                        </span>
                        <button 
                          onClick={() => toggleVisibility(item.id)}
                          className="p-1 hover:text-blue-500 transition-colors"
                        >
                          {showKeyId === item.id ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
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
                            <CheckCircle size={14} /> Đã chép
                          </>
                        ) : (
                          <>
                            <Copy size={14} /> Sao chép
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteKey(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Xóa khóa này"
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

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiDashboardModal;
