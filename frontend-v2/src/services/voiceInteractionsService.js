// Voice Interactions Service - Log voice interactions to backend
class VoiceInteractionsService {
  constructor() {
    this.apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async logInteraction(interaction) {
    try {
      console.log('[VoiceInteractionsService] Log interaction:', interaction);
      const response = await fetch(`${this.apiBase}/api/voice-interactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...interaction,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[VoiceInteractionsService] Log result:', result);
      return result;
    } catch (error) {
      console.error('Error logging voice interaction:', error);
      // Don't throw error to avoid breaking the user experience
      return null;
    }
  }

  async logQuestionRead(userId, questionId, questionText, duration) {
    return this.logInteraction({
      userId,
      questionId,
      action: 'question_read',
      duration,
      voiceText: questionText,
      metadata: {
        questionText,
        readType: 'full_question'
      }
    });
  }

  async logOptionRead(userId, questionId, optionIndex, optionText, duration) {
    return this.logInteraction({
      userId,
      questionId,
      action: 'option_read',
      duration,
      voiceText: optionText,
      metadata: {
        optionIndex,
        optionText,
        optionLetter: String.fromCharCode(65 + optionIndex)
      }
    });
  }

  async logVoiceAnswer(userId, questionId, voiceResponse, confidence, matchedOption, answerIndex) {
    return this.logInteraction({
      userId,
      questionId,
      action: 'voice_answer',
      duration: 0, // Will be calculated if needed
      voiceText: voiceResponse,
      confidence,
      metadata: {
        matchedOption,
        answerIndex,
        recognitionType: 'voice_command'
      }
    });
  }

  async logSettingsChange(userId, oldSettings, newSettings) {
    return this.logInteraction({
      userId,
      questionId: 'settings',
      action: 'settings_changed',
      duration: 0,
      metadata: {
        oldSettings,
        newSettings,
        changedFields: Object.keys(newSettings).filter(key => 
          oldSettings[key] !== newSettings[key]
        )
      }
    });
  }

  async logTutorialInteraction(userId, tutorialStep, action, duration) {
    return this.logInteraction({
      userId,
      questionId: 'tutorial',
      action: `tutorial_${action}`,
      duration,
      metadata: {
        tutorialStep,
        action
      }
    });
  }

  async getUserVoiceHistory(userId) {
    try {
      console.log('[VoiceInteractionsService] Fetching voice history for:', userId);
      const response = await fetch(`${this.apiBase}/api/voice-interactions/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[VoiceInteractionsService] Voice history result:', data);
      return data;
    } catch (error) {
      console.error('Error fetching user voice history:', error);
      return [];
    }
  }

  async getUserVoiceStats(userId) {
    try {
      const response = await fetch(`${this.apiBase}/api/voice-interactions/stats/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching voice stats:', error);
      return {
        total: 0,
        averageDuration: 0
      };
    }
  }

  async deleteUserVoiceHistory(userId) {
    try {
      const response = await fetch(`${this.apiBase}/api/voice-interactions/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting voice history:', error);
      return null;
    }
  }

  getSessionId() {
    return this.sessionId;
  }

  // Helper method to measure duration
  createTimer() {
    const startTime = Date.now();
    return {
      getDuration: () => Date.now() - startTime
    };
  }
}

// Create singleton instance
const voiceInteractionsService = new VoiceInteractionsService();

export default voiceInteractionsService;
