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
    // Subscribe to the user's Firestore doc so we react immediately when it's created/updated.
    let unsubscribe = null;
    const subscribeToUserDoc = async () => {
      if (!user) {
        setIsVoiceModeEnabled(false);
        setUserHasVisualDifficulty(false);
        setLoading(false);
        return;
      }

      try {
        const { db } = await import('./services/firebase');
        const { doc, onSnapshot } = await import('firebase/firestore');

        const userRef = doc(db, 'users', user.uid);
        unsubscribe = onSnapshot(userRef, (snap) => {
          try {
            if (!snap.exists()) {
              // doc not yet created - keep default states but stop loading
              setUserHasVisualDifficulty(false);
              setLoading(false);
              return;
            }

            const data = snap.data() || {};
            const hasVisualDifficulty = data.visualDifficulty || false;
            setUserHasVisualDifficulty(hasVisualDifficulty);

            // Auto-enable voice mode for users with visual difficulty, but don't force-disable
            // if user already intentionally turned voice off.
            setIsVoiceModeEnabled(prev => (hasVisualDifficulty ? true : prev));
            setLoading(false);
          } catch (e) {
            console.error('Error processing user snapshot:', e);
          }
        }, (err) => {
          console.error('Error subscribing to user doc:', err);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up user doc subscription:', error);
        setLoading(false);
      }
    };

    subscribeToUserDoc();

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
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
    if (!isVoiceModeEnabled && !options.force) {
      console.warn('Voice mode is disabled');
      return;
    }
    
    const timer = voiceInteractionsService.createTimer();
    
    try {
      await voiceService.speak(text, options);
      
      // Log the interaction if user is available and not forced silent
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
