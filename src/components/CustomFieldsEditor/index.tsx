import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Row, Typography } from 'antd';
import React from 'react';

const { Text } = Typography;

interface CustomFieldsEditorProps {
  value?: Record<string, any>;
  onChange?: (value: Record<string, any>) => void;
}

const CustomFieldsEditor: React.FC<CustomFieldsEditorProps> = ({
  value = {},
  onChange,
}) => {
  const [fields, setFields] = React.useState<
    Array<{ key: string; value: string }>
  >(Object.entries(value).map(([key, val]) => ({ key, value: String(val) })));

  const handleAdd = () => {
    const newFields = [...fields, { key: '', value: '' }];
    setFields(newFields);
  };

  const handleRemove = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    setFields(newFields);
    updateValue(newFields);
  };

  const handleChange = (index: number, field: 'key' | 'value', val: string) => {
    const newFields = [...fields];
    newFields[index][field] = val;
    setFields(newFields);
    updateValue(newFields);
  };

  const updateValue = (newFields: Array<{ key: string; value: string }>) => {
    const obj: Record<string, any> = {};
    newFields.forEach(({ key, value }) => {
      if (key.trim()) {
        // Sayı mı kontrol et
        const numValue = Number(value);
        obj[key.trim()] =
          !Number.isNaN(numValue) && value.trim() !== '' ? numValue : value;
      }
    });
    onChange?.(obj);
  };

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Her müşteri için özel bilgiler ekleyebilirsiniz (şehir, sektör, bütçe,
          vb.)
        </Text>
      </div>

      {fields.length === 0 && (
        <Card
          size="small"
          style={{
            marginBottom: 12,
            background: '#fafafa',
            border: '1px dashed #d9d9d9',
          }}
        >
          <Text type="secondary" style={{ fontSize: 12 }}>
            Henüz özel alan eklenmedi. "Özel Alan Ekle" butonuna tıklayarak
            başlayın.
          </Text>
        </Card>
      )}

      {fields.map((field, index) => (
        <Card
          key={`field-${field.key}-${index}`}
          size="small"
          style={{ marginBottom: 8, background: '#fafafa' }}
          bodyStyle={{ padding: '12px' }}
        >
          <Row gutter={8} align="middle">
            <Col span={10}>
              <Input
                placeholder="Alan adı (örn: sehir, sektor)"
                value={field.key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                prefix={
                  <Text strong style={{ color: '#1890ff', fontSize: 12 }}>
                    KEY:
                  </Text>
                }
                style={{
                  fontWeight: 500,
                  background: 'white',
                }}
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="Değer (örn: Istanbul, Teknoloji)"
                value={field.value}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
                prefix={
                  <Text style={{ color: '#52c41a', fontSize: 12 }}>VALUE:</Text>
                }
                style={{
                  background: 'white',
                }}
              />
            </Col>
            <Col span={2}>
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => handleRemove(index)}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        </Card>
      ))}

      <Button
        type="dashed"
        onClick={handleAdd}
        block
        icon={<PlusOutlined />}
        style={{ marginTop: 8 }}
      >
        Özel Alan Ekle
      </Button>
    </div>
  );
};

export default CustomFieldsEditor;
