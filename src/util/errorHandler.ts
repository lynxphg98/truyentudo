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
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const status = (error as { response: { status: number } }).response.status;

    if (status === 401 || status === 403) {
      return {
        code: 'UNAUTHORIZED',
        message: '❌ API Key không hợp lệ hoặc hết hạn. Vui lòng kiểm tra lại.',
        shouldRetry: false,
        statusCode: status,
      };
    }

    if (status === 429) {
      return {
        code: 'RATE_LIMIT',
        message: '⏱️ Hết hạn mức API. Vui lòng chờ một chút rồi thử lại.',
        shouldRetry: true,
        statusCode: status,
      };
    }

    if (status === 500 || status === 502 || status === 503) {
      return {
        code: 'SERVER_ERROR',
        message: '🔧 Lỗi server. Vui lòng thử lại sau.',
const handleError = (error: AxiosError): ApiError => {
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
