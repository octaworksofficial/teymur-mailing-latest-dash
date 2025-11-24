#!/bin/bash

# Renkli çıktılar için
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Servisler durduruluyor...${NC}\n"

# Backend'i durdur
echo -e "${YELLOW}Backend durduruluyor...${NC}"
pkill -f "node server/index.js"
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Frontend'i durdur
echo -e "${YELLOW}Frontend durduruluyor...${NC}"
pkill -f "max dev"
lsof -ti:8000 | xargs kill -9 2>/dev/null

sleep 2

echo -e "\n${GREEN}✓ Tüm servisler durduruldu!${NC}\n"
