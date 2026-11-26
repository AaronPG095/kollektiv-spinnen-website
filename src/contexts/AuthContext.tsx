import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/errorHandler';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Helper function to check admin and super admin status
    const checkAdminStatus = async (userEmail: string | undefined): Promise<void> => {
      if (import.meta.env.DEV) {
        console.log('[AuthContext] Checking admin status for:', userEmail);
      }
      try {
        if (!userEmail) {
          if (mounted) {
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
          return;
        }

        // Check user_roles table for both admin and super_admin roles
        
        // Check user_roles table for both admin and super_admin roles
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Check for super_admin role
            const { data: roleSuperAdmin, error: superAdminError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'super_admin')
              .single();
            
            // Check for admin role
            const { data: roleAdmin, error: roleError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', user.id)
              .eq('role', 'admin')
              .single();
            
            const hasSuperAdminRole = !!roleSuperAdmin && !superAdminError;
            const hasAdminRole = !!roleAdmin && !roleError;
            
            // Super admin if they have super_admin role OR if email matches (for robustness)
            const isSuperAdminUser = hasSuperAdminRole;
            
            if (mounted) {
              setIsSuperAdmin(isSuperAdminUser);
              // User is admin if they have admin role OR super_admin role
              setIsAdmin(hasAdminRole || hasSuperAdminRole);
            }
          } else {
            if (mounted) {
              setIsAdmin(false);
              setIsSuperAdmin(false);
            }
          }
        } catch (userRolesError: any) {
          if (import.meta.env.DEV) {
            console.log('[AuthContext] user_roles check failed:', userRolesError?.message);
          }
          if (mounted) {
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
        }
      } catch (error) {
        logError('AuthContext', error, { operation: 'checkAdminStatus' });
        if (mounted) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (import.meta.env.DEV) {
          console.log('[AuthContext] Auth state changed:', event);
        }
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Check admin status in background (non-blocking, but properly awaited)
        if (session?.user) {
          // Use void to explicitly mark as fire-and-forget, but still properly await
          void checkAdminStatus(session.user.email).catch(err => {
            logError('AuthContext', err, { operation: 'backgroundAdminCheck' });
          });
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (import.meta.env.DEV) {
        console.log('[AuthContext] Initial session check:', session ? 'found' : 'none');
      }
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Check admin status in background
      if (session?.user) {
        checkAdminStatus(session.user.email).catch(err => {
          logError('AuthContext', err, { operation: 'initialAdminCheck' });
        });
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[AuthContext] Signing in with email:', email);
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      
      if (error) {
        logError('AuthContext', error, { operation: 'signIn', email });
      } else if (import.meta.env.DEV) {
        console.log('[AuthContext] Sign in successful!');
      }
      
      return { error, data };
    } catch (err: any) {
      logError('AuthContext', err, { operation: 'signIn' });
      return { error: err };
    }
  };

  // Helper function to get the correct base URL for redirects
  const getBaseUrl = (): string => {
    // In production, use VITE_APP_URL if set, otherwise use window.location.origin
    const appUrl = import.meta.env.VITE_APP_URL;
    if (appUrl && !import.meta.env.DEV) {
      // Remove trailing slash if present
      return appUrl.replace(/\/$/, '');
    }
    return window.location.origin;
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${getBaseUrl()}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[AuthContext] Sending password reset email to:', email);
      }
      const redirectUrl = `${getBaseUrl()}/auth/reset-password`;
      if (import.meta.env.DEV) {
        console.log('[AuthContext] Using redirect URL:', redirectUrl);
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: redirectUrl,
      });
      
      if (error) {
        logError('AuthContext', error, { operation: 'resetPasswordForEmail', email });
      } else if (import.meta.env.DEV) {
        console.log('[AuthContext] Password reset email sent successfully!');
      }
      
      return { error };
    } catch (err: any) {
      logError('AuthContext', err, { operation: 'resetPasswordForEmail' });
      return { error: err };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log('[AuthContext] Updating password');
      }
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        logError('AuthContext', error, { operation: 'updatePassword' });
      } else if (import.meta.env.DEV) {
        console.log('[AuthContext] Password updated successfully!');
      }
      
      return { error };
    } catch (err: any) {
      logError('AuthContext', err, { operation: 'updatePassword' });
      return { error: err };
    }
  };

  const value = {
    user,
    session,
    isAdmin,
    isSuperAdmin,
    loading,
    signIn,
    signUp,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};