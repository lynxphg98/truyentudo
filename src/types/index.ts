export interface User {
  uid: string;
  displayName: string;
  photoURL: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  type: 'original' | 'translated' | 'continued';
  genre?: string;
  introduction?: string;
  isAdult?: boolean;
  updatedAt: string;
  authorId?: string;
}

export interface ApiKeyConfig {
  id: string;
  name: string;
  provider: string;
  key: string;
  baseUrl: string;
  modelName: string;
  usageCount: number;
  isActive: boolean;
}

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  note: string;
}

export interface Character {
  id: string;
  name: string;
  appearance: string;
}

export interface TranslationName {
  id: string;
  original: string;
  translation: string;
}

export interface AuthContextType {
  user: User;
  updateProfile: (name: string, avatar: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface ModalState {
  isOpen: boolean;
  onClose: () => void;
}

export interface ApiError {
  code: string;
  message: string;
  shouldRetry: boolean;
  statusCode?: number;
}
