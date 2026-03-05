-- V3 Premium Features Migration

-- Table: public.leases
create table if not exists public.leases (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    contract_text text not null,
    signature_url text,
    signed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.inspections
create table if not exists public.inspections (
    id uuid default gen_random_uuid() primary key,
    room_id uuid references public.rooms(id) on delete cascade not null,
    tenant_id uuid references public.tenants(id) on delete cascade not null,
    type text not null check (type in ('move_in', 'move_out')),
    items_json jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.announcements
create table if not exists public.announcements (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: public.expenses
create table if not exists public.expenses (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    amount numeric not null,
    date date not null,
    category text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Update public.bills
alter table public.bills 
add column if not exists slip_url text,
add column if not exists slip_status text check (slip_status in ('pending', 'verified', 'rejected')),
add column if not exists slip_uploaded_at timestamp with time zone;

-- Enable RLS
alter table public.leases enable row level security;
alter table public.inspections enable row level security;
alter table public.announcements enable row level security;
alter table public.expenses enable row level security;

-- Setup Policies --

-- Leases Policies
create policy "Owners can view all leases" on public.leases for select using (
    exists (select 1 from public.rooms where id = leases.room_id and user_id = auth.uid())
);
create policy "Owners can create leases" on public.leases for insert with check (
    exists (select 1 from public.rooms where id = room_id and user_id = auth.uid())
);
create policy "Owners can update leases" on public.leases for update using (
    exists (select 1 from public.rooms where id = leases.room_id and user_id = auth.uid())
);
create policy "Anyone can insert leases via EDGE function (Or tenant)" on public.leases for update using (true); -- For tenant signing

-- Inspections Policies
create policy "Owners can view all inspections" on public.inspections for select using (
    exists (select 1 from public.rooms where id = inspections.room_id and user_id = auth.uid())
);
create policy "Owners can create inspections" on public.inspections for insert with check (
    exists (select 1 from public.rooms where id = room_id and user_id = auth.uid())
);
create policy "Anyone can insert inspections" on public.inspections for insert with check (true); -- For tenant submitting
create policy "Owners can update inspections" on public.inspections for update using (
    exists (select 1 from public.rooms where id = inspections.room_id and user_id = auth.uid())
);

-- Announcements Policies
create policy "Owners can view own announcements" on public.announcements for select using (auth.uid() = user_id);
create policy "Owners can create announcements" on public.announcements for insert with check (auth.uid() = user_id);
create policy "Owners can delete own announcements" on public.announcements for delete using (auth.uid() = user_id);
create policy "Public can view announcements" on public.announcements for select using (true);

-- Expenses Policies
create policy "Owners can view own expenses" on public.expenses for select using (auth.uid() = user_id);
create policy "Owners can create expenses" on public.expenses for insert with check (auth.uid() = user_id);
create policy "Owners can update own expenses" on public.expenses for update using (auth.uid() = user_id);
create policy "Owners can delete own expenses" on public.expenses for delete using (auth.uid() = user_id);

-- Storage Buckets Configuration
insert into storage.buckets (id, name, public) values ('slips', 'slips', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('signatures', 'signatures', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('inspection-photos', 'inspection-photos', true) on conflict do nothing;

create policy "Public Access"
    on storage.objects for select
    using ( bucket_id in ('slips', 'signatures', 'inspection-photos') );

create policy "Anyone can upload"
    on storage.objects for insert
    with check ( bucket_id in ('slips', 'signatures', 'inspection-photos') );

create policy "Owners can update files"
    on storage.objects for update
    using ( bucket_id in ('slips', 'signatures', 'inspection-photos') );

create policy "Owners can delete files"
    on storage.objects for delete
    using ( bucket_id in ('slips', 'signatures', 'inspection-photos') );
