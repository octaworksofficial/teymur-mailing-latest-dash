import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright="2025 CRMENTUM - Email Kampanya Yönetim Platformu"
      links={[
        {
          key: 'help',
          title: 'Yardım',
          href: 'mailto:destek@crmentum.com',
          blankTarget: false,
        },
      ]}
    />
  );
};

export default Footer;
