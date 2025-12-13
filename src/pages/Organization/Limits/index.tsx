/**
 * Organization - Limitler Sayfası
 * Org Admin kendi organizasyonunun limitlerini görüntüleyebilir
 */

import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Progress, Row, Statistic, Typography, Alert } from 'antd';
import { TeamOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import { getOrganizationLimits } from '@/services/auth';

const { Title, Text } = Typography;

interface LimitsData {
  organization: string;
  plan: string;
  limits: {
    max_users: number;
    max_contacts: number;
    max_emails_per_month: number;
  };
  usage: {
    current_users: number;
    current_contacts: number;
    emails_this_month: number;
  };
  remaining: {
    users: number;
    contacts: number;
    emails: number;
  };
}

const planLabels: Record<string, string> = {
  free: 'Ücretsiz',
  starter: 'Başlangıç',
  professional: 'Profesyonel',
  enterprise: 'Kurumsal',
};

const OrgLimitsPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [loading, setLoading] = useState(true);
  const [limitsData, setLimitsData] = useState<LimitsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      if (!currentUser?.organizationId) {
        setError('Organizasyon bilgisi bulunamadı');
        setLoading(false);
        return;
      }

      try {
        const res = await getOrganizationLimits(currentUser.organizationId);
        if (res.success && res.data) {
          setLimitsData(res.data);
        } else {
          setError(res.error || 'Limitler alınamadı');
        }
      } catch (err) {
        setError('Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchLimits();
  }, [currentUser?.organizationId]);

  const getProgressStatus = (current: number, max: number) => {
    const percent = (current / max) * 100;
    if (percent >= 100) return 'exception';
    if (percent >= 80) return 'active';
    return 'normal';
  };

  const getProgressColor = (current: number, max: number) => {
    const percent = (current / max) * 100;
    if (percent >= 100) return '#ff4d4f';
    if (percent >= 80) return '#faad14';
    return '#52c41a';
  };

  if (error) {
    return (
      <PageContainer>
        <Alert message="Hata" description={error} type="error" showIcon />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: 'Organizasyon Limitleri',
        subTitle: limitsData ? `${limitsData.organization} - ${planLabels[limitsData.plan] || limitsData.plan} Plan` : '',
      }}
      loading={loading}
    >
      {limitsData && (
        <>
          <Alert
            message="Limit Bilgilendirmesi"
            description="Aşağıda organizasyonunuzun kullanım limitleri ve mevcut kullanım durumu gösterilmektedir. Limit artışı için platform yöneticisi ile iletişime geçin."
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Row gutter={[24, 24]}>
            {/* Kullanıcı Limiti */}
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title={
                    <span>
                      <TeamOutlined style={{ marginRight: 8 }} />
                      Kullanıcı Limiti
                    </span>
                  }
                  value={limitsData.usage.current_users}
                  suffix={`/ ${limitsData.limits.max_users}`}
                />
                <Progress
                  percent={Math.round((limitsData.usage.current_users / limitsData.limits.max_users) * 100)}
                  status={getProgressStatus(limitsData.usage.current_users, limitsData.limits.max_users)}
                  strokeColor={getProgressColor(limitsData.usage.current_users, limitsData.limits.max_users)}
                  style={{ marginTop: 16 }}
                />
                <Text type="secondary">
                  Kalan: {limitsData.remaining.users} kullanıcı
                </Text>
              </Card>
            </Col>

            {/* Kişi Limiti */}
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title={
                    <span>
                      <UserOutlined style={{ marginRight: 8 }} />
                      Kişi Limiti
                    </span>
                  }
                  value={limitsData.usage.current_contacts}
                  suffix={`/ ${limitsData.limits.max_contacts}`}
                />
                <Progress
                  percent={Math.round((limitsData.usage.current_contacts / limitsData.limits.max_contacts) * 100)}
                  status={getProgressStatus(limitsData.usage.current_contacts, limitsData.limits.max_contacts)}
                  strokeColor={getProgressColor(limitsData.usage.current_contacts, limitsData.limits.max_contacts)}
                  style={{ marginTop: 16 }}
                />
                <Text type="secondary">
                  Kalan: {limitsData.remaining.contacts.toLocaleString()} kişi
                </Text>
              </Card>
            </Col>

            {/* Aylık Email Limiti */}
            <Col xs={24} md={8}>
              <Card>
                <Statistic
                  title={
                    <span>
                      <MailOutlined style={{ marginRight: 8 }} />
                      Aylık Email Limiti
                    </span>
                  }
                  value={limitsData.usage.emails_this_month}
                  suffix={`/ ${limitsData.limits.max_emails_per_month}`}
                />
                <Progress
                  percent={Math.round((limitsData.usage.emails_this_month / limitsData.limits.max_emails_per_month) * 100)}
                  status={getProgressStatus(limitsData.usage.emails_this_month, limitsData.limits.max_emails_per_month)}
                  strokeColor={getProgressColor(limitsData.usage.emails_this_month, limitsData.limits.max_emails_per_month)}
                  style={{ marginTop: 16 }}
                />
                <Text type="secondary">
                  Kalan: {limitsData.remaining.emails.toLocaleString()} email
                </Text>
              </Card>
            </Col>
          </Row>

          <Card style={{ marginTop: 24 }}>
            <Title level={5}>Plan Detayları</Title>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Text strong>Plan Türü:</Text>
                <br />
                <Text>{planLabels[limitsData.plan] || limitsData.plan}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Organizasyon:</Text>
                <br />
                <Text>{limitsData.organization}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Limit Artışı:</Text>
                <br />
                <Text type="secondary">Platform yöneticisi ile iletişime geçin</Text>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </PageContainer>
  );
};

export default OrgLimitsPage;
