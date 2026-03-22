import { useState, useCallback } from 'react';
import { handleApiError, ApiError } from '@/util/errorHandler';

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  call: (fn: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
}

export const useApiCall = <T,>(): UseApiCallReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [lastFn, setLastFn] = useState<(() => Promise<T>) | null>(null);

  const call = useCallback(
    async (fn: () => Promise<T>): Promise<T | null> => {
      setLoading(true);
      setError(null);
      setLastFn(() => fn);

      try {
        const result = await fn();
        setData(result);
        return result;
      } catch (err: unkown) {
        const apiError = handleApiError(err);
        setError(apiError);
        console.error('🚨 API Error:', apiError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  const retry = useCallback(async (): Promise<T | null> => {
    if (!lastFn) return null;
    return call(lastFn);
  }, [lastFn, call]);

  return {
    data,
    loading,
    error,
    call,
    reset,
    retry,
  };
};
