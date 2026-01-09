import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Flashcard } from '../store/useStore';
import { Plus, Trash2, Search, Edit2, Brain, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { generateFlashcards } from '../lib/ai';

export const Decks: React.FC = () => {
  const { cards, addCard, deleteCard, updateCard, apiKey, setApiKey } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [inputApiKey, setInputApiKey] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  const [formData, setFormData] = useState({
    front: '',
    back: '',
    pronunciation: '',
    example: '',
  });

  const filteredCards = cards.filter(
    (card) =>
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const keyToUse = apiKey || inputApiKey;
    if (!keyToUse) {
      alert('Please provide a Google Gemini API Key');
      return;
    }

    if (inputApiKey) {
      setApiKey(inputApiKey);
    }

    setIsGenerating(true);
    try {
      // Ensure key is clean
      const cleanKey = keyToUse.trim();
      const generatedCards = await generateFlashcards(cleanKey, aiTopic, 20);
      generatedCards.forEach(card => {
        addCard({
          ...card,
          deckId: 'generated-' + Date.now(),
        });
      });
      setShowAiModal(false);
      setAiTopic('');
      alert(`Successfully generated ${generatedCards.length} cards!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate cards';
      alert(message);
      
      // If it looks like an auth/network error, reset the key so user can fix it
      if (
        message.includes('Invalid API Key') || 
        message.includes('401') || 
        message.includes('Load failed') ||
        message.includes('Connection failed')
      ) {
        setApiKey('');
        setInputApiKey(''); // Also clear the input so they can re-paste
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCard) {
      updateCard(editingCard.id, formData);
      setEditingCard(null);
    } else {
      addCard({
        ...formData,
        deckId: 'default',
      });
    }
    setFormData({ front: '', back: '', pronunciation: '', example: '' });
    setIsAdding(false);
  };

  const handleEdit = (card: Flashcard) => {
    setFormData({
      front: card.front,
      back: card.back,
      pronunciation: card.pronunciation || '',
      example: card.example || '',
    });
    setEditingCard(card);
    setIsAdding(true);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">My Cards</h2>
          <p className="text-gray-500 mt-1">Manage your vocabulary collection</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-purple-700 transition-colors"
          >
            <Brain size={20} />
            <span className="hidden sm:inline">AI Generate</span>
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingCard(null);
              setFormData({ front: '', back: '', pronunciation: '', example: '' });
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Card</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-4 text-purple-600">
              <Brain size={24} />
              <h3 className="text-xl font-bold text-gray-900">Generate with AI</h3>
            </div>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              {!apiKey ? (
                <>
                  <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-4">
                    <p className="mb-2">To use AI features, you need an OpenAI API Key.</p>
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-bold"
                    >
                      Get a key here
                    </a>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">OpenAI API Key</label>
                    <input
                      required
                      autoFocus
                      type="password"
                      value={inputApiKey}
                      onChange={(e) => setInputApiKey(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="sk-..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your key is stored locally in your browser.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">API Key saved</span>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApiKey('')}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
                  >
                    Change Key
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic or Level</label>
                <input
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Travel, Food, Intermediate Level 2"
                />
                <p className="text-xs text-gray-500 mt-1">We'll generate 20 cards for this topic.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Cards'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4">{editingCard ? 'Edit Card' : 'New Card'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Korean Word (Front)</label>
                <input
                  required
                  value={formData.front}
                  onChange={(e) => setFormData({ ...formData, front: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., 안녕하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meaning (Back)</label>
                <input
                  required
                  value={formData.back}
                  onChange={(e) => setFormData({ ...formData, back: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Hello"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pronunciation (Optional)</label>
                <input
                  value={formData.pronunciation}
                  onChange={(e) => setFormData({ ...formData, pronunciation: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Annyeonghaseyo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Example Sentence (Optional)</label>
                <textarea
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Example usage..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                >
                  {editingCard ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <div key={card.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-gray-900">{card.front}</h3>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(card)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => deleteCard(card.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-gray-600 font-medium mb-1">{card.back}</p>
            {card.pronunciation && (
              <p className="text-sm text-gray-400 italic mb-3">/{card.pronunciation}/</p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">
              <span>Next Review: {format(card.nextReviewDate, 'MMM d, yyyy')}</span>
              <span className={`px-2 py-1 rounded-full ${
                card.repetition === 0 ? 'bg-gray-100 text-gray-600' :
                card.repetition < 3 ? 'bg-blue-50 text-blue-600' :
                'bg-green-50 text-green-600'
              }`}>
                {card.repetition === 0 ? 'New' : `Lvl ${card.repetition}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
