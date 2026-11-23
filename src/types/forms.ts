export type FormId =
  | 'login'
  | 'student-search'
  | 'student-registration'
  | 'edit-student'
  | 'course-registration'
  | 'course-admin'
  | 'event-registration'
  | 'event-admin'
  | 'advising'
  | 'support-request'
  | 'support-status'
  | 'accommodation-application'
  | 'accommodation-admin';

export interface FormVersionInfo {
  id: FormId;
  name: string;
  category: string;
  description: string;
  status: string;
  versionId: string;
  versionNumber: number;
  schema: object;
}

export interface StoredFormVersion {
  id: string;
  formId: string;
  versionNumber: number;
  schema: object;
  createdBy: string;
  createdAt: string;
}
