import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
  CodeOutlined,
  EyeOutlined,
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
  Input,
  message,
  Segmented,
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
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'preview'>('visual');

  /**
   * Outlook/Word HTML'ini temizler
   * Office-specific tag'leri, class'ları ve conditional comment'leri kaldırır
   */
  const cleanOutlookHtml = useCallback((html: string): string => {
    let cleaned = html;

    // 1. MSO conditional comments'i kaldır
    // <!--[if gte mso 9]>...<![endif]-->
    cleaned = cleaned.replace(/<!--\[if[^\]]*\]>[\s\S]*?<!\[endif\]-->/gi, '');
    cleaned = cleaned.replace(/<!--\[if[^\]]*\]>/gi, '');
    cleaned = cleaned.replace(/<!\[endif\]-->/gi, '');

    // 2. XML namespace declarations kaldır
    cleaned = cleaned.replace(/<\?xml[^>]*>/gi, '');
    cleaned = cleaned.replace(/<o:[^>]*>[\s\S]*?<\/o:[^>]*>/gi, '');
    cleaned = cleaned.replace(/<v:[^>]*>[\s\S]*?<\/v:[^>]*>/gi, '');
    cleaned = cleaned.replace(/<w:[^>]*>[\s\S]*?<\/w:[^>]*>/gi, '');

    // 3. Office-specific style'ları kaldır
    cleaned = cleaned.replace(/mso-[^;"'\s]+:[^;"']+;?/gi, '');
    cleaned = cleaned.replace(/margin-bottom:\s*\.0001pt;?/gi, '');

    // 4. Office class'larını kaldır (MsoNormal, MsoListParagraph vb.)
    cleaned = cleaned.replace(/class="[^"]*Mso[^"]*"/gi, '');
    cleaned = cleaned.replace(/class='[^']*Mso[^']*'/gi, '');

    // 5. Boş style attribute'larını kaldır
    cleaned = cleaned.replace(/style="\s*"/gi, '');
    cleaned = cleaned.replace(/style='\s*'/gi, '');

    // 6. Word Section div'lerini kaldır ama içeriği koru
    cleaned = cleaned.replace(
      /<div[^>]*class="?WordSection\d+"?[^>]*>/gi,
      '<div>',
    );

    // 7. Gereksiz span'ları temizle (sadece boş olanları)
    cleaned = cleaned.replace(/<span[^>]*>\s*<\/span>/gi, '');

    // 8. Birden fazla boşluğu tek boşluğa indir
    cleaned = cleaned.replace(/&nbsp;(&nbsp;)+/gi, '&nbsp;');

    // 9. Boş paragrafları temizle
    cleaned = cleaned.replace(/<p[^>]*>\s*<\/p>/gi, '');

    // 10. HTML ve BODY tag'lerini kaldır (sadece içeriği al)
    const bodyMatch = cleaned.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      cleaned = bodyMatch[1];
    }

    // 11. HEAD tag'ini tamamen kaldır
    cleaned = cleaned.replace(/<head>[\s\S]*<\/head>/gi, '');

    // 12. HTML tag'ini kaldır
    cleaned = cleaned.replace(/<\/?html[^>]*>/gi, '');

    return cleaned.trim();
  }, []);

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

      // Debug: Clipboard'da ne var?
      console.log('📋 Clipboard types:', Array.from(clipboardData.types));

      // Files kontrolü (Outlook bazen files olarak gönderir)
      const files = clipboardData.files;
      if (files && files.length > 0) {
        console.log('📁 Clipboard files:', files.length);
        const imageFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
          console.log(`  File ${i}: ${files[i].name} (${files[i].type})`);
          if (files[i].type.startsWith('image/')) {
            imageFiles.push(files[i]);
          }
        }

        // Görsel dosyaları yükle
        if (imageFiles.length > 0) {
          e.preventDefault();
          e.stopPropagation();

          message.loading({
            content: `${imageFiles.length} görsel yükleniyor...`,
            key: 'imageUpload',
          });

          for (const file of imageFiles) {
            const url = await uploadImageToServer(file);
            if (url) {
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', url, 'user');
              quill.setSelection(range.index + 1, 0);
            }
          }

          message.success({
            content: 'Görseller yüklendi',
            key: 'imageUpload',
          });
          return;
        }
      }

      // Pano'dan görselleri kontrol et (DataTransferItemList)
      const items = clipboardData.items;
      const imageItems: DataTransferItem[] = [];
      const allItems: string[] = [];

      for (let i = 0; i < items.length; i++) {
        allItems.push(`${items[i].kind}: ${items[i].type}`);
        if (items[i].type.indexOf('image') !== -1) {
          imageItems.push(items[i]);
        }
      }

      console.log('📋 Clipboard items:', allItems);

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
      let html = clipboardData.getData('text/html');

      // Outlook/Word HTML'ini temizle
      if (
        html &&
        (html.includes('mso-') ||
          html.includes('MsoNormal') ||
          html.includes('WordSection'))
      ) {
        console.log('📋 Outlook/Word HTML detected, cleaning...');
        html = cleanOutlookHtml(html);
      }

      // Debug: Hangi HTML geldiğini logla
      if (html && html.includes('<img')) {
        console.log('📋 Paste HTML contains images');
      }

      if (html && (html.includes('data:image') || html.includes('<img'))) {
        e.preventDefault();
        e.stopPropagation();

        let processedHtml = html;

        // Base64 görselleri bul ve yükle
        const base64Regex = /data:image\/[^;]+;base64,[^"'\s]+/g;
        const base64Images = html.match(base64Regex) || [];

        // Harici URL görselleri bul (http, https, cid hariç)
        const imgSrcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
        const externalUrls: string[] = [];
        const cidImages: string[] = [];
        let match: RegExpExecArray | null = imgSrcRegex.exec(html);
        while (match !== null) {
          const src = match[1];
          // Base64 olmayan URL'leri kategorize et
          if (!src.startsWith('data:')) {
            if (src.startsWith('http://') || src.startsWith('https://')) {
              externalUrls.push(src);
            } else if (src.startsWith('cid:')) {
              // CID (Content-ID) görselleri - email embedded images
              cidImages.push(src);
              console.log('⚠️ CID image detected (embedded):', src);
            } else if (src.startsWith('blob:')) {
              console.log('⚠️ Blob URL detected:', src);
            }
          }
          match = imgSrcRegex.exec(html);
        }

        const totalImages = base64Images.length + externalUrls.length;

        // CID görselleri için uyarı göster
        if (cidImages.length > 0 && totalImages === 0) {
          message.warning({
            content: `${cidImages.length} gömülü görsel algılandı. Lütfen görselleri ayrı ayrı kopyalayıp yapıştırın.`,
            duration: 5,
          });
        }

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

      // Görsel olmayan ama Outlook/Word HTML'i varsa temizle
      if (
        html &&
        (html.includes('mso-') ||
          html.includes('MsoNormal') ||
          html.includes('WordSection'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📋 Cleaning Outlook HTML (no images)');
        const cleanedHtml = cleanOutlookHtml(html);
        const range = quill.getSelection(true);
        quill.clipboard.dangerouslyPasteHTML(range.index, cleanedHtml, 'user');
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
  }, [readOnly, uploadImageToServer, base64ToFile, cleanOutlookHtml]);

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
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
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
            <Segmented
              size="small"
              value={editorMode}
              onChange={(val) => setEditorMode(val as 'visual' | 'html' | 'preview')}
              options={[
                { label: 'Görsel', value: 'visual' },
                { label: <><CodeOutlined /> HTML</>, value: 'html' },
                { label: <><EyeOutlined /> Önizleme</>, value: 'preview' },
              ]}
            />
          </Space>
        </div>
      )}

      {/* Görsel Editör (Quill) */}
      {editorMode === 'visual' && (
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
      )}

      {/* HTML Kod Editörü */}
      {editorMode === 'html' && (
        <Input.TextArea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="HTML kodunu buraya yazın veya yapıştırın..."
          style={{
            height: typeof height === 'number' ? height + 42 : height,
            fontFamily: 'monospace',
            fontSize: 13,
          }}
          readOnly={readOnly}
        />
      )}

      {/* Canlı Önizleme (iframe ile izole) */}
      {editorMode === 'preview' && (
        <iframe
          title="Email Önizleme"
          srcDoc={value || '<p style="color:#999;text-align:center;padding:40px;">Önizleme için içerik girin...</p>'}
          style={{
            width: '100%',
            height: typeof height === 'number' ? height + 42 : height,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            background: '#fff',
          }}
          sandbox="allow-same-origin"
        />
      )}

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
