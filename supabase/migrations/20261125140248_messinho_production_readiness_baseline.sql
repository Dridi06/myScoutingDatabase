-- MESSINHO production-readiness baseline and truthful learning-run states.
-- The active model is a deterministic code baseline, not a trained model.
alter table public.asi_training_runs
  drop constraint if exists asi_training_runs_status_check;

alter table public.asi_training_runs
  add constraint asi_training_runs_status_check
  check (status = any (array['queued','running','succeeded','failed','rejected','insufficient_data']::text[]));

do $$
begin
  if not exists (
    select 1 from public.asi_model_versions
    where model_key='messinho_position_weights' and version='1.1.0'
  ) then
    update public.asi_model_versions
      set status='retired'
      where model_key='messinho_position_weights' and status='active';

    insert into public.asi_model_versions
      (model_key,version,model_family,status,metrics,configuration)
    values
      (
        'messinho_position_weights',
        '1.1.0',
        'deterministic_rules',
        'active',
        jsonb_build_object(
          'baseline_type','code_default',
          'trained',false,
          'engine_version','1.1.0',
          'note','Initial deterministic baseline; no verified outcome training data has been used.'
        ),
        jsonb_build_object(
          'engine_version','1.1.0',
          'learning_version','1.1.0',
          'profiles',jsonb_build_object(
            'goalkeeper',jsonb_build_object('technical',0.25,'tactical',0.20,'athletic',0.20,'goalkeeping',0.35),
            'centreBack',jsonb_build_object('technical',0.20,'tactical',0.35,'athletic',0.25,'mental',0.20),
            'fullBack',jsonb_build_object('technical',0.25,'tactical',0.25,'athletic',0.30,'mental',0.20),
            'defensiveMidfield',jsonb_build_object('technical',0.25,'tactical',0.35,'athletic',0.20,'mental',0.20),
            'centralMidfield',jsonb_build_object('technical',0.30,'tactical',0.30,'athletic',0.20,'mental',0.20),
            'attackingMidfield',jsonb_build_object('technical',0.35,'tactical',0.30,'athletic',0.15,'mental',0.20),
            'winger',jsonb_build_object('technical',0.35,'tactical',0.20,'athletic',0.30,'mental',0.15),
            'striker',jsonb_build_object('technical',0.30,'tactical',0.25,'athletic',0.25,'mental',0.20),
            'default',jsonb_build_object('technical',0.30,'tactical',0.30,'athletic',0.25,'mental',0.15)
          )
        )
      );
  end if;
end $$;
