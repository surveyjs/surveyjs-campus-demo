import { AuthUser } from '../types/auth';

export const DEMO_PASSWORD = 'demo1234';
export const ACADEMIC_YEAR = '2025/26';

export interface SeedUser extends AuthUser {
  seq: number;
}

export const INITIAL_DEPARTMENTS = [
  {
    id: 'dept-cs',
    name: 'School of Computer Science',
    description: 'Undergraduate computing programmes and taught modules.',
  },
  {
    id: 'dept-eng',
    name: 'School of Engineering',
    description: 'Mechanical and design engineering programmes.',
  },
];

export const INITIAL_PROGRAMMES = [
  {
    id: 'prog-cs',
    name: 'BSc Computer Science',
    departmentId: 'dept-cs',
    description: 'Three-year computing degree.',
  },
  {
    id: 'prog-se',
    name: 'BSc Software Engineering',
    departmentId: 'dept-cs',
    description: 'Three-year software engineering degree.',
  },
  {
    id: 'prog-me',
    name: 'BEng Mechanical Engineering',
    departmentId: 'dept-eng',
    description: 'Three-year mechanical engineering degree.',
  },
];

export const INITIAL_STUDENTS = [
  {
    id: 'stu-emma',
    studentNumber: 'STU-1002',
    firstName: 'Emma',
    lastName: 'Thompson',
    dateOfBirth: '2004-04-12',
    email: 'emma.thompson@acme.edu',
    phone: '07700 900112',
    address: '14 Library Lane, Acme',
    programmeId: 'prog-cs',
    departmentId: 'dept-cs',
    academicYear: ACADEMIC_YEAR,
    status: 'Enrolled',
  },
  {
    id: 'stu-liam',
    studentNumber: 'STU-1077',
    firstName: 'Liam',
    lastName: 'Thompson',
    dateOfBirth: '2005-01-19',
    email: 'liam.thompson@acme.edu',
    phone: '07700 900113',
    address: '8 Hall Road, Acme',
    programmeId: 'prog-cs',
    departmentId: 'dept-cs',
    academicYear: ACADEMIC_YEAR,
    status: 'Enrolled',
  },
  {
    id: 'stu-priya',
    studentNumber: 'STU-1108',
    firstName: 'Priya',
    lastName: 'Shah',
    dateOfBirth: '2003-11-02',
    email: 'priya.shah@acme.edu',
    phone: '07700 900114',
    address: '3 West Court, Acme',
    programmeId: 'prog-se',
    departmentId: 'dept-cs',
    academicYear: ACADEMIC_YEAR,
    status: 'Enrolled',
  },
  {
    id: 'stu-daniel',
    studentNumber: 'STU-1044',
    firstName: 'Daniel',
    lastName: 'Okonkwo',
    dateOfBirth: '2004-08-30',
    email: 'daniel.okonkwo@acme.edu',
    phone: '07700 900115',
    address: '21 North Quad, Acme',
    programmeId: 'prog-cs',
    departmentId: 'dept-cs',
    academicYear: ACADEMIC_YEAR,
    status: 'Enrolled',
  },
  {
    id: 'stu-noah',
    studentNumber: 'STU-1201',
    firstName: 'Noah',
    lastName: 'Bennett',
    dateOfBirth: '2002-06-15',
    email: 'noah.bennett@acme.edu',
    phone: '',
    address: '6 Garden Walk, Acme',
    programmeId: 'prog-cs',
    departmentId: 'dept-cs',
    academicYear: ACADEMIC_YEAR,
    status: 'On Leave',
  },
  {
    id: 'stu-maya',
    studentNumber: 'STU-1150',
    firstName: 'Maya',
    lastName: 'Chen',
    dateOfBirth: '2004-02-28',
    email: 'maya.chen@acme.edu',
    phone: '07700 900116',
    address: '19 Bridge Street, Acme',
    programmeId: 'prog-me',
    departmentId: 'dept-eng',
    academicYear: ACADEMIC_YEAR,
    status: 'Enrolled',
  },
];

export const INITIAL_COURSES = [
  {
    id: 'course-comp1001',
    courseCode: 'COMP1001',
    name: 'Introduction to AI',
    description: 'Foundations of search, learning, and responsible use of AI systems.',
    departmentId: 'dept-cs',
    semester: 'Semester 1',
    credits: 15,
    instructor: 'Dr Helen Marsh',
    capacity: 40,
    status: 'active',
  },
  {
    id: 'course-comp2003',
    courseCode: 'COMP2003',
    name: 'Database Systems',
    description: 'Relational modelling, SQL, and transaction design.',
    departmentId: 'dept-cs',
    semester: 'Semester 1',
    credits: 15,
    instructor: 'Dr Owen Blake',
    capacity: 30,
    status: 'active',
  },
  {
    id: 'course-comp2010',
    courseCode: 'COMP2010',
    name: 'Human-Computer Interaction',
    description: 'User research, prototyping, and interface evaluation.',
    departmentId: 'dept-cs',
    semester: 'Semester 2',
    credits: 15,
    instructor: 'Dr Priya Nair',
    capacity: 35,
    status: 'active',
  },
  {
    id: 'course-comp3015',
    courseCode: 'COMP3015',
    name: 'Cybersecurity Fundamentals',
    description: 'Threats, controls, and secure system design.',
    departmentId: 'dept-cs',
    semester: 'Semester 2',
    credits: 15,
    instructor: 'Dr Samuel Adeyemi',
    capacity: 25,
    status: 'active',
  },
  {
    id: 'course-sem0001',
    courseCode: 'SEM0001',
    name: 'Campus Skills Workshop',
    description: 'A one-place seminar used to show a full course.',
    departmentId: 'dept-cs',
    semester: 'Semester 1',
    credits: 0,
    instructor: 'Student Services',
    capacity: 1,
    status: 'active',
  },
];

export const INITIAL_PREREQUISITES = [
  { courseCode: 'COMP2003', prerequisiteCode: 'COMP1001' },
  { courseCode: 'COMP2010', prerequisiteCode: 'COMP1001' },
  { courseCode: 'COMP3015', prerequisiteCode: 'COMP2003' },
];

export const INITIAL_COURSE_REGISTRATIONS = [
  { id: 'cr-emma-1001', studentId: 'stu-emma', courseId: 'course-comp1001', enrollmentType: 'Standard', notes: '' },
  { id: 'cr-liam-1001', studentId: 'stu-liam', courseId: 'course-comp1001', enrollmentType: 'Standard', notes: '' },
  { id: 'cr-liam-2003', studentId: 'stu-liam', courseId: 'course-comp2003', enrollmentType: 'Standard', notes: '' },
  { id: 'cr-daniel-1001', studentId: 'stu-daniel', courseId: 'course-comp1001', enrollmentType: 'Elective', notes: '' },
  { id: 'cr-daniel-sem', studentId: 'stu-daniel', courseId: 'course-sem0001', enrollmentType: 'Standard', notes: '' },
];

export const INITIAL_EVENTS = [
  {
    id: 'event-career',
    name: 'Career Fair 2026',
    category: 'Career & Employability',
    description: 'Meet employers and book short advisory conversations.',
    eventDate: '2026-03-10T10:00',
    location: 'Main Hall',
    capacity: 100,
    status: 'open',
    baselineRegistrations: 40,
  },
  {
    id: 'event-open-day',
    name: 'Open Day Welcome Session',
    category: 'Student Experience',
    description: 'A welcome briefing for visitors and current student hosts.',
    eventDate: '2026-04-18T09:30',
    location: 'Student Centre',
    capacity: 150,
    status: 'open',
    baselineRegistrations: 27,
  },
];

export const INITIAL_EVENT_REGISTRATIONS = [
  { id: 'er-emma-career', studentId: 'stu-emma', eventId: 'event-career', areaOfInterest: 'Careers', notes: '' },
  { id: 'er-liam-career', studentId: 'stu-liam', eventId: 'event-career', areaOfInterest: 'Careers', notes: '' },
  { id: 'er-priya-open', studentId: 'stu-priya', eventId: 'event-open-day', areaOfInterest: 'Student societies', notes: '' },
];

export const INITIAL_ADVISING = [
  {
    id: 'adv-emma-1',
    studentId: 'stu-emma',
    advisorId: 'user-james',
    meetingDate: '2026-01-15',
    topic: 'Semester planning',
    notes: 'Agreed to keep Introduction to AI and review electives in February.',
    followUpDate: '2026-02-12',
  },
  {
    id: 'adv-emma-2',
    studentId: 'stu-emma',
    advisorId: 'user-james',
    meetingDate: '2026-02-12',
    topic: 'Module choices',
    notes: 'Emma will take Database Systems after the prerequisite is complete.',
    followUpDate: '',
  },
];

export const INITIAL_SUPPORT = [
  {
    id: 'sup-emma-1',
    studentId: 'stu-emma',
    requestType: 'Academic Support',
    description: 'Request for a study-skills appointment before the database coursework.',
    priority: 'Normal',
    supportingInformation: '',
    assignedTo: 'user-amira',
    status: 'Open',
    createdAt: '2026-02-20T09:00:00.000Z',
    history: [{ status: 'Open', assignedTo: 'user-amira', createdAt: '2026-02-20T09:00:00.000Z' }],
  },
  {
    id: 'sup-emma-2',
    studentId: 'stu-emma',
    requestType: 'Financial Support',
    description: 'Question about the hardship fund for semester two.',
    priority: 'Low',
    supportingInformation: 'Application draft attached in the student file.',
    assignedTo: 'user-amira',
    status: 'Resolved',
    createdAt: '2026-01-08T11:00:00.000Z',
    history: [
      { status: 'Open', assignedTo: 'user-amira', createdAt: '2026-01-08T11:00:00.000Z' },
      { status: 'Resolved', assignedTo: 'user-amira', createdAt: '2026-01-20T15:00:00.000Z' },
    ],
  },
];

export const INITIAL_USERS: SeedUser[] = [
  { id: 'user-sophie', username: 'sophie.wilson', fullName: 'Sophie Wilson', role: 'administrator', seq: 1 },
  { id: 'user-james', username: 'james.patel', fullName: 'James Patel', role: 'academic', seq: 2 },
  { id: 'user-amira', username: 'amira.khan', fullName: 'Amira Khan', role: 'support', seq: 3 },
  { id: 'user-emma', username: 'emma.thompson', fullName: 'Emma Thompson', role: 'student', studentId: 'stu-emma', seq: 4 },
  { id: 'user-liam', username: 'liam.thompson', fullName: 'Liam Thompson', role: 'student', studentId: 'stu-liam', seq: 5 },
];

const ROLE_LABEL: Record<SeedUser['role'], string> = {
  administrator: 'Administrator',
  academic: 'Academic Staff',
  support: 'Student Support',
  student: 'Student',
};

export function rosterLabel(user: SeedUser): string {
  return `${user.fullName} — ${ROLE_LABEL[user.role]}`;
}
