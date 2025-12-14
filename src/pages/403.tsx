import { history } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';

const NoAccessPage: React.FC = () => (
  <Result
    status="403"
    title="403"
    subTitle="Üzgünüz, bu sayfaya erişim yetkiniz bulunmamaktadır."
    extra={
      <Button type="primary" onClick={() => history.push('/')}>
        Ana Sayfaya Dön
      </Button>
    }
  />
);

export default NoAccessPage;
