import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import type { Flashcard } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RefreshCw, Clock, ThumbsUp, Zap, RotateCcw, Volume2, Play } from 'lucide-react';
import { useTTS } from '../hooks/useTTS';

const BATCH_SIZE = 10;

export const Study: React.FC = () => {
  const { cards, getDueCards, reviewCard } = useStore();
  const { speak } = useTTS();
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [isCramMode, setIsCramMode] = useState(false);

  useEffect(() => {
    // Initialize with due cards by default
    const due = getDueCards();
    setStudyCards(due.slice(0, BATCH_SIZE));
  }, [getDueCards]);

  useEffect(() => {
    if (isFlipped && studyCards[currentCardIndex]) {
      // Small delay to allow the flip animation to start
      setTimeout(() => {
        speak(studyCards[currentCardIndex].front);
      }, 300);
    }
  }, [isFlipped, currentCardIndex, studyCards, speak]);

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
            onClick={() => window.location.href = '/'}
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
                onClick={(e) => speak(currentCard.front, e)}
                className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title="Listen"
              >
                <Volume2 size={24} />
              </button>
            </div>
            <p className="mt-8 text-gray-400 text-sm">Click to flip</p>
          </div>

          {/* Back */}
          <div 
            className="absolute w-full h-full backface-hidden bg-indigo-50 rounded-3xl shadow-xl border border-indigo-100 flex flex-col items-center justify-center p-8"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase mb-2">English</span>
            <h2 className="text-3xl font-bold text-indigo-900 mb-2">{currentCard.back}</h2>
            
            {currentCard.pronunciation && (
              <p className="text-lg text-indigo-600 font-medium mb-6">/{currentCard.pronunciation}/</p>
            )}

            {currentCard.example && (
              <div className="bg-white/60 p-4 rounded-xl text-center relative group">
                <p className="text-indigo-800 text-sm italic">"{currentCard.example}"</p>
                <button 
                  onClick={(e) => speak(currentCard.example || '', e)}
                  className="absolute -right-2 -top-2 p-2 bg-white text-indigo-400 hover:text-indigo-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Listen to example"
                >
                  <Volume2 size={16} />
                </button>
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
