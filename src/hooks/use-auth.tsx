"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, type User } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: any }>;
  updateProfile: (updates: { full_name?: string }) => Promise<{ error?: any }>;
  updatePassword: (newPassword: string) => Promise<{ error?: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  console.log('🔄 AuthProvider render - loading:', loading, 'user:', user ? user.email : 'null', 'initialized:', isInitialized);

  useEffect(() => {
    console.log('🚀 AuthProvider useEffect triggered');
    let isMounted = true;
    
    const initialize = async () => {
      try {
        // Step 1: 캐시된 사용자 정보 즉시 로드
        const cachedUser = localStorage.getItem('auth-user');
        if (cachedUser && isMounted) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            console.log('✅ Setting cached user immediately:', parsedUser.email);
            setUser(parsedUser);
            setLoading(false);
            setIsInitialized(true);
          } catch (error) {
            console.error('Cache parse error:', error);
            localStorage.removeItem('auth-user');
          }
        } else {
          console.log('⚠️ No cached user found');
          setIsInitialized(true);
        }

        // Step 2: 백그라운드에서 실제 세션 확인
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        if (isMounted) {
          const mappedUser = session?.user ? mapSupabaseUser(session.user) : null;
          console.log('🔍 Session verification result:', mappedUser ? mappedUser.email : 'none');
          
          setUser(mappedUser);
          
          // localStorage 업데이트
          if (mappedUser) {
            localStorage.setItem('auth-user', JSON.stringify(mappedUser));
          } else {
            localStorage.removeItem('auth-user');
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (isMounted) {
          setLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initialize();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        const mappedUser = session?.user ? mapSupabaseUser(session.user) : null;
        setUser(mappedUser);
        
        // localStorage에 사용자 정보 캐시
        if (mappedUser) {
          localStorage.setItem('auth-user', JSON.stringify(mappedUser));
        } else {
          localStorage.removeItem('auth-user');
        }
        
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email!,
    user_metadata: supabaseUser.user_metadata,
  });

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error };
  };

  const updateProfile = async (updates: { full_name?: string }) => {
    const { error } = await supabase.auth.updateUser({
      data: updates,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const value = {
    user,
    loading,
    isInitialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
