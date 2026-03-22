export interface ApiError {
  code: string;
  message: string;
  shouldRetry: boolean;
  statusCode?: number;
}

export const handleApiError = (error: any): ApiError => {
  // 1. Lỗi kết nối mạng
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return {
      code: 'OFFLINE',
      message: '❌ Không có kết nối Internet. Vui lòng kiểm tra lại.',
      shouldRetry: true,
    };
  }

  // 2. Xử lý lỗi từ API (Axios/Fetch)
  if (error && typeof error === 'object' && 'response' in error) {
    const status = error.response?.status;
    const responseData = error.response?.data;

    // Lỗi Unauthorized / Forbidden
    if (status === 401 || status === 403) {
      return {
        code: 'UNAUTHORIZED',
        message: '❌ API Key không hợp lệ hoặc hết hạn. Vui lòng kiểm tra lại.',
        shouldRetry: false,
        statusCode: status,
      };
    }

    // Lỗi Rate Limit (Quá nhiều yêu cầu)
    if (status === 429) {
      return {
        code: 'RATE_LIMIT',
        message: '⏱️ Hết hạn mức API. Vui lòng chờ một chút rồi thử lại.',
        shouldRetry: true,
        statusCode: status,
      };
    }

    // Lỗi Server (Đoạn này đã được sửa lại)
    if (status === 500 || status === 502 || status === 503) {
      return {
        code: 'SERVER_ERROR',
        message: '🔧 Lỗi server. Vui lòng thử lại sau.',
        shouldRetry: true, // Thường lỗi server thì nên cho phép thử lại
        statusCode: status,
      };
    }

    // Các lỗi Client khác (4xx)
    if (status >= 400 && status < 500) {
      return {
        code: 'CLIENT_ERROR',
        message: responseData?.message || '❌ Yêu cầu không hợp lệ.',
        shouldRetry: false,
        statusCode: status,
      };
    }
  }

  // 3. Lỗi Timeout
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return {
      code: 'TIMEOUT',
      message: '⏱️ Yêu cầu quá lâu. Vui lòng thử lại.',
      shouldRetry: true,
    };
  }

  // 4. Lỗi không xác định
  return {
    code: 'UNKNOWN',
    message: error?.message || '❌ Có lỗi xảy ra. Vui lòng thử lại.',
    shouldRetry: false,
  };
};

export const shouldRetryRequest = (error: unknown): boolean => {
  const apiError = handleApiError(error);
  return apiError.shouldRetry;
};
