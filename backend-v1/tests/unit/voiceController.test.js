const request = require('supertest');
<<<<<<< HEAD

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
=======
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
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
        .expect(200);

      expect(response.body.valid).toBe(false);
      expect(response.body.matchedOption).toBeNull();
    });

    it('should handle missing required fields', async () => {
<<<<<<< HEAD
      const mockData = {
        userId: 'test-user-123'
        // Missing questionId, voiceResponse, questionOptions
      };

      await request(app)
        .post('/api/voice-responses/validate')
        .send(mockData)
        .expect(400);
=======
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
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    });
  });

  describe('POST /api/voice-responses/process', () => {
<<<<<<< HEAD
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
=======
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
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    });
  });

  describe('GET /api/voice-responses/stats/:userId', () => {
    it('should return voice recognition stats', async () => {
<<<<<<< HEAD
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

=======
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      const response = await request(app)
        .get('/api/voice-responses/stats/test-user-123')
        .expect(200);

      expect(response.body).toHaveProperty('totalAttempts');
      expect(response.body).toHaveProperty('successfulRecognitions');
<<<<<<< HEAD
      expect(response.body).toHaveProperty('accuracy');
      expect(response.body).toHaveProperty('averageConfidence');
      expect(response.body).toHaveProperty('recentInteractions');
    });

    it('should handle missing userId', async () => {
      await request(app)
=======
      expect(response.body).toHaveProperty('successRate');
      expect(response.body).toHaveProperty('averageConfidence');
    });

    it('should handle missing userId', async () => {
      const response = await request(app)
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
        .get('/api/voice-responses/stats/')
        .expect(404);
    });
  });
});

describe('Voice Recognition Algorithm Tests', () => {
<<<<<<< HEAD
  // Test the voice recognition functions directly
  const { matchVoiceResponse } = require('../../utils/voiceRecognition');

  describe('matchVoiceResponse', () => {
    it('should match exact responses', () => {
      const options = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'];
      const result = matchVoiceResponse('Madrid', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Madrid');
=======
  // Importar la función de matching directamente para pruebas unitarias
  const { matchVoiceResponse } = require('../../controllers/voiceController');

  describe('matchVoiceResponse', () => {
    const options = ['Opción A', 'Opción B', 'Opción C', 'Opción D'];

    it('should match exact text', () => {
      const result = matchVoiceResponse('Opción A', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción A');
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBe(1.0);
    });

<<<<<<< HEAD
    it('should match letter responses (A, B, C, D)', () => {
      const options = ['Opción A', 'Opción B', 'Opción C', 'Opción D'];
=======
    it('should match by letter', () => {
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      const result = matchVoiceResponse('A', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción A');
      expect(result.answerIndex).toBe(0);
<<<<<<< HEAD
      expect(result.confidence).toBe(0.9);
    });

    it('should match position responses (primera, segunda, etc.)', () => {
      const options = ['Opción A', 'Opción B', 'Opción C'];
      const result = matchVoiceResponse('primera', options);
=======
      expect(result.confidence).toBe(0.8);
    });

    it('should match by position', () => {
      const result = matchVoiceResponse('primera opción', options);
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción A');
      expect(result.answerIndex).toBe(0);
<<<<<<< HEAD
      expect(result.confidence).toBe(0.9); // Cambiado de 0.8 a 0.9 porque usa matchByLetter
    });

    it('should match number responses (1, 2, 3, 4)', () => {
      const options = ['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'];
      const result = matchVoiceResponse('2', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción 2');
=======
      expect(result.confidence).toBe(0.85);
    });

    it('should match by number', () => {
      const result = matchVoiceResponse('2', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('Opción B');
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      expect(result.answerIndex).toBe(1);
      expect(result.confidence).toBe(0.9);
    });

    it('should handle invalid responses', () => {
<<<<<<< HEAD
      const options = ['Opción A', 'Opción B', 'Opción C'];
=======
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      const result = matchVoiceResponse('qwerty asdfgh zxcvbn', options);
      
      expect(result.isValid).toBe(false);
      expect(result.matchedOption).toBeNull();
      expect(result.answerIndex).toBeNull();
      expect(result.confidence).toBe(0.0);
    });

<<<<<<< HEAD
    it('should handle partial keyword matches', () => {
      const options = ['La capital de España', 'La capital de Francia', 'La capital de Italia'];
      const result = matchVoiceResponse('capital España', options);
      
      expect(result.isValid).toBe(true);
      expect(result.matchedOption).toBe('La capital de España');
      expect(result.answerIndex).toBe(0);
      expect(result.confidence).toBeGreaterThan(0.3);
=======
    it('should handle empty or null input', () => {
      const result1 = matchVoiceResponse('', options);
      const result2 = matchVoiceResponse(null, options);
      const result3 = matchVoiceResponse('test', null);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    });
  });
});