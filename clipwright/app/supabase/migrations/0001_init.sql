-- Clipwright: users, credit ledger and generation jobs.
-- Clients may only READ their own rows. Every write goes through the server
-- (service role) and the functions below, so balances cannot be edited from the browser.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  credits integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now()
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  model text not null,
  params jsonb not null default '{}'::jsonb,
  seconds integer not null,
  cost integer not null check (cost >= 0),
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'failed')),
  provider_task_id text unique,
  result_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_user_created on public.jobs (user_id, created_at desc);

create table public.credit_ledger (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null check (reason in ('signup_bonus', 'purchase', 'generation', 'refund', 'admin')),
  job_id uuid references public.jobs (id) on delete set null,
  stripe_session_id text unique,          -- one credit grant per paid checkout
  created_at timestamptz not null default now()
);
create index credit_ledger_user_created on public.credit_ledger (user_id, created_at desc);
create unique index credit_ledger_one_refund_per_job on public.credit_ledger (job_id) where reason = 'refund';
create unique index credit_ledger_one_charge_per_job on public.credit_ledger (job_id) where reason = 'generation';

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.credit_ledger enable row level security;

create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "read own jobs" on public.jobs for select using (auth.uid() = user_id);
create policy "read own ledger" on public.credit_ledger for select using (auth.uid() = user_id);

-- New account: profile + free starter credits.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, credits) values (new.id, new.email, 50);
  insert into public.credit_ledger (user_id, delta, reason) values (new.id, 50, 'signup_bonus');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Take credits for a job. Atomic: fails without changing anything if the balance is too low.
create or replace function public.spend_credits(p_user uuid, p_cost integer, p_job uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if p_cost < 0 then raise exception 'invalid_cost'; end if;
  update public.profiles set credits = credits - p_cost
    where id = p_user and credits >= p_cost
    returning credits into new_balance;
  if new_balance is null then raise exception 'insufficient_credits'; end if;
  insert into public.credit_ledger (user_id, delta, reason, job_id) values (p_user, -p_cost, 'generation', p_job);
  return new_balance;
end $$;

-- Give credits (purchase, refund, admin). The unique indexes make purchases and refunds idempotent:
-- a repeated Stripe webhook or a second failure callback does nothing.
create or replace function public.add_credits(p_user uuid, p_amount integer, p_reason text, p_job uuid default null, p_session text default null)
returns integer language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  if p_amount <= 0 then raise exception 'invalid_amount'; end if;
  begin
    insert into public.credit_ledger (user_id, delta, reason, job_id, stripe_session_id)
      values (p_user, p_amount, p_reason, p_job, p_session);
  exception when unique_violation then
    select credits into new_balance from public.profiles where id = p_user;
    return new_balance;  -- already granted
  end;
  update public.profiles set credits = credits + p_amount where id = p_user returning credits into new_balance;
  return new_balance;
end $$;

revoke all on function public.spend_credits(uuid, integer, uuid) from public, anon, authenticated;
revoke all on function public.add_credits(uuid, integer, text, uuid, text) from public, anon, authenticated;
grant execute on function public.spend_credits(uuid, integer, uuid) to service_role;
grant execute on function public.add_credits(uuid, integer, text, uuid, text) to service_role;
