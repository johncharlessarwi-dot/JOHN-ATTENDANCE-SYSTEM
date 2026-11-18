export type AccountRole = 'student' | 'lecturer' | 'class_rep' | 'administrator' | 'super_admin';
/** Never trust a stored super-admin claim unless the authenticated email is allowlisted. */
export function effectiveAccountRole(storedRole: unknown, authenticatedEmail: unknown, ownerEmails: readonly string[]): AccountRole {
  const owner = typeof authenticatedEmail === 'string' && Boolean(authenticatedEmail.trim()) && ownerEmails.some(email => typeof email === 'string' && email.trim().toLowerCase() === authenticatedEmail.trim().toLowerCase());
  if (owner) return 'super_admin';
  switch (storedRole) {
    case 'administrator':
    case 'lecturer':
    case 'class_rep':
      return storedRole;
    default:
      return 'student';
  }
}
