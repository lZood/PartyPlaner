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
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
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
        console.log('[AuthContext] fetchInitialSession: supabase.auth.getSession() returned.', { session: session ? {...session, user: session.user ? {...session.user} : null } : null, sessionError });


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
        } else if (session && session.user && session.user.email) { // Verificar session.user y session.user.email
          console.log('[AuthContext] fetchInitialSession: Session and session.user.email found. User ID:', session.user.id);
          console.log('[AuthContext] fetchInitialSession: Detailed session.user object:', JSON.stringify(session.user, null, 2));
          
          console.log('[AuthContext] fetchInitialSession: Attempting to fetch profile...');
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          console.log('[AuthContext] fetchInitialSession: Profile fetch attempt completed.', { profile, profileError });

          if (!isMounted) {
            console.log('[AuthContext] fetchInitialSession: component unmounted after profile fetch, returning.');
            return;
          }

          if (profileError) {
            console.error('[AuthContext] fetchInitialSession: Error fetching profile for initial session:', profileError);
            if (isMounted) {
              const defaultUser = {
                id: session.user.id,
                email: session.user.email!, // Ya verificado arriba
                name: session.user.email!.split('@')[0]
              };
              console.log('[AuthContext] fetchInitialSession: Setting user to default due to profileError.', defaultUser);
              setUser(defaultUser);
              setIsAuthenticated(true);
            }
          } else if (isMounted) {
            const userData = {
              id: session.user.id,
              email: session.user.email!, // Ya verificado
              name: profile?.name || session.user.email!.split('@')[0]
            };
            console.log('[AuthContext] fetchInitialSession: Setting user with profile data.', userData);
            setUser(userData);
            setIsAuthenticated(true);
          }
        } else { // No session, or session.user is null/undefined, or session.user.email is null/undefined
          if(session && (!session.user || !session.user.email)) {
            console.warn('[AuthContext] fetchInitialSession: Session found but session.user or session.user.email is invalid.', { user: session.user });
          } else {
            console.log('[AuthContext] fetchInitialSession: No session found.');
          }
          if (isMounted) {
            console.log('[AuthContext] fetchInitialSession: Setting user to null (no valid session or user details).');
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
        console.log('[AuthContext] fetchInitialSession: Calling setIsLoading(false).');
        setIsLoading(false);
      }
    };

    fetchInitialSession();

    console.log('[AuthContext] Setting up onAuthStateChange listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] onAuthStateChange triggered. Event:', event, 'Raw Session Object:', session ? {...session, user: session.user ? {...session.user} : null } : null);
      if (!isMounted) {
        console.log('[AuthContext] onAuthStateChange: component unmounted, returning.');
        return;
      }

      if (session && session.user && session.user.email) { // Verificar session.user y session.user.email
        console.log('[AuthContext] onAuthStateChange: Session and session.user.email exists. User ID:', session.user.id);
        console.log('[AuthContext] onAuthStateChange: Detailed session.user object:', JSON.stringify(session.user, null, 2));
        
        console.log('[AuthContext] onAuthStateChange: Attempting to fetch profile...');
        try {
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            console.log('[AuthContext] onAuthStateChange: Profile fetch attempt completed.', { profile, profileError });

            if (!isMounted) {
                console.log('[AuthContext] onAuthStateChange: component unmounted after profile fetch, returning.');
                return;
            }

            if (profileError) {
              console.error('[AuthContext] onAuthStateChange: Error fetching profile:', profileError);
              if (isMounted) {
                const defaultUser = {
                  id: session.user.id,
                  email: session.user.email!, // Ya verificado
                  name: session.user.email!.split('@')[0]
                };
                console.log('[AuthContext] onAuthStateChange: Setting user to default due to profileError.', defaultUser);
                setUser(defaultUser);
                setIsAuthenticated(true);
              }
            } else if (isMounted) {
              const userData = {
                id: session.user.id,
                email: session.user.email!, // Ya verificado
                name: profile?.name || session.user.email!.split('@')[0]
              };
              console.log('[AuthContext] onAuthStateChange: Setting user with profile data.', userData);
              setUser(userData);
              setIsAuthenticated(true);
            }
        } catch (fetchError) {
            console.error('[AuthContext] onAuthStateChange: EXCEPTION during profile fetch:', fetchError);
            if (isMounted) {
                console.log('[AuthContext] onAuthStateChange: Setting user to null due to EXCEPTION in profile fetch.');
                // Consider if setting a default user is appropriate or if signOut is better
                setUser({ id: session.user.id, email: session.user.email!, name: session.user.email!.split('@')[0]});
                setIsAuthenticated(true); // Or false, depending on how you want to handle this
                // It might be better to sign out if the profile can't be fetched due to a user ID mismatch
                // await supabase.auth.signOut(); // Potentially sign out if user is inconsistent
                // console.log('[AuthContext] onAuthStateChange: Attempted signOut due to inconsistent user data.');
            }
        }
      } else { // No session, or session.user is null/undefined, or session.user.email is null/undefined
        if(session && (!session.user || !session.user.email)) {
          console.warn('[AuthContext] onAuthStateChange: Session found but session.user or session.user.email is invalid.', { user: session.user });
        } else {
          console.log('[AuthContext] onAuthStateChange: No session.');
        }
        if (isMounted) {
          console.log('[AuthContext] onAuthStateChange: Setting user to null.');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      console.log('[AuthContext] onAuthStateChange: Finished processing.');
    });

    return () => {
      console.log('[AuthContext] useEffect cleanup. Setting isMounted to false and unsubscribing.');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

    if (authData.user && authData.user.email) { // Verificar authData.user.email
      console.log('[AuthContext] login: authData.user exists. Fetching profile.');
      const { data: profile, error: profileError } = await supabase // Agregado profileError
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      console.log('[AuthContext] login: Profile fetched.', { profile, profileError }); // Agregado profileError al log

      if (profileError) {
          console.error('[AuthContext] login: Error fetching profile after login:', profileError);
          // Decide how to handle this: set default user or throw?
      }

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
        console.warn('[AuthContext] login: authData.user is null/undefined or email is missing.', {user: authData.user});
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

    if (authData.user && authData.user.email) { // Verificar authData.user.email
      console.log('[AuthContext] register: authData.user exists. Creating profile.');
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email, // Usar email de authData.user
            name: name,
          }
        ]);

      if (profileError) {
        console.error('[AuthContext] register: profileError creating user in "users" table:', profileError);
        // Consider a rollback or specific error handling if user is in auth.users but not in public.users
        throw profileError;
      }
      console.log('[AuthContext] register: Profile created in "users" table.');

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
        console.warn('[AuthContext] register: authData.user is null/undefined or email is missing.', { user: authData.user });
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
  };

  if (isLoading) {
    console.log('[AuthContext] Rendering "Loading app..." screen.');
    return <div className="flex justify-center items-center min-h-screen">Loading app...</div>;
  }

  console.log('[AuthContext] Rendering children. isAuthenticated:', isAuthenticated, 'User:', user ? {...user} : null);
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