import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient, User as SupabaseAuthUser, Session } from '@supabase/supabase-js';
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
  refreshUserProfile: () => Promise<void>; // Nueva función
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
  const initialLoadDone = useRef(false);

  console.log(`[AuthContext] Component rendering. isLoading: ${isLoading}, isAuthenticated: ${isAuthenticated}, User: ${user ? user.id : null}`);

  const fetchAndSetUserProfile = async (authUser: SupabaseAuthUser, source: string): Promise<AppUser | null> => {
    if (!authUser.email) {
      console.warn(`[AuthContext] fetchAndSetUserProfile (${source}): authUser does not have an email. Cannot fetch profile.`);
      return null;
    }
    console.log(`[AuthContext] fetchAndSetUserProfile (${source}): authUser found (ID: ${authUser.id}). Fetching profile from "users" table.`);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error(`[AuthContext] fetchAndSetUserProfile (${source}): Error fetching profile:`, profileError);
        return {
          id: authUser.id,
          email: authUser.email,
          name: authUser.email.split('@')[0],
        };
      } else {
        const appUser: AppUser = {
          id: authUser.id,
          email: authUser.email,
          name: profile?.name || authUser.email.split('@')[0],
          phone: profile?.phone || undefined,
          avatar_url: profile?.avatar_url || undefined,
        };
        console.log(`[AuthContext] fetchAndSetUserProfile (${source}): Profile fetched successfully.`, appUser);
        return appUser;
      }
    } catch (fetchError) {
      console.error(`[AuthContext] fetchAndSetUserProfile (${source}): EXCEPTION during profile fetch:`, fetchError);
      return null;
    }
  };

  const processUserSession = async (authUser: SupabaseAuthUser | null, source: string) => {
    // Para isMounted, se asume que el useEffect que llama a esto maneja su propio flag isMounted
    let isMounted = true; // Simplificación para este fragmento. Considera el scope real.

    if (!isMounted) {
        console.log(`[AuthContext] processUserSession (${source}): Component unmounted. Aborting.`);
        return;
    }

    if (authUser) {
      const appUser = await fetchAndSetUserProfile(authUser, source);
      if (isMounted) { // Verificar de nuevo por si la operación asíncrona tardó
        if (appUser) {
          setUser(appUser);
          setIsAuthenticated(true);
          console.log(`[AuthContext] processUserSession (${source}): User state updated.`, appUser);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          console.log(`[AuthContext] processUserSession (${source}): Failed to fetch profile, user state cleared.`);
        }
      }
    } else {
      if (isMounted) {
        console.log(`[AuthContext] processUserSession (${source}): No authUser provided. Clearing user state.`);
        setUser(null);
        setIsAuthenticated(false);
      }
    }

    if (isMounted && !initialLoadDone.current) {
      console.log(`[AuthContext] processUserSession (${source}): Initial load sequence complete. Setting isLoading to false.`);
      setIsLoading(false);
      initialLoadDone.current = true;
    }
  };
  
  const refreshUserProfile = async () => {
    console.log('[AuthContext] refreshUserProfile called.');
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('[AuthContext] refreshUserProfile: Error getting current auth user:', error);
        setUser(null);
        setIsAuthenticated(false);
        return;
    }

    // Llama a processUserSession con el authUser actual (puede ser null si no hay sesión)
    // processUserSession ya maneja el caso de authUser nulo.
    await processUserSession(authUser, 'refreshUserProfile');
    console.log('[AuthContext] refreshUserProfile: User profile processing complete.');
  };

  useEffect(() => {
    let isMounted = true;
    console.log('[AuthContext] useEffect - START. isMounted:', isMounted, 'initialLoadDone.current:', initialLoadDone.current);

    supabase.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (!isMounted) {
        console.log('[AuthContext] useEffect (getSession): Component unmounted. Aborting.');
        return;
      }
      if (sessionError) {
        console.error("[AuthContext] useEffect (getSession): Error getting initial session:", sessionError);
        await processUserSession(null, 'getSessionError');
      } else if (session && session.user) {
        console.log('[AuthContext] useEffect (getSession): Session found. User ID:', session.user.id);
        const { data: { user: liveUser }, error: getUserError } = await supabase.auth.getUser();
        if (!isMounted) return;
        if (getUserError || !liveUser) {
            console.warn('[AuthContext] useEffect (getSession): User from session.user not confirmed by getUser. Using session.user or clearing.', { getUserError, liveUser, sessionUser: session.user });
            await processUserSession(session.user, 'getSession-liveUserErrorOrFallback');
        } else {
            await processUserSession(liveUser, 'getSession-liveUserSuccess');
        }
      } else {
        console.log('[AuthContext] useEffect (getSession): No active session found.');
        await processUserSession(null, 'getSessionNoSession');
      }
    }).catch(async error => {
        if (!isMounted) return;
        console.error("[AuthContext] useEffect (getSession): Promise rejection:", error);
        await processUserSession(null, 'getSessionPromiseCatch');
    });

    console.log('[AuthContext] useEffect: Setting up onAuthStateChange listener.');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) {
          console.log('[AuthContext] onAuthStateChange: Component unmounted. Aborting.');
          return;
        }
        console.log('[AuthContext] onAuthStateChange: Event -', event, 'Session user ID -', session?.user?.id || 'null');
        await processUserSession(session?.user || null, `onAuthStateChange-${event}`);
      }
    );

    return () => {
      console.log('[AuthContext] useEffect - CLEANUP. Unsubscribing and setting isMounted to false.');
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true); 
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        console.error('[AuthContext] login: authError:', authError);
        toast.error(authError.message.includes('Invalid login credentials') ? 'Correo o contraseña incorrectos' : authError.message);
        setIsLoading(false); 
        throw authError; 
      }
      // onAuthStateChange (y por lo tanto processUserSession) se encargará de setIsLoading(false)
      if (authData.user) {
          toast.success(`¡Bienvenido de nuevo!`);
      }
    } catch (error) {
      setIsLoading(false); 
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true); 
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
          setIsLoading(false);
          throw profileError;
        }
        toast.success(`¡Bienvenido ${name}! Tu cuenta ha sido creada. Revisa tu correo para confirmar.`);
      } else { //
        toast.error('No se pudo completar el registro.');
      }
       // onAuthStateChange (y por lo tanto processUserSession) se encargará de setIsLoading(false)
    } catch (error) {
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
      setIsLoading(false); 
      throw error;
    }
     // onAuthStateChange (y por lo tanto processUserSession) se encargará de setIsLoading(false)
    toast.success('Has cerrado sesión.');
  };

  if (isLoading && !initialLoadDone.current) {
    console.log('[AuthContext] Rendering "Loading app..." screen.');
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
        setUser, // Aún se expone por si ProfilePage lo necesita directamente, aunque es preferible refreshUserProfile
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};