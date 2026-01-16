-- Fix RLS Policy để cho phép search users
-- Chạy script này trong Supabase SQL Editor để sửa lỗi không tìm thấy bạn bè

-- Thêm policy cho phép authenticated users search users khác
DROP POLICY IF EXISTS "Users can search other users" ON public.users;
CREATE POLICY "Users can search other users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

