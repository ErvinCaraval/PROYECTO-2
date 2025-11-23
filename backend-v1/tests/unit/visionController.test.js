const visionController = require('../../controllers/visionController');
const azureVisionService = require('../../services/azureVisionService');

jest.mock('../../services/azureVisionService', () => ({
  analyzeImage: jest.fn(),
  enabled: true
}));

describe('visionController.analyzeImage', () => {
  let req;
  let res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    azureVisionService.enabled = true;
    azureVisionService.analyzeImage.mockReset();
  });

  it('should return 400 when no image data is provided', async () => {
    await visionController.analyzeImage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.stringContaining('Provide image')
    }));
  });

  it('should return 503 when Azure service is disabled', async () => {
    azureVisionService.enabled = false;
    await visionController.analyzeImage(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false
    }));
  });

  it('should return 400 on invalid base64 payload', async () => {
    req.body = { imageBase64: 'invalid-base64' };
    azureVisionService.analyzeImage.mockRejectedValue(new Error('Invalid image'));
    await visionController.analyzeImage(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false
    }));
  });

  it('should respond with analysis data on success', async () => {
    const sampleBuffer = Buffer.from('test-image');
    req.body = {
      imageBase64: `data:image/png;base64,${sampleBuffer.toString('base64')}`
    };

    const normalizedAnalysis = {
      description: {
        primary: { text: 'Un gato en la sala', confidence: 0.92 },
        captions: [],
        tags: ['gato', 'sala']
      },
      tags: [{ name: 'cat', confidence: 0.95 }],
      categories: [{ name: 'animal_cat', confidence: 0.8 }],
      objects: [{ name: 'cat', confidence: 0.9, rectangle: null }],
      color: { dominantColors: ['Gray'] },
      metadata: { width: 640, height: 480, format: 'png' }
    };

    azureVisionService.analyzeImage.mockResolvedValue(normalizedAnalysis);

    await visionController.analyzeImage(req, res);

    expect(azureVisionService.analyzeImage).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      analysis: expect.objectContaining({
        description: normalizedAnalysis.description,
        tags: normalizedAnalysis.tags
      }),
      questionSuggestions: expect.any(Object)
    }));
  });
});

