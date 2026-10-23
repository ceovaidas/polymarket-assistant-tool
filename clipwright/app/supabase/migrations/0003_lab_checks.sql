-- Clipwright Lab: virality checks of the user's own videos (results only, the video is deleted).
create table public.lab_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text,
  duration numeric,
  result jsonb not null,
  created_at timestamptz not null default now()
);
create index lab_checks_user_created on public.lab_checks (user_id, created_at desc);
alter table public.lab_checks enable row level security;
create policy "read own lab checks" on public.lab_checks for select using (auth.uid() = user_id);
