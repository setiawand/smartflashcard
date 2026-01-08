import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { initialKoreanWords } from '../data/initialData';
import { Brain, Calendar, CheckCircle, TrendingUp, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { cards, addCard, getDueCards } = useStore();

  // Seed data if empty
  useEffect(() => {
    if (cards.length === 0) {
      initialKoreanWords.forEach((word) => addCard(word));
    }
  }, [cards.length, addCard]);

  const dueCards = getDueCards();
  const totalCards = cards.length;
  const learnedCards = cards.filter((c) => c.repetition > 0).length;
  
  // Calculate retention rate (simple average of easiness factor normalized)
  const avgEasiness =
    cards.length > 0
      ? cards.reduce((acc, card) => acc + card.easinessFactor, 0) / cards.length
      : 2.5;
  const retentionRate = Math.min(100, Math.round((avgEasiness / 2.5) * 85)); // Rough estimation

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Welcome back! Here is your learning progress.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Brain size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Cards</p>
            <p className="text-2xl font-bold text-gray-900">{totalCards}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Due Today</p>
            <p className="text-2xl font-bold text-gray-900">{dueCards.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Learned</p>
            <p className="text-2xl font-bold text-gray-900">{learnedCards}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Retention</p>
            <p className="text-2xl font-bold text-gray-900">{retentionRate}%</p>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Ready to learn?</h3>
          <p className="text-indigo-100 mb-6 max-w-lg">
            You have {dueCards.length} cards due for review today. Keep up your daily streak to master Korean vocabulary effectively!
          </p>
          <Link
            to="/study"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
          >
            <BookOpen size={20} />
            Start Session
          </Link>
        </div>
      </div>
    </div>
  );
};
