import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthError {
  message: string;
  details?: string;
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

  const logAuthError = (error: AuthError, action: string) => {
    console.error(`Auth Error during ${action}:`, {
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString()
    });
  };

  const logAuthSuccess = (action: string, userId: string) => {
    console.log(`Auth Success - ${action}:`, {
      userId,
      timestamp: new Date().toISOString()
    });
  };

  const logAuthAction = (action: string, data?: any) => {
    console.log(`Auth Action - ${action}:`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  };

  useEffect(() => {
    // Check active session
    logAuthAction('Checking session');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logAuthAction('Auth state changed', { event });
      
      if (session) {
        logAuthAction('Session found', { userId: session.user.id });
        
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        logAuthAction('Profile fetch result', { 
          success: !!profile,
          hasProfile: !!profile
        });

        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: profile?.name || session.user.email!.split('@')[0]
        });
        setIsAuthenticated(true);
        logAuthSuccess('Session restored', session.user.id);
      } else {
        logAuthAction('No session found');
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    logAuthAction('Login attempt', { email });
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logAuthError(authError, 'login');
      throw authError;
    }

    if (authData.user) {
      logAuthAction('Login successful', { userId: authData.user.id });
      
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      logAuthAction('Profile fetch result', {
        success: !!profile,
        hasProfile: !!profile
      });

      setUser({
        id: authData.user.id,
        email: authData.user.email!,
        name: profile?.name || authData.user.email!.split('@')[0]
      });
      setIsAuthenticated(true);
      logAuthSuccess('Login completed', authData.user.id);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    logAuthAction('Register attempt', { email });
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      logAuthError(authError, 'register');
      throw authError;
    }

    if (authData.user) {
      logAuthAction('Registration successful', { userId: authData.user.id });
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            name: name,
          }
        ]);

      if (profileError) {
        logAuthError(profileError as AuthError, 'profile creation');
        throw profileError;
      }

      logAuthAction('Profile created', { userId: authData.user.id });

      setUser({
        id: authData.user.id,
        email: authData.user.email!,
        name: name
      });
      setIsAuthenticated(true);
      logAuthSuccess('Registration completed', authData.user.id);
    }
  };

  const logout = async () => {
    logAuthAction('Logout attempt');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      logAuthError(error, 'logout');
      throw error;
    }
    setUser(null);
    setIsAuthenticated(false);
    logAuthSuccess('Logout completed', 'anonymous');
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
      {children}
    </AuthContext.Provider>
  );
};