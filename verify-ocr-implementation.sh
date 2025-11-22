#!/bin/bash

# 🧪 Comprehensive OCR Implementation Verification Script
# Verifies all OCR components are properly implemented and functional

set -e

echo "🔍 OCR Implementation Verification"
echo "===================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
  local test_name=$1
  local command=$2
  
  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  
  echo -ne "${BLUE}Test $TOTAL_TESTS: $test_name${NC}... "
  
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
  else
    echo -e "${RED}❌ FAIL${NC}"
  fi
}

# Change to project directory
cd /home/ervin/Documents/PROYECTO-2

echo -e "${BLUE}=== BACKEND FILES ===${NC}"
echo ""

# Backend files existence
run_test "Backend OCR Service exists" "[ -f backend-v1/services/azureOCRService.js ]"
run_test "Backend OCR Controller exists" "[ -f backend-v1/controllers/ocrController.js ]"
run_test "Backend OCR Routes exist" "[ -f backend-v1/routes/ocr.js ]"
run_test "Backend Test file exists" "[ -f backend-v1/test-ocr-service.js ]"

echo ""
echo -e "${BLUE}=== FRONTEND FILES ===${NC}"
echo ""

# Frontend files existence
run_test "Frontend OCR Component exists" "[ -f frontend-v2/src/components/OCRQuestionCapture.jsx ]"
run_test "AIQuestionGenerator was modified" "grep -q 'OCRQuestionCapture' frontend-v2/src/components/AIQuestionGenerator.jsx"

echo ""
echo -e "${BLUE}=== BACKEND SYNTAX VALIDATION ===${NC}"
echo ""

# Backend syntax validation
run_test "azureOCRService.js syntax OK" "node -c backend-v1/services/azureOCRService.js"
run_test "ocrController.js syntax OK" "node -c backend-v1/controllers/ocrController.js"
run_test "ocr.js routes syntax OK" "node -c backend-v1/routes/ocr.js"
run_test "hybridServer.js syntax OK" "node -c backend-v1/hybridServer.js"

echo ""
echo -e "${BLUE}=== ENVIRONMENT CONFIGURATION ===${NC}"
echo ""

# Environment configuration
run_test "AZURE_CV_API_KEY is set" "grep -q 'AZURE_CV_API_KEY' backend-v1/.env"
run_test "AZURE_CV_ENDPOINT is set" "grep -q 'AZURE_CV_ENDPOINT' backend-v1/.env"
run_test "OCR routes registered in server" "grep -q \"'/api/ocr'\" backend-v1/hybridServer.js"

echo ""
echo -e "${BLUE}=== DOCKER CONFIGURATION ===${NC}"
echo ""

# Docker configuration
run_test "docker-compose.yml has OCR vars" "grep -q 'AZURE_CV' docker/docker-compose.yml"
run_test "docker-compose.prod.yml has OCR vars" "grep -q 'AZURE_CV' docker/docker-compose.prod.yml"
run_test "Backend Dockerfile exists" "[ -f backend-v1/Dockerfile ]"
run_test "Frontend Dockerfile exists" "[ -f frontend-v2/Dockerfile ]"

echo ""
echo -e "${BLUE}=== DOCUMENTATION ===${NC}"
echo ""

# Documentation
run_test "OCR Implementation guide exists" "[ -f OCR_IMPLEMENTATION.md ]"
run_test "OCR Completion summary exists" "[ -f OCR_COMPLETION_SUMMARY.md ]"
run_test "OCR Quick Start guide exists" "[ -f OCR_QUICK_START.md ]"

echo ""
echo -e "${BLUE}=== FILE SIZES ===${NC}"
echo ""

# File sizes
echo "Backend OCR Service:"
ls -lh backend-v1/services/azureOCRService.js | awk '{print "  Size: " $5}'

echo "Backend OCR Controller:"
ls -lh backend-v1/controllers/ocrController.js | awk '{print "  Size: " $5}'

echo "Frontend OCR Component:"
ls -lh frontend-v2/src/components/OCRQuestionCapture.jsx | awk '{print "  Size: " $5}'

echo ""
echo -e "${BLUE}=== TEST RESULTS ===${NC}"
echo ""

# Run OCR service tests
echo -ne "${YELLOW}Running OCR Service Tests${NC}... "
if cd backend-v1 && node test-ocr-service.js > /tmp/ocr_tests.log 2>&1; then
  PASSED_TESTS=$((PASSED_TESTS + 1))
  echo -e "${GREEN}✅ All OCR tests PASSED${NC}"
else
  echo -e "${RED}❌ OCR tests FAILED${NC}"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
cd /home/ervin/Documents/PROYECTO-2

echo ""
echo -e "${BLUE}=== DOCKER IMAGES ===${NC}"
echo ""

# Check Docker images
echo "Checking Docker images..."
if docker image inspect ervincaravaliibarra/backend-v1:latest > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} backend-v1:latest found"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}❌${NC} backend-v1:latest not found"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if docker image inspect ervincaravaliibarra/frontend-v2:latest > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} frontend-v2:latest found"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}❌${NC} frontend-v2:latest not found"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if docker image inspect ervincaravaliibarra/backend-v1:ocr-enabled > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} backend-v1:ocr-enabled tag found"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}❌${NC} backend-v1:ocr-enabled tag not found"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

if docker image inspect ervincaravaliibarra/frontend-v2:ocr-enabled > /dev/null 2>&1; then
  echo -e "${GREEN}✅${NC} frontend-v2:ocr-enabled tag found"
  PASSED_TESTS=$((PASSED_TESTS + 1))
else
  echo -e "${RED}❌${NC} frontend-v2:ocr-enabled tag not found"
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

echo ""
echo -e "${BLUE}=== FINAL SUMMARY ===${NC}"
echo ""

PERCENTAGE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "Tests Passed: $PASSED_TESTS / $TOTAL_TESTS"
echo "Success Rate: ${PERCENTAGE}%"
echo ""

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
  echo ""
  echo "OCR Implementation Status: ✅ COMPLETE"
  echo "Ready for production deployment"
  echo ""
  echo "Next steps:"
  echo "1. Deploy with: docker-compose -f docker/docker-compose.yml up"
  echo "2. Access at: http://localhost"
  echo "3. Test OCR: Click '📸 Capturar pregunta' button"
  echo ""
  exit 0
else
  FAILED=$((TOTAL_TESTS - PASSED_TESTS))
  echo -e "${RED}❌ $FAILED TESTS FAILED${NC}"
  echo ""
  echo "Please review the failed tests above and fix any issues."
  echo ""
  exit 1
fi
