export type AppRole = 'student' | 'coach' | 'staff_admin' | 'registrar' | 'superadmin' | 'facility_requester';

export const ROLE_HOME: Record<AppRole, string> = {
  student: '/dashboard',
  coach: '/coach/dashboard',
  staff_admin: '/staff-admin/dashboard',
  registrar: '/registrar/dashboard',
  superadmin: '/superadmin/dashboard',
  facility_requester: '/facility-reservation',
};

export const PRIVILEGED_ROLES: AppRole[] = ['staff_admin', 'registrar', 'superadmin'];

export function isPrivilegedRole(role: string | undefined | null): boolean {
  return !!role && PRIVILEGED_ROLES.includes(role as AppRole);
}