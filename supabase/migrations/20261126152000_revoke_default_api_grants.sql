-- Remove Supabase default table grants, then grant only intended API access.
revoke all on public.profiles, public.players, public.player_deletion_logs,
  public.support_tickets, public.support_ticket_messages,
  public.asi_external_sources, public.asi_scout_calibration_records,
  public.asi_prediction_records, public.asi_prediction_outcomes,
  public.asi_model_versions, public.asi_training_runs, public.asi_model_evaluations,
  public.asi_player_analyses, public.asi_research_runs, public.asi_external_evidence,
  public.asi_contract_snapshots, public.asi_evidence_reviews, public.asi_player_candidates,
  public.messinho_agent_memory, public.messinho_agent_traces, public.messinho_agent_tasks
from public, anon, authenticated;

-- Core application tables: RLS determines which authenticated rows can be accessed.
grant select on public.profiles to authenticated;
grant update (last_login_at,last_seen_at) on public.profiles to authenticated;
grant select,insert,update,delete on public.players to authenticated;
grant select,delete on public.player_deletion_logs to authenticated;

-- Admin/owner-scoped ASI APIs; their RLS policies remain the authorization boundary.
grant select,insert,update,delete on public.asi_research_runs to authenticated;
grant select,insert,update,delete on public.asi_external_evidence to authenticated;
grant select,insert,update,delete on public.asi_contract_snapshots to authenticated;
grant select,insert,update,delete on public.asi_evidence_reviews to authenticated;
grant select,insert,update on public.asi_player_candidates to authenticated;

-- Backend-only tables remain available exclusively to service_role.
grant all on public.support_tickets,public.support_ticket_messages,
  public.asi_external_sources,public.asi_scout_calibration_records,
  public.asi_prediction_records,public.asi_prediction_outcomes,
  public.asi_model_versions,public.asi_training_runs,public.asi_model_evaluations,
  public.asi_player_analyses,public.messinho_agent_memory,
  public.messinho_agent_traces,public.messinho_agent_tasks
to service_role;
