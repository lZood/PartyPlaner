import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import { toast } from 'react-toastify';

// Definición de AppUser (asegúrate que sea consistente donde la uses)
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
  // Expón setUser para que ProfilePage pueda actualizar el contexto.
  // Considera si esto es la mejor práctica o si AuthContext debería tener una función updateUserProfile.
  // Por ahora, lo exponemos según tu implementación actual en ProfilePage.
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

  console.log('[AuthContext] Component rendering/re-rendering. isLoading:', isLoading, 'User:', user ? {...user} : null, 'IsAuthenticated:', isAuthenticated);

  useEffect(() => {
    console.log('[AuthContext] useEffect started. Setting up session listeners.');
    let isMounted = true;

    const handleValidAuthUser = async (authUser: SupabaseAuthUser, source: string) => {
      console.log(`[AuthContext] ${source}: authUser is valid. ID: ${authUser.id}. Fetching profile from "users" table.`);
      if (!authUser.email) {
        console.warn(`[AuthContext] ${source}: authUser does not have an email. Cannot proceed to fetch profile.`, { authUser });
        if (isMounted) {
          setUser(null); // O manejar de otra forma un usuario sin email
          setIsAuthenticated(false); // Si el email es mandatorio para tu app user
        }
        return;
      }

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

        const newAppUserData: AppUser = {
          id: authUser.id,
          email: authUser.email, // authUser.email ya fue verificado arriba
          name: profile?.name || authUser.email.split('@')[0],
          phone: profile?.phone || undefined,
          avatar_url: profile?.avatar_url || undefined,
        };

        if (profileError) {
          console.error(`[AuthContext] ${source}: Error fetching profile from 'users' table:`, profileError);
          // Aun si hay error al obtener el perfil de 'users', el usuario está autenticado en Supabase Auth.
          // Establecemos un usuario por defecto con los datos de Supabase Auth.
          // La interfaz AppUser debe poder manejar un `name` por defecto y `phone`/`avatar_url` opcionales.
          const defaultAppUser: AppUser = {
            id: authUser.id,
            email: authUser.email,
            name: authUser.email.split('@')[0],
          };
          console.log(`[AuthContext] ${source}: Setting user to default (from auth) due to profileError.`, defaultAppUser);
          setUser(defaultAppUser);
          setIsAuthenticated(true); // El usuario está autenticado, aunque el perfil de 'users' falle
        } else {
          let userChanged = false;
          if (!user) {
            userChanged = true;
          } else {
            if (user.id !== newAppUserData.id) userChanged = true;
            if (user.name !== newAppUserData.name) userChanged = true;
            if (user.email !== newAppUserData.email) userChanged = true;
            if (user.phone !== newAppUserData.phone) userChanged = true;
            if (user.avatar_url !== newAppUserData.avatar_url) userChanged = true;
          }

          if (userChanged) {
            console.log(`[AuthContext] ${source}: User data changed or was null. Setting user.`, newAppUserData);
            setUser(newAppUserData);
          } else {
            console.log(`[AuthContext] ${source}: User data is the same. Not calling setUser from ${source}.`);
          }
          // Asegurar que isAuthenticated sea true si llegamos aquí con un authUser válido
          if(!isAuthenticated) setIsAuthenticated(true);
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
          } else {
            await handleValidAuthUser(authUser, 'fetchInitialSession');
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
        // No es estrictamente necesario llamar a getUser() aquí si confías en el 'session' del evento,
        // pero puede ser una doble verificación. Si es problemático, puedes usar session.user directamente.
        const { data: { user: authUserFromEvent }, error: authUserError } = await supabase.auth.getUser();

        if (!isMounted) return;

        const authUserToProcess = authUserError || !authUserFromEvent ? session.user : authUserFromEvent;


        if (authUserError || !authUserToProcess) {
          console.warn('[AuthContext] onAuthStateChange: User from event session is not valid or error fetching authUser. Clearing session state.', { authUserError, authUser: authUserToProcess });
          if (isMounted) { setUser(null); setIsAuthenticated(false); }
        } else {
          await handleValidAuthUser(authUserToProcess, 'onAuthStateChange');
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
  }, []); // user e isAuthenticated no deberían estar aquí para evitar bucles de re-suscripción.

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

    // onAuthStateChange se encargará de actualizar el usuario y isAuthenticated
    if (authData.user) {
        toast.success(`¡Bienvenido de nuevo!`);
    } else {
        console.warn('[AuthContext] login: authData.user is null/undefined.');
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

    if (authData.user && authData.user.email) {
      console.log('[AuthContext] register: authData.user exists. Creating profile in "users" table.');
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: authData.user.email,
            name: name,
            // phone: '', // Podrías inicializar phone aquí si es necesario
          }
        ]);

      if (profileError) {
        console.error('[AuthContext] register: profileError creating user in "users" table:', profileError);
        // Si falla la creación del perfil público, el usuario de auth existe pero el perfil no.
        // Deberías decidir cómo manejar esto. ¿Eliminar el usuario de auth? ¿Reintentar?
        // Por ahora, lanzaremos el error, pero onAuthStateChange podría establecer un usuario por defecto.
        throw profileError;
      }
      console.log('[AuthContext] register: Profile created in "users" table.');
      // onAuthStateChange debería recoger este nuevo usuario y perfil.
      toast.success(`¡Bienvenido ${name}! Tu cuenta ha sido creada.`);
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
        setUser, // Exponer setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};