import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal, message, Popconfirm, Select, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  copyYear,
  createSpecialDay,
  deleteSpecialDay,
  getSpecialDays,
  getSpecialDayYears,
  type SpecialDay,
  updateSpecialDay,
} from '@/services/specialDays';

// Tarih formatını YYYY-MM-DD'ye çevir
const formatDateToISO = (dateValue: any): string => {
  if (!dateValue) return '';

  // Zaten dayjs objesi ise
  if (dayjs.isDayjs(dateValue)) {
    return dateValue.format('YYYY-MM-DD');
  }

  // String ise
  if (typeof dateValue === 'string') {
    // DD.MM.YYYY formatı
    if (dateValue.includes('.')) {
      const parts = dateValue.split('.');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    // Zaten YYYY-MM-DD formatında
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // Dayjs ile parse etmeyi dene
    const parsed = dayjs(dateValue);
    if (parsed.isValid()) {
      return parsed.format('YYYY-MM-DD');
    }
  }

  return '';
};

// Özel gün tipleri
const SPECIAL_DAY_TYPES = [
  // Dini Bayramlar
  {
    value: 'ramazan_bayrami_1',
    label: 'Ramazan Bayramı 1. Gün',
    category: 'dini',
  },
  {
    value: 'ramazan_bayrami_2',
    label: 'Ramazan Bayramı 2. Gün',
    category: 'dini',
  },
  {
    value: 'ramazan_bayrami_3',
    label: 'Ramazan Bayramı 3. Gün',
    category: 'dini',
  },
  {
    value: 'kurban_bayrami_1',
    label: 'Kurban Bayramı 1. Gün',
    category: 'dini',
  },
  {
    value: 'kurban_bayrami_2',
    label: 'Kurban Bayramı 2. Gün',
    category: 'dini',
  },
  {
    value: 'kurban_bayrami_3',
    label: 'Kurban Bayramı 3. Gün',
    category: 'dini',
  },
  {
    value: 'kurban_bayrami_4',
    label: 'Kurban Bayramı 4. Gün',
    category: 'dini',
  },
  { value: 'kandil_mevlid', label: 'Mevlid Kandili', category: 'dini' },
  { value: 'kandil_regaip', label: 'Regaip Kandili', category: 'dini' },
  { value: 'kandil_mirac', label: 'Miraç Kandili', category: 'dini' },
  { value: 'kandil_berat', label: 'Berat Kandili', category: 'dini' },
  { value: 'kandil_kadir', label: 'Kadir Gecesi', category: 'dini' },
  // Milli Bayramlar
  { value: 'yilbasi', label: 'Yılbaşı', category: 'milli' },
  {
    value: 'ulusal_egemenlik',
    label: '23 Nisan Ulusal Egemenlik',
    category: 'milli',
  },
  { value: 'isci_bayrami', label: '1 Mayıs İşçi Bayramı', category: 'milli' },
  {
    value: 'genclik_bayrami',
    label: '19 Mayıs Gençlik Bayramı',
    category: 'milli',
  },
  {
    value: 'demokrasi_bayrami',
    label: '15 Temmuz Demokrasi Bayramı',
    category: 'milli',
  },
  {
    value: 'zafer_bayrami',
    label: '30 Ağustos Zafer Bayramı',
    category: 'milli',
  },
  {
    value: 'cumhuriyet_bayrami',
    label: '29 Ekim Cumhuriyet Bayramı',
    category: 'milli',
  },
  // Özel Günler
  { value: 'sevgililer_gunu', label: 'Sevgililer Günü', category: 'ozel' },
  { value: 'kadinlar_gunu', label: 'Kadınlar Günü', category: 'ozel' },
  { value: 'anneler_gunu', label: 'Anneler Günü', category: 'ozel' },
  { value: 'babalar_gunu', label: 'Babalar Günü', category: 'ozel' },
  { value: 'ogretmenler_gunu', label: 'Öğretmenler Günü', category: 'ozel' },
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'dini':
      return 'green';
    case 'milli':
      return 'blue';
    case 'ozel':
      return 'orange';
    default:
      return 'default';
  }
};

const getCategoryLabel = (category: string) => {
  switch (category) {
    case 'dini':
      return 'Dini Bayram';
    case 'milli':
      return 'Milli Bayram';
    case 'ozel':
      return 'Özel Gün';
    default:
      return category;
  }
};

const SpecialDays: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [copyModalVisible, setCopyModalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<SpecialDay | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    undefined,
  );
  const [years, setYears] = useState<number[]>([]);
  const [copySourceYear, setCopySourceYear] = useState<number | undefined>(
    undefined,
  );
  const [copyTargetYear, setCopyTargetYear] = useState<number | undefined>(
    undefined,
  );

  // Yılları yükle
  useEffect(() => {
    loadYears();
  }, []);

  const loadYears = async () => {
    try {
      const response = await getSpecialDayYears();
      if (response.success) {
        setYears(response.data);
      }
    } catch (error) {
      console.error('Yıllar yüklenemedi:', error);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const dayType = SPECIAL_DAY_TYPES.find(
        (d) => d.value === values.day_type,
      );
      // Tarihi YYYY-MM-DD formatına çevir
      const formattedDate = formatDateToISO(values.actual_date);

      const response = await createSpecialDay({
        year: values.year,
        day_type: values.day_type,
        day_name: dayType?.label || values.day_name,
        actual_date: formattedDate,
        category: dayType?.category || 'ozel',
      });
      if (response.success) {
        message.success(response.message);
        setCreateModalVisible(false);
        actionRef.current?.reload();
        loadYears();
        return true;
      }
    } catch (error: any) {
      console.error('Create special day error:', error);
      // Axios hata yanıtından mesajı al
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Özel gün eklenemedi';
      message.error(errorMessage);
    }
    return false;
  };

  const handleUpdate = async (values: any) => {
    if (!currentRecord) return false;
    try {
      // Tarihi YYYY-MM-DD formatına çevir
      const formattedDate = formatDateToISO(values.actual_date);

      const response = await updateSpecialDay(currentRecord.id, {
        actual_date: formattedDate,
        day_name: values.day_name,
      });
      if (response.success) {
        message.success(response.message);
        setEditModalVisible(false);
        setCurrentRecord(null);
        actionRef.current?.reload();
        return true;
      }
    } catch (error: any) {
      console.error('Update special day error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Özel gün güncellenemedi';
      message.error(errorMessage);
    }
    return false;
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteSpecialDay(id);
      if (response.success) {
        message.success(response.message);
        actionRef.current?.reload();
      }
    } catch (error: any) {
      console.error('Delete special day error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Özel gün silinemedi';
      message.error(errorMessage);
    }
  };

  const handleCopyYear = async () => {
    if (!copySourceYear || !copyTargetYear) {
      message.error('Kaynak ve hedef yıl seçiniz');
      return;
    }
    try {
      const response = await copyYear(copySourceYear, copyTargetYear);
      if (response.success) {
        message.success(response.message);
        setCopyModalVisible(false);
        setCopySourceYear(undefined);
        setCopyTargetYear(undefined);
        actionRef.current?.reload();
        loadYears();
      }
    } catch (error: any) {
      message.error(error?.message || 'Yıl kopyalanamadı');
    }
  };

  const columns: ProColumns<SpecialDay>[] = [
    {
      title: 'Yıl',
      dataIndex: 'year',
      width: 80,
      sorter: true,
    },
    {
      title: 'Gün Adı',
      dataIndex: 'day_name',
      ellipsis: true,
    },
    {
      title: 'Tip',
      dataIndex: 'day_type',
      width: 180,
      render: (_, record) => {
        const dayType = SPECIAL_DAY_TYPES.find(
          (d) => d.value === record.day_type,
        );
        return dayType?.label || record.day_type;
      },
    },
    {
      title: 'Tarih',
      dataIndex: 'actual_date',
      width: 120,
      render: (_, record) => {
        const date = new Date(record.actual_date);
        return date.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      },
    },
    {
      title: 'Kategori',
      dataIndex: 'category',
      width: 120,
      render: (_, record) => (
        <Tag color={getCategoryColor(record.category)}>
          {getCategoryLabel(record.category)}
        </Tag>
      ),
    },
    {
      title: 'İşlemler',
      width: 150,
      valueType: 'option',
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentRecord(record);
              setEditModalVisible(true);
            }}
          />
          <Popconfirm
            key="delete"
            title="Bu özel günü silmek istediğinize emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Özel Günler Takvimi',
        subTitle: 'Email kampanyaları için özel gün tarihlerini yönetin',
      }}
    >
      <ProTable<SpecialDay>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async () => {
          const response = await getSpecialDays(selectedYear);
          return {
            data: response.data || [],
            success: response.success,
          };
        }}
        search={false}
        toolbar={{
          title: (
            <Space>
              <span>Yıl Filtresi:</span>
              <Select
                style={{ width: 120 }}
                placeholder="Tüm Yıllar"
                allowClear
                value={selectedYear}
                onChange={(value) => {
                  setSelectedYear(value);
                  actionRef.current?.reload();
                }}
                options={years.map((y) => ({ value: y, label: y }))}
              />
            </Space>
          ),
          actions: [
            <Button
              key="copy"
              icon={<CopyOutlined />}
              onClick={() => setCopyModalVisible(true)}
            >
              Yıl Kopyala
            </Button>,
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Yeni Özel Gün
            </Button>,
          ],
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
      />

      {/* Yeni Özel Gün Modal */}
      <ModalForm
        title="Yeni Özel Gün Ekle"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreate}
        width={500}
      >
        <ProFormSelect
          name="year"
          label="Yıl"
          rules={[{ required: true, message: 'Yıl seçiniz' }]}
          options={[
            { value: 2025, label: '2025' },
            { value: 2026, label: '2026' },
            { value: 2027, label: '2027' },
            { value: 2028, label: '2028' },
            { value: 2029, label: '2029' },
            { value: 2030, label: '2030' },
          ]}
        />
        <ProFormSelect
          name="day_type"
          label="Özel Gün Tipi"
          rules={[{ required: true, message: 'Özel gün tipi seçiniz' }]}
          options={SPECIAL_DAY_TYPES.map((d) => ({
            value: d.value,
            label: `${d.label} (${getCategoryLabel(d.category)})`,
          }))}
          showSearch
        />
        <ProFormDatePicker
          name="actual_date"
          label="Tarih"
          rules={[{ required: true, message: 'Tarih seçiniz' }]}
          fieldProps={{
            format: 'DD.MM.YYYY',
            style: { width: '100%' },
          }}
        />
      </ModalForm>

      {/* Düzenle Modal */}
      <ModalForm
        title="Özel Gün Düzenle"
        open={editModalVisible}
        onOpenChange={(visible) => {
          setEditModalVisible(visible);
          if (!visible) setCurrentRecord(null);
        }}
        onFinish={handleUpdate}
        width={500}
        initialValues={{
          day_name: currentRecord?.day_name,
          actual_date: currentRecord?.actual_date,
        }}
      >
        <ProFormText
          name="day_name"
          label="Gün Adı"
          rules={[{ required: true, message: 'Gün adı giriniz' }]}
        />
        <ProFormDatePicker
          name="actual_date"
          label="Tarih"
          rules={[{ required: true, message: 'Tarih seçiniz' }]}
          fieldProps={{
            format: 'DD.MM.YYYY',
            style: { width: '100%' },
          }}
        />
      </ModalForm>

      {/* Yıl Kopyala Modal */}
      <Modal
        title="Yılı Kopyala"
        open={copyModalVisible}
        onOk={handleCopyYear}
        onCancel={() => {
          setCopyModalVisible(false);
          setCopySourceYear(undefined);
          setCopyTargetYear(undefined);
        }}
        okText="Kopyala"
        cancelText="İptal"
      >
        <p style={{ marginBottom: 16 }}>
          Bir yılın tüm özel günlerini başka bir yıla kopyalayın.
          <strong>
            {' '}
            Dini bayram tarihlerini manuel olarak güncellemeniz gerekecektir.
          </strong>
        </p>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label htmlFor="source-year">Kaynak Yıl:</label>
            <Select
              id="source-year"
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Kopyalanacak yılı seçin"
              value={copySourceYear}
              onChange={setCopySourceYear}
              options={years.map((y) => ({ value: y, label: y }))}
            />
          </div>
          <div>
            <label htmlFor="target-year">Hedef Yıl:</label>
            <Select
              id="target-year"
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Hedef yılı seçin"
              value={copyTargetYear}
              onChange={setCopyTargetYear}
              options={[2025, 2026, 2027, 2028, 2029, 2030]
                .filter((y) => !years.includes(y))
                .map((y) => ({ value: y, label: y }))}
            />
          </div>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default SpecialDays;
