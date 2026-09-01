begin;

alter table public.live_rooms add column if not exists join_code text;
alter table public.live_rooms add column if not exists access_mode text not null default 'public';
alter table public.live_rooms add column if not exists ended_at timestamptz;

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
drop policy if exists study26_teacher_profiles_select on public.teacher_profiles;
create policy study26_teacher_profiles_select on public.teacher_profiles for select to authenticated using (true);
drop policy if exists study26_teacher_profiles_insert on public.teacher_profiles;
create policy study26_teacher_profiles_insert on public.teacher_profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists study26_teacher_profiles_update on public.teacher_profiles;
create policy study26_teacher_profiles_update on public.teacher_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

insert into public.teacher_profiles(user_id)
select id from public.profiles where role in ('teacher','admin')
on conflict (user_id) do nothing;

-- Return a complete teacher preview and automatically enroll a student in the class.
create or replace function public.study26_join_room(p_join_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room record;
  v_class record;
  v_profile record;
  v_teacher record;
  v_teacher_profile record;
begin
  if v_uid is null then
    return jsonb_build_object('ok',false,'status',401,'error','Bạn cần đăng nhập.');
  end if;

  select * into v_room from public.live_rooms where upper(join_code)=upper(trim(p_join_code)) limit 1;
  if not found then return jsonb_build_object('ok',false,'status',404,'error','Mã phòng không tồn tại.'); end if;
  if v_room.status = 'ended' then return jsonb_build_object('ok',false,'status',410,'error','Phòng học đã kết thúc.'); end if;

  select * into v_profile from public.profiles where id=v_uid;
  if coalesce(v_profile.suspended,false) then return jsonb_build_object('ok',false,'status',403,'error','Tài khoản đang bị khóa.'); end if;

  select * into v_class from public.classes where id=v_room.class_id;
  if not found then return jsonb_build_object('ok',false,'status',404,'error','Lớp học của phòng không còn tồn tại.'); end if;

  select * into v_teacher from public.profiles where id=v_room.created_by;
  select * into v_teacher_profile from public.teacher_profiles where user_id=v_room.created_by;

  if v_uid <> v_room.created_by and coalesce(v_profile.role,'student') <> 'admin' then
    if not exists(select 1 from public.class_members where class_id=v_room.class_id and student_id=v_uid) then
      insert into public.class_members(class_id,student_id) values(v_room.class_id,v_uid)
      on conflict do nothing;
    end if;
  end if;

  return jsonb_build_object(
    'ok',true,
    'roomId',v_room.id,
    'room',jsonb_build_object('id',v_room.id,'title',v_room.title,'joinCode',v_room.join_code,'classId',v_room.class_id,'className',v_class.name),
    'teacher',jsonb_build_object(
      'id',v_room.created_by,
      'fullName',coalesce(v_teacher.full_name,'Giáo viên Study26'),
      'avatarUrl',v_teacher.avatar_url,
      'verified',coalesce(v_teacher_profile.verified,false),
      'headline',coalesce(v_teacher_profile.headline,'Giáo viên Study26'),
      'education',nullif(v_teacher_profile.education,''),
      'specialization',nullif(v_teacher_profile.specialization,''),
      'experienceYears',coalesce(v_teacher_profile.experience_years,0),
      'schools',nullif(v_teacher_profile.schools,''),
      'achievements',nullif(v_teacher_profile.achievements,''),
      'studentsTaught',coalesce(v_teacher_profile.students_taught,0),
      'bio',nullif(v_teacher_profile.bio,'')
    )
  );
end;
$$;

create or replace function public.study26_get_room_access(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room record;
  v_profile record;
  v_role text;
  v_allowed boolean := false;
  v_teacher record;
  v_teacher_profile record;
begin
  if v_uid is null then return jsonb_build_object('ok',false,'status',401,'error','Bạn chưa đăng nhập.'); end if;
  select * into v_room from public.live_rooms where id=v_room_id;
  if not found then return jsonb_build_object('ok',false,'status',404,'error','Không tìm thấy phòng học.'); end if;
  if v_room.status='ended' then return jsonb_build_object('ok',false,'status',410,'error','Phòng học đã kết thúc.'); end if;
  select * into v_profile from public.profiles where id=v_uid;
  if coalesce(v_profile.suspended,false) then return jsonb_build_object('ok',false,'status',403,'error','Tài khoản đang bị khóa.'); end if;
  v_role := coalesce(v_profile.role,'student');
  v_allowed := v_uid=v_room.created_by or v_role='admin' or exists(select 1 from public.class_members where class_id=v_room.class_id and student_id=v_uid);
  if not v_allowed then return jsonb_build_object('ok',false,'status',403,'error','Hãy vào phòng bằng mã phòng trước.'); end if;

  select * into v_teacher from public.profiles where id=v_room.created_by;
  select * into v_teacher_profile from public.teacher_profiles where user_id=v_room.created_by;

  return jsonb_build_object(
    'ok',true,
    'title',v_room.title,
    'joinCode',v_room.join_code,
    'role',v_role,
    'isOwner',v_uid=v_room.created_by,
    'isAdmin',v_role='admin',
    'participantName',coalesce(v_profile.full_name,'') ,
    'teacher',jsonb_build_object('id',v_room.created_by,'fullName',coalesce(v_teacher.full_name,'Giáo viên Study26'),'avatarUrl',v_teacher.avatar_url,'verified',coalesce(v_teacher_profile.verified,false),'headline',coalesce(v_teacher_profile.headline,'Giáo viên Study26'))
  );
end;
$$;

revoke execute on function public.study26_join_room(text) from public;
revoke execute on function public.study26_get_room_access(uuid) from public;
grant execute on function public.study26_join_room(text) to authenticated;
grant execute on function public.study26_get_room_access(uuid) to authenticated;

commit;
