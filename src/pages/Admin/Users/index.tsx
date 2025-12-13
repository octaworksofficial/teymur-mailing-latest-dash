/**
 * Admin - Kullanıcı Yönetimi Sayfası
 */

import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
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
import { App, Button, Popconfirm, Space, Tag, Modal, Input, Typography } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import {
  createUser,
  deleteUser,
  getUsers,
  getOrganizations,
  type User,
  type Organization,
  updateUser,
  updateUserPassword,
} from '@/services/auth';

const { Text, Paragraph } = Typography;

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
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  // Organizasyonları yükle
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const res = await getOrganizations({ pageSize: 100 });
        if (res.success && res.data) {
          setOrganizations(res.data);
        }
      } catch (error) {
        console.error('Organizasyonlar yüklenemedi:', error);
      }
    };
    loadOrganizations();
  }, []);

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
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            title="Şifre Değiştir"
            onClick={() => {
              setSelectedUserId(record.id);
              setPasswordModalVisible(true);
              setNewPassword('');
              setGeneratedPassword(null);
            }}
          />
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
      // camelCase'den snake_case'e dönüştür
      const transformedValues = {
        email: values.email,
        password: values.password,
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
        role: values.role,
        organization_id: values.organizationId,
        status: values.status,
      };

      if (editingUser) {
        // Güncelle
        const result = await updateUser(editingUser.id, transformedValues);
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
      const result = await createUser(transformedValues);
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
        initialValues={editingUser ? {
          email: editingUser.email,
          firstName: editingUser.first_name,
          lastName: editingUser.last_name,
          phone: editingUser.phone,
          role: editingUser.role,
          organizationId: editingUser.organization_id,
          status: editingUser.status,
        } : {}}
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
          name="organizationId"
          label="Organizasyon"
          rules={[{ required: true, message: 'Organizasyon seçiniz' }]}
          options={organizations.map(org => ({
            value: org.id,
            label: `${org.name} (${org.slug})`,
          }))}
          showSearch
          placeholder="Organizasyon seçin"
        />
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

      {/* Şifre Değiştirme Modal */}
      <Modal
        title="Şifre Değiştir"
        open={passwordModalVisible}
        onOk={generatedPassword ? () => {
          setPasswordModalVisible(false);
          setNewPassword('');
          setSelectedUserId(null);
          setGeneratedPassword(null);
        } : handlePasswordChange}
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

export default UsersPage;
