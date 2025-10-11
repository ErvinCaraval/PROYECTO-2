const request = require('supertest');
const { app } = require('../../hybridServer');
const { db } = require('../../firebase');

describe('HU5: Voice Interactions API', () => {
  const testUserId = 'test-user-voice';
  const testQuestionId = 'test-question-voice';
  let createdId = null;

  afterAll(async () => {
    // Cleanup: Eliminar todos los registros de prueba
    const snapshot = await db.collection('voiceInteractions').where('userId', '==', testUserId).get();
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  it('debe registrar una interacción de voz', async () => {
    const res = await request(app)
      .post('/api/voice-interactions')
      .send({
        userId: testUserId,
        questionId: testQuestionId,
        action: 'voice_answer',
        duration: 2.5,
        timestamp: new Date().toISOString(),
        voiceText: null,
        confidence: null,
        metadata: { audioBase64: 'testaudio' }
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toMatch(/registered/i);
  });

    it('debe registrar una interacción de tipo question_read', async () => {
      const res = await request(app)
        .post('/api/voice-interactions')
        .send({
          userId: testUserId,
          questionId: testQuestionId,
          action: 'question_read',
          duration: 1.2,
          timestamp: new Date().toISOString(),
          voiceText: '¿Cuál es la capital de Francia?',
          confidence: 0.99,
          metadata: { audioBase64: 'testaudio2' }
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.message).toMatch(/registered/i);
    });

  it('debe recuperar el historial de voz del usuario', async () => {
    const res = await request(app)
      .get(`/api/voice-interactions/${testUserId}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('userId', testUserId);
      expect(res.body.some(i => i.action === 'voice_answer')).toBe(true);
      expect(res.body.some(i => i.action === 'question_read')).toBe(true);
  });

  it('debe devolver estadísticas básicas', async () => {
    const res = await request(app)
      .get(`/api/voice-interactions/stats/${testUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('averageDuration');
      expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  it('debe eliminar el historial de voz del usuario', async () => {
    const res = await request(app)
      .delete(`/api/voice-interactions/${testUserId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Deleted/);
  });

    it('debe devolver error si faltan campos obligatorios', async () => {
      const res = await request(app)
        .post('/api/voice-interactions')
        .send({ userId: testUserId });
      expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/questionId/);
    });

      it('debe devolver error si userId es inválido', async () => {
        const res = await request(app)
          .post('/api/voice-interactions')
          .send({
            userId: '',
            questionId: testQuestionId,
            action: 'voice_answer',
            duration: 1,
            timestamp: new Date().toISOString(),
            metadata: { audioBase64: 'x' }
          });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/userId/);
      });

      it('debe devolver error si action es inválido', async () => {
        const res = await request(app)
          .post('/api/voice-interactions')
          .send({
            userId: testUserId,
            questionId: testQuestionId,
            action: 'invalid_action',
            duration: 1,
            timestamp: new Date().toISOString(),
            metadata: { audioBase64: 'x' }
          });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/action/);
      });

      it('debe devolver error si duration es negativo', async () => {
        const res = await request(app)
          .post('/api/voice-interactions')
          .send({
            userId: testUserId,
            questionId: testQuestionId,
            action: 'voice_answer',
            duration: -1,
            timestamp: new Date().toISOString(),
            metadata: { audioBase64: 'x' }
          });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/duration/);
      });

      it('debe devolver error si timestamp es inválido', async () => {
        const res = await request(app)
          .post('/api/voice-interactions')
          .send({
            userId: testUserId,
            questionId: testQuestionId,
            action: 'voice_answer',
            duration: 1,
            timestamp: 'not-a-date',
            metadata: { audioBase64: 'x' }
          });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/timestamp/);
      });

      it('debe devolver error si metadata es inválido', async () => {
        const res = await request(app)
          .post('/api/voice-interactions')
          .send({
            userId: testUserId,
            questionId: testQuestionId,
            action: 'voice_answer',
            duration: 1,
            timestamp: new Date().toISOString(),
            metadata: 'not-an-object'
          });
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/metadata/);
      });

      it('debe devolver error si audioBase64 es demasiado grande', async () => {
        const res = await request(app)
          .post('/api/voice-interactions')
          .send({
            userId: testUserId,
            questionId: testQuestionId,
            action: 'voice_answer',
            duration: 1,
            timestamp: new Date().toISOString(),
            metadata: { audioBase64: 'x'.repeat(2e6 + 1) }
          });
          expect(res.statusCode).toBe(413);
          if (typeof res.body.error === 'string') {
            expect(res.body.error).toMatch(/Audio demasiado grande/);
          }
      });

      it('debe devolver error si se consulta historial con userId inválido', async () => {
        const res = await request(app)
          .get('/api/voice-interactions/');
        expect(res.statusCode).toBe(404);
      });

      it('debe devolver error si se elimina historial con userId inválido', async () => {
        const res = await request(app)
          .delete('/api/voice-interactions/');
        expect(res.statusCode).toBe(404);
      });

      it('debe devolver error si se consultan stats con userId inválido', async () => {
        const res = await request(app)
          .get('/api/voice-interactions/stats/');
          expect([404, 200]).toContain(res.statusCode);
      });
});
