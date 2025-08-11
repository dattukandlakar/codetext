import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { getUser } from '@/api/user';
import { mapUserFromApi } from '@/utils/mapUserFromApi';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUserData: () => Promise<void>;
}

// Mock user data removed - using real API data only

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        try {
          // Validate inputs first
          if (!email || !password) {
            throw new Error('Email and password are required');
          }

          // Ensure email and password are clean strings
          const cleanEmail = String(email).trim();
          const cleanPassword = String(password).trim();
          
          // Validate after cleaning
          if (cleanEmail.length === 0) {
            throw new Error('Email cannot be empty');
          }
          if (cleanPassword.length === 0) {
            throw new Error('Password cannot be empty');
          }
          
          const requestBody = {
            email: cleanEmail,
            password: cleanPassword,
          };
          
          console.log('🔐 Login Debug Info:');
          console.log('Original inputs:', { email: typeof email, password: typeof password });
          console.log('Cleaned inputs:', {
            emailType: typeof cleanEmail,
            passwordType: typeof cleanPassword,
            emailLength: cleanEmail.length,
            passwordLength: cleanPassword.length,
            emailValue: cleanEmail,
            passwordValue: cleanPassword.slice(0, 3) + '***' // Show first 3 chars only
          });
          console.log('Request body:', JSON.stringify(requestBody, null, 2));
          
          const response = await fetch('https://social-backend-zid2.onrender.com/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          set({
            user: {
              ...data.user,
              profileImage: data.user.profileImage || data.user.avatar || '',
            }, // temporary, will be replaced
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Fetch the full user profile after login and update Zustand
          try {
          const userResponse = await getUser(data.token);
          console.log('🔍 DEBUGGING USER API RESPONSE:');
          console.log('Full API response:', JSON.stringify(userResponse, null, 2));
          console.log('Response type:', typeof userResponse);
          console.log('Response keys:', Object.keys(userResponse || {}));
            
            // Handle different API response structures
            let userData;
            if (userResponse.body) {
              // If response has a body property, use it
              userData = userResponse.body;
            } else if (userResponse.user) {
              // If response has a user property, use it
              userData = userResponse.user;
            } else {
              // Otherwise assume the response itself is the user data
              userData = userResponse;
            }
            
          console.log('🔍 EXTRACTED USER DATA:');
          console.log('Full user data:', JSON.stringify(userData, null, 2));
          console.log('Followers data:', userData.followers, 'Type:', typeof userData.followers);
          console.log('Following data:', userData.following, 'Type:', typeof userData.following);
          console.log('Is followers array?', Array.isArray(userData.followers));
          console.log('Is following array?', Array.isArray(userData.following));
            
            if (!userData) {
              throw new Error('No user data found in API response');
            }
            
            const mappedUser = mapUserFromApi(userData);
            // Ensure mappedUser has profileImage property for type safety
            const userWithProfileImage = {
              ...mappedUser,
              profileImage: (mappedUser as any).profileImage || (mappedUser as any).avatar || '',
            };
            set({ user: userWithProfileImage });
          } catch (err) {
            console.error('Failed to fetch user profile after login:', err);
            // Don't throw the error, just log it - the user is still logged in with basic data
          }

        } catch (error: any) {
          console.error('❌ Login error:', error.message || error);
          set({
            error: error.message || 'Login failed. Please try again.',
            isLoading: false,
          });
        }
      },


      register: async (name, email, password) => {
        set({ isLoading: true, error: null });

        try {
          // Validate inputs first
          if (!name || !email || !password) {
            throw new Error('Name, email and password are required');
          }

          // Ensure all values are clean strings
          const cleanName = String(name).trim();
          const cleanEmail = String(email).trim();
          const cleanPassword = String(password).trim();
          
          // Validate after cleaning
          if (cleanName.length === 0) {
            throw new Error('Name cannot be empty');
          }
          if (cleanEmail.length === 0) {
            throw new Error('Email cannot be empty');
          }
          if (cleanPassword.length === 0) {
            throw new Error('Password cannot be empty');
          }
          if (cleanPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long');
          }
          
          const requestBody = {
            name: cleanName,
            email: cleanEmail,
            password: cleanPassword,
            confirmPassword: cleanPassword,
          };
          
          console.log('📝 Registration Debug Info:');
          console.log('Original inputs:', { 
            name: typeof name, 
            email: typeof email, 
            password: typeof password 
          });
          console.log('Cleaned inputs:', {
            nameType: typeof cleanName,
            emailType: typeof cleanEmail,
            passwordType: typeof cleanPassword,
            confirmPasswordType: typeof cleanPassword,
            nameLength: cleanName.length,
            emailLength: cleanEmail.length,
            passwordLength: cleanPassword.length,
            nameValue: cleanName,
            emailValue: cleanEmail,
            passwordValue: cleanPassword.slice(0, 3) + '***' // Show first 3 chars only
          });
          console.log('Request body:', JSON.stringify(requestBody, null, 2));
          
          const response = await fetch('https://social-backend-zid2.onrender.com/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
          
          console.log('Response status:', response.status);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));

          const data = await response.json();
          

          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          // Merge both: use data.user if present, otherwise construct user object
          

          set({
            user: data.user,
            token: data.emailVerificationToken,
            isAuthenticated: true,
            isLoading: false,
          });

        } catch (error: any) {
          console.error('❌ Registration error:', error.message || error);
          set({
            error: error.message || 'Registration failed. Please try again.',
            isLoading: false,
          });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },

      updateUser: (userData) => {
        set(state => ({
          user: state.user ? { ...state.user, ...userData } : null
        }));
      },

      refreshUserData: async () => {
        const state = useAuthStore.getState();
        if (!state.token) return;

        try {
          console.log('🔄 Refreshing user data from API...');
          const userResponse = await getUser(state.token);
          console.log('Refresh - User response structure:', userResponse);
          
          // Handle different API response structures
          let userData;
          if (userResponse.body) {
            userData = userResponse.body;
          } else if (userResponse.user) {
            userData = userResponse.user;
          } else {
            userData = userResponse;
          }
          
          console.log('Refresh - Extracted user data:', userData);
          
          if (!userData) {
            throw new Error('No user data found in API response');
          }
          
          const mappedUser = mapUserFromApi(userData);
          console.log('🔍 MAPPED USER DATA:');
          console.log('Mapped followers:', mappedUser.followers);
          console.log('Mapped following:', mappedUser.following);
          console.log('Full mapped user:', JSON.stringify(mappedUser, null, 2));
          
          const userWithProfileImage = {
            ...mappedUser,
            profileImage: (mappedUser as any).profileImage || (mappedUser as any).avatar || '',
          };
          
          set({ user: userWithProfileImage });
          console.log('✅ User data refreshed successfully');
        } catch (error) {
          console.error('❌ Failed to refresh user data:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);