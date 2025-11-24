import { StepsForm, ProFormText, ProFormTextArea, ProFormSwitch, ProFormDateTimePicker, ProFormDigit, ProFormSelect, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Card, message, Button, Space, Tag, Table, Descriptions, Modal, Select, Badge, Alert, Divider, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined, ArrowDownOutlined, CloseOutlined } from '@ant-design/icons';
import React, { useState, useEffect, useRef } from 'react';
import { history, useParams } from '@umijs/max';
import { getContacts, getContact } from '@/services/contacts';
import { getTemplates } from '@/services/templates';
import { createCampaign, getCampaign, updateCampaign } from '@/services/campaigns';
import type { Contact, ContactResponse } from '@/types/contact';
import type { EmailTemplate } from '@/types/template';
import type { TemplateInSequence } from '@/types/campaign';
import moment from 'moment';
import './Create.less';

const CampaignCreateNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const contactTableRef = useRef<ActionType>(null);
  const formRef = useRef<any>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [selectedContactDetails, setSelectedContactDetails] = useState<Contact[]>([]);
  const [pendingSelection, setPendingSelection] = useState<number[]>([]);
  const [pendingSelectionDetails, setPendingSelectionDetails] = useState<Contact[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [currentFilters, setCurrentFilters] = useState<any>({});
  const [templateSequence, setTemplateSequence] = useState<TemplateInSequence[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [firstSendDate, setFirstSendDate] = useState<string>('');
  const [intervalDays, setIntervalDays] = useState<number>(3);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | undefined>(undefined);
  const [initialValues, setInitialValues] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string>('draft');

  useEffect(() => {
    loadTemplates();
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
        first_send_date: campaign.first_send_date ? moment(campaign.first_send_date) : undefined,
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
      if (campaign.target_contact_ids && campaign.target_contact_ids.length > 0) {
        // Küçük listeler için otomatik yükle, büyük listeler için manuel
        const contactCount = campaign.target_contact_ids.length;
        
        if (contactCount <= 100) {
          // 100'den az kişi varsa otomatik yükle
          try {
            console.log('Yüklenen contact ID\'leri:', campaign.target_contact_ids);
            const contactPromises = campaign.target_contact_ids.map(contactId =>
              getContact(contactId).catch(err => {
                console.error(`Contact ${contactId} yüklenemedi:`, err);
                return null;
              })
            );
            const contactsResults = await Promise.all(contactPromises);
            console.log('Contact results:', contactsResults);
            const contacts = contactsResults
              .filter((result): result is ContactResponse => result !== null && result?.success === true)
              .map(result => result.data)
              .filter((contact): contact is Contact => contact !== undefined);
            console.log('Başarıyla yüklenen contacts:', contacts.length);
            setSelectedContactDetails(contacts);
            if (contacts.length < contactCount) {
              message.warning(`${contactCount} kişiden ${contacts.length} tanesi yüklenebildi`);
            }
          } catch (error) {
            console.error('Kişiler yüklenirken hata:', error);
            message.warning(`${contactCount} kişi ID'si yüklendi, ancak detaylar getirilemedi`);
          }
        } else {
          // 100'den fazla kişi varsa sadece bildirim göster
          message.info(
            `${contactCount} kişi seçili. Detayları görmek için "Detayları Yükle" butonuna tıklayın.`,
            5
          );
        }
      }
      
      message.success('Program yüklendi');
    } catch (error) {
      message.error('Program yüklenemedi');
      history.push('/campaigns/list');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await getTemplates({ page: 1, limit: 100, status: 'active' });
      setTemplates(response.data);
    } catch (error) {
      message.error('Şablonlar yüklenemedi');
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
      console.log('Manuel yükleme - Contact ID\'leri:', selectedContacts);
      // Promise.all ile paralel yükleme
      const contactPromises = selectedContacts.map(contactId =>
        getContact(contactId).catch(err => {
          console.error(`Contact ${contactId} yüklenemedi:`, err);
          return null;
        })
      );
      const contactsResults = await Promise.all(contactPromises);
      console.log('Manuel yükleme - Contact results:', contactsResults);
      const contacts = contactsResults
        .filter((result): result is ContactResponse => result !== null && result?.success === true)
        .map(result => result.data)
        .filter((contact): contact is Contact => contact !== undefined);
      
      console.log('Manuel yükleme - Başarıyla yüklenen contacts:', contacts.length);
      setSelectedContactDetails(contacts);
      
      if (contacts.length < selectedContacts.length) {
        message.warning(`${selectedContacts.length} kişiden ${contacts.length} tanesi yüklenebildi`);
      } else {
        message.success(`${contacts.length} kişi detayı başarıyla yüklendi`);
      }
    } catch (error) {
      console.error('Kişiler yüklenirken hata:', error);
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
    
    const existingDetails = selectedContactDetails.filter(c => uniqueIds.includes(c.id));
    const newDetails = pendingSelectionDetails.filter(c => !selectedContactDetails.some(sc => sc.id === c.id));
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
      const { page, pageSize, ...otherFilters } = currentFilters;
      const response = await getContacts({
        ...otherFilters,
        page: 1,
        pageSize: filteredTotal,
      });
      
      const allContacts = response.data;
      const newIds = [...selectedContacts, ...allContacts.map(c => c.id)];
      const uniqueIds = [...new Set(newIds)];
      setSelectedContacts(uniqueIds);
      
      const existingDetails = selectedContactDetails.filter(c => uniqueIds.includes(c.id));
      const newDetails = allContacts.filter(c => !selectedContactDetails.some(sc => sc.id === c.id));
      setSelectedContactDetails([...existingDetails, ...newDetails]);
      
      message.success(`${allContacts.length} kişi kampanyaya eklendi`);
    } catch (error) {
      message.error('Kişiler eklenirken hata oluştu');
    }
  };

  // Seçilen kişiyi çıkar
  const handleRemoveContact = (contactId: number) => {
    setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    setSelectedContactDetails(selectedContactDetails.filter(c => c.id !== contactId));
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
        if (!record.custom_fields || Object.keys(record.custom_fields).length === 0) {
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
              <Tag color="default" style={{ fontSize: 11 }}>+{fields.length - 2}</Tag>
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
        const colors = { active: 'green', unsubscribed: 'default', bounced: 'red', complained: 'orange' };
        const labels = { active: 'Aktif', unsubscribed: 'İptal', bounced: 'Bounce', complained: 'Şikayet' };
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
        return <Tag color={colors[record.subscription_status]}>{labels[record.subscription_status]}</Tag>;
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
      render: (_: any, record: Contact) => `${record.first_name} ${record.last_name}`,
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
            <Tag color="default" style={{ fontSize: 11 }}>+{record.tags.length - 2}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Özel Alanlar',
      key: 'custom_fields',
      render: (_: any, record: Contact) => {
        if (!record.custom_fields || Object.keys(record.custom_fields).length === 0) {
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
              <Tag color="default" style={{ fontSize: 11 }}>+{fields.length - 2}</Tag>
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
        const colors = { active: 'green', unsubscribed: 'default', bounced: 'red', complained: 'orange' };
        const labels = { active: 'Aktif', unsubscribed: 'İptal', bounced: 'Bounce', complained: 'Şikayet' };
        return <Tag color={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Tag>;
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
  const addTemplate = () => {
    if (!selectedTemplate) {
      message.warning('Lütfen bir şablon seçin');
      return;
    }
    
    const lastDelay = templateSequence.length > 0 
      ? templateSequence[templateSequence.length - 1].send_delay_days + intervalDays
      : 0;
    
    const scheduledDate = firstSendDate 
      ? moment(firstSendDate).add(lastDelay, 'days').format('YYYY-MM-DD HH:mm:ss')
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

  const removeTemplate = (index: number) => {
    const newSequence = templateSequence.filter((_, i) => i !== index);
    recalculateDates(newSequence);
  };

  const recalculateDates = (sequence: TemplateInSequence[]) => {
    const updated = sequence.map((item, index) => {
      const delay = index === 0 ? 0 : sequence[index - 1].send_delay_days + intervalDays;
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

  const handleFirstSendDateChange = (dateString: string) => {
    setFirstSendDate(dateString);
    if (templateSequence.length > 0) {
      const updated = templateSequence.map((item) => ({
        ...item,
        scheduled_date: dateString
          ? moment(dateString).add(item.send_delay_days, 'days').format('YYYY-MM-DD HH:mm:ss')
          : '',
      }));
      setTemplateSequence(updated);
    }
  };

  // Tek bir şablon için tarihi değiştir
  const handleTemplateDateChange = (index: number, dateString: string) => {
    const updated = [...templateSequence];
    updated[index] = {
      ...updated[index],
      scheduled_date: dateString,
    };
    setTemplateSequence(updated);
  };

  const handleIntervalChange = (value: number | null) => {
    if (value) {
      setIntervalDays(value);
      // Interval değiştiğinde tarihleri otomatik yeniden hesapla
      if (templateSequence.length > 0 && firstSendDate) {
        const updated = templateSequence.map((item, index) => {
          const delay = index === 0 ? 0 : index * value; // Her şablon için index * interval
          const scheduled = moment(firstSendDate).add(delay, 'days').format('YYYY-MM-DD HH:mm:ss');
          return {
            ...item,
            send_delay_days: delay,
            scheduled_date: scheduled,
          };
        });
        setTemplateSequence(updated);
        message.success(`Tarihler ${value} gün aralığa göre güncellendi`);
      }
    }
  };

  return (
    <Card 
      className="campaign-create-form"
      title={
        <h2 style={{ margin: 0 }}>
          {isEditMode ? 'Email Programını Düzenle' : 'Yeni Email Programı Oluştur'}
        </h2>
      }
      style={{ 
        maxWidth: '1800px', 
        width: '100%',
        overflowX: 'hidden', 
        padding: 0, 
        margin: '24px auto' 
      }}
      styles={{ body: { padding: window.innerWidth <= 768 ? 8 : 24 } }}
      loading={loading}
    >
      <StepsForm
        formRef={formRef}
        onFinish={async (values) => {
          try {
            const campaignData = {
              name: values.name,
              description: values.description,
              target_contact_ids: selectedContacts,
              is_recurring: isRecurring,
              template_sequence: templateSequence,
              first_send_date: firstSendDate,
              recurrence_interval_days: isRecurring ? intervalDays : undefined,
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
          } catch (error) {
            message.error(isEditMode ? 'Güncelleme işlemi başarısız oldu' : 'Oluşturma işlemi başarısız oldu');
            return false;
          }
        }}
        stepsFormRender={(dom, submitter) => {
          // Submitter'ı parçalara ayır
          const submitterArray = Array.isArray(submitter) ? submitter : [submitter];
          const previousButton = submitterArray.find((btn: any) => btn?.key === 'pre');
          const nextButtons = submitterArray.filter((btn: any) => btn?.key !== 'pre');
          
          return (
            <div>
              {dom}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
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
                    <span>Seçilen: <strong>{pendingSelection.length}</strong> kişi</span>
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
                onFinish: async (values) => {
                  // Enter tuşuna basıldığında reload tetikle
                  contactTableRef.current?.reload();
                }
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
                    subscription_status: params.subscription_status || undefined,
                    tags: params.tags || undefined,
                    custom_fields: params.custom_fields || undefined,
                    search: searchTerm || undefined,
                    customer_representative: params.customer_representative || undefined,
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
                } catch (error) {
                  message.error('Kişiler yüklenemedi');
                  return { data: [], success: false, total: 0 };
                }
              }}
              columns={contactColumns}
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
              toolBarRender={false}
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
                {selectedContacts.length > 0 && selectedContactDetails.length === 0 && (
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
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                {selectedContacts.length > 0 ? (
                  <>
                    <Badge count={selectedContacts.length} showZero style={{ fontSize: 32, marginBottom: 16 }} />
                    <p style={{ fontSize: 16, marginTop: 16 }}>
                      <strong>{selectedContacts.length} kişi seçildi</strong>
                    </p>
                    <p style={{ color: '#666' }}>
                      Kişi detaylarını görmek için yukarıdaki "Detayları Yükle" butonuna tıklayın
                    </p>
                  </>
                ) : (
                  <>
                    <ArrowDownOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <p>Yukarıdaki tablodan kişi seçin ve "Kampanyaya Ekle" butonuna tıklayın</p>
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
              onChange: (checked) => {
                // Tekrarlayan email kapatıldığında sadece ilk şablonu bırak
                if (!checked && templateSequence.length > 1) {
                  Modal.confirm({
                    title: 'Şablonları Temizle',
                    content: `Tekrarlayan email kapatıldı. Sadece ilk şablon kalacak, diğer ${templateSequence.length - 1} şablon silinecek. Devam edilsin mi?`,
                    okText: 'Evet, Temizle',
                    cancelText: 'İptal',
                    onOk: () => {
                      setTemplateSequence([templateSequence[0]]);
                      setIsRecurring(false);
                      message.success('Sadece ilk şablon kaldı');
                    },
                    onCancel: () => {
                      // Kullanıcı iptal ederse, switch'i geri aç
                      setIsRecurring(true);
                      // Form değerini de geri döndür
                      formRef.current?.setFieldsValue({
                        is_recurring: true,
                      });
                    },
                  });
                } else {
                  setIsRecurring(checked);
                }
              },
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
              onChange: (_, dateString) => handleFirstSendDateChange(dateString as string),
            }}
          />

          {isRecurring && (
            <ProFormDigit
              name="interval_days"
              label="Kaç Günde Bir Tekrarlansın?"
              min={1}
              max={365}
              fieldProps={{
                onChange: handleIntervalChange,
              }}
            />
          )}

          <Card 
            title="Şablonlar" 
            style={{ 
              marginTop: 16,
              maxWidth: '100%'
            }}
          >
            <Space direction="vertical" style={{ width: '100%', gap: 16 }}>
              {templateSequence.map((item, index) => {
                const template = templates.find((t) => t.id === item.template_id);
                return (
                  <Card
                    key={index}
                    size="small"
                    title={`${index + 1}. Email`}
                    style={{ 
                      backgroundColor: '#fafafa',
                      border: '1px solid #d9d9d9'
                    }}
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
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                          <strong>Şablon:</strong> {template?.name}
                        </div>
                        <div>
                          <strong>Gönderim Gecikmesi:</strong> {item.send_delay_days === 0 ? 'Hemen' : `${item.send_delay_days} gün sonra`}
                        </div>
                      </div>
                      
                      <div>
                        <strong>Gönderim Tarihi:</strong>
                        <DatePicker
                          showTime={{ format: 'HH:mm' }}
                          format="YYYY-MM-DD HH:mm"
                          value={item.scheduled_date ? moment(item.scheduled_date) : null}
                          onChange={(date, dateString) => {
                            handleTemplateDateChange(index, dateString as string);
                          }}
                          style={{ marginLeft: 8, width: 250 }}
                          placeholder="Tarih seçin"
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
                disabled={!isRecurring && templateSequence.length >= 1}
                onClick={() => {
                  if (!firstSendDate) {
                    message.warning('Önce gönderim tarihi seçmelisiniz');
                    return;
                  }
                  // Tekrarlayan email kapalıysa ve zaten 1 şablon varsa ekleme yapma
                  if (!isRecurring && templateSequence.length >= 1) {
                    message.warning('Tekrarlayan email kapalıyken sadece 1 şablon ekleyebilirsiniz');
                    return;
                  }
                  setTemplateModalVisible(true);
                }}
              >
                {templateSequence.length === 0 ? 'İlk Şablonu Ekle' : 'Yeni Şablon Ekle'}
              </Button>
              
              {!isRecurring && templateSequence.length >= 1 && (
                <Tag color="orange" icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                  Tekrarlayan email açık olmalı - Birden fazla şablon eklemek için yukarıdan açın
                </Tag>
              )}
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
          >
            <Select
              style={{ width: '100%' }}
              placeholder="Bir şablon seçin"
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              options={templates.map((t) => ({
                label: `${t.name} (${t.category})`,
                value: t.id,
              }))}
            />
          </Modal>
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
            rules={[{ required: true, message: 'Lütfen kampanya durumunu seçin' }]}
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
            rules={[{ type: 'email', message: 'Geçerli bir email adresi girin' }]}
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
            <Descriptions.Item label="Kampanya Durumu">
              <Tag color={campaignStatus === 'active' ? 'green' : 'default'}>
                {campaignStatus === 'active' ? '🟢 Aktif - Otomatik gönderim başlayacak' : '📝 Taslak - Gönderim yapılmayacak'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Card title="Email Gönderim Takvimi" style={{ marginTop: 16 }}>
            <Table
              dataSource={templateSequence.map((item, index) => {
                const template = templates.find((t) => t.id === item.template_id);
                return {
                  key: index,
                  sequence: index + 1,
                  template: template?.name,
                  delay: item.send_delay_days === 0 ? 'Hemen' : `${item.send_delay_days} gün sonra`,
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
