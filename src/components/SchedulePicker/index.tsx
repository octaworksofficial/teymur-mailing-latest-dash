import React, { useState, useEffect } from 'react';
import {
  Tabs,
  DatePicker,
  TimePicker,
  Select,
  Checkbox,
  InputNumber,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Input,
  Switch,
} from 'antd';
import {
  CalendarOutlined,
  ReloadOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import type {
  ScheduleType,
  RecurrenceConfig,
  SpecialDayConfig,
  SpecialDayType,
} from '@/types/campaign';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/tr';

dayjs.locale('tr');

const { Text } = Typography;
const { Option } = Select;

interface SchedulePickerProps {
  value?: {
    schedule_type: ScheduleType;
    scheduled_date?: string;
    recurrence_config?: RecurrenceConfig;
    special_day_config?: SpecialDayConfig;
  };
  onChange?: (value: {
    schedule_type: ScheduleType;
    scheduled_date?: string;
    recurrence_config?: RecurrenceConfig;
    special_day_config?: SpecialDayConfig;
  }) => void;
}

const SPECIAL_DAYS: { value: SpecialDayType; label: string; category: string }[] = [
  { value: 'ramazan_bayrami_1', label: 'Ramazan Bayramı 1. Gün', category: 'Dini Bayramlar' },
  { value: 'ramazan_bayrami_2', label: 'Ramazan Bayramı 2. Gün', category: 'Dini Bayramlar' },
  { value: 'ramazan_bayrami_3', label: 'Ramazan Bayramı 3. Gün', category: 'Dini Bayramlar' },
  { value: 'kurban_bayrami_1', label: 'Kurban Bayramı 1. Gün', category: 'Dini Bayramlar' },
  { value: 'kurban_bayrami_2', label: 'Kurban Bayramı 2. Gün', category: 'Dini Bayramlar' },
  { value: 'kurban_bayrami_3', label: 'Kurban Bayramı 3. Gün', category: 'Dini Bayramlar' },
  { value: 'kurban_bayrami_4', label: 'Kurban Bayramı 4. Gün', category: 'Dini Bayramlar' },
  { value: 'kandil_mevlid', label: 'Mevlid Kandili', category: 'Dini Bayramlar' },
  { value: 'kandil_regaip', label: 'Regaip Kandili', category: 'Dini Bayramlar' },
  { value: 'kandil_mirac', label: 'Miraç Kandili', category: 'Dini Bayramlar' },
  { value: 'kandil_berat', label: 'Berat Kandili', category: 'Dini Bayramlar' },
  { value: 'kandil_kadir', label: 'Kadir Gecesi', category: 'Dini Bayramlar' },
  { value: 'yilbasi', label: 'Yılbaşı (1 Ocak)', category: 'Milli Bayramlar' },
  { value: 'ulusal_egemenlik', label: '23 Nisan Ulusal Egemenlik', category: 'Milli Bayramlar' },
  { value: 'isci_bayrami', label: '1 Mayıs İşçi Bayramı', category: 'Milli Bayramlar' },
  { value: 'genclik_bayrami', label: '19 Mayıs Gençlik Bayramı', category: 'Milli Bayramlar' },
  { value: 'demokrasi_bayrami', label: '15 Temmuz Demokrasi Bayramı', category: 'Milli Bayramlar' },
  { value: 'zafer_bayrami', label: '30 Ağustos Zafer Bayramı', category: 'Milli Bayramlar' },
  { value: 'cumhuriyet_bayrami', label: '29 Ekim Cumhuriyet Bayramı', category: 'Milli Bayramlar' },
  { value: 'anneler_gunu', label: 'Anneler Günü', category: 'Özel Günler' },
  { value: 'babalar_gunu', label: 'Babalar Günü', category: 'Özel Günler' },
  { value: 'sevgililer_gunu', label: 'Sevgililer Günü (14 Şubat)', category: 'Özel Günler' },
  { value: 'kadinlar_gunu', label: 'Kadınlar Günü (8 Mart)', category: 'Özel Günler' },
  { value: 'ogretmenler_gunu', label: 'Öğretmenler Günü (24 Kasım)', category: 'Özel Günler' },
  { value: 'custom', label: 'Özel Tarih Belirle', category: 'Diğer' },
];

const WEEKDAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 0, label: 'Pazar' },
];

const SchedulePicker: React.FC<SchedulePickerProps> = ({ value, onChange }) => {
  const [activeTab, setActiveTab] = useState<ScheduleType>(value?.schedule_type || 'custom_date');
  
  const [customDate, setCustomDate] = useState<Dayjs | null>(
    value?.scheduled_date ? dayjs(value.scheduled_date) : null
  );
  
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly'>(
    value?.recurrence_config?.type || 'weekly'
  );
  const [intervalValue, setIntervalValue] = useState<number>(value?.recurrence_config?.interval || 1);
  const [weekdays, setWeekdays] = useState<number[]>(value?.recurrence_config?.weekdays || [1]);
  const [dayOfMonth, setDayOfMonth] = useState<number | 'last'>(
    value?.recurrence_config?.day_of_month || 1
  );
  const [recurrenceTime, setRecurrenceTime] = useState<Dayjs | null>(
    value?.recurrence_config?.time ? dayjs(value.recurrence_config.time, 'HH:mm') : dayjs('09:00', 'HH:mm')
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    value?.recurrence_config?.end_date ? dayjs(value.recurrence_config.end_date) : null
  );
  
  const [specialDayType, setSpecialDayType] = useState<SpecialDayType>(
    value?.special_day_config?.day_type || 'yilbasi'
  );
  const [customSpecialDate, setCustomSpecialDate] = useState<Dayjs | null>(
    value?.special_day_config?.custom_date ? dayjs(value.special_day_config.custom_date) : null
  );
  const [customName, setCustomName] = useState<string>(value?.special_day_config?.custom_name || '');
  const [dayOffset, setDayOffset] = useState<number>(value?.special_day_config?.day_offset || 0);
  const [specialTime, setSpecialTime] = useState<Dayjs | null>(
    value?.special_day_config?.time ? dayjs(value.special_day_config.time, 'HH:mm') : dayjs('09:00', 'HH:mm')
  );
  const [yearlyRepeat, setYearlyRepeat] = useState<boolean>(
    value?.special_day_config?.yearly_repeat ?? true
  );

  useEffect(() => {
    if (!onChange) return;

    if (activeTab === 'custom_date') {
      onChange({
        schedule_type: 'custom_date',
        scheduled_date: customDate?.format('YYYY-MM-DD HH:mm:ss'),
      });
    } else if (activeTab === 'recurring') {
      onChange({
        schedule_type: 'recurring',
        recurrence_config: {
          type: recurrenceType,
          interval: recurrenceType === 'daily' ? intervalValue : undefined,
          weekdays: recurrenceType === 'weekly' ? weekdays : undefined,
          day_of_month: recurrenceType === 'monthly' ? dayOfMonth : undefined,
          time: recurrenceTime?.format('HH:mm') || '09:00',
          end_date: endDate?.format('YYYY-MM-DD'),
        },
      });
    } else if (activeTab === 'special_day') {
      onChange({
        schedule_type: 'special_day',
        special_day_config: {
          day_type: specialDayType,
          custom_date: specialDayType === 'custom' ? customSpecialDate?.format('YYYY-MM-DD') : undefined,
          custom_name: specialDayType === 'custom' ? customName : undefined,
          day_offset: dayOffset,
          time: specialTime?.format('HH:mm') || '09:00',
          yearly_repeat: yearlyRepeat,
        },
      });
    }
  }, [
    activeTab,
    customDate,
    recurrenceType,
    intervalValue,
    weekdays,
    dayOfMonth,
    recurrenceTime,
    endDate,
    specialDayType,
    customSpecialDate,
    customName,
    dayOffset,
    specialTime,
    yearlyRepeat,
    onChange,
  ]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as ScheduleType);
  };

  const groupedSpecialDays = SPECIAL_DAYS.reduce((acc, day) => {
    if (!acc[day.category]) {
      acc[day.category] = [];
    }
    acc[day.category].push(day);
    return acc;
  }, {} as Record<string, typeof SPECIAL_DAYS>);

  const tabItems = [
    {
      key: 'custom_date',
      label: (
        <span>
          <CalendarOutlined /> Özel Tarih
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">
            Belirli bir tarih ve saatte gönderim yapar.
          </Text>
          <DatePicker
            showTime={{ format: 'HH:mm' }}
            format="YYYY-MM-DD HH:mm"
            value={customDate}
            onChange={(date) => setCustomDate(date)}
            style={{ width: '100%' }}
            placeholder="Tarih ve saat seçin"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Space>
      ),
    },
    {
      key: 'recurring',
      label: (
        <span>
          <ReloadOutlined /> Tekrarlayan
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text type="secondary">
            Belirli aralıklarla otomatik gönderim yapar.
          </Text>
          
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Tekrar Türü:</Text>
              <Select
                value={recurrenceType}
                onChange={(val) => setRecurrenceType(val)}
                style={{ width: '100%', marginTop: 4 }}
              >
                <Option value="daily">Günlük</Option>
                <Option value="weekly">Haftalık</Option>
                <Option value="monthly">Aylık</Option>
              </Select>
            </Col>
            <Col span={12}>
              <Text strong>Gönderim Saati:</Text>
              <TimePicker
                value={recurrenceTime}
                onChange={(time) => setRecurrenceTime(time)}
                format="HH:mm"
                style={{ width: '100%', marginTop: 4 }}
                placeholder="Saat seçin"
              />
            </Col>
          </Row>

          {recurrenceType === 'daily' && (
            <div>
              <Text strong>Her </Text>
              <InputNumber
                min={1}
                max={365}
                value={intervalValue}
                onChange={(val) => setIntervalValue(val || 1)}
                style={{ width: 80 }}
              />
              <Text strong> günde bir</Text>
            </div>
          )}

          {recurrenceType === 'weekly' && (
            <div>
              <Text strong>Günler:</Text>
              <div style={{ marginTop: 8 }}>
                <Checkbox.Group
                  value={weekdays}
                  onChange={(vals) => setWeekdays(vals as number[])}
                  options={WEEKDAYS.map((d) => ({ label: d.label, value: d.value }))}
                />
              </div>
            </div>
          )}

          {recurrenceType === 'monthly' && (
            <div>
              <Text strong>Ayın </Text>
              <Select
                value={dayOfMonth}
                onChange={(val) => setDayOfMonth(val)}
                style={{ width: 120 }}
              >
                {Array.from({ length: 31 }, (_, i) => (
                  <Option key={i + 1} value={i + 1}>
                    {i + 1}. günü
                  </Option>
                ))}
                <Option value="last">Son günü</Option>
              </Select>
            </div>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Text strong>Bitiş Tarihi (Opsiyonel):</Text>
              <DatePicker
                value={endDate}
                onChange={(date) => setEndDate(date)}
                style={{ width: '100%', marginTop: 4 }}
                placeholder="Bitiş tarihi"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Col>
          </Row>
        </Space>
      ),
    },
    {
      key: 'special_day',
      label: (
        <span>
          <GiftOutlined /> Özel Günler
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text type="secondary">
            Milli/dini bayramlar ve özel günlerde otomatik gönderim yapar.
          </Text>

          <Row gutter={16}>
            <Col span={24}>
              <Text strong>Özel Gün:</Text>
              <Select
                value={specialDayType}
                onChange={(val) => setSpecialDayType(val)}
                style={{ width: '100%', marginTop: 4 }}
                showSearch
                optionFilterProp="children"
                placeholder="Özel gün seçin"
              >
                {Object.entries(groupedSpecialDays).map(([category, days]) => (
                  <Select.OptGroup key={category} label={category}>
                    {days.map((day) => (
                      <Option key={day.value} value={day.value}>
                        {day.label}
                      </Option>
                    ))}
                  </Select.OptGroup>
                ))}
              </Select>
            </Col>
          </Row>

          {specialDayType === 'custom' && (
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Özel Gün Adı:</Text>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Örn: Şirket Kuruluş Yıldönümü"
                  style={{ marginTop: 4 }}
                />
              </Col>
              <Col span={12}>
                <Text strong>Tarih:</Text>
                <DatePicker
                  value={customSpecialDate}
                  onChange={(date) => setCustomSpecialDate(date)}
                  style={{ width: '100%', marginTop: 4 }}
                  placeholder="Tarih seçin"
                />
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={8}>
              <Text strong>Gönderim Zamanı:</Text>
              <Select
                value={dayOffset}
                onChange={(val) => setDayOffset(val)}
                style={{ width: '100%', marginTop: 4 }}
              >
                <Option value={-3}>3 gün önce</Option>
                <Option value={-2}>2 gün önce</Option>
                <Option value={-1}>1 gün önce</Option>
                <Option value={0}>Aynı gün</Option>
                <Option value={1}>1 gün sonra</Option>
              </Select>
            </Col>
            <Col span={8}>
              <Text strong>Saat:</Text>
              <TimePicker
                value={specialTime}
                onChange={(time) => setSpecialTime(time)}
                format="HH:mm"
                style={{ width: '100%', marginTop: 4 }}
                placeholder="Saat seçin"
              />
            </Col>
            <Col span={8}>
              <Text strong>Her Yıl Tekrarla:</Text>
              <div style={{ marginTop: 8 }}>
                <Switch
                  checked={yearlyRepeat}
                  onChange={(checked) => setYearlyRepeat(checked)}
                  checkedChildren="Evet"
                  unCheckedChildren="Hayır"
                />
              </div>
            </Col>
          </Row>
        </Space>
      ),
    },
  ];

  return (
    <Card size="small" style={{ marginTop: 8 }}>
      <Tabs 
        activeKey={activeTab} 
        onChange={handleTabChange} 
        size="small"
        items={tabItems}
      />
    </Card>
  );
};

export default React.memo(SchedulePicker);
