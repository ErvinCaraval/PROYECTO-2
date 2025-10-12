const { Server } = require('socket.io');
const { createServer } = require('http');
const Client = require('socket.io-client');
const { app } = require('../../hybridServer');

describe('Voice WebSocket Integration Tests', () => {
  let io, server, clientSocket, serverSocket;

  beforeAll((done) => {
    server = createServer(app);
    io = new Server(server);
    
    server.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    server.close();
    clientSocket.close();
  });

  describe('Voice Answer Events', () => {
    it('should handle submitVoiceAnswer event', (done) => {
      const mockData = {
        gameId: 'test-game-123',
        uid: 'test-user-123',
        voiceResponse: 'primera opción',
        questionOptions: ['Opción A', 'Opción B', 'Opción C', 'Opción D']
      };

      clientSocket.emit('submitVoiceAnswer', mockData);

      // Listen for the response
      clientSocket.on('voiceAnswerReceived', (data) => {
        expect(data).toHaveProperty('uid');
        expect(data).toHaveProperty('confidence');
        expect(data).toHaveProperty('matchedOption');
        done();
      });

      clientSocket.on('voiceAnswerError', (data) => {
        // This might happen if the game doesn't exist
        expect(data).toHaveProperty('error');
        done();
      });
    });

    it('should handle voice answer error for invalid response', (done) => {
      const mockData = {
        gameId: 'test-game-123',
        uid: 'test-user-123',
        voiceResponse: 'respuesta completamente inválida',
        questionOptions: ['Opción A', 'Opción B', 'Opción C', 'Opción D']
      };

      clientSocket.emit('submitVoiceAnswer', mockData);

      clientSocket.on('voiceAnswerError', (data) => {
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('suggestions');
        expect(Array.isArray(data.suggestions)).toBe(true);
        done();
      });
    });
  });

  describe('Voice Mode Toggle Events', () => {
    it('should handle toggleVoiceMode event', (done) => {
      const mockData = {
        gameId: 'test-game-123',
        uid: 'test-user-123',
        voiceModeEnabled: true
      };

      clientSocket.emit('toggleVoiceMode', mockData);

      clientSocket.on('voiceModeChanged', (data) => {
        expect(data).toHaveProperty('uid');
        expect(data).toHaveProperty('voiceModeEnabled');
        expect(data).toHaveProperty('players');
        expect(data.uid).toBe('test-user-123');
        expect(data.voiceModeEnabled).toBe(true);
        done();
      });

      clientSocket.on('error', (data) => {
        // This might happen if the game doesn't exist
        expect(data).toHaveProperty('error');
        done();
      });
    });
  });

  describe('Voice Mode Status Events', () => {
    it('should handle getVoiceModeStatus event', (done) => {
      const mockData = {
        gameId: 'test-game-123'
      };

      clientSocket.emit('getVoiceModeStatus', mockData);

      clientSocket.on('voiceModeStatus', (data) => {
        expect(data).toHaveProperty('players');
        expect(Array.isArray(data.players)).toBe(true);
        done();
      });

      clientSocket.on('error', (data) => {
        // This might happen if the game doesn't exist
        expect(data).toHaveProperty('error');
        done();
      });
    });
  });
});

describe('Voice Recognition Algorithm Integration', () => {
  // Test the voice recognition functions with real data
  const { matchVoiceResponse } = require('../../hybridServer');

  describe('Real-world voice response scenarios', () => {
    it('should handle common Spanish voice responses', () => {
      const options = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'];
      
      const testCases = [
        { input: 'madrid', expected: 'Madrid', index: 0 },
        { input: 'primera', expected: 'Madrid', index: 0 },
        { input: 'a', expected: 'Madrid', index: 0 },
        { input: '1', expected: 'Madrid', index: 0 },
        { input: 'barcelona', expected: 'Barcelona', index: 1 },
        { input: 'segunda', expected: 'Barcelona', index: 1 },
        { input: 'b', expected: 'Barcelona', index: 1 },
        { input: '2', expected: 'Barcelona', index: 1 }
      ];

      testCases.forEach(({ input, expected, index }) => {
        const result = matchVoiceResponse(input, options);
        expect(result.isValid).toBe(true);
        expect(result.matchedOption).toBe(expected);
        expect(result.answerIndex).toBe(index);
      });
    });

    it('should handle mixed case and punctuation', () => {
      const options = ['Opción A', 'Opción B', 'Opción C', 'Opción D'];
      
      const testCases = [
        'OPCIÓN A',
        'opcion a',
        'Opción A.',
        'primera opción',
        'A!',
        '1.'
      ];

      testCases.forEach(input => {
        const result = matchVoiceResponse(input, options);
        expect(result.isValid).toBe(true);
        expect(result.matchedOption).toBe('Opción A');
        expect(result.answerIndex).toBe(0);
      });
    });

    it('should handle partial matches with keywords', () => {
      const options = [
        'La capital de España es Madrid',
        'La capital de Francia es París',
        'La capital de Italia es Roma'
      ];
      
      const testCases = [
        { input: 'capital españa', expected: 'La capital de España es Madrid', index: 0 },
        { input: 'madrid', expected: 'La capital de España es Madrid', index: 0 },
        { input: 'francia paris', expected: 'La capital de Francia es París', index: 1 }
      ];

      testCases.forEach(({ input, expected, index }) => {
        const result = matchVoiceResponse(input, options);
        expect(result.isValid).toBe(true);
        expect(result.matchedOption).toBe(expected);
        expect(result.answerIndex).toBe(index);
        expect(result.confidence).toBeGreaterThan(0.3);
      });
    });
  });
});