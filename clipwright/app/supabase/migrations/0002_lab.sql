-- Clipwright Lab: viral formats (text only) and production plans, private to each user.
-- Writes go through the server (service role); the browser can only read its own rows.

create table public.lab_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_link text,
  source_meta jsonb not null default '{}'::jsonb,
  analysis jsonb not null default '{}'::jsonb,   -- scene times, transcript, music (no frames, no video)
  template jsonb not null,
  plan jsonb,
  product_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lab_templates_user_created on public.lab_templates (user_id, created_at desc);

alter table public.lab_templates enable row level security;
create policy "read own lab templates" on public.lab_templates for select using (auth.uid() = user_id);

-- Private bucket for uploads (videos are deleted right after analysis; cleaned videos and product photos stay).
insert into storage.buckets (id, name, public) values ('lab', 'lab', false) on conflict (id) do nothing;
