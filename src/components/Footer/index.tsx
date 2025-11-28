import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright="2025 CERİLAS Yüksek Teknoloji San. ve Tic. A.Ş."
      links={[
        {
          key: 'help',
          title: 'Yardım',
          href: 'mailto:deniz@cerilas.com',
          blankTarget: false,
        },
      ]}
    />
  );
};

export default Footer;
