const axios = require('axios');

const DEFAULT_VISUAL_FEATURES = ['Description', 'Tags', 'Categories', 'Objects', 'Color'];

class AzureVisionService {
  constructor() {
    const apiKey = process.env.AZURE_CV_API_KEY;
    const endpoint = process.env.AZURE_CV_ENDPOINT;

    if (!apiKey || !endpoint) {
      console.warn('⚠️  Azure Computer Vision credentials not configured - Analyze Image service disabled');
      this.enabled = false;
      return;
    }

    this.enabled = true;
    this.apiKey = apiKey;
    this.endpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    this.analyzeUrl = `${this.endpoint}vision/v3.2/analyze`;

    console.log('✅ Azure Computer Vision Analyze service initialized');
  }

  /**
   * Calls Azure Computer Vision Analyze endpoint
   * @param {Buffer} imageBuffer
   * @param {object} options
   * @returns {Promise<object>}
   */
  async analyzeImage(imageBuffer, options = {}) {
    if (!this.enabled) {
      throw new Error('Azure Computer Vision Analyze service is not configured');
    }

    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error('Invalid image buffer');
    }

    const visualFeatures = options.visualFeatures || DEFAULT_VISUAL_FEATURES;
    const language = options.language || 'es';
    const details = options.details || []; // e.g., ['Landmarks', 'Celebrities']

    const params = new URLSearchParams({
      visualFeatures: visualFeatures.join(','),
      language
    });

    if (details.length) {
      params.append('details', details.join(','));
    }

    try {
      const response = await axios.post(
        `${this.analyzeUrl}?${params.toString()}`,
        imageBuffer,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.apiKey,
            'Content-Type': 'application/octet-stream'
          },
          timeout: options.timeout || 45000
        }
      );

      return this.normalizeResponse(response.data);
    } catch (error) {
      console.error('❌ Error calling Azure Analyze Image:', error.message);
      if (error.response) {
        console.error('Azure response data:', error.response.data);
      }
      throw new Error(error.response?.data?.error?.message || 'Azure Analyze request failed');
    }
  }

  /**
   * Normalize Azure response to a format easier to consume in controllers
   * @param {object} data
   * @returns {object}
   */
  normalizeResponse(data = {}) {
    const captions = Array.isArray(data.description?.captions)
      ? [...data.description.captions]
      : [];
    const sortedCaptions = captions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const primaryCaption = sortedCaptions[0] || null;

    const tags = Array.isArray(data.tags) ? [...data.tags] : [];
    tags.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    const descriptionTags = Array.isArray(data.description?.tags)
      ? data.description.tags
      : [];

    const categories = Array.isArray(data.categories) ? [...data.categories] : [];
    categories.sort((a, b) => (b.score || 0) - (a.score || 0));

    const objects = Array.isArray(data.objects) ? [...data.objects] : [];
    objects.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    return {
      success: true,
      description: {
        primary: primaryCaption
          ? {
            text: primaryCaption.text,
            confidence: primaryCaption.confidence
          }
          : null,
        captions: sortedCaptions.map(caption => ({
          text: caption.text,
          confidence: caption.confidence
        })),
        tags: descriptionTags
      },
      tags: tags.map(tag => ({
        name: tag.name,
        confidence: tag.confidence
      })),
      categories: categories.map(category => ({
        name: category.name,
        confidence: category.score,
        detail: category.detail || null
      })),
      objects: objects.map(obj => ({
        name: obj.object,
        confidence: obj.confidence,
        rectangle: obj.rectangle || obj.boundingBox || null,
        parent: obj.parent ? { name: obj.parent.object, confidence: obj.parent.confidence } : null
      })),
      color: data.color
        ? {
          dominantColors: data.color.dominantColors || [],
          accentColor: data.color.accentColor || null,
          dominantForegroundColor: data.color.dominantForegroundColor || null,
          dominantBackgroundColor: data.color.dominantBackgroundColor || null,
          isBWImg: Boolean(data.color.isBWImg)
        }
        : null,
      metadata: data.metadata || {},
      raw: data
    };
  }
}

module.exports = new AzureVisionService();

