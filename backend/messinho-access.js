/**
 * MESSINHO server-side ownership guard for service-role database queries.
 * The backend uses a privileged Supabase client, so every non-admin read must
 * be explicitly constrained to the authenticated user's owner_id.
 */
export function scopeMessinhoOwner(query, actor) {
  if (!actor || !actor.user?.id || !['admin','scout'].includes(actor.profile?.role)) {
    throw new Error('Authenticated MESSINHO actor required');
  }
  if (actor.profile.role === 'admin') return query;
  return query.eq('owner_id', actor.user.id);
}
