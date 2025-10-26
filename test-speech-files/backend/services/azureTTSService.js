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

        // Mapa de voces por idioma
        this.voiceMap = {
            'es-ES': 'es-ES-ElviraNeural',
            'es-MX': 'es-MX-DaliaNeural',
            'en-US': 'en-US-JennyNeural'
        };
    }

    async synthesizeSpeech(text, options = {}) {
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid text input');
        }

        return new Promise((resolve, reject) => {
            try {
                // Aplicar opciones de voz
                if (options.language && this.voiceMap[options.language]) {
                    this.speechConfig.speechSynthesisVoiceName = this.voiceMap[options.language];
                } else if (options.voiceName) {
                    this.speechConfig.speechSynthesisVoiceName = options.voiceName;
                }

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
                const synthesizer = new sdk.SpeechSynthesizer(this.speechConfig);
                
                synthesizer.getVoicesAsync(
                    result => {
                        synthesizer.close();
                        const voices = result.voices.map(voice => ({
                            name: voice.name,
                            locale: voice.locale,
                            gender: voice.gender,
                            isNeural: voice.voiceType === 'Neural'
                        }));
                        resolve(voices);
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
}

module.exports = new AzureTTSService();