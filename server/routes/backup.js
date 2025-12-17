/**
 * Database Backup & Restore API Routes
 * Veritabanı yedekleme ve geri yükleme
 * Sadece Super Admin erişebilir
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, requireSuperAdmin } = require('../middleware/auth');

// Tüm routes için authentication ve super admin yetkisi zorunlu
router.use(authMiddleware);
router.use(requireSuperAdmin);

// Yedeklenecek tablolar (sıra önemli - foreign key bağımlılıkları)
const BACKUP_TABLES = [
  'organizations',
  'users',
  'contacts',
  'contact_tags',
  'email_templates',
  'email_campaigns',
  'email_campaign_schedules',
  'template_sequence',
  'email_tracking',
  'special_days',
  'refresh_tokens',
  'company_info'
];

// ============================================
// GET /api/admin/backup/stream - SSE ile progress destekli yedekleme
// ============================================
router.get('/backup/stream', async (req, res) => {
  const startTime = Date.now();
  
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // Helper function to send SSE events
  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    console.log('📦 Veritabanı yedekleme başlatıldı (SSE)...');
    console.log(`   Kullanıcı: ${req.user.email}`);
    
    sendEvent('start', {
      message: 'Yedekleme başlatıldı',
      totalTables: BACKUP_TABLES.length,
      timestamp: new Date().toISOString()
    });

    const backup = {
      metadata: {
        created_at: new Date().toISOString(),
        created_by: req.user.email,
        version: '1.0',
        tables: [],
        total_records: 0
      },
      data: {}
    };

    let processedTables = 0;
    let existingTables = [];

    // Önce mevcut tabloları bul
    for (const tableName of BACKUP_TABLES) {
      const tableCheck = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      if (tableCheck.rows[0].exists) {
        existingTables.push(tableName);
      }
    }

    const totalTables = existingTables.length;

    // Her tabloyu sırayla yedekle
    for (const tableName of existingTables) {
      try {
        // Progress gönder
        sendEvent('progress', {
          table: tableName,
          current: processedTables + 1,
          total: totalTables,
          percent: Math.round(((processedTables + 1) / totalTables) * 100),
          status: 'processing'
        });

        // Tablo verilerini al
        const result = await pool.query(`SELECT * FROM ${tableName}`);
        
        backup.data[tableName] = result.rows;
        backup.metadata.tables.push({
          name: tableName,
          count: result.rows.length
        });
        backup.metadata.total_records += result.rows.length;
        
        processedTables++;
        
        // Tablo tamamlandı bildirimi
        sendEvent('table_complete', {
          table: tableName,
          count: result.rows.length,
          current: processedTables,
          total: totalTables,
          percent: Math.round((processedTables / totalTables) * 100)
        });

        console.log(`   ✅ ${tableName}: ${result.rows.length} kayıt`);
      } catch (tableError) {
        console.log(`   ⚠️ Tablo okunamadı: ${tableName} - ${tableError.message}`);
        sendEvent('table_error', {
          table: tableName,
          error: tableError.message
        });
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    backup.metadata.duration_seconds = parseFloat(duration);
    
    console.log(`📦 Yedekleme tamamlandı: ${backup.metadata.total_records} kayıt, ${duration}s`);

    // Backup'ı global cache'e kaydet (geçici - 5 dakika)
    const backupId = `backup_${Date.now()}_${req.user.id}`;
    global.backupCache = global.backupCache || {};
    global.backupCache[backupId] = {
      backup: backup,
      createdAt: Date.now()
    };
    
    // 5 dakika sonra temizle
    setTimeout(() => {
      if (global.backupCache && global.backupCache[backupId]) {
        delete global.backupCache[backupId];
        console.log(`🗑️ Backup cache temizlendi: ${backupId}`);
      }
    }, 5 * 60 * 1000);

    // Tamamlandı - backup id gönder (veri değil)
    sendEvent('complete', {
      message: 'Yedekleme tamamlandı',
      totalRecords: backup.metadata.total_records,
      totalTables: processedTables,
      duration: duration,
      backupId: backupId
    });

    res.end();
  } catch (error) {
    console.error('❌ Yedekleme hatası:', error);
    sendEvent('error', {
      message: 'Veritabanı yedeklenirken bir hata oluştu',
      error: error.message
    });
    res.end();
  }
});

// ============================================
// GET /api/admin/backup/download/:id - Cache'den backup indir
// ============================================
router.get('/backup/download/:id', async (req, res) => {
  try {
    const backupId = req.params.id;
    
    if (!global.backupCache || !global.backupCache[backupId]) {
      return res.status(404).json({
        success: false,
        message: 'Yedek bulunamadı veya süresi dolmuş. Lütfen tekrar yedek alın.'
      });
    }
    
    const { backup } = global.backupCache[backupId];
    
    // Dosya adı oluştur
    const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    // Response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.json(backup);
    
    // İndirildikten sonra cache'den sil
    delete global.backupCache[backupId];
    console.log(`📥 Backup indirildi ve cache temizlendi: ${backupId}`);
  } catch (error) {
    console.error('❌ Backup indirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yedek indirilirken bir hata oluştu',
      error: error.message
    });
  }
});

// ============================================
// GET /api/admin/backup - Veritabanı yedeği al
// ============================================
router.get('/backup', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('📦 Veritabanı yedekleme başlatıldı...');
    console.log(`   Kullanıcı: ${req.user.email}`);
    
    const backup = {
      metadata: {
        created_at: new Date().toISOString(),
        created_by: req.user.email,
        version: '1.0',
        tables: [],
        total_records: 0
      },
      data: {}
    };

    // Her tabloyu sırayla yedekle
    for (const tableName of BACKUP_TABLES) {
      try {
        // Tablo var mı kontrol et
        const tableCheck = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [tableName]
        );

        if (!tableCheck.rows[0].exists) {
          console.log(`   ⚠️ Tablo bulunamadı, atlanıyor: ${tableName}`);
          continue;
        }

        // Tablo verilerini al
        const result = await pool.query(`SELECT * FROM ${tableName}`);
        
        backup.data[tableName] = result.rows;
        backup.metadata.tables.push({
          name: tableName,
          count: result.rows.length
        });
        backup.metadata.total_records += result.rows.length;
        
        console.log(`   ✅ ${tableName}: ${result.rows.length} kayıt`);
      } catch (tableError) {
        console.log(`   ⚠️ Tablo okunamadı: ${tableName} - ${tableError.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    backup.metadata.duration_seconds = parseFloat(duration);
    
    console.log(`📦 Yedekleme tamamlandı: ${backup.metadata.total_records} kayıt, ${duration}s`);

    // Dosya adı oluştur
    const fileName = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

    // Response headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.json(backup);
  } catch (error) {
    console.error('❌ Yedekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Veritabanı yedeklenirken bir hata oluştu',
      error: error.message
    });
  }
});

// ============================================
// GET /api/admin/backup/info - Veritabanı bilgisi
// ============================================
router.get('/backup/info', async (req, res) => {
  try {
    const info = {
      tables: [],
      total_records: 0,
      database_size: null
    };

    // Her tablonun kayıt sayısını al
    for (const tableName of BACKUP_TABLES) {
      try {
        const tableCheck = await pool.query(
          `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
          [tableName]
        );

        if (!tableCheck.rows[0].exists) {
          continue;
        }

        const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        const count = parseInt(result.rows[0].count);
        
        info.tables.push({
          name: tableName,
          count: count
        });
        info.total_records += count;
      } catch (err) {
        // Tablo yoksa atla
      }
    }

    // Veritabanı boyutunu al
    try {
      const sizeResult = await pool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `);
      info.database_size = sizeResult.rows[0].size;
    } catch (err) {
      info.database_size = 'Bilinmiyor';
    }

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Veritabanı bilgisi alınamadı:', error);
    res.status(500).json({
      success: false,
      message: 'Veritabanı bilgisi alınamadı'
    });
  }
});

// ============================================
// POST /api/admin/restore/stream - SSE ile progress destekli geri yükleme
// ============================================
router.post('/restore/stream', async (req, res) => {
  const startTime = Date.now();
  
  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders(); // Header'ları hemen gönder
  
  const sendEvent = (eventType, data) => {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    // Force flush for SSE
    if (res.flush) res.flush();
  };

  // Bağlantı kurulduğunu hemen bildir
  sendEvent('connected', { message: 'SSE bağlantısı kuruldu' });

  try {
    const { backup, confirmDelete } = req.body;

    if (!confirmDelete) {
      sendEvent('error', { message: 'Geri yükleme işlemi için onay gereklidir' });
      res.end();
      return;
    }

    if (!backup || !backup.data || !backup.metadata) {
      sendEvent('error', { message: 'Geçersiz yedek dosyası formatı' });
      res.end();
      return;
    }

    console.log('🔄 [SSE] Veritabanı geri yükleme başlatıldı...');
    console.log(`   Kullanıcı: ${req.user.email}`);
    console.log(`   Yedek tarihi: ${backup.metadata.created_at}`);
    console.log(`   Toplam kayıt: ${backup.metadata.total_records}`);

    sendEvent('start', {
      message: 'Geri yükleme başlatıldı',
      totalTables: backup.metadata.tables.length,
      totalRecords: backup.metadata.total_records,
      timestamp: new Date().toISOString()
    });

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Phase 1: Tabloları temizle
      sendEvent('phase', { phase: 'clean', message: 'Mevcut veriler temizleniyor...' });
      
      const reverseTables = [...BACKUP_TABLES].reverse();
      let cleanedCount = 0;
      
      for (const tableName of reverseTables) {
        try {
          const tableCheck = await client.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )`,
            [tableName]
          );

          if (!tableCheck.rows[0].exists) {
            continue;
          }

          await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
          cleanedCount++;
          
          sendEvent('clean_progress', {
            table: tableName,
            current: cleanedCount,
            total: reverseTables.length
          });
          
          console.log(`   🗑️ ${tableName} temizlendi`);
        } catch (err) {
          console.log(`   ⚠️ ${tableName} temizlenemedi: ${err.message}`);
        }
      }

      // Phase 2: Verileri yükle
      sendEvent('phase', { phase: 'restore', message: 'Veriler yükleniyor...' });
      
      const tablesToRestore = BACKUP_TABLES.filter(t => backup.data[t] && backup.data[t].length > 0);
      let restoredCount = 0;

      for (const tableName of BACKUP_TABLES) {
        try {
          const tableData = backup.data[tableName];
          
          if (!tableData || tableData.length === 0) {
            results.skipped.push({ table: tableName, reason: 'Veri yok' });
            continue;
          }

          const tableCheck = await client.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )`,
            [tableName]
          );

          if (!tableCheck.rows[0].exists) {
            results.skipped.push({ table: tableName, reason: 'Tablo bulunamadı' });
            continue;
          }

          sendEvent('restore_progress', {
            table: tableName,
            current: restoredCount + 1,
            total: tablesToRestore.length,
            recordCount: tableData.length,
            percent: Math.round(((restoredCount + 1) / tablesToRestore.length) * 100),
            status: 'processing'
          });

          let insertedCount = 0;
          let errorCount = 0;
          let lastError = null;
          
          for (const row of tableData) {
            try {
              const columns = Object.keys(row);
              const values = Object.values(row).map(v => {
                if (v === null) return null;
                if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
                  return JSON.stringify(v);
                }
                return v;
              });
              const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
              
              await client.query(
                `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})
                 ON CONFLICT DO NOTHING`,
                values
              );
              insertedCount++;
            } catch (rowError) {
              errorCount++;
              lastError = rowError.message;
              // İlk 3 hatayı logla
              if (errorCount <= 3) {
                console.log(`   ⚠️ ${tableName} kayıt hatası: ${rowError.message}`);
              }
            }
          }
          
          // Eğer çok fazla hata varsa bildir
          if (errorCount > 0) {
            console.log(`   ⚠️ ${tableName}: ${errorCount} kayıt hatalı. Son hata: ${lastError}`);
            sendEvent('table_warning', {
              table: tableName,
              errorCount: errorCount,
              lastError: lastError
            });
          }

          restoredCount++;
          results.success.push({ 
            table: tableName, 
            count: insertedCount,
            total: tableData.length 
          });
          
          sendEvent('table_complete', {
            table: tableName,
            insertedCount: insertedCount,
            totalCount: tableData.length,
            current: restoredCount,
            total: tablesToRestore.length,
            percent: Math.round((restoredCount / tablesToRestore.length) * 100)
          });

          console.log(`   ✅ ${tableName}: ${insertedCount}/${tableData.length} kayıt yüklendi`);
        } catch (tableError) {
          results.failed.push({ 
            table: tableName, 
            error: tableError.message 
          });
          console.log(`   ❌ ${tableName} yüklenemedi: ${tableError.message}`);
          
          sendEvent('table_error', {
            table: tableName,
            error: tableError.message
          });
        }
      }

      // Sequence'ları güncelle
      for (const tableName of BACKUP_TABLES) {
        try {
          await client.query(`
            SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
                   COALESCE((SELECT MAX(id) FROM ${tableName}), 1))
          `);
        } catch (err) {
          // Sequence yoksa atla
        }
      }

      await client.query('COMMIT');
      console.log('✅ [SSE] Transaction commit edildi');

    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ [SSE] Transaction rollback:', transactionError);
      sendEvent('error', { message: 'İşlem geri alındı: ' + transactionError.message });
      res.end();
      return;
    } finally {
      client.release();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`🔄 [SSE] Geri yükleme tamamlandı: ${duration}s`);

    sendEvent('complete', {
      message: 'Veritabanı başarıyla geri yüklendi',
      results: results,
      duration: duration
    });

    res.end();
  } catch (error) {
    console.error('❌ [SSE] Geri yükleme hatası:', error);
    sendEvent('error', { message: error.message });
    res.end();
  }
});

// ============================================
// POST /api/admin/restore - Veritabanını geri yükle
// ============================================
router.post('/restore', async (req, res) => {
  // Uzun işlem için timeout'u artır (10 dakika)
  req.setTimeout(600000);
  res.setTimeout(600000);
  
  const startTime = Date.now();
  
  // Uncaught exception handler for this request
  const errorHandler = (err) => {
    console.error('❌ Kritik restore hatası:', err);
  };
  process.on('uncaughtException', errorHandler);
  
  try {
    console.log('📥 Restore isteği alındı, body boyutu:', JSON.stringify(req.body).length, 'bytes');
    
    const { backup, confirmDelete } = req.body;

    // Onay kontrolü
    if (!confirmDelete) {
      process.removeListener('uncaughtException', errorHandler);
      return res.status(400).json({
        success: false,
        message: 'Geri yükleme işlemi için onay gereklidir'
      });
    }

    // Backup verisi kontrolü
    if (!backup || !backup.data || !backup.metadata) {
      process.removeListener('uncaughtException', errorHandler);
      return res.status(400).json({
        success: false,
        message: 'Geçersiz yedek dosyası formatı'
      });
    }

    console.log('🔄 Veritabanı geri yükleme başlatıldı...');
    console.log(`   Kullanıcı: ${req.user.email}`);
    console.log(`   Yedek tarihi: ${backup.metadata.created_at}`);
    console.log(`   Toplam kayıt: ${backup.metadata.total_records}`);

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Transaction başlat
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Tabloları ters sırada temizle (foreign key bağımlılıkları için)
      const reverseTables = [...BACKUP_TABLES].reverse();
      
      for (const tableName of reverseTables) {
        try {
          // Tablo var mı kontrol et
          const tableCheck = await client.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )`,
            [tableName]
          );

          if (!tableCheck.rows[0].exists) {
            results.skipped.push({ table: tableName, reason: 'Tablo bulunamadı' });
            continue;
          }

          // Tabloyu temizle
          await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
          console.log(`   🗑️ ${tableName} temizlendi`);
        } catch (err) {
          console.log(`   ⚠️ ${tableName} temizlenemedi: ${err.message}`);
        }
      }

      // Tabloları sırayla doldur
      for (const tableName of BACKUP_TABLES) {
        try {
          const tableData = backup.data[tableName];
          
          if (!tableData || tableData.length === 0) {
            results.skipped.push({ table: tableName, reason: 'Veri yok' });
            continue;
          }

          // Tablo var mı kontrol et
          const tableCheck = await client.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )`,
            [tableName]
          );

          if (!tableCheck.rows[0].exists) {
            results.skipped.push({ table: tableName, reason: 'Tablo bulunamadı' });
            continue;
          }

          // Her kaydı ekle
          let insertedCount = 0;
          for (const row of tableData) {
            try {
              const columns = Object.keys(row);
              const values = Object.values(row).map(v => {
                // null değerleri koru, array ve object'leri JSON string'e çevir
                if (v === null) return null;
                if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
                  return JSON.stringify(v);
                }
                return v;
              });
              const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
              
              await client.query(
                `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})
                 ON CONFLICT DO NOTHING`,
                values
              );
              insertedCount++;
            } catch (rowError) {
              // Tek kayıt hatası - devam et
              console.log(`   ⚠️ ${tableName} kayıt hatası: ${rowError.message}`);
            }
          }

          results.success.push({ 
            table: tableName, 
            count: insertedCount,
            total: tableData.length 
          });
          console.log(`   ✅ ${tableName}: ${insertedCount}/${tableData.length} kayıt yüklendi`);
        } catch (tableError) {
          results.failed.push({ 
            table: tableName, 
            error: tableError.message 
          });
          console.log(`   ❌ ${tableName} yüklenemedi: ${tableError.message}`);
        }
      }

      // Sequence'ları güncelle
      for (const tableName of BACKUP_TABLES) {
        try {
          await client.query(`
            SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
                   COALESCE((SELECT MAX(id) FROM ${tableName}), 1))
          `);
        } catch (err) {
          // Sequence yoksa atla
        }
      }

      await client.query('COMMIT');
      console.log('✅ Transaction commit edildi');

    } catch (transactionError) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rollback:', transactionError);
      throw transactionError;
    } finally {
      client.release();
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`🔄 Geri yükleme tamamlandı: ${duration}s`);
    
    process.removeListener('uncaughtException', errorHandler);

    res.json({
      success: true,
      message: 'Veritabanı başarıyla geri yüklendi',
      results: results,
      duration_seconds: parseFloat(duration)
    });

  } catch (error) {
    console.error('❌ Geri yükleme hatası:', error);
    process.removeListener('uncaughtException', errorHandler);
    res.status(500).json({
      success: false,
      message: 'Veritabanı geri yüklenirken bir hata oluştu',
      error: error.message
    });
  }
});

module.exports = router;
