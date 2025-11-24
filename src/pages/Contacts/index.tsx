import { PlusOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined, EditOutlined, FileExcelOutlined, InboxOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Button, Space, Tag, message, Popconfirm, Input, Form, Divider, Modal, Upload, Table, Alert, Progress } from 'antd';
import React, { useRef, useState } from 'react';
import { getContacts, createContact, updateContact, deleteContact, bulkDeleteContacts, exportContactsToExcel, importContactsFromExcel, downloadExcelTemplate, getContactSentEmails } from '@/services/contacts';
import type { Contact } from '@/types/contact';
import CustomFieldsEditor from '@/components/CustomFieldsEditor';

const Contacts: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Sent emails modal
  const [sentEmailsModalVisible, setSentEmailsModalVisible] = useState(false);
  const [selectedContactForEmails, setSelectedContactForEmails] = useState<Contact | null>(null);
  
  // Excel import/export states
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<Contact[]>([]);
  const [importResult, setImportResult] = useState<{
    imported: number;
    failed: number;
    errors: Array<{ row: number; email: string; error: string }>;
  } | null>(null);

  const columns: ProColumns<Contact>[] = [
    {
      title: 'Email',
      dataIndex: 'email',
      copyable: true,
      ellipsis: true,
      width: 250,
    },
    {
      title: 'Ad',
      dataIndex: 'first_name',
      width: 120,
      hideInSearch: true,
    },
    {
      title: 'Soyad',
      dataIndex: 'last_name',
      width: 120,
      hideInSearch: true,
    },
    {
      title: 'Şirket',
      dataIndex: 'company',
      width: 150,
      hideInSearch: true,
    },
    {
      title: 'Pozisyon',
      dataIndex: 'position',
      width: 150,
      hideInSearch: true,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      width: 150,
      hideInSearch: true,
    },
    {
      title: 'Mobil Telefon',
      dataIndex: 'mobile_phone',
      width: 150,
      hideInSearch: true,
    },
    {
      title: 'Firma Ünvanı',
      dataIndex: 'company_title',
      width: 180,
      hideInSearch: true,
    },
    {
      title: 'Müşteri Temsilcisi',
      dataIndex: 'customer_representative',
      width: 180,
    },
    {
      title: 'Ülke',
      dataIndex: 'country',
      width: 120,
    },
    {
      title: 'İl',
      dataIndex: 'state',
      width: 120,
    },
    {
      title: 'İlçe',
      dataIndex: 'district',
      width: 120,
    },
    {
      title: 'Adres 1',
      dataIndex: 'address_1',
      width: 200,
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: 'Adres 2',
      dataIndex: 'address_2',
      width: 200,
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: 'Önem Derecesi',
      dataIndex: 'importance_level',
      width: 130,
      valueType: 'select',
      valueEnum: {
        1: { text: '1 - Düşük', status: 'Default' },
        2: { text: '2', status: 'Default' },
        3: { text: '3', status: 'Default' },
        4: { text: '4', status: 'Default' },
        5: { text: '5 - Orta', status: 'Processing' },
        6: { text: '6', status: 'Processing' },
        7: { text: '7', status: 'Processing' },
        8: { text: '8 - Yüksek', status: 'Warning' },
        9: { text: '9', status: 'Warning' },
        10: { text: '10 - Kritik', status: 'Error' },
      },
      render: (_: any, record: Contact) => {
        if (!record.importance_level) return '-';
        const colors = ['', 'default', 'default', 'blue', 'blue', 'cyan', 'cyan', 'orange', 'orange', 'red', 'red'];
        return <Tag color={colors[record.importance_level]}>{record.importance_level}</Tag>;
      },
    },
    {
      title: 'Not',
      dataIndex: 'notes',
      width: 200,
      hideInSearch: true,
      ellipsis: true,
    },
    {
      title: 'Etiketler',
      dataIndex: 'tags',
      render: (_, record) => (
        <>
          {record.tags?.map((tag: string) => (
            <Tag key={tag} color="blue">
              {tag}
            </Tag>
          ))}
        </>
      ),
      width: 200,
      fieldProps: {
        placeholder: 'Etiket ara (virgülle ayırın)',
      },
    },
    {
      title: 'Özel Alanlar',
      dataIndex: 'custom_fields',
      render: (_: any, record: Contact) => {
        const fields = record.custom_fields;
        if (!fields || Object.keys(fields).length === 0) {
          return <span style={{ color: '#999' }}>-</span>;
        }
        return (
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            {Object.entries(fields).slice(0, 3).map(([key, value]) => (
              <Space key={key} size={4} style={{ width: '100%' }}>
                <Tag 
                  color="blue" 
                  style={{ 
                    minWidth: 70,
                    textAlign: 'center',
                    fontWeight: 500,
                    margin: 0
                  }}
                >
                  {key}
                </Tag>
                <Tag 
                  color="green"
                  style={{ 
                    flex: 1,
                    margin: 0
                  }}
                >
                  {String(value)}
                </Tag>
              </Space>
            ))}
            {Object.keys(fields).length > 3 && (
              <Tag color="default" style={{ fontSize: 11 }}>
                +{Object.keys(fields).length - 3} alan daha
              </Tag>
            )}
          </Space>
        );
      },
      width: 250,
      fieldProps: {
        placeholder: 'Özel alan değeri ara (örn: İstanbul)',
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        active: { text: 'Aktif', status: 'Success' },
        unsubscribed: { text: 'Abonelikten Çıktı', status: 'Default' },
        bounced: { text: 'Geri Döndü', status: 'Error' },
        complained: { text: 'Şikayet', status: 'Warning' },
      },
      width: 120,
    },
    {
      title: 'Abonelik',
      dataIndex: 'subscription_status',
      valueType: 'select',
      valueEnum: {
        subscribed: { text: 'Abone', status: 'Success' },
        unsubscribed: { text: 'Değil', status: 'Default' },
        pending: { text: 'Beklemede', status: 'Processing' },
      },
      width: 120,
    },
    {
      title: 'Gönderilen',
      dataIndex: 'total_emails_sent',
      width: 100,
      sorter: true,
      hideInSearch: true,
      render: (_: any, record: Contact) => (
        <a
          onClick={() => {
            setSelectedContactForEmails(record);
            setSentEmailsModalVisible(true);
          }}
          style={{ color: record.total_emails_sent > 0 ? '#1890ff' : '#999' }}
        >
          {record.total_emails_sent || 0}
        </a>
      ),
    },
    {
      title: 'Kayıt Tarihi',
      dataIndex: 'created_at',
      valueType: 'date',
      width: 120,
      sorter: true,
      hideInSearch: true,
    },
    {
      title: 'İşlemler',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Contact) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentContact(record);
            setCustomFields(record.custom_fields || {});
            setEditModalVisible(true);
          }}
        >
          <EditOutlined /> Düzenle
        </a>,
        <Popconfirm
          key="delete"
          title="Müşteriyi silmek istediğinize emin misiniz?"
          onConfirm={async () => {
            try {
              await deleteContact(record.id);
              message.success('Müşteri başarıyla silindi');
              actionRef.current?.reload();
            } catch (error) {
              message.error('Silme işlemi başarısız');
            }
          }}
        >
          <a style={{ color: 'red' }}>
            <DeleteOutlined /> Sil
          </a>
        </Popconfirm>,
      ],
    },
  ];

  const handleCreateContact = async (values: any) => {
    try {
      await createContact({
        ...values,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
        custom_fields: customFields,
      });
      message.success('Müşteri başarıyla eklendi');
      setCreateModalVisible(false);
      setCustomFields({});
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error('Müşteri eklenirken hata oluştu');
      return false;
    }
  };

  const handleUpdateContact = async (values: any) => {
    if (!currentContact) return false;
    try {
      await updateContact(currentContact.id, {
        ...values,
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
        custom_fields: customFields,
      });
      message.success('Müşteri başarıyla güncellendi');
      setEditModalVisible(false);
      setCurrentContact(null);
      setCustomFields({});
      actionRef.current?.reload();
      return true;
    } catch (error) {
      message.error('Güncelleme sırasında hata oluştu');
      return false;
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Lütfen silmek için en az bir kişi seçin');
      return;
    }

    try {
      await bulkDeleteContacts(selectedRowKeys.map(key => Number(key)));
      message.success(`${selectedRowKeys.length} kişi başarıyla silindi`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
    } catch (error) {
      message.error('Silme işlemi sırasında hata oluştu');
    }
  };

  // Excel şablon indir
  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate();
      message.success('Excel şablonu indirildi');
    } catch (error) {
      message.error('Şablon indirilemedi');
    }
  };

  // Excel export
  const handleExportExcel = async () => {
    try {
      const params = actionRef.current?.pageInfo || {};
      const result = await exportContactsToExcel(params as any);
      message.success(`${result.count} kişi Excel'e aktarıldı`);
    } catch (error) {
      message.error('Excel\'e aktarma başarısız oldu');
    }
  };

  // Excel import - dosya seçimi
  const handleFileChange = (info: any) => {
    const file = info.file.originFileObj || info.file;
    if (file) {
      setImportFile(file);
      setImportResult(null);
      setImportPreview([]);
    }
  };

  // Excel import - işlemi başlat
  const handleImportExcel = async () => {
    if (!importFile) {
      message.warning('Lütfen bir Excel dosyası seçin');
      return;
    }

    setImportLoading(true);
    try {
      const result = await importContactsFromExcel(importFile);
      setImportResult({
        imported: result.imported,
        failed: result.failed,
        errors: result.errors,
      });
      setImportPreview(result.preview);
      
      if (result.imported > 0) {
        message.success(`${result.imported} kişi başarıyla içe aktarıldı`);
        actionRef.current?.reload();
      }
      
      if (result.failed > 0) {
        message.warning(`${result.failed} kişi içe aktarılamadı`);
      }
    } catch (error: any) {
      message.error(error.message || 'İçe aktarma başarısız oldu');
    } finally {
      setImportLoading(false);
    }
  };

  // Import modalını kapat
  const handleCloseImportModal = () => {
    setImportModalVisible(false);
    setImportFile(null);
    setImportResult(null);
    setImportPreview([]);
  };


  return (
    <PageContainer
      header={{
        title: 'Kişiler',
        subTitle: 'Email kişi listenizi yönetin',
      }}
    >
      <ProTable<Contact>
        headerTitle="Kişi Listesi"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          selectedRowKeys.length > 0 && (
            <Popconfirm
              key="delete"
              title={`${selectedRowKeys.length} kişiyi silmek istediğinize emin misiniz?`}
              description="Bu işlem geri alınamaz!"
              onConfirm={handleBulkDelete}
              okText="Evet, Sil"
              cancelText="İptal"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
              >
                Seçilileri Sil ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
          ),
          <Button
            key="template"
            icon={<FileExcelOutlined />}
            onClick={handleDownloadTemplate}
          >
            Şablon İndir
          </Button>,
          <Button
            key="import"
            icon={<UploadOutlined />}
            onClick={() => setImportModalVisible(true)}
          >
            Excel Yükle
          </Button>,
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
          >
            Excel İndir
          </Button>,
          <Button
            key="primary"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Kişi Ekle
          </Button>,
        ]}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        form={{
          onFinish: async () => {
            // Enter tuşuna basıldığında reload tetikle
            actionRef.current?.reload();
          },
        }}
        request={async (params, sort, filter) => {
          try {
            console.log('ProTable Params:', params); // Debug
            console.log('Sort:', sort); // Debug
            console.log('Filter:', filter); // Debug
            
            const response = await getContacts({
              page: params.current,
              pageSize: params.pageSize,
              email: params.email,
              status: params.status,
              subscription_status: params.subscription_status,
              tags: params.tags,
              custom_fields: params.custom_fields,
              search: params.keyword,
              customer_representative: params.customer_representative,
              country: params.country,
              state: params.state,
              district: params.district,
              importance_level: params.importance_level,
            });

            console.log('API Response:', response); // Debug

            return {
              data: response.data,
              success: response.success,
              total: response.total,
            };
          } catch (error) {
            console.error('API Error:', error); // Debug
            message.error('Müşteriler yüklenirken hata oluştu');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        scroll={{ x: 'max-content' }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* Yeni Müşteri Modal */}
      <ModalForm
        title="Yeni Müşteri Ekle"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreateContact}
        width={600}
      >
        <ProFormText
          name="email"
          label="Email"
          placeholder="ornek@email.com"
          rules={[
            { required: true, message: 'Email zorunludur' },
            { type: 'email', message: 'Geçerli bir email adresi girin' },
          ]}
        />
        <ProFormText name="first_name" label="Ad" placeholder="Ad" />
        <ProFormText name="last_name" label="Soyad" placeholder="Soyad" />
        <ProFormText name="phone" label="Telefon" placeholder="+90 5XX XXX XX XX" />
        <ProFormText name="mobile_phone" label="Mobil Telefon" placeholder="+90 5XX XXX XX XX" />
        <ProFormText name="company" label="Şirket" placeholder="Şirket adı" />
        <ProFormText name="company_title" label="Firma Ünvanı" placeholder="Firma ünvanı" />
        <ProFormText name="position" label="Pozisyon" placeholder="Görev unvanı" />
        <ProFormText name="customer_representative" label="Müşteri Temsilcisi" placeholder="Temsilci adı" />
        <ProFormText name="country" label="Ülke" placeholder="Türkiye" />
        <ProFormText name="state" label="İl" placeholder="İstanbul" />
        <ProFormText name="district" label="İlçe" placeholder="Kadıköy" />
        <ProFormText name="address_1" label="Adres 1" placeholder="Birinci adres satırı" />
        <ProFormText name="address_2" label="Adres 2" placeholder="İkinci adres satırı" />
        <ProFormSelect
          name="importance_level"
          label="Önem Derecesi"
          options={[
            { label: '1 - Düşük', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
            { label: '4', value: 4 },
            { label: '5 - Orta', value: 5 },
            { label: '6', value: 6 },
            { label: '7', value: 7 },
            { label: '8 - Yüksek', value: 8 },
            { label: '9', value: 9 },
            { label: '10 - Kritik', value: 10 },
          ]}
          placeholder="Önem derecesi seçin"
        />
        <ProFormTextArea
          name="notes"
          label="Notlar"
          placeholder="Müşteri hakkında notlar"
          fieldProps={{
            rows: 3,
          }}
        />
        <ProFormSelect
          name="status"
          label="Durum"
          options={[
            { label: 'Aktif', value: 'active' },
            { label: 'Abonelikten Çıktı', value: 'unsubscribed' },
            { label: 'Geri Döndü', value: 'bounced' },
            { label: 'Şikayet', value: 'complained' },
          ]}
          initialValue="active"
        />
        <ProFormSelect
          name="subscription_status"
          label="Abonelik Durumu"
          options={[
            { label: 'Abone', value: 'subscribed' },
            { label: 'Değil', value: 'unsubscribed' },
            { label: 'Beklemede', value: 'pending' },
          ]}
          initialValue="subscribed"
        />
        <ProFormText
          name="source"
          label="Kaynak"
          placeholder="Müşteri kaynağı (örn: website, manuel, import)"
        />
        <ProFormTextArea
          name="tags"
          label="Etiketler"
          placeholder="Virgülle ayırarak etiketler girin (örn: VIP, Yeni, Aktif)"
          fieldProps={{
            rows: 2,
          }}
        />
        
        <Divider>Özel Alanlar</Divider>
        <Form.Item label="Özel Alanlar" tooltip="Müşteriye özel bilgiler ekleyebilirsiniz">
          <CustomFieldsEditor value={customFields} onChange={setCustomFields} />
        </Form.Item>
      </ModalForm>

      {/* Müşteri Düzenleme Modal */}
      <ModalForm
        title="Müşteri Düzenle"
        open={editModalVisible}
        onOpenChange={(visible) => {
          setEditModalVisible(visible);
          if (!visible) setCurrentContact(null);
        }}
        onFinish={handleUpdateContact}
        width={600}
        initialValues={{
          email: currentContact?.email,
          first_name: currentContact?.first_name,
          last_name: currentContact?.last_name,
          phone: currentContact?.phone,
          mobile_phone: currentContact?.mobile_phone,
          company: currentContact?.company,
          company_title: currentContact?.company_title,
          position: currentContact?.position,
          customer_representative: currentContact?.customer_representative,
          country: currentContact?.country,
          state: currentContact?.state,
          district: currentContact?.district,
          address_1: currentContact?.address_1,
          address_2: currentContact?.address_2,
          importance_level: currentContact?.importance_level,
          notes: currentContact?.notes,
          status: currentContact?.status,
          subscription_status: currentContact?.subscription_status,
          source: currentContact?.source,
          tags: currentContact?.tags?.join(', '),
        }}
      >
        <ProFormText
          name="email"
          label="Email"
          placeholder="ornek@email.com"
          rules={[
            { required: true, message: 'Email zorunludur' },
            { type: 'email', message: 'Geçerli bir email adresi girin' },
          ]}
        />
        <ProFormText name="first_name" label="Ad" placeholder="Ad" />
        <ProFormText name="last_name" label="Soyad" placeholder="Soyad" />
        <ProFormText name="phone" label="Telefon" placeholder="+90 5XX XXX XX XX" />
        <ProFormText name="mobile_phone" label="Mobil Telefon" placeholder="+90 5XX XXX XX XX" />
        <ProFormText name="company" label="Şirket" placeholder="Şirket adı" />
        <ProFormText name="company_title" label="Firma Ünvanı" placeholder="Firma ünvanı" />
        <ProFormText name="position" label="Pozisyon" placeholder="Görev unvanı" />
        <ProFormText name="customer_representative" label="Müşteri Temsilcisi" placeholder="Temsilci adı" />
        <ProFormText name="country" label="Ülke" placeholder="Türkiye" />
        <ProFormText name="state" label="İl" placeholder="İstanbul" />
        <ProFormText name="district" label="İlçe" placeholder="Kadıköy" />
        <ProFormText name="address_1" label="Adres 1" placeholder="Birinci adres satırı" />
        <ProFormText name="address_2" label="Adres 2" placeholder="İkinci adres satırı" />
        <ProFormSelect
          name="importance_level"
          label="Önem Derecesi"
          options={[
            { label: '1 - Düşük', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
            { label: '4', value: 4 },
            { label: '5 - Orta', value: 5 },
            { label: '6', value: 6 },
            { label: '7', value: 7 },
            { label: '8 - Yüksek', value: 8 },
            { label: '9', value: 9 },
            { label: '10 - Kritik', value: 10 },
          ]}
          placeholder="Önem derecesi seçin"
        />
        <ProFormTextArea
          name="notes"
          label="Notlar"
          placeholder="Müşteri hakkında notlar"
          fieldProps={{
            rows: 3,
          }}
        />
        <ProFormSelect
          name="status"
          label="Durum"
          options={[
            { label: 'Aktif', value: 'active' },
            { label: 'Abonelikten Çıktı', value: 'unsubscribed' },
            { label: 'Geri Döndü', value: 'bounced' },
            { label: 'Şikayet', value: 'complained' },
          ]}
        />
        <ProFormSelect
          name="subscription_status"
          label="Abonelik Durumu"
          options={[
            { label: 'Abone', value: 'subscribed' },
            { label: 'Değil', value: 'unsubscribed' },
            { label: 'Beklemede', value: 'pending' },
          ]}
        />
        <ProFormText
          name="source"
          label="Kaynak"
          placeholder="Müşteri kaynağı (örn: website, manuel, import)"
        />
        <ProFormTextArea
          name="tags"
          label="Etiketler"
          placeholder="Virgülle ayırarak etiketler girin (örn: VIP, Yeni, Aktif)"
          fieldProps={{
            rows: 2,
          }}
        />
        
        <Divider>Özel Alanlar</Divider>
        <Form.Item label="Özel Alanlar" tooltip="Müşteriye özel bilgiler ekleyebilirsiniz">
          <CustomFieldsEditor value={customFields} onChange={setCustomFields} />
        </Form.Item>
      </ModalForm>

      {/* Excel Import Modal */}
      <Modal
        title="Excel İle Kişi Ekle"
        open={importModalVisible}
        onCancel={handleCloseImportModal}
        width={900}
        footer={[
          <Button key="close" onClick={handleCloseImportModal}>
            Kapat
          </Button>,
          !importResult && (
            <Button
              key="import"
              type="primary"
              loading={importLoading}
              disabled={!importFile}
              onClick={handleImportExcel}
            >
              İçe Aktar
            </Button>
          ),
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {!importResult && (
            <>
              <Alert
                message="Excel Dosyası Yükleme"
                description={
                  <div>
                    <p>✨ <strong>Özel Alanlar ve Etiketler için Kolay Format:</strong></p>
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      <li><strong>Etiketler:</strong> "tags" kolonunda virgülle ayırın (örn: vip,teknoloji,istanbul)</li>
                      <li><strong>Özel Alanlar:</strong> "custom_field_1_name" ve "custom_field_1_value" şeklinde kullanın</li>
                      <li>Örnek: custom_field_1_name: "Şehir", custom_field_1_value: "İstanbul"</li>
                      <li>İstediğiniz kadar özel alan ekleyebilirsiniz (custom_field_2, custom_field_3...)</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Upload.Dragger
                name="file"
                accept=".xlsx,.xls"
                beforeUpload={() => false}
                onChange={handleFileChange}
                maxCount={1}
                showUploadList={true}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                </p>
                <p className="ant-upload-text">
                  Excel dosyasını sürükleyip bırakın veya tıklayarak seçin
                </p>
                <p className="ant-upload-hint">
                  Sadece .xlsx ve .xls dosyaları desteklenir
                </p>
              </Upload.Dragger>

              {importFile && (
                <Alert
                  message={`Dosya seçildi: ${importFile.name}`}
                  type="success"
                  showIcon
                />
              )}
            </>
          )}

          {importLoading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Progress type="circle" percent={50} status="active" />
              <p style={{ marginTop: 16 }}>Kişiler içe aktarılıyor...</p>
            </div>
          )}

          {importResult && (
            <>
              <Alert
                message="İçe Aktarma Tamamlandı"
                description={
                  <div>
                    <p><strong>Başarılı:</strong> {importResult.imported} kişi</p>
                    {importResult.failed > 0 && (
                      <p style={{ color: '#ff4d4f' }}><strong>Başarısız:</strong> {importResult.failed} kişi</p>
                    )}
                  </div>
                }
                type={importResult.failed > 0 ? 'warning' : 'success'}
                showIcon
              />

              {importPreview.length > 0 && (
                <div>
                  <h4>İlk 5 Kayıt Önizlemesi:</h4>
                  <Table
                    dataSource={importPreview}
                    size="small"
                    pagination={false}
                    scroll={{ x: 600 }}
                    columns={[
                      { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
                      { title: 'Ad', dataIndex: 'first_name', key: 'first_name', width: 100 },
                      { title: 'Soyad', dataIndex: 'last_name', key: 'last_name', width: 100 },
                      { title: 'Şirket', dataIndex: 'company', key: 'company', width: 150 },
                      {
                        title: 'Etiketler',
                        dataIndex: 'tags',
                        key: 'tags',
                        render: (tags: string[]) => (
                          <Space size={[0, 4]} wrap>
                            {tags?.map((tag, idx) => (
                              <Tag key={idx} color="blue" style={{ fontSize: 11 }}>
                                {tag}
                              </Tag>
                            ))}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div>
                  <h4 style={{ color: '#ff4d4f' }}>Hatalar ({importResult.errors.length}):</h4>
                  <Table
                    dataSource={importResult.errors}
                    size="small"
                    pagination={{ pageSize: 5 }}
                    columns={[
                      { title: 'Satır', dataIndex: 'row', key: 'row', width: 60 },
                      { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
                      { title: 'Hata', dataIndex: 'error', key: 'error' },
                    ]}
                  />
                </div>
              )}
            </>
          )}
        </Space>
      </Modal>

      {/* Gönderilen Emailler Modal */}
      <SentEmailsModal
        visible={sentEmailsModalVisible}
        contact={selectedContactForEmails}
        onClose={() => {
          setSentEmailsModalVisible(false);
          setSelectedContactForEmails(null);
        }}
      />
    </PageContainer>
  );
};

// Gönderilen Emailler Modal Component
const SentEmailsModal: React.FC<{
  visible: boolean;
  contact: Contact | null;
  onClose: () => void;
}> = ({ visible, contact, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const loadEmails = async (page = 1, pageSize = 10) => {
    if (!contact) return;
    
    try {
      setLoading(true);
      const response = await getContactSentEmails(contact.id, { page, pageSize });
      if (response.success) {
        setEmails(response.data);
        setPagination({
          page: response.pagination.page,
          pageSize: response.pagination.pageSize,
          total: response.pagination.total,
        });
      }
    } catch (error) {
      message.error('Emailler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (visible && contact) {
      loadEmails();
    }
  }, [visible, contact]);

  const emailColumns: ProColumns<any>[] = [
    {
      title: 'Kampanya',
      dataIndex: 'campaign_name',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <strong>{record.campaign_name}</strong>
          <Tag color={record.campaign_status === 'active' ? 'green' : 'default'} style={{ fontSize: 11 }}>
            {record.campaign_status}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Şablon',
      dataIndex: 'template_name',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>{record.template_name}</span>
          <Tag color="blue" style={{ fontSize: 11 }}>#{record.sequence_index + 1}</Tag>
        </Space>
      ),
    },
    {
      title: 'Konu',
      dataIndex: 'rendered_subject',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Durum',
      key: 'status',
      width: 120,
      render: (_, record) => {
        if (record.is_failed) return <Tag color="red">❌ Başarısız</Tag>;
        if (record.is_replied) return <Tag color="purple">💬 Yanıtlandı</Tag>;
        if (record.is_clicked) return <Tag color="orange">🖱️ Tıklandı</Tag>;
        if (record.is_opened) return <Tag color="blue">👁️ Açıldı</Tag>;
        if (record.is_sent) return <Tag color="green">✅ Gönderildi</Tag>;
        return <Tag color="default">📅 Planlandı</Tag>;
      },
    },
    {
      title: 'Gönderim Tarihi',
      dataIndex: 'sent_date',
      width: 150,
      render: (_: any, record: any) => record.sent_date ? new Date(record.sent_date).toLocaleString('tr-TR') : '-',
    },
    {
      title: 'Açılma',
      dataIndex: 'opened_at',
      width: 150,
      render: (_: any, record: any) => record.opened_at ? new Date(record.opened_at).toLocaleString('tr-TR') : '-',
    },
    {
      title: 'İşlem',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedEmail(record);
            setPreviewVisible(true);
          }}
        >
          Önizle
        </Button>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={
          <Space>
            <span>📧 Gönderilen Emailler</span>
            {contact && (
              <Tag color="blue">
                {contact.first_name} {contact.last_name} ({contact.email})
              </Tag>
            )}
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={1200}
        footer={[
          <Button key="close" onClick={onClose}>
            Kapat
          </Button>,
        ]}
      >
        <ProTable
          columns={emailColumns}
          dataSource={emails}
          loading={loading}
          rowKey="id"
          search={false}
          options={false}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => loadEmails(page, pageSize),
            showSizeChanger: true,
            showTotal: (total) => `Toplam ${total} email`,
          }}
        />
      </Modal>

      {/* Email Önizleme Modal */}
      <Modal
        title={selectedEmail?.rendered_subject}
        open={previewVisible}
        onCancel={() => {
          setPreviewVisible(false);
          setSelectedEmail(null);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => {
            setPreviewVisible(false);
            setSelectedEmail(null);
          }}>
            Kapat
          </Button>,
        ]}
      >
        {selectedEmail && (
          <div>
            <Divider orientation="left">Bilgiler</Divider>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div><strong>Kampanya:</strong> {selectedEmail.campaign_name}</div>
              <div><strong>Şablon:</strong> {selectedEmail.template_name} (#{selectedEmail.sequence_index + 1})</div>
              <div><strong>Gönderim:</strong> {selectedEmail.sent_date ? new Date(selectedEmail.sent_date).toLocaleString('tr-TR') : 'Henüz gönderilmedi'}</div>
              {selectedEmail.is_failed && (
                <Alert
                  message="Gönderim Hatası"
                  description={selectedEmail.failure_reason}
                  type="error"
                  showIcon
                />
              )}
            </Space>
            
            <Divider orientation="left">Email İçeriği</Divider>
            <div 
              style={{ 
                border: '1px solid #d9d9d9', 
                padding: 16, 
                borderRadius: 4,
                maxHeight: '500px',
                overflow: 'auto',
                backgroundColor: '#fff'
              }}
              dangerouslySetInnerHTML={{ __html: selectedEmail.rendered_body_html }}
            />
          </div>
        )}
      </Modal>
    </>
  );
};


export default Contacts;
