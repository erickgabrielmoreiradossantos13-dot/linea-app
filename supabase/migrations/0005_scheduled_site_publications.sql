-- Run scheduled site publications close to their requested time without
-- depending on the Vercel plan's cron frequency.

begin;

create extension if not exists pg_cron;

create or replace function public.run_due_site_publications()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  site record;
  published_count integer := 0;
begin
  -- publish_website_draft still enforces OWNER/ADMIN for user calls. This
  -- private worker adopts the service-role claim only for its transaction.
  perform set_config('request.jwt.claim.role', 'service_role', true);

  for site in
    select id
    from public.websites
    where status = 'ACTIVE'
      and publish_at is not null
      and publish_at <= now()
    order by publish_at
    limit 50
    for update skip locked
  loop
    perform public.publish_website_draft(site.id, true);
    published_count := published_count + 1;
  end loop;

  return published_count;
end;
$$;

revoke all on function public.run_due_site_publications() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'linea-site-publisher') then
    perform cron.schedule(
      'linea-site-publisher',
      '*/10 * * * *',
      'select public.run_due_site_publications();'
    );
  end if;
end
$$;

commit;
