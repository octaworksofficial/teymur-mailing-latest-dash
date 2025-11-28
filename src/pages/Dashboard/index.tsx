import { Column } from '@ant-design/charts';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  EyeOutlined,
  FileTextOutlined,
  MailOutlined,
  ReloadOutlined,
  SendOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Spin, Statistic, Table, Tag } from 'antd';
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

  const columns = [
    {
      title: 'Kampanya Adı',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'running' ? 'green' : 'blue'}>
          {status === 'running' ? 'ÇALIŞIYOR' : 'ZAMANLANMIŞ'}
        </Tag>
      ),
    },
    {
      title: 'Gönderilen',
      dataIndex: 'sent',
      key: 'sent',
    },
    {
      title: 'Açılan',
      dataIndex: 'opened',
      key: 'opened',
    },
    {
      title: 'Tıklanan',
      dataIndex: 'clicked',
      key: 'clicked',
    },
    {
      title: 'Açılma Oranı',
      dataIndex: 'openRate',
      key: 'openRate',
    },
  ];

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
