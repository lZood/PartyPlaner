import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, User as SupabaseAuthUser } from '@supabase/supabase-js'; // Importar User de supabase
import { toast } from 'react-toastify';

interface AppUser { // Renombrar tu interfaz para evitar colisión
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: AppUser | null;
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
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  console.log('[AuthContext] Component rendering/re-rendering. isLoading:', isLoading);

  useEffect(() => {
    console.log('[AuthContext] useEffect started. Setting up session listeners.');
    let isMounted = true;

    const handleValidAuthUser = async (authUser: SupabaseAuthUser, source: string) => {
      console.log(`[AuthContext] ${source}: authUser is valid. ID: ${authUser.id}. Fetching profile from "users" table.`);
      try {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();
        console.log(`[AuthContext] ${source}: Profile fetch attempt completed.`, { profile, profileError });

        if (!isMounted) {
          console.log(`[AuthContext] ${source}: component unmounted after profile fetch, returning.`);
          return;
        }

        if (profileError) {
          console.error(`[AuthContext] ${source}: Error fetching profile:`, profileError);
          if (isMounted && authUser.email) { // Asegurar que email existe
            const defaultUser: AppUser = {
              id: authUser.id,
              email: authUser.email,
              name: authUser.email.split('@')[0]
            };
            console.log(`[AuthContext] ${source}: Setting user to default due to profileError.`, defaultUser);
            setUser(defaultUser);
            setIsAuthenticated(true);
          } else if (isMounted) {
            console.warn(`[AuthContext] ${source}: Cannot set default user as authUser.email is missing.`);
            setUser(null);
            setIsAuthenticated(false);
          }
        } else if (isMounted && authUser.email) { // Asegurar que email existe
          const appUserData: AppUser = {
            id: authUser.id,
            email: authUser.email,
            name: profile?.name || authUser.email.split('@')[0]
          };
          console.log(`[AuthContext] ${source}: Setting user with profile data.`, appUserData);
          setUser(appUserData);
          setIsAuthenticated(true);
        } else if (isMounted) {
            console.warn(`[AuthContext] ${source}: Cannot set user as authUser.email is missing.`);
            setUser(null);
            setIsAuthenticated(false);
        }
      } catch (fetchError) {
        console.error(`[AuthContext] ${source}: EXCEPTION during profile fetch:`, fetchError);
        if (isMounted) {
          console.log(`[AuthContext] ${source}: Setting user to null due to EXCEPTION in profile fetch.`);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    };

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

        if (!isMounted) return;

        if (sessionError) {
          console.error("[AuthContext] fetchInitialSession: Error getting initial session:", sessionError);
          if (isMounted) { setUser(null); setIsAuthenticated(false); }
        } else if (session && session.user) {
          console.log('[AuthContext] fetchInitialSession: Session object found. Validating user with auth.getUser() for ID:', session.user.id);
          const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser();

          if (!isMounted) return;

          if (authUserError || !authUser) {
            console.warn('[AuthContext] fetchInitialSession: User from session is not valid or error fetching authUser. Clearing session state.', { authUserError, authUser });
            if (isMounted) { setUser(null); setIsAuthenticated(false); }
            // Consider await supabase.auth.signOut(); if this state persists
          } else if (authUser.email) { // Check if email exists
            await handleValidAuthUser(authUser, 'fetchInitialSession');
          } else {
            console.warn('[AuthContext] fetchInitialSession: authUser retrieved but email is missing.', { authUser });
            if (isMounted) { setUser(null); setIsAuthenticated(false); }
          }
        } else {
          console.log('[AuthContext] fetchInitialSession: No session or no session.user found.');
          if (isMounted) { setUser(null); setIsAuthenticated(false); }
        }
      } catch (e) {
        console.error("[AuthContext] fetchInitialSession: Exception caught:", e);
        if (isMounted) { setUser(null); setIsAuthenticated(false); }
      } finally {
        console.log('[AuthContext] fetchInitialSession: finally block. Calling setIsLoading(false).');
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

      if (session && session.user) {
        console.log('[AuthContext] onAuthStateChange: Session object found. Validating user with auth.getUser() for ID:', session.user.id);
        const { data: { user: authUser }, error: authUserError } = await supabase.auth.getUser(); // Validate the user again

        if (!isMounted) return;

        if (authUserError || !authUser) {
          console.warn('[AuthContext] onAuthStateChange: User from event session is not valid or error fetching authUser. Clearing session state.', { authUserError, authUser });
          if (isMounted) { setUser(null); setIsAuthenticated(false); }
          // Consider await supabase.auth.signOut();
        } else if (authUser.email) { // Check if email exists
          await handleValidAuthUser(authUser, 'onAuthStateChange');
        } else {
          console.warn('[AuthContext] onAuthStateChange: authUser retrieved but email is missing.', { authUser });
          if (isMounted) { setUser(null); setIsAuthenticated(false); }
        }
      } else {
        console.log('[AuthContext] onAuthStateChange: No session or no session.user.');
        if (isMounted) { setUser(null); setIsAuthenticated(false); }
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
    // ... (login function remains largely the same, ensure it uses AppUser for setUser)
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

    if (authData.user && authData.user.email) {
      console.log('[AuthContext] login: authData.user exists. Fetching profile.');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();
      console.log('[AuthContext] login: Profile fetched.', { profile, profileError });

      if (profileError) {
          console.error('[AuthContext] login: Error fetching profile after login:', profileError);
      }

      const appUserData: AppUser = { // Use AppUser
        id: authData.user.id,
        email: authData.user.email,
        name: profile?.name || authData.user.email.split('@')[0]
      };
      console.log('[AuthContext] login: Setting user.', appUserData);
      setUser(appUserData);
      setIsAuthenticated(true);
      toast.success(`¡Bienvenido de nuevo!`);
    } else {
        console.warn('[AuthContext] login: authData.user is null/undefined or email is missing.', {user: authData.user});
    }
  };

  const register = async (email: string, password: string, name: string) => {
    // ... (register function remains largely the same, ensure it uses AppUser for setUser)
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

    if (authData.user && authData.user.email) {
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
        console.error('[AuthContext] register: profileError creating user in "users" table:', profileError);
        throw profileError;
      }
      console.log('[AuthContext] register: Profile created in "users" table.');

      const appUserData: AppUser = { // Use AppUser
        id: authData.user.id,
        email: authData.user.email,
        name: name
      };
      console.log('[AuthContext] register: Setting user.', appUserData);
      setUser(appUserData);
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
    // User state will be cleared by onAuthStateChange
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