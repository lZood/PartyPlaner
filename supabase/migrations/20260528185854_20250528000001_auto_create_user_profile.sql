/*
  # Auto-create user profile on signup

  1. Purpose
    - Automatically creates a user profile in public.users when a new user signs up
    - Extracts name from user metadata or email
    - Ensures users table is always in sync with auth.users

  2. Changes
    - Creates a PostgreSQL function to handle user creation
    - Creates a trigger that fires after INSERT on auth.users
    - Trigger calls the function to insert into public.users

  3. Security
    - Function runs with SECURITY DEFINER to bypass RLS during auto-creation
    - Only creates the profile, doesn't expose any data
*/

-- Create function to auto-create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email, phone, avatar_url, is_provider, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'is_provider')::boolean, false),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();