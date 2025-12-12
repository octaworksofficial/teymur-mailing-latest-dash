import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message, notification } from 'antd';

// 错误处理方案： 错误类型
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}
// 与后端约定的响应数据格式
interface ResponseStructure {
  success: boolean;
  data: any;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  // 错误处理： umi@3 的错误处理方案。
  errorConfig: {
    // 错误抛出
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType } =
        res as unknown as ResponseStructure;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showType, data };
        throw error; // 抛出自制的错误
      }
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;

      // 我们的 errorThrower 抛出的错误。
      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              // do nothing
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                description: errorMessage,
                message: errorCode,
              });
              break;
            case ErrorShowType.REDIRECT:
              // TODO: redirect
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        // HTTP hata durumları
        const status = error.response.status;
        const responseData = error.response.data;

        // Backend'den gelen error mesajını kullan
        if (responseData?.error) {
          message.error(responseData.error);
        } else {
          // Status koduna göre mesaj
          const statusMessages: Record<number, string> = {
            400: 'Geçersiz istek',
            401: 'Oturum süresi doldu, lütfen tekrar giriş yapın',
            403: 'Bu işlem için yetkiniz yok',
            404: 'İstenen kaynak bulunamadı',
            500: 'Sunucu hatası, lütfen daha sonra tekrar deneyin',
          };
          message.error(statusMessages[status] || `Hata: ${status}`);
        }
      } else if (error.request) {
        // Sunucuya ulaşılamadı
        message.error(
          'Sunucuya bağlanılamadı, lütfen internet bağlantınızı kontrol edin',
        );
      } else {
        // İstek gönderilirken hata
        message.error('İstek hatası, lütfen tekrar deneyin');
      }
    },
  },

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      // JWT Token ekle
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      // Response interceptor - sadece response'u döndür
      // Hata mesajları errorHandler'da gösterilecek
      return response;
    },
  ],
};
