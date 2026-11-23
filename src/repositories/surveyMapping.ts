import {
  AdvisingInput,
  CourseInput,
  CourseRegistrationInput,
  EventInput,
  EventRegistrationInput,
  StudentInput,
  SupportInput,
  SupportUpdateInput,
} from '../types/campus';

function text(value: unknown): string {
  return String(value ?? '').trim();
}

function checked(value: unknown): boolean {
  return value === true || value === 'true' || value === 'yes';
}

export function studentFromSurvey(data: Record<string, unknown>): StudentInput {
  return {
    firstName: text(data.first_name),
    lastName: text(data.last_name),
    dateOfBirth: text(data.date_of_birth),
    studentNumber: text(data.student_number),
    programmeId: text(data.programme_id),
    departmentId: text(data.department_id),
    email: text(data.email),
    phone: text(data.phone),
    address: text(data.address),
    academicYear: text(data.academic_year) || undefined,
    status: text(data.status) || undefined,
  };
}

export function studentToSurvey(student: StudentInput & { academicYear?: string; status?: string }): Record<string, unknown> {
  return {
    first_name: student.firstName,
    last_name: student.lastName,
    date_of_birth: student.dateOfBirth,
    student_number: student.studentNumber,
    programme_id: student.programmeId,
    department_id: student.departmentId,
    email: student.email,
    phone: student.phone,
    address: student.address,
    academic_year: student.academicYear ?? '',
    status: student.status ?? '',
  };
}

export function courseRegistrationFromSurvey(data: Record<string, unknown>): CourseRegistrationInput {
  return {
    studentNumber: text(data.student_number),
    courseCode: text(data.course_code),
    enrollmentType: text(data.enrollment_type),
    notes: text(data.notes),
    prerequisiteConfirmation: checked(data.prerequisite_confirmation),
  };
}

export function courseFromSurvey(data: Record<string, unknown>): CourseInput {
  const prerequisites = Array.isArray(data.prerequisites) ? data.prerequisites.map((item) => text(item)).filter(Boolean) : [];
  return {
    courseCode: text(data.course_code).toUpperCase(),
    name: text(data.name),
    description: text(data.description),
    departmentId: text(data.department_id),
    semester: text(data.semester),
    credits: Number(data.credits),
    instructor: text(data.instructor),
    capacity: Number(data.capacity),
    status: text(data.status).toLowerCase() === 'inactive' ? 'inactive' : 'active',
    prerequisites,
  };
}

export function eventRegistrationFromSurvey(data: Record<string, unknown>): EventRegistrationInput {
  return {
    studentNumber: text(data.student_number),
    areaOfInterest: text(data.area_of_interest),
    notes: text(data.notes),
  };
}

export function eventFromSurvey(data: Record<string, unknown>): EventInput {
  const status = text(data.status).toLowerCase();
  return {
    name: text(data.name),
    category: text(data.category),
    description: text(data.description),
    eventDate: text(data.event_date),
    location: text(data.location),
    capacity: Number(data.capacity),
    status: status === 'cancelled' ? 'cancelled' : 'open',
  };
}

export function advisingFromSurvey(data: Record<string, unknown>): AdvisingInput {
  return {
    meetingDate: text(data.meeting_date),
    advisorId: text(data.advisor_id),
    topic: text(data.topic),
    notes: text(data.notes),
    followUpDate: text(data.follow_up_date),
  };
}

export function supportFromSurvey(data: Record<string, unknown>): SupportInput {
  return {
    requestType: text(data.request_type),
    description: text(data.description),
    priority: text(data.priority),
    supportingInformation: text(data.supporting_information),
  };
}

export function supportUpdateFromSurvey(data: Record<string, unknown>): SupportUpdateInput {
  return {
    status: text(data.status),
    assignedTo: text(data.assigned_to),
  };
}

export interface Submission<T> {
  record: T;
  response: Record<string, unknown>;
  formVersionId?: string;
}

export function submission<T>(record: T, response: Record<string, unknown>, formVersionId?: string): Submission<T> {
  return { record, response, formVersionId };
}
