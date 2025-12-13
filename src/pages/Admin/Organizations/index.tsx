/**
 * Admin - Organizasyon Yönetimi Sayfası
 * Sadece Super Admin erişebilir
 */

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createOrganization,
  deleteOrganization,
  getOrganizations,
  type Organization,
  updateOrganization,
} from '@/services/auth';

const statusColors: Record<string, string> = {
  active: 'green',
  suspended: 'orange',
  cancelled: 'red',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  suspended: 'Askıya Alınmış',
  cancelled: 'İptal Edilmiş',
};

const planColors: Record<string, string> = {
  free: 'default',
  starter: 'blue',
  professional: 'purple',
  enterprise: 'gold',
};

const planLabels: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

const OrganizationsPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  const columns: ProColumns<Organization>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: 'Organizasyon Adı',
      dataIndex: 'name',
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      copyable: true,
      search: false,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      copyable: true,
      ellipsis: true,
      search: false,
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      valueType: 'select',
      valueEnum: {
        free: { text: 'Free' },
        starter: { text: 'Starter' },
        professional: { text: 'Professional' },
        enterprise: { text: 'Enterprise' },
      },
      render: (_, record) => (
        <Tag color={planColors[record.plan]}>{planLabels[record.plan]}</Tag>
      ),
      search: false,
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: 'Aktif', status: 'Success' },
        suspended: { text: 'Askıya Alınmış', status: 'Warning' },
        cancelled: { text: 'İptal Edilmiş', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>
          {statusLabels[record.status]}
        </Tag>
      ),
    },
    {
      title: 'Kullanıcı Sayısı',
      dataIndex: 'userCount',
      search: false,
      render: (_, record) => (
        <span>
          {record.userCount || 0} / {record.maxUsers || '∞'}
        </span>
      ),
    },
    {
      title: 'Kişi Sayısı',
      dataIndex: 'contactCount',
      search: false,
      render: (_, record) => (
        <span>
          {record.contactCount || 0} / {record.maxContacts || '∞'}
        </span>
      ),
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: 'İşlemler',
      valueType: 'option',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingOrg(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Organizasyonu silmek istediğinize emin misiniz?"
            description="Bu işlem geri alınamaz ve tüm kullanıcılar silinir!"
            onConfirm={async () => {
              const result = await deleteOrganization(record.id);
              if (result.success) {
                message.success('Organizasyon silindi');
                actionRef.current?.reload();
              } else {
                message.error(result.error || 'Silme başarısız');
              }
            }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.slug === 'system-admin'}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async (values: any) => {
    try {
      if (editingOrg) {
        const result = await updateOrganization(editingOrg.id, values);
        if (result.success) {
          message.success('Organizasyon güncellendi');
          setModalVisible(false);
          setEditingOrg(null);
          actionRef.current?.reload();
          return true;
        }
        message.error(result.error || 'Güncelleme başarısız');
        return false;
      }
      const result = await createOrganization(values);
      if (result.success) {
        message.success('Organizasyon oluşturuldu');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      }
      message.error(result.error || 'Oluşturma başarısız');
      return false;
    } catch (error) {
      message.error('Bir hata oluştu');
      return false;
    }
  };

  return (
    <PageContainer
      header={{
        title: 'Organizasyon Yönetimi',
        subTitle: 'Sistemdeki organizasyonları yönetin',
      }}
    >
      <ProTable<Organization>
        headerTitle="Organizasyonlar"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingOrg(null);
              setModalVisible(true);
            }}
          >
            Yeni Organizasyon
          </Button>,
        ]}
        request={async (params) => {
          const result = await getOrganizations({
            page: params.current,
            pageSize: params.pageSize,
            search: params.name,
            status: params.status,
          });

          return {
            data: result.data || [],
            success: result.success,
            total: result.total || 0,
          };
        }}
        columns={columns}
        pagination={{
          showSizeChanger: true,
          defaultPageSize: 10,
        }}
      />

      <ModalForm
        title={editingOrg ? 'Organizasyon Düzenle' : 'Yeni Organizasyon'}
        open={modalVisible}
        onOpenChange={(visible) => {
          setModalVisible(visible);
          if (!visible) setEditingOrg(null);
        }}
        onFinish={handleSubmit}
        initialValues={editingOrg ? {
          name: editingOrg.name,
          slug: editingOrg.slug,
          description: editingOrg.description,
          email: editingOrg.email,
          phone: editingOrg.phone,
          website: editingOrg.website,
          plan: editingOrg.plan,
          status: editingOrg.status,
          maxUsers: editingOrg.maxUsers ?? (editingOrg as any).max_users,
          maxContacts: editingOrg.maxContacts ?? (editingOrg as any).max_contacts,
          maxEmailsPerMonth: editingOrg.maxEmailsPerMonth ?? (editingOrg as any).max_emails_per_month,
        } : { plan: 'free', status: 'active', maxUsers: 5, maxContacts: 1000, maxEmailsPerMonth: 5000 }}
        modalProps={{
          destroyOnClose: true,
          width: 600,
        }}
      >
        <ProFormText
          name="name"
          label="Organizasyon Adı"
          rules={[{ required: true, message: 'Organizasyon adı gereklidir' }]}
        />
        <ProFormText
          name="slug"
          label="Slug (URL)"
          rules={[
            { required: true, message: 'Slug gereklidir' },
            {
              pattern: /^[a-z0-9-]+$/,
              message: 'Sadece küçük harf, rakam ve tire kullanılabilir',
            },
          ]}
          disabled={!!editingOrg}
          tooltip="URL'lerde kullanılacak benzersiz tanımlayıcı"
        />
        <ProFormTextArea name="description" label="Açıklama" />
        <ProFormText name="email" label="Email" />
        <ProFormText name="phone" label="Telefon" />
        <ProFormText name="website" label="Website" />
        <ProFormSelect
          name="plan"
          label="Plan"
          options={[
            { value: 'free', label: 'Free' },
            { value: 'starter', label: 'Starter' },
            { value: 'professional', label: 'Professional' },
            { value: 'enterprise', label: 'Enterprise' },
          ]}
        />
        {editingOrg && (
          <ProFormSelect
            name="status"
            label="Durum"
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'suspended', label: 'Askıya Alınmış' },
              { value: 'cancelled', label: 'İptal Edilmiş' },
            ]}
          />
        )}
        <ProFormDigit
          name="maxUsers"
          label="Maksimum Kullanıcı"
          min={1}
          max={9999}
        />
        <ProFormDigit
          name="maxContacts"
          label="Maksimum Kişi"
          min={100}
          max={9999999}
        />
        <ProFormDigit
          name="maxEmailsPerMonth"
          label="Aylık Maksimum Email"
          min={100}
          max={9999999}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default OrganizationsPage;
