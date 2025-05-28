// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { createClient, User as SupabaseAuthUser, Session } from '@supabase/supabase-js';
import { toast } from 'react-toastify';
import { AppServiceType } from '../types'; // Assuming AppServiceType is the full service type

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
  isLoadingAuth: boolean; // Renamed for clarity
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
  favoriteServiceIds: string[]; // New: list of favorite service IDs
  addFavorite: (serviceId: string) => Promise<void>; // New
  removeFavorite: (serviceId: string) => Promise<void>; // New
  isFavorite: (serviceId: string) => boolean; // New
  fetchFavorites: () => Promise<void>; // New
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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Renamed
  const initialLoadDone = useRef(false);
  const [favoriteServiceIds, setFavoriteServiceIds] = useState<string[]>([]);

  const fetchFavorites = useCallback(async () => {
    if (user && isAuthenticated) {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('service_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching favorites:', error);
          setFavoriteServiceIds([]); // Reset on error
          return;
        }
        setFavoriteServiceIds(data ? data.map(fav => fav.service_id) : []);
      } catch (err) {
        console.error('Exception fetching favorites:', err);
        setFavoriteServiceIds([]);
      }
    } else {
      setFavoriteServiceIds([]); // Clear if not authenticated
    }
  }, [user, isAuthenticated]); // Dependencies for useCallback

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchFavorites();
    } else {
      setFavoriteServiceIds([]); // Clear favorites if user logs out or is not authenticated
    }
  }, [isAuthenticated, user, fetchFavorites]);


  useEffect(() => {
    let isMounted = true;
    // console.log('[AuthContext] useEffect - START. isMounted:', isMounted, 'initialLoadDone.current:', initialLoadDone.current);

    const processUserSession = async (authUser: SupabaseAuthUser | null, source: string) => {
      if (!isMounted) {
        // console.log(`[AuthContext] processUserSession (${source}): Component unmounted. Aborting.`);
        return;
      }

      if (authUser && authUser.email) {
        // console.log(`[AuthContext] processUserSession (${source}): authUser found (ID: ${authUser.id}). Fetching profile.`);
        try {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (!isMounted) return;

          if (profileError && profileError.code !== 'PGRST116') { // PGRST116: no rows found
            console.error(`[AuthContext] processUserSession (${source}): Error fetching profile:`, profileError);
          }
          const newAppUserData: AppUser = {
            id: authUser.id,
            email: authUser.email,
            name: profile?.name || authUser.email.split('@')[0],
            phone: profile?.phone || undefined,
            avatar_url: profile?.avatar_url || undefined,
          };
          setUser(newAppUserData);
          setIsAuthenticated(true);
          // console.log(`[AuthContext] processUserSession (${source}): Profile processed. User set.`, newAppUserData);
          // Fetch favorites after user is set
          // await fetchFavorites(); // fetchFavorites will be called by its own useEffect dependency on user
        } catch (fetchError) {
          console.error(`[AuthContext] processUserSession (${source}): EXCEPTION during profile fetch:`, fetchError);
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        // console.log(`[AuthContext] processUserSession (${source}): No valid authUser or email missing. Clearing user state.`);
        setUser(null);
        setIsAuthenticated(false);
      }

      if (!initialLoadDone.current) {
        // console.log(`[AuthContext] processUserSession (${source}): Initial load sequence complete. Setting isLoadingAuth to false.`);
        setIsLoadingAuth(false);
        initialLoadDone.current = true;
      }
    };
    
    supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!isMounted) return;
        // console.log('[AuthContext] getSession result, user:', session?.user?.id);
        processUserSession(session?.user ?? null, 'initialGetSession');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        // console.log('[AuthContext] onAuthStateChange: Event -', _event, 'Session user ID -', session?.user?.id || 'null');
        processUserSession(session?.user ?? null, `onAuthStateChange-${_event}`);
        if (_event === 'SIGNED_OUT') {
            setFavoriteServiceIds([]); // Clear favorites on sign out
        }
      }
    );

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []); // Removed fetchFavorites from here, it has its own useEffect

  const login = async (email: string, password: string) => {
    setIsLoadingAuth(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        toast.error(authError.message.includes('Invalid login credentials') ? 'Correo o contraseña incorrectos' : authError.message);
        throw authError;
      }
      if (authData.user) {
          toast.success(`¡Bienvenido de nuevo!`);
      }
    } catch (error) {
      if (!String(error).includes('AuthApiError')) {
        toast.error('Error al iniciar sesión.');
      }
      throw error;
    } finally {
        setIsLoadingAuth(false); // Ensure loading is reset
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoadingAuth(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) {
        toast.error(authError.message.includes('already registered') ? 'Este correo ya está registrado' : authError.message);
        throw authError;
      }

      if (authData.user && authData.user.email) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{ id: authData.user.id, email: authData.user.email, name: name }]);
        if (profileError) {
          toast.error('Error al crear el perfil de usuario.');
          throw profileError;
        }
        toast.success(`¡Bienvenido ${name}! Tu cuenta ha sido creada. Revisa tu correo para confirmar.`);
      } else {
        toast.error('No se pudo completar el registro.');
      }
    } catch (error) {
      if (!String(error).includes('AuthApiError') && !String(error).includes('PostgrestError')) {
         toast.error('Error durante el registro.');
      }
      throw error;
    } finally {
        setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    setIsLoadingAuth(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión.');
      setIsLoadingAuth(false);
      throw error;
    }
    // User state, isAuthenticated, and favorites will be cleared by onAuthStateChange
    toast.success('Has cerrado sesión.');
    // No need to manually setIsLoadingAuth(false) here, onAuthStateChange handles it.
  };

  const addFavorite = async (serviceId: string) => {
    if (!user || !isAuthenticated) {
      toast.warn('Debes iniciar sesión para añadir favoritos.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert([{ user_id: user.id, service_id: serviceId }])
        .select();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          // Already a favorite, this shouldn't happen if UI is correct
          // console.warn('Service already favorited, or race condition.');
        } else {
          throw error;
        }
      }
      if (data) {
        setFavoriteServiceIds(prev => [...new Set([...prev, serviceId])]); // Ensure unique
        // toast.success('Servicio añadido a favoritos!'); // Optional: too noisy?
      }
    } catch (err: any) {
      toast.error('Error al añadir a favoritos: ' + err.message);
    }
  };

  const removeFavorite = async (serviceId: string) => {
    if (!user || !isAuthenticated) {
      // toast.warn('Debes iniciar sesión para quitar favoritos.'); // Usually not needed as button won't be active
      return;
    }
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('service_id', serviceId);

      if (error) throw error;
      setFavoriteServiceIds(prev => prev.filter(id => id !== serviceId));
      // toast.info('Servicio eliminado de favoritos.'); // Optional: too noisy?
    } catch (err: any) {
      toast.error('Error al quitar de favoritos: ' + err.message);
    }
  };

  const isFavorite = (serviceId: string): boolean => {
    return favoriteServiceIds.includes(serviceId);
  };


  if (isLoadingAuth && !initialLoadDone.current) {
    return <div className="flex justify-center items-center min-h-screen text-lg">Cargando aplicación...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
        isLoadingAuth,
        setUser,
        favoriteServiceIds,
        addFavorite,
        removeFavorite,
        isFavorite,
        fetchFavorites
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};