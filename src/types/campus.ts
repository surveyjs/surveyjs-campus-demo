export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface Programme {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  description: string;
}

export interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  address: string;
  programmeId: string;
  programmeName: string;
  departmentId: string;
  departmentName: string;
  academicYear: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  studentNumber: string;
  programmeId: string;
  departmentId: string;
  email: string;
  phone: string;
  address: string;
  academicYear?: string;
  status?: string;
}

export interface CourseRegistration {
  id: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  semester: string;
  enrollmentType: string;
  status: string;
  registrationDate: string;
  notes: string;
}

export interface AdvisingMeeting {
  id: string;
  studentId: string;
  advisorId: string;
  advisorName: string;
  meetingDate: string;
  topic: string;
  notes: string;
  followUpDate: string;
}

export interface SupportEvent {
  id: string;
  status: string;
  assignedTo: string;
  assignedToName: string;
  createdAt: string;
}

export interface SupportRequest {
  id: string;
  studentId: string;
  requestType: string;
  description: string;
  priority: string;
  supportingInformation: string;
  assignedTo: string;
  assignedToName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  history: SupportEvent[];
}

export interface StudentProfile extends Student {
  courses: CourseRegistration[];
  advising: AdvisingMeeting[];
  supportRequests: SupportRequest[];
}

export interface CoursePrerequisite {
  courseCode: string;
  name: string;
}

export interface Course {
  id: string;
  courseCode: string;
  name: string;
  label: string;
  description: string;
  departmentId: string;
  departmentName: string;
  semester: string;
  credits: number;
  instructor: string;
  capacity: number;
  enrolled: number;
  availablePlaces: number;
  status: string;
  prerequisites: CoursePrerequisite[];
}

export interface CourseInput {
  courseCode: string;
  name: string;
  description: string;
  departmentId: string;
  semester: string;
  credits: number;
  instructor: string;
  capacity: number;
  status: string;
  prerequisites: string[];
}

export interface CourseRegistrationInput {
  studentNumber: string;
  courseCode: string;
  enrollmentType: string;
  notes: string;
  prerequisiteConfirmation: boolean;
}

export interface EventParticipant {
  id: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  areaOfInterest: string;
  notes: string;
  registrationDate: string;
  status: string;
}

export interface CampusEvent {
  id: string;
  name: string;
  category: string;
  description: string;
  eventDate: string;
  location: string;
  capacity: number;
  registeredCount: number;
  availablePlaces: number;
  status: string;
  registrationStatus: string;
  baselineRegistrations: number;
  participants: EventParticipant[];
}

export interface EventInput {
  name: string;
  category: string;
  description: string;
  eventDate: string;
  location: string;
  capacity: number;
  status: string;
}

export interface EventRegistrationInput {
  studentNumber: string;
  areaOfInterest: string;
  notes: string;
}

export interface AdvisingInput {
  meetingDate: string;
  advisorId: string;
  topic: string;
  notes: string;
  followUpDate: string;
}

export interface SupportInput {
  requestType: string;
  description: string;
  priority: string;
  supportingInformation: string;
}

export interface SupportUpdateInput {
  status: string;
  assignedTo: string;
}

export interface StaffMember {
  id: string;
  fullName: string;
  role: string;
  label: string;
}
