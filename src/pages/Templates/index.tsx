import {
  BellOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  GiftOutlined,
  HeartOutlined,
  Html5Outlined,
  InfoCircleOutlined,
  LoadingOutlined,
  MailOutlined,
  NotificationOutlined,
  PaperClipOutlined,
  PlusOutlined,
  SendOutlined,
  ShopOutlined,
  SoundOutlined,
  TeamOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { request, useModel } from '@umijs/max';
import {
  Alert,
  Button,
  Form,
  Modal,
  message,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import AttachmentUploader from '@/components/AttachmentUploader';
import EmailEditor from '@/components/EmailEditor';
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
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser as any;

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [previewModalOpen, setPreviewModalOpen] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<EmailTemplate>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [senderEmails, setSenderEmails] = useState<string[]>([]);
  const actionRef = useRef<ActionType>(null);

  // AI Generate States
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [createForm] = Form.useForm();

  // Sender email listesini yükle
  useEffect(() => {
    const loadSenderEmails = async () => {
      try {
        const response = await request('/api/users/me/sender-emails', {
          method: 'GET',
        });
        if (response.success && response.data) {
          setSenderEmails(response.data);
        }
      } catch (error) {
        console.error('Sender emails yüklenemedi:', error);
      }
    };
    loadSenderEmails();
  }, []);

  // AI ile şablon oluştur
  const handleAiGenerate = async (values: {
    purpose: string;
    email_type: string;
    format: 'html' | 'plain_text';
    language?: string;
  }) => {
    setAiGenerating(true);
    try {
      const response = await axios.post(
        'https://n8n-production-14b9.up.railway.app/webhook/ai-generate-template',
        {
          purpose: values.purpose,
          email_type: values.email_type,
          format: values.format,
          language: values.language || 'Turkish',
          organization_id:
            currentUser?.organizationId || currentUser?.organization_id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 saniye timeout (AI yanıtı uzun sürebilir)
        },
      );

      const responseData = response.data;

      // API array olarak dönüyor, ilk elemanı al
      const aiResponse = Array.isArray(responseData)
        ? responseData[0]
        : responseData;

      // AI yanıtını form alanlarına doldur
      if (aiResponse) {
        createForm.setFieldsValue({
          name: aiResponse.name || '',
          description: aiResponse.description || '',
          category: aiResponse.category || 'other',
          subject: aiResponse.subject || '',
          preheader: aiResponse.preheader || '',
          body_html: aiResponse.body_html || aiResponse.body || '',
          body_text: aiResponse.body_text || '',
          from_name: aiResponse.from_name || '',
          from_email: aiResponse.from_email || '',
          priority: aiResponse.priority || 'normal',
          status: aiResponse.status || 'draft',
          tags: aiResponse.tags
            ? Array.isArray(aiResponse.tags)
              ? aiResponse.tags.join(', ')
              : aiResponse.tags
            : '',
        });

        message.success(
          'AI şablon başarıyla oluşturuldu! Aşağıdaki alanları kontrol edip kaydedebilirsiniz.',
        );
      }
    } catch (error: any) {
      console.error('AI Generate Error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'AI şablon oluşturma başarısız oldu';
      message.error(errorMessage);
    } finally {
      setAiGenerating(false);
    }
  };

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
        onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) {
            setAiGenerating(false);
          }
        }}
        form={createForm}
        modalProps={{
          destroyOnClose: true,
          bodyStyle: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        onFinish={async (values) => {
          try {
            // Tags string'i array'e çevir
            if (values.tags && typeof values.tags === 'string') {
              values.tags = values.tags.split(',').map((t: string) => t.trim());
            }
            await createTemplate(values);
            message.success('Şablon başarıyla oluşturuldu');
            setCreateModalOpen(false);
            createForm.resetFields();
            actionRef.current?.reload();
            return true;
          } catch (_error) {
            message.error('Oluşturma işlemi başarısız oldu');
            return false;
          }
        }}
      >
        {/* AI ile Şablon Oluşturma Bölümü */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea08 0%, #764ba210 100%)',
            border: '1px solid #667eea30',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Dekoratif arka plan */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              background:
                'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
              borderRadius: '50%',
              filter: 'blur(40px)',
            }}
          />

          <Space
            direction="vertical"
            size={16}
            style={{ width: '100%', position: 'relative' }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingBottom: 12,
                borderBottom: '1px solid #667eea20',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background:
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                <ThunderboltOutlined style={{ fontSize: 20, color: '#fff' }} />
              </div>
              <div>
                <Text
                  strong
                  style={{ fontSize: 16, display: 'block', color: '#1a1a2e' }}
                >
                  AI ile Otomatik Oluştur
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Yapay zeka ile profesyonel email şablonu oluşturun
                </Text>
              </div>
            </div>

            {/* Form alanları */}
            <ProFormTextArea
              name="ai_purpose"
              label={
                <Text strong style={{ color: '#444' }}>
                  Email Amacı
                </Text>
              }
              placeholder="Örn: Yeni müşterilere hoş geldin mesajı göndermek istiyorum. Şirketimiz yazılım hizmetleri sunuyor..."
              fieldProps={{
                rows: 3,
                showCount: true,
                maxLength: 500,
                style: {
                  borderRadius: 8,
                  resize: 'none',
                },
              }}
            />

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <ProFormSelect
                  name="ai_email_type"
                  label={
                    <Text strong style={{ color: '#444' }}>
                      Email Türü
                    </Text>
                  }
                  options={[
                    {
                      label: (
                        <Space>
                          <SendOutlined style={{ color: '#667eea' }} /> Soğuk
                          Erişim
                        </Space>
                      ),
                      value: 'cold_outreach',
                    },
                    {
                      label: (
                        <Space>
                          <MailOutlined style={{ color: '#52c41a' }} /> Takip
                          Maili
                        </Space>
                      ),
                      value: 'follow_up',
                    },
                    {
                      label: (
                        <Space>
                          <HeartOutlined style={{ color: '#eb2f96' }} /> Hoş
                          Geldin
                        </Space>
                      ),
                      value: 'welcome',
                    },
                    {
                      label: (
                        <Space>
                          <NotificationOutlined style={{ color: '#1890ff' }} />{' '}
                          Bülten
                        </Space>
                      ),
                      value: 'newsletter',
                    },
                    {
                      label: (
                        <Space>
                          <GiftOutlined style={{ color: '#fa8c16' }} />{' '}
                          Promosyon
                        </Space>
                      ),
                      value: 'promotional',
                    },
                    {
                      label: (
                        <Space>
                          <BellOutlined style={{ color: '#faad14' }} />{' '}
                          Hatırlatma
                        </Space>
                      ),
                      value: 'reminder',
                    },
                    {
                      label: (
                        <Space>
                          <SoundOutlined style={{ color: '#13c2c2' }} /> Duyuru
                        </Space>
                      ),
                      value: 'announcement',
                    },
                    {
                      label: (
                        <Space>
                          <HeartOutlined style={{ color: '#f5222d' }} />{' '}
                          Teşekkür
                        </Space>
                      ),
                      value: 'thank_you',
                    },
                    {
                      label: (
                        <Space>
                          <ShopOutlined style={{ color: '#722ed1' }} /> B2B
                          Satış
                        </Space>
                      ),
                      value: 'b2b_sales',
                    },
                    {
                      label: (
                        <Space>
                          <TeamOutlined style={{ color: '#2f54eb' }} /> İş
                          Ortaklığı
                        </Space>
                      ),
                      value: 'partnership',
                    },
                  ]}
                  placeholder="Email türünü seçin"
                  fieldProps={{
                    style: { borderRadius: 8 },
                  }}
                />
              </div>

              <div style={{ minWidth: 140 }}>
                <ProFormSelect
                  name="ai_format"
                  label={
                    <Text strong style={{ color: '#444' }}>
                      Format
                    </Text>
                  }
                  options={[
                    {
                      label: (
                        <Space>
                          <Html5Outlined style={{ color: '#e34c26' }} /> HTML
                        </Space>
                      ),
                      value: 'html',
                    },
                    {
                      label: (
                        <Space>
                          <FileTextOutlined style={{ color: '#666' }} /> Düz
                          Metin
                        </Space>
                      ),
                      value: 'plain_text',
                    },
                  ]}
                  initialValue="html"
                  fieldProps={{
                    style: { borderRadius: 8 },
                  }}
                />
              </div>

              <div style={{ minWidth: 140 }}>
                <ProFormSelect
                  name="ai_language"
                  label={
                    <Text strong style={{ color: '#444' }}>
                      Dil
                    </Text>
                  }
                  options={[
                    { label: '🇹🇷 Türkçe', value: 'Turkish' },
                    { label: '🇬🇧 İngilizce', value: 'English' },
                    { label: '🇩🇪 Almanca', value: 'German' },
                    { label: '🇫🇷 Fransızca', value: 'French' },
                    { label: '🇪🇸 İspanyolca', value: 'Spanish' },
                    { label: '🇷🇺 Rusça', value: 'Russian' },
                    { label: '🇸🇦 Arapça', value: 'Arabic' },
                    { label: '🇨🇳 Çince', value: 'Chinese' },
                  ]}
                  initialValue="Turkish"
                  fieldProps={{
                    style: { borderRadius: 8 },
                  }}
                />
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              icon={
                aiGenerating ? (
                  <LoadingOutlined spin />
                ) : (
                  <ThunderboltOutlined />
                )
              }
              loading={aiGenerating}
              disabled={aiGenerating}
              onClick={async () => {
                const values = createForm.getFieldsValue([
                  'ai_purpose',
                  'ai_email_type',
                  'ai_format',
                  'ai_language',
                ]);
                if (!values.ai_purpose || !values.ai_email_type) {
                  message.warning('Lütfen email amacını ve türünü girin');
                  return;
                }
                await handleAiGenerate({
                  purpose: values.ai_purpose,
                  email_type: values.ai_email_type,
                  format: values.ai_format || 'html',
                  language: values.ai_language || 'Turkish',
                });
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderColor: 'transparent',
                width: '100%',
                height: 44,
                borderRadius: 8,
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
              }}
            >
              {aiGenerating ? 'AI Oluşturuyor...' : 'AI ile Şablonu Oluştur'}
            </Button>
          </Space>
        </div>

        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            paddingTop: 16,
            marginBottom: 16,
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Veya aşağıdaki alanları manuel olarak doldurun:
          </Text>
        </div>

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
            { label: 'Soğuk Erişim', value: 'cold_outreach' },
            { label: 'Teşekkür', value: 'thank_you' },
            { label: 'İş Ortaklığı', value: 'partnership' },
            { label: 'B2B Satış', value: 'b2b_sales' },
            { label: 'Etkinlik Daveti', value: 'event_invitation' },
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
        <Form.Item
          name="body_html"
          label="Email İçeriği"
          rules={[{ required: true, message: 'Lütfen email içeriği girin' }]}
        >
          <EmailEditor
            placeholder="Email içeriğinizi buraya yazın..."
            height={350}
            showVariables={true}
          />
        </Form.Item>
        <ProFormTextArea
          name="body_text"
          label="Plain Text İçerik (Opsiyonel)"
          fieldProps={{ rows: 3 }}
          placeholder="HTML desteklemeyen emailler için alternatif metin..."
        />
        <ProFormText
          name="from_name"
          label="Gönderen Adı"
          placeholder="Örn: Email Otomasyon Platformu"
        />
        {senderEmails.length > 0 ? (
          <ProFormSelect
            name="from_email"
            label="Gönderen Email"
            placeholder="Gönderen email seçin"
            options={senderEmails.map((email) => ({
              label: email,
              value: email,
            }))}
            rules={[{ required: true, message: 'Gönderen email seçin' }]}
          />
        ) : (
          <ProFormText
            name="from_email"
            label="Gönderen Email"
            placeholder="Örn: noreply@platform.com"
          />
        )}
        <ProFormText
          name="cc_emails"
          label="CC (Karbon Kopya)"
          placeholder="Örn: bilgi@firma.com, yonetim@firma.com"
          tooltip="Virgülle ayırarak birden fazla email girebilirsiniz"
        />
        <ProFormText
          name="bcc_emails"
          label="BCC (Gizli Kopya)"
          placeholder="Örn: arsiv@firma.com"
          tooltip="Virgülle ayırarak birden fazla email girebilirsiniz. Alıcılar bu adresleri göremez."
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
        <Form.Item
          name="attachments"
          label={
            <Space>
              <PaperClipOutlined />
              Ek Dosyalar
            </Space>
          }
        >
          <AttachmentUploader maxCount={5} maxSize={10} />
        </Form.Item>
      </ModalForm>

      {/* Düzenleme Modal */}
      <ModalForm
        title="Şablonu Düzenle"
        width={800}
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        initialValues={currentRow}
        modalProps={{
          destroyOnClose: true,
          bodyStyle: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            paddingRight: 8,
          },
        }}
        onFinish={async (values) => {
          try {
            // Tags string'i array'e çevir
            if (values.tags && typeof values.tags === 'string') {
              values.tags = values.tags.split(',').map((t: string) => t.trim());
            }
            if (currentRow?.id) {
              await updateTemplate(currentRow.id, values);
            }
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
            { label: 'Soğuk Erişim', value: 'cold_outreach' },
            { label: 'Teşekkür', value: 'thank_you' },
            { label: 'İş Ortaklığı', value: 'partnership' },
            { label: 'B2B Satış', value: 'b2b_sales' },
            { label: 'Etkinlik Daveti', value: 'event_invitation' },
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
        <Form.Item
          name="body_html"
          label="Email İçeriği"
          rules={[{ required: true, message: 'Lütfen email içeriği girin' }]}
        >
          <EmailEditor
            placeholder="Email içeriğinizi buraya yazın..."
            height={350}
            showVariables={true}
          />
        </Form.Item>
        <ProFormTextArea
          name="body_text"
          label="Plain Text İçerik (Opsiyonel)"
          fieldProps={{ rows: 3 }}
          placeholder="HTML desteklemeyen emailler için alternatif metin..."
        />
        <ProFormText
          name="from_name"
          label="Gönderen Adı"
          placeholder="Örn: Email Otomasyon Platformu"
        />
        {senderEmails.length > 0 ? (
          <ProFormSelect
            name="from_email"
            label="Gönderen Email"
            placeholder="Gönderen email seçin"
            options={senderEmails.map((email) => ({
              label: email,
              value: email,
            }))}
            rules={[{ required: true, message: 'Gönderen email seçin' }]}
          />
        ) : (
          <ProFormText
            name="from_email"
            label="Gönderen Email"
            placeholder="Örn: noreply@platform.com"
          />
        )}
        <ProFormText
          name="cc_emails"
          label="CC (Karbon Kopya)"
          placeholder="Örn: bilgi@firma.com, yonetim@firma.com"
          tooltip="Virgülle ayırarak birden fazla email girebilirsiniz"
        />
        <ProFormText
          name="bcc_emails"
          label="BCC (Gizli Kopya)"
          placeholder="Örn: arsiv@firma.com"
          tooltip="Virgülle ayırarak birden fazla email girebilirsiniz. Alıcılar bu adresleri göremez."
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
        <Form.Item
          name="attachments"
          label={
            <Space>
              <PaperClipOutlined />
              Ek Dosyalar
            </Space>
          }
        >
          <AttachmentUploader maxCount={5} maxSize={10} />
        </Form.Item>
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
              {currentRow.cc_emails && currentRow.cc_emails.length > 0 && (
                <p>
                  <strong>CC:</strong>{' '}
                  {Array.isArray(currentRow.cc_emails)
                    ? currentRow.cc_emails.join(', ')
                    : currentRow.cc_emails}
                </p>
              )}
              {currentRow.bcc_emails && currentRow.bcc_emails.length > 0 && (
                <p>
                  <strong>BCC:</strong>{' '}
                  {Array.isArray(currentRow.bcc_emails)
                    ? currentRow.bcc_emails.join(', ')
                    : currentRow.bcc_emails}
                </p>
              )}
            </div>
            {/* iframe ile izole önizleme - CSS çakışmalarını önler */}
            <iframe
              title="Email Önizleme"
              srcDoc={currentRow.body_html}
              style={{
                width: '100%',
                height: 500,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                background: '#fff',
              }}
              sandbox="allow-same-origin"
            />
          </div>
        )}
      </Modal>
    </>
  );
};

export default Templates;
