interface StorageData<T> {
  value: T;
  timestamp: number;
  ttl?: number;
}

class StorageManager {
  private static readonly PREFIX = 'truyentudo_';
  private static readonly MAX_RETRIES = 3;

  /**
   * Set item với optional TTL
   */
  static setItem<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const data: StorageData<T> = {
        value,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(`${StorageManager.PREFIX}${key}`, JSON.stringify(data));
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('⚠️ LocalStorage đầy. Xóa dữ liệu cũ...');
        const cleared = this.clearExpired();
        if (cleared > 0) {
          return this.setItem(key, value, ttl);
        }
        console.error('❌ Không thể lưu dữ liệu. Storage còn đầy.');
        return false;
      }
      console.error('❌ Storage error:', error);
      return false;
    }
  }

  /**
   * Get item và check TTL
   */
  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${StorageManager.PREFIX}${key}`);
      if (!item) return null;

      const data: StorageData<T> = JSON.parse(item);

      // Check TTL
      if (data.ttl && Date.now() - data.timestamp > data.ttl) {
        localStorage.removeItem(`${StorageManager.PREFIX}${key}`);
        return null;
      }

      return data.value;
    } catch (error) {
      console.error('❌ Storage read error:', error);
      return null;
    }
  }

  /**
   * Remove item cụ thể
   */
  static removeItem(key: string): boolean {
    try {
      localStorage.removeItem(`${StorageManager.PREFIX}${key}`);
      return true;
    } catch (error) {
      console.error('❌ Storage remove error:', error);
      return false;
    }
  }

  /**
   * Clear tất cả app items
   */
  static clear(): boolean {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(StorageManager.PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      console.log('✅ Cleared all app storage');
      return true;
    } catch (error) {
      console.error('❌ Storage clear error:', error);
      return false;
    }
  }

  /**
   * Clear expired items only
   */
  static clearExpired(): number {
    let cleared = 0;
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(StorageManager.PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data: StorageData<unkown> = JSON.parse(item);
            if (data.ttl && Date.now() - data.timestamp > data.ttl) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch (error) {
          console.error('❌ Error clearing expired item:', error);
        }
      }
    });

    console.log(`🧹 Cleared ${cleared} expired items`);
    return cleared;
  }

  /**
   * Get storage usage (estimated)
   */
  static getUsage(): { used: number; percentage: number } {
    let used = 0;
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(StorageManager.PREFIX)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    });

    const limit = 5 * 1024 * 1024; // ~5MB estimate
    return {
      used,
      percentage: (used / limit) * 100,
    };
  }

  /**
   * Export all app data as JSON
   */
  static exportData(): string {
    const data: Record<string, unkown> = {};
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(StorageManager.PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            data[key.replace(StorageManager.PREFIX, '')] = JSON.parse(item).value;
          }
        } catch (error) {
          console.error('❌ Export error:', error);
        }
      }
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import data từ JSON
   */
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      let imported = 0;

      Object.entries(data).forEach(([key, value]) => {
        if (this.setItem(key, value)) {
          imported++;
        }
      });

      console.log(`✅ Imported ${imported} items`);
      return imported > 0;
    } catch (error) {
      console.error('❌ Import error:', error);
      return false;
    }
  }
}

export default StorageManager;
