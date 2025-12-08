import React, { useCallback, useEffect, useMemo, useRef } from 'react';
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
import {
  Button,
  Card,
  Divider,
  Dropdown,
  message,
  Space,
  Tag,
  Typography,
} from 'antd';
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
  {
    key: '{{unsubscribe_link}}',
    label: 'Abonelikten Çık',
    icon: <LinkOutlined />,
  },
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

  // Görsel yükleme fonksiyonu
  const uploadImageToServer = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.success && data.data?.url) {
          return data.data.url;
        }
        return null;
      } catch (error) {
        console.error('Görsel yükleme hatası:', error);
        return null;
      }
    },
    [],
  );

  // Base64 görselini File'a dönüştür
  const base64ToFile = useCallback(
    (base64: string, filename: string): File | null => {
      try {
        const arr = base64.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) return null;

        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
      } catch {
        return null;
      }
    },
    [],
  );

  // Paste olayını dinle
  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill || readOnly) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData) return;

      // Pano'dan görselleri kontrol et
      const items = clipboardData.items;
      const imageItems: DataTransferItem[] = [];

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageItems.push(items[i]);
        }
      }

      // Eğer doğrudan görsel dosyası yapıştırılıyorsa
      if (imageItems.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        for (const item of imageItems) {
          const file = item.getAsFile();
          if (file) {
            message.loading({
              content: 'Görsel yükleniyor...',
              key: 'imageUpload',
            });
            const url = await uploadImageToServer(file);
            if (url) {
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', url, 'user');
              quill.setSelection(range.index + 1, 0);
              message.success({
                content: 'Görsel yüklendi',
                key: 'imageUpload',
              });
            } else {
              message.error({
                content: 'Görsel yüklenemedi',
                key: 'imageUpload',
              });
            }
          }
        }
        return;
      }

      // HTML içinde görseller varsa işle (base64 veya harici URL)
      const html = clipboardData.getData('text/html');
      if (html && (html.includes('data:image') || html.includes('<img'))) {
        e.preventDefault();
        e.stopPropagation();

        let processedHtml = html;

        // Base64 görselleri bul ve yükle
        const base64Regex = /data:image\/[^;]+;base64,[^"'\s]+/g;
        const base64Images = html.match(base64Regex) || [];

        // Harici URL görselleri bul
        const imgSrcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        const externalUrls: string[] = [];
        let match: RegExpExecArray | null = imgSrcRegex.exec(html);
        while (match !== null) {
          const src = match[1];
          // Base64 olmayan ve http/https ile başlayan URL'leri al
          if (
            !src.startsWith('data:') &&
            (src.startsWith('http://') || src.startsWith('https://'))
          ) {
            externalUrls.push(src);
          }
          match = imgSrcRegex.exec(html);
        }

        const totalImages = base64Images.length + externalUrls.length;

        if (totalImages > 0) {
          message.loading({
            content: `${totalImages} görsel işleniyor...`,
            key: 'imageUpload',
          });

          // Base64 görselleri yükle
          for (let i = 0; i < base64Images.length; i++) {
            const base64 = base64Images[i];
            const file = base64ToFile(
              base64,
              `pasted-image-${Date.now()}-${i}.png`,
            );

            if (file) {
              const url = await uploadImageToServer(file);
              if (url) {
                processedHtml = processedHtml.replace(base64, url);
              }
            }
          }

          // Harici URL'leri proxy üzerinden indir ve yükle
          for (let i = 0; i < externalUrls.length; i++) {
            const externalUrl = externalUrls[i];
            try {
              // Harici görseli sunucu üzerinden indir
              const response = await fetch('/api/uploads/proxy-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: externalUrl }),
              });
              const data = await response.json();
              if (data.success && data.data?.url) {
                processedHtml = processedHtml
                  .split(externalUrl)
                  .join(data.data.url);
              }
            } catch (err) {
              console.warn('Harici görsel yüklenemedi:', externalUrl, err);
              // Hata durumunda orijinal URL'i koru
            }
          }

          message.success({
            content: 'Görseller yüklendi',
            key: 'imageUpload',
          });
        }

        // İşlenmiş HTML'i ekle
        const range = quill.getSelection(true);
        quill.clipboard.dangerouslyPasteHTML(
          range.index,
          processedHtml,
          'user',
        );
        return;
      }
    };

    const editorElement = quill.root;
    editorElement.addEventListener(
      'paste',
      handlePaste as unknown as EventListener,
    );

    return () => {
      editorElement.removeEventListener(
        'paste',
        handlePaste as unknown as EventListener,
      );
    };
  }, [readOnly, uploadImageToServer, base64ToFile]);

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
  const handleDragStart = useCallback(
    (e: React.DragEvent, variable: string) => {
      e.dataTransfer.setData('text/plain', variable);
      e.dataTransfer.effectAllowed = 'copy';
      // Drag görselini özelleştir
      const dragImage = document.createElement('div');
      dragImage.textContent = variable;
      dragImage.style.cssText =
        'position: absolute; top: -1000px; background: #1890ff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    },
    [],
  );

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
  const variableMenuItems: MenuProps['items'] = EMAIL_VARIABLES.map(
    (variable) => ({
      key: variable.key,
      icon: variable.icon,
      label: (
        <span>
          {variable.label}{' '}
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({variable.key})
          </Text>
        </span>
      ),
      onClick: () => insertVariable(variable.key),
    }),
  );

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
          style={{
            height: typeof height === 'number' ? `${height}px` : height,
          }}
          className="email-editor-quill"
        />
      </div>

      {showVariables && !readOnly && (
        <Card size="small" className="email-editor-variables-panel">
          <Text
            strong
            style={{ fontSize: 12, marginBottom: 8, display: 'block' }}
          >
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
