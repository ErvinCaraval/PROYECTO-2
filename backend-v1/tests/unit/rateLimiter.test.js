const request = require('supertest');
const express = require('express');
const { 
  registerLimiter, 
  passwordRecoveryLimiter, 
  profileUpdateLimiter, 
  generalUserLimiter 
} = require('../../middleware/rateLimiter');

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('registerLimiter', () => {
    beforeEach(() => {
      app.post('/test-register', registerLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    test('should allow requests within limit', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/test-register')
          .send({ email: 'test@test.com', password: 'password', displayName: 'Test' });
        expect(res.status).toBe(200);
      }
    });

    test('should block requests exceeding limit', async () => {
      // Make 5 requests (limit)
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/test-register')
          .send({ email: 'test@test.com', password: 'password', displayName: 'Test' });
      }

      // 6th request should be blocked
      const res = await request(app)
        .post('/test-register')
        .send({ email: 'test@test.com', password: 'password', displayName: 'Test' });
      
      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('passwordRecoveryLimiter', () => {
    beforeEach(() => {
      app.post('/test-recovery', passwordRecoveryLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    test('should allow requests within limit', async () => {
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/test-recovery')
          .send({ email: 'test@test.com' });
        expect(res.status).toBe(200);
      }
    });

    test('should block requests exceeding limit', async () => {
      // Make 3 requests (limit)
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/test-recovery')
          .send({ email: 'test@test.com' });
      }

      // 4th request should be blocked
      const res = await request(app)
        .post('/test-recovery')
        .send({ email: 'test@test.com' });
      
      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('profileUpdateLimiter', () => {
    beforeEach(() => {
      app.put('/test-profile', profileUpdateLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    test('should allow requests within limit', async () => {
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .put('/test-profile')
          .send({ displayName: 'Test' });
        expect(res.status).toBe(200);
      }
    });

    test('should block requests exceeding limit', async () => {
      // Make 10 requests (limit)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .put('/test-profile')
          .send({ displayName: 'Test' });
      }

      // 11th request should be blocked
      const res = await request(app)
        .put('/test-profile')
        .send({ displayName: 'Test' });
      
      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('generalUserLimiter', () => {
    beforeEach(() => {
      app.get('/test-general', generalUserLimiter, (req, res) => {
        res.json({ success: true });
      });
    });

    test('should allow requests within limit', async () => {
      for (let i = 0; i < 100; i++) {
        const res = await request(app).get('/test-general');
        expect(res.status).toBe(200);
      }
    });

    test('should block requests exceeding limit', async () => {
      // Make 100 requests (limit)
      for (let i = 0; i < 100; i++) {
        await request(app).get('/test-general');
      }

      // 101st request should be blocked
      const res = await request(app).get('/test-general');
      
      expect(res.status).toBe(429);
      expect(res.body).toHaveProperty('error');
    });
  });
});
