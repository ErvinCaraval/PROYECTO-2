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
    if (!isVoiceModeEnabled && !options.force) {
      console.warn('Voice mode is disabled');
      return;
    }

    if (!user) {
      console.warn('User not authenticated, voice synthesis not available');
      return;
    }
    
    const timer = voiceInteractionsService.createTimer();
    let error = null;
    
    try {
      // Validación previa del texto
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text input: Text must be a non-empty string');
      }

      console.log('Starting speech synthesis:', {
        textLength: text.length,
        options: {
          ...options,
          // Redactar token si existe
          token: options.token ? '[REDACTED]' : undefined
        }
      });

      await voiceService.speak(text, options);
      
      // Log the interaction if user is available and not forced silent
      if (user && !options.silent) {
        const duration = timer.getDuration();
        await voiceInteractionsService.logVoiceInteraction({
          userId: user.uid,
          type: 'tts',
          text,
          duration,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      error = err;
      console.error('Error in speech synthesis:', err);
      throw err;
    }
  };

  return (
    <VoiceContext.Provider value={{
      isVoiceModeEnabled,
      userHasVisualDifficulty,
      loading,
      toggleVoiceMode,
      enableVoiceMode,
      disableVoiceMode,
      speak
    }}>
      {children}
    </VoiceContext.Provider>
  );
}