/*
  # Update user profile trigger for better metadata handling

  1. Purpose
    - Improve the handle_new_user function to handle all user metadata fields
    - Ensure proper data extraction from auth.users raw_user_meta_data

  2. Changes
    - Updates the handle_new_user function to extract more metadata fields
    - Handles phone, avatar_url, and is_provider from user metadata
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone, avatar_url, is_provider, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_provider')::boolean, false),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the user creation
  RAISE LOG 'Error creating user profile: %', SQLERRM;
  RETURN NEW;
END;
$$;