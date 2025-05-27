import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-toastify';

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

  useEffect(() => {
    let isMounted = true;

    const fetchInitialSession = async () => {
      try {
        // Guard against setting state if unmounted
        if (!isMounted) return; 
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!isMounted) return; // Check again after await

        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!isMounted) return; // Check again

          if (profileError) {
            console.error('Error fetching profile for initial session:', profileError);
            if (isMounted) {
              setUser({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email!.split('@')[0] // Default name
              });
              setIsAuthenticated(true);
            }
          } else if (isMounted) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: profile?.name || session.user.email!.split('@')[0]
            });
            setIsAuthenticated(true);
          }
        } else { // No session
          if (isMounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (e) {
        console.error("Exception in fetchInitialSession:", e);
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
        }
      }
    };

    fetchInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!isMounted) return; // Check again

        if (profileError) {
          console.error('Error fetching profile onAuthStateChange:', profileError);
          if (isMounted) {
            setUser({
              id: session.user.id,
              email: session.user.email!,
              name: session.user.email!.split('@')[0] // Default name
            });
            setIsAuthenticated(true);
          }
        } else if (isMounted) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.email!.split('@')[0]
          });
          setIsAuthenticated(true);
        }
      } else { // No session
        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      // IMPORTANT: No setIsLoading(false) here in onAuthStateChange
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  const login = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('Correo o contraseña incorrectos');
      }
      throw authError;
    }

    if (authData.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      setUser({
        id: authData.user.id,
        email: authData.user.email!,
        name: profile?.name || authData.user.email!.split('@')[0]
      });
      setIsAuthenticated(true);
      toast.success(`¡Bienvenido de nuevo!`);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('Este correo ya está registrado');
      }
      throw authError;
    }

    if (authData.user) {
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
        throw profileError;
      }

      setUser({
        id: authData.user.id,
        email: authData.user.email!,
        name: name
      });
      setIsAuthenticated(true);
      toast.success(`¡Bienvenido ${name}!`);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    // setUser(null) and setIsAuthenticated(false) are now handled by onAuthStateChange
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading app...</div>;
  }

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