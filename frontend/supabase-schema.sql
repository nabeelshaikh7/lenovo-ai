-- Ensure required extension for gen_random_uuid
create extension if not exists pgcrypto;

-- Create resumes table
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'My Resume',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index on user_id for faster queries
create index if not exists resumes_user_id_idx on public.resumes(user_id);

-- Create index on updated_at for sorting
create index if not exists resumes_updated_at_idx on public.resumes(updated_at desc);

-- Enable Row Level Security (RLS)
alter table public.resumes enable row level security;

-- Policies: users can only access their own rows
drop policy if exists "resumes_select_own" on public.resumes;
create policy "resumes_select_own" on public.resumes
  for select using (auth.uid() = user_id);

drop policy if exists "resumes_insert_own" on public.resumes;
create policy "resumes_insert_own" on public.resumes
  for insert with check (auth.uid() = user_id);

drop policy if exists "resumes_update_own" on public.resumes;
create policy "resumes_update_own" on public.resumes
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "resumes_delete_own" on public.resumes;
create policy "resumes_delete_own" on public.resumes
  for delete using (auth.uid() = user_id);

-- Trigger to automatically update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_resumes_updated_at on public.resumes;
create trigger update_resumes_updated_at
  before update on public.resumes
  for each row
  execute function public.update_updated_at_column();
