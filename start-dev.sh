#!/bin/bash

# Renkli çıktılar için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Email Otomasyon Platformu - Dev Server${NC}"
echo -e "${BLUE}================================================${NC}"

# 1. Eski süreçleri temizle
echo -e "\n${YELLOW}[1/4] Eski süreçler temizleniyor...${NC}"
pkill -f "node server/index.js" 2>/dev/null
pkill -f "max dev" 2>/dev/null
sleep 2

# 2. Port 3001'i temizle (Backend)
echo -e "${YELLOW}[2/4] Port 3001 temizleniyor...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 1

# 3. Frontend portlarını temizle (8000, 3002)
echo -e "${YELLOW}[3/4] Frontend portları temizleniyor (8000, 3002)...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
sleep 1

# 4. Backend'i başlat (Port 3001)
echo -e "${YELLOW}[4/4] Backend başlatılıyor (Port 3001)...${NC}"
node server/index.js > /dev/null 2>&1 &
BACKEND_PID=$!
sleep 3

# Backend'in başladığını kontrol et
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✓ Backend başarıyla başladı!${NC}"
    echo -e "  ${BLUE}API: http://localhost:3001/api/contacts${NC}"
else
    echo -e "${RED}✗ Backend başlatılamadı!${NC}"
    exit 1
fi

# 5. Frontend'i başlat
echo -e "\n${YELLOW}Frontend başlatılıyor...${NC}"
npm run start:dev &
FRONTEND_PID=$!

echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}  Tüm servisler başlatıldı!${NC}"
echo -e "${GREEN}================================================${NC}"
echo -e "\n${BLUE}Backend PID:${NC}  $BACKEND_PID"
echo -e "${BLUE}Frontend PID:${NC} $FRONTEND_PID"
echo -e "\n${GREEN}📊 Backend API:${NC}  http://localhost:3001/api/contacts"
echo -e "${GREEN}🌐 Frontend:${NC}     http://localhost:3002 ${YELLOW}(veya port otomatik seçilirse gösterilen adres)${NC}"
echo -e "\n${YELLOW}Durdurmak için:${NC} Ctrl+C veya ./stop-dev.sh"
echo -e "${GREEN}================================================${NC}\n"

# Ctrl+C yakalandığında temizlik yap
trap 'echo -e "\n${YELLOW}Servisler durduruluyor...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# Frontend'in çıkışını bekle
wait $FRONTEND_PID
