import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message } from 'antd';

/**
 * Hata Yönetimi Yapılandırması
 * Tüm API isteklerindeki hataları merkezi olarak yönetir
 */
export const errorConfig: RequestConfig = {
  errorConfig: {
    // Hata fırlatma - backend'den success: false dönerse
    errorThrower: (res) => {
      const { success, data, error: errorMessage } = res as any;
      if (success === false) {
        const error: any = new Error(errorMessage || 'İstek başarısız');
        error.name = 'BizError';
        error.info = { errorMessage, data };
        throw error;
      }
    },
    // Hata yakalama ve gösterme
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;

      // Business error (backend success: false döndü)
      if (error.name === 'BizError') {
        const errorMessage = error.info?.errorMessage;
        if (errorMessage) {
          message.error(errorMessage);
        }
        return;
      }

      // HTTP hata durumları
      if (error.response) {
        const status = error.response.status;
        const responseData = error.response.data;

        // Backend'den gelen error mesajını kullan
        if (responseData?.error) {
          message.error(responseData.error);
          return;
        }

        // Status koduna göre Türkçe mesaj
        const statusMessages: Record<number, string> = {
          400: 'Geçersiz istek',
          401: 'Oturum süresi doldu, lütfen tekrar giriş yapın',
          403: 'Bu işlem için yetkiniz yok',
          404: 'İstenen kaynak bulunamadı',
          500: 'Sunucu hatası, lütfen daha sonra tekrar deneyin',
          502: 'Sunucu geçici olarak kullanılamıyor',
          503: 'Sunucu bakımda, lütfen daha sonra tekrar deneyin',
        };
        message.error(statusMessages[status] || `Hata: ${status}`);
        return;
      }

      // Sunucuya ulaşılamadı
      if (error.request) {
        message.error(
          'Sunucuya bağlanılamadı, lütfen internet bağlantınızı kontrol edin',
        );
        return;
      }

      // Diğer hatalar
      message.error('Beklenmeyen bir hata oluştu');
    },
  },

  // İstek interceptor'ları
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

  // Yanıt interceptor'ları
  responseInterceptors: [
    (response) => {
      // Sadece response'u döndür - hata mesajları errorHandler'da gösteriliyor
      return response;
    },
  ],
};
