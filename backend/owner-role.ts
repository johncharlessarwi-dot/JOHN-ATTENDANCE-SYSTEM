export type AccountRole = 'student' | 'lecturer' | 'class_rep' | 'administrator' | 'super_admin';
/** Never trust a stored super-admin claim unless the authenticated email is allowlisted. */
export function effectiveAccountRole(storedRole: AccountRole, authenticatedEmail: unknown, ownerEmails: readonly string[]): AccountRole {
  const owner = typeof authenticatedEmail === 'string' && ownerEmails.includes(authenticatedEmail.toLowerCase());
  if (owner) return 'super_admin';
  return storedRole === 'super_admin' ? 'student' : storedRole;
}
