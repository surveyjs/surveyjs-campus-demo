import { FormId } from '../types/forms';
import login from './schemas/login.json';
import studentSearch from './schemas/student-search.json';
import studentRegistration from './schemas/student-registration.json';
import editStudent from './schemas/edit-student.json';
import courseRegistration from './schemas/course-registration.json';
import courseAdmin from './schemas/course-admin.json';
import eventRegistration from './schemas/event-registration.json';
import eventAdmin from './schemas/event-admin.json';
import advising from './schemas/advising.json';
import supportRequest from './schemas/support-request.json';
import supportStatus from './schemas/support-status.json';
import accommodationApplication from './schemas/accommodation-application.json';
import accommodationAdmin from './schemas/accommodation-admin.json';

export interface FormCatalogEntry {
  id: FormId;
  name: string;
  category: string;
  description: string;
  schema: object;
}

export const FORM_CATALOG: FormCatalogEntry[] = [
  {
    id: 'login',
    name: 'Sign In',
    category: 'Authentication',
    description: 'Sign-in form with the demo roster.',
    schema: login,
  },
  {
    id: 'student-search',
    name: 'Student Search',
    category: 'Student Search',
    description: 'Search students by name, date of birth, or student ID.',
    schema: studentSearch,
  },
  {
    id: 'student-registration',
    name: 'Student Registration',
    category: 'Student Registration',
    description: 'Register a new student.',
    schema: studentRegistration,
  },
  {
    id: 'edit-student',
    name: 'Edit Student',
    category: 'Student Registration',
    description: 'Update an existing student record.',
    schema: editStudent,
  },
  {
    id: 'course-registration',
    name: 'Course Registration',
    category: 'Course Registration',
    description: 'Register a student for a course.',
    schema: courseRegistration,
  },
  {
    id: 'course-admin',
    name: 'Course Administration',
    category: 'Course Registration',
    description: 'Create or edit a course.',
    schema: courseAdmin,
  },
  {
    id: 'event-registration',
    name: 'Event Registration',
    category: 'Event Registration',
    description: 'Register a student for a campus event.',
    schema: eventRegistration,
  },
  {
    id: 'event-admin',
    name: 'Event Administration',
    category: 'Event Registration',
    description: 'Create or edit a campus event.',
    schema: eventAdmin,
  },
  {
    id: 'advising',
    name: 'Academic Advising',
    category: 'Academic Advising',
    description: 'Record an academic advising meeting.',
    schema: advising,
  },
  {
    id: 'support-request',
    name: 'Student Support Request',
    category: 'Student Support',
    description: 'Create a student support request.',
    schema: supportRequest,
  },
  {
    id: 'support-status',
    name: 'Support Request Status',
    category: 'Student Support',
    description: 'Update the status of a support request.',
    schema: supportStatus,
  },
  {
    id: 'accommodation-application',
    name: 'Hall Application',
    category: 'Accommodation',
    description: 'Request a place in a hall of residence.',
    schema: accommodationApplication,
  },
  {
    id: 'accommodation-admin',
    name: 'Hall Administration',
    category: 'Accommodation',
    description: 'Create or edit a hall of residence.',
    schema: accommodationAdmin,
  },
];

export const FORM_IDS = new Set<string>(FORM_CATALOG.map((entry) => entry.id));
