#!/bin/bash
# Email Tracking Migration Script

echo "🚀 Email Tracking Migration başlatılıyor..."

# Migration dosyasının yolunu belirle
MIGRATION_FILE="server/migrations/create_email_tracking.sql"

# Migration dosyasının var olup olmadığını kontrol et
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration dosyası bulunamadı: $MIGRATION_FILE"
    exit 1
fi

# PostgreSQL bağlantı bilgilerini al (environment variables'tan)
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-teymur_mailing}
DB_USER=${DB_USER:-postgres}

echo "📡 Veritabanına bağlanılıyor: $DB_HOST:$DB_PORT/$DB_NAME"

# Migration'ı çalıştır
psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Email Tracking Migration başarıyla tamamlandı!"
else
    echo "❌ Migration sırasında hata oluştu!"
    exit 1
fi