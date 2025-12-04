import React, { useCallback, useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  HolderOutlined,
  HomeOutlined,
  LinkOutlined,
  MailOutlined,
  PhoneOutlined,
  TagOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Card, Divider, Dropdown, Space, Tag, Typography } from 'antd';
import './index.less';

const { Text } = Typography;

interface EmailEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number | string;
  showVariables?: boolean;
  readOnly?: boolean;
}

// Email değişkenleri - kişi bilgileri için
const EMAIL_VARIABLES = [
  { key: '{{first_name}}', label: 'Ad', icon: <UserOutlined /> },
  { key: '{{last_name}}', label: 'Soyad', icon: <UserOutlined /> },
  { key: '{{full_name}}', label: 'Ad Soyad', icon: <UserOutlined /> },
  { key: '{{email}}', label: 'E-posta', icon: <MailOutlined /> },
  { key: '{{phone}}', label: 'Telefon', icon: <PhoneOutlined /> },
  { key: '{{company}}', label: 'Şirket', icon: <HomeOutlined /> },
  { key: '{{position}}', label: 'Pozisyon', icon: <TagOutlined /> },
  { key: '{{city}}', label: 'Şehir', icon: <HomeOutlined /> },
  { key: '{{country}}', label: 'Ülke', icon: <HomeOutlined /> },
  { key: '{{custom_field_1}}', label: 'Özel Alan 1', icon: <TagOutlined /> },
  { key: '{{custom_field_2}}', label: 'Özel Alan 2', icon: <TagOutlined /> },
  { key: '{{unsubscribe_link}}', label: 'Abonelikten Çık', icon: <LinkOutlined /> },
];

const EmailEditor: React.FC<EmailEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Email içeriğinizi buraya yazın...',
  height = 400,
  showVariables = true,
  readOnly = false,
}) => {
  const quillRef = useRef<ReactQuill>(null);

  // Quill editör modülleri
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ script: 'sub' }, { script: 'super' }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ direction: 'rtl' }],
          [{ align: [] }],
          ['link', 'image', 'video'],
          ['blockquote', 'code-block'],
          ['clean'],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    [],
  );

  // Desteklenen formatlar
  const formats = useMemo(
    () => [
      'header',
      'font',
      'size',
      'bold',
      'italic',
      'underline',
      'strike',
      'color',
      'background',
      'script',
      'list',
      'bullet',
      'indent',
      'direction',
      'align',
      'link',
      'image',
      'video',
      'blockquote',
      'code-block',
    ],
    [],
  );

  // Değişken ekleme
  const insertVariable = useCallback(
    (variable: string) => {
      if (onChange && value !== undefined) {
        // Cursor pozisyonuna ekle veya sona ekle
        const newValue = value + variable;
        onChange(newValue);
      }
    },
    [onChange, value],
  );

  // Sürükle başlat
  const handleDragStart = useCallback((e: React.DragEvent, variable: string) => {
    e.dataTransfer.setData('text/plain', variable);
    e.dataTransfer.effectAllowed = 'copy';
    // Drag görselini özelleştir
    const dragImage = document.createElement('div');
    dragImage.textContent = variable;
    dragImage.style.cssText = 'position: absolute; top: -1000px; background: #1890ff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  // Drop olayını işle - editöre bırakıldığında
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const variable = e.dataTransfer.getData('text/plain');
    if (!variable || !variable.startsWith('{{')) return;

    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    // Pozisyondaki indeksi bul
    const range = document.caretRangeFromPoint(e.clientX, e.clientY);
    if (range) {
      const selection = quill.getSelection();
      let index = quill.getLength() - 1;
      
      // Range'den editördeki pozisyonu hesapla
      const node = range.startContainer;
      const offset = range.startOffset;
      
      // Blot'u bul ve indeksini al
      const blot = quill.scroll.find(node, true);
      if (blot && Array.isArray(blot) && blot[0]) {
        index = quill.getIndex(blot[0] as any) + offset;
      } else if (blot && !Array.isArray(blot)) {
        index = quill.getIndex(blot as any) + offset;
      } else if (selection) {
        index = selection.index;
      }
      
      // Değişkeni ekle
      quill.insertText(index, variable, 'user');
      quill.setSelection(index + variable.length, 0);
    } else {
      // Fallback: sona ekle
      const length = quill.getLength();
      quill.insertText(length - 1, variable, 'user');
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Değişken menü öğeleri
  const variableMenuItems: MenuProps['items'] = EMAIL_VARIABLES.map((variable) => ({
    key: variable.key,
    icon: variable.icon,
    label: (
      <span>
        {variable.label} <Text type="secondary" style={{ fontSize: 11 }}>({variable.key})</Text>
      </span>
    ),
    onClick: () => insertVariable(variable.key),
  }));

  const handleChange = useCallback(
    (content: string) => {
      if (onChange) {
        onChange(content);
      }
    },
    [onChange],
  );

  return (
    <div className="email-editor-container">
      {showVariables && !readOnly && (
        <div className="email-editor-toolbar-extra">
          <Space>
            <Dropdown
              menu={{ items: variableMenuItems }}
              trigger={['click']}
              placement="bottomLeft"
            >
              <Button size="small" icon={<UserOutlined />}>
                Değişken Ekle
              </Button>
            </Dropdown>
            <Divider type="vertical" />
            <Text type="secondary" style={{ fontSize: 12 }}>
              💡 Değişkenleri sürükleyip editöre bırakabilirsiniz
            </Text>
          </Space>
        </div>
      )}
      
      <div 
        onDrop={handleDrop} 
        onDragOver={handleDragOver}
        className="email-editor-drop-zone"
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
          className="email-editor-quill"
        />
      </div>

      {showVariables && !readOnly && (
        <Card size="small" className="email-editor-variables-panel">
          <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
            <HolderOutlined style={{ marginRight: 4 }} />
            Sürükle & Bırak Değişkenler:
          </Text>
          <Space wrap size={[8, 8]}>
            {EMAIL_VARIABLES.map((variable) => (
              <Tag
                key={variable.key}
                draggable
                onDragStart={(e) => handleDragStart(e, variable.key)}
                className="email-variable-tag"
                icon={variable.icon}
                color="blue"
                style={{ 
                  cursor: 'grab',
                  userSelect: 'none',
                  padding: '4px 8px',
                  fontSize: 12,
                }}
              >
                {variable.label}
              </Tag>
            ))}
          </Space>
        </Card>
      )}
    </div>
  );
};

export default React.memo(EmailEditor);
