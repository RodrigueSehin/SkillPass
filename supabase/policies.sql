-- Row Level Security for SkillPass. Apply after `prisma migrate deploy`.
-- Prisma connects with a privileged role and bypasses RLS: services MUST also filter by profile_id.
-- These policies protect every access that goes through the Supabase API (anon / authenticated keys).

alter table profiles enable row level security;
create policy "own profile"        on profiles for all    using (auth.uid() = id) with check (auth.uid() = id);
create policy "public profiles"    on profiles for select using (is_public);

-- Owner-only tables (profile_id = auth.uid()).
do $$
declare t text;
begin
  foreach t in array array['talent_skills','projects','experiences','certifications','skill_evidence'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "owner full access" on %I for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id)', t);
    execute format('create policy "public read when profile is public" on %I for select using (exists (select 1 from profiles p where p.id = %I.profile_id and p.is_public))', t, t);
  end loop;
end $$;

-- Reference data: readable by everyone, writable only through the service role.
alter table skills enable row level security;
alter table skill_categories enable row level security;
alter table project_skills enable row level security;
create policy "skills readable" on skills for select using (true);
create policy "categories readable" on skill_categories for select using (true);
create policy "project skills readable" on project_skills for select using (true);

-- Storage: private bucket "evidence"; objects live under "<profile_id>/...".
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false) on conflict do nothing;
create policy "owner reads own evidence files" on storage.objects for select
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

-- Phase 3: verification tables are SERVER-ONLY. RLS is enabled with no policy on purpose:
-- the Supabase API (anon/authenticated keys) can read and write nothing here. All access goes
-- through the application, which checks ownership and roles.
--   assessment_attempts : answers and scores must not be forged or read in bulk.
--   credentials         : public verification is served by /verify, never by direct table reads.
--   recommendations     : rows hold single-use secret tokens.
alter table assessment_attempts enable row level security;
alter table credentials enable row level security;
alter table recommendations enable row level security;
