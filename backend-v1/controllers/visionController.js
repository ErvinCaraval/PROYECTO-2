const axios = require('axios');
const azureVisionService = require('../services/azureVisionService');
const { validateFileSize, validateMimeType } = require('../utils/validators');

const MAX_IMAGE_SIZE_MB = 4;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];

exports.analyzeImage = async (req, res) => {
  try {
    if (!azureVisionService.enabled) {
      return res.status(503).json({
        success: false,
        error: 'Azure Computer Vision service is not configured'
      });
    }

    const { imageBase64, imageUrl, mimeType, language = 'es' } = req.body || {};

    let imageBuffer;
    let detectedMime = mimeType;

    if (imageBase64) {
      const parsed = parseBase64Image(imageBase64);
      imageBuffer = parsed.buffer;
      detectedMime = detectedMime || parsed.mimeType;
    } else if (imageUrl) {
      const downloaded = await downloadImage(imageUrl);
      imageBuffer = downloaded.buffer;
      detectedMime = detectedMime || downloaded.mimeType;
    } else if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
      detectedMime = detectedMime || req.file.mimetype;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Provide imageBase64, imageUrl or a file upload'
      });
    }

    detectedMime = detectedMime || 'image/jpeg';

    const sizeValidation = validateFileSize(imageBuffer.length, MAX_IMAGE_SIZE_MB);
    if (!sizeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: sizeValidation.message
      });
    }

    const typeValidation = validateMimeType(detectedMime, ALLOWED_MIME_TYPES);
    if (!typeValidation.valid) {
      return res.status(400).json({
        success: false,
        error: typeValidation.message
      });
    }

    const analysis = await azureVisionService.analyzeImage(imageBuffer, { language });

    if (!analysis) {
      throw new Error('Failed to analyze image');
    }

    const objectSummary = summarizeObjects(analysis.objects);
    const questionSuggestions = buildQuestionSuggestions(analysis);

    return res.json({
      success: true,
      analysis: {
        description: analysis.description,
        tags: analysis.tags,
        categories: analysis.categories,
        objects: analysis.objects,
        colors: analysis.color,
        metadata: analysis.metadata,
        objectSummary
      },
      questionSuggestions,
      processedAt: new Date().toISOString(),
      language
    });
  } catch (error) {
    console.error('Error analyzing image:', error.message);
    const status = deriveStatusCode(error);
    return res.status(status).json({
      success: false,
      error: error.message || 'Error analyzing image'
    });
  }
};

function parseBase64Image(imageBase64) {
  let base64Data = imageBase64;
  let detectedMime = 'image/jpeg';

  if (base64Data.includes(',')) {
    const [meta, data] = base64Data.split(',');
    base64Data = data;
    const mimeMatch = meta.match(/data:(.*?);base64/);
    if (mimeMatch && mimeMatch[1]) {
      detectedMime = mimeMatch[1];
    }
  }

  try {
    return {
      buffer: Buffer.from(base64Data, 'base64'),
      mimeType: detectedMime
    };
  } catch (error) {
    throw new Error('Invalid base64 image data');
  }
}

async function downloadImage(imageUrl) {
  if (typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
    throw new Error('Invalid image URL');
  }

  const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 20000 });

  return {
    buffer: Buffer.from(response.data),
    mimeType: response.headers['content-type'] || 'image/jpeg'
  };
}

function summarizeObjects(objects = []) {
  const summaryMap = objects.reduce((acc, object) => {
    if (!object.name) {
      return acc;
    }
    acc[object.name] = acc[object.name] ? acc[object.name] + 1 : 1;
    return acc;
  }, {});

  return Object.entries(summaryMap).map(([name, count]) => ({ name, count }));
}

function buildQuestionSuggestions(analysis) {
  const primaryCaption = analysis.description?.primary?.text;
  const tags = (analysis.tags || []).map(tag => tag.name).filter(Boolean);
  const objects = (analysis.objects || []).map(obj => obj.name).filter(Boolean);
  const options = Array.from(new Set([...tags, ...objects])).slice(0, 4);

  const fallbackQuestion = primaryCaption
    ? `¿Qué se muestra en esta imagen?`
    : '¿Qué describe mejor la imagen?';

  const suggestedQuestion = primaryCaption || objects[0]
    ? `${fallbackQuestion}`
    : '¿Qué ves en la imagen?';

  const suggestedAnswer = options[0] || primaryCaption || null;

  return {
    question: suggestedQuestion,
    descriptionContext: primaryCaption || null,
    categorySuggestion: analysis.categories?.[0]?.name || null,
    options,
    suggestedAnswer,
    confidence: analysis.description?.primary?.confidence || analysis.tags?.[0]?.confidence || null
  };
}

function deriveStatusCode(error) {
  const message = error.message || '';

  if (message.toLowerCase().includes('rate limit')) {
    return 429;
  }
  if (message.toLowerCase().includes('not configured')) {
    return 503;
  }
  if (message.toLowerCase().includes('invalid image')) {
    return 400;
  }
  if (message.toLowerCase().includes('invalid base64')) {
    return 400;
  }
  if (message.toLowerCase().includes('provide image')) {
    return 400;
  }
  return 500;
}

