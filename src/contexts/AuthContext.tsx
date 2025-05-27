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

  console.log('[AuthContext] Component rendering/re-rendering. isLoading:', isLoading);

  useEffect(() => {
    console.log('[AuthContext] useEffect started. Setting up session listeners.');
    let isMounted = true;

    const fetchInitialSession = async () => {
      console.log('[AuthContext] fetchInitialSession started.');
      try {
        if (!isMounted) {
          console.log('[AuthContext] fetchInitialSession: component unmounted, returning.');
          return;
        }
        console.log('[AuthContext] fetchInitialSession: Calling supabase.auth.getSession().');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('[AuthContext] fetchInitialSession: supabase.auth.getSession() returned.', { session, sessionError });

        if (!isMounted) {
          console.log('[AuthContext] fetchInitialSession: component unmounted after getSession, returning.');
          return;
        }

        if (sessionError) {
          console.error("[AuthContext] fetchInitialSession: Error getting initial session:", sessionError);
          if (isMounted) {
            console.log('[AuthContext] fetchInitialSession: Setting user to null due to sessionError.');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (session) {
          console.log('[AuthContext] fetchInitialSession: Session found. Fetching profile for user ID:', session.user.id);
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          console.log('[AuthContext] fetchInitialSession: Profile fetched.', { profile, profileError });

          if (!isMounted) {
            console.log('[AuthContext] fetchInitialSession: component unmounted after profile fetch, returning.');
            return;
          }

          if (profileError) {
            console.error('[AuthContext] fetchInitialSession: Error fetching profile for initial session:', profileError);
            if (isMounted) {
              const defaultUser = {
                id: session.user.id,
                email: session.user.email!,
                name: session.user.email!.split('@')[0]
              };
              console.log('[AuthContext] fetchInitialSession: Setting user to default due to profileError.', defaultUser);
              setUser(defaultUser);
              setIsAuthenticated(true);
            }
          } else if (isMounted) {
            const userData = {
              id: session.user.id,
              email: session.user.email!,
              name: profile?.name || session.user.email!.split('@')[0]
            };
            console.log('[AuthContext] fetchInitialSession: Setting user with profile data.', userData);
            setUser(userData);
            setIsAuthenticated(true);
          }
        } else { // No session
          console.log('[AuthContext] fetchInitialSession: No session found.');
          if (isMounted) {
            console.log('[AuthContext] fetchInitialSession: Setting user to null (no session).');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (e) {
        console.error("[AuthContext] fetchInitialSession: Exception caught:", e);
        if (isMounted) {
          console.log('[AuthContext] fetchInitialSession: Setting user to null due to exception.');
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        console.log('[AuthContext] fetchInitialSession: finally block. Current isMounted:', isMounted);
        // Original logic:
        // if (isMounted) {
        //   console.log('[AuthContext] fetchInitialSession: Calling setIsLoading(false).');
        //   setIsLoading(false);
        // } else {
        //   console.log('[AuthContext] fetchInitialSession: Not calling setIsLoading(false) because isMounted is false.');
        // }
        // Forcing setIsLoading(false) to debug if it's the isMounted check causing issues:
        console.log('[AuthContext] fetchInitialSession: Forcing setIsLoading(false).');
        setIsLoading(false);
      }
    };

    fetchInitialSession();

    console.log('[AuthContext] Setting up onAuthStateChange listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange triggered. Event:', event, 'Session:', session);
      if (!isMounted) {
        console.log('[AuthContext] onAuthStateChange: component unmounted, returning.');
        return;
      }

      if (session) {
        console.log('[AuthContext] onAuthStateChange: Session exists. Fetching profile for user ID:', session.user.id); // Este log aparece
        // LA SIGUIENTE LLAMADA ES LA PROBLEMÁTICA O ALGO JUSTO ANTES DE ELLA
        const { data: profile, error: profileError } = await supabase
          .from('users') // Tu tabla pública 'users'
          .select('*')
          .eq('id', session.user.id) // Usando el session.user.id que dices que no existe en auth.users
          .single();
        console.log('[AuthContext] onAuthStateChange: Profile fetched.', { profile, profileError });

        if (!isMounted) {
            console.log('[AuthContext] onAuthStateChange: component unmounted after profile fetch, returning.');
            return;
        }

        if (profileError) {
          console.error('[AuthContext] onAuthStateChange: Error fetching profile:', profileError);
          if (isMounted) {
            const defaultUser = {
              id: session.user.id,
              email: session.user.email!,
              name: session.user.email!.split('@')[0]
            };
            console.log('[AuthContext] onAuthStateChange: Setting user to default due to profileError.', defaultUser);
            setUser(defaultUser);
            setIsAuthenticated(true);
          }
        } else if (isMounted) {
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            name: profile?.name || session.user.email!.split('@')[0]
          };
          console.log('[AuthContext] onAuthStateChange: Setting user with profile data.', userData);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } else { // No session
        console.log('[AuthContext] onAuthStateChange: No session.');
        if (isMounted) {
          console.log('[AuthContext] onAuthStateChange: Setting user to null.');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      // IMPORTANT: No setIsLoading(false) here in onAuthStateChange
      console.log('[AuthContext] onAuthStateChange: Finished processing.');
    });

    return () => {
      console.log('[AuthContext] useEffect cleanup. Setting isMounted to false and unsubscribing.');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] login function called for email:', email);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      console.error('[AuthContext] login: authError:', authError);
      if (authError.message.includes('Invalid login credentials')) {
        throw new Error('Correo o contraseña incorrectos');
      }
      throw authError;
    }

    if (authData.user) {
      console.log('[AuthContext] login: authData.user exists. Fetching profile.');
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      console.log('[AuthContext] login: Profile fetched.', { profile });

      const userData = {
        id: authData.user.id,
        email: authData.user.email!,
        name: profile?.name || authData.user.email!.split('@')[0]
      };
      console.log('[AuthContext] login: Setting user.', userData);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success(`¡Bienvenido de nuevo!`);
    } else {
        console.log('[AuthContext] login: authData.user is null/undefined.');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    console.log('[AuthContext] register function called for email:', email, 'name:', name);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (authError) {
      console.error('[AuthContext] register: authError:', authError);
      if (authError.message.includes('already registered')) {
        throw new Error('Este correo ya está registrado');
      }
      throw authError;
    }

    if (authData.user) {
      console.log('[AuthContext] register: authData.user exists. Creating profile.');
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
        console.error('[AuthContext] register: profileError:', profileError);
        throw profileError;
      }
      console.log('[AuthContext] register: Profile created.');

      const userData = {
        id: authData.user.id,
        email: authData.user.email!,
        name: name
      };
      console.log('[AuthContext] register: Setting user.', userData);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success(`¡Bienvenido ${name}!`);
    } else {
        console.log('[AuthContext] register: authData.user is null/undefined.');
    }
  };

  const logout = async () => {
    console.log('[AuthContext] logout function called.');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthContext] logout: error:', error);
      throw error;
    }
    console.log('[AuthContext] logout: successful. User state will be updated by onAuthStateChange.');
    // setUser(null) and setIsAuthenticated(false) are now handled by onAuthStateChange
  };

  if (isLoading) {
    console.log('[AuthContext] Rendering "Loading app..." screen.');
    return <div className="flex justify-center items-center min-h-screen">Loading app...</div>;
  }

  console.log('[AuthContext] Rendering children. isAuthenticated:', isAuthenticated, 'User:', user);
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