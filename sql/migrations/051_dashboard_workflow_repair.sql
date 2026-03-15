BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority INTEGER NOT NULL DEFAULT 3,
  project TEXT NOT NULL DEFAULT 'plantcommerce',
  assigned_agent TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS project TEXT DEFAULT 'plantcommerce';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_agent TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE public.tasks
SET
  status = COALESCE(status, 'todo'),
  priority = COALESCE(priority, 3),
  project = COALESCE(NULLIF(project, ''), 'plantcommerce'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE status IS NULL
   OR priority IS NULL
   OR project IS NULL
   OR project = ''
   OR created_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE public.tasks ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE public.tasks ALTER COLUMN status SET DEFAULT 'todo';
ALTER TABLE public.tasks ALTER COLUMN priority SET DEFAULT 3;
ALTER TABLE public.tasks ALTER COLUMN project SET DEFAULT 'plantcommerce';
ALTER TABLE public.tasks ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE public.tasks ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent TEXT NOT NULL,
  project TEXT NOT NULL DEFAULT 'plantcommerce',
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  summary TEXT,
  context_snapshot JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS agent TEXT;
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS project TEXT DEFAULT 'plantcommerce';
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS task_id UUID;
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS context_snapshot JSONB;
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.agent_sessions ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

UPDATE public.agent_sessions
SET
  project = COALESCE(NULLIF(project, ''), 'plantcommerce'),
  status = COALESCE(status, 'active'),
  started_at = COALESCE(started_at, NOW()),
  last_seen_at = COALESCE(last_seen_at, started_at, NOW())
WHERE project IS NULL
   OR project = ''
   OR status IS NULL
   OR started_at IS NULL
   OR last_seen_at IS NULL;

ALTER TABLE public.agent_sessions ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE public.agent_sessions ALTER COLUMN project SET DEFAULT 'plantcommerce';
ALTER TABLE public.agent_sessions ALTER COLUMN status SET DEFAULT 'active';
ALTER TABLE public.agent_sessions ALTER COLUMN started_at SET DEFAULT NOW();
ALTER TABLE public.agent_sessions ALTER COLUMN last_seen_at SET DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_status_check'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_status_check
      CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tasks_priority_check'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_priority_check
      CHECK (priority BETWEEN 1 AND 4) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'agent_sessions_status_check'
      AND conrelid = 'public.agent_sessions'::regclass
  ) THEN
    ALTER TABLE public.agent_sessions
      ADD CONSTRAINT agent_sessions_status_check
      CHECK (status IN ('active', 'completed', 'dropped')) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'agent_sessions_task_id_fkey'
      AND conrelid = 'public.agent_sessions'::regclass
  ) THEN
    ALTER TABLE public.agent_sessions
      ADD CONSTRAINT agent_sessions_task_id_fkey
      FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_tasks_status_priority_created
  ON public.tasks (status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_project
  ON public.tasks (project);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_status_last_seen
  ON public.agent_sessions (status, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_started_at
  ON public.agent_sessions (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_task_id
  ON public.agent_sessions (task_id);

ALTER TABLE IF EXISTS public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regprocedure('public.update_updated_at()') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_trigger
       WHERE tgname = 'trg_tasks_updated'
         AND tgrelid = 'public.tasks'::regclass
     ) THEN
    CREATE TRIGGER trg_tasks_updated
      BEFORE UPDATE ON public.tasks
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at();
  END IF;
END;
$$;

COMMIT;
