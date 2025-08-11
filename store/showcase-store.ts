const API_BASE = 'https://social-backend-zid2.onrender.com';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShowcaseEntry } from '@/types';
import { Platform } from 'react-native';

interface ShowcaseState {
  entries: ShowcaseEntry[];
  isLoading: boolean;
  error: string | null;
  fetchEntries: () => Promise<void>;
  fetchEntryById: (id: string) => Promise<ShowcaseEntry | null>;
  addEntry: (entry: ShowcaseEntry) => void;
  updateEntry: (id: string, data: Partial<ShowcaseEntry>) => void;
  deleteEntry: (id: string) => void;
  upvoteEntry: (id: string) => void;
  bookmarkEntry: (id: string) => void;
  addComment: (id: string, comment: string) => void;
}


const normalizeUri = (path: string) => {
  if (!path) return '';
  // React Native fetch expects local file without "file://"
  return Platform.OS === 'android' ? path : path.replace('file://', '');
};

// Mock data
const mockEntries: ShowcaseEntry[] = [
  {
    id: '1',
    title: 'Mango AI',
    subtitle: 'ChatGPT, but for Noobs',
    description: 'AI Models have become really great, but there\'s still a place where they suck at – understanding our wants before answering! Mango AI is designed to be more intuitive and user-friendly, making AI accessible to everyone.',
    images: ['https://images.unsplash.com/photo-1677442135136-760c813a7942'],
    tags: ['AI', 'Machine Learning', 'UX'],
    upvotes: 0,
    comments: 9,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2023-04-02T10:30:00Z',
    author: {
      id: '1',
      name: 'Startup Memer',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36'
    },
    links: {
      website: 'https://mangoai.app',
      github: 'https://github.com/startupMemer/mangoai'
    },
    upvoters: ['2', '3', '4']
  },
  {
    id: '2',
    title: 'Appointee',
    subtitle: 'Schedule meetings without the back-and-forth',
    description: 'Appointee is a scheduling tool that eliminates the back-and-forth emails when setting up meetings. Share your availability, let others pick a time, and get it on your calendar instantly.',
    images: ['https://images.unsplash.com/photo-1611224885990-ab7363d7f2a9'],
    tags: ['Productivity', 'Calendar', 'SaaS'],
    upvotes: 0,
    comments: 5,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2023-03-28T14:15:00Z',
    author: {
      id: '2',
      name: 'Vaibhav Malpathak',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
    },
    links: {
      website: 'https://appointee.io',
      github: 'https://github.com/vaibhav/appointee'
    },
    upvoters: ['1', '3']
  },
  {
    id: '3',
    title: 'Startup Funding Playbook',
    subtitle: 'A guide for first-time founders',
    description: 'A comprehensive guide for first-time founders on how to raise funding for their startups. Covers everything from pre-seed to Series A, with templates and real-world examples.',
    images: ['https://images.unsplash.com/photo-1553729459-efe14ef6055d'],
    tags: ['Startup', 'Funding', 'Guide'],
    upvotes: 0,
    comments: 12,
    isLiked: false,
    isBookmarked: false,
    createdAt: '2023-03-15T09:45:00Z',
    author: {
      id: '3',
      name: 'Rajvardhan M.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
    },
    links: {
      website: 'https://startupfundingplaybook.com'
    },
    upvoters: ['1', '2', '4']
  }
];

export const useShowcaseStore = create<ShowcaseState>()(
  persist(
    (set, get) => ({
      entries: mockEntries,
      isLoading: false,
      error: null,

      fetchEntries: async () => {
        const { token } = require('./auth-store').useAuthStore.getState();
        set({ isLoading: true, error: null });
      
        try {
          const response = await fetch(`${API_BASE}/showcase/get`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              token,
            },
          });
      
          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }
      
          const result = await response.json();
          set({ entries: result.body || [], isLoading: false });
        } catch (error) {
          console.error('FetchEntries Error:', error);
          set({ error: 'Failed to fetch showcases', isLoading: false });
        }
      }
      ,

      
      fetchEntryById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 300));
          const entry = get().entries.find(e => e.id === id);
          set({ isLoading: false });
          return entry || null;
        } catch (error) {
          set({ error: 'Failed to fetch showcase', isLoading: false });
          return null;
        }
      },

      addEntry: async (entry) => {
      
      },
      

      updateEntry: (id, data) => {
        set(state => ({
          entries: state.entries.map(entry => 
            entry.id === id ? { ...entry, ...data } : entry
          )
        }));
      },

      deleteEntry: (id) => {
        set(state => ({
          entries: state.entries.filter(entry => entry.id !== id)
        }));
      },

      upvoteEntry: (id) => {
        const { user } = require('./auth-store').useAuthStore.getState();
        if (!user) return;
        
        set(state => {
          const entries = [...state.entries];
          const entryIndex = entries.findIndex(e => e.id === id);
          
          if (entryIndex === -1) return state;
          
          const entry = { ...entries[entryIndex] };
          
          // Initialize upvoters array if it doesn't exist
          if (!entry.upvoters) {
            entry.upvoters = [];
          }
          
          // Toggle upvote
          if (entry.upvoters.includes(user.id)) {
            entry.upvoters = entry.upvoters.filter(uid => uid !== user.id);
          } else {
            entry.upvoters.push(user.id);
          }
          
          entries[entryIndex] = entry;
          return { entries };
        });
      },

      bookmarkEntry: (id) => {
        set(state => {
          const entries = [...state.entries];
          const entryIndex = entries.findIndex(e => e.id === id);
          
          if (entryIndex === -1) return state;
          
          const entry = { ...entries[entryIndex] };
          entry.isBookmarked = !entry.isBookmarked;
          
          entries[entryIndex] = entry;
          return { entries };
        });
      },

      addComment: (id, comment) => {
        set(state => {
          const entries = [...state.entries];
          const entryIndex = entries.findIndex(e => e.id === id);
          
          if (entryIndex === -1) return state;
          
          const entry = { ...entries[entryIndex] };
          entry.comments = (entry.comments || 0) + 1;
          
          entries[entryIndex] = entry;
          return { entries };
        });
      }
    }),
    {
      name: 'showcase-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);