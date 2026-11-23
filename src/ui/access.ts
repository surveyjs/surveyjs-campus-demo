import { UserRole } from '../types/auth';

export const canEditStudents = (role: UserRole) => role === 'administrator';
export const canRegisterCourses = (role: UserRole) => role === 'administrator' || role === 'academic';
export const canAdvise = (role: UserRole) => role === 'administrator' || role === 'academic';
export const canUpdateSupport = (role: UserRole) => role === 'administrator' || role === 'support';
export const canRegisterEvents = (role: UserRole) => role === 'administrator' || role === 'academic' || role === 'student';
export const canManageCatalog = (role: UserRole) => role === 'administrator';
export const homePath = (role: UserRole) => (role === 'student' ? '/portal' : '/manage');
