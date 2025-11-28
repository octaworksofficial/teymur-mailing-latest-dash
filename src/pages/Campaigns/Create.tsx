import {
  ArrowRightOutlined,
  CloseOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
  ProTable,
  StepsForm,
} from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Modal,
  message,
  Pagination,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { createCampaign } from '@/services/campaigns';
import { getContacts } from '@/services/contacts';
import { getTemplates } from '@/services/templates';
import type { TemplateInSequence } from '@/types/campaign';
import type { Contact } from '@/types/contact';
import type { EmailTemplate } from '@/types/template';
import './Create.less';

const CampaignCreate: React.FC = () => {
  const contactTableRef = useRef<ActionType>(null);
  const [_contacts, _setContacts] = useState<Contact[]>([]);
  const [_allFilteredContacts, setAllFilteredContacts] = useState<Contact[]>(
    [],
  ); // Filtrelenmiş tüm kişiler
  const [filteredTotal, setFilteredTotal] = useState<number>(0); // Filtrelenmiş toplam sayı
  const [currentFilters, setCurrentFilters] = useState<any>({}); // Aktif filtreler
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedContactDetails, setSelectedContactDetails] = useState<
    Contact[]
  >([]);
  const [selectedPage, setSelectedPage] = useState<number>(1); // Sağ panel pagination
  const [selectedPageSize, setSelectedPageSize] = useState<number>(10); // Sağ panel page size
  const [pendingSelection, setPendingSelection] = useState<number[]>([]); // Bekleyen seçimler
  const [pendingSelectionDetails, setPendingSelectionDetails] = useState<
    Contact[]
  >([]); // Bekleyen seçim detayları
  const [templateSequence, setTemplateSequence] = useState<
    TemplateInSequence[]
  >([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [firstSendDate, setFirstSendDate] = useState<string>('');
  const [intervalDays, setIntervalDays] = useState<number>(3);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>(
    undefined,
  );

  // Kişileri yükle
  useEffect(() => {
    loadTemplates();
  }, []);

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

  // Bekleyen seçimleri sağ panele aktar
  const handleTransferSelected = () => {
    if (pendingSelection.length === 0) {
      message.warning('Lütfen aktarılacak kişileri seçin');
      return;
    }

    const newIds = [...selectedContacts, ...pendingSelection];
    const uniqueIds = [...new Set(newIds)];
    setSelectedContacts(uniqueIds);

    // Detay listesini güncelle
    const existingDetails = selectedContactDetails.filter((c) =>
      uniqueIds.includes(c.id),
    );
    const newDetails = pendingSelectionDetails.filter(
      (c) => !selectedContactDetails.some((sc) => sc.id === c.id),
    );
    setSelectedContactDetails([...existingDetails, ...newDetails]);

    // Bekleyen seçimleri temizle
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

    // Tüm filtrelenmiş kişileri çek (pagination olmadan)
    try {
      // Mevcut filtreleri kullan (page ve pageSize hariç)
      const { page: _, pageSize: __, ...otherFilters } = currentFilters;
      const response = await getContacts({
        ...otherFilters, // Aktif filtreleri uygula
        page: 1,
        pageSize: filteredTotal, // Tüm kayıtları çek
      });

      const allContacts = response.data;
      const newIds = [...selectedContacts, ...allContacts.map((c) => c.id)];
      const uniqueIds = [...new Set(newIds)];
      setSelectedContacts(uniqueIds);

      // Detay listesini güncelle
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

  // Seçilen kişileri detay listesine ekle (ARTIK DOĞRUDAN EKLEME YOK)
  const _handleAddContacts = (_contactsToAdd: Contact[]) => {
    // Bu fonksiyon artık kullanılmıyor - sadece row selection için
  };

  // Seçilen kişiyi çıkar
  const handleRemoveContact = (contactId: number) => {
    setSelectedContacts(selectedContacts.filter((id) => id !== contactId));
    setSelectedContactDetails(
      selectedContactDetails.filter((c) => c.id !== contactId),
    );
  };

  // Kişi seçim tablosu kolonları
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
    },
    {
      title: 'Müşteri Temsilcisi',
      dataIndex: 'customer_representative',
      ellipsis: true,
      width: 150,
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
      fieldProps: {
        placeholder: 'Etiket ara (virgülle ayırın)',
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
      valueEnum: {
        active: { text: 'Aktif', status: 'Success' },
        unsubscribed: { text: 'Abonelik İptal', status: 'Default' },
        bounced: { text: 'Bounce', status: 'Error' },
        complained: { text: 'Şikayet', status: 'Warning' },
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
      valueEnum: {
        subscribed: { text: 'Abone', status: 'Success' },
        unsubscribed: { text: 'Değil', status: 'Default' },
        pending: { text: 'Bekliyor', status: 'Processing' },
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

  // Şablon dizisine yeni şablon ekle
  const addTemplate = () => {
    if (!selectedTemplate) {
      message.warning('Lütfen bir şablon seçin');
      return;
    }

    const lastDelay =
      templateSequence.length > 0
        ? templateSequence[templateSequence.length - 1].send_delay_days +
          intervalDays
        : 0;

    const scheduledDate = firstSendDate
      ? moment(firstSendDate)
          .add(lastDelay, 'days')
          .format('YYYY-MM-DD HH:mm:ss')
      : '';

    setTemplateSequence([
      ...templateSequence,
      {
        template_id: selectedTemplate,
        send_delay_days: lastDelay,
        scheduled_date: scheduledDate,
      },
    ]);

    setTemplateModalVisible(false);
    setSelectedTemplate(undefined);
  };

  // Şablon sil
  const removeTemplate = (index: number) => {
    const newSequence = templateSequence.filter((_, i) => i !== index);
    // Tarihleri yeniden hesapla
    recalculateDates(newSequence);
  };

  // Tarihleri yeniden hesapla
  const recalculateDates = (sequence: TemplateInSequence[]) => {
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

  // İlk gönderim tarihi değiştiğinde tüm tarihleri güncelle
  const handleFirstSendDateChange = (dateString: string) => {
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

  // Aralık değiştiğinde tarihleri güncelle
  const handleIntervalChange = (value: number | null) => {
    if (value) {
      setIntervalDays(value);
      recalculateDates(templateSequence);
    }
  };

  return (
    <Card
      className="campaign-create-form"
      style={{
        maxWidth: '100%',
        overflowX: 'hidden',
        margin: 0,
        padding: 0,
      }}
      styles={{ body: { padding: window.innerWidth <= 768 ? 4 : 24 } }}
    >
      <StepsForm
        onFinish={async (values) => {
          try {
            await createCampaign({
              name: values.name,
              description: values.description,
              target_contact_ids: selectedContacts,
              is_recurring: isRecurring,
              template_sequence: templateSequence,
              first_send_date: firstSendDate,
              recurrence_interval_days: isRecurring ? intervalDays : undefined,
              stop_on_reply: values.stop_on_reply,
              reply_notification_email: values.reply_notification_email,
              status: 'draft',
            });
            message.success('Email programı başarıyla oluşturuldu');
            history.push('/campaigns/list');
            return true;
          } catch (_error) {
            message.error('Oluşturma işlemi başarısız oldu');
            return false;
          }
        }}
        formProps={{
          validateMessages: {
            required: 'Bu alan zorunludur',
          },
        }}
        stepsFormRender={(dom, submitter) => {
          return (
            <div>
              {dom}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: 24,
                }}
              >
                {submitter}
              </div>
            </div>
          );
        }}
      >
        {/* Adım 1: Hedef Kitle */}
        <StepsForm.StepForm
          name="step1"
          title="Hedef Kitle"
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

          <Row gutter={[16, 16]}>
            {/* Sol: Tüm Kişiler Tablosu */}
            <Col xs={24} sm={24} md={24} lg={14} xl={14}>
              {/* Seçim Alert'i - Sabit pozisyon */}
              {pendingSelection.length > 0 && (
                <Card
                  size="small"
                  style={{
                    marginBottom: 8,
                    marginLeft: 0,
                    marginRight: 0,
                    backgroundColor: '#e6f7ff',
                    borderColor: '#91d5ff',
                    maxWidth: '100%',
                  }}
                  styles={{ body: { padding: '6px 8px' } }}
                >
                  <Space size={16}>
                    <span>
                      Seçilen: <strong>{pendingSelection.length}</strong> kişi
                    </span>
                    <Button
                      type="primary"
                      size="small"
                      icon={<ArrowRightOutlined />}
                      onClick={handleTransferSelected}
                    >
                      Seçilenleri Aktar
                    </Button>
                    <Button
                      type="dashed"
                      size="small"
                      onClick={handleAddAllFiltered}
                    >
                      Filtrelenen Tüm Listeyi Dahil Et ({filteredTotal} kişi)
                    </Button>
                  </Space>
                </Card>
              )}

              <Card
                title={<span>📋 Tüm Kişiler</span>}
                size="small"
                styles={{ body: { padding: 0 } }}
                style={{
                  height:
                    window.innerWidth > 768 ? 'calc(100vh - 400px)' : 'auto',
                  minHeight: window.innerWidth > 768 ? 600 : 400,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <ProTable<Contact>
                  actionRef={contactTableRef}
                  rowKey="id"
                  size="small"
                  search={{
                    labelWidth: 80,
                    defaultCollapsed: false,
                    collapseRender: false,
                    optionRender: false,
                  }}
                  form={{
                    component: false, // Form tag'i oluşturma
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

                      // Aktif filtreleri sakla (tüm listeyi eklerken kullanmak için)
                      setCurrentFilters(filters);

                      // ProTable params'ı backend API'ye map et
                      const response = await getContacts(filters);

                      // Filtrelenmiş toplam sayıyı sakla
                      setFilteredTotal(response.total);
                      setAllFilteredContacts(response.data);

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
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50'],
                    style: { marginTop: 16, marginRight: 16, marginBottom: 16 },
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
                  scroll={{ x: 1400 }}
                  toolBarRender={false}
                />
              </Card>
            </Col>{' '}
            {/* Sağ: Seçilen Kişiler */}
            <Col xs={24} sm={24} md={24} lg={10} xl={10}>
              <Card
                title={
                  <Space>
                    <span>✅ Seçilen Kişiler</span>
                    <Badge count={selectedContacts.length} showZero />
                  </Space>
                }
                size="small"
                styles={{ body: { padding: 12 } }}
                style={{ height: '100%' }}
              >
                {selectedContactDetails.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '40px 0',
                      color: '#999',
                      minHeight: window.innerWidth > 768 ? 600 : 300,
                    }}
                  >
                    <ArrowRightOutlined
                      style={{ fontSize: 32, marginBottom: 16 }}
                    />
                    <p>Sol tablodan kişi seçin</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height:
                        window.innerWidth > 768
                          ? 'calc(100vh - 400px)'
                          : 'auto',
                      minHeight: window.innerWidth > 768 ? 600 : 300,
                    }}
                  >
                    <div
                      style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}
                    >
                      <Space
                        direction="vertical"
                        style={{ width: '100%' }}
                        size="small"
                      >
                        {selectedContactDetails
                          .slice(
                            (selectedPage - 1) * selectedPageSize,
                            selectedPage * selectedPageSize,
                          )
                          .map((contact) => (
                            <Card
                              key={contact.id}
                              size="small"
                              hoverable
                              extra={
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<CloseOutlined />}
                                  onClick={() =>
                                    handleRemoveContact(contact.id)
                                  }
                                />
                              }
                            >
                              <div>
                                <strong>
                                  {contact.first_name} {contact.last_name}
                                </strong>
                                {contact.position && (
                                  <span
                                    style={{
                                      color: '#999',
                                      fontSize: 11,
                                      marginLeft: 4,
                                    }}
                                  >
                                    • {contact.position}
                                  </span>
                                )}
                                <br />
                                <small style={{ color: '#666' }}>
                                  📧 {contact.email}
                                </small>
                                {contact.phone && (
                                  <>
                                    <br />
                                    <small style={{ color: '#666' }}>
                                      📱 {contact.phone}
                                    </small>
                                  </>
                                )}
                                {contact.company && (
                                  <>
                                    <br />
                                    <small style={{ color: '#999' }}>
                                      🏢 {contact.company}
                                    </small>
                                  </>
                                )}
                                <div style={{ marginTop: 6 }}>
                                  <Space size={[4, 4]} wrap>
                                    <Tag
                                      color={
                                        contact.status === 'active'
                                          ? 'green'
                                          : 'default'
                                      }
                                      style={{ fontSize: 10, margin: 0 }}
                                    >
                                      {contact.status}
                                    </Tag>
                                    <Badge
                                      count={contact.engagement_score || 0}
                                      showZero
                                      color={
                                        (contact.engagement_score || 0) > 70
                                          ? 'green'
                                          : (contact.engagement_score || 0) > 40
                                            ? 'orange'
                                            : 'red'
                                      }
                                      style={{ fontSize: 10 }}
                                    />
                                    {contact.tags?.slice(0, 2).map((tag) => (
                                      <Tag
                                        key={tag}
                                        color="blue"
                                        style={{ fontSize: 10, margin: 0 }}
                                      >
                                        {tag}
                                      </Tag>
                                    ))}
                                  </Space>
                                </div>
                                {contact.custom_fields &&
                                  Object.keys(contact.custom_fields).length >
                                    0 && (
                                    <div
                                      style={{
                                        marginTop: 6,
                                        paddingTop: 6,
                                        borderTop: '1px solid #f0f0f0',
                                      }}
                                    >
                                      <small
                                        style={{ color: '#999', fontSize: 10 }}
                                      >
                                        Ö. Alanlar:
                                      </small>
                                      <div style={{ marginTop: 2 }}>
                                        <Space size={[4, 4]} wrap>
                                          {Object.entries(contact.custom_fields)
                                            .slice(0, 3)
                                            .map(([key, value]) => (
                                              <Tag
                                                key={key}
                                                color="purple"
                                                style={{
                                                  fontSize: 10,
                                                  margin: 0,
                                                }}
                                              >
                                                {key}:{' '}
                                                {String(value).substring(0, 10)}
                                              </Tag>
                                            ))}
                                          {Object.keys(contact.custom_fields)
                                            .length > 3 && (
                                            <Tag
                                              color="default"
                                              style={{
                                                fontSize: 10,
                                                margin: 0,
                                              }}
                                            >
                                              +
                                              {Object.keys(
                                                contact.custom_fields,
                                              ).length - 3}
                                            </Tag>
                                          )}
                                        </Space>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </Card>
                          ))}
                      </Space>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Button
                        danger
                        size="small"
                        onClick={() => {
                          setSelectedContacts([]);
                          setSelectedContactDetails([]);
                          setSelectedPage(1);
                        }}
                      >
                        Tümünü Temizle
                      </Button>

                      <Pagination
                        size="small"
                        current={selectedPage}
                        pageSize={selectedPageSize}
                        total={selectedContactDetails.length}
                        onChange={(page: number, pageSize?: number) => {
                          setSelectedPage(page);
                          if (pageSize) setSelectedPageSize(pageSize);
                        }}
                        showSizeChanger
                        showQuickJumper
                        showTotal={(total: number) => `Toplam ${total} kişi`}
                        pageSizeOptions={['5', '10', '20', '50']}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </StepsForm.StepForm>

        {/* Adım 2: Şablon Seçimi */}
        <StepsForm.StepForm
          name="step2"
          title="Şablon Seçimi"
          onFinish={async () => {
            if (templateSequence.length === 0) {
              message.error('Lütfen en az bir şablon seçin');
              return false;
            }
            if (!firstSendDate) {
              message.error('Lütfen gönderim tarihi seçin');
              return false;
            }
            return true;
          }}
        >
          <ProFormSwitch
            name="is_recurring"
            label="Tekrarlayan Email"
            fieldProps={{
              checked: isRecurring,
              onChange: setIsRecurring,
            }}
          />

          <ProFormDateTimePicker
            name="first_send_date"
            label={isRecurring ? 'İlk Gönderim Tarihi' : 'Gönderim Tarihi'}
            rules={[{ required: true }]}
            fieldProps={{
              style: { width: '100%' },
              showTime: { format: 'HH:mm' },
              format: 'YYYY-MM-DD HH:mm',
              onChange: (_, dateString) =>
                handleFirstSendDateChange(dateString as string),
            }}
          />

          {isRecurring && (
            <ProFormDigit
              name="interval_days"
              label="Kaç Günde Bir Tekrarlansın?"
              initialValue={3}
              min={1}
              max={365}
              fieldProps={{
                onChange: handleIntervalChange,
              }}
              tooltip="Her şablon bir öncekinden bu kadar gün sonra gönderilecek"
            />
          )}

          <Card title="Şablonlar" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {templateSequence.map((item, index) => {
                const template = templates.find(
                  (t) => t.id === item.template_id,
                );
                return (
                  <Card
                    key={`template-${item.template_id}-${index}`}
                    size="small"
                    title={`${index + 1}. Email`}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeTemplate(index)}
                      >
                        Sil
                      </Button>
                    }
                  >
                    <p>
                      <strong>Şablon:</strong> {template?.name}
                    </p>
                    <p>
                      <strong>Gönderim:</strong>{' '}
                      {item.send_delay_days === 0
                        ? 'Hemen'
                        : `${item.send_delay_days} gün sonra`}
                    </p>
                    <p>
                      <strong>Tarih:</strong>{' '}
                      {item.scheduled_date || 'Tarih seçilmedi'}
                    </p>
                  </Card>
                );
              })}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                block
                onClick={() => {
                  if (!firstSendDate) {
                    message.warning('Önce gönderim tarihi seçmelisiniz');
                    return;
                  }
                  setTemplateModalVisible(true);
                }}
              >
                {templateSequence.length === 0
                  ? 'İlk Şablonu Ekle'
                  : 'Yeni Şablon Ekle'}
              </Button>

              {!firstSendDate && (
                <Tag color="orange">Önce gönderim tarihi seçmelisiniz</Tag>
              )}
            </Space>
          </Card>

          {/* Şablon Seçim Modal */}
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
          >
            <Select
              style={{ width: '100%' }}
              placeholder="Bir şablon seçin"
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              options={templates
                .filter(
                  (t) => !templateSequence.some((s) => s.template_id === t.id),
                )
                .map((t) => ({
                  label: `${t.name} (${t.category})`,
                  value: t.id,
                }))}
            />
          </Modal>
        </StepsForm.StepForm>

        {/* Adım 3: Diğer Ayarlar */}
        <StepsForm.StepForm name="step3" title="Diğer Ayarlar">
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
              {firstSendDate || 'Belirlenmedi'}
            </Descriptions.Item>
            <Descriptions.Item label="Tekrarlayan Email">
              {isRecurring ? `Evet (${intervalDays} günde bir)` : 'Hayır'}
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

export default CampaignCreate;
