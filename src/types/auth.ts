export type UserRole = 'administrator' | 'academic' | 'support' | 'student';

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
}

export interface Session extends AuthUser {
  token: string;
}

export interface RosterEntry {
  username: string;
  fullName: string;
  role: UserRole;
  label: string;
}
