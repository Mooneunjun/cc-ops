"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, type User } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

const mapSupabaseUser = (supabaseUser: SupabaseUser): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email!,
  user_metadata: supabaseUser.user_metadata,
});

// 세션 정보를 가져오는 함수
const getSession = async (): Promise<User | null> => {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Session error:', error);
    return null;
  }
  
  return session?.user ? mapSupabaseUser(session.user) : null;
};

// 인증 쿼리 훅
export function useAuthQuery() {
  const queryClient = useQueryClient();
  
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: getSession,
    staleTime: Infinity, // 절대 stale이 되지 않음
    gcTime: Infinity, // 절대 가비지 컬렉션되지 않음
    refetchOnMount: false, // 마운트 시 재요청하지 않음
    refetchOnWindowFocus: false, // 윈도우 포커스 시 재요청하지 않음
    refetchOnReconnect: false, // 재연결 시 재요청하지 않음
  });

  // 로그인 뮤테이션
  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      console.log('로그인 시도:', { 
        email: email?.trim() || '', 
        passwordLength: password?.length || 0,
        emailType: typeof email,
        passwordType: typeof password
      });
      
      if (!email || !password) {
        throw new Error('이메일과 비밀번호를 입력해주세요.');
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      console.log('로그인 응답:', { data, error });
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // 로그인 성공 시 세션 쿼리 무효화하여 새로 가져오기
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
    },
  });

  // 로그아웃 뮤테이션
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      // 로그아웃 시 세션 쿼리 무효화
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
    },
  });

  // 회원가입 뮤테이션
  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return true;
    },
  });

  // 프로필 업데이트 뮤테이션
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { full_name?: string }) => {
      const { error } = await supabase.auth.updateUser({
        data: updates,
      });
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
    },
  });

  // 비밀번호 업데이트 뮤테이션
  const updatePasswordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return true;
    },
  });

  // 비밀번호 재설정 뮤테이션
  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return true;
    },
  });

  return {
    user: user || null,
    loading: isLoading,
    error,
    refetch,
    signIn: signInMutation.mutateAsync,
    signOut: signOutMutation.mutateAsync,
    signUp: signUpMutation.mutateAsync,
    updateProfile: updateProfileMutation.mutateAsync,
    updatePassword: updatePasswordMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isUpdatingProfile: updateProfileMutation.isPending,
    isUpdatingPassword: updatePasswordMutation.isPending,
  };
}