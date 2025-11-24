import { Steps, Card, Button, Space } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import React, { useState } from 'react';

const { Step } = Steps;

const CreateCampaign: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Kampanya Detayları',
      content: (
        <Card>
          <p style={{ fontSize: 16, marginBottom: 24 }}>
            Kampanya adı ve açıklamasını girin
          </p>
          <p style={{ color: '#888' }}>
            Bu adımda kampanya adı, açıklama ve temel ayarlar için form alanları bulunacak.
          </p>
        </Card>
      ),
    },
    {
      title: 'Şablon Seç',
      content: (
        <Card>
          <p style={{ fontSize: 16, marginBottom: 24 }}>
            Bu kampanya için bir email şablonu seçin
          </p>
          <p style={{ color: '#888' }}>
            Bu adımda şablon kütüphanenizden seçim yapabileceksiniz.
          </p>
        </Card>
      ),
    },
    {
      title: 'Hedef Kitle',
      content: (
        <Card>
          <p style={{ fontSize: 16, marginBottom: 24 }}>
            Alıcıları seçin ve filtreler uygulayın
          </p>
          <p style={{ color: '#888' }}>
            Bu adımda etiketler, segmentler ve özel filtrelere göre kişileri seçebileceksiniz.
          </p>
        </Card>
      ),
    },
    {
      title: 'Zamanlama',
      content: (
        <Card>
          <p style={{ fontSize: 16, marginBottom: 24 }}>
            Kampanyanızın ne zaman gönderileceğini ayarlayın
          </p>
          <p style={{ color: '#888' }}>
            Seçenekler: Hemen gönder, Daha sonra için zamanla, Tekrarlayan kampanya, Koşullu gönderim
          </p>
        </Card>
      ),
    },
    {
      title: 'İncele & Başlat',
      content: (
        <Card>
          <p style={{ fontSize: 16, marginBottom: 24 }}>
            Başlatmadan önce kampanya ayarlarınızı inceleyin
          </p>
          <p style={{ color: '#888' }}>
            Tüm kampanya ayarlarının son incelemesi ve önizleme.
          </p>
        </Card>
      ),
    },
  ];

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <PageContainer
      header={{
        title: 'Yeni Kampanya Oluştur',
        subTitle: 'Email kampanyanızı oluşturmak için adımları takip edin',
      }}
    >
      <Card>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} />
          ))}
        </Steps>

        <div style={{ minHeight: 300 }}>
          {steps[currentStep].content}
        </div>

        <div style={{ marginTop: 24 }}>
          <Space>
            {currentStep > 0 && (
              <Button onClick={() => prev()}>
                Önceki
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={() => next()}>
                Sonraki
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary">
                Kampanyayı Başlat
              </Button>
            )}
            <Button>
              Taslak Olarak Kaydet
            </Button>
          </Space>
        </div>
      </Card>
    </PageContainer>
  );
};

export default CreateCampaign;
