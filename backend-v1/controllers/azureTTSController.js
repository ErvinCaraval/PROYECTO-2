const axios = require('axios');

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"\n\r]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&#39;';
      case '"': return '&quot;';
      case '\n': return ' ';
      case '\r': return ' ';
      default: return c;
    }
  });
}

const region = process.env.AZURE_TTS_REGION;
const key = process.env.AZURE_API_KEY;
// Allow overriding the full endpoint (useful when using the cognitive services endpoint)
// Example: AZURE_ENDPOINT=https://brazilsouth.api.cognitive.microsoft.com
const endpoint = (process.env.AZURE_ENDPOINT && process.env.AZURE_ENDPOINT.replace(/\/$/, '')) || (region ? `https://${region}.tts.speech.microsoft.com` : 'https://brazilsouth.tts.speech.microsoft.com');

const voicesListUrl = `${endpoint}/cognitiveservices/voices/list`;
const ttsUrl = `${endpoint}/cognitiveservices/v1`;

exports.getStatus = (req, res) => {
  res.json({ azureConfigured: !!(region && key) });
};

exports.getVoices = async (req, res) => {
  if (!voicesListUrl || !key) {
    return res.status(500).json({ error: 'Azure TTS not configured on server' });
  }

  try {
    const response = await axios.get(voicesListUrl, {
      headers: {
        'Ocp-Apim-Subscription-Key': key
      }
    });
    // response.data is an array of voice objects
    res.json({ voices: response.data });
  } catch (err) {
    console.error('Error fetching Azure voices:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch voices', details: err.message });
  }
};

exports.textToSpeech = async (req, res) => {
  if (!ttsUrl || !key) {
    return res.status(500).json({ error: 'Azure TTS not configured on server' });
  }

  const { text, voiceName, language, format } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Missing text for TTS' });

  const lang = language || 'es-ES';
  // Si la voz proporcionada es de Google, usar una voz de Azure por defecto
  const defaultVoice = 'es-ES-ElviraNeural';
  const voice = (!voiceName || voiceName.toLowerCase().includes('google')) ? defaultVoice : voiceName;
  
  // Build SSML
  const safeText = escapeXml(String(text));
  const ssml = `<?xml version="1.0" encoding="utf-8"?>` +
    `<speak version='1.0' xml:lang='${lang}'>` +
    `<voice name='${voice}'>${safeText}</voice>` +
    `</speak>`;

  try {
    console.log('Azure TTS Request:', {
      url: ttsUrl,
      voice: voiceName,
      language: lang,
      textLength: text.length
    });

    const outputFormat = format || 'audio-16khz-128kbitrate-mono-mp3';
    const response = await axios.post(ttsUrl, ssml, {
      responseType: 'arraybuffer',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': outputFormat,
        'User-Agent': 'brainblitz-backend'
      },
      timeout: 20000
    });
    
    console.log('Azure TTS Response:', {
      status: response.status,
      contentType: response.headers['content-type'],
      contentLength: response.data.length,
      success: true
    });

    // Map some common output formats to content types
    const contentType = outputFormat.includes('mp3') ? 'audio/mpeg' : (outputFormat.includes('wav') ? 'audio/wav' : 'application/octet-stream');
    res.set('Content-Type', contentType);
    return res.send(Buffer.from(response.data, 'binary'));
  } catch (err) {
    console.error('Azure TTS error:', {
      message: err.message,
      response: err.response ? {
        status: err.response.status,
        data: err.response.data,
        headers: err.response.headers
      } : null,
      config: err.config ? {
        url: err.config.url,
        headers: err.config.headers,
        data: err.config.data
      } : null
    });
    
    const message = err.response && err.response.data 
      ? (err.response.data.toString ? err.response.data.toString('utf8') : String(err.response.data)) 
      : err.message || 'TTS error';
      
    return res.status(500).json({ 
      error: 'Azure TTS request failed', 
      details: message,
      endpoint: ttsUrl
    });
  }
};
