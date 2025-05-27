import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updateUserState = async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        // User profile doesn't exist yet, create it
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              email: email,
              name: email.split('@')[0],
            }
          ]);

        if (insertError) throw insertError;

        // Fetch the newly created profile
        const { data: newProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        setUser({
          id: userId,
          email: email,
          name: newProfile.name
        });
      } else if (error) {
        throw error;
      } else {
        setUser({
          id: userId,
          email: email,
          name: profile.name
        });
      }

      setIsAuthenticated(true);
    } catch (err) {
      console.error('Error updating user state:', err);
      throw err;
    }
  };

  useEffect(() => {
    // Check active session
    setIsLoading(true);
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await updateUserState(session.user.id, session.user.email!);
      }
      setIsLoading(false);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await updateUserState(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw authError;
    }

    if (authData.user) {
      await updateUserState(authData.user.id, authData.user.email!);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const { data: { user: authUser }, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (authUser) {
      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id,
            email: authUser.email,
            name: name,
          }
        ]);

      if (profileError) {
        throw profileError;
      }

      await updateUserState(authUser.id, authUser.email!);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
      }}
    >
      {!isLoading && children}
    </AuthContext.Provider>
  );
};