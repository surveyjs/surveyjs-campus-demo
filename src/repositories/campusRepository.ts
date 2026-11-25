import {
  AdvisingMeeting,
  CampusEvent,
  Course,
  Residence,
  Department,
  Programme,
  StaffMember,
  Student,
  StudentProfile,
  SupportRequest,
} from '../types/campus';
import { Session } from '../types/auth';
import { FormId } from '../types/forms';
import { api } from './api';
import { formRepository } from './formRepository';
import {
  advisingFromSurvey,
  courseFromSurvey,
  courseRegistrationFromSurvey,
  allocationFromSurvey,
  eventFromSurvey,
  eventRegistrationFromSurvey,
  residenceFromSurvey,
  studentFromSurvey,
  Submission,
  supportFromSurvey,
  supportUpdateFromSurvey,
} from './surveyMapping';

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((listener) => listener());
}

function envelope<T>(formId: FormId, data: Record<string, unknown>, record: T): Submission<T> {
  return { record, response: data, formVersionId: formRepository.getVersionId(formId) };
}

async function submit<T>(path: string, method: string, body: unknown): Promise<T> {
  const result = await api<T>(path, { method, body: JSON.stringify(body) });
  notify();
  return result;
}

export const campusRepository = {
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  resetDemo: () => api<Session>('/admin/reset', { method: 'POST' }),

  students(query?: { name?: string; surname?: string; dateOfBirth?: string; studentNumber?: string }) {
    const params = new URLSearchParams();
    if (query?.name) params.set('name', query.name);
    if (query?.surname) params.set('surname', query.surname);
    if (query?.dateOfBirth) params.set('dateOfBirth', query.dateOfBirth);
    if (query?.studentNumber) params.set('studentNumber', query.studentNumber);
    const queryString = params.toString();
    return api<Student[]>(`/students${queryString ? `?${queryString}` : ''}`);
  },
  student(id: string, filter?: { status?: string; requestType?: string }) {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.requestType) params.set('requestType', filter.requestType);
    const queryString = params.toString();
    return api<StudentProfile>(`/students/${id}${queryString ? `?${queryString}` : ''}`);
  },
  programmes: () => api<Programme[]>('/programmes'),
  departments: () => api<Department[]>('/departments'),
  courses: () => api<Course[]>('/courses'),
  course: (id: string) => api<Course>(`/courses/${id}`),
  events: () => api<CampusEvent[]>('/events'),
  event: (id: string) => api<CampusEvent>(`/events/${id}`),
  staff: () => api<StaffMember[]>('/staff'),

  registerStudent: (data: Record<string, unknown>) =>
    submit<StudentProfile>('/students', 'POST', envelope('student-registration', data, studentFromSurvey(data))),
  updateStudent: (id: string, data: Record<string, unknown>) =>
    submit<StudentProfile>(`/students/${id}`, 'PUT', envelope('edit-student', data, studentFromSurvey(data))),
  deleteStudent: (id: string) => submit<void>(`/students/${id}`, 'DELETE', undefined),

  saveCourse: (data: Record<string, unknown>, courseId?: string) =>
    submit<Course>(courseId ? `/courses/${courseId}` : '/courses', courseId ? 'PUT' : 'POST', envelope('course-admin', data, courseFromSurvey(data))),
  registerForCourse: (courseId: string, data: Record<string, unknown>) =>
    submit<Course>(
      `/courses/${courseId}/registrations`,
      'POST',
      envelope('course-registration', data, courseRegistrationFromSurvey(data)),
    ),

  saveEvent: (data: Record<string, unknown>, eventId?: string) =>
    submit<CampusEvent>(eventId ? `/events/${eventId}` : '/events', eventId ? 'PUT' : 'POST', envelope('event-admin', data, eventFromSurvey(data))),
  registerForEvent: (eventId: string, data: Record<string, unknown>) =>
    submit<CampusEvent>(
      `/events/${eventId}/registrations`,
      'POST',
      envelope('event-registration', data, eventRegistrationFromSurvey(data)),
    ),

  residences: () => api<Residence[]>('/residences'),
  residence: (id: string) => api<Residence>(`/residences/${id}`),
  saveResidence: (data: Record<string, unknown>, residenceId?: string) =>
    submit<Residence>(
      residenceId ? `/residences/${residenceId}` : '/residences',
      residenceId ? 'PUT' : 'POST',
      envelope('accommodation-admin', data, residenceFromSurvey(data)),
    ),
  allocateResidence: (residenceId: string, data: Record<string, unknown>) =>
    submit<Residence>(
      `/residences/${residenceId}/allocations`,
      'POST',
      envelope('accommodation-application', data, allocationFromSurvey(data)),
    ),

  saveAdvising: (studentId: string, data: Record<string, unknown>, meetingId?: string) =>
    submit<AdvisingMeeting[]>(
      meetingId ? `/advising/${meetingId}` : `/students/${studentId}/advising`,
      meetingId ? 'PUT' : 'POST',
      { ...envelope('advising', data, advisingFromSurvey(data)), studentId },
    ),
  saveSupport: (studentId: string, data: Record<string, unknown>) =>
    submit<SupportRequest>(`/students/${studentId}/support-requests`, 'POST', envelope('support-request', data, supportFromSurvey(data))),
  updateSupport: (requestId: string, data: Record<string, unknown>) =>
    submit<SupportRequest>(`/support-requests/${requestId}`, 'PUT', envelope('support-status', data, supportUpdateFromSurvey(data))),
};
