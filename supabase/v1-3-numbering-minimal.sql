create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

alter table public.applications
  add column if not exists member_no text,
  add column if not exists member_no_issued_at timestamptz,
  add column if not exists member_no_issued_by text,
  add column if not exists application_no_scheme text;

create unique index if not exists applications_member_no_unique_idx
  on public.applications (member_no)
  where member_no is not null;

create index if not exists applications_member_lookup_idx
  on public.applications (member_no, name)
  where member_no is not null;

create index if not exists applications_application_no_scheme_idx
  on public.applications (application_no_scheme);

create table if not exists public.numbering_sequences (
  id uuid primary key default gen_random_uuid(),
  sequence_key text not null unique,
  prefix text not null,
  year integer not null,
  current_value bigint not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint numbering_sequences_year_check check (year >= 2000 and year <= 2100),
  constraint numbering_sequences_current_value_check check (current_value >= 0)
);

create index if not exists numbering_sequences_year_prefix_idx
  on public.numbering_sequences (year, prefix);

drop trigger if exists numbering_sequences_set_updated_at on public.numbering_sequences;

create trigger numbering_sequences_set_updated_at
before update on public.numbering_sequences
for each row
execute function public.set_updated_at();

create or replace function public.next_numbering_sequence(
  p_sequence_key text,
  p_prefix text,
  p_year integer
)
returns bigint
language plpgsql
as $$
declare
  next_value bigint;
begin
  if p_sequence_key is null or length(trim(p_sequence_key)) = 0 then
    raise exception 'sequence_key is required';
  end if;

  if p_prefix is null or length(trim(p_prefix)) = 0 then
    raise exception 'prefix is required';
  end if;

  if p_year < 2000 or p_year > 2100 then
    raise exception 'year is out of supported range';
  end if;

  insert into public.numbering_sequences (sequence_key, prefix, year, current_value)
  values (p_sequence_key, p_prefix, p_year, 1)
  on conflict (sequence_key)
  do update set
    prefix = excluded.prefix,
    year = excluded.year,
    current_value = public.numbering_sequences.current_value + 1,
    updated_at = now()
  returning current_value into next_value;

  return next_value;
end;
$$;

create or replace function public.generate_itca_number(
  p_sequence_key text,
  p_prefix text,
  p_year integer
)
returns text
language plpgsql
as $$
declare
  next_value bigint;
begin
  next_value := public.next_numbering_sequence(p_sequence_key, p_prefix, p_year);
  return p_prefix || '-' || p_year::text || '-' || lpad(next_value::text, 6, '0');
end;
$$;
