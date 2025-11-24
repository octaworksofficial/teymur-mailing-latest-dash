import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright="2025 OCTA Works"
      links={[
        {
          key: 'help',
          title: 'Yardım',
          href: '#',
          blankTarget: false,
        },
        {
          key: 'privacy',
          title: 'Gizlilik',
          href: '#',
          blankTarget: false,
        },
        {
          key: 'terms',
          title: 'Kullanım Şartları',
          href: '#',
          blankTarget: false,
        },
      ]}
    />
  );
};

export default Footer;
