
-- Clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  business_type TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT,
  last_contacted TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX clients_user_id_idx ON public.clients(user_id);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

-- Outreach logs
CREATE TABLE public.outreach_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX outreach_logs_client_id_idx ON public.outreach_logs(client_id);
CREATE INDEX outreach_logs_user_id_idx ON public.outreach_logs(user_id);

ALTER TABLE public.outreach_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own outreach" ON public.outreach_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own outreach" ON public.outreach_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own outreach" ON public.outreach_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own outreach" ON public.outreach_logs FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
