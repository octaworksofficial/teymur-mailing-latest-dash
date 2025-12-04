const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const router = express.Router();

// Uploads klasörü
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
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`), false);
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

// Tek dosya yükleme
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenemedi',
      });
    }

    const file = req.file;
    const fileUrl = `/api/uploads/${file.filename}`;

    res.json({
      success: true,
      message: 'Dosya başarıyla yüklendi',
      data: {
        id: crypto.randomBytes(8).toString('hex'),
        name: file.originalname,
        filename: file.filename,
        url: fileUrl,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        type: file.mimetype,
        uploadedAt: new Date().toISOString(),
      },
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

// Çoklu dosya yükleme
router.post('/multiple', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenemedi',
      });
    }

    const uploadedFiles = req.files.map((file) => ({
      id: crypto.randomBytes(8).toString('hex'),
      name: file.originalname,
      filename: file.filename,
      url: `/api/uploads/${file.filename}`,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      type: file.mimetype,
      uploadedAt: new Date().toISOString(),
    }));

    res.json({
      success: true,
      message: `${uploadedFiles.length} dosya başarıyla yüklendi`,
      data: uploadedFiles,
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

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Dosya bulunamadı',
      });
    }

    fs.unlinkSync(filePath);

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
