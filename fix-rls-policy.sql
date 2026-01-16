-- Fix RLS Policy cho Users Table
-- Chạy script này trong Supabase SQL Editor để sửa lỗi 403 Forbidden

-- 1. Thêm INSERT policy cho users table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Tạo function để tự động tạo user profile khi signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tạo trigger để tự động tạo profile khi có user mới
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Tạo profile cho các user đã tồn tại nhưng chưa có trong public.users
-- (Chạy lệnh này nếu bạn đã có user trong auth.users nhưng chưa có trong public.users)
INSERT INTO public.users (id, email, username)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'username', SPLIT_PART(email, '@', 1)) as username
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

