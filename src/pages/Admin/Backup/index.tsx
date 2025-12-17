/**
 * Veritabanı Yedekleme Sayfası
 * Sadece Super Admin erişebilir
 * Yedek alma işlemi
 */

import {
  CloudDownloadOutlined,
  DatabaseOutlined,
  ReloadOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { request, useModel } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Modal,
  message,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

interface TableInfo {
  name: string;
  count: number;
}

interface BackupInfo {
  tables: TableInfo[];
  total_records: number;
  database_size: string;
}

const DatabaseBackup: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser as any;
  const isSuperAdmin =
    currentUser?.is_super_admin || currentUser?.role === 'super_admin';

  const [loading, setLoading] = useState(false);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [downloading, setDownloading] = useState(false);

  // Backup Progress state'leri
  const [backupProgress, setBackupProgress] = useState(0);
  const [currentTable, setCurrentTable] = useState<string>('');
  const [processedTables, setProcessedTables] = useState<
    { name: string; count: number }[]
  >([]);
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [completedBackupId, setCompletedBackupId] = useState<string | null>(
    null,
  );
  const [backupStats, setBackupStats] = useState<{
    totalRecords: number;
    duration: string;
  } | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      loadBackupInfo();
    }
  }, [isSuperAdmin]);

  const loadBackupInfo = async () => {
    setLoading(true);
    try {
      const response = await request('/api/admin/backup/info');
      if (response.success) {
        setBackupInfo(response.data);
      }
    } catch (error) {
      console.error('Backup info error:', error);
      message.error('Veritabanı bilgisi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = () => {
    // Progress state'lerini sıfırla
    setBackupProgress(0);
    setCurrentTable('');
    setProcessedTables([]);
    setBackupModalVisible(true);
    setDownloading(true);

    const token = localStorage.getItem('access_token');

    // SSE bağlantısı kur
    fetch('/api/admin/backup/stream', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
    })
      .then(async (response) => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('Stream okunamadı');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Satırları parse et
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Son eksik satırı buffer'da tut

          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7);
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6);

              // Event'i işle
              if (eventType && eventData) {
                try {
                  const data = JSON.parse(eventData);

                  switch (eventType) {
                    case 'start':
                      setCurrentTable('Başlatılıyor...');
                      break;

                    case 'progress':
                      setCurrentTable(`${data.table} yedekleniyor...`);
                      setBackupProgress(data.percent);
                      break;

                    case 'table_complete':
                      setProcessedTables((prev) => [
                        ...prev,
                        { name: data.table, count: data.count },
                      ]);
                      setBackupProgress(data.percent);
                      break;

                    case 'complete':
                      setBackupProgress(100);
                      setCurrentTable('Yedekleme tamamlandı!');
                      setDownloading(false);
                      setCompletedBackupId(data.backupId);
                      setBackupStats({
                        totalRecords: data.totalRecords,
                        duration: data.duration,
                      });
                      message.success(
                        `Yedekleme tamamlandı! (${data.duration}s)`,
                      );
                      break;

                    case 'error':
                      message.error(`Yedekleme hatası: ${data.message}`);
                      setDownloading(false);
                      setBackupModalVisible(false);
                      break;
                  }
                } catch (e) {
                  console.error('SSE parse error:', e);
                }
              }

              // Reset for next event
              eventType = '';
              eventData = '';
            }
          }
        }
      })
      .catch((error) => {
        console.error('Backup stream error:', error);
        message.error(`Yedekleme başarısız: ${error.message}`);
        setDownloading(false);
        setBackupModalVisible(false);
      });
  };

  // Super admin değilse erişim engelle
  if (!isSuperAdmin) {
    return (
      <PageContainer>
        <Alert
          message="Erişim Engellendi"
          description="Bu sayfaya sadece Super Admin kullanıcıları erişebilir."
          type="error"
          showIcon
        />
      </PageContainer>
    );
  }

  const tableColumns = [
    {
      title: 'Tablo Adı',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <TableOutlined />
          <Text code>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Kayıt Sayısı',
      dataIndex: 'count',
      key: 'count',
      render: (count: number) => (
        <Tag color={count > 0 ? 'blue' : 'default'}>
          {count.toLocaleString('tr-TR')} kayıt
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Veritabanı Yedekleme',
        subTitle: 'Veritabanı yedekleme işlemleri',
      }}
    >
      <Spin spinning={loading}>
        {/* Uyarı Mesajı */}
        <Alert
          message="Önemli Bilgi"
          description="Yedek dosyası tüm veritabanı tablolarını JSON formatında içerir. 
                      Yedek dosyasını güvenli bir yerde saklayın."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={24}>
          {/* Sol Panel - Veritabanı Bilgileri */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <DatabaseOutlined />
                  Veritabanı Durumu
                </Space>
              }
              extra={
                <Button
                  icon={<ReloadOutlined />}
                  onClick={loadBackupInfo}
                  loading={loading}
                >
                  Yenile
                </Button>
              }
            >
              {backupInfo && (
                <>
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={8}>
                      <Statistic
                        title="Toplam Kayıt"
                        value={backupInfo.total_records}
                        suffix="kayıt"
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Tablo Sayısı"
                        value={backupInfo.tables.length}
                        suffix="tablo"
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Veritabanı Boyutu"
                        value={backupInfo.database_size}
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Col>
                  </Row>

                  <Table
                    dataSource={backupInfo.tables}
                    columns={tableColumns}
                    rowKey="name"
                    size="small"
                    pagination={false}
                    scroll={{ y: 400 }}
                  />
                </>
              )}
            </Card>
          </Col>

          {/* Sağ Panel - Yedekleme */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <Space>
                  <CloudDownloadOutlined />
                  Yedek Al
                </Space>
              }
            >
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Format">JSON</Descriptions.Item>
                <Descriptions.Item label="İçerik">
                  Tüm tablolar ve veriler
                </Descriptions.Item>
                <Descriptions.Item label="Sıkıştırma">Hayır</Descriptions.Item>
              </Descriptions>

              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                size="large"
                block
                loading={downloading}
                onClick={handleDownloadBackup}
                style={{ marginTop: 24 }}
              >
                {downloading ? 'Yedekleniyor...' : 'Veritabanı Yedeği Al'}
              </Button>

              <Alert
                message="Yedek dosyası tarayıcınıza indirilecektir."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>

      {/* Backup Progress Modal */}
      <Modal
        title={
          <Space>
            <CloudDownloadOutlined style={{ color: '#1890ff' }} />
            <span>Veritabanı Yedekleniyor</span>
          </Space>
        }
        open={backupModalVisible}
        closable={!downloading}
        maskClosable={false}
        onCancel={() => {
          if (!downloading) {
            setBackupModalVisible(false);
            setCompletedBackupId(null);
            setBackupStats(null);
            setProcessedTables([]);
            setBackupProgress(0);
          }
        }}
        footer={
          completedBackupId ? (
            <Space>
              <Button
                onClick={() => {
                  setBackupModalVisible(false);
                  setCompletedBackupId(null);
                  setBackupStats(null);
                  setProcessedTables([]);
                  setBackupProgress(0);
                }}
              >
                Kapat
              </Button>
              <Button
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={async () => {
                  try {
                    // Backup'ı indir
                    const response = await fetch(
                      `/api/admin/backup/download/${completedBackupId}`,
                      {
                        method: 'GET',
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                        },
                      },
                    );

                    if (!response.ok) {
                      throw new Error('İndirme başarısız');
                    }

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    message.success('Yedek dosyası indirildi!');

                    // Modal'ı kapat
                    setBackupModalVisible(false);
                    setCompletedBackupId(null);
                    setBackupStats(null);
                    setProcessedTables([]);
                    setBackupProgress(0);
                  } catch (error: any) {
                    message.error(`İndirme hatası: ${error.message}`);
                  }
                }}
              >
                Yedeği İndir{' '}
                {backupStats
                  ? `(${backupStats.totalRecords.toLocaleString('tr-TR')} kayıt)`
                  : ''}
              </Button>
            </Space>
          ) : null
        }
        width={500}
      >
        <div style={{ padding: '20px 0' }}>
          <Progress
            percent={backupProgress}
            status={backupProgress === 100 ? 'success' : 'active'}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Text strong style={{ fontSize: 16 }}>
              {currentTable}
            </Text>
          </div>

          {processedTables.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Text type="secondary">İşlenen Tablolar:</Text>
              <div
                style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  marginTop: 8,
                  background: '#f5f5f5',
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                {processedTables.map((table, tableIndex) => (
                  <div
                    key={table.name}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom:
                        tableIndex < processedTables.length - 1
                          ? '1px solid #e8e8e8'
                          : 'none',
                    }}
                  >
                    <Text>
                      <TableOutlined
                        style={{ marginRight: 8, color: '#52c41a' }}
                      />
                      {table.name}
                    </Text>
                    <Tag color="green">
                      {table.count.toLocaleString('tr-TR')} kayıt
                    </Tag>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </PageContainer>
  );
};

export default DatabaseBackup;
