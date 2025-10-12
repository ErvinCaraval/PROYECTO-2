const request = require('supertest');
const express = require('express');
const voiceController = require('../../controllers/voiceController');

// Mock Firebase
jest.mock('../../firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      add: jest.fn().mockResolvedValue({ id: 'test-id' }),
      where: jest.fn(() => ({
        where: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            forEach: jest.fn()
          })
        }))
      }))
    }))
  }
}));

const app = express();
app.use(express.json());

// Rutas de prueba
app.post('/api/voice-responses/validate', voiceController.validateVoiceResponse);
app.post('/api/voice-responses/process', voiceController.processVoiceResponse);
app.get('/api/voice-responses/stats/:userId', voiceController.getVoiceRecognitionStats);

describe('Voice Controller Tests', () => {
  describe('POST /api/voice-responses/validate', () => {
    it('should validate voice response successfully', async () => {
      const response = await request(app)
        .post('/api/voice-responses/validate')
        .send({
          userId: 'test-user-123',
          questionId: 'test-question-456',
          voiceResponse: 'A',
          questionOptions: ['Opción A', 'Opción B', 'Opción C', 'Opción D']
        })
        .expect(200);

      expect(response.body.valid).toBe(true);
      expect(response.body.matchedOption).toBe('Opción A');
      expect(response.body.answerIndex).toBe(0);
      expect(response.body.confidence).toBe(0.8);
    });

    it('should reject invalid voice response', async () => {
      const response = await request(app)
        .post('/api/voice-responses/validate')
        .send({
          userId: 'test-user-123',
          questionId: 'test-question-456',
          voiceResponse: 'qwerty asdfgh zxcvbn',
          questionOptions: ['Opción A', 'Opción B', 'Opción C', 'Opción D']
        })
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.matchedOption).toBeNull();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/voice-responses/validate')
        .send({
          userId: 'test-user-123'
        })
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    it('should handle invalid questionOptions', async () => {
      const response = await request(app)
        .post('/api/voice-responses/validate')
        .send({
          userId: 'test-user-123',
          questionId: 'test-question-456',
          voiceResponse: 'A',
          questionOptions: []
        })
        .expect(400);

      expect(response.body.error).toContain('questionOptions must be a non-empty array');
    });
  });

  describe('POST /api/voice-responses/process', () => {
    it('should process voice response successfully', async () => {
      const response = await request(app)
        .post('/api/voice-responses/process')
        .send({
          userId: 'test-user-123',
          questionId: 'test-question-456',
          voiceResponse: 'primera opción',
          questionOptions: ['Opción A', 'Opción B', 'Opción C', 'Opción D']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.result.isValid).toBe(true);
      expect(response.body.result.matchedOption).toBe('Opción A');
      expect(response.body.result.answerIndex).toBe(0);
    });
  });

  describe('GET /api/voice-responses/stats/:userId', () => {
    it('should return voice recognition stats', async () => {
      const response = await request(app)
        .get('/api/voice-responses/stats/test-user-123')
        .expect(200);

      expect(response.body).toHaveProperty('totalAttempts');
      expect(response.body).toHaveProperty('successfulRecognitions');
      expect(response.body).toHaveProperty('successRate');
      expect(response.body).toHaveProperty('averageConfidence');
    });

    it('should handle missing userId', async () => {
      const response = await request(app)
        .get('/api/voice-responses/stats/')
        .expect(404);
    });
  });
});

describe('Voice Recognition Algorithm Tests', () => {
  // Importar la función de matching directamente para pruebas unitarias
  const { matchVoiceResponse } = require('../../controllers/voiceController');

  describe('matchVoiceResponse', () => {
    const options = ['Opción A', 'Opción B', 'Opción C', 'Opción D'];

    it('should match exact text', () => {
      const result = matchVoiceResponse('Opción A', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción A');
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should match by letter', () => {
      const result = matchVoiceResponse('A', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción A');
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBe(0.8);
    });

    it('should match by position', () => {
      const result = matchVoiceResponse('primera opción', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción A');
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBe(0.85);
    });

    it('should match by number', () => {
      const result = matchVoiceResponse('2', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción B');
      expect(result.answerIndex).toBe(1);
      expect(result.confidence).toBe(0.9);
    });

    it('should handle invalid responses', () => {
      const result = matchVoiceResponse('qwerty asdfgh zxcvbn', options);
      
      expect(result.isValid).toBe(false);
      expect(result.matchedOption).toBeNull();
      expect(result.answerIndex).toBeNull();
      expect(result.confidence).toBe(0.0);
    });

    it('should handle empty or null input', () => {
      const result1 = matchVoiceResponse('', options);
      const result2 = matchVoiceResponse(null, options);
      const result3 = matchVoiceResponse('test', null);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);
    });
  });
});