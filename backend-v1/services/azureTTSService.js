const sdk = require('microsoft-cognitiveservices-speech-sdk');

class AzureTTSService {
    constructor() {
        if (!process.env.AZURE_API_KEY || !process.env.AZURE_TTS_REGION) {
            throw new Error('Azure credentials not properly configured');
        }

        this.speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.AZURE_API_KEY,
            process.env.AZURE_TTS_REGION
        );

        // Configurar formato de salida MP3 para mejor compatibilidad
        this.speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3;
        
        // Configurar la voz en español por defecto
        this.speechConfig.speechSynthesisVoiceName = "es-ES-ElviraNeural";

        // Mapa de voces por idioma (voces neurales de alta calidad)
        this.voiceMap = {
            'es-ES': 'es-ES-ElviraNeural',
            'es-MX': 'es-MX-DaliaNeural',
            'es-AR': 'es-AR-ElenaNeural',
            'es-CO': 'es-CO-SalomeNeural',
            'en-US': 'en-US-JennyNeural',
            'en-GB': 'en-GB-SoniaNeural',
            'pt-BR': 'pt-BR-FranciscaNeural',
            'fr-FR': 'fr-FR-DeniseNeural',
            'de-DE': 'de-DE-KatjaNeural',
            'it-IT': 'it-IT-ElsaNeural'
        };
    }

    async synthesizeSpeech(text, options = {}) {
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid text input');
        }

        return new Promise((resolve, reject) => {
            try {
                // Aplicar opciones de voz
                if (options.voiceName) {
                    // Si se especifica un nombre de voz, usarlo directamente
                    this.speechConfig.speechSynthesisVoiceName = options.voiceName;
                } else if (options.language && options.gender) {
                    // Si no hay voz específica pero tenemos idioma y género, buscar una voz apropiada
                    const matchingVoice = predefinedVoices.find(v => 
                        v.locale === options.language && 
                        v.gender.toLowerCase() === options.gender.toLowerCase()
                    );
                    if (matchingVoice) {
                        this.speechConfig.speechSynthesisVoiceName = matchingVoice.name;
                    } else {
                        // Fallback a la voz por defecto del idioma
                        this.speechConfig.speechSynthesisVoiceName = this.voiceMap[options.language] || 'es-ES-ElviraNeural';
                    }
                }

                console.log('Using voice:', this.speechConfig.speechSynthesisVoiceName);
                // Crear sintetizador
                const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig);

                // Sintetizar el texto
                synthesizer.speakTextAsync(
                    text,
                    result => {
                        synthesizer.close();
                        
                        if (result.errorDetails) {
                            reject(new Error(`Synthesis failed: ${result.errorDetails}`));
                            return;
                        }

                        resolve(Buffer.from(result.audioData));
                    },
                    error => {
                        synthesizer.close();
                        reject(error);
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    async getAvailableVoices() {
        return new Promise((resolve, reject) => {
            try {
                // Usar voces predefinidas para evitar problemas con el SDK
                const predefinedVoices = [
                    { name: 'es-ES-ElviraNeural', locale: 'es-ES', gender: 'Female', voiceType: 'Neural' },
                    { name: 'es-ES-AlvaroNeural', locale: 'es-ES', gender: 'Male', voiceType: 'Neural' },
                    { name: 'es-MX-DaliaNeural', locale: 'es-MX', gender: 'Female', voiceType: 'Neural' },
                    { name: 'es-MX-JorgeNeural', locale: 'es-MX', gender: 'Male', voiceType: 'Neural' },
                    { name: 'es-AR-ElenaNeural', locale: 'es-AR', gender: 'Female', voiceType: 'Neural' },
                    { name: 'es-AR-TomasNeural', locale: 'es-AR', gender: 'Male', voiceType: 'Neural' },
                    { name: 'es-CO-SalomeNeural', locale: 'es-CO', gender: 'Female', voiceType: 'Neural' },
                    { name: 'es-CO-GonzaloNeural', locale: 'es-CO', gender: 'Male', voiceType: 'Neural' },
                    { name: 'en-US-JennyNeural', locale: 'en-US', gender: 'Female', voiceType: 'Neural' },
                    { name: 'en-US-GuyNeural', locale: 'en-US', gender: 'Male', voiceType: 'Neural' },
                    { name: 'en-GB-SoniaNeural', locale: 'en-GB', gender: 'Female', voiceType: 'Neural' },
                    { name: 'en-GB-RyanNeural', locale: 'en-GB', gender: 'Male', voiceType: 'Neural' },
                    { name: 'pt-BR-FranciscaNeural', locale: 'pt-BR', gender: 'Female', voiceType: 'Neural' },
                    { name: 'pt-BR-AntonioNeural', locale: 'pt-BR', gender: 'Male', voiceType: 'Neural' },
                    { name: 'fr-FR-DeniseNeural', locale: 'fr-FR', gender: 'Female', voiceType: 'Neural' },
                    { name: 'fr-FR-HenriNeural', locale: 'fr-FR', gender: 'Male', voiceType: 'Neural' },
                    { name: 'de-DE-KatjaNeural', locale: 'de-DE', gender: 'Female', voiceType: 'Neural' },
                    { name: 'de-DE-KillianNeural', locale: 'de-DE', gender: 'Male', voiceType: 'Neural' },
                    { name: 'it-IT-ElsaNeural', locale: 'it-IT', gender: 'Female', voiceType: 'Neural' },
                    { name: 'it-IT-DiegoNeural', locale: 'it-IT', gender: 'Male', voiceType: 'Neural' }
                ];

                const voices = predefinedVoices.map(voice => ({
                    name: voice.name,
                    locale: voice.locale,
                    gender: voice.gender,
                    isNeural: voice.voiceType === 'Neural'
                }));

                resolve(voices);
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = new AzureTTSService();
