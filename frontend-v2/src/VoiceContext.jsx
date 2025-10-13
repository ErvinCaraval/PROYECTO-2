import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import voiceService from './services/voiceService';
import voiceInteractionsService from './services/voiceInteractionsService';

const VoiceContext = createContext();

export function useVoice() {
  return useContext(VoiceContext);
}

export function VoiceProvider({ children }) {
  const { user } = useAuth();
  const [isVoiceModeEnabled, setIsVoiceModeEnabled] = useState(false);
  const [userHasVisualDifficulty, setUserHasVisualDifficulty] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user has visual difficulty and auto-enable voice mode
  useEffect(() => {
    const checkUserAccessibility = async () => {
      if (!user) {
        setIsVoiceModeEnabled(false);
        setUserHasVisualDifficulty(false);
        setLoading(false);
        return;
      }

      try {
        // Get user data from Firebase to check visualDifficulty
        const { db } = await import('./services/firebase');
        const { doc, getDoc } = await import('firebase/firestore');
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const hasVisualDifficulty = userData.visualDifficulty || false;
          
          setUserHasVisualDifficulty(hasVisualDifficulty);
          
          // Auto-enable voice mode if user has visual difficulty
          if (hasVisualDifficulty) {
            setIsVoiceModeEnabled(true);
          }
        }
      } catch (error) {
        console.error('Error checking user accessibility:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserAccessibility();
  }, [user]);

  const toggleVoiceMode = () => {
    setIsVoiceModeEnabled(prev => !prev);
  };

  const enableVoiceMode = () => {
    setIsVoiceModeEnabled(true);
  };

  const disableVoiceMode = () => {
    setIsVoiceModeEnabled(false);
  };

  const speak = async (text, options = {}) => {
    if (!isVoiceModeEnabled) {
      console.warn('Voice mode is disabled');
      return;
    }
    
    const timer = voiceInteractionsService.createTimer();
    
    try {
      await voiceService.speak(text, options);
      
      // Log the interaction if user is available
      if (user) {
        const duration = timer.getDuration();
        await voiceInteractionsService.logInteraction({
          userId: user.uid,
          questionId: options.questionId || 'general',
          action: options.action || 'text_read',
          duration,
          voiceText: text,
          metadata: {
            ...options.metadata,
            textLength: text.length
          }
        });
      }
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  const stopSpeaking = () => {
    voiceService.stop();
  };

  const pauseSpeaking = () => {
    voiceService.pause();
  };

  const resumeSpeaking = () => {
    voiceService.resume();
  };

  const updateVoiceSettings = async (newSettings) => {
    const oldSettings = voiceService.getSettings();
    voiceService.updateSettings(newSettings);
    
    // Log settings change
    if (user) {
      await voiceInteractionsService.logSettingsChange(user.uid, oldSettings, newSettings);
    }
  };

  const getVoiceSettings = () => {
    return voiceService.getSettings();
  };

  const getVoiceStatus = () => {
    return voiceService.getStatus();
  };

  const value = {
    // State
    isVoiceModeEnabled,
    userHasVisualDifficulty,
    loading,
    
    // Actions
    toggleVoiceMode,
    enableVoiceMode,
    disableVoiceMode,
    
    // Voice service methods
    speak,
    stopSpeaking,
    pauseSpeaking,
    resumeSpeaking,
    updateVoiceSettings,
    getVoiceSettings,
    getVoiceStatus,
    
    // Service availability
    isVoiceAvailable: voiceService.isAvailable(),
    
    // Voice interactions service
    voiceInteractionsService
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}
