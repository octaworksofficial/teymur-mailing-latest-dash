#!/bin/bash

# Renkli çıktılar için
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  30 Dummy Contact Verisi İçe Aktarma${NC}"
echo -e "${BLUE}================================================${NC}"

# .env dosyasından DATABASE_URL'i oku
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "\n${GREEN}✓ .env dosyası okundu${NC}"
else
    echo -e "\n${YELLOW}⚠ .env dosyası bulunamadı!${NC}"
    exit 1
fi

# PostgreSQL bağlantısını kontrol et
echo -e "${YELLOW}Database bağlantısı test ediliyor...${NC}"
psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database bağlantısı başarılı!${NC}\n"
else
    echo -e "${YELLOW}⚠ Database bağlantısı başarısız!${NC}"
    echo -e "${YELLOW}Manuel olarak psql ile çalıştırın:${NC}"
    echo -e "psql \"$DATABASE_URL\" -f dummy-contacts-30.sql\n"
    exit 1
fi

# Mevcut kayıt sayısını göster
echo -e "${BLUE}Mevcut kayıt sayısı:${NC}"
psql "$DATABASE_URL" -c "SELECT COUNT(*) as mevcut_kisi FROM contacts;"

echo -e "\n${YELLOW}30 yeni kişi eklenecek. Devam etmek istiyor musunuz? (y/n)${NC}"
read -r response

if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "\n${YELLOW}Veriler ekleniyor...${NC}"
    psql "$DATABASE_URL" -f dummy-contacts-30.sql
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}================================================${NC}"
        echo -e "${GREEN}✓ 30 kişi başarıyla eklendi!${NC}"
        echo -e "${GREEN}================================================${NC}\n"
        
        echo -e "${BLUE}Güncel kayıt sayısı:${NC}"
        psql "$DATABASE_URL" -c "SELECT COUNT(*) as toplam_kisi FROM contacts;"
        
        echo -e "\n${BLUE}Sektör dağılımı:${NC}"
        psql "$DATABASE_URL" -c "SELECT custom_fields->>'sektor' as sektor, COUNT(*) as adet FROM contacts WHERE custom_fields ? 'sektor' GROUP BY sektor ORDER BY adet DESC LIMIT 10;"
    else
        echo -e "\n${YELLOW}⚠ Veri ekleme sırasında hata oluştu!${NC}\n"
        exit 1
    fi
else
    echo -e "\n${YELLOW}İşlem iptal edildi.${NC}\n"
    exit 0
fi
