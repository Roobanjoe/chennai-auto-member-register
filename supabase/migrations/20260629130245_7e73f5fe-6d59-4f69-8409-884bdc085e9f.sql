
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_url TEXT NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  dob DATE NOT NULL,
  member_no TEXT NOT NULL UNIQUE,
  mobile TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  license_no TEXT NOT NULL,
  renewal_date DATE NOT NULL,
  auto_stand TEXT NOT NULL,
  emergency_mobile TEXT NOT NULL,
  father_name TEXT NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.members TO authenticated;
GRANT ALL ON public.members TO service_role;

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Public can insert members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update members" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Public can delete members" ON public.members FOR DELETE USING (true);

CREATE INDEX members_member_no_idx ON public.members(member_no);
CREATE INDEX members_mobile_idx ON public.members(mobile);
CREATE INDEX members_created_at_idx ON public.members(created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON public.members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for member-photos bucket (bucket created via tool)
CREATE POLICY "Public read member photos" ON storage.objects FOR SELECT USING (bucket_id = 'member-photos');
CREATE POLICY "Public upload member photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'member-photos');
CREATE POLICY "Public update member photos" ON storage.objects FOR UPDATE USING (bucket_id = 'member-photos');
CREATE POLICY "Public delete member photos" ON storage.objects FOR DELETE USING (bucket_id = 'member-photos');
