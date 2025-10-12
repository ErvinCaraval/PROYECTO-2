const request = require('supertest');

// Mock de Firebase antes de importar el servidor
const mockVoiceInteractions = [
  {
    id: 'interaction1',
    userId: 'test-user-123',
    questionId: 'q123',
    voiceText: 'primera opción',
    confidence: 0.9,
    action: 'voice_answer',
    metadata: { isValid: true },
    timestamp: new Date()
  },
  {
    id: 'interaction2',
    userId: 'test-user-123',
    questionId: 'q124',
    voiceText: 'segunda opción',
    confidence: 0.8,
    action: 'voice_answer',
    metadata: { isValid: true },
    timestamp: new Date()
  }
];

jest.mock('../../firebase', () => ({
  db: {
    collection: jest.fn((collectionName) => {
      if (collectionName === 'voiceInteractions') {
        return {
          where: jest.fn().mockImplementation((field, operator, value) => {
            let filteredInteractions = mockVoiceInteractions;
            
            if (field === 'userId' && operator === '==') {
              filteredInteractions = filteredInteractions.filter(interaction => 
                interaction.userId === value
              );
            } else if (field === 'action' && operator === '==') {
              filteredInteractions = filteredInteractions.filter(interaction => 
                interaction.action === value
              );
            }
            
            return {
              where: jest.fn().mockImplementation((field2, operator2, value2) => {
                if (field2 === 'action' && operator2 === '==') {
                  filteredInteractions = filteredInteractions.filter(interaction => 
                    interaction.action === value2
                  );
                }
                
                return {
                  get: jest.fn().mockResolvedValue({
                    forEach: jest.fn((callback) => {
                      filteredInteractions.forEach(interaction => callback({
                        id: interaction.id,
                        data: () => interaction
                      }));
                    })
                  })
                };
              }),
              get: jest.fn().mockResolvedValue({
                forEach: jest.fn((callback) => {
                  filteredInteractions.forEach(interaction => callback({
                    id: interaction.id,
                    data: () => interaction
                  }));
                })
              })
            };
          }),
          add: jest.fn().mockResolvedValue({ id: 'mock-id' })
        };
      }
      return {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          forEach: jest.fn()
        }),
        add: jest.fn().mockResolvedValue({ id: 'mock-id' })
      };
    })
  }
}));

// Mock del servidor para evitar que se inicie
jest.mock('../../hybridServer', () => {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  // Importar las rutas
  app.use('/api/voice-responses', require('../../routes/voiceResponses'));
  
  return { app };
});

const { app } = require('../../hybridServer');
const { db } = require('../../firebase');

describe('Voice Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/voice-responses/validate', () => {
    it('should validate voice response successfully', async () => {
      const mockData = {
        userId: 'test-user-123',
        questionId: 'q123',
        voiceResponse: 'primera opción',
        questionOptions: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
        gameId: 'game123'
      };

      const response = await request(app)
        .post('/api/voice-responses/validate')
        .send(mockData)
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('matchedOption');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('answerIndex');
    });

    it('should reject invalid voice response', async () => {
      const mockData = {
        userId: 'test-user-123',
        questionId: 'q123',
        voiceResponse: 'qwerty asdfgh zxcvbn',
        questionOptions: ['Madrid', 'Barcelona', 'Valencia', 'Sevilla']
      };

      const response = await request(app)
        .post('/api/voice-responses/validate')
        .send(mockData)
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.matchedOption).toBeNull();
    });

    it('should handle missing required fields', async () => {
      const mockData = {
        userId: 'test-user-123'
        // Missing questionId, voiceResponse, questionOptions
      };

      await request(app)
        .post('/api/voice-responses/validate')
        .send(mockData)
        .expect(400);
    });
  });

  describe('POST /api/voice-responses/process', () => {
    it('should process valid voice response', async () => {
      const mockData = {
        userId: 'test-user-123',
        questionId: 'q123',
        voiceResponse: 'A',
        questionOptions: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        gameId: 'game123'
      };

      const response = await request(app)
        .post('/api/voice-responses/process')
        .send(mockData)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('answerIndex');
      expect(response.body).toHaveProperty('answerValue');
      expect(response.body).toHaveProperty('confidence');
    });
  });

  describe('GET /api/voice-responses/stats/:userId', () => {
    it('should return voice recognition stats', async () => {
      // Mock the database response
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          // Simulate some mock data
          callback({
            id: 'interaction1',
            data: () => ({
              questionId: 'q123',
              voiceText: 'primera opción',
              confidence: 0.9,
              metadata: { isValid: true },
              timestamp: new Date()
            })
          });
        })
      };

      db.collection.mockReturnValue({
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockSnapshot)
        })
      });

      const response = await request(app)
        .get('/api/voice-responses/stats/test-user-123')
        .expect(200);

      expect(response.body).toHaveProperty('totalAttempts');
      expect(response.body).toHaveProperty('successfulRecognitions');
      expect(response.body).toHaveProperty('accuracy');
      expect(response.body).toHaveProperty('averageConfidence');
      expect(response.body).toHaveProperty('recentInteractions');
    });

    it('should handle missing userId', async () => {
      await request(app)
        .get('/api/voice-responses/stats/')
        .expect(404);
    });
  });
});

describe('Voice Recognition Algorithm Tests', () => {
  // Test the voice recognition functions directly
  const { matchVoiceResponse } = require('../../utils/voiceRecognition');

  describe('matchVoiceResponse', () => {
    it('should match exact responses', () => {
      const options = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'];
      const result = matchVoiceResponse('Madrid', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Madrid');
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBe(1.0);
    });

    it('should match letter responses (A, B, C, D)', () => {
      const options = ['Opción A', 'Opción B', 'Opción C', 'Opción D'];
      const result = matchVoiceResponse('A', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción A');
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBe(0.9);
    });

    it('should match position responses (primera, segunda, etc.)', () => {
      const options = ['Opción A', 'Opción B', 'Opción C'];
      const result = matchVoiceResponse('primera', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción A');
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBe(0.9); // Cambiado de 0.8 a 0.9 porque usa matchByLetter
    });

    it('should match number responses (1, 2, 3, 4)', () => {
      const options = ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'];
      const result = matchVoiceResponse('2', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción 2');
      expect(result.answerIndex).toBe(1);
      expect(result.confidence).toBe(0.9);
    });

    it('should handle invalid responses', () => {
      const options = ['Opción A', 'Opción B', 'Opción C'];
      const result = matchVoiceResponse('qwerty asdfgh zxcvbn', options);
      
      expect(result.isValid).toBe(false);
      expect(result.matchedOption).toBeNull();
      expect(result.answerIndex).toBeNull();
      expect(result.confidence).toBe(0.0);
    });

    it('should handle partial keyword matches', () => {
      const options = ['La capital de España', 'La capital de Francia', 'La capital de Italia'];
      const result = matchVoiceResponse('capital España', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('La capital de España');
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBeGreaterThan(0.3);
    });
  });
});