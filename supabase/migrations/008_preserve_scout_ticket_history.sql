alter table public.support_tickets drop constraint if exists support_tickets_scout_id_fkey;
alter table public.support_tickets
  add constraint support_tickets_scout_id_fkey
  foreign key (scout_id) references public.profiles(id) on delete restrict;
