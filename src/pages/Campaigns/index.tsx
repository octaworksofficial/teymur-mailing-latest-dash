import { PlusOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Space, Tag, Popconfirm, Progress } from 'antd';
import React, { useRef, useState } from 'react';
import { history } from '@umijs/max';
import { getCampaigns, deleteCampaign, bulkDeleteCampaigns, duplicateCampaign } from '@/services/campaigns';
import type { EmailCampaign } from '@/types/campaign';

const CampaignList: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const statusColors = {
    draft: 'default',
    scheduled: 'blue',
    active: 'green',
    paused: 'orange',
    completed: 'purple',
    cancelled: 'red',
  };

  const statusLabels = {
    draft: 'Taslak',
    scheduled: 'Zamanlandı',
    active: 'Aktif',
    paused: 'Duraklatıldı',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCampaign(id);
      message.success('Program silindi');
      actionRef.current?.reload();
    } catch (error) {
      message.error('Silme işlemi başarısız oldu');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Lütfen silinecek programları seçin');
      return;
    }
    try {
      await bulkDeleteCampaigns(selectedRowKeys as number[]);
      message.success(`${selectedRowKeys.length} program silindi`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('Toplu silme işlemi başarısız oldu');
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      await duplicateCampaign(id);
      message.success('Program çoğaltıldı');
      actionRef.current?.reload();
    } catch (error) {
      message.error('Çoğaltma işlemi başarısız oldu');
    }
  };

  const columns: ProColumns<EmailCampaign>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: 'Program Adı',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => history.push(`/campaigns/edit/${record.id}`)}>{record.name}</a>
      ),
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      ellipsis: true,
      search: false,
      hideInTable: true,
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: {
        draft: { text: 'Taslak', status: 'Default' },
        scheduled: { text: 'Zamanlandı', status: 'Processing' },
        active: { text: 'Aktif', status: 'Success' },
        paused: { text: 'Duraklatıldı', status: 'Warning' },
        completed: { text: 'Tamamlandı', status: 'Success' },
        cancelled: { text: 'İptal Edildi', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>{statusLabels[record.status]}</Tag>
      ),
    },
    {
      title: 'Alıcı Sayısı',
      dataIndex: 'total_recipients',
      width: 100,
      search: false,
      render: (val) => <Tag color="blue">{val} kişi</Tag>,
    },
    {
      title: 'Şablon Sayısı',
      dataIndex: 'template_sequence',
      width: 100,
      search: false,
      render: (_, record) => <Tag color="green">{record.template_sequence?.length || 0} email</Tag>,
    },
    {
      title: 'Tekrarlayan',
      dataIndex: 'is_recurring',
      width: 100,
      search: false,
      valueType: 'select',
      valueEnum: {
        true: { text: 'Evet', status: 'Success' },
        false: { text: 'Hayır', status: 'Default' },
      },
      render: (_, record) => (
        <Tag color={record.is_recurring ? 'green' : 'default'}>
          {record.is_recurring ? 'Evet' : 'Hayır'}
        </Tag>
      ),
    },
    {
      title: 'İlk Gönderim',
      dataIndex: 'first_send_date',
      width: 150,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: 'Performans',
      key: 'performance',
      width: 200,
      search: false,
      render: (_, record) => {
        if (record.total_sent === 0) return <span>-</span>;
        const openRate = Math.round((record.total_opened / record.total_sent) * 100);
        const clickRate = Math.round((record.total_clicked / record.total_sent) * 100);
        return (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <span style={{ fontSize: 12 }}>Açılma: </span>
              <Progress percent={openRate} size="small" style={{ width: 100 }} />
            </div>
            <div>
              <span style={{ fontSize: 12 }}>Tıklama: </span>
              <Progress percent={clickRate} size="small" style={{ width: 100 }} />
            </div>
          </Space>
        );
      },
    },
    {
      title: 'Gönderim İstatistikleri',
      key: 'stats',
      width: 200,
      search: false,
      render: (_, record) => (
        <Space size="small" wrap>
          <Tag color="blue">📤 {record.total_sent}</Tag>
          <Tag color="green">📖 {record.total_opened}</Tag>
          <Tag color="orange">👆 {record.total_clicked}</Tag>
          <Tag color="purple">💬 {record.total_replied}</Tag>
          {record.total_failed > 0 && <Tag color="red">❌ {record.total_failed}</Tag>}
        </Space>
      ),
    },
    {
      title: 'İşlemler',
      key: 'actions',
      width: 200,
      search: false,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => history.push(`/campaigns/edit/${record.id}`)}
          >
            Düzenle
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleDuplicate(record.id)}
          >
            Çoğalt
          </Button>
          <Popconfirm
            title="Bu programı silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              Sil
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <ProTable<EmailCampaign>
      headerTitle="Email Programları"
      actionRef={actionRef}
      rowKey="id"
      search={{
        labelWidth: 120,
      }}
      toolBarRender={() => [
        <Button
          key="bulk-delete"
          danger
          onClick={handleBulkDelete}
          disabled={selectedRowKeys.length === 0}
        >
          Seçilenleri Sil ({selectedRowKeys.length})
        </Button>,
        <Button
          type="primary"
          key="primary"
          icon={<PlusOutlined />}
          onClick={() => history.push('/campaigns/create')}
        >
          Yeni Program
        </Button>,
      ]}
      request={async (params, sort) => {
        try {
          const response = await getCampaigns({
            page: params.current,
            pageSize: params.pageSize,
            name: params.name,
            status: params.status,
            search: params.keyword,
          });
          return {
            data: response.data,
            success: response.success,
            total: response.pagination.total,
          };
        } catch (error) {
          message.error('Veriler yüklenemedi');
          return {
            data: [],
            success: false,
            total: 0,
          };
        }
      }}
      columns={columns}
      rowSelection={{
        selectedRowKeys,
        onChange: setSelectedRowKeys,
      }}
      pagination={{
        defaultPageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        pageSizeOptions: ['10', '20', '50', '100'],
      }}
      scroll={{ x: 1800 }}
    />
  );
};

export default CampaignList;
