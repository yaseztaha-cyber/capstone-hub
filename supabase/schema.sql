-- STEM Capstone Hub — Run this to reset the database

-- Drop everything
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view teammates" ON public.profiles;
DROP POLICY IF EXISTS "Team members can view team" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Team leaders can update team" ON public.teams;
DROP POLICY IF EXISTS "Team members can view members" ON public.team_members;
DROP POLICY IF EXISTS "Team leaders can manage members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can join teams" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view project" ON public.projects;
DROP POLICY IF EXISTS "Team members can update project" ON public.projects;
DROP POLICY IF EXISTS "Team leaders can create project" ON public.projects;
DROP POLICY IF EXISTS "Team members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can view assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Team members can manage assignments" ON public.task_assignments;
DROP POLICY IF EXISTS "Team members can view milestones" ON public.milestones;
DROP POLICY IF EXISTS "Team members can manage milestones" ON public.milestones;
DROP POLICY IF EXISTS "Team members can view events" ON public.calendar_events;
DROP POLICY IF EXISTS "Team members can manage events" ON public.calendar_events;
DROP POLICY IF EXISTS "Team members can view files" ON public.files;
DROP POLICY IF EXISTS "Team members can upload files" ON public.files;
DROP POLICY IF EXISTS "Team members can update files" ON public.files;
DROP POLICY IF EXISTS "Team members can delete files" ON public.files;
DROP POLICY IF EXISTS "Team members can view rubrics" ON public.rubrics;
DROP POLICY IF EXISTS "Team members can manage rubrics" ON public.rubrics;
DROP POLICY IF EXISTS "Team members can view criteria" ON public.rubric_criteria;
DROP POLICY IF EXISTS "Team members can manage criteria" ON public.rubric_criteria;
DROP POLICY IF EXISTS "Team members can view logbook" ON public.logbook_entries;
DROP POLICY IF EXISTS "Team members can create logbook" ON public.logbook_entries;
DROP POLICY IF EXISTS "Team members can update logbook" ON public.logbook_entries;
DROP POLICY IF EXISTS "Team members can delete logbook" ON public.logbook_entries;
DROP POLICY IF EXISTS "Team members can view decisions" ON public.project_decisions;
DROP POLICY IF EXISTS "Team members can manage decisions" ON public.project_decisions;
DROP POLICY IF EXISTS "Team members can view issues" ON public.project_issues;
DROP POLICY IF EXISTS "Team members can manage issues" ON public.project_issues;
DROP POLICY IF EXISTS "Team members can view sources" ON public.research_sources;
DROP POLICY IF EXISTS "Team members can manage sources" ON public.research_sources;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Team members can view comments" ON public.comments;
DROP POLICY IF EXISTS "Team members can create comments" ON public.comments;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_user_team_ids();
DROP FUNCTION IF EXISTS public.is_team_member(uuid);

DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.research_sources CASCADE;
DROP TABLE IF EXISTS public.project_issues CASCADE;
DROP TABLE IF EXISTS public.project_decisions CASCADE;
DROP TABLE IF EXISTS public.logbook_entries CASCADE;
DROP TABLE IF EXISTS public.rubric_criteria CASCADE;
DROP TABLE IF EXISTS public.rubrics CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.milestones CASCADE;
DROP TABLE IF EXISTS public.task_assignments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Now create everything fresh
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  school text default '',
  grade text default '',
  avatar_url text,
  created_at timestamptz default now()
);

CREATE TABLE public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text not null unique,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

CREATE TABLE public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'team_leader', 'advisor')),
  custom_role text,
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);

CREATE TABLE public.projects (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references public.teams(id) on delete cascade unique,
  title text not null default 'Untitled Project',
  problem_statement text default '',
  grand_challenge text default '',
  scientific_principles text default '',
  engineering_objective text default '',
  expected_solution text default '',
  constraints text default '',
  important_materials text default '',
  initial_deadline timestamptz,
  concept text default '',
  school text default '',
  semester text default '',
  grade text default '',
  capstone_category text default '',
  current_stage text default 'research' check (current_stage in ('research','design','prototype','testing','analysis','documentation','presentation')),
  health text default 'on_track' check (health in ('on_track','needs_attention','at_risk')),
  health_reasons text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

CREATE TABLE public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text default '',
  created_date timestamptz default now(),
  official_deadline timestamptz,
  team_deadline timestamptz,
  status text default 'not_started' check (status in ('not_started','in_progress','waiting','blocked','submitted','completed')),
  priority text default 'normal' check (priority in ('low','normal','high','critical')),
  stage text default 'research' check (stage in ('research','design','prototype','testing','analysis','documentation','presentation')),
  rubric_criteria text[] default '{}',
  dependencies uuid[] default '{}',
  completion_date timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

CREATE TABLE public.task_assignments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unique(task_id, user_id)
);

CREATE TABLE public.milestones (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  official_deadline timestamptz not null,
  team_deadline timestamptz,
  stage text default 'research',
  is_completed boolean default false,
  completed_date timestamptz,
  created_at timestamptz default now()
);

CREATE TABLE public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  date timestamptz not null,
  end_date timestamptz,
  type text default 'other' check (type in ('milestone','task','meeting','deadline','other')),
  task_id uuid,
  milestone_id uuid,
  color text,
  created_at timestamptz default now()
);

CREATE TABLE public.files (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  category text default 'other' check (category in ('research','design','prototype','testing','data','portfolio','poster','logbook','references','other')),
  storage_path text,
  mime_type text default '',
  size bigint default 0,
  version int default 1,
  linked_task_id uuid,
  linked_project_section text,
  linked_rubric_criteria text[] default '{}',
  uploader_id uuid references auth.users(id),
  upload_date timestamptz default now()
);

CREATE TABLE public.rubrics (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade unique,
  name text not null default 'Capstone Rubric',
  created_at timestamptz default now()
);

CREATE TABLE public.rubric_criteria (
  id uuid primary key default uuid_generate_v4(),
  rubric_id uuid not null references public.rubrics(id) on delete cascade,
  name text not null,
  description text default '',
  status text default 'missing' check (status in ('complete','partial','missing')),
  section text default '',
  missing_info text[] default '{}',
  related_tasks uuid[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);

CREATE TABLE public.logbook_entries (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  student_id uuid not null references auth.users(id),
  activity text not null,
  stage text default 'research' check (stage in ('research','design','prototype','testing','analysis','documentation','presentation')),
  what_was_done text default '',
  why_it_was_done text default '',
  result text default '',
  problems_encountered text default '',
  next_step text default '',
  evidence text[] default '{}',
  is_automatic boolean default false,
  linked_task_id uuid,
  date timestamptz default now(),
  created_at timestamptz default now()
);

CREATE TABLE public.project_decisions (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  decision text not null,
  date timestamptz default now(),
  decision_makers text[] default '{}',
  reason text default '',
  alternatives_considered text[] default '{}',
  why_alternatives_rejected text default '',
  created_at timestamptz default now()
);

CREATE TABLE public.project_issues (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text default '',
  category text default 'other' check (category in ('deadline','materials','technical','team','mentor','documentation','prototype','research','other')),
  severity text default 'medium' check (severity in ('low','medium','high','critical')),
  status text default 'open' check (status in ('open','in_progress','resolved')),
  responsible_person text,
  related_task_id uuid,
  resolution text default '',
  evidence text[] default '{}',
  date timestamptz default now(),
  created_at timestamptz default now()
);

CREATE TABLE public.research_sources (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  authors text default '',
  year text default '',
  url text default '',
  source_type text default '',
  notes text default '',
  project_section text default '',
  relevant_concept text default '',
  tags text[] default '{}',
  apa_citation text default '',
  created_at timestamptz default now()
);

CREATE TABLE public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text default '',
  type text default 'info',
  read boolean default false,
  link text,
  created_at timestamptz default now()
);

CREATE TABLE public.comments (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  content text not null,
  created_at timestamptz default now()
);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.get_user_team_ids()
RETURNS setof uuid AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid uuid)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.team_members WHERE team_id = team_uuid AND user_id = auth.uid()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can view teammates" ON public.profiles FOR SELECT USING (
  id IN (SELECT user_id FROM public.team_members WHERE team_id IN (SELECT public.get_user_team_ids()))
);
CREATE POLICY "Team members can view team" ON public.teams FOR SELECT USING (id IN (SELECT public.get_user_team_ids()));
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Team leaders can update team" ON public.teams FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.team_members WHERE team_id = id AND user_id = auth.uid() AND role = 'team_leader')
);
CREATE POLICY "Team members can view members" ON public.team_members FOR SELECT USING (team_id IN (SELECT public.get_user_team_ids()));
CREATE POLICY "Team leaders can manage members" ON public.team_members FOR ALL USING (
  EXISTS(SELECT 1 FROM public.team_members WHERE team_id = team_members.team_id AND user_id = auth.uid() AND role = 'team_leader')
);
CREATE POLICY "Authenticated users can join teams" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team members can view project" ON public.projects FOR SELECT USING (team_id IN (SELECT public.get_user_team_ids()));
CREATE POLICY "Team members can update project" ON public.projects FOR UPDATE USING (team_id IN (SELECT public.get_user_team_ids()));
CREATE POLICY "Team leaders can create project" ON public.projects FOR INSERT WITH CHECK (team_id IN (SELECT public.get_user_team_ids()));
CREATE POLICY "Team members can view tasks" ON public.tasks FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can create tasks" ON public.tasks FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can update tasks" ON public.tasks FOR UPDATE USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can delete tasks" ON public.tasks FOR DELETE USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can view assignments" ON public.task_assignments FOR SELECT USING (task_id IN (SELECT id FROM public.tasks WHERE project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))));
CREATE POLICY "Team members can manage assignments" ON public.task_assignments FOR ALL USING (task_id IN (SELECT id FROM public.tasks WHERE project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))));
CREATE POLICY "Team members can view milestones" ON public.milestones FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can manage milestones" ON public.milestones FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can view events" ON public.calendar_events FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can manage events" ON public.calendar_events FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can view files" ON public.files FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can upload files" ON public.files FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can update files" ON public.files FOR UPDATE USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can delete files" ON public.files FOR DELETE USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can view rubrics" ON public.rubrics FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can manage rubrics" ON public.rubrics FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can view criteria" ON public.rubric_criteria FOR SELECT USING (rubric_id IN (SELECT id FROM public.rubrics WHERE project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))));
CREATE POLICY "Team members can manage criteria" ON public.rubric_criteria FOR ALL USING (rubric_id IN (SELECT id FROM public.rubrics WHERE project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids()))));
CREATE POLICY "Team members can view logbook" ON public.logbook_entries FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can create logbook" ON public.logbook_entries FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can update logbook" ON public.logbook_entries FOR UPDATE USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can delete logbook" ON public.logbook_entries FOR DELETE USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can view decisions" ON public.project_decisions FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can manage decisions" ON public.project_decisions FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can view issues" ON public.project_issues FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can manage issues" ON public.project_issues FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can view sources" ON public.research_sources FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Team members can manage sources" ON public.research_sources FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())));
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Team members can view comments" ON public.comments FOR SELECT USING (
  task_id IN (SELECT id FROM public.tasks WHERE project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())))
);
CREATE POLICY "Team members can create comments" ON public.comments FOR INSERT WITH CHECK (
  task_id IN (SELECT id FROM public.tasks WHERE project_id IN (SELECT id FROM public.projects WHERE team_id IN (SELECT public.get_user_team_ids())))
);

-- Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can view" ON storage.objects FOR SELECT USING (bucket_id = 'project-files' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete" ON storage.objects FOR DELETE USING (bucket_id = 'project-files' AND auth.uid() IS NOT NULL);
