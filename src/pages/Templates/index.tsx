import {
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Modal,
  message,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  bulkDeleteTemplates,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getTemplates,
  updateTemplate,
} from '@/services/templates';
import type { EmailTemplate } from '@/types/template';

const { confirm } = Modal;
const { Text } = Typography;

const Templates: React.FC = () => {
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<EmailTemplate>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const actionRef = useRef<ActionType>(null);

  // Bulk delete işlemi
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Lütfen silmek için en az bir şablon seçin');
      return;
    }

    confirm({
      title: 'Toplu Silme',
      content: `${selectedRowKeys.length} adet şablonu silmek istediğinize emin misiniz?`,
      okText: 'Sil',
      okType: 'danger',
      cancelText: 'İptal',
      onOk: async () => {
        try {
          await bulkDeleteTemplates(selectedRowKeys as number[]);
          message.success('Şablonlar başarıyla silindi');
          setSelectedRowKeys([]);
          actionRef.current?.reload();
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Silme işlemi başarısız oldu';
          message.error(errorMessage);
        }
      },
    });
  };

  // Tekil silme işlemi
  const handleDelete = async (id: number) => {
    confirm({
      title: 'Şablonu Sil',
      content: 'Bu şablonu silmek istediğinize emin misiniz?',
      okText: 'Sil',
      okType: 'danger',
      cancelText: 'İptal',
      onOk: async () => {
        try {
          await deleteTemplate(id);
          message.success('Şablon başarıyla silindi');
          actionRef.current?.reload();
        } catch (error: any) {
          const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            'Silme işlemi başarısız oldu';
          message.error(errorMessage);
        }
      },
    });
  };

  // Çoğaltma işlemi
  const handleDuplicate = async (id: number) => {
    try {
      await duplicateTemplate(id);
      message.success('Şablon başarıyla çoğaltıldı');
      actionRef.current?.reload();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Çoğaltma işlemi başarısız oldu';
      message.error(errorMessage);
    }
  };

  // Önizleme
  const handlePreview = (record: EmailTemplate) => {
    setCurrentRow(record);
    setPreviewModalOpen(true);
  };

  const columns: ProColumns<EmailTemplate>[] = [
    {
      title: 'Şablon Adı',
      dataIndex: 'name',
      width: 200,
      fixed: 'left',
      render: (_, record) => (
        <Space>
          <a
            onClick={() => {
              setCurrentRow(record);
              setUpdateModalOpen(true);
            }}
          >
            {record.name}
          </a>
          {record.is_default && <Tag color="blue">Varsayılan</Tag>}
        </Space>
      ),
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      width: 120,
      valueType: 'select',
      valueEnum: {
        newsletter: { text: 'Bülten', status: 'Default' },
        promotional: { text: 'Promosyon', status: 'Processing' },
        transactional: { text: 'İşlemsel', status: 'Success' },
        welcome: { text: 'Hoş Geldin', status: 'Warning' },
        announcement: { text: 'Duyuru', status: 'Error' },
        'follow-up': { text: 'Takip', status: 'Default' },
        reminder: { text: 'Hatırlatma', status: 'Default' },
        other: { text: 'Diğer', status: 'Default' },
      },
    },
    {
      title: 'Konu',
      dataIndex: 'subject',
      width: 250,
      ellipsis: true,
      search: false,
    },
    {
      title: 'Gönderen',
      dataIndex: 'from_name',
      width: 150,
      search: false,
      render: (_, record) => (
        <Tooltip title={record.from_email}>{record.from_name}</Tooltip>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        draft: { text: 'Taslak', status: 'Default' },
        active: { text: 'Aktif', status: 'Success' },
        archived: { text: 'Arşiv', status: 'Error' },
      },
    },
    {
      title: 'Takip',
      dataIndex: 'tracking',
      width: 120,
      search: false,
      render: (_, record) => (
        <Space>
          {record.track_opens && <Tag color="green">Açılma</Tag>}
          {record.track_clicks && <Tag color="blue">Tıklama</Tag>}
        </Space>
      ),
    },
    {
      title: 'Etiketler',
      dataIndex: 'tags',
      width: 200,
      search: false,
      render: (_, record) => (
        <>
          {record.tags?.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: 'Kullanım',
      dataIndex: 'usage_count',
      width: 100,
      search: false,
      sorter: true,
    },
    {
      title: 'Oluşturulma',
      dataIndex: 'created_at',
      valueType: 'dateTime',
      width: 160,
      search: false,
      sorter: true,
    },
    {
      title: 'İşlemler',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <a key="preview" onClick={() => handlePreview(record)}>
          <EyeOutlined /> Önizle
        </a>,
        <a
          key="edit"
          onClick={() => {
            setCurrentRow(record);
            setUpdateModalOpen(true);
          }}
        >
          Düzenle
        </a>,
        <a key="duplicate" onClick={() => handleDuplicate(record.id)}>
          <CopyOutlined /> Çoğalt
        </a>,
        <a
          key="delete"
          onClick={() => handleDelete(record.id)}
          style={{ color: 'red' }}
        >
          Sil
        </a>,
      ],
    },
  ];

  return (
    <>
      <ProTable<EmailTemplate>
        headerTitle="Email Şablonları"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        scroll={{ x: 1400 }}
        toolBarRender={() => [
          selectedRowKeys.length > 0 && (
            <Button
              key="bulkDelete"
              danger
              onClick={handleBulkDelete}
              icon={<DeleteOutlined />}
            >
              Toplu Sil ({selectedRowKeys.length})
            </Button>
          ),
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalOpen(true);
            }}
            icon={<PlusOutlined />}
          >
            Yeni Şablon
          </Button>,
        ]}
        request={async (params, sort) => {
          const response = await getTemplates({
            page: params.current || 1,
            limit: params.pageSize || 10,
            name: params.name,
            category: params.category,
            status: params.status,
            tags: params.tags,
            search: params.search,
            sort_by: Object.keys(sort || {})[0],
            sort_order:
              Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
          });
          return {
            data: response.data,
            success: true,
            total: response.pagination.total,
          };
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
      />

      {/* Yeni Şablon Oluşturma Modal */}
      <ModalForm
        title="Yeni Email Şablonu"
        width={800}
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={async (values) => {
          try {
            // Tags string'i array'e çevir
            if (values.tags && typeof values.tags === 'string') {
              values.tags = values.tags.split(',').map((t: string) => t.trim());
            }
            await createTemplate(values);
            message.success('Şablon başarıyla oluşturuldu');
            setCreateModalOpen(false);
            actionRef.current?.reload();
            return true;
          } catch (_error) {
            message.error('Oluşturma işlemi başarısız oldu');
            return false;
          }
        }}
      >
        <ProFormText
          name="name"
          label="Şablon Adı"
          rules={[{ required: true, message: 'Lütfen şablon adı girin' }]}
          placeholder="Örn: Hoş Geldiniz Email"
        />
        <ProFormTextArea
          name="description"
          label="Açıklama"
          placeholder="Şablon açıklaması..."
        />

        {/* Değişken Kullanım Rehberi */}
        <Alert
          message={
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>
                <InfoCircleOutlined /> Kişiselleştirme Değişkenleri
              </Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Email konusu ve içeriğinde kişiye özel bilgiler
                kullanabilirsiniz. Değişkenler hem {'{field}'} hem de{' '}
                {'{{field}}'} formatında kullanılabilir.
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  <strong>Standart Alanlar:</strong>
                  <br />
                  {'{{first_name}}'}, {'{{last_name}}'}, {'{{full_name}}'},{' '}
                  {'{{email}}'}, {'{{phone}}'}, {'{{mobile_phone}}'}
                  <br />
                  {'{{company}}'}, {'{{company_title}}'}, {'{{position}}'},{' '}
                  {'{{customer_representative}}'}
                  <br />
                  {'{{country}}'}, {'{{state}}'}, {'{{district}}'},{' '}
                  {'{{address_1}}'}, {'{{address_2}}'}
                  <br />
                  {'{{importance_level}}'}, {'{{notes}}'}, {'{{status}}'},{' '}
                  {'{{source}}'}
                </Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  <strong>Excel'den Gelen Özel Alanlar:</strong>
                  <br />
                  Excel'deki sütun başlıklarını aynen kullanabilirsiniz. Örnek:{' '}
                  {'{{Şehir}}'}, {'{{Bütçe}}'}, {'{{Sektör}}'}
                  <br />
                  <Text type="warning">
                    Not: Sütun adları büyük/küçük harf duyarlıdır, Excel'deki
                    başlıkla birebir aynı olmalıdır.
                  </Text>
                </Text>
              </div>
              <div
                style={{
                  marginTop: 8,
                  padding: '8px',
                  background: '#f5f5f5',
                  borderRadius: 4,
                }}
              >
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  <strong>Örnek Kullanım:</strong>
                  <br />
                  Konu: "Merhaba {'{{first_name}}'}, yeni fırsatlar sizi
                  bekliyor!"
                  <br />
                  İçerik: "Sayın {'{{full_name}}'}, {'{{company}}'} için özel
                  teklifimiz..."
                </Text>
              </div>
            </Space>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <ProFormSelect
          name="category"
          label="Kategori"
          rules={[{ required: true, message: 'Lütfen kategori seçin' }]}
          options={[
            { label: 'Bülten', value: 'newsletter' },
            { label: 'Promosyon', value: 'promotional' },
            { label: 'İşlemsel', value: 'transactional' },
            { label: 'Hoş Geldin', value: 'welcome' },
            { label: 'Duyuru', value: 'announcement' },
            { label: 'Takip', value: 'follow-up' },
            { label: 'Hatırlatma', value: 'reminder' },
            { label: 'Diğer', value: 'other' },
          ]}
        />
        <ProFormText
          name="subject"
          label="Email Konusu"
          rules={[{ required: true, message: 'Lütfen email konusu girin' }]}
          placeholder="Örn: Hoş Geldiniz {{first_name}}!"
        />
        <ProFormTextArea
          name="preheader"
          label="Preheader (Önizleme Metni)"
          placeholder="Inbox'ta gösterilecek kısa açıklama..."
        />
        <ProFormTextArea
          name="body_html"
          label="HTML İçerik"
          rules={[{ required: true, message: 'Lütfen HTML içerik girin' }]}
          fieldProps={{ rows: 8 }}
          placeholder="<html>...</html>"
        />
        <ProFormTextArea
          name="body_text"
          label="Plain Text İçerik"
          fieldProps={{ rows: 4 }}
          placeholder="HTML desteklemeyen emailler için alternatif metin..."
        />
        <ProFormText
          name="from_name"
          label="Gönderen Adı"
          placeholder="Örn: Email Otomasyon Platformu"
        />
        <ProFormText
          name="from_email"
          label="Gönderen Email"
          placeholder="Örn: noreply@platform.com"
        />
        <ProFormText
          name="reply_to"
          label="Yanıt Email"
          placeholder="Örn: destek@platform.com"
        />
        <ProFormSelect
          name="priority"
          label="Öncelik"
          options={[
            { label: 'Yüksek', value: 'high' },
            { label: 'Normal', value: 'normal' },
            { label: 'Düşük', value: 'low' },
          ]}
          initialValue="normal"
        />
        <ProFormSelect
          name="status"
          label="Durum"
          options={[
            { label: 'Taslak', value: 'draft' },
            { label: 'Aktif', value: 'active' },
            { label: 'Arşiv', value: 'archived' },
          ]}
          initialValue="draft"
        />
        <ProFormText
          name="tags"
          label="Etiketler"
          placeholder="virgülle ayırın: welcome, onboarding"
        />
      </ModalForm>

      {/* Düzenleme Modal */}
      <ModalForm
        title="Şablonu Düzenle"
        width={800}
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        initialValues={currentRow}
        onFinish={async (values) => {
          try {
            // Tags string'i array'e çevir
            if (values.tags && typeof values.tags === 'string') {
              values.tags = values.tags.split(',').map((t: string) => t.trim());
            }
            await updateTemplate(currentRow?.id, values);
            message.success('Şablon başarıyla güncellendi');
            setUpdateModalOpen(false);
            actionRef.current?.reload();
            return true;
          } catch (_error) {
            message.error('Güncelleme işlemi başarısız oldu');
            return false;
          }
        }}
      >
        <ProFormText
          name="name"
          label="Şablon Adı"
          rules={[{ required: true, message: 'Lütfen şablon adı girin' }]}
          placeholder="Örn: Hoş Geldiniz Email"
        />
        <ProFormTextArea
          name="description"
          label="Açıklama"
          placeholder="Şablon açıklaması..."
        />
        <ProFormSelect
          name="category"
          label="Kategori"
          rules={[{ required: true, message: 'Lütfen kategori seçin' }]}
          options={[
            { label: 'Bülten', value: 'newsletter' },
            { label: 'Promosyon', value: 'promotional' },
            { label: 'İşlemsel', value: 'transactional' },
            { label: 'Hoş Geldin', value: 'welcome' },
            { label: 'Duyuru', value: 'announcement' },
            { label: 'Takip', value: 'follow-up' },
            { label: 'Hatırlatma', value: 'reminder' },
            { label: 'Diğer', value: 'other' },
          ]}
        />
        <ProFormText
          name="subject"
          label="Email Konusu"
          rules={[{ required: true, message: 'Lütfen email konusu girin' }]}
          placeholder="Örn: Hoş Geldiniz {{first_name}}!"
        />
        <ProFormTextArea
          name="preheader"
          label="Preheader (Önizleme Metni)"
          placeholder="Inbox'ta gösterilecek kısa açıklama..."
        />
        <ProFormTextArea
          name="body_html"
          label="HTML İçerik"
          rules={[{ required: true, message: 'Lütfen HTML içerik girin' }]}
          fieldProps={{ rows: 8 }}
          placeholder="<html>...</html>"
        />
        <ProFormTextArea
          name="body_text"
          label="Plain Text İçerik"
          fieldProps={{ rows: 4 }}
          placeholder="HTML desteklemeyen emailler için alternatif metin..."
        />
        <ProFormText
          name="from_name"
          label="Gönderen Adı"
          placeholder="Örn: Email Otomasyon Platformu"
        />
        <ProFormText
          name="from_email"
          label="Gönderen Email"
          placeholder="Örn: noreply@platform.com"
        />
        <ProFormText
          name="reply_to"
          label="Yanıt Email"
          placeholder="Örn: destek@platform.com"
        />
        <ProFormSelect
          name="priority"
          label="Öncelik"
          options={[
            { label: 'Yüksek', value: 'high' },
            { label: 'Normal', value: 'normal' },
            { label: 'Düşük', value: 'low' },
          ]}
        />
        <ProFormSelect
          name="status"
          label="Durum"
          options={[
            { label: 'Taslak', value: 'draft' },
            { label: 'Aktif', value: 'active' },
            { label: 'Arşiv', value: 'archived' },
          ]}
        />
        <ProFormText
          name="tags"
          label="Etiketler"
          placeholder="virgülle ayırın: welcome, onboarding"
          fieldProps={{
            defaultValue: currentRow?.tags?.join(', '),
          }}
        />
      </ModalForm>

      {/* Önizleme Modal */}
      <Modal
        title={`Önizleme: ${currentRow?.name}`}
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        width={900}
        footer={null}
      >
        {currentRow && (
          <div>
            <div
              style={{
                marginBottom: 16,
                padding: 16,
                background: '#f5f5f5',
                borderRadius: 4,
              }}
            >
              <p>
                <strong>Konu:</strong> {currentRow.subject}
              </p>
              {currentRow.preheader && (
                <p>
                  <strong>Preheader:</strong> {currentRow.preheader}
                </p>
              )}
              <p>
                <strong>Gönderen:</strong> {currentRow.from_name} &lt;
                {currentRow.from_email}&gt;
              </p>
              {currentRow.reply_to && (
                <p>
                  <strong>Yanıt:</strong> {currentRow.reply_to}
                </p>
              )}
            </div>
            <div
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                padding: 16,
                background: '#fff',
                minHeight: 400,
                maxHeight: 600,
                overflow: 'auto',
              }}
              dangerouslySetInnerHTML={{ __html: currentRow.body_html }}
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default Templates;
