export interface ApiError {
  code: string;
  message: string;
  shouldRetry: boolean;
  statusCode?: number;
}

export const handleApiError = (error: unknown): ApiError => {
  // Network error
  if (!navigator.onLine) {
    return {
      code: 'OFFLINE',
      message: '❌ Không có kết nối Internet. Vui lòng kiểm tra lại.',
      shouldRetry: true,
    };
  }

  // Axios/Fetch response errors
  const response =
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as any).response
      ? (error as any).response
      : null;

  if (response) {
    const status: number = response.status;

    const statusErrorMap: Record<number, Omit<ApiError, 'statusCode'>> = {
      401: {
        code: 'UNAUTHORIZED',
        message: '❌ API Key không hợp lệ hoặc hết hạn. Vui lòng kiểm tra lại.',
        shouldRetry: false,
      },
      403: {
        code: 'UNAUTHORIZED',
        message: '❌ API Key không hợp lệ hoặc hết hạn. Vui lòng kiểm tra lại.',
        shouldRetry: false,
      },
      429: {
        code: 'RATE_LIMIT',
        message: '❌ Quá nhiều yêu cầu. Vui lòng thử lại sau.',
const handleError = (error: AxiosError): ApiError => {
        shouldRetry: true,
      },
    };
    const defaultError: Omit<ApiError, 'statusCode'> = {
      code: 'SERVER_ERROR',
      message: '❌ Đã xảy ra sự cố. Vui lòng thử lại sau.',
      shouldRetry: false,
    };

    const baseError = statusErrorMap[status] || defaultError;

    return status in statusErrorMap
      ? { ...baseError, statusCode: status }
      : baseError;
  }

  // Fallback for unknown errors
  return {
    code: 'UNKNOWN_ERROR',
    message: '❌ Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
    shouldRetry: false,
  };
};
        message: '⏱️ Hết hạn mức API. Vui lòng chờ một chút rồi thử lại.',
        shouldRetry: true,
        statusCode: status,
      };
    }

    if (status === 500 || status === 502 || status === 503) {
      return {
        code: 'SERVER_ERROR',
        message: '🔧 Lỗi server. Vui lòng thử lại sau.',
        shouldRetry: true,
        statusCode: status,
      };
    }

    if (status >= 400 && status < 500) {
      return {
        code: 'CLIENT_ERROR',
        message: error.response.data?.message || '❌ Yêu cầu không hợp lệ.',
        shouldRetry: false,
        statusCode: status,
      };
    }
  }

  // Timeout
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      code: 'TIMEOUT',
      message: '⏱️ Yêu cầu quá lâu. Vui lòng thử lại.',
      shouldRetry: true,
    };
  }

  // Generic error
  return {
    code: 'UNKNOWN',
    message: error.message || '❌ Có lỗi xảy ra. Vui lòng thử lại.',
    shouldRetry: false,
  };
};

export const shouldRetryRequest = (error: unknown): boolean => {
  const apiError = handleApiError(error);
  return apiError.shouldRetry;
};
