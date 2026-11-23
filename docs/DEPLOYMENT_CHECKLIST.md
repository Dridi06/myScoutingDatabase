# Deployment Checklist

- Dedicated Supabase project myScoutingDatabase, separate from PFSS.
- Verify profiles, players, global sequence, indexes, RLS and policies.
- Configure frontend URL and publishable key; backend service-role key and JWT secret only as private environment variables.
- Test anonymous access denied; pending Scout denied; approved Scout sees own records only; Admin sees all.
- Test maximum 15 Scouts, duplicate username/email, global IDs, editing and deletion scope.
- Verify backups, rate limits, password reset, HTTPS, CORS origin and logs.
- Change initial Admin password after first login and rotate credentials if exposed.
