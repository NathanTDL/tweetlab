-- Create a table to store global platform statistics
create table platform_stats (
  id bigint primary key generated always as identity,
  key text unique not null,
  value bigint default 0
);

-- Insert the initial counter for total simulations
insert into platform_stats (key, value)
values ('total_simulations', 0);

-- Create a stored procedure to safely increment the counter (concurrency safe)
create or replace function increment_stat(stat_key text)
returns void as $$
begin
  update platform_stats
  set value = value + 1
  where key = stat_key;
end;
$$ language plpgsql;
