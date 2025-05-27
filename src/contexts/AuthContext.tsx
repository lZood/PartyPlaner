// src/contexts/AuthContext.tsx

// ... (importaciones y AppUser interface)

interface AuthContextType {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  // NUEVA FUNCIÓN para refrescar el usuario manualmente si es necesario
  refreshUserProfile: () => Promise<void>;
}

// ... (supabase client y AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const initialLoadDone = useRef(false);

  // ... (console.log)

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
        // Devolver un usuario por defecto basado en authUser si el perfil no se encuentra o hay error
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
      return null; // O un usuario por defecto
    }
  };


  const processUserSession = async (authUser: SupabaseAuthUser | null, source: string) => {
    let isMounted = true; // Asumimos que esto se maneja en el useEffect que llama a esta función si es necesario.
                        // Para simplificar, lo omito aquí pero considera el scope de `isMounted`.

    if (authUser) {
      const appUser = await fetchAndSetUserProfile(authUser, source);
      if (appUser) {
        setUser(appUser);
        setIsAuthenticated(true);
        console.log(`[AuthContext] processUserSession (${source}): User state updated.`, appUser);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log(`[AuthContext] processUserSession (${source}): Failed to fetch profile, user state cleared.`);
      }
    } else {
      console.log(`[AuthContext] processUserSession (${source}): No authUser provided. Clearing user state.`);
      setUser(null);
      setIsAuthenticated(false);
    }

    if (!initialLoadDone.current) {
      console.log(`[AuthContext] processUserSession (${source}): Initial load sequence complete. Setting isLoading to false.`);
      setIsLoading(false);
      initialLoadDone.current = true;
    }
  };
  
  // Función para refrescar el perfil del usuario manualmente
  const refreshUserProfile = async () => {
    console.log('[AuthContext] refreshUserProfile called.');
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('[AuthContext] refreshUserProfile: Error getting current auth user:', error);
        // Podrías querer limpiar el usuario si hay un error significativo aquí
        setUser(null);
        setIsAuthenticated(false);
        return;
    }

    if (authUser) {
        console.log('[AuthContext] refreshUserProfile: Auth user found, processing session.');
        await processUserSession(authUser, 'refreshUserProfile');
    } else {
        console.log('[AuthContext] refreshUserProfile: No auth user found, clearing session.');
        // Esto ya lo hace processUserSession si authUser es null, pero para ser explícito:
        setUser(null);
        setIsAuthenticated(false);
    }
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
        processUserSession(null, 'getSessionError');
      } else if (session && session.user) {
        console.log('[AuthContext] useEffect (getSession): Session found. User ID:', session.user.id);
        const { data: { user: liveUser }, error: getUserError } = await supabase.auth.getUser(); //
        if (!isMounted) return;
        if (getUserError || !liveUser) {
            console.warn('[AuthContext] useEffect (getSession): User from session.user not confirmed by getUser. Using session.user or clearing.', { getUserError, liveUser, sessionUser: session.user });
             processUserSession(session.user, 'getSession-liveUserErrorOrFallback');
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

  // ... (funciones login, register, logout sin cambios significativos, solo asegurar que manejen isLoading)

  const login = async (email: string, password: string) => {
    // setIsLoading(true); // Ya está en la versión anterior
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ //
        email,
        password,
      });
      if (authError) {
        console.error('[AuthContext] login: authError:', authError); //
        toast.error(authError.message.includes('Invalid login credentials') ? 'Correo o contraseña incorrectos' : authError.message); //
        // setIsLoading(false); // processUserSession lo hará
        throw authError; 
      }
      if (authData.user) { //
          toast.success(`¡Bienvenido de nuevo!`); //
      }
    } catch (error) {
      // setIsLoading(false); // processUserSession lo hará si falla y authUser es null
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    // setIsLoading(true); // Ya está en la versión anterior
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ //
        email,
        password,
      });
      if (authError) {
        console.error('[AuthContext] register: authError:', authError); //
        toast.error(authError.message.includes('already registered') ? 'Este correo ya está registrado' : authError.message); //
        // setIsLoading(false);
        throw authError;
      }

      if (authData.user && authData.user.email) { //
        const { error: profileError } = await supabase
          .from('users')
          .insert([{ id: authData.user.id, email: authData.user.email, name: name }]); //
        if (profileError) {
          console.error('[AuthContext] register: profileError:', profileError); //
          toast.error('Error al crear el perfil de usuario.');
          // setIsLoading(false);
          throw profileError;
        }
        toast.success(`¡Bienvenido ${name}! Tu cuenta ha sido creada. Revisa tu correo para confirmar.`); //
      } else {
        toast.error('No se pudo completar el registro.');
      }
    } catch (error) {
      // setIsLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    // setIsLoading(true); // Ya está en la versión anterior
    const { error } = await supabase.auth.signOut(); //
    if (error) {
      console.error('[AuthContext] logout: error:', error); //
      toast.error('Error al cerrar sesión.');
      // setIsLoading(false); // processUserSession lo hará
      throw error;
    }
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
        setUser,
        refreshUserProfile, // Exponer la nueva función
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};