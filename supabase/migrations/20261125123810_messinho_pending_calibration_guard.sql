-- One open MESSINHO calibration per scout/player pair. Historical verified/rejected records remain intact.
create unique index if not exists asi_scout_calibration_one_pending_messinho_idx
  on public.asi_scout_calibration_records(player_id,scout_id,outcome_metric)
  where verification_status='pending'
    and outcome_metric='Leistungsniveau nach 12 Monaten (0-100)';
