const request = require('supertest');
const express = require('express');
const visionController = require('../../controllers/visionController');
const azureVisionService = require('../../services/azureVisionService');

jest.mock('../../services/azureVisionService', () => ({
  analyzeImage: jest.fn(),
  enabled: true
}));

const app = express();
app.use(express.json({ limit: '5mb' }));
app.post('/api/vision/analyze-image', (req, res) => visionController.analyzeImage(req, res));

describe('Vision Analyze Endpoint', () => {
  beforeEach(() => {
    azureVisionService.enabled = true;
    azureVisionService.analyzeImage.mockReset();
  });

  it('responds with 400 when payload is empty', async () => {
    const response = await request(app)
      .post('/api/vision/analyze-image')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('responds with analysis data when payload is valid', async () => {
    const sampleBuffer = Buffer.from('analyze-image');
    const base64 = `data:image/jpeg;base64,${sampleBuffer.toString('base64')}`;

    azureVisionService.analyzeImage.mockResolvedValue({
      description: { primary: { text: 'Un paisaje', confidence: 0.9 }, captions: [], tags: ['paisaje'] },
      tags: [{ name: 'landscape', confidence: 0.93 }],
      categories: [{ name: 'outdoor_mountain', confidence: 0.88 }],
      objects: [{ name: 'mountain', confidence: 0.9, rectangle: null }],
      color: { dominantColors: ['Blue'] },
      metadata: { width: 800, height: 600, format: 'jpeg' }
    });

    const response = await request(app)
      .post('/api/vision/analyze-image')
      .send({ imageBase64: base64 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.analysis).toHaveProperty('description');
    expect(response.body).toHaveProperty('questionSuggestions');
  });
});

