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

  const speak = useCallback((text: string, lang: 'ko' | 'en' = 'ko', e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!text) return;

    // Cancel any ongoing speech to prevent queue buildup
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language-specific settings
    if (lang === 'ko') {
      utterance.lang = 'ko-KR';
      const koreanVoice = voices.find(
        v => v.lang === 'ko-KR' || v.lang.includes('ko-') || v.name.toLowerCase().includes('korean')
      );
      if (koreanVoice) utterance.voice = koreanVoice;
      utterance.rate = 0.9; // Slower for Korean learning
    } else {
      utterance.lang = 'en-US';
      const englishVoice = voices.find(
        v => v.lang === 'en-US' || v.lang.includes('en-') || v.name.toLowerCase().includes('english')
      );
      if (englishVoice) utterance.voice = englishVoice;
      utterance.rate = 1.0; // Normal speed for English
    }

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  return { speak };
};
