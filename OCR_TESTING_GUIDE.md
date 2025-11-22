# OCR Feature - Complete Testing Guide

## ✅ Status: Fully Operational

El servicio OCR está completamente configurado y operacional. Todos los componentes están corriendo correctamente.

## Quick Verification

```bash
# Run from project root
bash verify-ocr-config.sh
```

Expected output: **✅ OCR service is fully operational!**

---

## Testing Scenarios

### Scenario 1: Upload an Image with Text

**Prerequisites:**
- Image file (PNG, JPG, or JPEG)
- Image should contain a clear question and answer options

**Steps:**

1. Open http://localhost in your browser
2. Login with your credentials
3. Navigate to **Dashboard** → **🤖 Generador de Preguntas** (Question Generator)
4. Click **📸 Capturar pregunta** (Capture Question)
5. Select **📂 Subir imagen** (Upload Image)
6. Choose image file from your device
7. Select a **Topic** (Tema) from the dropdown
8. Click **Procesar imagen** (Process Image)
9. Wait 3-5 seconds for OCR processing
10. Verify that the question text is auto-filled in the form

**Expected Result:**
- Question text extracted from image
- Options parsed and displayed
- Form auto-filled without manual entry

**Troubleshooting if it fails:**
- Ensure image contains clear, readable text
- Check image format is PNG, JPG, or JPEG
- Verify image size is under 20MB
- Try a different image with more contrast

---

### Scenario 2: Capture Image Using Camera

**Prerequisites:**
- Device with camera (laptop, phone, or tablet)
- Browser with camera permission enabled
- Question written on paper or displayed on screen

**Steps:**

1. Open http://localhost in your browser
2. Login with your credentials
3. Navigate to **Dashboard** → **🤖 Generador de Preguntas**
4. Click **📸 Capturar pregunta**
5. Select **📷 Tomar foto** (Take Photo)
6. Allow camera permission when prompted
7. Align camera to frame the question clearly
8. Click **Capturar** (Capture) button
9. Verify preview looks correct
10. Select a **Topic**
11. Click **Procesar imagen**
12. Wait for OCR to extract text

**Expected Result:**
- Camera feed displays
- Photo preview shows captured image
- OCR extracts text from photo
- Question is auto-filled

**Camera Troubleshooting:**
- Check browser permissions for camera access
- Try allowing camera permission in browser settings
- Ensure good lighting when capturing
- Hold camera steady for clear image

---

### Scenario 3: Different Question Formats

The OCR service supports various question formats:

#### Format A: Question + Multiple Choice
```
¿Cuál es la capital de Francia?

A) Madrid
B) París
C) Barcelona
D) Lisboa
```

#### Format B: Question + Options
```
What is 2 + 2?
(A) 1
(B) 2
(C) 4
(D) 5
```

#### Format C: Question + Line-separated Options
```
¿Cuál es el planeta más grande del sistema solar?

Opción 1: Mercurio
Opción 2: Júpiter
Opción 3: Saturno
Opción 4: Neptuno
```

#### Format D: Simple Question (auto-generates single option)
```
¿Cuál es la fórmula del agua?
```

**Test Steps:**
1. Create test images with different formats
2. Upload each image
3. Verify OCR correctly identifies question and options
4. Check that parsed data matches original text

---

### Scenario 4: Error Handling

**Test Invalid Image:**
1. Upload an image with no text
2. Expected: Error message "No text found in image"

**Test Unsupported Format:**
1. Upload BMP, GIF, or other format
2. Expected: Processed correctly (most formats are supported)

**Test Large Image:**
1. Upload image larger than 20MB
2. Expected: Error "File too large"

**Test Poor Quality:**
1. Upload blurry or low-contrast image
2. Expected: OCR may extract partial or incorrect text
3. User should be able to edit extracted text

---

## Integration Testing

### Test with Full Workflow

**Complete user journey:**

1. **Login**
   - Use Firebase credentials
   - Verify authentication works

2. **Navigate to Question Generator**
   - Click Dashboard
   - Click "🤖 Generador de Preguntas"

3. **Choose OCR Method**
   - Click "📸 Capturar pregunta"
   - Select upload or camera

4. **Process Question**
   - Upload/capture image
   - Select topic
   - Process image

5. **Review and Save**
   - Edit extracted text if needed
   - Click "Confirmar pregunta"
   - Verify question appears in topic

6. **Use Generated Question**
   - Start a game
   - Verify question displays correctly
   - Verify options are selectable

---

## API-Level Testing

### Test OCR Health Endpoint

```bash
curl http://localhost:5000/api/ocr/health | jq .
```

**Expected Response:**
```json
{
  "success": true,
  "status": "healthy",
  "service": "azure-computer-vision-ocr"
}
```

### Test OCR Process Image Endpoint

**Using curl with base64 image:**

```bash
# Create test image and convert to base64
base64 -w 0 test-image.jpg > image.b64

# Send to OCR endpoint
curl -X POST http://localhost:5000/api/ocr/process-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "imageBase64": "'$(cat image.b64)'",
    "mimeType": "image/jpeg"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "extractedText": "Full text from image...",
  "parsedQuestion": {
    "text": "Question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "format": "multiple_choice"
  },
  "confidence": 0.95,
  "processingTime": 2500
}
```

### Test with URL

```bash
curl -X POST http://localhost:5000/api/ocr/process-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "imageUrl": "https://example.com/question.jpg"
  }'
```

---

## Performance Testing

### Response Time Benchmarks

| Scenario | Expected Time | Acceptable Range |
|----------|--------------|------------------|
| Simple text (1-2 lines) | 1.5s | 1-3s |
| Medium text (5-10 lines) | 2.5s | 2-4s |
| Complex text (10+ lines) | 4s | 3-5s |
| Poor quality image | 3s | 2-6s |

**Test Process:**

1. Prepare test images of varying complexity
2. Time the OCR processing
3. Record times in a spreadsheet
4. Compare against expected ranges
5. Alert if any requests exceed 10 seconds

### Rate Limiting Test

**Limit:** 15 requests per 15 minutes per user

**Test Steps:**

1. Make 15 requests to OCR endpoint
2. 16th request should return HTTP 429
3. Wait 15 minutes
4. Requests should work again

```bash
# Simulate rate limit testing
for i in {1..16}; do
  echo "Request $i:"
  curl -s -w "HTTP %{http_code}\n" \
    http://localhost:5000/api/ocr/process-url \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d '{"imageUrl": "https://example.com/test.jpg"}' | tail -1
done
```

**Expected output:**
- Requests 1-15: HTTP 200
- Request 16: HTTP 429 (Too Many Requests)

---

## Accessibility Testing

### Voice Accessibility

The OCR component includes voice accessibility features:

**Test Steps:**

1. Enable screen reader (NVDA, JAWS, or VoiceOver)
2. Navigate to "📸 Capturar pregunta"
3. Verify all buttons are announced:
   - "Subir imagen" button
   - "Tomar foto" button
   - Topic dropdown
   - "Procesar imagen" button
4. Verify status messages are announced:
   - "Processing image..."
   - "Image processed successfully"
   - Error messages

### Keyboard Navigation

**Test Steps:**

1. Use only keyboard (Tab, Enter, Space)
2. Verify can:
   - Tab to all buttons
   - Select upload/camera with Enter
   - Select topic with dropdown
   - Process image
   - Edit extracted text
   - Confirm question
3. Verify focus is always visible

---

## Security Testing

### Authentication

1. Try accessing OCR without login
2. Expected: Redirect to login page

3. Try OCR with invalid token
4. Expected: HTTP 401 Unauthorized

5. Try OCR with expired token
6. Expected: HTTP 401 Unauthorized

### File Upload Security

1. Try uploading non-image file (exe, zip, etc)
2. Expected: Error "Invalid file type"

3. Try uploading image >20MB
4. Expected: Error "File too large"

5. Try uploading image with malicious filename
6. Expected: Filename sanitized, no security issues

---

## Regression Testing Checklist

After any updates to OCR, verify:

- [ ] OCR health endpoint responds
- [ ] Can upload image successfully
- [ ] Can capture photo with camera
- [ ] OCR extracts text correctly
- [ ] Parsed questions are accurate
- [ ] Text editing works
- [ ] Question saves to database
- [ ] Question appears in topic
- [ ] Rate limiting works
- [ ] Error messages are clear
- [ ] Accessibility features work
- [ ] Frontend and backend communicate correctly

---

## Troubleshooting Guide

### Issue: "OCR service is not configured" (HTTP 503)

**Solution:**
1. Verify `docker/.env` exists with credentials
2. Check backend logs: `docker compose logs backend-api | grep OCR`
3. Restart: `docker compose down && docker compose up -d`

### Issue: Image upload doesn't process

**Solution:**
1. Check image format (must be PNG, JPG, JPEG)
2. Verify image size < 20MB
3. Check internet connection to Azure
4. Review backend logs for errors

### Issue: Camera doesn't work

**Solution:**
1. Grant camera permission in browser
2. Use HTTPS or localhost (Chrome blocks camera on HTTP)
3. Try different browser
4. Check OS camera permissions

### Issue: OCR extracts incorrect text

**Solution:**
1. Ensure image has good contrast
2. Avoid shadows or glare
3. Use higher resolution image
4. Manually edit extracted text

### Issue: Rate limit exceeded

**Solution:**
1. Wait 15 minutes before next requests
2. Verify authentication token is correct
3. Check if multiple users affecting limit

---

## Documentation References

- **OCR_IMPLEMENTATION.md** - Technical implementation details
- **OCR_QUICK_START.md** - Quick start guide
- **OCR_FIX_SUMMARY.md** - Configuration fix details
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **PROJECT_COMPLETION_SUMMARY.md** - Overall project summary

---

## Support

For issues or questions:

1. Check logs: `docker compose logs backend-api`
2. Review error messages in browser console
3. Verify all containers are running: `docker compose ps`
4. Test health endpoint: `curl http://localhost:5000/api/ocr/health`

---

**Last Updated:** 2025-01-14  
**OCR Service Status:** ✅ Fully Operational  
**Testing Status:** Ready for validation
