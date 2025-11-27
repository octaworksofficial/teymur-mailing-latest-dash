import {
  ClearOutlined,
  DownloadOutlined,
  LockOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  Modal,
  message,
  Space,
  Spin,
  Tag,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import './SchedulerLogs.less';

interface LogEntry {
  timestamp: string;
  timestampTR?: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  message: string;
  data?: any;
}

const SchedulerLogs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Şifre kontrolü
  const handlePasswordSubmit = () => {
    if (passwordInput === '2423') {
      setIsAuthenticated(true);
      setIsPasswordModalVisible(false);
      message.success('Giriş yapıldı! Scheduler loglarına erişim sağlandı.');
    } else {
      message.error('Hatalı şifre! Lütfen tekrar deneyin.');
      setPasswordInput('');
    }
  };

  // SSE bağlantısını başlat
  const connectToLogStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      'http://localhost:3001/api/logs/stream',
    );

    eventSource.onopen = () => {
      console.log('✅ Log stream bağlantısı kuruldu');
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      if (!isPaused) {
        try {
          const log: LogEntry = JSON.parse(event.data);
          setLogs((prevLogs) => [...prevLogs, log]);
        } catch (error) {
          console.error('Log parse hatası:', error);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ Log stream hatası:', error);
      setIsConnected(false);
      eventSource.close();

      // 5 saniye sonra yeniden bağlan
      setTimeout(() => {
        console.log('🔄 Yeniden bağlanılıyor...');
        connectToLogStream();
      }, 5000);
    };

    eventSourceRef.current = eventSource;
  };

  // Component mount olduğunda bağlan (sadece authenticated ise)
  useEffect(() => {
    if (isAuthenticated) {
      connectToLogStream();
    }

    // Component unmount olduğunda bağlantıyı kapat
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [isAuthenticated]);

  // Auto-scroll için
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Pause durumunu değiştir (SSE bağlantısını kapatmadan)
  useEffect(() => {
    // isPaused değiştiğinde bir şey yapmıyoruz, sadece onmessage'da kontrol ediyoruz
  }, [isPaused]);

  // Logları temizle
  const clearLogs = async () => {
    try {
      await fetch('http://localhost:3001/api/logs/clear', { method: 'POST' });
      setLogs([]);
    } catch (error) {
      console.error('Loglar temizlenirken hata:', error);
    }
  };

  // Logları indir
  const downloadLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`,
      )
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scheduler-logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Manuel scheduler trigger
  const triggerScheduler = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/logs/trigger-scheduler',
        {
          method: 'POST',
        },
      );
      const data = await response.json();

      if (data.success) {
        message.success(
          'Scheduler manuel olarak tetiklendi! Logları izleyin...',
        );
      } else {
        message.error(`Scheduler tetiklenemedi: ${data.message}`);
      }
    } catch (error) {
      console.error('Scheduler tetiklenirken hata:', error);
      message.error('Scheduler tetiklenirken hata oluştu');
    }
  };

  // Log type'a göre renk
  const getLogColor = (type: string) => {
    const colors = {
      info: '#1890ff',
      success: '#52c41a',
      warning: '#faad14',
      error: '#f5222d',
      system: '#722ed1',
    };
    return colors[type as keyof typeof colors] || '#666';
  };

  // Log type'a göre tag rengi
  const getTagColor = (type: string) => {
    const colors = {
      info: 'blue',
      success: 'green',
      warning: 'orange',
      error: 'red',
      system: 'purple',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <LockOutlined />
            <span>Scheduler Logları - Şifre Gerekli</span>
          </Space>
        }
        open={isPasswordModalVisible}
        onOk={handlePasswordSubmit}
        onCancel={() => window.history.back()}
        okText="Giriş Yap"
        cancelText="İptal"
        closable={false}
        maskClosable={false}
      >
        <p style={{ marginBottom: 16 }}>
          Bu sayfa teknik bir bölümdür. Devam etmek için lütfen şifreyi girin:
        </p>
        <Input.Password
          placeholder="Şifre"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onPressEnter={handlePasswordSubmit}
          autoFocus
          size="large"
        />
      </Modal>

      {isAuthenticated && (
        <PageContainer
          title="Scheduler Logları"
          subTitle="Email automation scheduler'ın real-time logları"
          extra={[
            <Badge
              key="status"
              status={isConnected ? 'processing' : 'error'}
              text={isConnected ? 'Bağlı' : 'Bağlantı Kopuk'}
            />,
          ]}
        >
          <Card
            style={{ height: 'calc(100vh - 200px)' }}
            styles={{
              body: {
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: 0,
              },
            }}
          >
            {/* Toolbar */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#fafafa',
              }}
            >
              <Space>
                <Button
                  type="primary"
                  size="small"
                  icon={<ThunderboltOutlined />}
                  onClick={triggerScheduler}
                >
                  Manuel Çalıştır
                </Button>
                <Button
                  size="small"
                  icon={
                    isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />
                  }
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? 'Devam Et' : 'Durdur'}
                </Button>
                <Button
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={clearLogs}
                  danger
                >
                  Temizle
                </Button>
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={downloadLogs}
                  disabled={logs.length === 0}
                >
                  İndir
                </Button>
              </Space>

              <Space>
                <span style={{ fontSize: 12, color: '#666' }}>
                  Toplam: <strong>{logs.length}</strong> log
                </span>
                <Button
                  size="small"
                  type={autoScroll ? 'primary' : 'default'}
                  onClick={() => setAutoScroll(!autoScroll)}
                >
                  Auto-scroll: {autoScroll ? 'Açık' : 'Kapalı'}
                </Button>
              </Space>
            </div>

            {/* Log Container */}
            <div
              ref={logContainerRef}
              className="log-container"
              style={{
                flex: 1,
                overflowY: 'auto',
                backgroundColor: '#1e1e1e',
                padding: '16px',
                fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: '1.6',
              }}
            >
              {!isConnected && logs.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#999',
                  }}
                >
                  <Spin tip="Log stream'e bağlanılıyor..." />
                </div>
              ) : logs.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    color: '#999',
                  }}
                >
                  <Empty
                    description="Henüz log yok. Scheduler her 3 dakikada çalışacak."
                    style={{ color: '#999' }}
                  />
                </div>
              ) : (
                logs.map((log, _index) => (
                  <div
                    key={`${log.timestamp}-${log.type}-${log.message.substring(0, 20)}`}
                    className="log-entry"
                    style={{
                      marginBottom: '8px',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderLeft: `3px solid ${getLogColor(log.type)}`,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <span
                        style={{
                          color: '#666',
                          fontSize: '11px',
                          minWidth: '160px',
                        }}
                      >
                        {log.timestampTR ||
                          new Date(log.timestamp).toLocaleString('tr-TR', {
                            timeZone: 'Europe/Istanbul',
                          })}
                      </span>
                      <Tag
                        color={getTagColor(log.type)}
                        style={{
                          margin: 0,
                          minWidth: '70px',
                          textAlign: 'center',
                        }}
                      >
                        {log.type.toUpperCase()}
                      </Tag>
                      <span
                        style={{
                          color: '#ddd',
                          flex: 1,
                          wordBreak: 'break-word',
                        }}
                      >
                        {log.message}
                      </span>
                    </div>

                    {log.data && Object.keys(log.data).length > 0 && (
                      <div
                        style={{
                          marginTop: '8px',
                          marginLeft: '188px',
                          padding: '8px',
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#999',
                          fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                        }}
                      >
                        <pre
                          style={{
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                          }}
                        >
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </PageContainer>
      )}
    </>
  );
};

export default SchedulerLogs;
