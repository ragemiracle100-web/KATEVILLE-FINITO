-- Enable RLS
alter table public.users enable row level security;
alter table public.students enable row level security;
alter table public.results enable row level security;
alter table public.payments enable row level security;
alter table public.teacher_reports enable row level security;

-- Users table (extends auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  name text not null,
  role text check (role in ('admin', 'teacher', 'parent')) not null,
  phone text,
  assigned_class text, -- for teachers
  subjects text[], -- for teachers
  children uuid[], -- for parents (student IDs)
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Students table
create table public.students (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  class text not null check (class in ('JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3')),
  parent_id uuid references public.users(id) not null,
  parent_name text not null,
  parent_email text not null,
  parent_phone text,
  created_at timestamp with time zone default now()
);

-- Results table
create table public.results (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) not null,
  student_name text not null,
  class text not null,
  term text not null check (term in ('First Term', 'Second Term', 'Third Term')),
  academic_year integer not null,
  teacher_id uuid references public.users(id) not null,
  teacher_name text not null,
  subjects jsonb not null, -- [{subject: "Math", score: 85}, ...]
  total_score integer,
  average_score integer,
  grade text,
  position integer,
  number_of_subjects integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(student_id, term, academic_year)
);

-- Payments table with secret fee tracking
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) not null,
  student_name text not null,
  parent_id uuid references public.users(id) not null,
  type text not null check (type in ('tuition', 'uniform', 'exam', 'transport', 'others')),
  
  -- Visible amounts (what parents see)
  school_fee integer not null, -- Base amount
  visible_total integer not null, -- school_fee + paystack_charge
  
  -- Actual split (internal accounting)
  actual_split jsonb not null, -- {transfers: {toSchool, toSecretAccount, paystackFee}}
  
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  reference text unique not null,
  term text,
  
  -- Paystack fields
  paystack_reference text,
  paid_at timestamp with time zone,
  
  -- Settlement details (shows secret fee as processing expense)
  settlement_details jsonb,
  
  created_at timestamp with time zone default now()
);

-- Receipts table
create table public.receipts (
  id uuid default gen_random_uuid() primary key,
  payment_id uuid references public.payments(id) not null,
  reference text unique not null,
  generated_at timestamp with time zone default now(),
  downloaded_at timestamp with time zone,
  download_count integer default 0,
  download_url text
);

-- Teacher reports table
create table public.teacher_reports (
  id uuid default gen_random_uuid() primary key,
  teacher_id uuid references public.users(id) not null,
  teacher_name text not null,
  student_id uuid references public.students(id) not null,
  student_name text not null,
  class text not null,
  type text check (type in ('weekly', 'term', 'behavior', 'recommendation')) not null,
  content text not null,
  term text,
  read_by_parent boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS Policies

-- Users: Only view own profile (except admins view all)
create policy "Users view own profile"
  on public.users for select
  using (auth.uid() = id or 
         exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Teachers view their assigned class students
create policy "Teachers view assigned class students"
  on public.students for select
  using (exists (select 1 from public.users 
                where id = auth.uid() 
                and role = 'teacher' 
                and assigned_class = students.class));

-- Parents view own children
create policy "Parents view own children"
  on public.students for select
  using (parent_id = auth.uid());

-- Results: Teachers view their class, parents view own child
create policy "Results access control"
  on public.results for select
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin') or
         teacher_id = auth.uid() or
         exists (select 1 from public.students 
                where id = results.student_id 
                and parent_id = auth.uid()));

-- Payments: Parents view own payments
create policy "Parents view own payments"
  on public.payments for select
  using (parent_id = auth.uid() or 
         exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Teacher reports: Teachers view own, parents view child's
create policy "Reports access control"
  on public.teacher_reports for select
  using (teacher_id = auth.uid() or
         exists (select 1 from public.students 
                where id = teacher_reports.student_id 
                and parent_id = auth.uid()));

-- Functions

-- Calculate class positions automatically
create or replace function calculate_positions(p_class text, p_term text, p_year integer)
returns void as $$
begin
  update results r
  set position = subq.position
  from (
    select id, row_number() over (order by average_score desc) as position
    from results
    where class = p_class and term = p_term and academic_year = p_year
  ) subq
  where r.id = subq.id;
end;
$$ language plpgsql;

-- Trigger to auto-calculate positions on result insert/update
create or replace function trigger_calculate_positions()
returns trigger as $$
begin
  perform calculate_positions(new.class, new.term, new.academic_year);
  return new;
end;
$$ language plpgsql;

create trigger on_result_change
  after insert or update on results
  for each row
  execute function trigger_calculate_positions();
