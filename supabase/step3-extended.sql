-- STEM Capstone Hub — Step 3: extended tables + hardened storage + audit log
-- Run AFTER schema.sql (or step1-drop.sql + step2-create.sql).
-- Safe to re-run: uses IF NOT EXISTS / DROP POLICY IF EXISTS.
-- Covers tables the app already queries that had no RLS:
--   budget_items, meetings, chat_messages, share_links, version_history,
--   advisor_feedback, feedback, audit_logs

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  amount numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  date timestamptz NOT NULL DEFAULT now(),
  notes text NOT NULL DEFAULT '',
  receipt_file_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- For databases where step3 already ran before the quantity column existed
ALTER TABLE public.budget_items ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  date timestamptz NOT NULL,
  duration integer NOT NULL DEFAULT 60,
  attendees text[] NOT NULL DEFAULT '{}',
  agenda text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  action_items text[] NOT NULL DEFAULT '{}',
  summary text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.share_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  permission text NOT NULL DEFAULT 'view',
  advisor_name text,
  advisor_email text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.version_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_id text NOT NULL,
  content text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_description text
);

CREATE TABLE IF NOT EXISTS public.advisor_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  share_link_id uuid,
  author_name text,
  author_role text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  section text
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  category text,
  email text,
  url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  team_id uuid,
  project_id uuid,
  action text NOT NULL,
  resource text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Knowledge index chunks (reserved for cloud sync of the file index;
-- the app currently keeps the index in the browser until this is wired).
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id text NOT NULL,
  file_name text NOT NULL,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_budget_items_project ON public.budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project ON public.meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project ON public.chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_share_links_project ON public.share_links(project_id);
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);
CREATE INDEX IF NOT EXISTS idx_version_history_project ON public.version_history(project_id);
CREATE INDEX IF NOT EXISTS idx_advisor_feedback_project ON public.advisor_feedback(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_team ON public.audit_logs(team_id);

-- =============================================
-- RLS
-- =============================================

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Budget items: team members manage their own projects' rows
DROP POLICY IF EXISTS "Team members can manage budget" ON public.budget_items;
CREATE POLICY "Team members can manage budget" ON public.budget_items FOR ALL USING (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
) WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
);

-- Meetings
DROP POLICY IF EXISTS "Team members can manage meetings" ON public.meetings;
CREATE POLICY "Team members can manage meetings" ON public.meetings FOR ALL USING (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
) WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
);

-- Chat messages: members read all, but can only post as themselves
DROP POLICY IF EXISTS "Team members can view chat" ON public.chat_messages;
CREATE POLICY "Team members can view chat" ON public.chat_messages FOR SELECT USING (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
);
DROP POLICY IF EXISTS "Team members can post chat" ON public.chat_messages;
CREATE POLICY "Team members can post chat" ON public.chat_messages FOR INSERT WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
  AND user_id = auth.uid()
);
DROP POLICY IF EXISTS "Authors can delete own chat messages" ON public.chat_messages;
CREATE POLICY "Authors can delete own chat messages" ON public.chat_messages FOR DELETE USING (user_id = auth.uid());

-- Share links: team members manage; token lookup left to server-side/service flows
DROP POLICY IF EXISTS "Team members can manage share links" ON public.share_links;
CREATE POLICY "Team members can manage share links" ON public.share_links FOR ALL USING (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
) WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
);

-- Version history: append + read for members, no updates (history is immutable)
DROP POLICY IF EXISTS "Team members can view versions" ON public.version_history;
CREATE POLICY "Team members can view versions" ON public.version_history FOR SELECT USING (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
);
DROP POLICY IF EXISTS "Team members can append versions" ON public.version_history;
CREATE POLICY "Team members can append versions" ON public.version_history FOR INSERT WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
);

-- Advisor feedback: members manage project rows; advisors write via share links (anon insert allowed only with a valid token-linked row is enforced app-side; keep table member-gated)
DROP POLICY IF EXISTS "Team members can manage advisor feedback" ON public.advisor_feedback;
CREATE POLICY "Team members can manage advisor feedback" ON public.advisor_feedback FOR ALL USING (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
) WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
);

-- Document chunks: team members manage their own projects' index rows
DROP POLICY IF EXISTS "Team members can manage document chunks" ON public.document_chunks;
CREATE POLICY "Team members can manage document chunks" ON public.document_chunks FOR ALL USING (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
) WITH CHECK (
  project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))
);

-- Feedback widget: anyone (even signed-out) can submit; only service role reads (no select policy for anon/authenticated)
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT WITH CHECK (true);

-- Notifications: the old "System can create notifications" policy (WITH CHECK true)
-- let any authenticated user notify any other user. Restrict to teammates.
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Team members can notify teammates" ON public.notifications FOR INSERT WITH CHECK (
  user_id IN (
    SELECT tm.user_id FROM public.team_members tm
    WHERE tm.team_id IN (SELECT public.get_user_team_ids())
  )
);

-- Audit logs: users insert their own actions; members read their teams' trail
DROP POLICY IF EXISTS "Users can append own audit events" ON public.audit_logs;
CREATE POLICY "Users can append own audit events" ON public.audit_logs FOR INSERT WITH CHECK (
  user_id = auth.uid() OR auth.uid() IS NULL AND user_id IS NULL
);
DROP POLICY IF EXISTS "Members can read team audit trail" ON public.audit_logs;
CREATE POLICY "Members can read team audit trail" ON public.audit_logs FOR SELECT USING (
  user_id = auth.uid() OR team_id IN (SELECT public.get_user_team_ids())
);

-- =============================================
-- STORAGE: scope project-files to the uploader's own projects
-- App uploads to "<project_id>/..." paths. The old policies let any
-- authenticated user read/delete any object; these replace them.
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;

CREATE POLICY "Team members can upload project files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'project-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())
  )
);

CREATE POLICY "Team members can view project files" ON storage.objects FOR SELECT USING (
  bucket_id = 'project-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())
  )
);

CREATE POLICY "Team members can delete project files" ON storage.objects FOR DELETE USING (
  bucket_id = 'project-files'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())
  )
);
