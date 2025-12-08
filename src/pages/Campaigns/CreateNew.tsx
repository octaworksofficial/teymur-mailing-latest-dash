import {
  ArrowDownOutlined,
  BellOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
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
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
  StepsForm,
} from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Alert,
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Form,
  Modal,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import axios from 'axios';
import moment from 'moment';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AttachmentUploader from '@/components/AttachmentUploader';
import EmailEditor from '@/components/EmailEditor';
import SchedulePicker from '@/components/SchedulePicker';
import {
  createCampaign,
  getCampaign,
  updateCampaign,
} from '@/services/campaigns';
import { getContact, getContacts, getFilterOptions } from '@/services/contacts';
import {
  createTemplate,
  getTemplates,
  updateTemplate,
} from '@/services/templates';
import type {
  RecurrenceConfig,
  ScheduleType,
  SpecialDayConfig,
  TemplateInSequence,
} from '@/types/campaign';
import type { Contact, ContactResponse } from '@/types/contact';
import type { EmailTemplate } from '@/types/template';
import './Create.less';

const { Text } = Typography;

const CampaignCreateNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const contactTableRef = useRef<ActionType>(null);
  const formRef = useRef<any>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedContactDetails, setSelectedContactDetails] = useState<
    Contact[]
  >([]);
  const [pendingSelection, setPendingSelection] = useState<number[]>([]);
  const [pendingSelectionDetails, setPendingSelectionDetails] = useState<
    Contact[]
  >([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [templateSequence, setTemplateSequence] = useState<
    TemplateInSequence[]
  >([]);
  const [_isRecurring, setIsRecurring] = useState(false);
  const [firstSendDate, setFirstSendDate] = useState<string>('');
  const [intervalDays, setIntervalDays] = useState<number>(3);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [createTemplateModalVisible, setCreateTemplateModalVisible] =
    useState(false);
  const [editTemplateModalVisible, setEditTemplateModalVisible] =
    useState(false);
  const [editingTemplateIndex, setEditingTemplateIndex] = useState<
    number | null
  >(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>(
    undefined,
  );
  const [initialValues, setInitialValues] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string>('draft');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [createTemplateForm] = Form.useForm();

  // Filtre seçenekleri - dinamik olarak yüklenir
  const [filterOptions, setFilterOptions] = useState<{
    status: string[];
    subscription_status: string[];
    importance_level: string[];
    customer_representative: string[];
    country: string[];
    state: string[];
    district: string[];
    company: string[];
    position: string[];
    source: string[];
    tags: string[];
    salutation: string[];
  }>({
    status: [],
    subscription_status: [],
    importance_level: [],
    customer_representative: [],
    country: [],
    state: [],
    district: [],
    company: [],
    position: [],
    source: [],
    tags: [],
    salutation: [],
  });

  useEffect(() => {
    loadTemplates();
    loadFilterOptions();
    if (isEditMode && id) {
      loadCampaign(Number(id));
    }
  }, [id]);

  const loadCampaign = async (campaignId: number) => {
    setLoading(true);
    try {
      const response = await getCampaign(campaignId);
      const campaign = response.data;

      if (!campaign) {
        throw new Error('Kampanya bulunamadı');
      }

      // Form başlangıç değerlerini set et
      setInitialValues({
        name: campaign.name,
        description: campaign.description,
        stop_on_reply: campaign.stop_on_reply,
        reply_notification_email: campaign.reply_notification_email,
        first_send_date: campaign.first_send_date
          ? moment(campaign.first_send_date)
          : undefined,
        interval_days: campaign.recurrence_interval_days || 3,
        is_recurring: campaign.is_recurring || false,
        status: campaign.status || 'draft',
      });

      // Kampanya bilgilerini state'e aktar
      setSelectedContacts(campaign.target_contact_ids || []);
      setIsRecurring(campaign.is_recurring || false);
      setFirstSendDate(campaign.first_send_date || '');
      setIntervalDays(campaign.recurrence_interval_days || 3);
      setTemplateSequence(campaign.template_sequence || []);
      setCampaignStatus(campaign.status || 'draft');

      // Seçili kişilerin detaylarını yükle
      if (
        campaign.target_contact_ids &&
        campaign.target_contact_ids.length > 0
      ) {
        // Küçük listeler için otomatik yükle, büyük listeler için manuel
        const contactCount = campaign.target_contact_ids.length;

        if (contactCount <= 100) {
          // 100'den az kişi varsa otomatik yükle
          try {
            const contactPromises = campaign.target_contact_ids.map(
              (contactId) => getContact(contactId).catch(() => null),
            );
            const contactsResults = await Promise.all(contactPromises);
            const contacts = contactsResults
              .filter(
                (result): result is ContactResponse =>
                  result !== null && result?.success === true,
              )
              .map((result) => result.data)
              .filter((contact): contact is Contact => contact !== undefined);
            setSelectedContactDetails(contacts);
            if (contacts.length < contactCount) {
              message.warning(
                `${contactCount} kişiden ${contacts.length} tanesi yüklenebildi`,
              );
            }
          } catch (_error) {
            message.warning(
              `${contactCount} kişi ID'si yüklendi, ancak detaylar getirilemedi`,
            );
          }
        } else {
          // 100'den fazla kişi varsa sadece bildirim göster
          message.info(
            `${contactCount} kişi seçili. Detayları görmek için "Detayları Yükle" butonuna tıklayın.`,
            5,
          );
        }
      }

      message.success('Program yüklendi');
    } catch (_error) {
      message.error('Program yüklenemedi');
      history.push('/campaigns/list');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await getTemplates({
        page: 1,
        limit: 100,
        status: 'active',
      });
      setTemplates(response.data);
    } catch (_error) {
      message.error('Şablonlar yüklenemedi');
    }
  };

  // AI ile şablon oluşturma
  const handleAiGenerateTemplate = async (params: {
    purpose: string;
    email_type: string;
    format?: string;
  }) => {
    setAiGenerating(true);
    try {
      const response = await axios.post(
        'https://n8n-production-14b9.up.railway.app/webhook/ai-generate-template',
        {
          purpose: params.purpose,
          email_type: params.email_type,
          format: params.format || 'html',
          language: 'Turkish',
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        },
      );

      let responseData = response.data;
      if (Array.isArray(responseData)) {
        responseData = responseData[0];
      }

      if (responseData) {
        createTemplateForm.setFieldsValue({
          name: responseData.name || responseData.template_name || '',
          description: responseData.description || '',
          subject: responseData.subject || '',
          body_html:
            responseData.body_html ||
            responseData.html_body ||
            responseData.content ||
            '',
          category: responseData.category || params.email_type || 'other',
          preheader: responseData.preheader || '',
        });
        message.success('AI şablonu başarıyla oluşturdu! Alanlar dolduruldu.');
      } else {
        message.warning('AI yanıt döndü ancak içerik boş');
      }
    } catch (error: any) {
      console.error('AI generate error:', error);
      message.error(
        `AI şablon oluşturma başarısız: ${error.message || 'Bilinmeyen hata'}`,
      );
    } finally {
      setAiGenerating(false);
    }
  };

  // Filtre seçeneklerini yükle
  const loadFilterOptions = async () => {
    try {
      const response = await getFilterOptions();
      if (response.success) {
        setFilterOptions({
          ...response.data,
          salutation: (response.data as any).salutation || [],
        });
      }
    } catch (error) {
      console.error('Filtre seçenekleri yüklenemedi:', error);
    }
  };

  // Seçili kişi detaylarını manuel yükle (büyük listeler için)
  const loadSelectedContactDetails = async () => {
    if (selectedContacts.length === 0) {
      message.warning('Seçili kişi bulunamadı');
      return;
    }

    setLoadingContacts(true);
    try {
      // Promise.all ile paralel yükleme
      const contactPromises = selectedContacts.map((contactId) =>
        getContact(contactId).catch(() => null),
      );
      const contactsResults = await Promise.all(contactPromises);
      const contacts = contactsResults
        .filter(
          (result): result is ContactResponse =>
            result !== null && result?.success === true,
        )
        .map((result) => result.data)
        .filter((contact): contact is Contact => contact !== undefined);

      setSelectedContactDetails(contacts);

      if (contacts.length < selectedContacts.length) {
        message.warning(
          `${selectedContacts.length} kişiden ${contacts.length} tanesi yüklenebildi`,
        );
      } else {
        message.success(`${contacts.length} kişi detayı başarıyla yüklendi`);
      }
    } catch (_error) {
      message.error('Kişi detayları yüklenirken hata oluştu');
    } finally {
      setLoadingContacts(false);
    }
  };

  // Bekleyen seçimleri kampanyaya ekle
  const handleAddToSelected = () => {
    if (pendingSelection.length === 0) {
      message.warning('Lütfen eklenecek kişileri seçin');
      return;
    }

    const newIds = [...selectedContacts, ...pendingSelection];
    const uniqueIds = [...new Set(newIds)];
    setSelectedContacts(uniqueIds);

    const existingDetails = selectedContactDetails.filter((c) =>
      uniqueIds.includes(c.id),
    );
    const newDetails = pendingSelectionDetails.filter(
      (c) => !selectedContactDetails.some((sc) => sc.id === c.id),
    );
    setSelectedContactDetails([...existingDetails, ...newDetails]);

    setPendingSelection([]);
    setPendingSelectionDetails([]);

    message.success(`${pendingSelection.length} kişi kampanyaya eklendi`);
  };

  // Filtrelenmiş tüm listeyi ekle
  const handleAddAllFiltered = async () => {
    if (filteredTotal === 0) {
      message.warning('Eklenecek kişi bulunamadı');
      return;
    }

    try {
      const {
        page: _page,
        pageSize: _pageSize,
        ...otherFilters
      } = currentFilters;
      const response = await getContacts({
        ...otherFilters,
        page: 1,
        pageSize: filteredTotal,
      });

      const allContacts = response.data;
      const newIds = [...selectedContacts, ...allContacts.map((c) => c.id)];
      const uniqueIds = [...new Set(newIds)];
      setSelectedContacts(uniqueIds);

      const existingDetails = selectedContactDetails.filter((c) =>
        uniqueIds.includes(c.id),
      );
      const newDetails = allContacts.filter(
        (c) => !selectedContactDetails.some((sc) => sc.id === c.id),
      );
      setSelectedContactDetails([...existingDetails, ...newDetails]);

      message.success(`${allContacts.length} kişi kampanyaya eklendi`);
    } catch (_error) {
      message.error('Kişiler eklenirken hata oluştu');
    }
  };

  // Seçilen kişiyi çıkar
  const handleRemoveContact = (contactId: number) => {
    setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    setSelectedContactDetails(
      selectedContactDetails.filter((c) => c.id !== contactId),
    );
  };

  // Kişi kolonları
  const contactColumns: ProColumns<Contact>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      ellipsis: true,
      copyable: true,
    },
    {
      title: 'Hitap',
      dataIndex: 'salutation',
      width: 80,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Hitap seçin',
        options: filterOptions.salutation.map((v) => ({ label: v, value: v })),
      },
    },
    {
      title: 'Ad',
      dataIndex: 'first_name',
      ellipsis: true,
    },
    {
      title: 'Soyad',
      dataIndex: 'last_name',
      ellipsis: true,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      ellipsis: true,
      width: 120,
      hideInSearch: true,
    },
    {
      title: 'Mobil Telefon',
      dataIndex: 'mobile_phone',
      ellipsis: true,
      width: 120,
      hideInSearch: true,
    },
    {
      title: 'Şirket',
      dataIndex: 'company',
      ellipsis: true,
      width: 150,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Şirket seçin',
        options: filterOptions.company.map((v) => ({ label: v, value: v })),
      },
    },
    {
      title: 'Firma Ünvan',
      dataIndex: 'company_title',
      ellipsis: true,
      width: 150,
      hideInSearch: true,
    },
    {
      title: 'Pozisyon',
      dataIndex: 'position',
      ellipsis: true,
      width: 120,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Pozisyon seçin',
        options: filterOptions.position.map((v) => ({ label: v, value: v })),
      },
    },
    {
      title: 'Müşteri Temsilcisi',
      dataIndex: 'customer_representative',
      ellipsis: true,
      width: 150,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Temsilci seçin',
        options: filterOptions.customer_representative.map((v) => ({
          label: v,
          value: v,
        })),
      },
    },
    {
      title: 'Ülke',
      dataIndex: 'country',
      width: 120,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Ülke seçin',
        options: filterOptions.country.map((v) => ({ label: v, value: v })),
      },
    },
    {
      title: 'İl',
      dataIndex: 'state',
      width: 120,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'İl seçin',
        options: filterOptions.state.map((v) => ({ label: v, value: v })),
      },
    },
    {
      title: 'İlçe',
      dataIndex: 'district',
      width: 120,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'İlçe seçin',
        options: filterOptions.district.map((v) => ({ label: v, value: v })),
      },
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
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Önem seçin',
        options: filterOptions.importance_level.map((v) => ({
          label:
            v === '1'
              ? '1 - Düşük'
              : v === '5'
                ? '5 - Orta'
                : v === '8'
                  ? '8 - Yüksek'
                  : v === '10'
                    ? '10 - Kritik'
                    : v,
          value: v,
        })),
      },
      render: (_: any, record: Contact) => {
        if (!record.importance_level) return '-';
        const colors = [
          '',
          'default',
          'default',
          'blue',
          'blue',
          'cyan',
          'cyan',
          'orange',
          'orange',
          'red',
          'red',
        ];
        return (
          <Tag color={colors[record.importance_level]}>
            {record.importance_level}
          </Tag>
        );
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
      title: 'Kaynak',
      dataIndex: 'source',
      ellipsis: true,
      width: 100,
      hideInSearch: true,
    },
    {
      title: 'Etiketler',
      dataIndex: 'tags',
      width: 150,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Etiket seçin',
        options: filterOptions.tags.map((v) => ({ label: v, value: v })),
      },
      render: (_, record) => (
        <Space size={[0, 4]} wrap>
          {record.tags?.slice(0, 2).map((tag) => (
            <Tag key={tag} color="blue" style={{ margin: 0 }}>
              {tag}
            </Tag>
          ))}
          {record.tags && record.tags.length > 2 && (
            <Tag color="default">+{record.tags.length - 2}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Ö. Alanlar',
      dataIndex: 'custom_fields',
      width: 150,
      fieldProps: {
        placeholder: 'Özel alan ara...',
      },
      render: (_, record) => {
        if (
          !record.custom_fields ||
          Object.keys(record.custom_fields).length === 0
        ) {
          return <span style={{ color: '#999' }}>-</span>;
        }
        const fields = Object.entries(record.custom_fields);
        return (
          <Space size={[0, 4]} wrap>
            {fields.slice(0, 2).map(([key, value]) => (
              <Tag key={key} color="purple" style={{ margin: 0, fontSize: 11 }}>
                {key}: {String(value).substring(0, 15)}
              </Tag>
            ))}
            {fields.length > 2 && (
              <Tag color="default" style={{ fontSize: 11 }}>
                +{fields.length - 2}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Durum seçin',
        options: filterOptions.status.map((v) => ({
          label:
            v === 'active'
              ? 'Aktif'
              : v === 'unsubscribed'
                ? 'Abonelik İptal'
                : v === 'bounced'
                  ? 'Bounce'
                  : v === 'complained'
                    ? 'Şikayet'
                    : v,
          value: v,
        })),
      },
      render: (_, record) => {
        const colors = {
          active: 'green',
          unsubscribed: 'default',
          bounced: 'red',
          complained: 'orange',
        };
        const labels = {
          active: 'Aktif',
          unsubscribed: 'İptal',
          bounced: 'Bounce',
          complained: 'Şikayet',
        };
        return <Tag color={colors[record.status]}>{labels[record.status]}</Tag>;
      },
    },
    {
      title: 'Abonelik',
      dataIndex: 'subscription_status',
      width: 100,
      valueType: 'select',
      fieldProps: {
        showSearch: true,
        allowClear: true,
        mode: 'multiple',
        placeholder: 'Abonelik seçin',
        options: filterOptions.subscription_status.map((v) => ({
          label:
            v === 'subscribed'
              ? 'Abone'
              : v === 'unsubscribed'
                ? 'Değil'
                : v === 'pending'
                  ? 'Bekliyor'
                  : v,
          value: v,
        })),
      },
      render: (_, record) => {
        const colors = {
          subscribed: 'green',
          unsubscribed: 'default',
          pending: 'blue',
        };
        const labels = {
          subscribed: 'Abone',
          unsubscribed: 'Değil',
          pending: 'Bekliyor',
        };
        return (
          <Tag color={colors[record.subscription_status]}>
            {labels[record.subscription_status]}
          </Tag>
        );
      },
    },
    {
      title: 'Engagement',
      dataIndex: 'engagement_score',
      width: 100,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => {
        const score = record.engagement_score || 0;
        return (
          <Badge
            count={score}
            showZero
            color={score > 70 ? 'green' : score > 40 ? 'orange' : 'red'}
            style={{ fontSize: 12 }}
          />
        );
      },
    },
  ];

  // Seçilen kişiler kolonları
  const selectedContactColumns = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Ad Soyad',
      key: 'name',
      render: (_: any, record: Contact) =>
        `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'Şirket',
      dataIndex: 'company',
      key: 'company',
      ellipsis: true,
    },
    {
      title: 'Pozisyon',
      dataIndex: 'position',
      key: 'position',
      ellipsis: true,
    },
    {
      title: 'Etiketler',
      dataIndex: 'tags',
      key: 'tags',
      render: (_: any, record: Contact) => (
        <Space size={[0, 4]} wrap>
          {record.tags?.slice(0, 2).map((tag) => (
            <Tag key={tag} color="blue" style={{ margin: 0, fontSize: 11 }}>
              {tag}
            </Tag>
          ))}
          {record.tags && record.tags.length > 2 && (
            <Tag color="default" style={{ fontSize: 11 }}>
              +{record.tags.length - 2}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Özel Alanlar',
      key: 'custom_fields',
      render: (_: any, record: Contact) => {
        if (
          !record.custom_fields ||
          Object.keys(record.custom_fields).length === 0
        ) {
          return <span style={{ color: '#999' }}>-</span>;
        }
        const fields = Object.entries(record.custom_fields);
        return (
          <Space size={[0, 4]} wrap>
            {fields.slice(0, 2).map(([key, value]) => (
              <Tag key={key} color="purple" style={{ margin: 0, fontSize: 11 }}>
                {key}: {String(value).substring(0, 10)}
              </Tag>
            ))}
            {fields.length > 2 && (
              <Tag color="default" style={{ fontSize: 11 }}>
                +{fields.length - 2}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          active: 'green',
          unsubscribed: 'default',
          bounced: 'red',
          complained: 'orange',
        };
        const labels = {
          active: 'Aktif',
          unsubscribed: 'İptal',
          bounced: 'Bounce',
          complained: 'Şikayet',
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {labels[status as keyof typeof labels]}
          </Tag>
        );
      },
    },
    {
      title: 'Engagement',
      dataIndex: 'engagement_score',
      key: 'engagement',
      render: (_: any, record: Contact) => {
        const score = record.engagement_score || 0;
        return (
          <Badge
            count={score}
            showZero
            color={score > 70 ? 'green' : score > 40 ? 'orange' : 'red'}
            style={{ fontSize: 11 }}
          />
        );
      },
    },
    {
      title: 'İşlem',
      key: 'action',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: Contact) => (
        <Button
          type="text"
          danger
          size="small"
          icon={<CloseOutlined />}
          onClick={() => handleRemoveContact(record.id)}
        />
      ),
    },
  ];

  // Şablon ekleme
  const addTemplate = useCallback(() => {
    if (!selectedTemplate) {
      message.warning('Lütfen bir şablon seçin');
      return;
    }

    const newTemplate = {
      template_id: selectedTemplate,
      send_delay_days: 0,
      schedule_type: 'custom_date' as ScheduleType,
      scheduled_date: undefined,
    };

    setTemplateSequence((prev) => [...prev, newTemplate]);
    setTemplateModalVisible(false);
    setSelectedTemplate(undefined);
    message.success('Şablon eklendi');
  }, [selectedTemplate]);

  const removeTemplate = useCallback((index: number) => {
    setTemplateSequence((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Şablon düzenleme modalını aç
  const openEditTemplate = useCallback(
    (index: number) => {
      const templateInSequence = templateSequence[index];
      const template = templates.find(
        (t) => t.id === templateInSequence.template_id,
      );
      if (template) {
        setEditingTemplateIndex(index);
        setEditingTemplate(template);
        setEditTemplateModalVisible(true);
      }
    },
    [templateSequence, templates],
  );

  // Şablonu güncelle
  const handleUpdateTemplate = async (values: any) => {
    if (editingTemplate === null || editingTemplateIndex === null) return false;

    try {
      // Tags string'i array'e çevir
      if (values.tags && typeof values.tags === 'string') {
        values.tags = values.tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter(Boolean);
      }

      const response = await updateTemplate(editingTemplate.id, {
        name: values.name,
        subject: values.subject,
        body_html: values.body_html,
        cc_emails: values.cc
          ? values.cc
              .split(',')
              .map((e: string) => e.trim())
              .filter(Boolean)
          : undefined,
        bcc_emails: values.bcc
          ? values.bcc
              .split(',')
              .map((e: string) => e.trim())
              .filter(Boolean)
          : undefined,
        tags: values.tags,
        status: values.status || 'active',
      });

      if (response.success) {
        message.success('Şablon güncellendi');
        // Şablonları yeniden yükle
        await loadTemplates();
        setEditTemplateModalVisible(false);
        setEditingTemplate(null);
        setEditingTemplateIndex(null);
        return true;
      } else {
        message.error('Şablon güncellenemedi');
        return false;
      }
    } catch (error) {
      console.error('Şablon güncelleme hatası:', error);
      message.error('Şablon güncellenirken hata oluştu');
      return false;
    }
  };

  const _recalculateDates = (sequence: TemplateInSequence[]) => {
    const updated = sequence.map((item, index) => {
      const delay =
        index === 0 ? 0 : sequence[index - 1].send_delay_days + intervalDays;
      const scheduled = firstSendDate
        ? moment(firstSendDate).add(delay, 'days').format('YYYY-MM-DD HH:mm:ss')
        : '';
      return {
        ...item,
        send_delay_days: delay,
        scheduled_date: scheduled,
      };
    });
    setTemplateSequence(updated);
  };

  const _handleFirstSendDateChange = (dateString: string) => {
    setFirstSendDate(dateString);
    if (templateSequence.length > 0) {
      const updated = templateSequence.map((item) => ({
        ...item,
        scheduled_date: dateString
          ? moment(dateString)
              .add(item.send_delay_days, 'days')
              .format('YYYY-MM-DD HH:mm:ss')
          : '',
      }));
      setTemplateSequence(updated);
    }
  };

  // Tek bir şablon için tarihi değiştir
  const _handleTemplateDateChange = (index: number, dateString: string) => {
    const updated = [...templateSequence];
    updated[index] = {
      ...updated[index],
      scheduled_date: dateString,
    };
    setTemplateSequence(updated);
  };

  // Tek bir şablon için schedule config'i güncelle
  const handleTemplateScheduleChange = useCallback(
    (
      index: number,
      scheduleData: {
        schedule_type: ScheduleType;
        scheduled_date?: string;
        recurrence_config?: RecurrenceConfig;
        special_day_config?: SpecialDayConfig;
      },
    ) => {
      setTemplateSequence((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          schedule_type: scheduleData.schedule_type,
          scheduled_date: scheduleData.scheduled_date,
          recurrence_config: scheduleData.recurrence_config,
          special_day_config: scheduleData.special_day_config,
        };
        return updated;
      });
    },
    [],
  );

  const _handleIntervalChange = useCallback(
    (value: number | null) => {
      if (value) {
        setIntervalDays(value);
        // Interval değiştiğinde tarihleri otomatik yeniden hesapla
        setTemplateSequence((prev) => {
          if (prev.length > 0 && firstSendDate) {
            const updated = prev.map((item, index) => {
              const delay = index === 0 ? 0 : index * value;
              const scheduled = moment(firstSendDate)
                .add(delay, 'days')
                .format('YYYY-MM-DD HH:mm:ss');
              return {
                ...item,
                send_delay_days: delay,
                scheduled_date: scheduled,
              };
            });
            message.success(`Tarihler ${value} gün aralığa göre güncellendi`);
            return updated;
          }
          return prev;
        });
      }
    },
    [firstSendDate],
  );

  // Template seçeneklerini memoize et
  const templateOptions = useMemo(
    () =>
      templates.map((t) => ({
        label: `${t.name} (${t.category})`,
        value: t.id,
      })),
    [templates],
  );

  return (
    <Card
      className="campaign-create-form"
      title={
        <h2 style={{ margin: 0 }}>
          {isEditMode
            ? 'Email Programını Düzenle'
            : 'Yeni Email Programı Oluştur'}
        </h2>
      }
      style={{
        maxWidth: '1800px',
        width: '100%',
        overflowX: 'hidden',
        padding: 0,
        margin: '24px auto',
      }}
      styles={{ body: { padding: window.innerWidth <= 768 ? 8 : 24 } }}
      loading={loading}
    >
      <StepsForm
        formRef={formRef}
        onFinish={async (values) => {
          try {
            // İlk şablonun tarihini first_send_date olarak kullan
            const calculatedFirstSendDate =
              templateSequence.length > 0
                ? templateSequence[0].scheduled_date
                : undefined;

            // Birden fazla şablon varsa tekrarlayan olarak işaretle
            const calculatedIsRecurring = templateSequence.length > 1;

            const campaignData = {
              name: values.name,
              description: values.description,
              target_contact_ids: selectedContacts,
              is_recurring: calculatedIsRecurring,
              template_sequence: templateSequence,
              first_send_date: calculatedFirstSendDate,
              recurrence_interval_days: calculatedIsRecurring
                ? intervalDays
                : undefined,
              stop_on_reply: values.stop_on_reply,
              reply_notification_email: values.reply_notification_email,
              status: values.status || 'draft',
            };

            if (isEditMode && id) {
              await updateCampaign(Number(id), campaignData);
              message.success('Email programı başarıyla güncellendi');
            } else {
              await createCampaign(campaignData);
              message.success('Email programı başarıyla oluşturuldu');
            }

            history.push('/campaigns/list');
            return true;
          } catch (_error) {
            message.error(
              isEditMode
                ? 'Güncelleme işlemi başarısız oldu'
                : 'Oluşturma işlemi başarısız oldu',
            );
            return false;
          }
        }}
        stepsFormRender={(dom, submitter) => {
          // Submitter'ı parçalara ayır
          const submitterArray = Array.isArray(submitter)
            ? submitter
            : [submitter];
          const previousButton = submitterArray.find(
            (btn: any) => btn?.key === 'pre',
          );
          const nextButtons = submitterArray.filter(
            (btn: any) => btn?.key !== 'pre',
          );

          return (
            <div>
              {dom}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 24,
                }}
              >
                <div>{previousButton || <div />}</div>
                <div style={{ display: 'flex', gap: 8 }}>{nextButtons}</div>
              </div>
            </div>
          );
        }}
      >
        {/* Adım 1: Hedef Kitle */}
        <StepsForm.StepForm
          name="step1"
          title="Hedef Kitle"
          initialValues={initialValues}
          onFinish={async () => {
            if (selectedContacts.length === 0) {
              message.error('Lütfen en az bir kişi seçin');
              return false;
            }
            return true;
          }}
        >
          <ProFormText
            name="name"
            label="Program Adı"
            rules={[{ required: true }]}
            placeholder="Örn: Hoş Geldiniz Serisi"
          />
          <ProFormTextArea
            name="description"
            label="Açıklama"
            placeholder="Program açıklaması..."
          />

          <Divider>Hedef Kişileri Seçin</Divider>

          {/* Tüm Kişiler Tablosu */}
          <Card
            title={<span>Tüm Kişiler</span>}
            size="small"
            style={{ marginBottom: 24 }}
          >
            {pendingSelection.length > 0 && (
              <Alert
                message={
                  <Space>
                    <span>
                      Seçilen: <strong>{pendingSelection.length}</strong> kişi
                    </span>
                    <Button
                      type="primary"
                      size="small"
                      icon={<ArrowDownOutlined />}
                      onClick={handleAddToSelected}
                    >
                      Seçilenleri Kampanyaya Ekle
                    </Button>
                    <Button
                      type="dashed"
                      size="small"
                      onClick={handleAddAllFiltered}
                    >
                      Tümünü Ekle ({filteredTotal} kişi)
                    </Button>
                  </Space>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <ProTable<Contact>
              actionRef={contactTableRef}
              rowKey="id"
              size="small"
              search={{
                labelWidth: 80,
                defaultCollapsed: false,
                collapseRender: false,
              }}
              form={{
                component: false,
                onFinish: async (_values) => {
                  // Enter tuşuna basıldığında reload tetikle
                  contactTableRef.current?.reload();
                },
              }}
              request={async (params) => {
                try {
                  // Genel arama için tüm text alanlarını kontrol et
                  let searchTerm = '';
                  if (params.first_name) searchTerm = params.first_name;
                  else if (params.last_name) searchTerm = params.last_name;
                  else if (params.company) searchTerm = params.company;
                  else if (params.position) searchTerm = params.position;

                  // Filtreleri hazırla - tüm yeni alanları dahil et
                  const filters = {
                    page: params.current || 1,
                    pageSize: params.pageSize || 10,
                    email: params.email || undefined,
                    status: params.status || undefined,
                    subscription_status:
                      params.subscription_status || undefined,
                    tags: params.tags || undefined,
                    custom_fields: params.custom_fields || undefined,
                    search: searchTerm || undefined,
                    customer_representative:
                      params.customer_representative || undefined,
                    country: params.country || undefined,
                    state: params.state || undefined,
                    district: params.district || undefined,
                    importance_level: params.importance_level || undefined,
                  };

                  setCurrentFilters(filters);
                  const response = await getContacts(filters);
                  setFilteredTotal(response.total);

                  return {
                    data: response.data,
                    success: true,
                    total: response.total,
                  };
                } catch (_error) {
                  message.error('Kişiler yüklenemedi');
                  return { data: [], success: false, total: 0 };
                }
              }}
              columns={contactColumns}
              columnsState={{
                persistenceKey: 'campaign-contact-table-columns',
                persistenceType: 'localStorage',
                defaultValue: {
                  id: { show: false },
                  phone: { show: false },
                  mobile_phone: { show: false },
                  company_title: { show: false },
                  address_1: { show: false },
                  address_2: { show: false },
                  notes: { show: false },
                  source: { show: false },
                  custom_fields: { show: false },
                  engagement_score: { show: false },
                },
              }}
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
              }}
              rowSelection={{
                selectedRowKeys: pendingSelection,
                onChange: (selectedRowKeys, selectedRows) => {
                  setPendingSelection(selectedRowKeys as number[]);
                  setPendingSelectionDetails(selectedRows);
                },
                preserveSelectedRowKeys: true,
              }}
              tableAlertRender={false}
              tableAlertOptionRender={false}
              scroll={{ x: 1600 }}
              options={{
                setting: true,
                density: true,
                fullScreen: true,
                reload: true,
              }}
              headerTitle={
                <span style={{ color: '#888', fontSize: 12 }}>
                  Tablonun sağ üst köşesindeki ⚙️ ikonundan sütunları
                  gösterebilir/gizleyebilirsiniz
                </span>
              }
            />
          </Card>

          {/* Seçilen Kişiler Tablosu */}
          <Card
            title={
              <Space>
                <span>Kampanyaya Eklenecek Kişiler</span>
                <Badge count={selectedContacts.length} showZero />
              </Space>
            }
            size="small"
            extra={
              <Space>
                {selectedContacts.length > 0 &&
                  selectedContactDetails.length === 0 && (
                    <Button
                      type="primary"
                      size="small"
                      loading={loadingContacts}
                      onClick={loadSelectedContactDetails}
                    >
                      Detayları Yükle ({selectedContacts.length} kişi)
                    </Button>
                  )}
                {selectedContactDetails.length > 0 && (
                  <Button
                    danger
                    size="small"
                    onClick={() => {
                      setSelectedContacts([]);
                      setSelectedContactDetails([]);
                    }}
                  >
                    Tümünü Temizle
                  </Button>
                )}
              </Space>
            }
          >
            {selectedContactDetails.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 0',
                  color: '#999',
                }}
              >
                {selectedContacts.length > 0 ? (
                  <>
                    <Badge
                      count={selectedContacts.length}
                      showZero
                      style={{ fontSize: 32, marginBottom: 16 }}
                    />
                    <p style={{ fontSize: 16, marginTop: 16 }}>
                      <strong>{selectedContacts.length} kişi seçildi</strong>
                    </p>
                    <p style={{ color: '#666' }}>
                      Kişi detaylarını görmek için yukarıdaki "Detayları Yükle"
                      butonuna tıklayın
                    </p>
                  </>
                ) : (
                  <>
                    <ArrowDownOutlined
                      style={{ fontSize: 48, marginBottom: 16 }}
                    />
                    <p>
                      Yukarıdaki tablodan kişi seçin ve "Kampanyaya Ekle"
                      butonuna tıklayın
                    </p>
                  </>
                )}
              </div>
            ) : (
              <Table
                dataSource={selectedContactDetails}
                columns={selectedContactColumns}
                rowKey="id"
                size="small"
                scroll={{ x: 1400 }}
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Toplam ${total} kişi`,
                }}
              />
            )}
          </Card>
        </StepsForm.StepForm>

        {/* Adım 2: Şablon Seçimi */}
        <StepsForm.StepForm
          name="step2"
          title="Şablon Seçimi"
          initialValues={initialValues}
          onFinish={async () => {
            if (templateSequence.length === 0) {
              message.error('Lütfen en az bir şablon seçin');
              return false;
            }
            // Her şablonun bir tarihi olmalı
            const hasInvalidSchedule = templateSequence.some(
              (item) =>
                !item.scheduled_date && item.schedule_type === 'custom_date',
            );
            if (hasInvalidSchedule) {
              message.error('Lütfen tüm şablonlar için gönderim tarihi seçin');
              return false;
            }
            return true;
          }}
        >
          <Card
            title="Şablonlar"
            style={{
              marginTop: 16,
              width: '100%',
              maxWidth: 850,
            }}
          >
            <Space direction="vertical" style={{ width: '100%', gap: 16 }}>
              {templateSequence.map((item, index) => {
                const template = templates.find(
                  (t) => t.id === item.template_id,
                );
                return (
                  <Card
                    key={`template-${item.template_id}-${index}`}
                    size="small"
                    title={`${index + 1}. Email`}
                    style={{
                      backgroundColor: '#fafafa',
                      border: '1px solid #d9d9d9',
                      width: '100%',
                      maxWidth: 800,
                    }}
                    extra={
                      <Space>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => openEditTemplate(index)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeTemplate(index)}
                        >
                          Sil
                        </Button>
                      </Space>
                    }
                  >
                    <Space
                      direction="vertical"
                      style={{ width: '100%' }}
                      size={12}
                    >
                      <div>
                        <strong>Şablon:</strong> {template?.name}
                      </div>

                      <div>
                        <strong>Gönderim Programı:</strong>
                        <SchedulePicker
                          value={{
                            schedule_type: item.schedule_type || 'custom_date',
                            scheduled_date: item.scheduled_date,
                            recurrence_config: item.recurrence_config,
                            special_day_config: item.special_day_config,
                          }}
                          onChange={(scheduleData) => {
                            handleTemplateScheduleChange(index, scheduleData);
                          }}
                        />
                      </div>
                    </Space>
                  </Card>
                );
              })}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                block
                onClick={() => {
                  setTemplateModalVisible(true);
                }}
              >
                {templateSequence.length === 0
                  ? 'İlk Şablonu Ekle'
                  : 'Yeni Şablon Ekle'}
              </Button>
            </Space>
          </Card>

          <Modal
            title="Şablon Seç"
            open={templateModalVisible}
            onOk={addTemplate}
            onCancel={() => {
              setTemplateModalVisible(false);
              setSelectedTemplate(undefined);
            }}
            okText="Ekle"
            cancelText="İptal"
            footer={[
              <Button
                key="create"
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() => {
                  setTemplateModalVisible(false);
                  setCreateTemplateModalVisible(true);
                }}
              >
                Yeni Şablon Oluştur
              </Button>,
              <Button
                key="cancel"
                onClick={() => {
                  setTemplateModalVisible(false);
                  setSelectedTemplate(undefined);
                }}
              >
                İptal
              </Button>,
              <Button
                key="ok"
                type="primary"
                onClick={addTemplate}
                disabled={!selectedTemplate}
              >
                Ekle
              </Button>,
            ]}
          >
            <Select
              style={{ width: '100%' }}
              placeholder="Bir şablon seçin"
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              options={templateOptions}
            />
          </Modal>

          {/* Yeni Şablon Oluşturma Modal */}
          <ModalForm
            title="Yeni Email Şablonu Oluştur"
            width={800}
            open={createTemplateModalVisible}
            onOpenChange={(open) => {
              setCreateTemplateModalVisible(open);
              if (!open) {
                setAiGenerating(false);
                createTemplateForm.resetFields();
              }
            }}
            form={createTemplateForm}
            modalProps={{
              destroyOnClose: true,
              bodyStyle: {
                maxHeight: 'calc(100vh - 200px)',
                overflowY: 'auto',
                paddingRight: 8,
              },
              onCancel: () => {
                setCreateTemplateModalVisible(false);
              },
            }}
            onFinish={async (values) => {
              try {
                // Tags string'i array'e çevir
                if (values.tags && typeof values.tags === 'string') {
                  values.tags = values.tags
                    .split(',')
                    .map((t: string) => t.trim());
                }
                const response = await createTemplate(values);
                message.success('Şablon başarıyla oluşturuldu');

                // Yeni şablonu listeye ekle
                await loadTemplates();

                // Oluşturulan şablonu otomatik olarak seç ve sequence'e ekle
                if (response.data?.id) {
                  const newTemplateId = response.data.id;
                  setSelectedTemplate(newTemplateId);

                  // Modal'ı kapat ve template'i sequence'e ekle
                  setCreateTemplateModalVisible(false);

                  // Template'i sequence'e ekle
                  const newSequence: TemplateInSequence = {
                    template_id: newTemplateId,
                    send_delay_days: 0,
                    schedule_type: 'custom_date' as ScheduleType,
                    scheduled_date: undefined,
                  };
                  setTemplateSequence([...templateSequence, newSequence]);
                  message.success('Şablon kampanyaya eklendi');
                }

                return true;
              } catch (_error) {
                message.error('Şablon oluşturma işlemi başarısız oldu');
                return false;
              }
            }}
          >
            {/* AI ile Şablon Oluşturma Bölümü */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, #667eea08 0%, #764ba210 100%)',
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
                    <ThunderboltOutlined
                      style={{ fontSize: 20, color: '#fff' }}
                    />
                  </div>
                  <div>
                    <Text
                      strong
                      style={{
                        fontSize: 16,
                        display: 'block',
                        color: '#1a1a2e',
                      }}
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
                              <SendOutlined style={{ color: '#667eea' }} />{' '}
                              Soğuk Erişim
                            </Space>
                          ),
                          value: 'cold_outreach',
                        },
                        {
                          label: (
                            <Space>
                              <MailOutlined style={{ color: '#52c41a' }} />{' '}
                              Takip Maili
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
                              <NotificationOutlined
                                style={{ color: '#1890ff' }}
                              />{' '}
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
                              <SoundOutlined style={{ color: '#13c2c2' }} />{' '}
                              Duyuru
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
                              <Html5Outlined style={{ color: '#e34c26' }} />{' '}
                              HTML
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
                    const values = createTemplateForm.getFieldsValue([
                      'ai_purpose',
                      'ai_email_type',
                      'ai_format',
                    ]);
                    if (!values.ai_purpose || !values.ai_email_type) {
                      message.warning('Lütfen email amacını ve türünü girin');
                      return;
                    }
                    await handleAiGenerateTemplate({
                      purpose: values.ai_purpose,
                      email_type: values.ai_email_type,
                      format: values.ai_format || 'html',
                    });
                  }}
                  style={{
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderColor: 'transparent',
                    width: '100%',
                    height: 44,
                    borderRadius: 8,
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.35)',
                  }}
                >
                  {aiGenerating
                    ? 'AI Oluşturuyor...'
                    : 'AI ile Şablonu Oluştur'}
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
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: '100%' }}
                >
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
                      Excel'deki sütun başlıklarını aynen kullanabilirsiniz.
                      Örnek: {'{{Şehir}}'}, {'{{Bütçe}}'}, {'{{Sektör}}'}
                      <br />
                      <Text type="warning">
                        Not: Sütun adları büyük/küçük harf duyarlıdır,
                        Excel'deki başlıkla birebir aynı olmalıdır.
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
                      İçerik: "Sayın {'{{full_name}}'}, {'{{company}}'} için
                      özel teklifimiz..."
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
              tooltip="Kişiselleştirme için {{first_name}}, {{company}} gibi değişkenler kullanabilirsiniz"
            />
            <ProFormTextArea
              name="preheader"
              label="Preheader (Önizleme Metni)"
              placeholder="Inbox'ta gösterilecek kısa açıklama..."
            />
            <Form.Item
              name="body_html"
              label="Email İçeriği"
              rules={[
                { required: true, message: 'Lütfen email içeriği girin' },
              ]}
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
            <ProFormText
              name="from_email"
              label="Gönderen Email"
              placeholder="Örn: noreply@platform.com"
            />
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
              initialValue="active"
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

          {/* Şablon Düzenleme Modal */}
          <ModalForm
            title="Şablonu Düzenle"
            width={800}
            open={editTemplateModalVisible}
            onOpenChange={(visible) => {
              if (!visible) {
                setEditTemplateModalVisible(false);
                setEditingTemplate(null);
                setEditingTemplateIndex(null);
              }
            }}
            initialValues={
              editingTemplate
                ? {
                    name: editingTemplate.name,
                    description: editingTemplate.description,
                    category: editingTemplate.category,
                    subject: editingTemplate.subject,
                    preheader: editingTemplate.preheader,
                    body_html: editingTemplate.body_html,
                    body_text: editingTemplate.body_text,
                    from_name: editingTemplate.from_name,
                    from_email: editingTemplate.from_email,
                    cc_emails: editingTemplate.cc_emails?.join(', '),
                    bcc_emails: editingTemplate.bcc_emails?.join(', '),
                    priority: editingTemplate.priority,
                    status: editingTemplate.status,
                    tags: editingTemplate.tags?.join(', '),
                  }
                : {}
            }
            onFinish={handleUpdateTemplate}
            modalProps={{
              destroyOnClose: true,
              onCancel: () => {
                setEditTemplateModalVisible(false);
                setEditingTemplate(null);
                setEditingTemplateIndex(null);
              },
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
              tooltip="Kişiselleştirme için {{first_name}}, {{company}} gibi değişkenler kullanabilirsiniz"
            />
            <ProFormTextArea
              name="preheader"
              label="Preheader (Önizleme Metni)"
              placeholder="Inbox'ta gösterilecek kısa açıklama..."
            />
            <Form.Item
              name="body_html"
              label="Email İçeriği"
              rules={[
                { required: true, message: 'Lütfen email içeriği girin' },
              ]}
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
            <ProFormText
              name="from_email"
              label="Gönderen Email"
              placeholder="Örn: noreply@platform.com"
            />
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
            />
          </ModalForm>
        </StepsForm.StepForm>

        {/* Adım 3: Diğer Ayarlar */}
        <StepsForm.StepForm
          name="step3"
          title="Diğer Ayarlar"
          initialValues={initialValues}
          onValuesChange={(changedValues) => {
            if (changedValues.status !== undefined) {
              setCampaignStatus(changedValues.status);
            }
          }}
        >
          <ProFormSelect
            name="status"
            label="Kampanya Durumu"
            initialValue="draft"
            rules={[
              { required: true, message: 'Lütfen kampanya durumunu seçin' },
            ]}
            options={[
              {
                label: 'Taslak',
                value: 'draft',
              },
              {
                label: 'Aktif',
                value: 'active',
              },
            ]}
            tooltip="Taslak: Kampanya kaydedilir ama gönderim yapılmaz. Aktif: Belirlenen tarihlerde otomatik gönderim başlar."
            fieldProps={{
              placeholder: 'Kampanya durumunu seçin',
            }}
          />

          <ProFormSwitch
            name="stop_on_reply"
            label="Yanıt Gelirse Gönderimi Durdur"
            tooltip="Alıcı yanıt verdiğinde, kalan emailler gönderilmeyecek"
          />

          <ProFormText
            name="reply_notification_email"
            label="Yanıt Bildirim Email"
            placeholder="bildirim@platform.com"
            tooltip="Alıcılar yanıt verdiğinde bu adrese bildirim gelecek"
            rules={[
              { type: 'email', message: 'Geçerli bir email adresi girin' },
            ]}
          />
        </StepsForm.StepForm>

        {/* Adım 4: Önizleme */}
        <StepsForm.StepForm name="step4" title="Önizleme">
          <Descriptions title="Program Özeti" bordered column={1}>
            <Descriptions.Item label="Hedef Kişi Sayısı">
              <Tag color="blue">{selectedContacts.length} kişi</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Şablon Sayısı">
              <Tag color="green">{templateSequence.length} email</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="İlk Gönderim">
              {templateSequence.length > 0 && templateSequence[0].scheduled_date
                ? templateSequence[0].scheduled_date
                : 'Belirlenmedi'}
            </Descriptions.Item>
            <Descriptions.Item label="Email Silsilesi">
              {templateSequence.length > 1
                ? `Evet (${templateSequence.length} email sıralı gönderilecek)`
                : 'Tek email'}
            </Descriptions.Item>
            <Descriptions.Item label="Kampanya Durumu">
              <Tag color={campaignStatus === 'active' ? 'green' : 'default'}>
                {campaignStatus === 'active'
                  ? '🟢 Aktif - Otomatik gönderim başlayacak'
                  : '📝 Taslak - Gönderim yapılmayacak'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Card title="Email Gönderim Takvimi" style={{ marginTop: 16 }}>
            <Table
              dataSource={templateSequence.map((item, index) => {
                const template = templates.find(
                  (t) => t.id === item.template_id,
                );
                return {
                  key: index,
                  sequence: index + 1,
                  template: template?.name,
                  delay:
                    item.send_delay_days === 0
                      ? 'Hemen'
                      : `${item.send_delay_days} gün sonra`,
                  date: item.scheduled_date,
                };
              })}
              columns={[
                { title: 'Sıra', dataIndex: 'sequence', width: 80 },
                { title: 'Şablon', dataIndex: 'template' },
                { title: 'Gecikme', dataIndex: 'delay', width: 150 },
                { title: 'Gönderim Tarihi', dataIndex: 'date', width: 200 },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </StepsForm.StepForm>
      </StepsForm>
    </Card>
  );
};

export default CampaignCreateNew;
