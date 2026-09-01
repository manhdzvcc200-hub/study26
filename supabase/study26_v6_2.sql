-- Study26 V6.2 FULL migration: passwordless live rooms, teacher profiles, avatars.
begin;

alter table public.live_rooms add column if not exists join_code text;
alter table public.live_rooms add column if not exists access_mode text not null default 'public';
alter table public.live_rooms add column if not exists ended_at timestamptz;

update public.live_rooms
set access_mode='public'
where access_mode is null or access_mode <> 'public';

-- Existing rooms get codes when missing.
do $$
declare r record; candidate text;
begin
  for r in select id from public.live_rooms where join_code is null loop
    loop
      candidate := upper(substr(encode(gen_random_bytes(6),'hex'),1,8));
      exit when not exists(select 1 from public.live_rooms x where x.join_code=candidate);
    end loop;
    update public.live_rooms set join_code=candidate where id=r.id;
  end loop;
end $$;

create unique index if not exists live_rooms_join_code_uq on public.live_rooms(join_code) where join_code is not null;

create table if not exists public.teacher_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  headline text not null default '',
  education text not null default '',
  specialization text not null default '',
  experience_years integer not null default 0 check (experience_years between 0 and 80),
  schools text not null default '',
  achievements text not null default '',
  students_taught integer not null default 0 check (students_taught between 0 and 1000000),
  bio text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teacher_profiles enable row level security;
drop policy if exists teacher_profiles_select on public.teacher_profiles;
create policy teacher_profiles_select on public.teacher_profiles for select to authenticated using (true);
drop policy if exists teacher_profiles_insert_own on public.teacher_profiles;
create policy teacher_profiles_insert_own on public.teacher_profiles for insert to authenticated with check (user_id=auth.uid());
drop policy if exists teacher_profiles_update_own on public.teacher_profiles;
create policy teacher_profiles_update_own on public.teacher_profiles for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

insert into public.teacher_profiles(user_id)
select p.id from public.profiles p
where p.role in ('teacher','admin')
on conflict (user_id) do nothing;

-- Remove password data from all rooms because V6.2 is code-only.
do $$ begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='live_rooms' and column_name='room_password_hash') then
    update public.live_rooms set room_password_hash=null;
  end if;
end $$;

commit;
