const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const FormData = require('form-data');
const axios = require('axios');

const router = express.Router();

// n8n Google Drive Webhook URL
const N8N_UPLOAD_WEBHOOK_URL = 'https://n8n-production-14b9.up.railway.app/webhook/upload-file';

// Uploads klasörü (geçici olarak kullanılacak)
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Klasör yoksa oluştur
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Dosya boyutu limiti (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// İzin verilen dosya türleri
const ALLOWED_TYPES = [
  // Dökümanlar
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Resimler
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Arşivler
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Fallback için
  'application/octet-stream',
];

// İzin verilen uzantılar
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.json', '.xml',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.zip', '.rar', '.7z', '.tar', '.gz',
];

// Dosya uzantıları mapping
const EXTENSION_MAP = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'text/csv': '.csv',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'application/zip': '.zip',
  'application/x-rar-compressed': '.rar',
  'application/x-7z-compressed': '.7z',
};

// Multer storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || EXTENSION_MAP[file.mimetype] || '';
    const safeName = `${timestamp}-${uniqueId}${ext}`;
    cb(null, safeName);
  },
});

// Dosya filtresi
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Uzantı veya mime type kontrolü
  if (ALLOWED_TYPES.includes(file.mimetype) || ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype} (${ext})`), false);
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Dosya boyutunu formatla
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Google Drive'a dosya yükle (n8n webhook üzerinden)
const uploadToGoogleDrive = async (filePath, originalFilename, mimeType) => {
  try {
    const formData = new FormData();
    formData.append('data', fs.createReadStream(filePath), {
      filename: originalFilename,
      contentType: mimeType,
    });

    const response = await axios.put(N8N_UPLOAD_WEBHOOK_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return response.data;
  } catch (error) {
    console.error('Google Drive yükleme hatası:', error.message);
    throw error;
  }
};

// Google Drive response'unu frontend formatına dönüştür
const formatGoogleDriveResponse = (driveFile, originalFile) => {
  return {
    id: driveFile.id,
    name: driveFile.name || driveFile.originalFilename,
    filename: driveFile.originalFilename || driveFile.name,
    url: driveFile.webContentLink, // İndirme linki
    viewUrl: driveFile.webViewLink, // Görüntüleme linki
    driveId: driveFile.id,
    size: parseInt(driveFile.size) || originalFile.size,
    sizeFormatted: formatFileSize(parseInt(driveFile.size) || originalFile.size),
    type: driveFile.mimeType || originalFile.mimetype,
    uploadedAt: driveFile.createdTime || new Date().toISOString(),
    // Ek Google Drive bilgileri
    iconLink: driveFile.iconLink,
    hasThumbnail: driveFile.hasThumbnail,
    md5Checksum: driveFile.md5Checksum,
  };
};

// Tek dosya yükleme - Google Drive'a
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenemedi',
      });
    }

    const file = req.file;
    const localFilePath = path.join(UPLOADS_DIR, file.filename);

    console.log(`📤 Dosya Google Drive'a yükleniyor: ${file.originalname}`);

    // Google Drive'a yükle
    const driveResponse = await uploadToGoogleDrive(localFilePath, file.originalname, file.mimetype);

    // Yerel dosyayı sil (artık Google Drive'da)
    try {
      fs.unlinkSync(localFilePath);
      console.log(`🗑️ Yerel dosya silindi: ${file.filename}`);
    } catch (deleteError) {
      console.warn('Yerel dosya silinemedi:', deleteError.message);
    }

    // Response array olarak geliyor, ilk elemanı al
    const driveFile = Array.isArray(driveResponse) ? driveResponse[0] : driveResponse;

    if (!driveFile || !driveFile.id) {
      throw new Error('Google Drive\'dan geçerli yanıt alınamadı');
    }

    const formattedResponse = formatGoogleDriveResponse(driveFile, file);

    console.log(`✅ Dosya Google Drive'a yüklendi: ${driveFile.id}`);

    res.json({
      success: true,
      message: 'Dosya Google Drive\'a başarıyla yüklendi',
      data: formattedResponse,
    });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya yüklenirken hata oluştu',
      error: error.message,
    });
  }
});

// Çoklu dosya yükleme - Google Drive'a
router.post('/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenemedi',
      });
    }

    console.log(`📤 ${req.files.length} dosya Google Drive'a yükleniyor...`);

    const uploadedFiles = [];
    const errors = [];

    // Her dosyayı sırayla Google Drive'a yükle
    for (const file of req.files) {
      try {
        const localFilePath = path.join(UPLOADS_DIR, file.filename);
        
        // Google Drive'a yükle
        const driveResponse = await uploadToGoogleDrive(localFilePath, file.originalname, file.mimetype);
        
        // Yerel dosyayı sil
        try {
          fs.unlinkSync(localFilePath);
        } catch (deleteError) {
          console.warn(`Yerel dosya silinemedi: ${file.filename}`, deleteError.message);
        }

        // Response array olarak geliyor
        const driveFile = Array.isArray(driveResponse) ? driveResponse[0] : driveResponse;

        if (driveFile && driveFile.id) {
          const formattedResponse = formatGoogleDriveResponse(driveFile, file);
          uploadedFiles.push(formattedResponse);
          console.log(`✅ Dosya yüklendi: ${file.originalname} -> ${driveFile.id}`);
        } else {
          throw new Error('Google Drive\'dan geçerli yanıt alınamadı');
        }
      } catch (fileError) {
        console.error(`❌ Dosya yüklenemedi: ${file.originalname}`, fileError.message);
        errors.push({
          filename: file.originalname,
          error: fileError.message,
        });
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Hiçbir dosya yüklenemedi',
        errors,
      });
    }

    res.json({
      success: true,
      message: `${uploadedFiles.length} dosya Google Drive'a başarıyla yüklendi`,
      data: uploadedFiles,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Çoklu dosya yükleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosyalar yüklenirken hata oluştu',
      error: error.message,
    });
  }
});

// Dosya silme
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Güvenlik kontrolü - path traversal önle
    if (!filePath.startsWith(UPLOADS_DIR)) {
      return res.status(403).json({
        success: false,
        message: 'Geçersiz dosya yolu',
      });
    }

    // Dosya varsa sil, yoksa da başarılı dön
    // (Google Drive'a yüklenmiş dosyalar yerel olarak silinmiş olabilir)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Dosya silindi: ${filename}`);
    } else {
      console.log(`ℹ️ Dosya zaten mevcut değil (muhtemelen Google Drive'da): ${filename}`);
    }

    res.json({
      success: true,
      message: 'Dosya başarıyla silindi',
    });
  } catch (error) {
    console.error('Dosya silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya silinirken hata oluştu',
      error: error.message,
    });
  }
});

// Harici görsel proxy - URL'den görsel indir ve yükle
router.post('/proxy-image', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Geçerli bir URL gerekli',
      });
    }

    // URL güvenlik kontrolü
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return res.status(400).json({
        success: false,
        message: 'Sadece HTTP/HTTPS URL desteklenir',
      });
    }

    console.log(`📥 Harici görsel indiriliyor: ${url}`);

    // Görseli indir
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
      },
    });

    // Content-Type'ı al
    const contentType = response.headers['content-type'] || 'image/png';
    
    // Dosya uzantısını belirle
    let ext = '.png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = '.jpg';
    else if (contentType.includes('gif')) ext = '.gif';
    else if (contentType.includes('webp')) ext = '.webp';
    else if (contentType.includes('svg')) ext = '.svg';

    // Benzersiz dosya adı oluştur
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const filename = `${timestamp}-${uniqueId}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Dosyayı kaydet
    fs.writeFileSync(filePath, response.data);

    console.log(`✅ Harici görsel kaydedildi: ${filename}`);

    // Google Drive'a yükle (opsiyonel)
    let finalUrl = `/api/uploads/${filename}`;
    
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath), {
        filename: filename,
        contentType: contentType,
      });

      const driveResponse = await axios.post(N8N_UPLOAD_WEBHOOK_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 60000,
      });

      if (driveResponse.data && driveResponse.data.fileUrl) {
        finalUrl = driveResponse.data.fileUrl;
        console.log(`☁️ Görsel Google Drive'a yüklendi: ${finalUrl}`);
        
        // Yerel dosyayı sil
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Yerel dosya silinemedi:', e.message);
        }
      }
    } catch (driveError) {
      console.warn('Google Drive yükleme başarısız, yerel URL kullanılacak:', driveError.message);
    }

    res.json({
      success: true,
      message: 'Görsel başarıyla yüklendi',
      data: {
        id: uniqueId,
        name: filename,
        filename: filename,
        url: finalUrl,
        size: response.data.length,
        type: contentType,
      },
    });
  } catch (error) {
    console.error('Harici görsel proxy hatası:', error.message);
    res.status(500).json({
      success: false,
      message: 'Görsel indirilemedi',
      error: error.message,
    });
  }
});

// Dosya indirme/görüntüleme (static serve için kullanılacak)
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Güvenlik kontrolü
    if (!filePath.startsWith(UPLOADS_DIR)) {
      return res.status(403).json({
        success: false,
        message: 'Geçersiz dosya yolu',
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Dosya bulunamadı',
      });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Dosya indirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosya indirilirken hata oluştu',
      error: error.message,
    });
  }
});

// Hata yakalama middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `Dosya boyutu çok büyük. Maksimum: ${formatFileSize(MAX_FILE_SIZE)}`,
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  
  next();
});

module.exports = router;
