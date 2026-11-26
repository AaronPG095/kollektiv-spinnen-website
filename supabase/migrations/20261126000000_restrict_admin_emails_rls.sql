-- Restrict admin_emails SELECT to authenticated admins/super-admins and remove hardcoded super-admin email
DROP POLICY IF EXISTS "Public can view admin emails" ON public.admin_emails;

CREATE POLICY "Admins can view admin emails"
ON public.admin_emails
FOR SELECT
TO authenticated
USING (
  (SELECT public.has_role((SELECT auth.uid()), 'admin'::app_role))
  OR (SELECT public.has_role((SELECT auth.uid()), 'super_admin'::app_role))
);

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.has_role(auth.uid(), 'super_admin'::app_role);
END;
$$;
