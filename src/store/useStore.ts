import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateReview, initialReviewState } from '../lib/srs';
import { addDays } from 'date-fns';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  example?: string;
  pronunciation?: string;
  interval: number;
  repetition: number;
  easinessFactor: number;
  nextReviewDate: number;
  createdAt: number;
  deckId: string;
}

interface State {
  cards: Flashcard[];
  addCard: (card: Omit<Flashcard, 'id' | 'interval' | 'repetition' | 'easinessFactor' | 'nextReviewDate' | 'createdAt'>) => void;
  updateCard: (id: string, card: Partial<Flashcard>) => void;
  deleteCard: (id: string) => void;
  reviewCard: (id: string, quality: number) => void;
  getDueCards: () => Flashcard[];
  apiKey: string | null;
  setApiKey: (key: string) => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      cards: [],
      apiKey: null,
      setApiKey: (key) => set({ apiKey: key }),
      addCard: (cardData) =>
        set((state) => ({
          cards: [
            ...state.cards,
            {
              ...cardData,
              id: crypto.randomUUID(),
              ...initialReviewState,
              nextReviewDate: Date.now(),
              createdAt: Date.now(),
            },
          ],
        })),
      updateCard: (id, cardData) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? { ...card, ...cardData } : card
          ),
        })),
      deleteCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        })),
      reviewCard: (id, quality) =>
        set((state) => ({
          cards: state.cards.map((card) => {
            if (card.id !== id) return card;

            const result = calculateReview(
              quality,
              card.interval,
              card.repetition,
              card.easinessFactor
            );

            const nextReviewDate = addDays(new Date(), result.interval).getTime();

            return {
              ...card,
              ...result,
              nextReviewDate,
            };
          }),
        })),
      getDueCards: () => {
        const now = Date.now();
        return get().cards.filter((card) => card.nextReviewDate <= now);
      },
    }),
    {
      name: 'flashcard-storage',
    }
  )
);
