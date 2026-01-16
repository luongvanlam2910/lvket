import { supabase } from '../api/supabase';
import { User } from '../../types';

export interface SignUpData {
  email: string;
  password: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  // Sign up with email
  signUp: async (data: SignUpData) => {
    const { email, password, username } = data;
    
    // Validate input before sending
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    console.log('Attempting signup with email:', email);
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
      options: {
        // In development, you might want to skip email confirmation
        // emailRedirectTo: 'https://your-app.com/welcome',
      },
    });

    if (authError) {
      // Handle rate limiting specifically
      if (authError.status === 429) {
        throw new Error('Too many requests. Please wait a few minutes before trying again.');
      }
      
      // Handle 400 Bad Request with detailed message
      if (authError.status === 400) {
        let errorMsg = authError.message || 'Invalid request. Please check your information.';
        
        // Parse common Supabase auth errors
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('User already registered') ||
            authError.message?.includes('email address is already registered')) {
          errorMsg = 'This email is already registered. Please try logging in instead.';
        } else if (authError.message?.includes('Password')) {
          errorMsg = 'Password does not meet requirements. Please use a stronger password.';
        } else if (authError.message?.includes('Invalid email')) {
          errorMsg = 'Please enter a valid email address.';
        } else if (authError.message?.includes('signup_disabled')) {
          errorMsg = 'Sign up is currently disabled. Please contact support.';
        }
        
        console.error('Sign up 400 error:', {
          message: authError.message,
          status: authError.status,
          error: authError
        });
        
        throw new Error(errorMsg);
      }
      
      // Handle email already exists
      if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
        throw new Error('This email is already registered. Please try logging in instead.');
      }
      
      // Log error for debugging
      console.error('Sign up error:', {
        message: authError.message,
        status: authError.status,
        name: authError.name,
        error: authError
      });
      throw authError;
    }
    
    if (!authData.user) {
      throw new Error('Failed to create user account.');
    }

    // Create user profile in database
    try {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email || email,
          username: username || email.split('@')[0],
        });

      if (profileError) {
        // If table doesn't exist, provide helpful error
        if (profileError.message?.includes('relation') && profileError.message?.includes('does not exist')) {
          throw new Error('Database not set up. Please run supabase-schema.sql in Supabase SQL Editor first.');
        }
        
        // If RLS policy blocks insert (403)
        if (profileError.message?.includes('row-level security policy') || 
            profileError.message?.includes('violates row-level security')) {
          console.warn('RLS policy blocked profile creation. Trigger should create it automatically.');
          // Don't throw - trigger will create profile automatically
        }
        
        // If user already exists in profile table
        else if (profileError.message?.includes('duplicate key') || profileError.code === '23505') {
          // User profile already exists, that's okay
          console.log('User profile already exists, continuing...');
        } else {
          console.error('Profile creation error:', profileError);
          // Don't throw - let trigger handle it or getCurrentUser will create it
        }
      }
    } catch (profileError: any) {
      // If profile creation fails, we still have auth user, so log but don't fail completely
      console.error('Failed to create user profile:', profileError);
      // In development, we might want to continue even if profile creation fails
      // throw profileError;
    }

    return authData;
  },

  // Sign in with email
  signIn: async (signInData: SignInData) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: signInData.email,
      password: signInData.password,
    });

    if (error) {
      // Handle specific error cases
      if (error.status === 429) {
        throw new Error('Too many requests. Please wait a few minutes before trying again.');
      }
      
      // Better error messages
      if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid_credentials')) {
        throw new Error('Invalid email or password. Please check and try again.');
      }
      
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        throw new Error('Please verify your email before logging in. Check your inbox for the confirmation link.');
      }
      
      // Log full error for debugging
      console.error('Login error:', error);
      throw error;
    }
    return data;
  },

  // Sign out
  signOut: async () => {
    try {
      console.log('Starting sign out process...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        throw error;
      }
      
      // Verify session is cleared
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.warn('Session still exists after sign out, forcing clear...');
        // Force clear by calling signOut again
        await supabase.auth.signOut();
      }
      
      console.log('User signed out successfully, session cleared');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) return null;

    // Try to get user profile
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // If user profile doesn't exist, create it
    if (error && (error.code === 'PGRST116' || error.message?.includes('0 rows'))) {
      console.log('User profile not found, creating...');
      
      try {
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email || '',
            username: authUser.email?.split('@')[0] || 'user',
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create user profile:', createError);
          // If table doesn't exist, return null with helpful message
          if (createError.message?.includes('relation') && createError.message?.includes('does not exist')) {
            console.error('Database table "users" does not exist. Please run supabase-schema.sql');
            return null;
          }
          
          // If RLS policy blocks insert (403)
          if (createError.message?.includes('row-level security policy') || 
              createError.message?.includes('violates row-level security')) {
            console.error('RLS policy error. Please run fix-rls-policy.sql in Supabase SQL Editor.');
            // Return minimal user object so app doesn't crash
            return {
              id: authUser.id,
              email: authUser.email || '',
              username: authUser.email?.split('@')[0] || 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as User;
          }
          
          throw createError;
        }

        return newUser as User;
      } catch (createError: any) {
        console.error('Error creating user profile:', createError);
        // Return a minimal user object based on auth user
        return {
          id: authUser.id,
          email: authUser.email || '',
          username: authUser.email?.split('@')[0] || 'user',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as User;
      }
    }

    if (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
    
    return user as User;
  },

  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (session: any) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};

