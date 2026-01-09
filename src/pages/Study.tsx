import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { Flashcard } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RefreshCw, Clock, ThumbsUp, Zap, RotateCcw, Volume2, Play, Mic, Loader2, X } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { evaluatePronunciation, EvaluationResult } from '../lib/ai';

const BATCH_SIZE = 10;

export const Study: React.FC = () => {
  const { cards, getDueCards, reviewCard, apiKey } = useStore();
  const { speak } = useTTS();
  const { isListening, transcript, startListening, isSupported } = useSpeechRecognition();
  
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isCramMode, setIsCramMode] = useState(false);
  
  // Practice Mode State
  const [showPractice, setShowPractice] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [practiceError, setPracticeError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with due cards by default
    const due = getDueCards();
    setStudyCards(due.slice(0, BATCH_SIZE));
  }, [getDueCards]);

  useEffect(() => {
    if (isFlipped && studyCards[currentCardIndex]) {
      // Small delay to allow the flip animation to start
      setTimeout(() => {
        speak(studyCards[currentCardIndex].front, 'ko');
      }, 300);
    }
  }, [isFlipped, currentCardIndex, studyCards, speak]);

  // Handle Speech Recognition Result
  useEffect(() => {
    if (transcript && showPractice && !isListening) {
      handleEvaluation(transcript);
    }
  }, [transcript, isListening]);

  const handleEvaluation = async (userSpeech: string) => {
    if (!apiKey) {
      setPracticeError('Please add your OpenAI API Key in settings to use AI evaluation.');
      return;
    }

    setIsEvaluating(true);
    setPracticeError(null);
    
    try {
      const result = await evaluatePronunciation(
        apiKey,
        studyCards[currentCardIndex].front,
        userSpeech
      );
      setEvaluation(result);
    } catch (error) {
      setPracticeError('Failed to evaluate pronunciation. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const startPractice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPractice(true);
    setEvaluation(null);
    setPracticeError(null);
  };

  const closePractice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPractice(false);
    setEvaluation(null);
  };

  const startCramMode = () => {
    setStudyCards([...cards].sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE)); // Shuffle all cards
    setIsCramMode(true);
    setCurrentCardIndex(0);
    setSessionComplete(false);
    setIsFlipped(false);
  };

  const restartSession = () => {
    setCurrentCardIndex(0);
    setSessionComplete(false);
    setIsFlipped(false);
    // If in normal mode, refresh due cards just in case
    if (!isCramMode) {
      setStudyCards(getDueCards().slice(0, BATCH_SIZE));
    } else {
      // Re-shuffle for cram mode
      setStudyCards([...cards].sort(() => Math.random() - 0.5).slice(0, BATCH_SIZE));
    }
  };

  const handleRate = (quality: number) => {
    if (currentCardIndex < studyCards.length) {
      const card = studyCards[currentCardIndex];
      
      // Only update SRS if NOT in cram mode
      if (!isCramMode) {
        reviewCard(card.id, quality);
      }

      if (currentCardIndex + 1 < studyCards.length) {
        setIsFlipped(false);
        setTimeout(() => setCurrentCardIndex((prev) => prev + 1), 200);
      } else {
        setSessionComplete(true);
      }
    }
  };

  if (studyCards.length === 0 && !isCramMode) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <Check size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">All Caught Up!</h2>
        <p className="text-gray-500 max-w-md mb-8">
          You have no cards due for review right now. Great job keeping up with your studies!
        </p>
        
        <button
          onClick={startCramMode}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
        >
          <Zap size={20} />
          Cram Mode (Review All)
        </button>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="w-24 h-24 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6">
          <ThumbsUp size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h2>
        <p className="text-gray-500 max-w-md mb-8">
          You've reviewed all cards in this session.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {((!isCramMode && getDueCards().length > 0) || isCramMode) ? (
            <button
              onClick={restartSession}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
            >
              <Play size={20} />
              {isCramMode ? 'Next Random Batch' : `Continue (${getDueCards().length} more)`}
            </button>
          ) : (
            <button
              onClick={restartSession}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw size={20} />
              Review Again
            </button>
          )}

          <button
            onClick={() => window.location.href = 'https://setiawand.github.io/smartflashcard'}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Return to Dashboard
          </button>

          {!isCramMode && (
             <button
             onClick={startCramMode}
             className="flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors"
           >
             <Zap size={20} />
             Cram Mode
           </button>
          )}
        </div>
      </div>
    );
  }

  const currentCard = studyCards[currentCardIndex];

  return (
    <div className="max-w-2xl mx-auto py-8 pb-24 md:pb-8">
      {/* Header Info */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex justify-between items-center text-gray-500">
          <span className="font-medium">Card {currentCardIndex + 1} of {studyCards.length}</span>
          <span className="font-medium">{Math.round(((currentCardIndex) / studyCards.length) * 100)}% Complete</span>
        </div>
        {isCramMode && (
          <div className="bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Zap size={16} />
            Cram Mode Active - SRS updates disabled
          </div>
        )}
      </div>

      <div className="relative h-96 perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="w-full h-full relative preserve-3d transition-all duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center justify-center p-8">
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-4">Korean</span>
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-bold text-gray-900 text-center">{currentCard.front}</h2>
              <button 
                onClick={(e) => speak(currentCard.front, 'ko', e)}
                className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title="Listen"
              >
                <Volume2 size={24} />
              </button>
            </div>
            
            {/* Practice Button */}
            {isSupported && !showPractice && (
              <button
                onClick={startPractice}
                className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors text-sm font-bold"
              >
                <Mic size={16} />
                Practice Pronunciation
              </button>
            )}

            {/* Practice Modal/Overlay */}
            {showPractice && (
              <div 
                className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={closePractice}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>

                <h3 className="text-lg font-bold text-gray-900 mb-4">Pronunciation Check</h3>
                
                {!evaluation && !isEvaluating && (
                  <>
                    <div className={`p-6 rounded-full bg-indigo-100 mb-6 transition-all ${isListening ? 'ring-4 ring-indigo-200 scale-110' : ''}`}>
                      <Mic size={32} className={`text-indigo-600 ${isListening ? 'animate-pulse' : ''}`} />
                    </div>
                    
                    <button
                      onClick={() => startListening()}
                      disabled={isListening}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 mb-4"
                    >
                      {isListening ? 'Listening...' : 'Tap to Speak'}
                    </button>
                    
                    {practiceError && (
                      <p className="text-red-500 text-sm text-center">{practiceError}</p>
                    )}
                    
                    <p className="text-gray-400 text-sm">Say: "{currentCard.front}"</p>
                  </>
                )}

                {isEvaluating && (
                  <div className="flex flex-col items-center">
                    <Loader2 size={32} className="text-indigo-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Analyzing your pronunciation...</p>
                  </div>
                )}

                {evaluation && (
                  <div className="text-center w-full animate-in fade-in slide-in-from-bottom-4">
                    <div className={`text-5xl font-bold mb-2 ${evaluation.score >= 80 ? 'text-green-600' : evaluation.score >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                      {evaluation.score}%
                    </div>
                    <p className="text-gray-900 font-medium mb-4">{evaluation.score >= 80 ? 'Excellent!' : evaluation.score >= 50 ? 'Good try!' : 'Keep practicing!'}</p>
                    
                    <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm text-gray-600">
                      "{evaluation.feedback}"
                    </div>
                    
                    <button
                      onClick={() => {
                        setEvaluation(null);
                        setPracticeError(null);
                      }}
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            <p className="mt-8 text-gray-400 text-sm">Click to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full backface-hidden bg-indigo-50 rounded-3xl shadow-xl border border-indigo-100 flex flex-col items-center justify-center p-8"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">English</span>
            <h2 className="text-3xl font-bold text-indigo-900 mb-2 text-center">{currentCard.back}</h2>
            
            {currentCard.pronunciation && (
              <p className="text-lg text-indigo-600 font-medium mb-6">/{currentCard.pronunciation}/</p>
            )}

            {currentCard.example && (
              <div className="bg-white/60 p-4 rounded-xl text-center relative group w-full">
                <p className="text-indigo-800 text-sm italic mb-1">"{currentCard.example}"</p>
                {currentCard.exampleMeaning && (
                  <p className="text-indigo-600 text-xs">{currentCard.exampleMeaning}</p>
                )}
                
                <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => speak(currentCard.example || '', 'ko', e)}
                    className="p-2 bg-white text-indigo-400 hover:text-indigo-600 rounded-full shadow-sm"
                    title="Listen to example (Korean)"
                  >
                    <Volume2 size={16} />
                  </button>
                  {currentCard.exampleMeaning && (
                    <button 
                      onClick={(e) => speak(currentCard.exampleMeaning || '', 'en', e)}
                      className="p-2 bg-white text-indigo-400 hover:text-indigo-600 rounded-full shadow-sm"
                      title="Listen to meaning (English)"
                    >
                      <Volume2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleRate(0); }}
              className="flex flex-col items-center justify-center p-4 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl transition-colors gap-2"
            >
              <RefreshCw size={20} />
              <span className="font-bold text-sm">Again</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRate(3); }}
              className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl transition-colors gap-2"
            >
              <Clock size={20} />
              <span className="font-bold text-sm">Hard</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRate(4); }}
              className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors gap-2"
            >
              <Check size={20} />
              <span className="font-bold text-sm">Good</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRate(5); }}
              className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors gap-2"
            >
              <ThumbsUp size={20} />
              <span className="font-bold text-sm">Easy</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
