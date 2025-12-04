import axios from 'axios';

const API_URL = '/api/uploads';

export interface UploadedFile {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number;
  sizeFormatted: string;
  type: string;
  uploadedAt: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: UploadedFile | UploadedFile[];
}

// Tek dosya yükleme
export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post<UploadResponse>(API_URL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.message);
  }

  return response.data.data as UploadedFile;
}

// Çoklu dosya yükleme
export async function uploadMultipleFiles(files: File[]): Promise<UploadedFile[]> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await axios.post<UploadResponse>(`${API_URL}/multiple`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.success) {
    throw new Error(response.data.message);
  }

  return response.data.data as UploadedFile[];
}

// Dosya silme
export async function deleteFile(filename: string): Promise<void> {
  const response = await axios.delete(`${API_URL}/${filename}`);
  
  if (!response.data.success) {
    throw new Error(response.data.message);
  }
}

// Dosya URL'i oluştur
export function getFileUrl(filename: string): string {
  return `${API_URL}/${filename}`;
}
