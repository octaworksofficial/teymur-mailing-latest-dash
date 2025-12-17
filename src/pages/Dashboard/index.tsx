import { Column } from '@ant-design/charts';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  MailOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { getCampaignStats } from '@/services/campaigns';
import { getContactStats } from '@/services/contacts';
import type {
  ActiveCampaign,
  DashboardStats,
  WeeklyEmailData,
} from '@/services/dashboard';
import { getDashboardData } from '@/services/dashboard';
import { getTemplateStats } from '@/services/templates';

const Dashboard: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const isSuperAdmin = (initialState?.currentUser as any)?.is_super_admin;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyEmailData[]>([]);
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [templateCount, setTemplateCount] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Dashboard ana verilerini getir
      try {
        const dashboardResponse = await getDashboardData();

        if (dashboardResponse.data) {
          setStats(dashboardResponse.data.stats);
          setWeeklyData(dashboardResponse.data.weeklyEmails);
          setCampaigns(dashboardResponse.data.activeCampaigns);
        }
      } catch (_dashboardError) {
        console.log('Dashboard endpoint not available, using fallback data');
        // Fallback: Mock data kullan
        setWeeklyData([
          { date: 'Pzt', value: 0 },
          { date: 'Sal', value: 0 },
          { date: 'Çar', value: 0 },
          { date: 'Per', value: 0 },
          { date: 'Cum', value: 0 },
          { date: 'Cmt', value: 0 },
          { date: 'Paz', value: 0 },
        ]);
      }

      // Alternatif olarak, eğer dashboard endpoint yoksa, ayrı ayrı çek
      try {
        const contactStatsResponse = await getContactStats();
        if (contactStatsResponse.data?.total_contacts) {
          setContactCount(contactStatsResponse.data.total_contacts);
        }
      } catch (_error) {
        console.log('Contact stats endpoint not available');
      }

      try {
        const campaignStatsResponse = await getCampaignStats();
        if (campaignStatsResponse.data?.summary?.total_campaigns) {
          setCampaignCount(campaignStatsResponse.data.summary.total_campaigns);
        }
      } catch (_error) {
        console.log('Campaign stats endpoint not available');
      }

      try {
        const templateStatsResponse = await getTemplateStats();
        if (templateStatsResponse.data?.summary?.total_templates) {
          setTemplateCount(templateStatsResponse.data.summary.total_templates);
        }
      } catch (_error) {
        console.log('Template stats endpoint not available');
      }
    } catch (error) {
      console.error('Dashboard data loading error:', error);
      // Kullanıcıya hata mesajı gösterme - sessizce fallback kullan
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    data: weeklyData,
    xField: 'date',
    yField: 'value',
    color: '#1890ff',
    columnStyle: {
      radius: [8, 8, 0, 0],
    },
  };

  // Durum renkleri ve ikonları
  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { color: string; icon: React.ReactNode; text: string }
    > = {
      active: { color: 'green', icon: <PlayCircleOutlined />, text: 'Aktif' },
      running: {
        color: 'green',
        icon: <PlayCircleOutlined />,
        text: 'Çalışıyor',
      },
      scheduled: {
        color: 'blue',
        icon: <ClockCircleOutlined />,
        text: 'Zamanlanmış',
      },
      paused: {
        color: 'orange',
        icon: <PauseCircleOutlined />,
        text: 'Duraklatıldı',
      },
      completed: {
        color: 'default',
        icon: <CheckCircleOutlined />,
        text: 'Tamamlandı',
      },
      draft: { color: 'default', icon: <FileTextOutlined />, text: 'Taslak' },
    };
    return configs[status] || { color: 'default', icon: null, text: status };
  };

  const columns = [
    {
      title: 'Kampanya',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (name: string, record: ActiveCampaign) => (
        <div>
          <Typography.Text
            strong
            ellipsis
            style={{ display: 'block', maxWidth: 180 }}
          >
            {name}
          </Typography.Text>
          {record.templateName && record.templateName !== '-' && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Şablon: {record.templateName}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: 'Alıcılar',
      dataIndex: 'recipients',
      key: 'recipients',
      width: 80,
      align: 'center' as const,
      render: (recipients: number) => (
        <Tooltip title="Toplam alıcı sayısı">
          <span>
            <UserOutlined style={{ marginRight: 4 }} />
            {recipients || 0}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Gönderilen',
      dataIndex: 'sent',
      key: 'sent',
      width: 90,
      align: 'center' as const,
      render: (sent: number) => (
        <Tooltip title="Gönderilen email sayısı">
          <span>
            <SendOutlined style={{ marginRight: 4, color: '#52c41a' }} />
            {sent || 0}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Açılan',
      dataIndex: 'opened',
      key: 'opened',
      width: 80,
      align: 'center' as const,
      render: (opened: number) => (
        <Tooltip title="Açılan email sayısı">
          <span>
            <EyeOutlined style={{ marginRight: 4, color: '#1890ff' }} />
            {opened || 0}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Tıklanan',
      dataIndex: 'clicked',
      key: 'clicked',
      width: 80,
      align: 'center' as const,
      render: (clicked: number) => (
        <Tooltip title="Tıklanan link sayısı">
          <span>
            <MailOutlined style={{ marginRight: 4, color: '#faad14' }} />
            {clicked || 0}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Açılma Oranı',
      dataIndex: 'openRate',
      key: 'openRate',
      width: 100,
      align: 'center' as const,
      render: (rate: string) => {
        const numRate = parseFloat(rate) || 0;
        let color = '#ff4d4f';
        if (numRate >= 30) color = '#52c41a';
        else if (numRate >= 15) color = '#faad14';
        return (
          <Typography.Text style={{ color, fontWeight: 600 }}>
            {rate || '0.0%'}
          </Typography.Text>
        );
      },
    },
    {
      title: 'İlerleme',
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (progress: number, record: ActiveCampaign) => {
        const sent = record.sent || 0;
        const recipients = record.recipients || 0;
        return (
          <Tooltip title={`${sent} / ${recipients} alıcıya gönderildi`}>
            <Progress
              percent={progress || 0}
              size="small"
              status={progress >= 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </Tooltip>
        );
      },
    },
  ];

  // Super Admin için özel dashboard
  if (isSuperAdmin) {
    return (
      <PageContainer
        header={{
          title: 'Yönetim Paneli',
          subTitle: 'Sistem Genel Bakış',
        }}
      >
        <Spin spinning={loading}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card bordered={false}>
                <Statistic
                  title="Toplam Organizasyon"
                  value={0}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                  Aktif organizasyonlar
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card bordered={false}>
                <Statistic
                  title="Toplam Kullanıcı"
                  value={0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                  Tüm kullanıcılar
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card bordered={false}>
                <Statistic
                  title="Aktif Kullanıcı"
                  value={0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
                <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                  Son 30 günde aktif
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col span={24}>
              <Card
                title="Hoş Geldiniz"
                bordered={false}
                style={{ textAlign: 'center', padding: '40px 0' }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      <Typography.Title level={4}>
                        Super Admin Paneli
                      </Typography.Title>
                      <Typography.Paragraph style={{ fontSize: 16 }}>
                        Organizasyonları ve kullanıcıları yönetmek için sol
                        menüden ilgili bölüme gidin.
                      </Typography.Paragraph>
                    </span>
                  }
                />
              </Card>
            </Col>
          </Row>
        </Spin>
      </PageContainer>
    );
  }

  // Normal kullanıcılar için mevcut dashboard
  return (
    <PageContainer
      header={{
        title: 'Gösterge Paneli',
        subTitle: 'Email Kampanya Genel Bakış',
      }}
    >
      {/* KPI Cards */}
      <Spin spinning={loading}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Toplam Gönderilen Email"
                value={stats?.totalEmailsSent || 0}
                prefix={<SendOutlined />}
                valueStyle={{ color: '#3f8600' }}
                suffix={
                  stats && stats.totalEmailsSentChange >= 0 ? (
                    <ArrowUpOutlined style={{ fontSize: 12 }} />
                  ) : (
                    <ArrowDownOutlined style={{ fontSize: 12 }} />
                  )
                }
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                {stats?.totalEmailsSentChange
                  ? `Geçen haftaya göre ${stats.totalEmailsSentChange > 0 ? '+' : ''}${stats.totalEmailsSentChange.toFixed(1)}%`
                  : 'Veri yok'}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Açılma Oranı"
                value={stats?.openRate || 0}
                prefix={<EyeOutlined />}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#1890ff' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                {stats?.openRateChange
                  ? `Geçen haftaya göre ${stats.openRateChange > 0 ? '+' : ''}${stats.openRateChange.toFixed(1)}%`
                  : 'Veri yok'}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Tıklama Oranı"
                value={stats?.clickRate || 0}
                prefix={<MailOutlined />}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#faad14' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                {stats?.clickRateChange
                  ? `Geçen haftaya göre ${stats.clickRateChange > 0 ? '+' : ''}${stats.clickRateChange.toFixed(1)}%`
                  : 'Veri yok'}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card bordered={false}>
              <Statistic
                title="Yanıt Oranı"
                value={stats?.replyRate || 0}
                prefix={<ReloadOutlined />}
                suffix="%"
                precision={1}
                valueStyle={{ color: '#cf1322' }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
                {stats?.replyRateChange
                  ? `Geçen haftaya göre ${stats.replyRateChange > 0 ? '+' : ''}${stats.replyRateChange.toFixed(1)}%`
                  : 'Veri yok'}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Chart Section */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={16}>
            <Card title="Bu Hafta Gönderilen Emailler" bordered={false}>
              <Column {...chartConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Hızlı İstatistikler" bordered={false}>
              <Statistic
                title="Aktif Kampanyalar"
                value={stats?.activeCampaigns || campaignCount || 0}
                prefix={<ThunderboltOutlined />}
                suffix="kampanya"
                style={{ marginBottom: 16 }}
              />
              <Statistic
                title="Toplam Kişiler"
                value={stats?.totalContacts || contactCount || 0}
                prefix={<UserOutlined />}
                suffix="kişi"
                style={{ marginBottom: 16 }}
              />
              <Statistic
                title="Email Şablonları"
                value={stats?.totalTemplates || templateCount || 0}
                prefix={<FileTextOutlined />}
                suffix="şablon"
              />
            </Card>
          </Col>
        </Row>

        {/* Active Campaigns Table */}
        <Card title="Aktif Kampanyalar" bordered={false}>
          <Table
            columns={columns}
            dataSource={campaigns}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Aktif kampanya bulunamadı' }}
          />
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default Dashboard;
