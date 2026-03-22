import React, { useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { cn } from '@/util/cn';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import StorageManager from '@/util/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, updateProfile, theme } = useAuth();
  const [name, setName] = useState(user.displayName);
  const [avatar, setAvatar] = useState(user.photoURL);
  const [alert, setAlert] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(user.displayName);
      setAvatar(user.photoURL);
      setAlert(null);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatar(reader.result as string);
          setAlert({
            type: 'success',
            message: '✅ Avatar đã cập nhật',
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setAlert({
        type: 'warning',
        message: '⚠️ Vui lòng nhập tên!',
      });
      return;
    }

    try {
      setIsLoading(true);
      updateProfile(name, avatar);
      
      // Save to storage
      StorageManager.setItem('user_profile', {
        uid: user.uid,
        displayName: name,
        photoURL: avatar,
      });

      setAlert({
        type: 'success',
        message: '✅ Cập nhật hồ sơ thành công!',
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (_error) {
      setAlert({
        type: 'error',
        message: '❌ Có lỗi khi lưu hồ sơ',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <div
        className={cn(
          'bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 border border-slate-100 animate-in zoom-in duration-200',
          theme === 'dark'
            ? 'bg-slate-800 border-slate-700 text-white'
            : ''
        )}
      >
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-serif font-bold tracking-tight">
            Hồ sơ cá nhân
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* ALERTS */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
            className="mb-6"
          />
        )}

        {/* AVATAR SECTION */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-2xl bg-slate-50">
              <img
                src={avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={e => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
            </div>

            <button
              onClick={handleAvatarUpload}
              className="absolute bottom-1 right-1 p-3 bg-indigo-600 text-white rounded-full border-2 border-white shadow-xl hover:scale-110 transition-all"
              aria-label="Upload avatar"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 uppercase font-black tracking-widest">
            Avatar của tác giả
          </p>
        </div>

        {/* FORM */}
        <div className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">
              Bút danh
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className={cn(
                'w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 font-bold',
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-slate-50 border-slate-100'
              )}
              placeholder="Nhập bút danh của bạn..."
              disabled={isLoading}
            />
          </div>

          {/* Avatar URL Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase opacity-40">
              Link avatar ngoài
            </label>
            <input
              type="text"
              value={avatar.startsWith('data:') ? '' : avatar}
              onChange={e => setAvatar(e.target.value || DEFAULT_AVATAR)}
              placeholder="https://example.com/avatar.jpg"
              className={cn(
                'w-full p-4 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs',
                theme === 'dark'
                  ? 'bg-slate-900 border-slate-700'
                  : 'bg-slate-50 border-slate-100'
              )}
              disabled={isLoading}
            />
            <p className="text-xs opacity-50 italic">
              Để trống nếu muốn dùng ảnh tải lên
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              className="flex-[2]"
              onClick={handleSave}
              loading={isLoading}
            >
              Lưu thông tin
            </Button>
          </div>
        </div>

        {/* FOOTER INFO */}
        <p className="text-[10px] text-slate-400 text-center mt-6 leading-relaxed">
          💡 Thông tin hồ sơ được lưu trên trình duyệt này
        </p>
      </div>
    </div>
  );
};
