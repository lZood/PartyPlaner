// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'; // Añadir useRef
import { createClient, User as SupabaseAuthUser, Session } from '@supabase/supabase-js'; // Añadir Session
import { toast } from 'react-toastify';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false); // Usar ref para marcar la carga inicial

  console.log(`[AuthContext] Component rendering. isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}, User: ${user ? user.id : null}`);

  useEffect(() => {
    let isMounted = true;
    console.log('[AuthContext] useEffect - START. isMounted:', isMounted, 'initialLoadDone.current:', initialLoadDone.current);

    const processUserSession = async (authUser: SupabaseAuthUser | null, source: string) => {
      if (!isMounted) {
        console.log(`[AuthContext] processUserSession (${source}): Component unmounted. Aborting.`);
        return;
      }

      if (authUser && authUser.email) {
        console.log(`[AuthContext] processUserSession (${source}): authUser found (ID: ${authUser.id}). Fetching profile.`);
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (!isMounted) {
            console.log(`[AuthContext] processUserSession (${source}): Component unmounted after profile fetch. Aborting.`);
            return;
          }

          if (profileError) {
            console.error(`[AuthContext] processUserSession (${source}): Error fetching profile:`, profileError);
            const defaultAppUser: AppUser = {
              id: authUser.id,
              email: authUser.email,
              name: authUser.email.split('@')[0],
            };
            setUser(defaultAppUser);
            setIsAuthenticated(true);
          } else {
            const newAppUserData: AppUser = {
              id: authUser.id,
              email: authUser.email,
              name: profile?.name || authUser.email.split('@')[0],
              phone: profile?.phone || undefined,
              avatar_url: profile?.avatar_url || undefined,
            };
            setUser(newAppUserData);
            setIsAuthenticated(true);
            console.log(`[AuthContext] processUserSession (${source}): Profile processed. User set.`, newAppUserData);
          }
        } catch (fetchError) {
          console.error(`[AuthContext] processUserSession (${source}): EXCEPTION during profile fetch:`, fetchError);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        console.log(`[AuthContext] processUserSession (${source}): No valid authUser or email missing. Clearing user state.`);
        setUser(null);
        setIsAuthenticated(false);
      }

      if (!initialLoadDone.current) {
        console.log(`[AuthContext] processUserSession (${source}): Initial load sequence complete. Setting isLoading to false.`);
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    };

    // 1. Check for an existing session right away
    console.log('[AuthContext] useEffect: Attempting to get initial session.');
    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (!isMounted) {
        console.log('[AuthContext] useEffect (getSession): Component unmounted. Aborting.');
        return;
      }
      if (sessionError) {
        console.error("[AuthContext] useEffect (getSession): Error getting initial session:", sessionError);
        processUserSession(null, 'getSessionError');
      } else if (session && session.user) {
        console.log('[AuthContext] useEffect (getSession): Session found. User ID:', session.user.id);
        // Double check with getUser for robustness, or trust session.user
        const { data: { user: liveUser }, error: getUserError } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (getUserError || !liveUser) {
            console.warn('[AuthContext] useEffect (getSession): User from session.user not confirmed by getUser. Using session.user for now or clearing.', { getUserError, liveUser, sessionUser: session.user });
             processUserSession(session.user, 'getSession-liveUserError'); // Fallback to session.user or handle as error
        } else {
            processUserSession(liveUser, 'getSession-liveUserSuccess');
        }

      } else {
        console.log('[AuthContext] useEffect (getSession): No active session found.');
        processUserSession(null, 'getSessionNoSession');
      }
    }).catch(error => {
        if (!isMounted) return;
        console.error("[AuthContext] useEffect (getSession): Promise rejection:", error);
        processUserSession(null, 'getSessionPromiseCatch');
    });

    // 2. Subscribe to auth state changes
    console.log('[AuthContext] useEffect: Setting up onAuthStateChange listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) {
          console.log('[AuthContext] onAuthStateChange: Component unmounted. Aborting.');
          return;
        }
        console.log('[AuthContext] onAuthStateChange: Event -', event, 'Session user ID -', session?.user?.id || 'null');
        // When onAuthStateChange fires, it's a definitive update on the auth state.
        // We can directly use session.user from here if available.
        processUserSession(session?.user || null, `onAuthStateChange-${event}`);
      }
    );

    return () => {
      console.log('[AuthContext] useEffect - CLEANUP. Unsubscribing and setting isMounted to false.');
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount.

  const login = async (email: string, password: string) => {
    setIsLoading(true); // Set loading true during login attempt
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        console.error('[AuthContext] login: authError:', authError);
        toast.error(authError.message.includes('Invalid login credentials') ? 'Correo o contraseña incorrectos' : authError.message);
        setIsLoading(false); // Reset loading on error
        throw authError; // Re-throw to be caught by UI
      }
      // onAuthStateChange will handle setting user and isAuthenticated.
      // setIsLoading(false) will be handled by processUserSession via onAuthStateChange.
      if (authData.user) {
          toast.success(`¡Bienvenido de nuevo!`);
      }
    } catch (error) {
      if (!String(error).includes('AuthApiError')) { // Avoid double toast for auth errors
        toast.error('Error al iniciar sesión.');
      }
      setIsLoading(false); // Ensure loading is reset if something else goes wrong
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true); // Set loading true during registration attempt
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        console.error('[AuthContext] register: authError:', authError);
        toast.error(authError.message.includes('already registered') ? 'Este correo ya está registrado' : authError.message);
        setIsLoading(false);
        throw authError;
      }

      if (authData.user && authData.user.email) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{ id: authData.user.id, email: authData.user.email, name: name }]);
        if (profileError) {
          console.error('[AuthContext] register: profileError:', profileError);
          toast.error('Error al crear el perfil de usuario.');
          // Consider how to handle this: sign out the user?
          setIsLoading(false);
          throw profileError;
        }
        // onAuthStateChange will handle setting user and isAuthenticated.
        toast.success(`¡Bienvenido ${name}! Tu cuenta ha sido creada. Revisa tu correo para confirmar.`);
      } else {
        toast.error('No se pudo completar el registro.');
      }
    } catch (error) {
      if (!String(error).includes('AuthApiError') && !String(error).includes('PostgrestError')) {
         toast.error('Error durante el registro.');
      }
      setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthContext] logout: error:', error);
      toast.error('Error al cerrar sesión.');
      setIsLoading(false); // Reset loading on error
      throw error;
    }
    // User state will be cleared by onAuthStateChange, which will also call setIsLoading(false)
    // via processUserSession.
    toast.success('Has cerrado sesión.');
  };

  if (isLoading && !initialLoadDone.current) { // Show loading only if initial load is not yet marked as done
    console.log('[AuthContext] Rendering "Loading app..." screen.');
    return <div className="flex justify-center items-center min-h-screen">Loading app...</div>;
  }

  console.log(`[AuthContext] Rendering children. isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}`);
  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};