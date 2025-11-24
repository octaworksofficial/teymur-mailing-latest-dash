// Log Stream Manager
// Bu servis scheduler loglarını real-time olarak SSE üzerinden yayınlar

class LogStreamManager {
  constructor() {
    this.clients = new Set();
    this.logs = [];
    this.maxLogs = 1000; // Son 1000 log'u sakla
  }

  // Yeni client bağlantısı
  addClient(res) {
    this.clients.add(res);
    console.log(`✅ Yeni log viewer bağlandı. Toplam: ${this.clients.size}`);
    
    // Son logları gönder
    if (this.logs.length > 0) {
      const initialLogs = this.logs.slice(-100); // Son 100 log
      initialLogs.forEach(log => {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      });
    }
  }

  // Client bağlantısını kapat
  removeClient(res) {
    this.clients.delete(res);
    console.log(`❌ Log viewer ayrıldı. Toplam: ${this.clients.size}`);
  }

  // Log yayınla
  broadcast(type, message, data = {}) {
    const now = new Date();
    const log = {
      timestamp: now.toISOString(),
      timestampTR: now.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
      type, // 'info', 'success', 'warning', 'error', 'system'
      message,
      data,
    };

    // Log'u sakla
    this.logs.push(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // En eski log'u sil
    }

    // Tüm bağlı clientlara gönder
    const deadClients = [];
    this.clients.forEach(client => {
      try {
        client.write(`data: ${JSON.stringify(log)}\n\n`);
      } catch (error) {
        deadClients.push(client);
      }
    });

    // Bağlantısı kopan clientları temizle
    deadClients.forEach(client => this.removeClient(client));
  }

  // Sistem mesajı
  system(message, data) {
    this.broadcast('system', message, data);
  }

  // Bilgi mesajı
  info(message, data) {
    this.broadcast('info', message, data);
  }

  // Başarı mesajı
  success(message, data) {
    this.broadcast('success', message, data);
  }

  // Uyarı mesajı
  warning(message, data) {
    this.broadcast('warning', message, data);
  }

  // Hata mesajı
  error(message, data) {
    this.broadcast('error', message, data);
  }

  // Tüm logları al
  getAllLogs() {
    return this.logs;
  }

  // Logları temizle
  clearLogs() {
    this.logs = [];
    this.broadcast('system', '🧹 Loglar temizlendi');
  }
}

// Singleton instance
const logStream = new LogStreamManager();

module.exports = logStream;
