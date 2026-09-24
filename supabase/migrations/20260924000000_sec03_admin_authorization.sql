-- Migration: SEC-03 Admin Authorization
-- Phase 2: Implementation (Defense in Depth)

-- 1. Create public.admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create public.is_admin() helper function
-- Must be created BEFORE any policies that use it
CREATE OR REPLACE FUNCTION public.is_admin(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = target_user_id AND role = 'admin'
  );
$$;

-- Revoke execute from public to prevent arbitrary probing
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;

-- 3. Enable RLS on admin_users and create its policy
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can see who is an admin
DROP POLICY IF EXISTS "admin_select_admin_users" ON public.admin_users;
CREATE POLICY "admin_select_admin_users" 
ON public.admin_users 
FOR SELECT 
USING (
  public.is_admin(auth.uid())
);

-- 4. Bootstrap the initial administrator
INSERT INTO public.admin_users (user_id, role)
VALUES ('c75891dd-9d9c-4b12-8194-a97f7dc26cad', 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Wipe out all existing policies on internal tables dynamically
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('aduan', 'aduan_history', 'aduan_attachments')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.policyname, rec.tablename);
    END LOOP;
END
$$;

-- 5b. Create Admin Authorization policies on internal tables

-- Table: public.aduan

CREATE POLICY "admin_select_aduan" 
ON public.aduan 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "admin_update_aduan" 
ON public.aduan 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Table: public.aduan_history

CREATE POLICY "admin_select_aduan_history" 
ON public.aduan_history 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "admin_insert_aduan_history" 
ON public.aduan_history 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Table: public.aduan_attachments

CREATE POLICY "admin_select_aduan_attachments" 
ON public.aduan_attachments 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

-- 6. Secure get_admin_aduan_stats RPC
-- Drop first to avoid "cannot change return type of existing function" error
DROP FUNCTION IF EXISTS public.get_admin_aduan_stats();

CREATE OR REPLACE FUNCTION public.get_admin_aduan_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  result json;
BEGIN
  -- Enforcement: Only admins can call this function
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: Administrator privileges required.' USING ERRCODE = '42501';
  END IF;

  SELECT json_build_object(
    'totalAduan', (SELECT count(*) FROM public.aduan),
    'pendingAduan', (SELECT count(*) FROM public.aduan WHERE status = 'pending'),
    'diprosesAduan', (SELECT count(*) FROM public.aduan WHERE status = 'diproses'),
    'selesaiAduan', (SELECT count(*) FROM public.aduan WHERE status = 'selesai'),
    'ditolakAduan', (SELECT count(*) FROM public.aduan WHERE status = 'ditolak'),
    'recentAduan', (
      SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json)
      FROM (
        SELECT id, ticket_number, title, status, created_at, category
        FROM public.aduan
        ORDER BY created_at DESC
        LIMIT 10
      ) r
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 7. Storage Bucket Security
-- Wipe all existing policies on storage.objects for the attachments bucket
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT policyname
        FROM pg_policies 
        WHERE schemaname = 'storage' 
          AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', rec.policyname);
    END LOOP;
END
$$;

CREATE POLICY "admin_select_attachments" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'attachments' AND public.is_admin(auth.uid()));

CREATE POLICY "admin_insert_attachments" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'attachments' AND public.is_admin(auth.uid()));

CREATE POLICY "admin_update_attachments" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'attachments' AND public.is_admin(auth.uid()));

CREATE POLICY "admin_delete_attachments" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'attachments' AND public.is_admin(auth.uid()));
