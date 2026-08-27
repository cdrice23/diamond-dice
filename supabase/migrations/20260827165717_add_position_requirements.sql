create table position_requirements (
    id uuid primary key default gen_random_uuid(),
    slot_position text not null,
    requires_eligibility boolean not null default true,
    min_count int not null,
    max_count int not null,
    constraint position_requirements_slot_position_check
        check (slot_position in ('C', '1B', '2B', '3B', 'SS', 'OF', 'DH')),
    constraint position_requirements_slot_position_key unique (slot_position)
);

alter table position_requirements enable row level security;

create policy "position_requirements_select_all" on position_requirements
    for select to authenticated
    using (true);

insert into position_requirements (slot_position, requires_eligibility, min_count, max_count)
values
    ('C',   true,  1, 1),
    ('1B',  true,  1, 1),
    ('2B',  true,  1, 1),
    ('3B',  true,  1, 1),
    ('SS',  true,  1, 1),
    ('OF',  true,  3, 3),
    ('DH',  false, 1, 1);