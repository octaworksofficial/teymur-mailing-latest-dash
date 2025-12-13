/**
 * Organization - Kullanıcı Yönetimi Sayfası
 * Org Admin kendi organizasyonundaki kullanıcıları yönetebilir
 */

import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Tag, Modal, Input, Typography } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createUser,
  deleteUser,
  getUsers,
  type User,
  updateUser,
  updateUserPassword,
} from '@/services/auth';
import { useModel } from '@umijs/max';

const { Text, Paragraph } = Typography;

const roleColors: Record<string, string> = {
  org_admin: 'blue',
  user: 'green',
};

const roleLabels: Record<string, string> = {
  org_admin: 'Yönetici',
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

const OrgUsersPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const { message } = App.useApp();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const handlePasswordChange = async () => {
    if (!selectedUserId || !newPassword) {
      message.error('Şifre boş olamaz');
      return;
    }
    if (newPassword.length < 6) {
      message.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      const res = await updateUserPassword(selectedUserId, newPassword, true);
      if (res.success) {
        message.success('Şifre başarıyla güncellendi');
        if (res.password) {
          setGeneratedPassword(res.password);
        } else {
          setPasswordModalVisible(false);
          setNewPassword('');
          setSelectedUserId(null);
        }
      } else {
        message.error(res.error || 'Şifre güncellenemedi');
      }
    } catch (error) {
      message.error('Bir hata oluştu');
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const columns: ProColumns<User>[] = [
    {
      title: 'Email',
      dataIndex: 'email',
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Ad Soyad',
      key: 'name',
      search: false,
      render: (_, record) => (
        <span>
          {record.firstName || ''} {record.lastName || ''}
        </span>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        org_admin: { text: 'Yönetici' },
        user: { text: 'Kullanıcı' },
      },
      render: (_, record) => (
        <Tag color={roleColors[record.role] || 'default'}>
          {roleLabels[record.role] || record.role}
        </Tag>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: 'Aktif', status: 'Success' },
        inactive: { text: 'Pasif', status: 'Warning' },
        suspended: { text: 'Askıda', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status || 'active']}>
          {statusLabels[record.status || 'active']}
        </Tag>
      ),
    },
    {
      title: 'Son Giriş',
      dataIndex: 'lastLoginAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: 'İşlemler',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<KeyOutlined />}
            onClick={() => {
              setSelectedUserId(record.id);
              setPasswordModalVisible(true);
              setNewPassword('');
              setGeneratedPassword(null);
            }}
            title="Şifre Değiştir"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record);
              setModalVisible(true);
            }}
          />
          {record.id !== currentUser?.id && record.role !== 'org_admin' && (
            <Popconfirm
              title="Bu kullanıcıyı silmek istediğinize emin misiniz?"
              onConfirm={async () => {
                const res = await deleteUser(record.id);
                if (res.success) {
                  message.success('Kullanıcı silindi');
                  actionRef.current?.reload();
                } else {
                  message.error(res.error || 'Silme başarısız');
                }
              }}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Kullanıcı Yönetimi',
        subTitle: 'Organizasyonunuzdaki kullanıcıları yönetin',
      }}
    >
      <ProTable<User>
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getUsers({
            page: params.current,
            pageSize: params.pageSize,
            search: params.email,
            role: params.role,
            status: params.status,
          });
          return {
            data: res.data || [],
            total: res.total || 0,
            success: res.success,
          };
        }}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        pagination={{
          defaultPageSize: 10,
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
      />

      <ModalForm
        title={editingUser ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingUser ? {
          email: editingUser.email,
          firstName: editingUser.firstName,
          lastName: editingUser.lastName,
          phone: editingUser.phone,
          role: editingUser.role,
          status: editingUser.status,
        } : {
          role: 'user',
          status: 'active',
        }}
        onFinish={async (values) => {
          try {
            if (editingUser) {
              const res = await updateUser(editingUser.id, values);
              if (res.success) {
                message.success('Kullanıcı güncellendi');
                actionRef.current?.reload();
                return true;
              }
              message.error(res.error || 'Güncelleme başarısız');
              return false;
            } else {
              const res = await createUser(values);
              if (res.success) {
                message.success('Kullanıcı oluşturuldu');
                actionRef.current?.reload();
                return true;
              }
              message.error(res.error || 'Oluşturma başarısız');
              return false;
            }
          } catch (error) {
            message.error('Bir hata oluştu');
            return false;
          }
        }}
        modalProps={{
          destroyOnClose: true,
        }}
      >
        <ProFormText
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Email zorunludur' },
            { type: 'email', message: 'Geçerli bir email girin' },
          ]}
          disabled={!!editingUser}
        />
        {!editingUser && (
          <ProFormText.Password
            name="password"
            label="Şifre"
            rules={[
              { required: true, message: 'Şifre zorunludur' },
              { min: 6, message: 'En az 6 karakter' },
            ]}
          />
        )}
        <ProFormText name="firstName" label="Ad" />
        <ProFormText name="lastName" label="Soyad" />
        <ProFormText name="phone" label="Telefon" />
        <ProFormSelect
          name="role"
          label="Rol"
          options={[
            { value: 'user', label: 'Kullanıcı' },
          ]}
          rules={[{ required: true }]}
        />
        <ProFormSelect
          name="status"
          label="Durum"
          options={[
            { value: 'active', label: 'Aktif' },
            { value: 'inactive', label: 'Pasif' },
            { value: 'suspended', label: 'Askıya Alınmış' },
          ]}
        />
      </ModalForm>

      <Modal
        title="Şifre Değiştir"
        open={passwordModalVisible}
        onOk={handlePasswordChange}
        onCancel={() => {
          setPasswordModalVisible(false);
          setNewPassword('');
          setSelectedUserId(null);
          setGeneratedPassword(null);
        }}
        okText={generatedPassword ? 'Kapat' : 'Kaydet'}
        cancelText="İptal"
      >
        {generatedPassword ? (
          <div>
            <Paragraph>Yeni şifre başarıyla ayarlandı:</Paragraph>
            <Paragraph copyable strong style={{ fontSize: 18, backgroundColor: '#f0f0f0', padding: 10, borderRadius: 4 }}>
              {generatedPassword}
            </Paragraph>
            <Text type="warning">Bu şifreyi güvenli bir yere kaydedin!</Text>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input.Password
              placeholder="Yeni şifre"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button onClick={generateRandomPassword}>Rastgele Şifre Oluştur</Button>
          </Space>
        )}
      </Modal>
    </PageContainer>
  );
};

export default OrgUsersPage;
