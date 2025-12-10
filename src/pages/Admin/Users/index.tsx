/**
 * Admin - Kullanıcı Yönetimi Sayfası
 */

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createUser,
  deleteUser,
  getUsers,
  type User,
  updateUser,
} from '@/services/auth';

const roleColors: Record<string, string> = {
  super_admin: 'red',
  org_admin: 'blue',
  user: 'green',
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Org Admin',
  user: 'Kullanıcı',
};

const statusColors: Record<string, string> = {
  active: 'green',
  inactive: 'orange',
  suspended: 'red',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  suspended: 'Askıya Alınmış',
};

const UsersPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const columns: ProColumns<User>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Ad',
      dataIndex: 'firstName',
      search: false,
    },
    {
      title: 'Soyad',
      dataIndex: 'lastName',
      search: false,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      search: false,
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        super_admin: { text: 'Super Admin' },
        org_admin: { text: 'Org Admin' },
        user: { text: 'Kullanıcı' },
      },
      render: (_, record) => (
        <Tag color={roleColors[record.role]}>{roleLabels[record.role]}</Tag>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: 'Aktif', status: 'Success' },
        inactive: { text: 'Pasif', status: 'Warning' },
        suspended: { text: 'Askıya Alınmış', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status || 'active']}>
          {statusLabels[record.status || 'active']}
        </Tag>
      ),
    },
    {
      title: 'Organizasyon',
      dataIndex: 'organizationName',
      search: false,
    },
    {
      title: 'Son Giriş',
      dataIndex: 'lastLoginAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'createdAt',
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
              setEditingUser(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Kullanıcıyı silmek istediğinize emin misiniz?"
            onConfirm={async () => {
              const result = await deleteUser(record.id);
              if (result.success) {
                message.success('Kullanıcı silindi');
                actionRef.current?.reload();
              } else {
                message.error(result.error || 'Silme başarısız');
              }
            }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // Güncelle
        const result = await updateUser(editingUser.id, values);
        if (result.success) {
          message.success('Kullanıcı güncellendi');
          setModalVisible(false);
          setEditingUser(null);
          actionRef.current?.reload();
          return true;
        }
        message.error(result.error || 'Güncelleme başarısız');
        return false;
      }
      // Yeni oluştur
      const result = await createUser(values);
      if (result.success) {
        message.success('Kullanıcı oluşturuldu');
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
        title: 'Kullanıcı Yönetimi',
        subTitle: 'Sistemdeki kullanıcıları yönetin',
      }}
    >
      <ProTable<User>
        headerTitle="Kullanıcılar"
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
              setEditingUser(null);
              setModalVisible(true);
            }}
          >
            Yeni Kullanıcı
          </Button>,
        ]}
        request={async (params) => {
          const result = await getUsers({
            page: params.current,
            pageSize: params.pageSize,
            search: params.email,
            role: params.role,
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
        title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        open={modalVisible}
        onOpenChange={(visible) => {
          setModalVisible(visible);
          if (!visible) setEditingUser(null);
        }}
        onFinish={handleSubmit}
        initialValues={editingUser || {}}
        modalProps={{
          destroyOnClose: true,
        }}
      >
        <ProFormText
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email gereklidir' },
            { type: 'email', message: 'Geçerli bir email girin' },
          ]}
          disabled={!!editingUser}
        />
        {!editingUser && (
          <ProFormText.Password
            name="password"
            label="Şifre"
            rules={[
              { required: true, message: 'Şifre gereklidir' },
              { min: 6, message: 'Şifre en az 6 karakter olmalıdır' },
            ]}
          />
        )}
        <ProFormText name="firstName" label="Ad" />
        <ProFormText name="lastName" label="Soyad" />
        <ProFormText name="phone" label="Telefon" />
        <ProFormSelect
          name="role"
          label="Rol"
          rules={[{ required: true, message: 'Rol seçiniz' }]}
          options={[
            { value: 'user', label: 'Kullanıcı' },
            { value: 'org_admin', label: 'Org Admin' },
            { value: 'super_admin', label: 'Super Admin' },
          ]}
        />
        {editingUser && (
          <ProFormSelect
            name="status"
            label="Durum"
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'inactive', label: 'Pasif' },
              { value: 'suspended', label: 'Askıya Alınmış' },
            ]}
          />
        )}
      </ModalForm>
    </PageContainer>
  );
};

export default UsersPage;
