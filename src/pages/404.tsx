import { history } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

const NoFoundPage: React.FC = () => (
  <Card variant="borderless">
    <Result
      status="404"
      title="404"
      subTitle="Üzgünüz, aradığınız sayfa bulunamadı."
      extra={
        <Button type="primary" onClick={() => history.push('/')}>
          Ana Sayfaya Dön
        </Button>
      }
    />
  </Card>
);

export default NoFoundPage;
