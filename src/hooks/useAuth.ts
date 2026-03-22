import React, { createContext, useState, useEffect, ReactNode } from 'react';
import StorageManager from '@/util/storage';

export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
}

export interface AuthContextType {
  user: User;
  updateProfile: (name: string, avatar: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({
    uid: 'local-user',
    displayName: 'Tác Giả',
    photoURL: DEFAULT_AVATAR,
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(
    (StorageManager.getItem('app_theme') as 'light' | 'dark' | null) || 'light'
  );

  // Load user profile on mount
  useEffect(() => {
    const savedUser = StorageManager.getItem<User>('user_profile');
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const updateProfile = (name: string, avatar: string) => {
    const updatedUser: User = {
      ...user,
      displayName: name,
      photoURL: avatar,
    };
    setUser(updatedUser);
    StorageManager.setItem('user_profile', updatedUser);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    StorageManager.setItem('app_theme', newTheme);
  };

  const value: AuthContextType = {
    user,
    updateProfile,
    theme,
    toggleTheme,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
