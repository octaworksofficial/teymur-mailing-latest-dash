import {
  DeleteOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileWordOutlined,
  FileZipOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  List,
  message,
  Progress,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { UploadProps } from 'antd/es/upload/interface';
import React, { useState } from 'react';
import { deleteFile, type UploadedFile, uploadFile } from '@/services/upload';
import './AttachmentUploader.less';

const { Text } = Typography;

interface AttachmentUploaderProps {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  maxCount?: number;
  maxSize?: number; // MB cinsinden
  disabled?: boolean;
}

// Dosya türüne göre ikon seç
const getFileIcon = (type: string) => {
  if (type.includes('pdf'))
    return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  if (type.includes('word') || type.includes('document'))
    return <FileWordOutlined style={{ color: '#1890ff' }} />;
  if (type.includes('excel') || type.includes('spreadsheet'))
    return <FileExcelOutlined style={{ color: '#52c41a' }} />;
  if (type.includes('powerpoint') || type.includes('presentation'))
    return <FilePptOutlined style={{ color: '#fa8c16' }} />;
  if (type.includes('image'))
    return <FileImageOutlined style={{ color: '#722ed1' }} />;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z'))
    return <FileZipOutlined style={{ color: '#faad14' }} />;
  return <FileOutlined style={{ color: '#8c8c8c' }} />;
};

const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  value,
  onChange,
  maxCount = 10,
  maxSize = 10, // 10MB varsayılan
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // value null veya undefined ise boş array kullan
  const files = Array.isArray(value) ? value : [];

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    const uploadedFile = file as File;

    // Boyut kontrolü
    if (uploadedFile.size > maxSize * 1024 * 1024) {
      message.error(`Dosya boyutu ${maxSize}MB'dan büyük olamaz`);
      onError?.(new Error('Dosya çok büyük'));
      return;
    }

    // Dosya sayısı kontrolü
    if (files.length >= maxCount) {
      message.error(`En fazla ${maxCount} dosya yükleyebilirsiniz`);
      onError?.(new Error('Maksimum dosya sayısına ulaşıldı'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simüle edilmiş progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      const result = await uploadFile(uploadedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const newFiles = [...files, result];
      onChange?.(newFiles);

      message.success(`${uploadedFile.name} başarıyla yüklendi`);
      onSuccess?.(result);
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      message.error(
        error.response?.data?.message || error.message || 'Dosya yüklenemedi',
      );
      onError?.(error);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const handleRemove = async (file: UploadedFile) => {
    try {
      await deleteFile(file.filename);
      const newFiles = files.filter((f) => f.id !== file.id);
      onChange?.(newFiles);
      message.success('Dosya silindi');
    } catch (error: any) {
      message.error(error.message || 'Dosya silinemedi');
    }
  };

  return (
    <div className="attachment-uploader">
      <Upload
        customRequest={handleUpload}
        showUploadList={false}
        multiple
        disabled={disabled || files.length >= maxCount}
      >
        <Button
          icon={<UploadOutlined />}
          loading={uploading}
          disabled={disabled || files.length >= maxCount}
        >
          <PaperClipOutlined style={{ marginRight: 4 }} />
          Dosya Ekle
        </Button>
      </Upload>

      {uploading && uploadProgress > 0 && (
        <Progress
          percent={uploadProgress}
          size="small"
          style={{ width: 200, marginLeft: 16, display: 'inline-block' }}
        />
      )}

      <Text type="secondary" style={{ marginLeft: 12, fontSize: 12 }}>
        Maks. {maxSize}MB, {maxCount} dosya
      </Text>

      {files.length > 0 && (
        <List
          className="attachment-list"
          size="small"
          dataSource={files}
          renderItem={(file) => (
            <List.Item
              className="attachment-item"
              actions={[
                <Tooltip title="İndir" key="download">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    href={file.url}
                    target="_blank"
                  />
                </Tooltip>,
                <Tooltip title="Sil" key="delete">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(file)}
                    disabled={disabled}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={getFileIcon(file.type)}
                title={
                  <Text ellipsis style={{ maxWidth: 300 }}>
                    {file.name}
                  </Text>
                }
                description={
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {file.sizeFormatted}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default AttachmentUploader;
