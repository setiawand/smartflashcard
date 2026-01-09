import { useState, useEffect, useCallback } from 'react';

export const useTTS = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    // Initial load
    loadVoices();

    // Handle async voice loading (common in Chrome/Android)
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = useCallback((text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!text) return;

    // Cancel any ongoing speech to prevent queue buildup
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';

    // Try to find a specific Korean voice for better compatibility
    // Some browsers/devices might default to English if voice isn't explicitly set
    const koreanVoice = voices.find(
      v => v.lang === 'ko-KR' || v.lang.includes('ko-') || v.name.toLowerCase().includes('korean')
    );
    
    if (koreanVoice) {
      utterance.voice = koreanVoice;
    }

    // iOS/Mobile quirk: rate/pitch sometimes helps reset glitchy states
    utterance.rate = 0.9; // Slightly slower is usually better for learning

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  return { speak };
};
